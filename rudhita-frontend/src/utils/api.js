// src/utils/api.js
const rawBaseUrl = import.meta.env.VITE_API_URL || "https://rudhita-1.onrender.com";
const BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data   = data;
    this.name   = "APIError";
  }
}

/**
 * Central fetch wrapper.
 * – Attaches Bearer token automatically.
 * – Redirects to /auth on 401.
 * – Throws APIError on non-2xx.
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

    // Handle no-content responses (e.g. 204 DELETE)
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("rudhita_token");
        localStorage.removeItem("rudhita_refresh_token");
        window.location.href = "/auth";
      }
      throw new APIError(
        data.detail || data.message || "Something went wrong",
        response.status,
        data,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error.message || "Network error. Please try again.", 0, null);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ALL ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const API = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register: (data) =>
      fetchAPI("/auth/register", { method: "POST", body: JSON.stringify(data) }),

    /** FastAPI OAuth2 requires application/x-www-form-urlencoded with 'username' field. */
    login: (data) => {
      const form = new URLSearchParams();
      form.append("username", data.email || data.username);
      form.append("password", data.password);
      return fetchAPI("/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    form.toString(),
      });
    },

    verifyOTP: (data) =>
      fetchAPI("/auth/verify-otp", { method: "POST", body: JSON.stringify(data) }),

    resendOTP: (data) =>
      fetchAPI("/auth/resend-otp", { method: "POST", body: JSON.stringify(data) }),

    /** Sends refresh_token so backend can revoke it AND blocklist the access JTI. */
    logout: () => {
      const refreshToken = localStorage.getItem("rudhita_refresh_token");
      return fetchAPI("/auth/logout", {
        method: "POST",
        body:   JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    },

    refresh: (refreshToken) =>
      fetchAPI("/auth/refresh", {
        method: "POST",
        body:   JSON.stringify({ refresh_token: refreshToken }),
      }),

    me: () => fetchAPI("/auth/me"),
  },

  // ── Products ───────────────────────────────────────────────────────────────
  products: {
    list:       (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchAPI(`/products/${qs ? "?" + qs : ""}`);
    },
    get:        (id)       => fetchAPI(`/products/${id}`),
    search:     (query)    => fetchAPI(`/products/search?q=${encodeURIComponent(query)}`),
    featured:   ()         => fetchAPI("/products/featured"),
    byCategory: (category) => fetchAPI(`/products/category/${encodeURIComponent(category)}`),
  },

  // ── Cart ───────────────────────────────────────────────────────────────────
  cart: {
    get:    ()                       => fetchAPI("/cart/"),
    add:    (productId, quantity = 1) =>
      fetchAPI("/cart/add", {
        method: "POST",
        body:   JSON.stringify({ product_id: productId, quantity }),
      }),
    update: (productId, quantity) =>
      fetchAPI("/cart/update", {
        method: "PUT",
        body:   JSON.stringify({ product_id: productId, quantity }),
      }),
    remove: (itemId) => fetchAPI(`/cart/remove/${itemId}`, { method: "DELETE" }),
    clear:  ()       => fetchAPI("/cart/clear",             { method: "DELETE" }),
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    list:   ()      => fetchAPI("/orders/"),
    get:    (id)    => fetchAPI(`/orders/${id}`),
    create: (data)  =>
      fetchAPI("/orders/", { method: "POST", body: JSON.stringify(data) }),
    confirmPayment: (orderId, paymentData) =>
      fetchAPI(`/orders/${orderId}/confirm-payment`, {
        method: "POST",
        body:   JSON.stringify(paymentData),
      }),
    track:  (id) => fetchAPI(`/orders/${id}/track`),
    cancel: (id) => fetchAPI(`/orders/${id}/cancel`, { method: "POST" }),
  },

  // ── User ───────────────────────────────────────────────────────────────────
  user: {
    getProfile:    ()          => fetchAPI("/user/profile"),
    updateProfile: (data)      =>
      fetchAPI("/user/profile", { method: "PUT", body: JSON.stringify(data) }),
    getAddresses:  ()          => fetchAPI("/user/addresses"),
    addAddress:    (data)      =>
      fetchAPI("/user/addresses", { method: "POST", body: JSON.stringify(data) }),
    updateAddress: (id, data)  =>
      fetchAPI(`/user/addresses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteAddress: (id)        =>
      fetchAPI(`/user/addresses/${id}`, { method: "DELETE" }),
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    dashboard: () => fetchAPI("/admin/dashboard"),
    stats:     () => fetchAPI("/admin/stats"),

    products: {
      list:   ()          => fetchAPI("/admin/products"),
      create: (data)      =>
        fetchAPI("/admin/products",      { method: "POST",   body: JSON.stringify(data) }),
      update: (id, data)  =>
        fetchAPI(`/admin/products/${id}`, { method: "PUT",    body: JSON.stringify(data) }),
      delete: (id)        =>
        fetchAPI(`/admin/products/${id}`, { method: "DELETE" }),
    },

    orders: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetchAPI(`/admin/orders${qs ? "?" + qs : ""}`);
      },

      update: (id, data) =>
        fetchAPI(`/admin/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),

      /**
       * POST /admin/orders/{id}/waybill?waybill=<value>
       * Sets waybill and marks order Shipped, then emails the customer.
       */
      setWaybill: (id, waybill) =>
        fetchAPI(
          `/admin/orders/${id}/waybill?waybill=${encodeURIComponent(waybill)}`,
          { method: "PATCH" },
        ),

      /**
       * POST /admin/orders/{id}/refund
       * Triggers a full Razorpay refund.
       */
      refund: (id) =>
        fetchAPI(`/admin/orders/${id}/refund`, { method: "POST" }),

      /**
       * POST /admin/orders/{id}/fulfill
       * Phase 2: creates Fulfillment + writes inventory ledger rows.
       * payload: { carrier?, tracking_number?, notes? }
       */
      fulfill: (id, payload = {}) =>
        fetchAPI(`/admin/orders/${id}/fulfill`, {
          method: "POST",
          body:   JSON.stringify(payload),
        }),

      /**
       * POST /admin/orders/bulk-fulfill
       * Phase 2: enqueues up to 50 orders for background fulfillment.
       * Returns immediately with { status: "processing" }.
       */
      bulkFulfill: (orderIds) =>
        fetchAPI("/admin/orders/bulk-fulfill", {
          method: "POST",
          body:   JSON.stringify({ order_ids: orderIds }),
        }),
    },

    users: {
      list:      ()   => fetchAPI("/admin/users"),
      makeAdmin: (id) => fetchAPI(`/admin/users/${id}/admin`, { method: "POST" }),
    },

    /** Phase 2: inventory levels, ordered low-stock first. */
    inventory: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetchAPI(`/admin/inventory${qs ? "?" + qs : ""}`);
      },
    },

    auditLog: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchAPI(`/admin/audit-log${qs ? "?" + qs : ""}`);
    },

    alerts: {
      lowStock: (threshold = 10) =>
        fetchAPI(`/admin/alerts/low-stock?threshold=${threshold}`),
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TOKEN UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export const isAuthenticated = () => !!localStorage.getItem("rudhita_token");
export const getAuthToken    = () => localStorage.getItem("rudhita_token");

/** Persist both tokens from the login response. */
export const setAuthTokens = ({ access_token, refresh_token } = {}) => {
  if (access_token)  localStorage.setItem("rudhita_token",         access_token);
  else               localStorage.removeItem("rudhita_token");
  if (refresh_token) localStorage.setItem("rudhita_refresh_token",  refresh_token);
  else               localStorage.removeItem("rudhita_refresh_token");
};

export const clearAuthTokens = () => {
  localStorage.removeItem("rudhita_token");
  localStorage.removeItem("rudhita_refresh_token");
};

export const handleAPIError = (error) => {
  if (error instanceof APIError) {
    return { message: error.message, status: error.status, data: error.data };
  }
  return { message: "An unexpected error occurred", status: 0, data: null };
};
