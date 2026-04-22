import React, { useState, useEffect } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Dashboard Data
  const [dashboard, setDashboard] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  });

  // Products
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: ''
  });

  // Orders
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load dashboard overview
      const dashData = await API.admin.dashboard();
      setDashboard(dashData);

      // Load products
      const prodData = await API.admin.products.list();
      setProducts(prodData.products || []);

      // Load orders
      const ordersData = await API.admin.orders.list();
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setMessage('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category || !productForm.stock) {
      setMessage('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await API.admin.products.create(productForm);
      setMessage('Product added successfully!');
      setProductForm({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: '',
        stock: ''
      });
      setShowProductForm(false);
      await loadDashboardData();
    } catch (error) {
      setMessage('Error adding product: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await API.admin.products.delete(id);
        setMessage('Product deleted successfully!');
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        setMessage('Error deleting product: ' + error.message);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.admin.orders.update(orderId, { status: newStatus });
      setMessage('Order status updated!');
      await loadDashboardData();
    } catch (error) {
      setMessage('Error updating order: ' + error.message);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>
      <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '32px' }}>
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(24,16,12,0.1)', marginBottom: '32px', flexWrap: 'wrap' }}>
        {['overview', 'products', 'orders'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--terra)' : 'none',
              color: activeTab === tab ? 'var(--dark)' : 'rgba(24,16,12,0.6)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize',
              transition: 'all var(--duration-base) var(--ease)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: 'var(--radius-md)',
          background: message.includes('Error') ? 'rgba(168,85,56,0.1)' : 'rgba(107,122,94,0.1)',
          color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: '32px' }}>
            <div style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--cream-d)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Total Orders</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>{dashboard.totalOrders || 0}</p>
            </div>
            <div style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--cream-d)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Total Revenue</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>â‚¹{(dashboard.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--cream-d)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Avg Order Value</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '600' }}>
                â‚¹{dashboard.totalOrders ? Math.round(dashboard.totalRevenue / dashboard.totalOrders).toLocaleString() : 0}
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Recent Orders</h2>
            <div style={{
              border: '1px solid rgba(24,16,12,0.1)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cream-d)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard.recentOrders || []).slice(0, 10).map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(24,16,12,0.05)' }}>
                      <td style={{ padding: '12px' }}>#{order.id}</td>
                      <td style={{ padding: '12px' }}>{order.customer_name || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>â‚¹{order.total?.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>
                        {/* BUG 23 FIX: use shipping_status */}
                        <Badge variant={(order.shipping_status || order.status) === 'delivered' ? 'success' : 'info'} size="sm">
                          {order.shipping_status || order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Products</h2>
            <Button
              variant="primary"
              onClick={() => setShowProductForm(!showProductForm)}
            >
              {showProductForm ? 'Cancel' : '+ Add Product'}
            </Button>
          </div>

          {showProductForm && (
            <form onSubmit={handleSaveProduct} style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--cream-d)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              <Input
                label="Product Name"
                name="name"
                value={productForm.name}
                onChange={handleProductChange}
                required
              />
              <Input
                label="Category"
                name="category"
                value={productForm.category}
                onChange={handleProductChange}
                required
              />
              <Input
                label="Price"
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleProductChange}
                required
              />
              <Input
                label="Original Price (Optional)"
                type="number"
                name="originalPrice"
                value={productForm.originalPrice}
                onChange={handleProductChange}
              />
              <Input
                label="Stock"
                type="number"
                name="stock"
                value={productForm.stock}
                onChange={handleProductChange}
                required
              />
              <div style={{ gridColumn: '1/-1' }}>
                <Input
                  label="Description"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductChange}
                />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '12px' }}>
                <Button variant="primary" disabled={isSaving}>
                  {isSaving ? 'Adding...' : 'Add Product'}
                </Button>
              </div>
            </form>
          )}

          {/* Products Table */}
          <div style={{
            border: '1px solid rgba(24,16,12,0.1)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream-d)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Stock</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(24,16,12,0.05)' }}>
                    <td style={{ padding: '12px' }}>{product.name}</td>
                    <td style={{ padding: '12px' }}>{product.category}</td>
                    <td style={{ padding: '12px' }}>â‚¹{product.price?.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      {/* BUG 4 FIX: backend returns stock_quantity not stock */}
                      <Badge variant={product.stock_quantity > 10 ? 'success' : 'warning'} size="sm">
                        {product.stock_quantity ?? 'N/A'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textDecoration: 'underline'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>All Orders</h2>
          <div style={{
            border: '1px solid rgba(24,16,12,0.1)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream-d)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(24,16,12,0.05)' }}>
                    <td style={{ padding: '12px' }}>#{order.id}</td>
                    <td style={{ padding: '12px' }}>{order.customer_name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>â‚¹{order.total?.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      {/* BUG 24 FIX: added missing statuses; use shipping_status not status */}
                      <select
                        value={order.shipping_status || order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid rgba(24,16,12,0.1)',
                          borderRadius: 'var(--radius-md)',
                          fontFamily: 'var(--font-sans)',
                          background: 'var(--cream)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out for delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="return initiated">Return Initiated</option>
                        <option value="returned">Returned</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <a href={`/order/${order.id}/tracking`} style={{ color: 'var(--terra)', textDecoration: 'none', fontSize: '13px' }}>
                        View â†’
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
