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
limiter = Limiter(key_func=get_remote_address)


def _generate_otp(db: Session, email: str) -> str:
    db.query(models.OTP).filter(models.OTP.email == email).delete()
    otp_code = str(secrets.randbelow(900_000) + 100_000)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.add(models.OTP(email=email, otp_code=otp_code, expires_at=expiry))
    db.commit()
    return otp_code


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
def register_user(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    new_user = models.User(
        name=user.name, email=user.email,
        password_hash=utils.hash_password(user.password),
        phone=user.phone, is_verified=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    otp_code = _generate_otp(db, user.email)
    print("\n" + "=" * 40)
    print(f"📧 MOCK EMAIL TO: {user.email}")
    print(f"   Subject: Your Rudhita Verification Code")
    print(f"   Code: {otp_code}")
    print("=" * 40 + "\n")
    return new_user


@router.post("/verify-otp")
@limiter.limit("10/hour")
def verify_otp(request: Request, otp_data: schemas.OTPVerify, db: Session = Depends(get_db)):
    record = db.query(models.OTP).filter(
        models.OTP.email == otp_data.email,
        models.OTP.otp_code == otp_data.otp,
    ).first()
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


@router.post("/resend-otp")
@limiter.limit("5/hour")
def resend_otp(request: Request, data: schemas.ResendOTP, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or user.is_verified == 1:
        return {"status": "success", "message": "If this email is registered and unverified, a new code has been sent."}
    otp_code = _generate_otp(db, data.email)
    print("\n" + "=" * 40)
    print(f"📧 MOCK RESEND TO: {data.email}")
    print(f"   Code: {otp_code}")
    print("=" * 40 + "\n")
    return {"status": "success", "message": "If this email is registered and unverified, a new code has been sent."}


@router.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    invalid = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid credentials.")
    if not user or not utils.verify_password(form_data.password, user.password_hash):
        raise invalid
    if user.is_verified == 0:
        raise invalid
    access_token = utils.create_access_token(data={"sub": user.email, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(utils.get_current_user)):
    """Returns the currently logged-in user. Used by API.auth.me()."""
    return current_user


@router.post("/logout")
def logout():
    """Token-based auth is stateless — logout is handled client-side by removing the token."""
    return {"status": "success", "message": "Logged out successfully."}