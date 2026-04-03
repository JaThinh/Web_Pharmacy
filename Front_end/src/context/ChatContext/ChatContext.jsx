// Chat Context - Quản lý Socket.IO và trạng thái chat
import React, { createContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../AuthContext/AuthContext';
import { SOCKET_URL } from '../../config';
import api from '../../api';

// Create context
const ChatContext = createContext(null);

// ChatProvider component
export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [threads, setThreads] = useState([]);
  const [currentThread, setCurrentThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [newMessageCount, setNewMessageCount] = useState(0);
  
  // Refs để theo dõi typing
  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);

  // Khởi tạo Socket.IO connection
  useEffect(() => {
    if (token && user) {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      // ============ ⭐️ SỬA: GOM CÁC HÀM XỬ LÝ SỰ KIỆN ⭐️ ============
      // (Để dễ dàng thêm và gỡ bỏ)
      
      const onConnect = () => {
        console.log('🔌 Socket connected:', newSocket.id);
        setIsConnected(true);
        console.log('🔐 Authenticating socket with token...');
        newSocket.emit('authenticate', token);
      };

      const onAuthenticated = (data) => {
        console.log('✅ Socket authenticated:', data);
        if (data.success) {
          console.log(`👤 User role: ${user.role}, ID: ${user.id}`);
          setIsAuthenticated(true);
          if (user.role === 'admin') {
            console.log('👨‍💼 Admin detected - joining admin_room and all threads');
            newSocket.emit('admin_join_all_threads');
          }
        } else {
          console.error('❌ Socket authentication failed:', data.error);
          setIsAuthenticated(false);
        }
      };

      const onDisconnect = () => {
        console.log('🔌 Socket disconnected');
        setIsConnected(false);
        setIsAuthenticated(false);
      };

      const onThreadCreated = (thread) => {
        setThreads(prev => [thread, ...prev]);
        setCurrentThread(thread);
      };

      const onNewThreadNotification = (notification) => {
        console.log('🔔 New thread notification received:', notification);
        if (user.role === 'admin') {
          console.log('📥 Admin reloading threads...');
          loadThreads(); // Reload threads
        }
      };

      const onThreadMessages = (data) => {
        // Sửa: Đảm bảo chỉ cập nhật đúng thread
        // (Nếu currentThread.Id chưa kịp set mà messages đã về)
        // if (data.threadId === currentThread?.Id) {
        
        const mappedMessages = (data.messages || []).map(msg => ({
          ...msg,
          product: msg.product || null
        }));
        setMessages(mappedMessages);
        // }
      };

      const onNewMessage = (message) => {
        const mappedMessage = {
          ...message,
          product: message.product || null
        };
        
        // Sửa: Chỉ thêm tin nhắn nếu nó thuộc thread đang xem
        setMessages(prev => [...prev, mappedMessage]);
        
        setThreads(prev => prev.map(thread => 
          thread.Id === message.ThreadId 
            ? { 
                ...thread, 
                LastMessage: message.Content,
                LastMessageAt: message.CreatedAt,
                UpdatedAt: message.CreatedAt
              }
            : thread
        ));

        if (message.SenderId !== user.id) {
          setNewMessageCount(prev => prev + 1);
        }
      };

      const onUserTyping = (data) => {
        if (data.threadId === currentThread?.Id && data.userId !== user.id) {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, data.userName);
            return newMap;
          });
        }
      };

      const onUserStopTyping = (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      };

      const onThreadClosed = (data) => {
        setThreads(prev => prev.map(thread => 
          thread.Id === data.threadId 
            ? { ...thread, Status: 'closed' }
            : thread
        ));
      };

      const onAdminThreadsJoined = () => {
        console.log('✅ Admin joined all thread rooms');
      };

      const onError = (err) => {
        console.error('❌ Socket error:', err);
      };

      // ============ ⭐️ SỬA: ĐĂNG KÝ LISTENER ⭐️ ============
      newSocket.on('connect', onConnect);
      newSocket.on('authenticated', onAuthenticated);
      newSocket.on('disconnect', onDisconnect);
      newSocket.on('thread_created', onThreadCreated);
      newSocket.on('new_thread_notification', onNewThreadNotification);
      newSocket.on('thread_messages', onThreadMessages);
      newSocket.on('new_message', onNewMessage);
      newSocket.on('user_typing', onUserTyping);
      newSocket.on('user_stop_typing', onUserStopTyping);
      newSocket.on('thread_closed', onThreadClosed);
      newSocket.on('admin_threads_joined', onAdminThreadsJoined);
      newSocket.on('error', onError);

      setSocket(newSocket);

      // ============ ⭐️ SỬA: BỔ SUNG CLEANUP FUNCTION ⭐️ ============
      // (Đây là mấu chốt fix lỗi lặp tin nhắn)
      return () => {
        console.log('🧹 Cleaning up socket listeners...');
        newSocket.off('connect', onConnect);
        newSocket.off('authenticated', onAuthenticated);
        newSocket.off('disconnect', onDisconnect);
        newSocket.off('thread_created', onThreadCreated);
        newSocket.off('new_thread_notification', onNewThreadNotification);
        newSocket.off('thread_messages', onThreadMessages);
        newSocket.off('new_message', onNewMessage);
        newSocket.off('user_typing', onUserTyping);
        newSocket.off('user_stop_typing', onUserStopTyping);
        newSocket.off('thread_closed', onThreadClosed);
        newSocket.off('admin_threads_joined', onAdminThreadsJoined);
        newSocket.off('error', onError);
        
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setIsAuthenticated(false); // Thêm reset
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]); // Phụ thuộc chính xác

  // Load threads từ API
  const loadThreads = async () => {
    try {
      // SỬA: Dùng api (đã import) thay vì 'api.get'
      const response = await api.get('/chat/threads');
      // SỬA: API của bạn không trả về .success,
      // (Dựa theo README.md, API trả về mảng threads trực tiếp)
      setThreads(response.data.threads || response.data);
    } catch (err) {
      console.error('Error loading threads:', err);
    }
  };

  // Load threads khi component mount
  useEffect(() => {
    if (token && isAuthenticated) { // SỬA: Chỉ load khi đã xác thực
      loadThreads();
    }
  }, [token, isAuthenticated]); // SỬA: Thêm isAuthenticated

  // Tạo thread mới
  const createThread = async (title, attachmentType = 'general', attachmentId = null) => {
    try {
      if (socket) {
        socket.emit('create_chat_thread', {
          title,
          attachmentType,
          attachmentId
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating thread:', err);
      return false;
    }
  };

  // Join thread
  const joinThread = (thread) => {
    if (thread === null) {
      // Trở về danh sách thread
      setCurrentThread(null);
      setMessages([]);
      return;
    }
    
    if (socket && thread && isAuthenticated) {
      console.log(`✅ Joining thread ${thread.Id} - authenticated: ${isAuthenticated}`);
      setCurrentThread(thread);
      setMessages([]); // Xóa tin nhắn cũ
      socket.emit('join_thread', thread.Id);
      
      // Reset message count cho thread này
      setNewMessageCount(0);
    } else {
      console.warn(`❌ Cannot join thread - socket: ${!!socket}, thread: ${!!thread}, authenticated: ${isAuthenticated}`);
    }
  };

  // Gửi tin nhắn
  const sendMessage = (content, attachedProductId = null) => {
    if (socket && currentThread && content.trim()) {
      socket.emit('send_message', {
        threadId: currentThread.Id,
        content: content.trim(),
        attachedProductId: attachedProductId
      });
      return true;
    }
    return false;
  };

  // Typing indicators
  const startTyping = () => {
    if (socket && currentThread && !isTypingRef.current) {
      socket.emit('typing', { threadId: currentThread.Id });
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set new timeout
    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (socket && currentThread && isTypingRef.current) {
      socket.emit('stop_typing', { threadId: currentThread.Id });
      isTypingRef.current = false;
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  };

  // Đóng thread (admin only)
  const closeThread = async (threadId) => {
    try {
      const response = await api.patch(`/chat/threads/${threadId}/close`);
      // SỬA: API của bạn không trả về .success
      if (response.data && response.data.message) {
        return true;
      }
      return false;
    } catch (err)
 {
      console.error('Error closing thread:', err);
      return false;
    }
  };

  // Get chat stats (admin only)
  const getChatStats = async () => {
    try {
      const response = await api.get('/chat/stats');
      // SỬA: API của bạn không trả về .success
      if (response.data && response.data.stats) {
        return response.data.stats;
      }
      return null;
    } catch (err) {
      console.error('Error getting chat stats:', err);
      return null;
    }
  };

  const contextValue = {
    // Connection state
    socket,
    isConnected,
    isAuthenticated,
    
    // Chat data
    threads,
    currentThread,
    messages,
    onlineUsers,
    typingUsers,
    newMessageCount,
    
    // Actions
    createThread,
    joinThread,
    sendMessage,
    startTyping,
    stopTyping,
    closeThread,
    loadThreads,
    getChatStats,
    
    // Utilities
    setCurrentThread,
    setNewMessageCount
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Export context separately - not as default to maintain Fast Refresh compatibility
export default ChatContext;