// Chat Service - Xử lý Socket.IO và realtime messaging
const jwt = require('jsonwebtoken');
const db = require('../../db_config');

// ============ ⭐️ BỔ SUNG: HÀM BUILD URL ẢNH ⭐️ ============
// (Giả sử file .env đã được load ở index.js)
const buildProductImageUrl = (host, dbImage, dbImageUrl) => {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  console.log('🖼️ [chatService] Building image URL:', { 
    host, 
    dbImage, 
    dbImageUrl, 
    cloudinaryCloudName,
    hasCloudinary: !!(cloudinaryCloudName && cloudinaryCloudName !== 'your_cloud_name')
  });
  
  // Nếu dbImageUrl đã là full URL (bắt đầu bằng http), dùng luôn
  if (dbImageUrl && dbImageUrl.startsWith('http')) {
    console.log('✅ [chatService] Using existing full URL:', dbImageUrl);
    return dbImageUrl;
  }
  
  // Nếu dbImage đã là full URL, dùng luôn
  if (dbImage && dbImage.startsWith('http')) {
    console.log('✅ [chatService] Using existing full URL from dbImage:', dbImage);
    return dbImage;
  }
  
  // Ưu tiên Cloudinary (dựa theo README.md) - Chỉ build khi chưa có full URL
  if (cloudinaryCloudName && cloudinaryCloudName !== 'your_cloud_name' && dbImageUrl) {
    // dbImageUrl có thể lưu 'v176.../abc.jpg'
    const cloudinaryBase = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/`;
    const finalUrl = `${cloudinaryBase}${dbImageUrl.replace(/^\/+/, '')}`;
    console.log('✅ [chatService] Using Cloudinary URL:', finalUrl);
    return finalUrl;
  }
  
  // Dùng ảnh local
  if (dbImage) {
    const protocol = (host && host.startsWith('localhost')) ? 'http' : 'https';
    const localBaseUrl = `${protocol}://${host}/images/`;
    
    if (dbImage.startsWith('http')) return dbImage; // Nếu đã là link
    return `${localBaseUrl}${dbImage.replace(/^\/+/, '')}`; // Build link local
  }

  // Fallback
  const protocol = (host && host.startsWith('localhost')) ? 'http' : 'http';
  const localBaseUrl = `${protocol}://${host}/images/`;
  return `${localBaseUrl}default.jpg`;
};
// ============ ⭐️ KẾT THÚC BỔ SUNG ⭐️ ============


class ChatService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socketId
    this.adminSockets = new Set(); // Tập hợp socket của admin
  }

  // Khởi tạo Socket.IO
  initializeSocketIO(io) {
    this.io = io;

    io.on('connection', async (socket) => {
      // Xác thực user khi kết nối
      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
          const user = await this.getUserById(decoded.Id || decoded.id);
          
          if (user) {
            socket.userId = user.Id;
            socket.userRole = user.Role;
            socket.userName = user.Fullname || user.Username;

            // Lưu thông tin user
            this.connectedUsers.set(user.Id, socket.id);
            
            if (user.Role === 'admin') {
              this.adminSockets.add(socket.id);
              socket.join('admin_room');
              console.log(`👨‍💼 Admin ${user.Username} joined admin_room`);
            }

            socket.emit('authenticated', {
              success: true,
              user: {
                id: user.Id,
                name: user.Fullname || user.Username,
                role: user.Role
              }
            });
          } else {
            socket.emit('authenticated', { success: false, error: 'Người dùng không tồn tại' });
          }
        } catch (error) {
          socket.emit('authenticated', { success: false, error: 'Token không hợp lệ' });
        }
      });

      // Tạo chat thread mới
      socket.on('create_chat_thread', async (data) => {
        try {
          if (!socket.userId) return;

          const thread = await this.createChatThread({
            userId: socket.userId,
            title: data.title || 'Hỏi ý kiến bác sĩ',
            attachmentType: data.attachmentType || 'general',
            attachmentId: data.attachmentId || null
          });

          socket.join(`thread_${thread.Id}`);
          socket.emit('thread_created', thread);

          // Thông báo cho admin có thread mới
          socket.broadcast.to('admin_room').emit('new_thread_notification', {
            threadId: thread.Id,
            userId: socket.userId,
            userName: socket.userName,
            title: thread.Title,
            createdAt: thread.CreatedAt
          });

          console.log(`✅ New thread notification sent to admins`);

        } catch (error) {
          console.error('❌ Error creating chat thread:', error);
          socket.emit('error', { message: 'Không thể tạo cuộc hội thoại' });
        }
      });

      // Join thread
      socket.on('join_thread', async (threadId) => {
        try {
          if (!socket.userId) return;

          // Kiểm tra quyền truy cập thread
          const hasAccess = await this.checkThreadAccess(threadId, socket.userId, socket.userRole);
          if (!hasAccess) {
            socket.emit('error', { message: 'Không có quyền truy cập cuộc hội thoại này' });
            return;
          }

          socket.join(`thread_${threadId}`);
          
          // ============ ⭐️ SỬA: Lấy host ⭐️ ============
          // Lấy host từ socket để build URL
          const host = socket.handshake.headers.host;
          // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============

          // Lấy lịch sử tin nhắn
          // ============ ⭐️ SỬA: Truyền host vào ⭐️ ============
          const messages = await this.getThreadMessages(threadId, host);
          // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============
          socket.emit('thread_messages', { threadId, messages });

        } catch (error) {
          socket.emit('error', { message: 'Không thể tham gia cuộc hội thoại' });
        }
      });

      // Gửi tin nhắn
      socket.on('send_message', async (data) => {
        try {
          if (!socket.userId) return;

          // ============ ⭐️ SỬA: Lấy host ⭐️ ============
          const host = socket.handshake.headers.host;
          // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============

          const message = await this.createMessage({
            threadId: data.threadId,
            senderId: socket.userId,
            senderRole: socket.userRole,
            content: data.content,
            attachedProductId: data.attachedProductId || null
          });

          // Nếu có sản phẩm đính kèm, lấy thông tin sản phẩm
          let productData = null;
          if (data.attachedProductId) {
            const productQuery = await db.query(
              'SELECT "Id", "ProductName", "Name", "ImageURL", "Image", "Price" FROM public."Products" WHERE "Id" = $1',
              [data.attachedProductId]
            );
            if (productQuery.rows[0]) {
              const p = productQuery.rows[0];

              console.log('📦 [Socket] Product from DB:', { Id: p.Id, Image: p.Image, ImageURL: p.ImageURL });

              // ============ ⭐️ SỬA: Build URL ảnh ⭐️ ============
              const imageUrl = buildProductImageUrl(host, p.Image, p.ImageURL);
              console.log('🖼️ [Socket] Final image URL:', imageUrl);
              // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============
              
              productData = {
                id: p.Id,
                Id: p.Id,
                name: p.ProductName || p.Name,
                ProductName: p.ProductName || p.Name,
                // ============ ⭐️ SỬA: Gán URL ⭐️ ============
                image: imageUrl,
                ProductImage: imageUrl,
                // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============
                price: parseFloat(p.Price || 0),
                ProductPrice: parseFloat(p.Price || 0)
              };
              console.log('✅ Product data loaded for socket message:', productData);
            } else {
              console.warn('⚠️ Product not found:', data.attachedProductId);
            }
          }

          // Gửi tin nhắn cho tất cả thành viên trong thread
          io.to(`thread_${data.threadId}`).emit('new_message', {
            ...message,
            senderName: socket.userName,
            product: productData
          });

          // Nếu user gửi (không phải admin), thông báo cho admin
          if (socket.userRole !== 'admin') {
            socket.broadcast.to('admin_room').emit('new_user_message', {
              threadId: data.threadId,
              message: message,
              senderName: socket.userName,
              userId: socket.userId,
              product: productData
            });
            
            // ============ ⭐️ SỬA: XÓA 4 DÒNG SAU ĐỂ TRÁNH LẶP TIN NHẮN ⭐️ ============
            /*
            // Emit new_message riêng cho admin để cập nhật UI
            socket.broadcast.to('admin_room').emit('new_message', {
              ...message,
              senderName: socket.userName,
              product: productData
            });
            */
            // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============
          }

        } catch (error) {
          console.error('❌ Error sending message:', error);
          socket.emit('error', { message: 'Không thể gửi tin nhắn' });
        }
      });

      // Admin join all active threads
      socket.on('admin_join_all_threads', async () => {
        try {
          if (socket.userRole !== 'admin') return;

          const activeThreads = await this.getActiveThreads();
          
          activeThreads.forEach(thread => {
            socket.join(`thread_${thread.Id}`);
          });

          // Đảm bảo admin ở trong admin_room
          socket.join('admin_room');

          socket.emit('admin_threads_joined', activeThreads);
        } catch (error) {
          console.error('❌ Error joining threads:', error);
          socket.emit('error', { message: 'Không thể tham gia các cuộc hội thoại' });
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        socket.broadcast.to(`thread_${data.threadId}`).emit('user_typing', {
          userId: socket.userId,
          userName: socket.userName,
          threadId: data.threadId
        });
      });

      socket.on('stop_typing', (data) => {
        socket.broadcast.to(`thread_${data.threadId}`).emit('user_stop_typing', {
          userId: socket.userId,
          threadId: data.threadId
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
        
        if (socket.userRole === 'admin') {
          this.adminSockets.delete(socket.id);
        }
      });
    });
  }

  // Database methods
  async getUserById(userId) {
    const result = await db.query('SELECT * FROM public."Users" WHERE "Id" = $1', [userId]);
    return result.rows[0];
  }

  async createChatThread(data) {
    const query = `
      INSERT INTO public."ChatThreads" ("UserId", "Title", "AttachmentType", "AttachmentId")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [data.userId, data.title, data.attachmentType, data.attachmentId]);
    return result.rows[0];
  }

  async createMessage(data) {
    const query = `
      INSERT INTO public."ChatMessages" ("ThreadId", "SenderId", "SenderRole", "Content", "AttachedProductId")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [
      data.threadId, 
      data.senderId, 
      data.senderRole, 
      data.content,
      data.attachedProductId || null
    ]);
    return result.rows[0];
  }

  // ============ ⭐️ SỬA: Thêm 'host' vào tham số ⭐️ ============
  async getThreadMessages(threadId, host) {
  // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============
    const query = `
      SELECT 
        cm.*,
        u."Fullname" as "SenderName",
        u."Username" as "SenderUsername",
        p."Id" as "ProductId",
        p."ProductName" as "ProductName",
        p."Name" as "ProductNameAlt",
        p."ImageURL" as "ProductImage",
        p."Image" as "ProductImageAlt",
        p."Price" as "ProductPrice"
      FROM public."ChatMessages" cm
      JOIN public."Users" u ON cm."SenderId" = u."Id"
      LEFT JOIN public."Products" p ON cm."AttachedProductId" = p."Id"
      WHERE cm."ThreadId" = $1
      ORDER BY cm."CreatedAt" ASC
    `;
    const result = await db.query(query, [threadId]);
    
    console.log('📦 getThreadMessages - Raw result:', result.rows.length, 'messages');
    
    // Format lại messages với object product đầy đủ
    return result.rows.map(row => {
      // ============ ⭐️ SỬA: Build URL ảnh ⭐️ ============
      const imageUrl = buildProductImageUrl(host, row.ProductImageAlt, row.ProductImage);
      // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============

      const productData = row.ProductId ? {
        id: row.ProductId,
        Id: row.ProductId,
        name: row.ProductName || row.ProductNameAlt,
        ProductName: row.ProductName || row.ProductNameAlt,
        // ============ ⭐️ SỬA: Gán URL ⭐️ ============
        image: imageUrl,
        ProductImage: imageUrl,
        // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============
        price: parseFloat(row.ProductPrice || 0),
        ProductPrice: parseFloat(row.ProductPrice || 0)
      } : null;
      
      if (productData) {
        console.log('✅ Socket message with product:', row.Id, '->', productData);
      }
      
      return {
        ...row,
        product: productData
      };
    });
  }

  async checkThreadAccess(threadId, userId, userRole) {
    if (userRole === 'admin') return true;
    
    const query = 'SELECT 1 FROM public."ChatThreads" WHERE "Id" = $1 AND "UserId" = $2';
    const result = await db.query(query, [threadId, userId]);
    return result.rows.length > 0;
  }

  async getActiveThreads() {
    const query = `
      SELECT 
        ct.*,
        u."Fullname" as "UserName",
        u."Username" as "Username"
      FROM public."ChatThreads" ct
      JOIN public."Users" u ON ct."UserId" = u."Id"
      WHERE ct."Status" = 'active'
      ORDER BY ct."UpdatedAt" DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  // Utility methods
  sendNotificationToAdmins(event, data) {
    this.adminSockets.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
    });
  }

  getUserSocketId(userId) {
    return this.connectedUsers.get(userId);
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = new ChatService();