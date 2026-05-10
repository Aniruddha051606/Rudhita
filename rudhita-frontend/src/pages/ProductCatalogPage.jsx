import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Loader, LoadingSkeleton } from '../components/Loader';
import { API } from '../utils/api';
import { ProductErrorBoundary } from '../components/ErrorBoundary';
import './Pages.css';

export function ProductCatalogPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [products, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await API.products.list();
      setProducts(data.products || []);

      // Extract unique categories
      const uniqueCategories = [...new Set(data.products?.map(p => p.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange) {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      filtered = filtered.filter(p => p.price >= min && (max ? p.price <= max : true));
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  // BUG 20 FIX: was a console.log TODO â€” now calls API.cart.add
  const handleAddToCart = async (productId) => {
    try {
      await API.cart.add(productId, 1);
      alert('Added to cart!');
    } catch (error) {
      alert(error.message || 'Please log in to add items to cart.');
    }
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1 className="sec-title">Our <em>Collection</em></h1>
        <p style={{ color: 'rgba(24,16,12,0.6)', marginTop: '12px' }}>
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="search"
        />
      </div>

      {/* Filters and Sort Controls */}
      <div className="sort-controls">
        <div style={{ display: 'flex', gap: '16px', flexGrow: 1 }}>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">A to Z</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {/* Filters Sidebar */}
      <div className="catalog-filters">
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="category"
                value=""
                checked={selectedCategory === ''}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
              <span>All</span>
            </label>
            {categories.map(cat => (
              <label key={cat} className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={selectedCategory === cat}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Price Range</label>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="price"
                value=""
                checked={selectedPriceRange === ''}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
              />
              <span>All</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="price"
                value="0-499"
                checked={selectedPriceRange === '0-499'}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
              />
              <span>Ã¢â€šÂ¹0 - Ã¢â€šÂ¹499</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="price"
                value="500-999"
                checked={selectedPriceRange === '500-999'}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
              />
              <span>Ã¢â€šÂ¹500 - Ã¢â€šÂ¹999</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="price"
                value="1000-"
                checked={selectedPriceRange === '1000-'}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
              />
              <span>Ã¢â€šÂ¹1000+</span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        <LoadingSkeleton count={8} type="product" />
      ) : filteredProducts.length === 0 ? (
        <div className="catalog-empty">
          No products found. Try adjusting your filters.
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'prod-grid' : 'prod-list'}>
          {filteredProducts.map(product => (
            <ProductErrorBoundary key={product.id}>
              <ProductCard
                id={product.id}
                title={product.name}
                price={product.price}
                originalPrice={product.original_price}
                image={product.image_url}
                tag={product.category}
                onAddToCart={handleAddToCart}
              />
            </ProductErrorBoundary>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductCatalogPage;