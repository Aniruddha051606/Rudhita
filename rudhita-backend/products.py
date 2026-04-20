import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


def _build_response(p) -> schemas.ProductResponse:
    pr = schemas.ProductResponse.model_validate(p)
    if p.original_price and p.original_price > p.price:
        pr.discount_percent = int((1 - p.price / p.original_price) * 100)
    return pr


# ── 1. CREATE PRODUCT (admin only) ───────────────────────────────────────────
@router.post("/", response_model=schemas.ProductResponse, status_code=201)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")
    if db.query(models.Product).filter(models.Product.sku == product.sku).first():
        raise HTTPException(status_code=400, detail="A product with this SKU already exists.")
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    return _build_response(new_product)


# ── 2. CATALOG — returns {products: [...]} so frontend's data.products works ─
@router.get("/", response_model=schemas.ProductListResponse)
def get_products(
    skip: int = 0,
    limit: int = 40,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Product).filter(models.Product.is_active == True)
    if category:
        q = q.filter(models.Product.category == category)
    if search:
        q = q.filter(
            models.Product.name.ilike(f"%{search}%") |
            models.Product.description.ilike(f"%{search}%")
        )
    products = q.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()
    return schemas.ProductListResponse(products=[_build_response(p) for p in products])


# ── 3. FEATURED — must be BEFORE /{product_id} ───────────────────────────────
@router.get("/featured", response_model=List[schemas.ProductResponse])
def get_featured_products(limit: int = 8, db: Session = Depends(get_db)):
    products = (
        db.query(models.Product)
        .filter(models.Product.is_active == True)
        .order_by(
            (models.Product.original_price > models.Product.price).desc(),
            models.Product.created_at.desc(),
        )
        .limit(limit).all()
    )
    return [_build_response(p) for p in products]


# ── 4. SEARCH — alias for ?search= so api.js products.search() works ─────────
@router.get("/search", response_model=schemas.ProductListResponse)
def search_products(q: str = "", db: Session = Depends(get_db)):
    """GET /products/search?q=silk — used by API.products.search()"""
    products = (
        db.query(models.Product)
        .filter(
            models.Product.is_active == True,
            models.Product.name.ilike(f"%{q}%") |
            models.Product.description.ilike(f"%{q}%"),
        )
        .order_by(models.Product.created_at.desc())
        .limit(40).all()
    )
    return schemas.ProductListResponse(products=[_build_response(p) for p in products])


# ── 5. BY CATEGORY — alias for ?category= ────────────────────────────────────
@router.get("/category/{category}", response_model=schemas.ProductListResponse)
def get_by_category(category: str, db: Session = Depends(get_db)):
    """GET /products/category/Apparel — used by API.products.byCategory()"""
    products = (
        db.query(models.Product)
        .filter(models.Product.is_active == True, models.Product.category == category)
        .order_by(models.Product.created_at.desc())
        .all()
    )
    return schemas.ProductListResponse(products=[_build_response(p) for p in products])


# ── 6. SINGLE PRODUCT — must be LAST so it doesn't swallow named routes ──────
@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.id == product_id, models.Product.is_active == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return _build_response(product)