import { useState, useEffect } from "react";
import { fetchAPI } from "../utils/api";
import { useCart } from "../context/CartContext";

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

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

  const handleAddToCart = (productId) => {
    addItem(productId, 1);
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
