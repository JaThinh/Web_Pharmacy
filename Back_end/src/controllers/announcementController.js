const db = require('../../db_config');
const fallbackAnnouncements = [
  {
    id: 1,
    title: 'Chào mừng đến hiệu thuốc trực tuyến',
    date: new Date().toISOString(),
    url: 'http://localhost:5173/shop'
  },
  {
    id: 2,
    title: 'Khuyến mại đặc biệt tuần này: Giảm 20% cho Vitamin C',
    date: new Date(Date.now() - 86400000).toISOString(),
    url: 'http://localhost:5173/product/2'
  }
];

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Lấy danh sách thông báo
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 */
const getAnnouncements = async (req, res) => {
  try {
    // Ưu tiên đọc từ DB nếu có bảng Announcements
    const query = `
      SELECT "Id", "Title", "Url", "PublishedAt" 
      FROM "Announcements" 
      WHERE "IsActive" = true 
      ORDER BY "PublishedAt" DESC 
      LIMIT 20
    `;

    const result = await db.query(query);
    
    // Handle both SQL Server (recordset) and PostgreSQL (rows) formats
    const data = result.rows || result.recordset || [];
    
    const rows = data.map(r => ({
      id: r.Id,
      title: r.Title,
      url: r.Url || null,
      date: r.PublishedAt
    }));

    return res.json(rows);

  } catch (error) {
    // Nếu bảng chưa tồn tại (42P01), trả fallback để FE vẫn chạy
    if (error && error.code === '42P01') {
      console.warn('Bảng Announcements chưa tồn tại, dùng fallback tạm thời.');
      return res.json(fallbackAnnouncements);
    }
    console.error('Lỗi getAnnouncements:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông báo!' });
  }
};

module.exports = {
  getAnnouncements
};
