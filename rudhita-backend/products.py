from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


# ── 1. ADD PRODUCT (admin only) ───────────────────────────────────────────────
@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

    existing = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="A product with this SKU already exists.")

    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()

    pr = schemas.ProductResponse.model_validate(new_product)
    if new_product.original_price and new_product.original_price > new_product.price:
        pr.discount_percent = int((1 - new_product.price / new_product.original_price) * 100)
    return pr


# ── 2. CATALOG — search + category filter ────────────────────────────────────
@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 40,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Public catalog endpoint. Supports:
    - ?category=Apparel
    - ?search=silk
    - ?skip=0&limit=40 for pagination
    """
    q = db.query(models.Product).filter(models.Product.is_active == True)

    if category:
        q = q.filter(models.Product.category == category)
    if search:
        q = q.filter(
            models.Product.name.ilike(f"%{search}%") |
            models.Product.description.ilike(f"%{search}%")
        )

    products = q.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for p in products:
        pr = schemas.ProductResponse.model_validate(p)
        if p.original_price and p.original_price > p.price:
            pr.discount_percent = int((1 - p.price / p.original_price) * 100)
        result.append(pr)
    return result


# ── 3. SINGLE PRODUCT ─────────────────────────────────────────────────────────
@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.is_active == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    pr = schemas.ProductResponse.model_validate(product)
    if product.original_price and product.original_price > product.price:
        pr.discount_percent = int((1 - product.price / product.original_price) * 100)
    return pr