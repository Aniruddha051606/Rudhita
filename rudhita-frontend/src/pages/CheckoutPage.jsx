import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState('');

  // Form States
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [shipping, setShipping] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      const data = await API.cart.get();
      setCartItems(data.items || []);

      // Load user's primary address if exists
      const addressesData = await API.user.getAddresses();
      if (addressesData.addresses?.length > 0) {
        const defaultAddress = addressesData.addresses.find(a => a.isDefault) || addressesData.addresses[0];
        setAddress({
          name: defaultAddress.name || '',
          phone: defaultAddress.phone || '',
          street: defaultAddress.street || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          pincode: defaultAddress.pincode || ''
        });
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      setMessage('Error loading checkout information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const validateAddress = () => {
    if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      setMessage('Please fill in all address fields');
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      setMessage('Invalid pincode format');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    setIsProcessing(true);
    try {
      // Create order
      const orderData = await API.orders.create({
        items: cartItems,
        address: address,
        shipping_method: shipping,
        payment_method: paymentMethod,
        total: calculateTotal()
      });

      // Clear cart
      await API.cart.clear();

      // Redirect to order confirmation
      navigate(`/order-confirmation?orderId=${orderData.order_id}`);
    } catch (error) {
      setMessage('Error placing order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = shipping === 'express' ? 200 : (subtotal > 3000 ? 0 : 100);
  const tax = subtotal * 0.18;
  const calculateTotal = () => subtotal + shippingCost + tax;
  const total = calculateTotal();

  if (isLoading) {
    return <Loader />;
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p>Please add items to your cart before checkout</p>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>
      <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '32px' }}>Checkout</h1>

      {/* Progress Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '40px',
        position: 'relative'
      }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 8px',
                borderRadius: '50%',
                background: step >= s ? 'var(--terra)' : 'var(--cream-d)',
                color: step >= s ? 'var(--cream)' : 'var(--dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                transition: 'all var(--duration-base) var(--ease)'
              }}
            >
              {s}
            </div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              opacity: step >= s ? 1 : 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {['Address', 'Review', 'Payment'][s - 1]}
            </p>
          </div>
        ))}
        <div style={{
          position: 'absolute',
          top: '19px',
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--cream-d)',
          zIndex: -1
        }} />
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-md)',
          background: message.includes('Error') ? 'rgba(168,85,56,0.1)' : 'rgba(107,122,94,0.1)',
          color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-2xl)' }}>
        {/* Main Content */}
        <div>
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Shipping Address</h2>
              <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <Input
                  label="Full Name"
                  name="name"
                  value={address.name}
                  onChange={handleAddressChange}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleAddressChange}
                  required
                />
                <Input
                  label="Street Address"
                  name="street"
                  value={address.street}
                  onChange={handleAddressChange}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                  <Input
                    label="City"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    required
                  />
                  <Input
                    label="State"
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <Input
                  label="Pincode"
                  name="pincode"
                  value={address.pincode}
                  onChange={handleAddressChange}
                  required
                />

                {/* Shipping Method */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(24,16,12,0.1)' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Shipping Method</h3>
                  <label style={{ display: 'flex', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="shipping"
                      value="standard"
                      checked={shipping === 'standard'}
                      onChange={(e) => setShipping(e.target.value)}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>Standard Delivery</div>
                      <div style={{ fontSize: '13px', opacity: '0.6' }}>5-7 business days · {shippingCost > 0 && `₹${shippingCost}`}</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="shipping"
                      value="express"
                      checked={shipping === 'express'}
                      onChange={(e) => setShipping(e.target.value)}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>Express Delivery</div>
                      <div style={{ fontSize: '13px', opacity: '0.6' }}>2-3 business days · ₹200</div>
                    </div>
                  </label>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Order Review */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Order Review</h2>

              {/* Shipping Info */}
              <div style={{
                padding: 'var(--spacing-lg)',
                background: 'var(--cream-d)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', opacity: '0.6' }}>
                  Shipping To
                </h3>
                <p style={{ margin: 0, fontWeight: '600' }}>{address.name}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  {address.street}, {address.city}, {address.state} {address.pincode}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>{address.phone}</p>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--terra)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginTop: '8px',
                    textDecoration: 'underline'
                  }}
                >
                  Edit Address
                </button>
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', opacity: '0.6' }}>
                  Order Items
                </h3>
                {cartItems.map(item => (
                  <div key={item.product_id} style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(24,16,12,0.05)'
                  }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--cream-d)', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '600' }}>{item.name}</p>
                      <p style={{ margin: '4px 0', fontSize: '13px', opacity: '0.6' }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: '600' }}>₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Payment Method</h2>
              <label style={{ display: 'flex', gap: '12px', padding: '16px', border: '1px solid rgba(24,16,12,0.1)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', marginBottom: '12px' }}>
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>Razorpay (Card/UPI/Wallet)</div>
                  <div style={{ fontSize: '13px', opacity: '0.6' }}>Secure payment gateway</div>
                </div>
              </label>

              <div style={{
                padding: 'var(--spacing-lg)',
                background: 'var(--cream-d)',
                borderRadius: 'var(--radius-lg)',
                marginTop: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', opacity: '0.7' }}>
                  You will be redirected to Razorpay payment gateway to complete your payment securely.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isProcessing}
              >
                ← Previous Step
              </Button>
            )}
            {step < 3 && (
              <Button
                variant="primary"
                onClick={() => {
                  if (step === 1 && !validateAddress()) return;
                  setStep(step + 1);
                }}
                disabled={isProcessing}
              >
                Next Step →
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="primary"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
          <div style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--cream-d)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', margin: 0 }}>Order Summary</h3>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(24,16,12,0.1)'
            }}>
              <span>Tax (18%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
