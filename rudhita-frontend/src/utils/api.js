// src/utils/api.js

const BASE_URL = import.meta.env.VITE_API_URL || "https://rudhita-1.onrender.com";

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status  = status;
    this.data    = data;
    this.name    = 'APIError';
  }
}

/**
 * Central API request handler.
 *
 * DESIGN NOTE — Content-Type:
 *   Default is "application/json".
 *   Callers override it via options.headers (spread last, so it always wins).
 */
export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem("rudhita_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const data     = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("rudhita_token");
        localStorage.removeItem("rudhita_refresh_token");
        window.location.href = '/auth';
      }
      throw new APIError(
        data.detail || data.message || "Something went wrong",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error.message || "Network error. Please try again.", 0, null);
  }
};

/**
 * All API endpoints
 */
export const API = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register: (data) =>
      fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    /**
     * FastAPI's OAuth2PasswordRequestForm requires application/x-www-form-urlencoded
     * with field name 'username' (not 'email'). Sending JSON returns HTTP 422.
     */
    login: (data) => {
      const formData = new URLSearchParams();
      formData.append('username', data.email || data.username);
      formData.append('password', data.password);
      return fetchAPI('/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    formData.toString(),
      });
    },

    verifyOTP: (data) =>
      fetchAPI('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),

    // FIX: added resendOTP — AuthPage calls this from the "Resend OTP" button.
    // Was missing from api.js before; the button would throw "API.auth.resendOTP is not a function".
    resendOTP: (data) =>
      fetchAPI('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),

    /**
     * Sends the refresh_token so the backend can revoke it AND blocklist the access token JTI.
     */
    logout: () => {
      const refreshToken = localStorage.getItem("rudhita_refresh_token");
      return fetchAPI('/auth/logout', {
        method: 'POST',
        body:   JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    },

    refresh: (refreshToken) =>
      fetchAPI('/auth/refresh', {
        method: 'POST',
        body:   JSON.stringify({ refresh_token: refreshToken }),
      }),

    me: () => fetchAPI('/auth/me', { method: 'GET' }),
  },

  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchAPI(`/products/${query ? '?' + query : ''}`);
    },
    get:        (id)       => fetchAPI(`/products/${id}`),
    search:     (query)    => fetchAPI(`/products/search?q=${encodeURIComponent(query)}`),
    featured:   ()         => fetchAPI('/products/featured'),
    byCategory: (category) => fetchAPI(`/products/category/${category}`),
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  cart: {
    get:    ()                     => fetchAPI('/cart/'),
    add:    (productId, quantity = 1) =>
      fetchAPI('/cart/add', {
        method: 'POST',
        body:   JSON.stringify({ product_id: productId, quantity }),
      }),
    update: (productId, quantity) =>
      fetchAPI('/cart/update', {
        method: 'PUT',
        body:   JSON.stringify({ product_id: productId, quantity }),
      }),
    remove: (itemId) => fetchAPI(`/cart/remove/${itemId}`, { method: 'DELETE' }),
    clear:  ()       => fetchAPI('/cart/clear',            { method: 'DELETE' }),
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: {
    list:   ()             => fetchAPI('/orders/'),
    get:    (id)           => fetchAPI(`/orders/${id}`),
    create: (data)         =>
      fetchAPI('/orders/', { method: 'POST', body: JSON.stringify(data) }),
    confirmPayment: (orderId, paymentData) =>
      fetchAPI(`/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        body:   JSON.stringify(paymentData),
      }),
    track:  (id) => fetchAPI(`/orders/${id}/track`),
    cancel: (id) => fetchAPI(`/orders/${id}/cancel`, { method: 'POST' }),
  },

  // ── User ──────────────────────────────────────────────────────────────────
  user: {
    getProfile:     ()         => fetchAPI('/user/profile'),
    updateProfile:  (data)     =>
      fetchAPI('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
    getAddresses:   ()         => fetchAPI('/user/addresses'),
    addAddress:     (data)     =>
      fetchAPI('/user/addresses', { method: 'POST', body: JSON.stringify(data) }),
    updateAddress:  (id, data) =>
      fetchAPI(`/user/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAddress:  (id)       =>
      fetchAPI(`/user/addresses/${id}`, { method: 'DELETE' }),
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    dashboard: () => fetchAPI('/admin/dashboard'),
    stats:     () => fetchAPI('/admin/stats'),
    products: {
      list:   ()          => fetchAPI('/admin/products'),
      create: (data)      => fetchAPI('/admin/products',     { method: 'POST',   body: JSON.stringify(data) }),
      update: (id, data)  => fetchAPI(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id)        => fetchAPI(`/admin/products/${id}`, { method: 'DELETE' }),
    },
    orders: {
      list:   ()         => fetchAPI('/admin/orders'),
      update: (id, data) => fetchAPI(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    users: {
      list:      ()   => fetchAPI('/admin/users'),
      makeAdmin: (id) => fetchAPI(`/admin/users/${id}/admin`, { method: 'POST' }),
    },
    auditLog: () => fetchAPI('/admin/audit-log'),
  },
};

// ── Auth token utilities ───────────────────────────────────────────────────

/** Returns true when an access token is present in localStorage. */
export const isAuthenticated = () => !!localStorage.getItem("rudhita_token");

/** Read the stored access token. */
export const getAuthToken = () => localStorage.getItem("rudhita_token");

/**
 * Persist both tokens returned by the login endpoint.
 * This is the ONLY correct name — setAuthTokens (plural).
 * Components importing the old "setAuthToken" (singular) will get a Vite build error.
 */
export const setAuthTokens = ({ access_token, refresh_token } = {}) => {
  if (access_token) {
    localStorage.setItem("rudhita_token", access_token);
  } else {
    localStorage.removeItem("rudhita_token");
  }
  if (refresh_token) {
    localStorage.setItem("rudhita_refresh_token", refresh_token);
  } else {
    localStorage.removeItem("rudhita_refresh_token");
  }
};

/** Clear both tokens on logout. */
export const clearAuthTokens = () => {
  localStorage.removeItem("rudhita_token");
  localStorage.removeItem("rudhita_refresh_token");
};

/** Uniform error shape for UI consumers. */
export const handleAPIError = (error) => {
  if (error instanceof APIError) {
    return { message: error.message, status: error.status, data: error.data };
  }
  return { message: 'An unexpected error occurred', status: 0, data: null };
};