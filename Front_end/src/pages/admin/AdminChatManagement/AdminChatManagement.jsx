import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext/AuthContext';
import { useChat } from '../../../context/ChatContext/useChatHook';
import ProductPickerModal from '../../../components/ProductPickerModal/ProductPickerModal';
import ChatProductCard from '../../../components/ChatProductCard/ChatProductCard';
import api from '../../../api';
import './AdminChatManagement.css';

const AdminChatManagement = () => {
  const { user } = useContext(AuthContext);
  const { 
    socket, 
    isConnected
  } = useChat();
  
  const [selectedThread, setSelectedThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    onlineUsers: 0
  });
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load all threads and join socket room
  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllThreads();
      
      if (socket && isConnected) {
        console.log('👨‍💼 Admin joining all thread rooms...');
        socket.emit('admin_join_all_threads');
      }
    }
  }, [user, socket, isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || user?.role !== 'admin') return;

    console.log('🔌 Setting up admin socket listeners...');

    // ============ ⭐️ FIX: Admin nhận tin nhắn từ User ⭐️ ============
    const handleNewMessage = (data) => {
      console.log('📩 New message received:', data);
      console.log('📦 Message product data:', data.product);

      // Chỉ bỏ qua tin nhắn của chính admin (đã có Optimistic Update)
      if (data.SenderId === user.id || data.senderId === user.id) {
        console.log('🚫 Admin ignoring self-sent message');
        return;
      }
      
      const mappedMessage = {
        id: data.Id || data.id || `msg_${Date.now()}`,
        threadId: data.ThreadId || data.threadId,
        senderId: data.SenderId || data.senderId,
        senderRole: data.SenderRole || data.senderRole,
        content: data.Content || data.content,
        createdAt: data.CreatedAt || data.createdAt,
        senderName: data.SenderName || data.senderName,
        product: data.product || null
      };
      
      console.log('✅ Mapped message:', mappedMessage);
      
      // Thêm tin nhắn vào thread đang mở
      if (selectedThread && mappedMessage.threadId === selectedThread.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === mappedMessage.id)) {
            console.log('⚠️ Message already exists:', mappedMessage.id);
            return prev;
          }
          console.log('➕ Adding new message to current thread');
          return [...prev, mappedMessage];
        });
      }
      
      // Update thread list
      setThreads(prev => prev.map(thread => 
        thread.id === mappedMessage.threadId 
          ? { ...thread, lastMessage: mappedMessage.content, lastMessageAt: mappedMessage.createdAt }
          : thread
      ));
    };

    // Handle tin nhắn mới từ user (riêng cho admin)
    const handleNewUserMessage = (data) => {
      console.log('👤 New user message notification:', data);
      console.log('📦 User message product data:', data.product);
      
      const mappedMessage = {
        id: data.message?.Id || data.message?.id || `msg_${Date.now()}`,
        threadId: data.threadId,
        senderId: data.userId || data.message?.SenderId,
        senderRole: 'user',
        content: data.message?.Content || data.message?.content || '',
        createdAt: data.message?.CreatedAt || data.message?.createdAt || new Date().toISOString(),
        senderName: data.senderName || 'User',
        product: data.product || null
      };

      console.log('✅ Mapped user message:', mappedMessage);

      // Thêm tin nhắn vào thread đang mở
      if (selectedThread && mappedMessage.threadId === selectedThread.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === mappedMessage.id)) {
            console.log('⚠️ User message already exists:', mappedMessage.id);
            return prev;
          }
          console.log('➕ Adding new user message to current thread');
          return [...prev, mappedMessage];
        });
      }

      // Update thread list
      setThreads(prev => prev.map(thread => 
        thread.id === mappedMessage.threadId 
          ? { ...thread, lastMessage: mappedMessage.content, lastMessageAt: mappedMessage.createdAt }
          : thread
      ));
    };
    // ============ ⭐️ KẾT THÚC FIX ⭐️ ============

    const handleNewThread = (thread) => {
      console.log('🆕 New thread notification:', thread);
      loadAllThreads();
    };

    const handleThreadClosed = ({ threadId }) => {
      console.log('🔒 Thread closed:', threadId);
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, status: 'closed' }
          : thread
      ));
      setStats(prev => ({ ...prev, active: prev.active - 1, closed: prev.closed + 1 }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_user_message', handleNewUserMessage); // ⭐️ THÊM EVENT MỚI
    socket.on('new_thread', handleNewThread);
    socket.on('new_thread_notification', handleNewThread);
    socket.on('thread_closed', handleThreadClosed);

    return () => {
      console.log('🔌 Cleaning up admin socket listeners...');
      socket.off('new_message', handleNewMessage);
      socket.off('new_user_message', handleNewUserMessage); // ⭐️ THÊM CLEANUP
      socket.off('new_thread', handleNewThread);
      socket.off('new_thread_notification', handleNewThread);
      socket.off('thread_closed', handleThreadClosed);
    };
  }, [socket, selectedThread, user]);

  const loadAllThreads = async () => {
    try {
      const response = await api.get('/chat/admin/threads');
      
      if (!response.data || !response.data.threads) {
        console.warn('No threads data received');
        setThreads([]);
        return;
      }
      
      const mappedThreads = (response.data.threads || []).map(thread => ({
        id: thread.id,
        userId: thread.user_id,
        userName: thread.user_name || 'Unknown User',
        email: thread.user_email || '',
        username: thread.username || '',
        title: thread.title || 'Untitled',
        subject: thread.subject || thread.title || 'General Support',
        status: thread.status || 'active',
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
        messageCount: thread.message_count || 0,
        lastMessage: thread.last_message || '',
        lastMessageAt: thread.last_message_at || thread.created_at
      }));
      
      setThreads(mappedThreads);
      setStats(response.data.stats || { total: 0, active: 0, closed: 0, onlineUsers: 0 });
    } catch (error) {
      console.error('❌ Error loading threads:', error.response?.data || error.message);
      setThreads([]);
      setStats({ total: 0, active: 0, closed: 0, onlineUsers: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadThreadMessages = async (thread) => {
    try {
      const response = await api.get(`/chat/threads/${thread.id}/messages`);
      
      if (!response.data || !response.data.messages) {
        console.warn('No messages data received');
        setMessages([]);
        setSelectedThread(thread);
        return;
      }
      
      const mappedMessages = (response.data.messages || []).map(msg => ({
        id: msg.Id,
        threadId: msg.ThreadId,
        senderId: msg.SenderId,
        senderRole: msg.SenderRole || 'user',
        content: msg.Content || '',
        createdAt: msg.CreatedAt,
        senderName: msg.SenderName || 'Unknown',
        senderUsername: msg.SenderUsername || '',
        product: msg.product || null
      }));
      
      setMessages(mappedMessages);
      setSelectedThread(thread);
      
      if (socket && isConnected) {
        console.log(`🚪 Joining thread room: thread_${thread.id}`);
        socket.emit('join_thread', thread.id);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error.response?.data || error.message);
      setMessages([]);
      setSelectedThread(thread);
    }
  };

  // (Hàm 'handleSendMessage' giữ nguyên)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageText.trim();
    const productToSend = selectedProduct;
    
    // Sửa: Cho phép gửi nếu có content HOẶC có sản phẩm
    if ((!content && !productToSend) || !selectedThread) return;

    // 1. Tự cập nhật (Optimistic Update)
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      threadId: selectedThread.id,
      senderId: user.id,
      senderRole: 'admin',
      content: content,
      createdAt: new Date().toISOString(),
      senderName: user.fullname || user.username || 'Bạn',
      product: productToSend ? {
        id: productToSend.id,
        Id: productToSend.id,
        name: productToSend.name,
        ProductName: productToSend.name,
        image: productToSend.imageUrl,
        ProductImage: productToSend.imageUrl,
        price: productToSend.price,
        ProductPrice: productToSend.price
      } : null
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Reset input
    setMessageText('');
    setSelectedProduct(null);

    try {
      // 2. Gửi API
      console.log('📤 Sending message via API...');
      const response = await api.post(`/chat/threads/${selectedThread.id}/messages`, {
        content: content,
        attachedProductId: productToSend?.id || null
      });
      
      console.log('✅ Message sent successfully via API:', response.data);

      // 3. Cập nhật tin nhắn tạm bằng ID thật
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
        ? { ...optimisticMessage, ...response.data.message } // Ghi đè tin tạm bằng tin thật
        : msg
      ));
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setShowProductPicker(false);
  };

  const handleRemoveProduct = () => {
    setSelectedProduct(null);
  };

  const handleCloseThread = async (threadId) => {
    try {
      await api.patch(`/chat/threads/${threadId}/close`);
      console.log('✅ Thread closed successfully');
      
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, status: 'closed' }
          : thread
      ));

      if (selectedThread?.id === threadId) {
        setSelectedThread({ ...selectedThread, status: 'closed' });
      }
      
      setStats(prev => ({ 
        ...prev, 
        active: Math.max(0, prev.active - 1), 
        closed: prev.closed + 1 
      }));
    } catch (error) {
      console.error('❌ Error closing thread:', error.response?.data || error.message);
      alert('Không thể đóng hội thoại. Vui lòng thử lại.');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-chat-management">
        <div className="access-denied">
          <h3>Truy cập bị từ chối</h3>
          <p>Bạn không có quyền truy cập tính năng này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chat-management">
      {/* (Header và Stats giữ nguyên) */}
      <div className="chat-admin-header">
        <div className="header-title">
          <h2>Quản lý Chat hỗ trợ</h2>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </div>
        </div>
        <div className="chat-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Tổng</span>
          </div>
          <div className="stat-item active">
            <span className="stat-number">{stats.active}</span>
            <span className="stat-label">Đang hoạt động</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.closed}</span>
            <span className="stat-label">Đã đóng</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.onlineUsers}</span>
            <span className="stat-label">Người dùng online</span>
          </div>
        </div>
      </div>

      <div className="chat-admin-content">
        {/* (Thread List giữ nguyên) */}
        <div className="threads-panel">
          <div className="threads-header">
            <h3>Danh sách hội thoại</h3>
            <button 
              className="refresh-btn"
              onClick={loadAllThreads}
              disabled={loading}
            >
              ↻
            </button>
          </div>
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="threads-list">
              {threads.map(thread => (
                <div
                  key={thread.id}
                  className={`thread-item ${selectedThread?.id === thread.id ? 'selected' : ''} ${thread.status}`}
                  onClick={() => loadThreadMessages(thread)}
                >
                  <div className="thread-header">
                    <div className="user-info">
                      <div className="user-avatar">
                        {thread.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-details">
                        <h4>{thread.userName || 'Người dùng'}</h4>
                        <p className="thread-subject">{thread.subject}</p>
                      </div>
                    </div>
                    <div className="thread-meta">
                      <span className="thread-time">
                        {formatTime(thread.lastMessageAt || thread.createdAt)}
                      </span>
                      <span className={`status-badge ${thread.status}`}>
                        {thread.status === 'active' ? 'Hoạt động' : 'Đã đóng'}
                      </span>
                    </div>
                  </div>
                  {thread.lastMessage && (
                    <div className="last-message">
                      {thread.lastMessage}
                    </div>
                  )}
                  <div className="thread-footer">
                    <span className="message-count">
                      {thread.messageCount || 0} tin nhắn
                    </span>
                    <span className="thread-date">
                      {formatDate(thread.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              {threads.length === 0 && (
                <div className="empty-threads">
                  <p>Chưa có hội thoại nào</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {selectedThread ? (
            <>
              {/* (Chat Header giữ nguyên) */}
              <div className="chat-panel-header">
                <div className="chat-user-info">
                  <div className="user-avatar large">
                    {selectedThread.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-details">
                    <h3>{selectedThread.userName || 'Người dùng'}</h3>
                    <p className="user-email">{selectedThread.email}</p>
                    <p className="thread-subject">{selectedThread.subject}</p>
                  </div>
                </div>
                <div className="chat-actions">
                  {selectedThread.status === 'active' && (
                    <button
                      className="close-thread-btn"
                      onClick={() => handleCloseThread(selectedThread.id)}
                    >
                      Đóng hội thoại
                    </button>
                  )}
                </div>
              </div>

              {/* (Messages giữ nguyên) */}
              <div className="chat-messages">
                {messages.map((message, index) => {
                  const showDateDivider = index === 0 || 
                    formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

                  return (
                    <React.Fragment key={message.id}>
                      {showDateDivider && (
                        <div className="date-divider">
                          <span>{formatDate(message.createdAt)}</span>
                        </div>
                      )}
                      
                      <div className={`message ${message.senderRole === 'admin' ? 'admin' : 'user'}`}>
                        <div className="message-content">
                          <div className="sender-info">
                            <span className="sender-name">
                              {message.senderRole === 'admin' ? 'Bạn' : message.senderName}
                            </span>
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <div className="message-bubble">
                            <p>{message.content}</p>
                            {message.product && (
                              <ChatProductCard product={message.product} />
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {messages.length === 0 && (
                  <div className="empty-messages">
                    <p>Chưa có tin nhắn nào trong hội thoại này</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              {selectedThread.status === 'active' && (
                <div className="message-input-container">
                  {/* (Hiển thị sản phẩm đã chọn giữ nguyên) */}
                  {selectedProduct && (
                    <div className="selected-product-preview">
                      <div className="preview-content">
                        <img 
                          src={selectedProduct.imageUrl} 
                          alt={selectedProduct.name}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/50?text=No+Image'}
                        />
                        <div className="preview-info">
                          <p className="preview-name">{selectedProduct.name}</p>
                          <p className="preview-price">{selectedProduct.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <button 
                          type="button"
                          className="remove-product-btn"
                          onClick={handleRemoveProduct}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="message-form">
                    <button
                      type="button"
                      className="attach-btn"
                      onClick={() => setShowProductPicker(true)}
                      title="Đính kèm sản phẩm"
                    >
                      📎
                    </button>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      disabled={!isConnected}
                    />
                    <button 
                      type="submit" 
                      className="send-btn"
                      // Sửa: Cho phép gửi khi có text HOẶC có sản phẩm
                      disabled={(!messageText.trim() && !selectedProduct) || !isConnected}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                      </svg>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="no-thread-selected">
              <div className="placeholder-content">
                <div className="placeholder-icon">💬</div>
                <h3>Chọn một hội thoại để bắt đầu</h3>
                <p>Chọn một hội thoại từ danh sách bên trái để xem tin nhắn và trả lời khách hàng.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Picker Modal */}
      <ProductPickerModal
        isOpen={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
};

export default AdminChatManagement;