const db = require('../../db_config');

/**
 * @swagger
 * /api/dashboard/statistics:
 *   get:
 *     summary: Thống kê tổng quan cho admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tổng quan
 */
const getDashboardStatistics = async (req, res) => {
  try {


    // Parallel queries for better performance
    const stats = await Promise.all([
      // Total users
      db.query('SELECT COUNT(*) as total FROM "Users" WHERE "Role" = $1', ['user']),
      
      // New users today
      db.query(`
        SELECT COUNT(*) as new_today 
        FROM "Users" 
        WHERE DATE("CreatedAt") = CURRENT_DATE
      `),
      
      // New users this month
      db.query(`
        SELECT COUNT(*) as new_month 
        FROM "Users" 
        WHERE EXTRACT(MONTH FROM "CreatedAt") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM "CreatedAt") = EXTRACT(YEAR FROM CURRENT_DATE)
      `),
      
      // Total products
      db.query('SELECT COUNT(*) as total FROM "Products"'),
      
      // Active products
      db.query('SELECT COUNT(*) as active FROM "Products" WHERE "IsActive" = true'),
      
      // Low stock products (< 10)
      db.query('SELECT COUNT(*) as low_stock FROM "Products" WHERE "Stock" < 10 AND "IsActive" = true'),
      
      // Total orders
      db.query('SELECT COUNT(*) as total FROM "Orders"'),
      
      // Orders by status
      db.query(`
        SELECT "Status", COUNT(*) as count
        FROM "Orders"
        GROUP BY "Status"
      `),
      
      // Total revenue (delivered orders)
      db.query(`
        SELECT SUM("Total") as revenue
        FROM "Orders"
        WHERE "Status" = 'delivered'
      `),
      
      // Revenue this month
      db.query(`
        SELECT SUM("Total") as revenue_month
        FROM "Orders"
        WHERE "Status" = 'delivered'
        AND EXTRACT(MONTH FROM "CreatedAt") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM "CreatedAt") = EXTRACT(YEAR FROM CURRENT_DATE)
      `),
      
      // Best selling products (top 5)
      db.query(`
        SELECT 
          oi."ProductId",
          oi."ProductName",
          oi."ProductImage",
          SUM(oi."Qty") as "TotalSold",
          SUM(oi."Qty" * oi."Price") as "Revenue"
        FROM "OrderItems" oi
        JOIN "Orders" o ON oi."OrderId" = o."Id"
        WHERE o."Status" = 'delivered'
        GROUP BY oi."ProductId", oi."ProductName", oi."ProductImage"
        ORDER BY "TotalSold" DESC
        LIMIT 5
      `),
      
      // Recent orders (last 10)
      db.query(`
        SELECT 
          o."Id", o."Code", o."Total", o."Status", o."CreatedAt",
          u."Fullname" as "CustomerName"
        FROM "Orders" o
        LEFT JOIN "Users" u ON o."UserId" = u."Id"
        ORDER BY o."CreatedAt" DESC
        LIMIT 10
      `),
      
      // Chat statistics
      db.query('SELECT COUNT(*) as total FROM "ChatThreads"'),
      db.query('SELECT COUNT(*) as active FROM "ChatThreads" WHERE "Status" = $1', ['active'])
    ]);

    // Process order status counts
    const ordersByStatus = {};
    stats[7].rows.forEach(row => {
      ordersByStatus[row.Status] = parseInt(row.count);
    });

    res.json({
      users: {
        total: parseInt(stats[0].rows[0].total),
        newToday: parseInt(stats[1].rows[0].new_today),
        newThisMonth: parseInt(stats[2].rows[0].new_month)
      },
      products: {
        total: parseInt(stats[3].rows[0].total),
        active: parseInt(stats[4].rows[0].active),
        lowStock: parseInt(stats[5].rows[0].low_stock)
      },
      orders: {
        total: parseInt(stats[6].rows[0].total),
        byStatus: ordersByStatus
      },
      revenue: {
        total: parseFloat(stats[8].rows[0].revenue || 0),
        thisMonth: parseFloat(stats[9].rows[0].revenue_month || 0)
      },
      bestSellingProducts: stats[10].rows,
      recentOrders: stats[11].rows,
      chat: {
        totalThreads: parseInt(stats[12].rows[0].total),
        activeThreads: parseInt(stats[13].rows[0].active)
      }
    });

  } catch (error) {
    console.error('Lỗi getDashboardStatistics:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê!' });
  }
};

/**
 * @swagger
 * /api/dashboard/revenue-chart:
 *   get:
 *     summary: Dữ liệu biểu đồ doanh thu theo ngày (7 ngày gần nhất)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu biểu đồ
 */
const getRevenueChart = async (req, res) => {
  try {


    const { days = 7 } = req.query;

    const query = `
      SELECT 
        DATE("CreatedAt") as date,
        COUNT(*) as orders_count,
        SUM("Total") as revenue
      FROM "Orders"
      WHERE "Status" = 'delivered'
      AND "CreatedAt" >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE("CreatedAt")
      ORDER BY date ASC
    `;

    const result = await db.query(query);

    res.json({
      chart: result.rows.map(row => ({
        date: row.date,
        ordersCount: parseInt(row.orders_count),
        revenue: parseFloat(row.revenue)
      }))
    });

  } catch (error) {
    console.error('Lỗi getRevenueChart:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu biểu đồ!' });
  }
};

module.exports = {
  getDashboardStatistics,
  getRevenueChart
};