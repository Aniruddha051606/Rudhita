// src/api/client.js
// ─────────────────────────────────────────────────────────────────────────────
// Central API client for the Rudhita backend. Endpoints and payload shapes match
// the existing FastAPI backend exactly (login is form-encoded for OAuth2, tokens
// come back as { access_token, refresh_token, token_type }, etc.).
// ─────────────────────────────────────────────────────────────────────────────
const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://api.rudhita.com';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const TOKEN_KEY   = 'rudhita_token';
const REFRESH_KEY = 'rudhita_refresh_token';

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data   = data;
    this.name   = 'APIError';
  }
}

// ── Token helpers ────────────────────────────────────────────────────────────
export const getToken     = () => localStorage.getItem(TOKEN_KEY);
export const isLoggedIn   = () => !!localStorage.getItem(TOKEN_KEY);

export function setTokens(data) {
  if (!data) return;
  const access = data.access_token || data.token || (typeof data === 'string' ? data : null);
  if (access) localStorage.setItem(TOKEN_KEY, access);
  const refresh = data.refresh_token || data.refresh || null;
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Silent refresh (single-flight) ───────────────────────────────────────────
let _refreshPromise = null;
async function tryRefresh() {
  const rt = localStorage.getItem(REFRESH_KEY);
  if (!rt) return false;
  if (!_refreshPromise) {
    _refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.access_token) { setTokens(d); return true; }
        return false;
      })
      .catch(() => false)
      .finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  } catch (networkErr) {
    throw new APIError('Network error — could not reach the server.', 0, null);
  }

  // Parse body (tolerate empty 204s)
  const text = await response.text();
  let data = {};
  if (text) { try { data = JSON.parse(text); } catch { data = { detail: text }; } }

  if (!response.ok) {
    if (response.status === 401 && !options._retry) {
      const refreshed = await tryRefresh();
      if (refreshed) return request(endpoint, { ...options, _retry: true });
      clearTokens();
    }
    throw new APIError(data.detail || data.message || 'Something went wrong', response.status, data);
  }
  return data;
}

// ── Endpoints ────────────────────────────────────────────────────────────────
export const API = {
  auth: {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => {
      const form = new URLSearchParams();
      form.append('username', data.email || data.username);
      form.append('password', data.password);
      return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
    },
    verifyOTP: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
    resendOTP: (data) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => {
      const rt = localStorage.getItem(REFRESH_KEY);
      return request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify(rt ? { refresh_token: rt } : {}),
      });
    },
    me: () => request('/auth/me'),
    googleLogin: (idToken) => request('/auth/google', { method: 'POST', body: JSON.stringify({ id_token: idToken }) }),
  },
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/products/${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/products/${id}`),
    search: (q) => request(`/products/search?q=${encodeURIComponent(q)}`),
    featured: () => request('/products/featured'),
    byCategory: (c) => request(`/products/category/${encodeURIComponent(c)}`),
  },
  cart: {
    get: () => request('/cart/'),
    add: (productId, quantity = 1) => request('/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) }),
    update: (productId, quantity) => request('/cart/update', { method: 'PUT', body: JSON.stringify({ product_id: productId, quantity }) }),
    remove: (itemId) => request(`/cart/remove/${itemId}`, { method: 'DELETE' }),
    clear: () => request('/cart/clear', { method: 'DELETE' }),
  },
  orders: {
    list: () => request('/orders/'),
    get: (id) => request(`/orders/${id}`),
    create: (payload) => request('/orders/', { method: 'POST', body: JSON.stringify(payload) }),
    confirmPayment: (orderId, payload) =>
      request(`/orders/${orderId}/confirm-payment`, { method: 'POST', body: JSON.stringify(payload) }),
    track: (id) => request(`/orders/${id}/track`),
  },
  admin: {
    stats: () => request('/admin/stats'),
    orders: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/orders${qs ? `?${qs}` : ''}`);
    },
    order: (id) => request(`/admin/orders/${id}`),
    products: () => request('/admin/products'),
    updateOrderStatus: (id, status, extra = {}) =>
      request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ shipping_status: status, ...extra }) }),
    fulfillOrder: (id, payload) =>
      request(`/admin/orders/${id}/fulfill`, { method: 'POST', body: JSON.stringify(payload) }),
    bulkFulfill: (orderIds) =>
      request('/admin/orders/bulk-fulfill', { method: 'POST', body: JSON.stringify({ order_ids: orderIds }) }),
    refundOrder: (id) =>
      request(`/admin/orders/${id}/refund`, { method: 'POST', body: JSON.stringify({}) }),
    setWaybill: (id, waybill) =>
      request(`/admin/orders/${id}/waybill?waybill=${encodeURIComponent(waybill)}`, { method: 'PATCH' }),
    users: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    makeAdmin: (userId) => request(`/admin/users/${userId}/make-admin`, { method: 'PATCH' }),
    inventory: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/inventory${qs ? `?${qs}` : ''}`);
    },
    lowStock: () => request('/admin/alerts/low-stock'),
    auditLog: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/audit-log${qs ? `?${qs}` : ''}`);
    },
  },
  reviews: {
    list:    (productId) => request(`/products/${productId}/reviews`),
    summary: (productId) => request(`/products/${productId}/reviews/summary`),
    create:  (productId, data) => request(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    remove:  (productId, reviewId) => request(`/products/${productId}/reviews/${reviewId}`, { method: 'DELETE' }),
  },
  wishlist: {
    list:   () => request('/wishlist'),
    toggle: (productId) => request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
  },
  adminProducts: {
    // NOTE: create uses backend aliases originalPrice / stock
    create: (data) => request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  },
  upload: {
    // 1) ask backend for a presigned R2 PUT URL, 2) PUT the file straight to R2
    getUrl: (filename, contentType) =>
      request('/admin/upload-url', { method: 'POST', body: JSON.stringify({ filename, content_type: contentType }) }),
  },
};

export default API;
