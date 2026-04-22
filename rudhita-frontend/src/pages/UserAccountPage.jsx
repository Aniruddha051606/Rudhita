import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function UserAccountPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Profile Data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  // Orders
  const [orders, setOrders] = useState([]);

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Load profile
      const profileData = await API.user.getProfile();
      setProfile(profileData);

      // Load addresses
      const addressesData = await API.user.getAddresses();
      setAddresses(addressesData.addresses || []);

      // Load orders
      const ordersData = await API.orders.list();
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage('Error loading account information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // BUG 21 FIX: only send name & phone — backend ignores email silently, causing confusing UX
      await API.user.updateProfile({
        name: profile.name,
        phone: profile.phone,
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingAddressId) {
        await API.user.updateAddress(editingAddressId, addressForm);
        setMessage('Address updated successfully!');
      } else {
        await API.user.addAddress(addressForm);
        setMessage('Address added successfully!');
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      await loadUserData();
    } catch (error) {
      setMessage('Error saving address: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await API.user.deleteAddress(id);
        setAddresses(addresses.filter(a => a.id !== id));
        setMessage('Address deleted successfully!');
      } catch (error) {
        setMessage('Error deleting address: ' + error.message);
      }
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm(address);
    setEditingAddressId(address.id);
    setShowAddressForm(true);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    // BUG 22 FIX: backend enforces min_length=8, not 6
    if (passwordForm.newPassword.length < 8) {
      setMessage('New password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      // BUG 31 FIX: send current_password so backend can verify before allowing change
      await API.user.updateProfile({
        current_password: passwordForm.currentPassword,
        password: passwordForm.newPassword,
      });
      setMessage('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage('Error changing password: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const getOrderStatus = (status) => {
    const statusMap = {
      pending: 'warning',
      processing: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error'
    };
    return statusMap[status] || 'info';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>
      <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '32px' }}>
        My Account
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(24,16,12,0.1)', marginBottom: '32px', flexWrap: 'wrap' }}>
        {['profile', 'addresses', 'orders', 'settings'].map(tab => (
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Profile Information</h2>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <Input
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
            />
            <div style={{ padding: '12px 0', fontSize: '14px', opacity: '0.7' }}>
              <strong>Email:</strong> {profile.email}
              <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--terra)' }}>(cannot be changed)</span>
            </div>
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
            />
            <Button variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Saved Addresses</h2>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddressForm(!showAddressForm);
                setEditingAddressId(null);
                setAddressForm({
                  name: '',
                  phone: '',
                  street: '',
                  city: '',
                  state: '',
                  pincode: '',
                  isDefault: false
                });
              }}
            >
              {showAddressForm ? 'Cancel' : '+ Add Address'}
            </Button>
          </div>

          {showAddressForm && (
            <div style={{
              background: 'var(--cream-d)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <Input
                  label="Address Name (Home, Office, etc.)"
                  name="name"
                  value={addressForm.name}
                  onChange={handleAddressChange}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleAddressChange}
                  required
                />
                <Input
                  label="Street Address"
                  name="street"
                  value={addressForm.street}
                  onChange={handleAddressChange}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                  <Input
                    label="City"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    required
                  />
                  <Input
                    label="State"
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <Input
                  label="Pincode"
                  name="pincode"
                  value={addressForm.pincode}
                  onChange={handleAddressChange}
                  required
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                  />
                  <span>Set as default address</span>
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Address'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {addresses.map(address => (
              <div
                key={address.id}
                style={{
                  padding: 'var(--spacing-lg)',
                  border: '1px solid rgba(24,16,12,0.1)',
                  borderRadius: 'var(--radius-lg)',
                  position: 'relative'
                }}
              >
                {address.isDefault && (
                  <Badge variant="success" size="sm" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    Default
                  </Badge>
                )}
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>
                  {address.name}
                </h3>
                <p style={{ margin: '0 0 4px', fontSize: '14px', opacity: '0.8' }}>
                  {address.street}, {address.city}, {address.state} {address.pincode}
                </p>
                <p style={{ margin: '0 0 12px', fontSize: '13px', opacity: '0.6' }}>
                  {address.phone}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleEditAddress(address)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--terra)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textDecoration: 'underline'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Order History</h2>
          {orders.length === 0 ? (
            <p style={{ opacity: '0.6', textAlign: 'center', padding: '40px 20px' }}>
              No orders yet. <Link to="/products" style={{ color: 'var(--terra)' }}>Start shopping</Link>
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  style={{
                    padding: 'var(--spacing-lg)',
                    border: '1px solid rgba(24,16,12,0.1)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 'var(--spacing-lg)',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ minWidth: '200px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6' }}>Order ID</p>
                    <p style={{ margin: 0, fontWeight: '600' }}>#{order.id}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6' }}>Status</p>
                    {/* BUG 23 FIX: shipping_status not status */}
                    <Badge variant={getOrderStatus(order.shipping_status || order.status)} size="sm">
                      {order.shipping_status || order.status}
                    </Badge>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6' }}>Total</p>
                    {/* BUG 23 FIX: total_amount not total */}
                    <p style={{ margin: 0, fontWeight: '600' }}>₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}</p>
                    <Link
                      to={`/order/${order.id}/tracking`}
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--terra)',
                        textDecoration: 'none'
                      }}
                    >
                      View Details â†’
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Change Password</h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="New Password"
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
            <Button variant="primary" disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Change Password'}
            </Button>
          </form>

          <hr style={{ margin: 'var(--spacing-2xl) 0', border: 'none', borderTop: '1px solid rgba(24,16,12,0.1)' }} />

          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--error)' }}>Danger Zone</h3>
          <p style={{ fontSize: '14px', opacity: '0.6', marginBottom: '16px' }}>
            Once you delete your account, there is no going back.
          </p>
          <Button variant="outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
            Delete Account
          </Button>
        </div>
      )}
    </div>
  );
}

export default UserAccountPage;
