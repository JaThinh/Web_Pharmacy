# 📚 API DOCUMENTATION - PHARMACY BACKEND

> **Base URL:** `http://localhost:5001/api`  
> **Swagger Docs:** `http://localhost:5001/api-docs`

---

## 🔐 AUTHENTICATION

### 1. Đăng ký tài khoản
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (optional)",
  "password": "string (required)",
  "fullname": "string (optional)",
  "email": "string (required)",
  "phone": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": 1,
    "username": "user123",
    "fullname": "Nguyen Van A",
    "email": "user@example.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "user123",
    "fullname": "Nguyen Van A",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

---

### 3. Tạo Admin (Chỉ 1 lần)
```http
POST /api/auth/admin-init
Content-Type: application/json

{
  "email": "admin@pharmacy.com",
  "password": "admin123",
  "fullname": "Administrator (optional)"
}
```

**Response:**
```json
{
  "message": "Admin đã tạo",
  "admin": {
    "Id": 1,
    "Username": "admin",
    "Fullname": "Quản trị viên",
    "Email": "admin@pharmacy.com",
    "Role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🛍️ PRODUCTS (Sản phẩm)

### 4. Lấy danh sách sản phẩm (Public)
```http
GET /api/products?category=thuoc&search=paracetamol&page=1&limit=20
```

**Query Parameters:**
- `category`: string - Lọc theo danh mục (thuoc, vitamin, cham-soc, thiet-bi)
- `search`: string - Tìm kiếm theo tên sản phẩm
- `page`: integer - Số trang (default: 1)
- `limit`: integer - Số sản phẩm mỗi trang (default: 20)

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Paracetamol 500mg",
      "slug": "paracetamol-500mg",
      "shortDesc": "Thuốc giảm đau, hạ sốt",
      "category": "thuoc",
      "brand": "Hasan",
      "image": "paracetamol.jpg",
      "imageUrl": "https://res.cloudinary.com/.../paracetamol.jpg",
      "price": 15000,
      "stock": 100,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

---

### 5. Lấy chi tiết sản phẩm (Public)
```http
GET /api/products/:id
```

**Response:**
```json
{
  "id": 1,
  "name": "Paracetamol 500mg",
  "slug": "paracetamol-500mg",
  "shortDesc": "Thuốc giảm đau, hạ sốt",
  "description": "Mô tả chi tiết...",
  "category": "thuoc",
  "brand": "Hasan",
  "image": "paracetamol.jpg",
  "imageUrl": "https://res.cloudinary.com/.../paracetamol.jpg",
  "price": 15000,
  "stock": 100,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### 6. Lấy sản phẩm nổi bật ngẫu nhiên (Public)
```http
GET /api/products/featured
```

---

### 7. Lấy tất cả sản phẩm - Admin
```http
GET /api/products/admin/all?category=thuoc&search=paracetamol&page=1&limit=20
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 8. Tạo sản phẩm mới - Admin
```http
POST /api/products/admin
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Vitamin C 1000mg",
  "shortDesc": "Tăng cường sức đề kháng",
  "description": "Mô tả chi tiết...",
  "category": "vitamin",
  "brand": "DHG Pharma",
  "image": "vitamin-c.jpg",
  "price": 120000,
  "stock": 50
}
```
**Yêu cầu:** Role = `admin`

---

### 9. Cập nhật sản phẩm - Admin
```http
PATCH /api/products/admin/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Vitamin C 1000mg (Updated)",
  "price": 130000,
  "stock": 60,
  "isActive": true
}
```
**Yêu cầu:** Role = `admin`

---

### 10. Bật/tắt trạng thái sản phẩm - Admin
```http
PATCH /api/products/admin/:id/toggle
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 11. Xóa sản phẩm (Soft delete) - Admin
```http
DELETE /api/products/admin/:id
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

## 🛒 CART (Giỏ hàng)

### 12. Xem giỏ hàng
```http
GET /api/cart
Authorization: Bearer {token}
```

**Response:**
```json
{
  "cart": [
    {
      "id": 1,
      "userId": 1,
      "productId": 1,
      "productName": "Paracetamol 500mg",
      "price": 15000,
      "quantity": 2,
      "imageUrl": "https://...",
      "stock": 100
    }
  ],
  "total": 30000
}
```

---

### 13. Thêm vào giỏ hàng
```http
POST /api/cart/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

---

### 14. Cập nhật số lượng trong giỏ
```http
PATCH /api/cart/items/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 5
}
```

---

### 15. Xóa sản phẩm khỏi giỏ
```http
DELETE /api/cart/items/:id
Authorization: Bearer {token}
```

---

## 📦 ORDERS (Đơn hàng)

### 16. Đặt hàng (Checkout)
```http
POST /api/orders/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullname": "Nguyen Van A",
  "phone": "0912345678",
  "address": "123 Le Loi, Q1, TP.HCM",
  "notes": "Giao giờ hành chính"
}
```

**Response:**
```json
{
  "message": "Đặt hàng thành công",
  "order": {
    "id": 1,
    "orderCode": "ORD20250112001",
    "userId": 1,
    "fullname": "Nguyen Van A",
    "phone": "0912345678",
    "address": "123 Le Loi, Q1, TP.HCM",
    "totalAmount": 150000,
    "status": "pending",
    "createdAt": "2025-01-12T00:00:00.000Z"
  }
}
```

---

### 17. Lấy danh sách đơn hàng của user
```http
GET /api/orders
Authorization: Bearer {token}
```

---

### 18. Lấy chi tiết đơn hàng
```http
GET /api/orders/:id
Authorization: Bearer {token}
```

---

### 19. Hủy đơn hàng
```http
PATCH /api/orders/:id/cancel
Authorization: Bearer {token}
```

---

### 20. Lấy thống kê đơn hàng - Admin
```http
GET /api/orders/admin/statistics
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 21. Lấy tất cả đơn hàng - Admin
```http
GET /api/orders/admin/all
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 22. Lấy chi tiết đơn hàng - Admin
```http
GET /api/orders/admin/:id
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 23. Cập nhật trạng thái đơn hàng - Admin
```http
PATCH /api/orders/admin/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shipping"
}
```
**Giá trị status:** `pending`, `confirmed`, `shipping`, `delivered`, `cancelled`  
**Yêu cầu:** Role = `admin`

---

## 👤 USERS (Người dùng)

### 24. Lấy thông tin cá nhân
```http
GET /api/users/me
Authorization: Bearer {token}
```

---

### 25. Cập nhật thông tin cá nhân
```http
PATCH /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullname": "Nguyen Van B",
  "phone": "0987654321",
  "address": "456 Nguyen Hue, Q1, TP.HCM"
}
```

---

### 26. Đổi mật khẩu
```http
PATCH /api/users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

---

### 27. Lấy danh sách tất cả users - Admin
```http
GET /api/users/admin/all
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 28. Lấy chi tiết 1 user - Admin
```http
GET /api/users/admin/:id
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 29. Cập nhật user - Admin
```http
PATCH /api/users/admin/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullname": "Updated Name",
  "phone": "0999999999",
  "role": "admin"
}
```
**Yêu cầu:** Role = `admin`

---

### 30. Xóa user - Admin
```http
DELETE /api/users/admin/:id
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

## 📢 ANNOUNCEMENTS (Thông báo)

### 31. Lấy danh sách thông báo (Public)
```http
GET /api/announcements
```

---

## ⭐ COMMENTS (Đánh giá)

### 32. Lấy đánh giá của sản phẩm (Public)
```http
GET /api/comments/:productId
```

---

### 33. Kiểm tra quyền đánh giá
```http
GET /api/comments/check/:productId
Authorization: Bearer {token}
```

---

### 34. Thêm đánh giá mới
```http
POST /api/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "rating": 5,
  "comment": "Sản phẩm tốt, giao hàng nhanh!"
}
```

---

### 35. Xóa đánh giá (Admin hoặc chủ comment)
```http
DELETE /api/comments/:id
Authorization: Bearer {token}
```

---

## 🏥 DISEASES (Bệnh lý)

### 36. Tìm kiếm bệnh theo từ khóa (Public)
```http
GET /api/diseases?q=covid
```

---

### 37. Lấy chi tiết bệnh theo slug (Public)
```http
GET /api/diseases/slug/:slug
```

---

## 💬 CHAT (Hỗ trợ trực tuyến)

### 38. Lấy danh sách thread của user
```http
GET /api/chat/threads
Authorization: Bearer {token}
```

---

### 39. Lấy tất cả thread - Admin
```http
GET /api/chat/admin/threads
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 40. Tạo thread mới
```http
POST /api/chat/threads
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Hỏi về sản phẩm Vitamin C",
  "attachmentType": "product",
  "attachmentId": "1"
}
```

---

### 41. Lấy tin nhắn trong thread
```http
GET /api/chat/threads/:threadId/messages
Authorization: Bearer {token}
```

---

### 42. Gửi tin nhắn
```http
POST /api/chat/threads/:threadId/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Xin chào, tôi muốn hỏi về sản phẩm này"
}
```

---

### 43. Đóng thread - Admin
```http
PATCH /api/chat/threads/:threadId/close
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

### 44. Thống kê chat - Admin
```http
GET /api/chat/stats
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

## 📊 DASHBOARD (Admin)

### 45. Lấy thống kê tổng quan - Admin
```http
GET /api/dashboard/statistics
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

**Response:**
```json
{
  "totalRevenue": 15000000,
  "totalOrders": 120,
  "totalProducts": 50,
  "totalUsers": 80,
  "recentOrders": [...],
  "topProducts": [...]
}
```

---

### 46. Lấy dữ liệu biểu đồ doanh thu - Admin
```http
GET /api/dashboard/revenue-chart?period=week
Authorization: Bearer {token}
```
**Query Parameters:**
- `period`: string - `week`, `month`, `year`

**Yêu cầu:** Role = `admin`

---

## 📸 UPLOAD (Cloudinary)

### 47. Upload ảnh sản phẩm - Admin
```http
POST /api/upload/product
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "image": File,
  "productId": "123 (optional)"
}
```
**Yêu cầu:** Role = `admin`

**Response:**
```json
{
  "success": true,
  "message": "Upload ảnh sản phẩm thành công!",
  "imageUrl": "https://res.cloudinary.com/.../product_123.jpg",
  "publicId": "pharmacy/products/product_123",
  "fileName": "vitamin-c.jpg"
}
```

---

### 48. Upload avatar user
```http
POST /api/upload/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "avatar": File
}
```

---

### 49. Upload nhiều ảnh - Admin
```http
POST /api/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "images": [File, File, File],
  "folder": "pharmacy/misc (optional)"
}
```
**Yêu cầu:** Role = `admin`  
**Giới hạn:** Tối đa 10 ảnh

---

### 50. Xóa ảnh từ Cloudinary - Admin
```http
DELETE /api/upload/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "publicId": "pharmacy/products/product_123 (optional)"
}
```
**Yêu cầu:** Role = `admin`

---

### 51. Test Cloudinary connection - Admin
```http
GET /api/upload/test
Authorization: Bearer {token}
```
**Yêu cầu:** Role = `admin`

---

## 🔑 AUTHENTICATION HEADERS

Tất cả các API có đánh dấu **Authorization** cần gửi kèm JWT token trong header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 STATUS CODES

| Code | Meaning |
|------|---------|
| 200  | OK - Thành công |
| 201  | Created - Tạo mới thành công |
| 400  | Bad Request - Dữ liệu không hợp lệ |
| 401  | Unauthorized - Chưa đăng nhập hoặc token không hợp lệ |
| 403  | Forbidden - Không có quyền truy cập |
| 404  | Not Found - Không tìm thấy |
| 409  | Conflict - Dữ liệu bị trùng lặp |
| 500  | Internal Server Error - Lỗi server |

---

## 🧪 TEST VỚI POSTMAN

### Bước 1: Tạo Admin
```http
POST http://localhost:5001/api/auth/admin-init
Content-Type: application/json

{
  "email": "admin@pharmacy.com",
  "password": "admin123"
}
```

**Lưu token từ response**

---

### Bước 2: Login Admin
```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@pharmacy.com",
  "password": "admin123"
}
```

**Copy token từ response**

---

### Bước 3: Test API Product Admin
```http
PATCH http://localhost:5001/api/products/admin/1
Authorization: Bearer {paste_token_here}
Content-Type: application/json

{
  "name": "Paracetamol 500mg Updated",
  "price": 20000,
  "stock": 150
}
```

---

## 🔧 ENVIRONMENT VARIABLES

Tạo file `.env` trong thư mục `Back_end/`:

```env
PORT=5001
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/pharmacy_db

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🚀 START SERVER

```bash
cd Back_end
npm install
npm start
```

Server sẽ chạy tại: `http://localhost:5001`

---

## 📌 NOTES

1. **Admin APIs** yêu cầu `Role = admin` trong JWT token
2. **User APIs** yêu cầu đăng nhập (có token hợp lệ)
3. **Public APIs** không cần authentication
4. Token có thời hạn **1 ngày** (24h)
5. Upload file size tối đa: **10MB**

---

**Made with ❤️ by Pharmacy Team**
