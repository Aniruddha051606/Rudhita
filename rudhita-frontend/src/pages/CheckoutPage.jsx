// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function CheckoutPage() {
  const navigate = useNavigate();

  const [step, setStep]               = useState(1);
  const [isLoading, setIsLoading]     = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartItems, setCartItems]     = useState([]);
  const [message, setMessage]         = useState('');

  const [address, setAddress] = useState({
    name: '', phone: '', street: '', city: '', state: '', pincode: '',
  });
  const [shipping, setShipping]               = useState('standard');
  const [paymentMethod, setPaymentMethod]     = useState('razorpay');

  // â”€â”€ Bootstrap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);

      const cartData     = await API.cart.get();
      setCartItems(cartData.items || []);

      // Pre-fill address from saved addresses (best-effort)
      try {
        const addressesData = await API.user.getAddresses();
        if (addressesData.addresses?.length > 0) {
          const def = addressesData.addresses.find(a => a.isDefault)
                   || addressesData.addresses[0];
          setAddress({
            name:    def.name    || '',
            phone:   def.phone   || '',
            street:  def.street  || '',
            city:    def.city    || '',
            state:   def.state   || '',
            pincode: def.pincode || '',
          });
        }
      } catch (_) {
        // Saved addresses are optional â€” silently ignore failures
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      setMessage('Error loading checkout information');
    } finally {
      setIsLoading(false);
    }
  };

  // â”€â”€ Address helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const validateAddress = () => {
    if (!address.name || !address.phone || !address.street
        || !address.city || !address.state || !address.pincode) {
      setMessage('Please fill in all address fields');
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      setMessage('Invalid pincode â€” must be exactly 6 digits');
      return false;
    }
    return true;
  };

  // â”€â”€ Order totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // FIX: item.product?.price â€” backend nests product data under .product
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.product?.price || 0) * item.quantity),
    0,
  );
  const shippingCost = shipping === 'express' ? 200 : (subtotal > 3000 ? 0 : 100);
  const tax          = subtotal * 0.18;
  const total        = subtotal + shippingCost + tax;

  // â”€â”€ Place order â†’ Razorpay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // FIX: was a fake bypass that called navigate() immediately without any payment.
  // Now the full Razorpay modal flow:
  //   1. Create order on our backend (returns key_id + razorpay_order_id + amount)
  //   2. Open the Razorpay modal
  //   3. On success, call our /confirm-payment endpoint to verify the HMAC signature
  //   4. ONLY THEN navigate to the confirmation page
  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    setIsProcessing(true);
    setMessage('');

    try {
      // Step 1: create order on our backend
      const orderData = await API.orders.create({
        address,
        shipping_method: shipping,
        payment_method:  paymentMethod,
      });

      // Step 2: configure and open the Razorpay modal
      // NOTE: orderData.amount is returned in RUPEES from our backend.
      //       Razorpay expects the amount in PAISE, so we multiply Ã— 100.
      const options = {
        key:       orderData.key_id,
        amount:    Math.round(parseFloat(orderData.amount) * 100), // paise (integer)
        currency:  orderData.currency || 'INR',
        order_id:  orderData.razorpay_order_id,
        name:      'Rudhita',
        description: 'Order Payment',

        // Step 3: payment success handler â€” verify BEFORE navigating
        handler: async (razorpayResponse) => {
          try {
            await API.orders.confirmPayment(orderData.order_id, {
              razorpay_order_id:   razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature:  razorpayResponse.razorpay_signature,
            });

            // Step 4: ONLY navigate after verified payment
            navigate(`/order-confirmation?orderId=${orderData.order_id}`);
          } catch (verifyError) {
            setMessage('Payment verification failed: ' + verifyError.message);
            setIsProcessing(false);
          }
        },

        prefill: {
          name:    address.name,
          contact: address.phone,
        },
        theme: { color: '#A85538' },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      setMessage('Error placing order: ' + error.message);
      setIsProcessing(false);
    }
  };

  // â”€â”€ Early returns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isLoading) return <Loader />;

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p style={{ margin: '12px 0 24px', opacity: 0.6 }}>
          Please add items to your cart before checkout.
        </p>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>
      <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '32px' }}>
        Checkout
      </h1>

      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div style={{
              width: '40px', height: '40px', margin: '0 auto 8px', borderRadius: '50%',
              background: step >= s ? 'var(--terra)' : 'var(--cream-d)',
              color:      step >= s ? 'var(--cream)' : 'var(--dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '600', transition: 'all var(--duration-base) var(--ease)',
            }}>
              {s}
            </div>
            <p style={{
              margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em',
              opacity: step >= s ? 1 : 0.5,
            }}>
              {['Address', 'Review', 'Payment'][s - 1]}
            </p>
          </div>
        ))}
        <div style={{
          position: 'absolute', top: '19px', left: 0, right: 0,
          height: '2px', background: 'var(--cream-d)', zIndex: -1,
        }} />
      </div>

      {/* Feedback message */}
      {message && (
        <div style={{
          padding: '12px 16px', marginBottom: '20px', borderRadius: 'var(--radius-md)',
          background: message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
            ? 'rgba(168,85,56,0.1)' : 'rgba(107,122,94,0.1)',
          color: message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
            ? 'var(--error)' : 'var(--success)',
          fontSize: '14px',
        }}>
          {message}
        </div>
      )}

      {/* checkout-grid defined in Pages.css with responsive mobile override */}
      <div className="checkout-grid">

        {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>

          {/* Step 1 â€” Shipping address */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Shipping Address</h2>
              <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <Input label="Full Name"      name="name"    value={address.name}    onChange={handleAddressChange} required />
                <Input label="Phone Number"   name="phone"   value={address.phone}   onChange={handleAddressChange} type="tel" required />
                <Input label="Street Address" name="street"  value={address.street}  onChange={handleAddressChange} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                  <Input label="City"  name="city"  value={address.city}  onChange={handleAddressChange} required />
                  <Input label="State" name="state" value={address.state} onChange={handleAddressChange} required />
                </div>
                <Input label="Pincode" name="pincode" value={address.pincode} onChange={handleAddressChange} required />

                {/* Shipping method */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(24,16,12,0.1)' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Shipping Method</h3>
                  <label style={{ display: 'flex', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                    <input type="radio" name="shipping" value="standard" checked={shipping === 'standard'} onChange={e => setShipping(e.target.value)} />
                    <div>
                      <div style={{ fontWeight: '600' }}>Standard Delivery</div>
                      <div style={{ fontSize: '13px', opacity: '0.6' }}>
                        5-7 business days Â· {shippingCost > 0 ? `â‚¹${shippingCost}` : 'FREE'}
                      </div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}>
                    <input type="radio" name="shipping" value="express" checked={shipping === 'express'} onChange={e => setShipping(e.target.value)} />
                    <div>
                      <div style={{ fontWeight: '600' }}>Express Delivery</div>
                      <div style={{ fontSize: '13px', opacity: '0.6' }}>2-3 business days Â· â‚¹200</div>
                    </div>
                  </label>
                </div>
              </form>
            </div>
          )}

          {/* Step 2 â€” Order review */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Order Review</h2>

              {/* Shipping summary */}
              <div style={{
                padding: 'var(--spacing-lg)', background: 'var(--cream-d)',
                borderRadius: 'var(--radius-lg)', marginBottom: '20px',
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
                  style={{ background: 'none', border: 'none', color: 'var(--terra)', cursor: 'pointer', fontSize: '13px', marginTop: '8px', textDecoration: 'underline' }}
                >
                  Edit Address
                </button>
              </div>

              {/* Cart items */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', opacity: '0.6' }}>
                  Order Items
                </h3>
                {cartItems.map((item) => (
                  // FIX: key must be item.id (CartItem ID) â€” item.product_id is
                  // not a top-level property on the CartItemResponse object.
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', gap: '12px', padding: '12px 0',
                      borderBottom: '1px solid rgba(24,16,12,0.05)',
                    }}
                  >
                    <div style={{ width: '60px', height: '60px', background: 'var(--cream-d)', borderRadius: '4px', flexShrink: 0 }}>
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      {/* FIX: item.product?.name (nested) */}
                      <p style={{ margin: 0, fontWeight: '600' }}>{item.product?.name}</p>
                      <p style={{ margin: '4px 0', fontSize: '13px', opacity: '0.6' }}>Qty: {item.quantity}</p>
                      {item.product?.color && (
                        <p style={{ margin: '2px 0', fontSize: '12px', opacity: '0.5' }}>
                          {item.product.color}{item.product?.size ? ` Â· ${item.product.size}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {/* FIX: item.product?.price (nested) â€” was item.price which is undefined */}
                      <p style={{ margin: 0, fontWeight: '600' }}>
                        â‚¹{(parseFloat(item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 â€” Payment */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Payment Method</h2>
              <label style={{
                display: 'flex', gap: '12px', padding: '16px',
                border: '1px solid rgba(24,16,12,0.1)', borderRadius: 'var(--radius-lg)',
                cursor: 'pointer', marginBottom: '12px',
              }}>
                <input
                  type="radio" name="payment" value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={e => setPaymentMethod(e.target.value)}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>Razorpay (Card / UPI / Wallet)</div>
                  <div style={{ fontSize: '13px', opacity: '0.6' }}>Secure payment gateway</div>
                </div>
              </label>
              <div style={{
                padding: 'var(--spacing-lg)', background: 'var(--cream-d)',
                borderRadius: 'var(--radius-lg)', marginTop: '20px',
              }}>
                <p style={{ margin: 0, fontSize: '13px', opacity: '0.7' }}>
                  Clicking "Pay" will open the Razorpay modal. Your order is confirmed
                  only after successful payment verification.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isProcessing}>
                â† Previous Step
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
                Next Step â†’
              </Button>
            )}
            {step === 3 && (
              <Button variant="primary" onClick={handlePlaceOrder} disabled={isProcessing}>
                {isProcessing ? 'Processingâ€¦' : `Pay â‚¹${total.toLocaleString('en-IN')}`}
              </Button>
            )}
          </div>
        </div>

        {/* â”€â”€ Order summary sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
          <div style={{
            padding: 'var(--spacing-lg)', background: 'var(--cream-d)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 16px' }}>Order Summary</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
              <span>Subtotal</span>
              <span>â‚¹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'FREE' : `â‚¹${shippingCost}`}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: '14px',
              marginBottom: '16px', paddingBottom: '16px',
              borderBottom: '1px solid rgba(24,16,12,0.1)',
            }}>
              <span>Tax (18%)</span>
              <span>â‚¹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '600' }}>
              <span>Total</span>
              <span>â‚¹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CheckoutPage;