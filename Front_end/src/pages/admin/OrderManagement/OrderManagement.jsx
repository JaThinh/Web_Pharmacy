import React, { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "../../../api";
import Swal from 'sweetalert2';
import "./OrderManagement.css";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, search]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const data = await getAllOrders(params);
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error("Error loading orders:", err);
      Swal.fire({
        icon: 'error',
        title: err.response?.data?.error || "Lỗi khi tải danh sách đơn hàng",
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ ⭐️ BỔ SUNG FIX 2 (Hàm này được sửa) ⭐️ ============
  const handleStatusChange = async (orderId, newStatus) => {
    Swal.fire({
      title: `Xác nhận chuyển trạng thái đơn hàng sang "${getStatusText(newStatus)}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        // 1. Gọi API và nhận lại data (API của bạn đã trả về { order: ... })
        const data = await updateOrderStatus(orderId, newStatus);
        const updatedOrder = data.order; // Lấy đơn hàng đã cập nhật từ response

        Swal.fire({
          icon: 'success',
          title: '✅ Đã cập nhật trạng thái đơn hàng!',
          confirmButtonText: 'OK'
        });
        // 2. Tắt hàm loadOrders()
        // loadOrders(); // BÌNH LUẬN DÒNG NÀY LẠI

        // 3. Cập nhật state local (hiệu quả hơn)
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.Id === orderId
              ? { ...order, Status: updatedOrder.Status } // Cập nhật trạng thái mới
              : order
          )
        );

        // 4. (Tùy chọn) Nếu có filter,
        // xóa đơn hàng khỏi danh sách NẾU nó không còn khớp
        if (statusFilter && updatedOrder.Status !== statusFilter) {
          setTimeout(() => {
            setOrders((prevOrders) =>
              prevOrders.filter((order) => order.Id !== orderId)
            );
          }, 1000); // Thêm 1s delay để admin thấy sự thay đổi
        }

      } catch (err) {
        console.error("Error updating order status:", err);
        Swal.fire({
          icon: 'error',
          title: err.response?.data?.error || "Lỗi khi cập nhật trạng thái",
          confirmButtonText: 'OK'
        });
      }
    });
  };
  // =============================================================


  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: "confirmed",
      confirmed: "shipping",
      shipping: "delivered",
    };
    return flow[currentStatus];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className="order-management">
      <div className="page-header">
        <h1>📦 Quản lý Đơn hàng</h1>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo mã đơn, tên khách hàng..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button onClick={loadOrders} className="btn-refresh">
          🔄 Làm mới
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Số sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const nextStatus = getNextStatus(order.Status);
                    return (
                      <tr key={order.Id}>
                        <td className="order-code">{order.Code}</td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-name">
                              {order.CustomerName || "Khách"}
                            </div>
                            <div className="customer-email">
                              {order.CustomerEmail}
                            </div>
                          </div>
                        </td>
                        <td>{order.ItemsCount} sản phẩm</td>
                        <td className="order-total">
                          {formatCurrency(order.Total)}
                        </td>
                        <td>
                          <span className={`status-badge ${order.Status}`}>
                            {getStatusText(order.Status)}
                          </span>
                        </td>
                        <td>{formatDate(order.CreatedAt)}</td>
                        <td className="actions">
                          {nextStatus && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.Id, nextStatus)
                              }
                              className="btn-next-status"
                              title={`Chuyển sang: ${getStatusText(
                                nextStatus
                              )}`}
                            >
                              ➡️ {getStatusText(nextStatus)}
                            </button>
                          )}
                          {order.Status === "pending" && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.Id, "cancelled")
                              }
                              className="btn-cancel-order"
                              title="Hủy đơn hàng"
                            >
                              ❌ Hủy
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-message">
                      Không tìm thấy đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-page"
              >
                ← Trước
              </button>
              <span className="page-info">
                Trang {pagination.currentPage} / {pagination.totalPages} (
                {pagination.totalItems} đơn hàng)
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(pagination.totalPages, p + 1)
                  )
                }
                disabled={currentPage === pagination.totalPages}
                className="btn-page"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}