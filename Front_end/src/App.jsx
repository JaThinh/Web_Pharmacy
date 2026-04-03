import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login/Login.jsx";
import Register from "./pages/auth/Login/Register.jsx";
import Shop from "./pages/user/Shop/Shop.jsx";
import ProductDetail from "./pages/user/ProductDetail/ProductDetail.jsx";
import Profile from "./pages/user/Profile/Profile.jsx";
import Cart from "./pages/user/Cart/Cart.jsx";
import Orders from "./pages/user/Orders/Orders.jsx";
import OrderDetail from "./pages/user/OrderDetail/OrderDetail.jsx";
import Checkout from "./pages/user/Checkout/Checkout.jsx";
import CheckoutSuccess from "./pages/user/Checkout/CheckoutSuccess.jsx";
import Diseases from "./pages/user/Diseases/Diseases.jsx";
import DiseaseDetail from "./pages/user/DiseaseDetail/DiseaseDetail.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import UserLayout from "./components/UserLayout/UserLayout.jsx";
import AdminLayout from "./components/AdminLayout/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard.jsx";
import MedicineManagement from "./pages/admin/AdminDashboard/MedicineManagement.jsx";
import AdminChatManagement from "./pages/admin/AdminChatManagement/AdminChatManagement.jsx";
import UserManagement from "./pages/admin/UserManagement/UserManagement.jsx";
import OrderManagement from "./pages/admin/OrderManagement/OrderManagement.jsx";
import EventPage from "./pages/user/EventPage/EventPage.jsx";

// CÁC IMPORT CHO TRANG TĨNH & THÔNG TIN
import AboutPage from "./pages/info/AboutPage.jsx";
import PrivacyPage from "./pages/info/PrivacyPage.jsx";
import StoreSystem from "./pages/info/StoreSystem.jsx"; // <-- Đã thêm Import StoreSystem

export default function App() {
  return (
    <Routes>
      {/* Auth - Không có layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="medicines" element={<MedicineManagement />} />
        <Route path="chat" element={<AdminChatManagement />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* User Routes - Có Header & Footer */}
      <Route
        path="/shop"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Shop />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/product/:id"
        element={
          <ProtectedRoute>
            <UserLayout>
              <ProductDetail />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Cart />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Orders />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <UserLayout>
              <OrderDetail />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Checkout />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/checkout/success"
        element={
          <ProtectedRoute>
            <UserLayout>
              <CheckoutSuccess />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Profile />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/diseases"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Diseases />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/diseases/:slug"
        element={
          <ProtectedRoute>
            <UserLayout>
              <DiseaseDetail />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event"
        element={
          <ProtectedRoute>
            <UserLayout>
              <EventPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      {/* ===== CÁC ROUTE CHO TRANG TĨNH ===== */}
      
      {/* Trang Giới Thiệu */}
      <Route
        path="/gioi-thieu" 
        element={
          <ProtectedRoute>
            <UserLayout>
              <AboutPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Trang Chính Sách Bảo Mật */}
      <Route
        path="/chinh-sach-bao-mat"
        element={
          <ProtectedRoute>
            <UserLayout>
              <PrivacyPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      {/* Trang Hệ Thống Cửa Hàng */}
      <Route
        path="/he-thong-cua-hang"
        element={
          <ProtectedRoute>
            <UserLayout>
              <StoreSystem />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      {/* ==================================== */}


      {/* Mặc định - User chưa login → /login, User đã login → /shop */}
      <Route path="/" element={<Navigate to="/shop" replace />} />
      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
}