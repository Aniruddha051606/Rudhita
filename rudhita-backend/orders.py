import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List

import models
import schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

# ── Razorpay client (lazy init so missing key doesn't crash startup) ──────────
def _get_razorpay():
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
        )
    return razorpay.Client(auth=(key_id, key_secret))


def _clear_cart(db: Session, user_id: int):
    """Background task: empty the cart after a successful order."""
    cart = db.query(models.Cart).filter(models.Cart.user_id == user_id).first()
    if cart:
        db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
        db.commit()


# ── 1. CHECKOUT — create order from cart ─────────────────────────────────────
@router.post("/checkout", response_model=dict, status_code=status.HTTP_201_CREATED)
def checkout(
    order_data: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Converts the user's cart into an Order.
    Returns a Razorpay order_id so the frontend can open the payment modal.
    """
    # 1. Load cart with items + products in a single query (no N+1)
    cart = (
        db.query(models.Cart)
        .options(joinedload(models.Cart.items).joinedload(models.CartItem.product))
        .filter(models.Cart.user_id == current_user.id)
        .first()
    )

    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    # 2. Verify stock and calculate total
    total = 0.0
    for item in cart.items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{item.product.name}'. "
                       f"Only {item.product.stock_quantity} left."
            )
        total += item.product.price * item.quantity

    # 3. Create Razorpay order (amount in paise)
    rz = _get_razorpay()
    rz_order = rz.order.create({
        "amount": int(total * 100),
        "currency": "INR",
        "receipt": f"rudhita_user_{current_user.id}",
    })

    # 4. Save Order + OrderItems to DB
    new_order = models.Order(
        user_id=current_user.id,
        total_amount=total,
        shipping_address=order_data.shipping_address,
        razorpay_order_id=rz_order["id"],
        payment_status="Pending",
        shipping_status="Pending",
    )
    db.add(new_order)
    db.flush()   # get the new_order.id without committing yet

    for item in cart.items:
        db.add(models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.product.price,
        ))
        # Deduct stock immediately (reserve it)
        item.product.stock_quantity -= item.quantity

    # First tracking event
    db.add(models.TrackingEvent(
        order_id=new_order.id,
        status="Order Placed",
        description="Your order has been received and is being processed.",
    ))

    db.commit()

    # Clear cart in the background so response is faster
    background_tasks.add_task(_clear_cart, db, current_user.id)

    return {
        "order_id": new_order.id,
        "razorpay_order_id": rz_order["id"],
        "amount": total,
        "currency": "INR",
        "key_id": os.getenv("RAZORPAY_KEY_ID"),
    }


# ── 2. CONFIRM PAYMENT — called after Razorpay success callback ───────────────
@router.post("/{order_id}/confirm-payment")
def confirm_payment(
    order_id: int,
    payload: schemas.PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.payment_status = payload.payment_status
    if payload.razorpay_payment_id:
        order.razorpay_payment_id = payload.razorpay_payment_id

    if payload.payment_status == "Paid":
        order.shipping_status = "Processing"
        db.add(models.TrackingEvent(
            order_id=order.id,
            status="Payment Confirmed",
            description="Payment received successfully. Your order is being prepared.",
        ))

    db.commit()
    return {"status": "success", "message": f"Order #{order_id} updated to {payload.payment_status}."}


# ── 3. LIST MY ORDERS ─────────────────────────────────────────────────────────
@router.get("/", response_model=List[schemas.OrderSummaryResponse])
def list_my_orders(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns a lightweight list of the user's orders (no line items — keeps it fast).
    Uses a subquery to count items without loading them.
    """
    from sqlalchemy import func as sqlfunc

    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for o in orders:
        item_count = db.query(sqlfunc.count(models.OrderItem.id)).filter(
            models.OrderItem.order_id == o.id
        ).scalar()
        result.append(schemas.OrderSummaryResponse(
            id=o.id,
            total_amount=o.total_amount,
            payment_status=o.payment_status,
            shipping_status=o.shipping_status,
            item_count=item_count,
            created_at=o.created_at,
        ))
    return result


# ── 4. ORDER DETAIL + FULL TRACKING TIMELINE ──────────────────────────────────
@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Full order detail with all line items and the complete tracking timeline.
    Uses eager loading to fetch everything in 2 SQL queries instead of N+1.
    """
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
            joinedload(models.Order.tracking_events),
        )
        .filter(
            models.Order.id == order_id,
            models.Order.user_id == current_user.id,
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


# ── 5. CANCEL ORDER (user-initiated) ─────────────────────────────────────────
@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Can only cancel before it ships
    if order.shipping_status not in ("Pending", "Processing"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel an order that is already '{order.shipping_status}'."
        )

    order.shipping_status = "Cancelled"
    order.payment_status = "Refund Initiated" if order.payment_status == "Paid" else "Cancelled"

    # Restore stock
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity

    db.add(models.TrackingEvent(
        order_id=order.id,
        status="Cancelled",
        description="Order cancelled by customer.",
    ))
    db.commit()
    return {"status": "success", "message": "Order cancelled and stock restored."}