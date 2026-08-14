import axios from "axios";

const API_BASE_URL = "https://soft-comics-poke.loca.lt/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// Request interceptor for injecting JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors (like unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    if (res.data.success && res.data.data) {
      const { user } = res.data.data;
      localStorage.setItem("token", user.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    }
    return res.data;
  },
  register: async (name, email, password, role, phone = "") => {
    const res = await apiClient.post("/auth/register", {
      name,
      email,
      password,
      role,
      phone,
    });
    return res.data;
  },
  verifyEmail: async (token) => {
    const res = await apiClient.get(`/auth/verify-email?token=${token}`);
    return res.data;
  },
  resendVerification: async (email) => {
    const res = await apiClient.post("/auth/resend-verification", { email });
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await apiClient.post("/auth/forgot-password", { email });
    return res.data;
  },
  resetPassword: async (token, newPassword) => {
    const res = await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return res.data;
  },
  verifyEmailExists: async (email) => {
    const res = await apiClient.post("/auth/verify-email-exists", { email });
    return res.data;
  },
  resetPasswordDirect: async (email, newPassword) => {
    const res = await apiClient.post("/auth/reset-password-direct", { email, newPassword });
    if (res.data.success && res.data.data) {
      const { user } = res.data.data;
      localStorage.setItem("token", user.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    }
    return res.data;
  },
  oauthLogin: async (email, name, provider, providerId, role = "customer") => {
    const res = await apiClient.post("/auth/oauth-login", {
      email,
      name,
      provider,
      providerId,
      role
    });
    if (res.data.success && res.data.data) {
      const { user } = res.data.data;
      localStorage.setItem("token", user.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    }
    return res.data;
  },
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("token");
      await apiClient.post("/auth/logout", {}, {
        headers: { "X-Refresh-Token": refreshToken || "" }
      });
    } catch (e) {
      console.warn("Logout request failed, cleaning client local storage regardless.", e);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  logoutAll: async () => {
    const res = await apiClient.post("/auth/logout-all");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return res.data;
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};

export const productService = {
  getProducts: async (params = {}) => {
    const res = await apiClient.get("/products", { params });
    return res.data;
  },
  getProductById: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },
  createProduct: async (productData) => {
    const res = await apiClient.post("/products", productData);
    return res.data;
  },
  updateProduct: async (id, productData) => {
    const res = await apiClient.put(`/products/${id}`, productData);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },
  createVariant: async (productId, variantData) => {
    const res = await apiClient.post(`/products/${productId}/variants`, variantData);
    return res.data;
  },
  getCategories: async () => {
    const res = await apiClient.get("/products/categories");
    return res.data;
  },
  createCategory: async (categoryData) => {
    const res = await apiClient.post("/products/categories", categoryData);
    return res.data;
  },
  bulkImport: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/products/bulk-import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};

export const cartService = {
  getCart: async () => {
    const res = await apiClient.get("/cart");
    return res.data;
  },
  addToCart: async (productId, quantity = 1, productVariantId = null) => {
    const res = await apiClient.post("/cart", {
      productId,
      quantity,
      productVariantId,
    });
    return res.data;
  },
  updateCartItem: async (id, quantity, saveForLater = false) => {
    const res = await apiClient.put(`/cart/${id}`, {
      quantity,
      saveForLater,
    });
    return res.data;
  },
  removeCartItem: async (id) => {
    const res = await apiClient.delete(`/cart/${id}`);
    return res.data;
  },
  getWishlist: async () => {
    const res = await apiClient.get("/cart/wishlist");
    return res.data;
  },
  addToWishlist: async (productId) => {
    const res = await apiClient.post("/cart/wishlist", { productId });
    return res.data;
  },
  removeFromWishlist: async (productId) => {
    const res = await apiClient.delete(`/cart/wishlist/${productId}`);
    return res.data;
  },
};

export const orderService = {
  getAddresses: async () => {
    const res = await apiClient.get("/orders/addresses");
    return res.data;
  },
  createAddress: async (addressData) => {
    const res = await apiClient.post("/orders/addresses", addressData);
    return res.data;
  },
  deleteAddress: async (id) => {
    const res = await apiClient.delete(`/orders/addresses/${id}`);
    return res.data;
  },
  checkout: async (checkoutData) => {
    const res = await apiClient.post("/orders/checkout", checkoutData);
    return res.data;
  },
  getOrders: async () => {
    const res = await apiClient.get("/orders");
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },
  updateOrderStatus: async (id, status, courierPartner = "", trackingNumber = "", estimatedDeliveryDays = "") => {
    const res = await apiClient.put(`/orders/${id}/status`, {
      status,
      courierPartner,
      trackingNumber,
      estimatedDeliveryDays,
    });
    return res.data;
  },
  cancelOrder: async (id) => {
    const res = await apiClient.post(`/orders/${id}/cancel`);
    return res.data;
  },
  verifyDelivery: async (id, otp) => {
    const res = await apiClient.post(`/orders/${id}/verify-delivery?otp=${otp}`);
    return res.data;
  },
  downloadInvoice: async (id) => {
    const res = await apiClient.get(`/orders/${id}/invoice`, {
      responseType: "blob",
    });
    return res.data;
  },
};

export const reviewService = {
  getProductReviews: async (productId) => {
    const res = await apiClient.get(`/reviews/product/${productId}`);
    return res.data;
  },
  createReview: async (reviewData) => {
    const res = await apiClient.post("/reviews", reviewData);
    return res.data;
  },
};

export const sellerService = {
  createStore: async (storeData) => {
    const res = await apiClient.post("/sellers/stores", storeData);
    return res.data;
  },
  getDashboard: async () => {
    const res = await apiClient.get("/sellers/dashboard");
    return res.data;
  },
  createCoupon: async (couponData) => {
    const res = await apiClient.post("/sellers/coupons", couponData);
    return res.data;
  },
  replyToReview: async (reviewId, reply) => {
    const res = await apiClient.post(`/sellers/reviews/${reviewId}/reply`, { reply });
    return res.data;
  },
};

export const adminService = {
  getUsers: async () => {
    const res = await apiClient.get("/admin/users");
    return res.data;
  },
  toggleUserStatus: async (id, active) => {
    const res = await apiClient.put(`/admin/users/${id}/status?active=${active}`);
    return res.data;
  },
  getSellers: async () => {
    const res = await apiClient.get("/admin/sellers");
    return res.data;
  },
  approveSeller: async (id, approve) => {
    const res = await apiClient.put(`/admin/sellers/${id}/approve?approve=${approve}`);
    return res.data;
  },
  getAllOrders: async () => {
    const res = await apiClient.get("/admin/orders");
    return res.data;
  },
  getActivityLogs: async () => {
    const res = await apiClient.get("/admin/activity-logs");
    return res.data;
  },
  getSettings: async () => {
    const res = await apiClient.get("/admin/settings");
    return res.data;
  },
  setSetting: async (key, value, group = "General") => {
    const res = await apiClient.post(`/admin/settings?key=${key}&value=${value}&group=${group}`);
    return res.data;
  },
};

export default apiClient;
