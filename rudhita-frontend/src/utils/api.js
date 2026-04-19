// src/utils/api.js

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

/**
 * Central API request handler with error handling and token management
 */
export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem("rudhita_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem("rudhita_token");
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
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error.message || "Network error. Please try again.",
      0,
      null
    );
  }
};

/**
 * API endpoints collection for better organization
 */
export const API = {
  // Auth endpoints
  auth: {
    register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    verifyOTP: (data) => fetchAPI('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
    me: () => fetchAPI('/auth/me', { method: 'GET' }),
  },

  // Products endpoints
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchAPI(`/products/${query ? '?' + query : ''}`);
    },
    get: (id) => fetchAPI(`/products/${id}`),
    search: (query) => fetchAPI(`/products/search?q=${encodeURIComponent(query)}`),
    featured: () => fetchAPI('/products/featured'),
    byCategory: (category) => fetchAPI(`/products/category/${category}`),
  },

  // Cart endpoints
  cart: {
    get: () => fetchAPI('/cart/'),
    add: (productId, quantity = 1) => fetchAPI('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
    update: (productId, quantity) => fetchAPI('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
    remove: (productId) => fetchAPI('/cart/remove', {
      method: 'DELETE',
      body: JSON.stringify({ product_id: productId }),
    }),
    clear: () => fetchAPI('/cart/clear', { method: 'DELETE' }),
  },

  // Orders endpoints
  orders: {
    list: () => fetchAPI('/orders/'),
    get: (id) => fetchAPI(`/orders/${id}`),
    create: (data) => fetchAPI('/orders/', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => fetchAPI(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    track: (id) => fetchAPI(`/orders/${id}/track`),
  },

  // User endpoints
  user: {
    getProfile: () => fetchAPI('/user/profile'),
    updateProfile: (data) => fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getAddresses: () => fetchAPI('/user/addresses'),
    addAddress: (data) => fetchAPI('/user/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateAddress: (id, data) => fetchAPI(`/user/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteAddress: (id) => fetchAPI(`/user/addresses/${id}`, { method: 'DELETE' }),
  },

  // Admin endpoints
  admin: {
    dashboard: () => fetchAPI('/admin/dashboard'),
    products: {
      list: () => fetchAPI('/admin/products'),
      create: (data) => fetchAPI('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => fetchAPI(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: (id) => fetchAPI(`/admin/products/${id}`, { method: 'DELETE' }),
    },
    orders: {
      list: () => fetchAPI('/admin/orders'),
      update: (id, data) => fetchAPI(`/admin/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    },
    users: {
      list: () => fetchAPI('/admin/users'),
      makeAdmin: (id) => fetchAPI(`/admin/users/${id}/admin`, { method: 'POST' }),
    },
  },
};

/**
 * Utility function to check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("rudhita_token");
};

/**
 * Utility function to get authentication token
 */
export const getAuthToken = () => {
  return localStorage.getItem("rudhita_token");
};

/**
 * Utility function to set authentication token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("rudhita_token", token);
  } else {
    localStorage.removeItem("rudhita_token");
  }
};

/**
 * Utility function to handle API errors consistently
 */
export const handleAPIError = (error) => {
  if (error instanceof APIError) {
    return {
      message: error.message,
      status: error.status,
      data: error.data,
    };
  }
  return {
    message: 'An unexpected error occurred',
    status: 0,
    data: null,
  };
};
