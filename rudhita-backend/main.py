import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import engine, get_db
import models
from auth import router as auth_router
from products import router as products_router
from cart import router as cart_router
from orders import router as orders_router
from admin import router as admin_router
from user import router as user_router          # ← NEW

# ── Auto-create all tables (safe to run on every startup) ─────────────────────
models.Base.metadata.create_all(bind=engine)

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Rudhita E-Commerce API",
    description="High-performance backend for Rudhita — clothing, jewellery & lifestyle.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:5500"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(user_router)                 # ← NEW

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    # Pings the DB — if this returns 200, everything is operational
    db.execute(text("SELECT 1"))
    return {
        "status": "online",
        "service": "Rudhita API v2.0",
        "db": "connected",
    }


# ── DB pool stats (useful for monitoring) ────────────────────────────────────
@app.get("/health/pool", tags=["Health"])
def pool_stats():
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }