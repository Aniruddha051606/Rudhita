// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API, APIError } from '../utils/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!localStorage.getItem('rudhita_token')) return;
    setLoading(true);
    try {
      const data = await API.cart.get();
      setItems(data.items || []);
    } catch {
      // unauthenticated or network error — leave cart empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Derived values — always in sync with items
  const count = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const total = items.reduce((s, i) => (
    s + parseFloat(i.product?.price || 0) * (i.quantity || 0)
  ), 0);

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  /**
   * Add a product to the cart.
   * - Applies an optimistic update immediately so the drawer shows something.
   * - On 401: clears the temp item and redirects to /auth instead of crashing.
   */
  const addItem = useCallback(async (productId, quantity = 1) => {
    const tempId = `temp-${Date.now()}`;

    setItems(prev => {
      const idx = prev.findIndex(i => (i.product?.id ?? i.product_id) === productId);
      if (idx !== -1) {
        return prev.map((i, n) =>
          n === idx ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        id: tempId,
        product_id: productId,
        product: { id: productId, price: 0 },
        quantity,
      }];
    });

    openDrawer();

    try {
      await API.cart.add(productId, quantity);
      await fetchCart(); // sync real data (resolves temp item + actual price)
    } catch (err) {
      // fetchAPI already redirects on 401, but guard here as a safety net
      if (err instanceof APIError && err.status === 401) {
        setItems(prev => prev.filter(i => i.id !== tempId));
        window.location.href = '/auth';
        return;
      }
      setItems(prev => prev.filter(i => i.id !== tempId));
    }
  }, [openDrawer, fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    let snapshot;
    setItems(prev => { snapshot = prev; return prev.filter(i => i.id !== itemId); });
    try {
      await API.cart.remove(itemId);
    } catch {
      if (snapshot) setItems(snapshot);
    }
  }, []);

  const updateQty = useCallback(async (productId, newQty) => {
    setItems(prev => prev.map(i =>
      (i.product?.id ?? i.product_id) === productId ? { ...i, quantity: newQty } : i
    ));
    try {
      await API.cart.update(productId, newQty);
    } catch {
      fetchCart();
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      await API.cart.clear();
    } catch {
      fetchCart();
    }
  }, [fetchCart]);

  return (
    <CartContext.Provider value={{
      items, count, total, loading, drawerOpen,
      openDrawer, closeDrawer,
      addItem, removeItem, updateQty, clearCart,
      refetch: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
