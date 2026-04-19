import { useState, useEffect } from "react";
import { fetchAPI } from "../utils/api";
import { Link } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      // Fetch the cart from the backend
      const data = await fetchAPI("/cart/");
      setCart(data);
    } catch (err) {
      setError(err.message || "Failed to load cart. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  // Load the cart as soon as the page opens
  useEffect(() => {
    loadCart();
  }, []);

  const handleRemove = async (itemId) => {
    try {
      await fetchAPI(`/cart/remove/${itemId}`, { method: "DELETE" });
      // Reload the cart to get the updated total and list
      loadCart();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <h3 style={{ padding: "2rem", textAlign: "center" }}>Loading your cart...</h3>;
  
  if (error) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h3 style={{ color: "red", marginBottom: "1rem" }}>{error}</h3>
        <Link to="/login"><button>Go to Login</button></Link>
      </div>
    );
  }

  // If the cart exists but has no items in the array
  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem" }}>Your cart is empty.</h2>
        <Link to="/"><button>Start Shopping</button></Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Your Shopping Cart</h2>
      
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="item-details">
              <h4>{item.product.name}</h4>
              <p style={{ color: "#666" }}>Quantity: {item.quantity}</p>
            </div>
            
            <div className="item-price">
              {/* Calculate total price for this specific item line */}
              <p>₹{item.product.price * item.quantity}</p> 
              <button onClick={() => handleRemove(item.id)} className="remove-btn">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        {/* Display the grand total dynamically calculated by the backend */}
        <h3>Total: ₹{cart.cart_total}</h3>
        <button className="checkout-btn" onClick={() => alert("Checkout coming soon!")}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}