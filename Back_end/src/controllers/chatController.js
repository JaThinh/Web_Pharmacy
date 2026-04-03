// Chat Controller - API endpoints cho chat
const db = require('../../db_config');
const chatService = require('../services/chatService'); // Biến này chưa được sử dụng, có thể bạn sẽ cần sau

// ============ ⭐️ BỔ SUNG: HÀM BUILD URL ẢNH ⭐️ ============
// (Hàm này đã được kiểm tra, an toàn hơn)
const buildProductImageUrl = (host, dbImage, dbImageUrl) => {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  console.log('🖼️ [chatController] Building image URL:', { 
    host, 
    dbImage, 
    dbImageUrl, 
    cloudinaryCloudName,
    hasCloudinary: !!(cloudinaryCloudName && cloudinaryCloudName !== 'your_cloud_name')
  });
  
  // Nếu dbImageUrl đã là full URL (bắt đầu bằng http), dùng luôn
  if (dbImageUrl && dbImageUrl.startsWith('http')) {
    console.log('✅ [chatController] Using existing full URL:', dbImageUrl);
    return dbImageUrl;
  }
  
  // Nếu dbImage đã là full URL, dùng luôn
  if (dbImage && dbImage.startsWith('http')) {
    console.log('✅ [chatController] Using existing full URL from dbImage:', dbImage);
    return dbImage;
  }
  
  // Ưu tiên Cloudinary - Chỉ build khi chưa có full URL
  if (cloudinaryCloudName && cloudinaryCloudName !== 'your_cloud_name' && dbImageUrl) {
    const cloudinaryBase = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/`;
    // Đảm bảo không bị lặp /
    const finalUrl = `${cloudinaryBase}${dbImageUrl.replace(/^\/+/, '')}`;
    console.log('✅ [chatController] Using Cloudinary URL:', finalUrl);
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


const chatController = {
  // ============ (Hàm 'getAllThreads' giữ nguyên) ============
  getAllThreads: async (req, res) => {
    try {
      const userRole = req.user.Role; // Auth middleware returns PascalCase

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ admin mới có thể xem tất cả cuộc hội thoại',
        });
      }

      // Lấy tất cả threads với thông tin user
      const threadsQuery = `
        SELECT 
          ct."Id" as id,
          ct."UserId" as user_id,
          ct."Title" as title,
          ct."Title" as subject,
          ct."Status" as status,
          ct."CreatedAt" as created_at,
          ct."UpdatedAt" as updated_at,
          u."Fullname" as user_name,
          u."Email" as user_email,
          u."Username" as username,
          (SELECT COUNT(*) FROM "ChatMessages" WHERE "ThreadId" = ct."Id") as message_count,
          (SELECT cm."Content" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1) as last_message,
          (SELECT cm."CreatedAt" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1) as last_message_at
        FROM "ChatThreads" ct
        JOIN "Users" u ON ct."UserId" = u."Id"
        ORDER BY 
          CASE WHEN ct."Status" = 'active' THEN 0 ELSE 1 END,
          COALESCE((SELECT cm."CreatedAt" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1), ct."CreatedAt") DESC
      `;

      const threadsResult = await db.query(threadsQuery);

      // Lấy thống kê
      const statsQueries = await Promise.all([
        db.query('SELECT COUNT(*) as total FROM "ChatThreads"'),
        db.query('SELECT COUNT(*) as active FROM "ChatThreads" WHERE "Status" = \'active\''),
        db.query('SELECT COUNT(*) as closed FROM "ChatThreads" WHERE "Status" = \'closed\''),
      ]);

      const stats = {
        total: parseInt(statsQueries[0].rows[0].total),
        active: parseInt(statsQueries[1].rows[0].active),
        closed: parseInt(statsQueries[2].rows[0].closed),
      };

      res.json({
        success: true,
        threads: threadsResult.rows,
        stats: stats,
      });
    } catch (error) {
      console.error('Lỗi lấy tất cả threads:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách cuộc hội thoại',
      });
    }
  },

  // ============ (Hàm 'getUserThreads' giữ nguyên) ============
  getUserThreads: async (req, res) => {
    try {
      const userId = req.user.Id; // PascalCase from auth middleware
      const userRole = req.user.Role; // PascalCase from auth middleware

      let query;
      let params;

      if (userRole === 'admin') {
      // Admin xem tất cả threads
        query = `
          SELECT 
            ct.*,
            u."Fullname" as "UserName",
            u."Username" as "Username",
            (SELECT COUNT(*) FROM "ChatMessages" WHERE "ThreadId" = ct."Id") as "MessageCount",
            (SELECT cm."Content" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1) as "LastMessage",
            (SELECT cm."CreatedAt" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1) as "LastMessageAt"
          FROM "ChatThreads" ct
          JOIN "Users" u ON ct."UserId" = u."Id"
          ORDER BY ct."UpdatedAt" DESC
        `;
        params = [];
      } else {
        // User chỉ xem threads của mình
        query = `
          SELECT 
            ct.*,
            (SELECT COUNT(*) FROM "ChatMessages" WHERE "ThreadId" = ct."Id") as "MessageCount",
            (SELECT cm."Content" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1) as "LastMessage",
            (SELECT cm."CreatedAt" FROM "ChatMessages" cm WHERE cm."ThreadId" = ct."Id" ORDER BY cm."CreatedAt" DESC LIMIT 1) as "LastMessageAt"
          FROM "ChatThreads" ct
          WHERE ct."UserId" = $1
          ORDER BY ct."UpdatedAt" DESC
        `;
        params = [userId];
      }

      const result = await db.query(query, params);

      res.json({
        success: true,
        threads: result.rows,
      });
    } catch (error) {
      console.error('Lỗi lấy threads:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách cuộc hội thoại',
      });
    }
  },

  // ============ (Hàm 'createThread' giữ nguyên) ============
  createThread: async (req, res) => {
    try {
      const { title, attachmentType, attachmentId } = req.body;
      const userId = req.user.Id; // PascalCase from auth middleware

      const query = `
        INSERT INTO "ChatThreads" ("UserId", "Title", "AttachmentType", "AttachmentId")
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await db.query(query, [
        userId,
        title || 'Hỏi ý kiến bác sĩ',
        attachmentType || 'general',
        attachmentId || null,
      ]);

      const thread = result.rows[0];

      // Lấy thông tin user từ database
      const userQuery = `SELECT "Fullname", "Username" FROM "Users" WHERE "Id" = $1`;
      const userResult = await db.query(userQuery, [userId]);
      const userName =
        userResult.rows[0]?.Fullname ||
        userResult.rows[0]?.Username ||
        'Unknown User';

      // Thông báo cho admin qua Socket.IO
      const io = req.app.get('io');
      console.log(`📢 [API] Emitting new_thread_notification to admin_room`);
      console.log(`   Thread ID: ${thread.Id}, User: ${userName}`);

      io.to('admin_room').emit('new_thread_notification', {
        threadId: thread.Id,
        userId: userId,
        userName: userName,
        title: thread.Title,
        createdAt: thread.CreatedAt,
      });

      console.log(`✅ Thread created successfully by ${userName}`);

      res.json({
        success: true,
        thread: thread,
      });
    } catch (error) {
      console.error('Lỗi tạo thread:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể tạo cuộc hội thoại',
      });
    }
  },

  // ============ ⭐️ SỬA: Hàm 'getThreadMessages' (Dùng hàm build ảnh mới) ⭐️ ============
  getThreadMessages: async (req, res) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.Id; // Sửa thành PascalCase
      const userRole = req.user.Role; // Sửa thành PascalCase

      // Kiểm tra quyền truy cập
      if (userRole !== 'admin') {
        const accessCheck = await db.query(
          'SELECT 1 FROM "ChatThreads" WHERE "Id" = $1 AND "UserId" = $2',
          [threadId, userId]
        );

        if (accessCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập cuộc hội thoại này',
          });
        }
      }

      const query = `
        SELECT 
          cm.*,
          u."Fullname" as "SenderName",
          u."Username" as "SenderUsername",
          p."Id" as "ProductId",
          p."ProductName" as "ProductName",
          p."Name" as "ProductNameAlt",
          p."Price" as "ProductPrice",
          p."ImageURL" as "ProductImage",
          p."Image" as "ProductImageAlt"
        FROM "ChatMessages" cm
        JOIN "Users" u ON cm."SenderId" = u."Id"
        LEFT JOIN "Products" p ON cm."AttachedProductId" = p."Id"
        WHERE cm."ThreadId" = $1
        ORDER BY cm."CreatedAt" ASC
      `;

      const result = await db.query(query, [threadId]);
      
      console.log('📦 Raw query result for thread', threadId, ':', result.rows.length, 'messages');
      
      // Sửa: Dùng hàm build URL
      const host = req.get('host');
      
      const messages = result.rows.map(row => {
        // Sửa: Dùng hàm build URL mới
        const imageUrl = buildProductImageUrl(host, row.ProductImageAlt, row.ProductImage);

        const productData = row.ProductId ? {
          id: row.ProductId,
          Id: row.ProductId, 
          name: row.ProductName || row.ProductNameAlt,
          ProductName: row.ProductName || row.ProductNameAlt, 
          price: parseFloat(row.ProductPrice || 0),
          ProductPrice: parseFloat(row.ProductPrice || 0), 
          // Sửa: Gán URL đã build
          image: imageUrl,
          ProductImage: imageUrl,
        } : null;
        
        if (productData) {
          console.log('✅ Product attached to message:', row.Id, '->', productData);
        }
        
        return {
          ...row,
          product: productData
        };
      });

      res.json({
        success: true,
        messages: messages,
      });
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy tin nhắn',
      });
    }
  },

  // ============ ⭐️ SỬA: Hàm 'sendMessage' (Fix lỗi admin gửi sản phẩm) ⭐️ ============
  sendMessage: async (req, res) => {
    try {
      const { threadId } = req.params;
      // Sửa: Lấy thêm 'attachedProductId'
      const { content, attachedProductId } = req.body;
      const userId = req.user.Id;
      const userRole = req.user.Role;

      // Sửa: Cho phép gửi nếu có content HOẶC có sản phẩm
      if ((!content || content.trim() === '') && !attachedProductId) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn hoặc sản phẩm không được để trống',
        });
      }

      // Kiểm tra quyền truy cập thread (giữ nguyên)
      if (userRole !== 'admin') {
        const accessCheck = await db.query(
          'SELECT 1 FROM "ChatThreads" WHERE "Id" = $1 AND "UserId" = $2',
          [threadId, userId]
        );

        if (accessCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập cuộc hội thoại này',
          });
        }
      }

      // Sửa: Thêm 'AttachedProductId' vào query
      const messageQuery = `
        INSERT INTO "ChatMessages" ("ThreadId", "SenderId", "SenderRole", "Content", "AttachedProductId")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const messageResult = await db.query(messageQuery, [
        threadId,
        userId,
        userRole,
        content.trim(),
        attachedProductId || null, // Sửa: Thêm tham số
      ]);
      const message = messageResult.rows[0];

      // Cập nhật thời gian thread (giữ nguyên)
      await db.query(
        'UPDATE "ChatThreads" SET "UpdatedAt" = NOW() WHERE "Id" = $1',
        [threadId]
      );

      // Lấy thông tin sender (giữ nguyên)
      const senderQuery = `
        SELECT "Fullname", "Username" FROM "Users" WHERE "Id" = $1
      `;
      const senderResult = await db.query(senderQuery, [userId]);
      const senderName =
        senderResult.rows[0]?.Fullname ||
        senderResult.rows[0]?.Username ||
        'Unknown';

      let productData = null;
      if (message.AttachedProductId) {
        const host = req.get('host');
        const productQuery = await db.query(
          'SELECT "Id", "ProductName", "Name", "ImageURL", "Image", "Price" FROM "Products" WHERE "Id" = $1',
          [message.AttachedProductId]
        );
        if (productQuery.rows[0]) {
          const p = productQuery.rows[0];
          const imageUrl = buildProductImageUrl(host, p.Image, p.ImageURL);
          productData = {
            id: p.Id,
            Id: p.Id,
            name: p.ProductName || p.Name,
            ProductName: p.ProductName || p.Name,
            image: imageUrl,
            ProductImage: imageUrl,
            price: parseFloat(p.Price || 0),
            ProductPrice: parseFloat(p.Price || 0)
          };
        }
      }

      // Gửi realtime qua Socket.IO
      const io = req.app.get('io');
      // Sửa: Gửi `product: productData` kèm theo
      io.to(`thread_${threadId}`).emit('new_message', {
        ...message,
        SenderName: senderName,
        product: productData, // Sửa: Thêm sản phẩm
      });

      console.log(
        `💬 Socket.IO: Emitted new_message to thread_${threadId}`,
        message
      );

      res.json({
        success: true,
        message: message,
      });
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể gửi tin nhắn',
      });
    }
  },
  // ============ ⭐️ KẾT THÚC SỬA ⭐️ ============

  // ============ (Hàm 'closeThread' giữ nguyên, sửa lại Role) ============
  closeThread: async (req, res) => {
    try {
      const { threadId } = req.params;
      const userRole = req.user.Role; // Sửa: Dùng PascalCase

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ admin mới có thể đóng cuộc hội thoại',
        });
      }

      await db.query(
        'UPDATE "ChatThreads" SET "Status" = $1, "UpdatedAt" = NOW() WHERE "Id" = $2',
        ['closed', threadId]
      );

      // Thông báo qua Socket.IO
      const io = req.app.get('io');
      io.to(`thread_${threadId}`).emit('thread_closed', {
        threadId,
        closedBy: req.user.Username || req.user.Id, // Sửa: Dùng PascalCase
      });

      res.json({
        success: true,
        message: 'Đã đóng cuộc hội thoại',
      });
    } catch (error) {
      console.error('Lỗi đóng thread:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể đóng cuộc hội thoại',
      });
    }
  },

  // ============ (Hàm 'getChatStats' giữ nguyên, sửa lại Role) ============
  getChatStats: async (req, res) => {
    try {
      const userRole = req.user.Role; // Sửa: Dùng PascalCase

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ admin mới có thể xem thống kê',
        });
      }

      const stats = await Promise.all([
        // Tổng số threads
        db.query('SELECT COUNT(*) as total FROM "ChatThreads"'),
        // Threads đang hoạt động
        db.query(
          'SELECT COUNT(*) as active FROM "ChatThreads" WHERE "Status" = $1',
          ['active']
        ),
        // Threads hôm nay
        db.query(
          'SELECT COUNT(*) as today FROM "ChatThreads" WHERE DATE("CreatedAt") = CURRENT_DATE'
        ),
        // Tổng tin nhắn
        db.query('SELECT COUNT(*) as total FROM "ChatMessages"'),
        // Threads chưa trả lời (chỉ có tin nhắn từ customer)
        db.query(`
          SELECT COUNT(*) as unanswered FROM "ChatThreads" ct
          WHERE ct."Status" = 'active' 
          AND NOT EXISTS (
            SELECT 1 FROM "ChatMessages" cm 
            WHERE cm."ThreadId" = ct."Id" AND cm."SenderRole" = 'admin'
          )
        `),
      ]);

      res.json({
        success: true,
        stats: {
          totalThreads: parseInt(stats[0].rows[0].total),
          activeThreads: parseInt(stats[1].rows[0].active),
          todayThreads: parseInt(stats[2].rows[0].today),
          totalMessages: parseInt(stats[3].rows[0].total),
          unansweredThreads: parseInt(stats[4].rows[0].unanswered),
        },
      });
    } catch (error) {
      console.error('Lỗi lấy thống kê:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy thống kê',
      });
    }
  },
};

module.exports = chatController;