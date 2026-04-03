const db = require('../../db_config');

// =================== GET COMMENTS BY PRODUCT ===================
const getCommentsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Lấy tất cả comments (cả gốc và reply)
    const query = `
      SELECT
        c."Id",
        c."UserId",
        c."ProductId",
        c."OrderId",
        c."ParentId",
        c."Rating",
        c."Content",
        c."CreatedAt",
        c."UpdatedAt",
        u."Username",
        u."Fullname",
        o."Code" as "OrderCode"
      FROM "Comments" c
      JOIN "Users" u ON c."UserId" = u."Id"
      LEFT JOIN "Orders" o ON c."OrderId" = o."Id"
      WHERE c."ProductId" = $1
      ORDER BY
        CASE WHEN c."ParentId" IS NULL THEN c."CreatedAt" END DESC,
        c."ParentId",
        c."CreatedAt" ASC
    `;

    const result = await db.query(query, [productId]);

    // Tính rating trung bình chỉ từ comments gốc (có rating)
    const avgQuery = `
      SELECT
        COALESCE(AVG("Rating"), 0) as "AverageRating",
        COUNT(*) as "TotalComments"
      FROM "Comments"
      WHERE "ProductId" = $1 AND "ParentId" IS NULL AND "Rating" IS NOT NULL
    `;
    const avgResult = await db.query(avgQuery, [productId]);

    // Tổ chức comments thành nested structure
    const commentsMap = new Map();
    const rootComments = [];

    // Đầu tiên, tạo map của tất cả comments
    result.rows.forEach(comment => {
      commentsMap.set(comment.Id, {
        ...comment,
        replies: []
      });
    });

    // Sau đó, tổ chức thành tree structure
    result.rows.forEach(comment => {
      if (comment.ParentId) {
        // Đây là reply
        const parent = commentsMap.get(comment.ParentId);
        if (parent) {
          parent.replies.push(commentsMap.get(comment.Id));
        }
      } else {
        // Đây là comment gốc
        rootComments.push(commentsMap.get(comment.Id));
      }
    });

    res.json({
      comments: rootComments,
      averageRating: parseFloat(avgResult.rows[0].AverageRating).toFixed(1),
      totalComments: parseInt(avgResult.rows[0].TotalComments)
    });
  } catch (error) {
    console.error('Lỗi getCommentsByProduct:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy đánh giá!' });
  }
};

// =================== ADD COMMENT ===================
const addComment = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { productId, rating, content, parentId, orderId } = req.body;

    if (!productId || !content) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin!' });
    }

    // Validate rating chỉ cho comment gốc
    if (!parentId && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Số sao phải từ 1 đến 5!' });
    }

    const productCheck = await db.query(
      'SELECT "Id" FROM "Products" WHERE "Id" = $1',
      [productId]
    );
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm!' });
    }

    // Nếu là reply, kiểm tra parent comment tồn tại
    if (parentId) {
      const parentCheck = await db.query(
        'SELECT "Id", "ProductId" FROM "Comments" WHERE "Id" = $1',
        [parentId]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy bình luận gốc!' });
      }
      if (parentCheck.rows[0].ProductId !== parseInt(productId)) {
        return res.status(400).json({ error: 'Bình luận trả lời không thuộc sản phẩm này!' });
      }
    } else {
      // Comment gốc: kiểm tra đã mua sản phẩm
      const purchaseCheck = await db.query(`
        SELECT o."Id"
        FROM "Orders" o
        JOIN "OrderItems" oi ON o."Id" = oi."OrderId"
        WHERE o."UserId" = $1
          AND oi."ProductId" = $2
          AND o."Status" = 'delivered'
        LIMIT 1
      `, [userId, productId]);

      if (purchaseCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng thành công!'
        });
      }

      // Kiểm tra đã đánh giá chưa
      const existingComment = await db.query(
        'SELECT "Id" FROM "Comments" WHERE "UserId" = $1 AND "ProductId" = $2 AND "ParentId" IS NULL',
        [userId, productId]
      );
      if (existingComment.rows.length > 0) {
        return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi!' });
      }
    }

    const insertQuery = `
      INSERT INTO "Comments" ("UserId", "ProductId", "OrderId", "ParentId", "Rating", "Content")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "Id", "Rating", "Content", "CreatedAt", "ParentId"
    `;
    const result = await db.query(insertQuery, [
      userId,
      productId,
      orderId || null,
      parentId || null,
      parentId ? null : rating, // Chỉ comment gốc có rating
      content
    ]);

    res.status(201).json({
      message: parentId ? 'Trả lời thành công!' : 'Thêm đánh giá thành công!',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi addComment:', error);
    res.status(500).json({ error: 'Lỗi server khi thêm bình luận!' });
  }
};

// =================== CHECK CAN REVIEW ===================
const checkCanReview = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { productId } = req.params;

    const purchaseCheck = await db.query(`
      SELECT o."Id"
      FROM "Orders" o
      JOIN "OrderItems" oi ON o."Id" = oi."OrderId"
      WHERE o."UserId" = $1 
        AND oi."ProductId" = $2 
        AND o."Status" = 'delivered'
      LIMIT 1
    `, [userId, productId]);

    const hasPurchased = purchaseCheck.rows.length > 0;

    const reviewCheck = await db.query(
      'SELECT "Id" FROM "Comments" WHERE "UserId" = $1 AND "ProductId" = $2 AND "ParentId" IS NULL',
      [userId, productId]
    );

    const hasReviewed = reviewCheck.rows.length > 0;

    res.json({
      canReview: hasPurchased && !hasReviewed,
      hasPurchased,
      hasReviewed
    });
  } catch (error) {
    console.error('Lỗi checkCanReview:', error);
    res.status(500).json({ error: 'Lỗi server khi kiểm tra quyền đánh giá!' });
  }
};

// =================== DELETE COMMENT ===================
const deleteComment = async (req, res) => {
  try {
    const userId = req.user.Id;
    const userRole = req.user.Role;
    const { id } = req.params;

    const commentCheck = await db.query(
      'SELECT "Id", "UserId" FROM "Comments" WHERE "Id" = $1',
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đánh giá!' });
    }

    const comment = commentCheck.rows[0];

    if (userRole !== 'admin' && comment.UserId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa đánh giá này!' });
    }

    await db.query('DELETE FROM "Comments" WHERE "Id" = $1', [id]);

    res.json({ message: 'Xóa đánh giá thành công!' });
  } catch (error) {
    console.error('Lỗi deleteComment:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa đánh giá!' });
  }
};

module.exports = {
  getCommentsByProduct,
  addComment,
  checkCanReview,
  deleteComment
};
