const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
    console.log('🔐 Token decoded:', decoded);
    
    // Normalize: token có thể là { id, role } (lowercase) hoặc { Id, Role } (PascalCase)
    // Ưu tiên PascalCase (chuẩn mới), fallback sang lowercase (chuẩn cũ)
    req.user = {
      Id: decoded.Id || decoded.id,
      Role: decoded.Role || decoded.role,
      // Thêm các field khác nếu có
      Username: decoded.Username || decoded.username,
      Email: decoded.Email || decoded.email
    };
    
    console.log('✅ User authenticated:', req.user);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
};

// --- BỔ SUNG MIDDLEWARE KIỂM TRA ADMIN ---
const isAdmin = (req, res, next) => {
  // Middleware này phải chạy SAU authenticateToken
  if (req.user && req.user.Role === 'admin') {
    // Nếu đúng là admin, cho đi tiếp
    next();
  } else {
    // Nếu không phải admin (hoặc req.user không tồn tại)
    console.log('ADMIN CHECK FAILED: User is not admin', req.user);
    return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
  }
};
// --- HẾT PHẦN BỔ SUNG ---

module.exports = {
  authenticateToken,
  isAdmin 
};