// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { loggedIn } = useAuth();
  const [items, setItems]   = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoad]  = useState(false);

  // Derived totals (recomputed from items â€” server cart_total is authoritative
  // at checkout, but for display we compute from the line items we hold).
  const count    = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + Number(i.product?.price || 0) * i.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (!loggedIn) { setItems([]); return; }
    setLoad(true);
    try {
      const data = await API.cart.get();
      setItems(data.items || []);
    } catch { /* leave as-is */ }
    finally { setLoad(false); }
  }, [loggedIn]);

  // Load (and clear on logout) whenever auth state changes.
  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    try {
      const data = await API.cart.add(productId, quantity);
      if (data?.items) setItems(data.items);
      setOpen(true);
      return true;
    } catch (e) {
      // surface a soft failure; caller can toast if desired
      await fetchCart();
      throw e;
    }
  }, [fetchCart]);

  const updateQty = useCallback(async (productId, qty) => {
    let snapshot;
    setItems((prev) => {
      snapshot = prev;
      return prev.map((i) =>
        (i.product?.id ?? i.product_id) === productId ? { ...i, quantity: qty } : i
      );
    });
    try {
      const data = await API.cart.update(productId, qty);
      if (data?.items) setItems(data.items);
    } catch {
      if (snapshot) setItems(snapshot);
      fetchCart();
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    let snapshot;
    setItems((prev) => { snapshot = prev; return prev.filter((i) => i.id !== itemId); });
    try { await API.cart.remove(itemId); }
    catch { if (snapshot) setItems(snapshot); fetchCart(); }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    const snapshot = items;
    setItems([]);
    try { await API.cart.clear(); }
    catch { setItems(snapshot); }
  }, [items]);

  const value = {
    items, count, subtotal, loading,
    open, openDrawer: () => setOpen(true), closeDrawer: () => setOpen(false),
    addItem, updateQty, removeItem, clearCart, fetchCart,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === null) throw new Error('useCart() must be used within <CartProvider>.');
  return ctx;
}

export default CartContext;
