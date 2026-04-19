from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc
from typing import List

import models
import schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin / Seller Dashboard"])


# ── Admin gate: only users with is_admin=True can access these routes ─────────
def require_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    return current_user


# ── 1. DASHBOARD STATS ────────────────────────────────────────────────────────
@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """
    Single endpoint that returns all KPIs for the seller dashboard.
    All counts done in SQL — no Python loops, maximum speed.
    """
    total_orders    = db.query(sqlfunc.count(models.Order.id)).scalar()
    pending_orders  = db.query(sqlfunc.count(models.Order.id)).filter(
        models.Order.shipping_status == "Pending"
    ).scalar()
    shipped_orders  = db.query(sqlfunc.count(models.Order.id)).filter(
        models.Order.shipping_status == "Shipped"
    ).scalar()
    delivered_orders = db.query(sqlfunc.count(models.Order.id)).filter(
        models.Order.shipping_status == "Delivered"
    ).scalar()
    total_revenue   = db.query(sqlfunc.coalesce(sqlfunc.sum(models.Order.total_amount), 0.0)).filter(
        models.Order.payment_status == "Paid"
    ).scalar()
    total_products  = db.query(sqlfunc.count(models.Product.id)).filter(
        models.Product.is_active == True
    ).scalar()
    low_stock       = db.query(sqlfunc.count(models.Product.id)).filter(
        models.Product.stock_quantity < 10,
        models.Product.is_active == True,
    ).scalar()
    total_users     = db.query(sqlfunc.count(models.User.id)).filter(
        models.User.is_verified == 1
    ).scalar()

    return schemas.DashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        shipped_orders=shipped_orders,
        delivered_orders=delivered_orders,
        total_revenue=float(total_revenue),
        total_products=total_products,
        low_stock_products=low_stock,
        total_users=total_users,
    )


# ── 2. ALL ORDERS (paginated, filterable) ────────────────────────────────────
@router.get("/orders", response_model=List[schemas.OrderResponse])
def list_all_orders(
    skip: int = 0,
    limit: int = 30,
    payment_status: str = None,
    shipping_status: str = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """
    Full order list for the admin panel with optional status filters.
    Eager-loads items + tracking in 2 queries to avoid N+1.
    """
    q = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
            joinedload(models.Order.tracking_events),
        )
        .order_by(models.Order.created_at.desc())
    )
    if payment_status:
        q = q.filter(models.Order.payment_status == payment_status)
    if shipping_status:
        q = q.filter(models.Order.shipping_status == shipping_status)

    return q.offset(skip).limit(limit).all()


# ── 3. UPDATE ORDER STATUS + APPEND TRACKING EVENT ───────────────────────────
@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """
    Changes the shipping status and appends a new event to the tracking timeline.
    Valid transitions: Pending → Processing → Shipped → Out for Delivery → Delivered
                                                       └→ Cancelled
    """
    valid_statuses = {
        "Pending", "Processing", "Shipped",
        "Out for Delivery", "Delivered", "Cancelled", "Return Initiated", "Returned"
    }
    if update.shipping_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}"
        )

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.shipping_status = update.shipping_status

    db.add(models.TrackingEvent(
        order_id=order.id,
        status=update.shipping_status,
        location=update.location,
        description=update.description,
    ))
    db.commit()
    return {
        "status": "success",
        "message": f"Order #{order_id} updated to '{update.shipping_status}'.",
    }


# ── 4. ADD WAYBILL (after Delhivery pickup) ───────────────────────────────────
@router.patch("/orders/{order_id}/waybill")
def set_waybill(
    order_id: int,
    waybill: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.delhivery_waybill = waybill
    order.shipping_status = "Shipped"
    db.add(models.TrackingEvent(
        order_id=order.id,
        status="Shipped",
        description=f"Dispatched via Delhivery. Waybill: {waybill}",
    ))
    db.commit()
    return {"status": "success", "waybill": waybill}


# ── 5. PRODUCT MANAGEMENT ─────────────────────────────────────────────────────
@router.get("/products", response_model=List[schemas.ProductResponse])
def admin_list_products(
    skip: int = 0,
    limit: int = 50,
    category: str = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Full product list including inactive items (hidden from public catalog)."""
    q = db.query(models.Product)
    if category:
        q = q.filter(models.Product.category == category)
    if low_stock_only:
        q = q.filter(models.Product.stock_quantity < 10)
    products = q.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for p in products:
        pr = schemas.ProductResponse.model_validate(p)
        if p.original_price and p.original_price > p.price:
            pr.discount_percent = int((1 - p.price / p.original_price) * 100)
        result.append(pr)
    return result


@router.patch("/products/{product_id}", response_model=schemas.ProductResponse)
def admin_update_product(
    product_id: int,
    update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    pr = schemas.ProductResponse.model_validate(product)
    if product.original_price and product.original_price > product.price:
        pr.discount_percent = int((1 - product.price / product.original_price) * 100)
    return pr


@router.delete("/products/{product_id}")
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    # Soft delete — keeps order history intact
    product.is_active = False
    db.commit()
    return {"status": "success", "message": f"Product '{product.name}' deactivated."}


# ── 6. LOW STOCK ALERTS ───────────────────────────────────────────────────────
@router.get("/alerts/low-stock", response_model=List[schemas.ProductStockAlert])
def low_stock_alerts(
    threshold: int = 10,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return (
        db.query(models.Product)
        .filter(models.Product.stock_quantity <= threshold, models.Product.is_active == True)
        .order_by(models.Product.stock_quantity.asc())
        .all()
    )


# ── 7. MAKE USER AN ADMIN ─────────────────────────────────────────────────────
@router.patch("/users/{user_id}/make-admin")
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin status.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = True
    db.commit()
    return {"status": "success", "message": f"{user.name} is now an admin."}