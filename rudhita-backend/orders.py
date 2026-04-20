import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc
from typing import List

import models
import schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


def _get_razorpay():
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(status_code=503, detail="Payment gateway not configured.")
    return razorpay.Client(auth=(key_id, key_secret))


def _clear_cart(db: Session, user_id: int):
    cart = db.query(models.Cart).filter(models.Cart.user_id == user_id).first()
    if cart:
        db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
        db.commit()


def _format_address(addr: schemas.CheckoutAddress) -> str:
    return f"{addr.name}, {addr.phone}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}"


# ── 1. POST /orders/ — what CheckoutPage calls ───────────────────────────────
@router.post("/", response_model=dict, status_code=201)
def create_order_from_frontend(
    order_data: schemas.FrontendOrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Called by CheckoutPage via API.orders.create().
    Reads the cart, creates a Razorpay order, and saves everything to DB.
    """
    cart = (
        db.query(models.Cart)
        .options(joinedload(models.Cart.items).joinedload(models.CartItem.product))
        .filter(models.Cart.user_id == current_user.id)
        .first()
    )
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    total = 0.0
    for item in cart.items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{item.product.name}'."
            )
        total += item.product.price * item.quantity

    shipping_address = _format_address(order_data.address)

    rz = _get_razorpay()
    rz_order = rz.order.create({
        "amount": int(total * 100),
        "currency": "INR",
        "receipt": f"rudhita_user_{current_user.id}",
    })

    new_order = models.Order(
        user_id=current_user.id,
        total_amount=total,
        shipping_address=shipping_address,
        razorpay_order_id=rz_order["id"],
        payment_status="Pending",
        shipping_status="Pending",
    )
    db.add(new_order)
    db.flush()

    for item in cart.items:
        db.add(models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.product.price,
        ))
        item.product.stock_quantity -= item.quantity

    db.add(models.TrackingEvent(
        order_id=new_order.id,
        status="Order Placed",
        description="Your order has been received and is being processed.",
    ))
    db.commit()
    background_tasks.add_task(_clear_cart, db, current_user.id)

    return {
        "order_id": new_order.id,
        "razorpay_order_id": rz_order["id"],
        "amount": total,
        "currency": "INR",
        "key_id": os.getenv("RAZORPAY_KEY_ID"),
    }


# ── 2. POST /orders/checkout — legacy route kept for compatibility ────────────
@router.post("/checkout", response_model=dict, status_code=201)
def checkout(
    order_data: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cart = (
        db.query(models.Cart)
        .options(joinedload(models.Cart.items).joinedload(models.CartItem.product))
        .filter(models.Cart.user_id == current_user.id)
        .first()
    )
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")
    total = 0.0
    for item in cart.items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{item.product.name}'.")
        total += item.product.price * item.quantity
    rz = _get_razorpay()
    rz_order = rz.order.create({"amount": int(total * 100), "currency": "INR"})
    new_order = models.Order(
        user_id=current_user.id, total_amount=total,
        shipping_address=order_data.shipping_address,
        razorpay_order_id=rz_order["id"],
        payment_status="Pending", shipping_status="Pending",
    )
    db.add(new_order)
    db.flush()
    for item in cart.items:
        db.add(models.OrderItem(order_id=new_order.id, product_id=item.product_id,
                                quantity=item.quantity, price_at_purchase=item.product.price))
        item.product.stock_quantity -= item.quantity
    db.add(models.TrackingEvent(order_id=new_order.id, status="Order Placed",
                                description="Your order has been received."))
    db.commit()
    background_tasks.add_task(_clear_cart, db, current_user.id)
    return {"order_id": new_order.id, "razorpay_order_id": rz_order["id"],
            "amount": total, "currency": "INR", "key_id": os.getenv("RAZORPAY_KEY_ID")}


# ── 3. CONFIRM PAYMENT ────────────────────────────────────────────────────────
@router.post("/{order_id}/confirm-payment")
def confirm_payment(
    order_id: int,
    payload: schemas.PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id, models.Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.payment_status = payload.payment_status
    if payload.razorpay_payment_id:
        order.razorpay_payment_id = payload.razorpay_payment_id
    if payload.payment_status == "Paid":
        order.shipping_status = "Processing"
        db.add(models.TrackingEvent(order_id=order.id, status="Payment Confirmed",
                                    description="Payment received. Order being prepared."))
    db.commit()
    return {"status": "success", "message": f"Order #{order_id} payment updated."}


# ── 4. LIST MY ORDERS — returns {orders: [...]} so frontend's data.orders works
@router.get("/", response_model=schemas.OrderListResponse)
def list_my_orders(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    result = []
    for o in orders:
        item_count = db.query(sqlfunc.count(models.OrderItem.id)).filter(
            models.OrderItem.order_id == o.id
        ).scalar()
        result.append(schemas.OrderSummaryResponse(
            id=o.id, total_amount=o.total_amount,
            payment_status=o.payment_status, shipping_status=o.shipping_status,
            item_count=item_count, created_at=o.created_at,
        ))
    return schemas.OrderListResponse(orders=result)


# ── 5. ORDER DETAIL ───────────────────────────────────────────────────────────
@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
            joinedload(models.Order.tracking_events),
        )
        .filter(models.Order.id == order_id, models.Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


# ── 6. TRACK ORDER — used by OrderTrackingPage ────────────────────────────────
@router.get("/{order_id}/track", response_model=schemas.TrackingResponse)
def track_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """GET /orders/{id}/track — called by API.orders.track(id)"""
    order = db.query(models.Order).filter(
        models.Order.id == order_id, models.Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    events = (
        db.query(models.TrackingEvent)
        .filter(models.TrackingEvent.order_id == order_id)
        .order_by(models.TrackingEvent.created_at.asc())
        .all()
    )
    return schemas.TrackingResponse(
        order_id=order.id,
        shipping_status=order.shipping_status,
        waybill=order.delhivery_waybill,
        events=events,
    )


# ── 7. CANCEL ORDER ───────────────────────────────────────────────────────────
@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id, models.Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.shipping_status not in ("Pending", "Processing"):
        raise HTTPException(status_code=400,
                            detail=f"Cannot cancel an order that is '{order.shipping_status}'.")
    order.shipping_status = "Cancelled"
    order.payment_status = "Refund Initiated" if order.payment_status == "Paid" else "Cancelled"
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity
    db.add(models.TrackingEvent(order_id=order.id, status="Cancelled",
                                description="Order cancelled by customer."))
    db.commit()
    return {"status": "success", "message": "Order cancelled and stock restored."}