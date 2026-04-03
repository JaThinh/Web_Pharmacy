const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const cors = require("cors");

dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file!');
  // Don't exit, just warn
}

const app = express();
const server = http.createServer(app);
// ...existing code...

// CORS Origins - Local development only
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Frontend URLs
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Tăng giới hạn body size để hỗ trợ upload avatar (base64)
// 10MB cho JSON body (đủ cho ảnh base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Make io accessible to routes
app.set('io', io);

// Serve static images (so backend can serve product images if needed)
// Place your images under Back_end/public/images/products/
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const userRoutes = require("./src/routes/userRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const commentRoutes = require("./src/routes/commentRoutes");
const diseaseRoutes = require("./src/routes/diseaseRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

// ... import các routes cho payment
const paymentRoutes = require('./src/routes/paymentRoutes');

// Xác thực
app.use("/api/auth", authRoutes);
// Sản phẩm
app.use("/api/products", productRoutes);
// Giỏ hàng
app.use("/api/cart", cartRoutes);
// Đơn hàng
app.use("/api/orders", orderRoutes);
// Người dùng
app.use("/api/users", userRoutes);
// Thông báo
app.use("/api/announcements", announcementRoutes);
// Đánh giá sản phẩm
app.use("/api/comments", commentRoutes);
// Tra cứu bệnh
app.use("/api/diseases", diseaseRoutes);
// chat
app.use("/api/chat", chatRoutes);
// Dashboard admin
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes); // 📸 Cloudinary upload routes
// Payment routes
app.use('/api/payment', paymentRoutes);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pharmacy API",
      version: "1.0.0",
      description: "API cho website hiệu thuốc trực tuyến",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [
    path.join(__dirname, "./src/routes/*.js"),
    path.join(__dirname, "./src/controllers/*.js")
  ],
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// Default route
app.get("/", (req, res) => res.send("Pharmacy backend is running..."));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Socket.IO Chat Implementation
const chatService = require("./src/services/chatService");
chatService.initializeSocketIO(io);

server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  console.log(`📑 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`💬 Socket.IO Chat đã sẵn sàng`);
});


