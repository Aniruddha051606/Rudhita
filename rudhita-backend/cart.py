from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from utils import get_current_user

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

# --- Helper Function: Get or Create Cart ---
def get_user_cart(db: Session, user_id: int):
    cart = db.query(models.Cart).filter(models.Cart.user_id == user_id).first()
    if not cart:
        cart = models.Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


# --- 1. VIEW CART ---
@router.get("/", response_model=schemas.CartResponse)
def view_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = get_user_cart(db, current_user.id)
    
    # Dynamically calculate the total price of everything in the cart
    total = sum([item.product.price * item.quantity for item in cart.items])
    
    # Attach the calculated total before sending it to the frontend
    cart_response = schemas.CartResponse.model_validate(cart)
    cart_response.cart_total = total
    
    return cart_response


# --- 2. ADD ITEM TO CART ---
@router.post("/add", response_model=schemas.CartResponse)
def add_to_cart(
    item_data: schemas.CartItemAdd, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 1. Verify the product exists and has enough stock
    product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product.stock_quantity < item_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available.")

    cart = get_user_cart(db, current_user.id)

    # 2. Check if the item is already in the cart. If so, just increase the quantity.
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id, 
        models.CartItem.product_id == item_data.product_id
    ).first()

    if existing_item:
        existing_item.quantity += item_data.quantity
    else:
        new_item = models.CartItem(cart_id=cart.id, product_id=item_data.product_id, quantity=item_data.quantity)
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    
    return view_cart(db, current_user) # Re-use the view function to return the updated total!


# --- 3. REMOVE ITEM FROM CART ---
@router.delete("/remove/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = get_user_cart(db, current_user.id)
    
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id, 
        models.CartItem.cart_id == cart.id # Ensure they only delete from their own cart!
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in your cart.")
        
    db.delete(item)
    db.commit()
    
    return {"status": "success", "message": "Item removed from cart."}