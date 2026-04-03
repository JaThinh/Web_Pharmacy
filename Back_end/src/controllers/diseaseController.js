/*
 * File: Back_End/src/controllers/diseaseController.js
 * (ĐÃ XÓA SWAGGER COMMENT ĐỂ FIX LỖI LOG)
 */
const db = require('../../db_config');

// HÀM TÌM KIẾM (DÙNG CHO TRANG DANH SÁCH)
const searchDiseases = async (req, res) => {
  try {
    const { q } = req.query;
    
    let query;
    let params = [];
    
    if (q && q.trim()) {
      // Tìm kiếm theo từ khóa
      const searchTerm = `%${q.trim().toLowerCase()}%`; 
      
      query = `
        SELECT "Id", "Name", "Slug", "Overview", "Symptoms", "Category", "CreatedAt",
        "ImageUrl" -- ✨ BỔ SUNG CỘT NÀY
        FROM public."Diseases"
        WHERE 
          LOWER("Name") LIKE $1 OR
          LOWER("Symptoms") LIKE $1 OR
          LOWER("Overview") LIKE $1
        ORDER BY "CreatedAt" DESC
        LIMIT 50
      `;
      params = [searchTerm];

    } else {
      // Không có từ khóa, trả về 40 bệnh mới nhất
      query = `
        SELECT "Id", "Name", "Slug", "Overview", "Symptoms", "Category", "CreatedAt",
        "ImageUrl" -- ✨ BỔ SUNG CỘT NÀY
        FROM public."Diseases"
        ORDER BY "CreatedAt" DESC
        LIMIT 40
      `;
    }
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      total: result.rows.length,
      diseases: result.rows
    });
    
  } catch (error) {
    console.error('❌ Lỗi searchDiseases:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi tìm kiếm bệnh!' 
    });
  }
};

// HÀM LẤY CHI TIẾT BỆNH (CHO GIAO DIỆN BLOG)
const getDiseaseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ 
        success: false,
        error: 'Thiếu slug của bệnh!' 
      });
    }
    
    const query = `
      SELECT 
        "Id", "Name", "Slug", "Category", 
        "CreatedAt", "UpdatedAt",
        "ImageUrl", 
        "Content"
      FROM public."Diseases"
      WHERE "Slug" = $1
    `;
    
    const result = await db.query(query, [slug]); 
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy thông tin bệnh!' 
      });
    }
    
    res.json({
      success: true,
      disease: result.rows[0] 
    });
    
  } catch (error)
    {
    console.error('❌ Lỗi getDiseaseBySlug:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi lấy thông tin bệnh!' 
    });
  }
};

module.exports = {
  searchDiseases,
  getDiseaseBySlug
};