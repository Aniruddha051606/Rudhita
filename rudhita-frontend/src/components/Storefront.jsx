import { useState, useEffect } from "react";
import { fetchAPI } from "../utils/api";

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await fetchAPI("/products/");
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to load catalog:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await fetchAPI("/cart/add", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      alert("Added to cart!");
    } catch (error) {
      alert(error.message || "Please log in to add items to your cart.");
    }
  };

  if (loading) return <h3 style={{ padding: '2rem' }}>Loading the Rudhita Collection...</h3>;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', flexGrow: 1 }}>{product.description}</p>
          <p className="price">â‚¹{product.price}</p>
          <button onClick={() => handleAddToCart(product.id)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
