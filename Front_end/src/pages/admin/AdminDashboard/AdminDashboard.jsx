import React, { useState, useEffect } from "react";
import { getDashboardStats, getRevenueChart } from "../../../api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, chartResult] = await Promise.all([
        getDashboardStats(),
        getRevenueChart(7)
      ]);
      setStats(statsData);
      setChartData(chartResult.chart || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError(err.response?.data?.error || "Lỗi khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-message">
          <h3>⚠️ Lỗi</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Tổng quan Dashboard</h1>
        <button onClick={loadDashboardData} className="btn-refresh">
          🔄 Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Revenue Card */}
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Doanh thu</h3>
            <div className="stat-value">{formatCurrency(stats.revenue.total)}</div>
            <div className="stat-subtitle">
              Tháng này: {formatCurrency(stats.revenue.thisMonth)}
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="stat-card orders">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Đơn hàng</h3>
            <div className="stat-value">{stats.orders.total}</div>
            <div className="stat-breakdown">
              <span className="badge pending">
                Chờ xác nhận: {stats.orders.byStatus.pending || 0}
              </span>
              <span className="badge confirmed">
                Đã xác nhận: {stats.orders.byStatus.confirmed || 0}
              </span>
              <span className="badge shipping">
                Đang giao: {stats.orders.byStatus.shipping || 0}
              </span>
              <span className="badge delivered">
                Đã giao: {stats.orders.byStatus.delivered || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Người dùng</h3>
            <div className="stat-value">{stats.users.total}</div>
            <div className="stat-subtitle">
              Mới hôm nay: {stats.users.newToday} | Tháng này: {stats.users.newThisMonth}
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="stat-card products">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>Sản phẩm</h3>
            <div className="stat-value">{stats.products.total}</div>
            <div className="stat-subtitle">
              Đang bán: {stats.products.active} | Sắp hết: {stats.products.lowStock}
            </div>
          </div>
        </div>

        {/* Chat Card */}
        <div className="stat-card chat">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>Hỗ trợ Chat</h3>
            <div className="stat-value">{stats.chat.totalThreads}</div>
            <div className="stat-subtitle">
              Đang hoạt động: {stats.chat.activeThreads}
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Tables Row */}
      <div className="dashboard-row">
        {/* Revenue Chart */}
        <div className="dashboard-card chart-card">
          <h2>📈 Doanh thu 7 ngày gần đây</h2>
          <div className="revenue-chart">
            {chartData.length > 0 ? (
              <div className="chart-bars">
                {chartData.map((item, index) => {
                  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ height: `${height}%` }}
                          title={`${formatCurrency(item.revenue)} - ${item.ordersCount} đơn`}
                        >
                          <span className="bar-value">{formatCurrency(item.revenue)}</span>
                        </div>
                      </div>
                      <div className="chart-label">{formatDate(item.date)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart">Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="dashboard-card">
          <h2>🏆 Sản phẩm bán chạy</h2>
          <div className="best-selling-list">
            {stats.bestSellingProducts.length > 0 ? (
              stats.bestSellingProducts.map((product, index) => (
                <div key={product.ProductId} className="best-selling-item">
                  <div className="rank">#{index + 1}</div>
                  <img 
                    src={product.ProductImage} 
                    alt={product.ProductName}
                    className="product-thumb"
                    onError={(e) => {
                      e.target.src = '/images/default.jpg';
                    }}
                  />
                  <div className="product-info">
                    <div className="product-name">{product.ProductName}</div>
                    <div className="product-stats">
                      Đã bán: {product.TotalSold} | Doanh thu: {formatCurrency(product.Revenue)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-list">Chưa có dữ liệu sản phẩm bán chạy</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-card">
        <h2>🕒 Đơn hàng gần đây</h2>
        <div className="recent-orders-table">
          {stats.recentOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.Id}>
                    <td className="order-code">{order.Code}</td>
                    <td>{order.CustomerName || 'Khách'}</td>
                    <td className="order-total">{formatCurrency(order.Total)}</td>
                    <td>
                      <span className={`status-badge ${order.Status}`}>
                        {order.Status === 'pending' && 'Chờ xác nhận'}
                        {order.Status === 'confirmed' && 'Đã xác nhận'}
                        {order.Status === 'shipping' && 'Đang giao'}
                        {order.Status === 'delivered' && 'Đã giao'}
                        {order.Status === 'cancelled' && 'Đã hủy'}
                      </span>
                    </td>
                    <td>{new Date(order.CreatedAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-list">Chưa có đơn hàng nào</div>
          )}
        </div>
      </div>
    </div>
  );
}
