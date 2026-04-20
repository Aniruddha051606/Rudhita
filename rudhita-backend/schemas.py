from pydantic import BaseModel, EmailStr, Field, ConfigDict
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
    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None   # handled in the route, not stored directly

class Token(BaseModel):
    access_token: str
    token_type: str


# ═══════════════════════════════════════════════════════════
# ADDRESS  — field names match what the frontend sends
# ═══════════════════════════════════════════════════════════

class AddressCreate(BaseModel):
    # Frontend sends camelCase `isDefault`; populate_by_name lets us use either form
    model_config = ConfigDict(populate_by_name=True)
    name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str
    is_default: bool = Field(default=False, alias="isDefault")

class AddressUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = None
    phone: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_default: Optional[bool] = Field(default=None, alias="isDefault")

class AddressResponse(BaseModel):
    id: int
    name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str
    is_default: bool = Field(serialization_alias="isDefault")   # respond with isDefault so frontend can read a.isDefault
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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

class ProductAdminCreate(BaseModel):
    """Used by the admin form — SKU is auto-generated if not supplied."""
    name: str
    description: Optional[str] = None
    category: str
    price: float
    original_price: Optional[float] = Field(default=None, alias="originalPrice")
    stock_quantity: int = Field(default=0, alias="stock")
    weight_grams: int = 0
    image_url: Optional[str] = None
    sku: Optional[str] = None            # auto-generated if omitted
    model_config = ConfigDict(populate_by_name=True)

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
    discount_percent: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    """Wraps the product list — frontend reads `data.products`."""
    products: List[ProductResponse]


# ═══════════════════════════════════════════════════════════
# CART
# ═══════════════════════════════════════════════════════════

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    product_id: int
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    quantity: int
    product: ProductResponse
    model_config = ConfigDict(from_attributes=True)

class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse] = []
    cart_total: float = 0.0
    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════
# ORDERS
# ═══════════════════════════════════════════════════════════

class OrderCreate(BaseModel):
    """Used by the backend /orders/checkout route (reads from cart)."""
    shipping_address: str

class CheckoutAddress(BaseModel):
    """The address object the frontend sends in POST /orders/."""
    name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str

class FrontendOrderCreate(BaseModel):
    """Shape of what CheckoutPage sends to POST /orders/."""
    address: CheckoutAddress
    shipping_method: str = "standard"
    payment_method: str = "razorpay"
    total: Optional[float] = None   # frontend calculates this; backend recalculates from cart

class OrderItemResponse(BaseModel):
    id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse
    model_config = ConfigDict(from_attributes=True)

class TrackingEventResponse(BaseModel):
    id: int
    status: str
    location: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

class OrderSummaryResponse(BaseModel):
    id: int
    total_amount: float
    payment_status: str
    shipping_status: str
    item_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    """Frontend reads `data.orders`."""
    orders: List[OrderSummaryResponse]

class TrackingResponse(BaseModel):
    """Response for GET /orders/{id}/track"""
    order_id: int
    shipping_status: str
    waybill: Optional[str] = None
    events: List[TrackingEventResponse] = []


# ═══════════════════════════════════════════════════════════
# ADMIN / SELLER DASHBOARD
# ═══════════════════════════════════════════════════════════

class OrderStatusUpdate(BaseModel):
    shipping_status: str
    location: Optional[str] = None
    description: Optional[str] = None

class AdminOrderUpdate(BaseModel):
    """Frontend sends { status } to PUT /admin/orders/{id}."""
    status: str

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
    low_stock_products: int
    total_users: int

class AdminDashboardResponse(BaseModel):
    """camelCase shape the frontend reads."""
    totalOrders: int
    totalRevenue: float
    totalProducts: int
    recentOrders: list

class ProductStockAlert(BaseModel):
    id: int
    sku: str
    name: str
    stock_quantity: int
    model_config = ConfigDict(from_attributes=True)

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    is_verified: int
    is_admin: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)