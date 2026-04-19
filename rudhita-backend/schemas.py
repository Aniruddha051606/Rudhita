from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ═══════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class ResendOTP(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    is_verified: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


# ═══════════════════════════════════════════════════════════
# PRODUCT
# ═══════════════════════════════════════════════════════════

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    stock_quantity: int = 0
    weight_grams: int = 0
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    weight_grams: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    discount_percent: Optional[int] = None   # computed field

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
# CART
# ═══════════════════════════════════════════════════════════

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse] = []
    cart_total: float = 0.0

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
# ORDERS
# ═══════════════════════════════════════════════════════════

class OrderCreate(BaseModel):
    shipping_address: str

class OrderItemResponse(BaseModel):
    id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse

    class Config:
        from_attributes = True

class TrackingEventResponse(BaseModel):
    id: int
    status: str
    location: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    payment_status: str
    shipping_status: str
    razorpay_order_id: Optional[str] = None
    delhivery_waybill: Optional[str] = None
    shipping_address: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    tracking_events: List[TrackingEventResponse] = []

    class Config:
        from_attributes = True

class OrderSummaryResponse(BaseModel):
    """Lightweight version for list views — no items/tracking to keep payload small."""
    id: int
    total_amount: float
    payment_status: str
    shipping_status: str
    item_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
# ADMIN / SELLER DASHBOARD
# ═══════════════════════════════════════════════════════════

class OrderStatusUpdate(BaseModel):
    shipping_status: str
    location: Optional[str] = None
    description: Optional[str] = None

class PaymentStatusUpdate(BaseModel):
    payment_status: str
    razorpay_payment_id: Optional[str] = None
    delhivery_waybill: Optional[str] = None

class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    shipped_orders: int
    delivered_orders: int
    total_revenue: float
    total_products: int
    low_stock_products: int   # stock_quantity < 10
    total_users: int

class ProductStockAlert(BaseModel):
    id: int
    sku: str
    name: str
    stock_quantity: int

    class Config:
        from_attributes = True