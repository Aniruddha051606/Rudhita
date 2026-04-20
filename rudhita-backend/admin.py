import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc
from typing import List, Optional

import models
import schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin / Seller Dashboard"])


def require_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


# ── 1. DASHBOARD — returns camelCase so frontend's dashboard.totalOrders works ─
@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """GET /admin/dashboard — called by API.admin.dashboard()"""
    total_orders   = db.query(sqlfunc.count(models.Order.id)).scalar()
    total_revenue  = db.query(sqlfunc.coalesce(sqlfunc.sum(models.Order.total_amount), 0.0)).filter(
        models.Order.payment_status == "Paid"
    ).scalar()
    total_products = db.query(sqlfunc.count(models.Product.id)).filter(models.Product.is_active == True).scalar()

    recent_orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.owner))
        .order_by(models.Order.created_at.desc())
        .limit(10).all()
    )

    return {
        "totalOrders": total_orders,
        "totalRevenue": float(total_revenue),
        "totalProducts": total_products,
        "recentOrders": [
            {
                "id": o.id,
                "customer_name": o.owner.name if o.owner else "N/A",
                "total": o.total_amount,
                "status": o.shipping_status.lower(),
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders
        ],
    }


# ── 2. STATS (original endpoint kept) ────────────────────────────────────────
@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    return schemas.DashboardStats(
        total_orders=db.query(sqlfunc.count(models.Order.id)).scalar(),
        pending_orders=db.query(sqlfunc.count(models.Order.id)).filter(models.Order.shipping_status == "Pending").scalar(),
        shipped_orders=db.query(sqlfunc.count(models.Order.id)).filter(models.Order.shipping_status == "Shipped").scalar(),
        delivered_orders=db.query(sqlfunc.count(models.Order.id)).filter(models.Order.shipping_status == "Delivered").scalar(),
        total_revenue=float(db.query(sqlfunc.coalesce(sqlfunc.sum(models.Order.total_amount), 0.0)).filter(models.Order.payment_status == "Paid").scalar()),
        total_products=db.query(sqlfunc.count(models.Product.id)).filter(models.Product.is_active == True).scalar(),
        low_stock_products=db.query(sqlfunc.count(models.Product.id)).filter(models.Product.stock_quantity < 10, models.Product.is_active == True).scalar(),
        total_users=db.query(sqlfunc.count(models.User.id)).filter(models.User.is_verified == 1).scalar(),
    )


# ── 3. PRODUCTS ───────────────────────────────────────────────────────────────

@router.get("/products")
def admin_list_products(
    skip: int = 0, limit: int = 50,
    category: str = None, low_stock_only: bool = False,
    db: Session = Depends(get_db), _: models.User = Depends(require_admin),
):
    """Returns {products: [...]} — frontend reads prodData.products"""
    q = db.query(models.Product)
    if category:
        q = q.filter(models.Product.category == category)
    if low_stock_only:
        q = q.filter(models.Product.stock_quantity < 10)
    products = q.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()

    def _resp(p):
        pr = schemas.ProductResponse.model_validate(p)
        if p.original_price and p.original_price > p.price:
            pr.discount_percent = int((1 - p.price / p.original_price) * 100)
        return pr

    return {"products": [_resp(p) for p in products]}


@router.post("/products", response_model=schemas.ProductResponse, status_code=201)
def admin_create_product(
    data: schemas.ProductAdminCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """POST /admin/products — called by admin form (no SKU field, auto-generated)."""
    sku = data.sku or f"RUD-{uuid.uuid4().hex[:8].upper()}"
    if db.query(models.Product).filter(models.Product.sku == sku).first():
        sku = f"RUD-{uuid.uuid4().hex[:8].upper()}"
    product = models.Product(
        sku=sku, name=data.name, description=data.description,
        category=data.category, price=data.price,
        original_price=data.original_price,
        stock_quantity=data.stock_quantity, weight_grams=data.weight_grams,
        image_url=data.image_url,
    )
    db.add(product)
    db.commit()
    pr = schemas.ProductResponse.model_validate(product)
    if product.original_price and product.original_price > product.price:
        pr.discount_percent = int((1 - product.price / product.original_price) * 100)
    return pr


@router.put("/products/{product_id}", response_model=schemas.ProductResponse)
@router.patch("/products/{product_id}", response_model=schemas.ProductResponse)
def admin_update_product(
    product_id: int,
    update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Accepts both PUT and PATCH — frontend uses PUT."""
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
    product.is_active = False   # soft delete
    db.commit()
    return {"status": "success", "message": f"Product '{product.name}' deactivated."}


# ── 4. ORDERS ─────────────────────────────────────────────────────────────────

@router.get("/orders")
def admin_list_orders(
    skip: int = 0, limit: int = 30,
    payment_status: str = None, shipping_status: str = None,
    db: Session = Depends(get_db), _: models.User = Depends(require_admin),
):
    """Returns {orders: [...]} — frontend reads ordersData.orders"""
    q = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
            joinedload(models.Order.tracking_events),
            joinedload(models.Order.owner),
        )
        .order_by(models.Order.created_at.desc())
    )
    if payment_status:
        q = q.filter(models.Order.payment_status == payment_status)
    if shipping_status:
        q = q.filter(models.Order.shipping_status == shipping_status)
    orders = q.offset(skip).limit(limit).all()

    return {
        "orders": [
            {
                "id": o.id,
                "customer_name": o.owner.name if o.owner else "N/A",
                "total": o.total_amount,
                "status": o.shipping_status.lower(),
                "payment_status": o.payment_status,
                "created_at": o.created_at.isoformat(),
            }
            for o in orders
        ]
    }


@router.put("/orders/{order_id}")
@router.patch("/orders/{order_id}/status")
def admin_update_order(
    order_id: int,
    update: schemas.AdminOrderUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """
    Accepts both:
      PUT /admin/orders/{id}  with body { status }   ← frontend sends this
      PATCH /admin/orders/{id}/status                ← original route kept
    """
    valid = {"Pending","Processing","Shipped","Out for Delivery","Delivered","Cancelled","Return Initiated","Returned"}
    # normalise: frontend sends lowercase
    normalised = update.status.title()
    if normalised not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose: {', '.join(sorted(valid))}")
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.shipping_status = normalised
    db.add(models.TrackingEvent(order_id=order.id, status=normalised))
    db.commit()
    return {"status": "success", "message": f"Order #{order_id} updated to '{normalised}'."}


@router.patch("/orders/{order_id}/waybill")
def set_waybill(order_id: int, waybill: str, db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.delhivery_waybill = waybill
    order.shipping_status = "Shipped"
    db.add(models.TrackingEvent(order_id=order.id, status="Shipped",
                                description=f"Dispatched via Delhivery. Waybill: {waybill}"))
    db.commit()
    return {"status": "success", "waybill": waybill}


# ── 5. USERS ──────────────────────────────────────────────────────────────────

@router.get("/users")
def admin_list_users(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """GET /admin/users — called by API.admin.users.list()"""
    users = db.query(models.User).order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "users": [
            {
                "id": u.id, "name": u.name, "email": u.email,
                "phone": u.phone, "is_verified": u.is_verified,
                "is_admin": u.is_admin,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.post("/users/{user_id}/admin")
@router.patch("/users/{user_id}/make-admin")
def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """
    Accepts both:
      POST  /admin/users/{id}/admin      ← frontend (API.admin.users.makeAdmin)
      PATCH /admin/users/{id}/make-admin ← original
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin status.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = True
    db.commit()
    return {"status": "success", "message": f"{user.name} is now an admin."}


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