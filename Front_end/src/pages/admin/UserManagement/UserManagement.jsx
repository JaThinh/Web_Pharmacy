import React, { useState, useEffect } from "react";
import { getAllUsers, updateUser, deleteUser } from "../../../api";
import "./UserManagement.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const data = await getAllUsers(params);
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error("Error loading users:", err);
      alert(err.response?.data?.error || "Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullname: user.Fullname || "",
      email: user.Email || "",
      phone: user.Phone || "",
      address: user.Address || "",
      role: user.Role || "user"
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.Id, editForm);
      alert("✅ Cập nhật người dùng thành công!");
      setShowEditModal(false);
      loadUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      alert(err.response?.data?.error || "Lỗi khi cập nhật người dùng");
    }
  };

  const handleDeleteClick = async (user) => {
    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${user.Fullname || user.Username}"?`)) {
      return;
    }

    try {
      await deleteUser(user.Id);
      alert("✅ Đã xóa người dùng thành công!");
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.error || "Lỗi khi xóa người dùng");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>👥 Quản lý Người dùng</h1>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên, email, username..."
          value={search}
          onChange={handleSearchChange}
          className="search-input"
        />
        <select 
          value={roleFilter} 
          onChange={handleRoleFilterChange}
          className="filter-select"
        >
          <option value="">Tất cả vai trò</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={loadUsers} className="btn-refresh">
          🔄 Làm mới
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.Id}>
                      <td>{user.Id}</td>
                      <td className="username">{user.Username}</td>
                      <td>{user.Fullname || '-'}</td>
                      <td>{user.Email}</td>
                      <td>{user.Phone || '-'}</td>
                      <td>
                        <span className={`role-badge ${user.Role}`}>
                          {user.Role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>{formatDate(user.CreatedAt)}</td>
                      <td className="actions">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="btn-edit"
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        {user.Role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="btn-delete"
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      Không tìm thấy người dùng nào
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-page"
              >
                ← Trước
              </button>
              <span className="page-info">
                Trang {pagination.currentPage} / {pagination.totalPages}
                ({pagination.totalItems} người dùng)
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="btn-page"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Chỉnh sửa người dùng</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  type="text"
                  value={editForm.fullname}
                  onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Nhập địa chỉ"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Vai trò</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
