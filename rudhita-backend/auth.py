import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import models
import schemas
import utils
from database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Limiter instance — must match the one attached to the app in main.py
limiter = Limiter(key_func=get_remote_address)


def _generate_otp(db: Session, email: str) -> str:
    """
    Helper: delete any existing OTPs for this email, generate a new
    cryptographically secure 6-digit code, persist it, and return it.
    """
    # Purge stale OTPs so old codes can never be replayed
    db.query(models.OTP).filter(models.OTP.email == email).delete()

    otp_code = str(secrets.randbelow(900_000) + 100_000)   # cryptographically secure
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.add(models.OTP(email=email, otp_code=otp_code, expires_at=expiry))
    db.commit()
    return otp_code


# --- 1. USER REGISTRATION ---
@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
def register_user(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=utils.hash_password(user.password),
        phone=user.phone,
        is_verified=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    otp_code = _generate_otp(db, user.email)

    # MOCK EMAIL — replace with a real mailer (e.g. SendGrid) before production
    print("\n" + "=" * 40)
    print(f"📧 MOCK EMAIL TO: {user.email}")
    print(f"   Subject: Your Rudhita Verification Code")
    print(f"   Code: {otp_code}")
    print("=" * 40 + "\n")

    return new_user


# --- 2. OTP VERIFICATION ---
@router.post("/verify-otp")
@limiter.limit("10/hour")
def verify_otp(request: Request, otp_data: schemas.OTPVerify, db: Session = Depends(get_db)):
    record = db.query(models.OTP).filter(
        models.OTP.email == otp_data.email,
        models.OTP.otp_code == otp_data.otp,
    ).first()

    # Unified error — don't reveal whether the email or the code was wrong
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    if record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    user = db.query(models.User).filter(models.User.email == otp_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_verified = 1
    db.delete(record)
    db.commit()

    return {"status": "success", "message": "Account successfully verified!"}


# --- 3. RESEND OTP ---
@router.post("/resend-otp")
@limiter.limit("5/hour")
def resend_otp(request: Request, data: schemas.ResendOTP, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    # Always return 200 — don't reveal whether the email exists
    if not user or user.is_verified == 1:
        return {"status": "success", "message": "If this email is registered and unverified, a new code has been sent."}

    otp_code = _generate_otp(db, data.email)

    print("\n" + "=" * 40)
    print(f"📧 MOCK RESEND TO: {data.email}")
    print(f"   Code: {otp_code}")
    print("=" * 40 + "\n")

    return {"status": "success", "message": "If this email is registered and unverified, a new code has been sent."}


# --- 4. LOGIN ---
@router.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # OAuth2 strictly calls the field 'username' in the background form, 
    # but we will treat whatever they typed there as their email!
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    invalid = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid credentials.")

    if not user:
        raise invalid

    if not utils.verify_password(form_data.password, user.password_hash):
        raise invalid

    if user.is_verified == 0:
        raise invalid

    access_token = utils.create_access_token(data={"sub": user.email, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}