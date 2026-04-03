// src/api.jsx
import axios from "axios";
import { API_BASE } from "./config";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ========== AUTO-INIT TOKEN FROM LOCALSTORAGE ==========
// Tự động set token khi app load
try {
  const auth = JSON.parse(localStorage.getItem("ph_auth") || "{}");
  if (auth.token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
  }
} catch {
  // No auth token found
}

// ========== INTERCEPTOR: TỰ ĐỘNG XÓA TOKEN KHI HẾT HẠN ==========
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu lỗi 401 (Unauthorized) hoặc 403 (Forbidden) liên quan đến token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const errorMsg = error.response.data?.error || '';

      // Kiểm tra message có chứa "token" hoặc "hết hạn"
      if (errorMsg.toLowerCase().includes('token') ||
        errorMsg.toLowerCase().includes('hết hạn') ||
        errorMsg.toLowerCase().includes('không hợp lệ')) {

        // XÓA TOKEN CŨ tự động
        localStorage.removeItem('ph_auth');
        delete api.defaults.headers.common["Authorization"];

        // ⭐️ SỬA: Bỏ alert() và thay bằng console.error cho đỡ phiền
        console.error('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');

        // Chuyển về trang login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ========== AUTH ==========
// Giữ nguyên logic cũ để tương thích login hiện có.
export function setAuthToken(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

/** [PUBLIC] Đăng ký tài khoản mới */
export const register = (userData) =>
  api.post("/auth/register", userData).then((r) => r.data);

/** [PUBLIC] Đăng nhập */
export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

/** [ADMIN-ONLY] Tạo tài khoản admin (one-time) */
export const initAdmin = (adminData) =>
  api.post("/auth/admin-init", adminData).then((r) => r.data);

// ========== PRODUCT (Danh mục/Chi tiết) ==========
/** [USER] Lấy danh sách sản phẩm (có tìm kiếm/lọc) */
export const fetchProducts = (params = {}) =>
  api.get("/products", { params }).then((r) => r.data);

/** [USER] Lấy 1 sản phẩm nổi bật ngẫu nhiên */
export const getFeaturedProduct = () =>
  api.get("/products/featured").then((r) => r.data);

/** [USER] Lấy chi tiết 1 sản phẩm theo id */
export const getProductDetail = (id) =>
  api.get(`/products/${id}`).then((r) => r.data);

// Alias for compatibility
export const fetchProductById = getProductDetail;

// ========== CART (Giỏ hàng) ==========
/** [USER] Lấy giỏ hàng hiện tại của user */
export const getCart = () => api.get("/cart").then((r) => r.data);

/** [USER] Thêm sản phẩm vào giỏ { productId, qty } */
export const addToCart = (productId, qty = 1) =>
  api.post("/cart/items", { productId, qty }).then((r) => r.data);

/** [USER] Cập nhật số lượng 1 item trong giỏ */
export const updateCartItem = (itemId, qty) =>
  api.patch(`/cart/items/${itemId}`, { qty }).then((r) => r.data);

/** [USER] Xoá 1 item khỏi giỏ */
export const removeFromCart = (itemId) =>
  api.delete(`/cart/items/${itemId}`).then((r) => r.data);

// Alias for compatibility
export const removeCartItem = removeFromCart;

// ========== ORDER (Đơn hàng/Checkout) ==========
/** [USER] Tạo đơn hàng từ giỏ */
export const checkout = (payload) =>
  api.post("/orders/checkout", payload).then((r) => r.data);

/** [USER] Danh sách đơn hàng của user */
export const getOrders = (params = {}) =>
  api.get("/orders", { params }).then((r) => r.data);

/** [USER] Chi tiết 1 đơn hàng */
export const getOrderDetail = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data);

/** [USER] Hủy đơn hàng (chỉ status = pending) */
export const cancelOrder = (orderId) =>
  api.patch(`/orders/${orderId}/cancel`).then((r) => r.data);

// Aliases for compatibility
export const fetchOrders = getOrders;
export const fetchOrderDetail = getOrderDetail;

// ========== USER PROFILE ==========
/** [USER] Lấy thông tin cá nhân */
export const getMe = () => api.get("/users/me").then((r) => r.data);

/** [USER] Cập nhật thông tin cá nhân */
export const updateMe = (payload) =>
  api.patch("/users/me", payload).then((r) => r.data);

/** [USER] Đổi mật khẩu */
export const changePassword = (currentPassword, newPassword) =>
  api.patch("/users/change-password", { currentPassword, newPassword }).then((r) => r.data);

// ========== CHAT (Support Chat) ==========
/** [USER] Lấy danh sách chat threads */
export const getChatThreads = () =>
  api.get("/chat/threads").then((r) => r.data);

/** [USER] Tạo chat thread mới */
export const createChatThread = (payload) =>
  api.post("/chat/threads", payload).then((r) => r.data);

/** [USER] Lấy tin nhắn trong 1 thread */
export const getChatMessages = (threadId) =>
  api.get(`/chat/threads/${threadId}/messages`).then((r) => r.data);

/** [USER] Gửi tin nhắn */
export const sendChatMessage = (threadId, message) =>
  api.post(`/chat/threads/${threadId}/messages`, { message }).then((r) => r.data);

// ========== DISEASE ENCYCLOPEDIA ==========
/** [PUBLIC] Tìm kiếm bệnh */
export const searchDiseases = (query) =>
  api.get("/diseases", { params: { q: query } }).then((r) => r.data);

/** [PUBLIC] Lấy chi tiết bệnh theo slug */
export const getDiseaseBySlug = (slug) =>
  api.get(`/diseases/slug/${slug}`).then((r) => r.data);

// ========== ANNOUNCEMENTS ==========
/** [PUBLIC] Lấy danh sách thông báo */
export const getAnnouncements = () =>
  api.get("/announcements").then((r) => r.data);

// ========== ADMIN - DASHBOARD ==========
/** [ADMIN] Lấy thống kê tổng quan dashboard */
export const getDashboardStats = () =>
  api.get("/dashboard/statistics").then((r) => r.data);

/** [ADMIN] Lấy dữ liệu biểu đồ doanh thu */
export const getRevenueChart = (days = 7) =>
  api.get("/dashboard/revenue-chart", { params: { days } }).then((r) => r.data);

// ========== ADMIN - USER MANAGEMENT ==========
/** [ADMIN] Lấy danh sách tất cả users */
export const getAllUsers = (params = {}) =>
  api.get("/users/admin/all", { params }).then((r) => r.data);

/** [ADMIN] Lấy chi tiết 1 user */
export const getUserById = (id) =>
  api.get(`/users/admin/${id}`).then((r) => r.data);

/** [ADMIN] Cập nhật user */
export const updateUser = (id, data) =>
  api.patch(`/users/admin/${id}`, data).then((r) => r.data);

/** [ADMIN] Xóa user */
export const deleteUser = (id) =>
  api.delete(`/users/admin/${id}`).then((r) => r.data);

// ========== ADMIN - PRODUCT MANAGEMENT ==========
/** [ADMIN] Lấy tất cả sản phẩm (kể cả inactive) */
export const getAllProductsAdmin = (params = {}) =>
  api.get("/products/admin/all", { params }).then((r) => r.data);

/** [ADMIN] Tạo sản phẩm mới */
export const createProduct = (data) =>
  api.post("/products/admin", data).then((r) => r.data);

/** [ADMIN] Cập nhật sản phẩm */
export const updateProduct = (id, data) =>
  api.patch(`/products/admin/${id}`, data).then((r) => r.data);

/** [ADMIN] Xóa sản phẩm (soft delete) */
export const deleteProduct = (id) =>
  api.delete(`/products/admin/${id}`).then((r) => r.data);

/** [ADMIN] Bật/tắt trạng thái sản phẩm */
export const toggleProductStatus = (id) =>
  api.patch(`/products/admin/${id}/toggle`).then((r) => r.data);

// ========== CLOUDINARY UPLOAD ==========
/** [ADMIN] Upload ảnh sản phẩm lên Cloudinary */
export const uploadProductImage = (file, productId) => {
  const formData = new FormData();
  formData.append('image', file);
  if (productId) formData.append('productId', productId);
  
  return api.post('/upload/product', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((r) => r.data);
};

/** [USER] Upload avatar lên Cloudinary */
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((r) => r.data);
};

/** [ADMIN] Upload nhiều ảnh cùng lúc */
export const uploadMultipleImages = (files, folder = 'pharmacy/misc') => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  formData.append('folder', folder);
  
  return api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((r) => r.data);
};

/** [ADMIN] Xóa ảnh từ Cloudinary */
export const deleteCloudinaryImage = (imageUrl, publicId = null) => {
  return api.delete('/upload/delete', {
    data: { imageUrl, publicId }
  }).then((r) => r.data);
};

/** [ADMIN] Test Cloudinary connection */
export const testCloudinaryConnection = () =>
  api.get('/upload/test').then((r) => r.data);

// ========== ADMIN - ORDER MANAGEMENT ==========
/** [ADMIN] Lấy tất cả đơn hàng */
export const getAllOrders = (params = {}) =>
  api.get("/orders/admin/all", { params }).then((r) => r.data);

/** [ADMIN] Lấy chi tiết đơn hàng */
export const getOrderByIdAdmin = (id) =>
  api.get(`/orders/admin/${id}`).then((r) => r.data);

/** [ADMIN] Cập nhật trạng thái đơn hàng */
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/admin/${id}/status`, { status }).then((r) => r.data);

/** [ADMIN] Thống kê đơn hàng */
export const getOrderStats = () =>
  api.get("/orders/admin/statistics").then((r) => r.data);

export default api;