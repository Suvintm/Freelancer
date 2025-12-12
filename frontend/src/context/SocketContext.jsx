// SocketContext.jsx - Real-time WebSocket context for messaging, notifications, and online status
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAppContext } from "./AppContext";
import { toast } from "react-toastify";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, backendURL } = useAppContext();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { orderId: [userId, ...] }
  const [unreadCounts, setUnreadCounts] = useState({}); // { orderId: count }
  const [totalUnread, setTotalUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const typingTimeoutRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (!user?.token) return;

    const socketUrl = backendURL.replace("/api", "").replace("http", "ws");
    const newSocket = io(backendURL.replace("/api", ""), {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
      // Emit user online
      newSocket.emit("user:online", { userId: user._id });
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    // Listen for online users
    newSocket.on("users:online", (users) => {
      setOnlineUsers(users);
    });

    // Listen for user coming online
    newSocket.on("user:joined", (userId) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    // Listen for user going offline
    newSocket.on("user:left", (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Listen for new messages
    newSocket.on("message:new", (message) => {
      // Update unread count for this order
      if (message.sender !== user._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.orderId]: (prev[message.orderId] || 0) + 1,
        }));
        setTotalUnread((prev) => prev + 1);

        // Show toast notification
        toast.info(`New message from ${message.senderName || "Someone"}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });

    // Listen for typing indicators
    newSocket.on("typing:start", ({ orderId, userId, userName }) => {
      if (userId !== user._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [orderId]: [...(prev[orderId] || []).filter((u) => u.id !== userId), { id: userId, name: userName }],
        }));
      }
    });

    newSocket.on("typing:stop", ({ orderId, userId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [orderId]: (prev[orderId] || []).filter((u) => u.id !== userId),
      }));
    });

    // Listen for real-time notifications
    newSocket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotifications((prev) => prev + 1);
      
      // Show toast
      toast.info(notification.message, {
        position: "top-right",
        autoClose: 4000,
      });
    });

    // Listen for message read receipts
    newSocket.on("message:read", ({ orderId, readBy }) => {
      if (readBy === user._id) {
        setUnreadCounts((prev) => {
          const newCounts = { ...prev };
          const diff = newCounts[orderId] || 0;
          delete newCounts[orderId];
          setTotalUnread((t) => Math.max(0, t - diff));
          return newCounts;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("user:offline", { userId: user._id });
      newSocket.disconnect();
    };
  }, [user?.token, user?._id, backendURL]);

  // Join a chat room (order)
  const joinRoom = useCallback((orderId) => {
    if (socket) {
      socket.emit("room:join", { orderId });
    }
  }, [socket]);

  // Leave a chat room
  const leaveRoom = useCallback((orderId) => {
    if (socket) {
      socket.emit("room:leave", { orderId });
    }
  }, [socket]);

  // Send a message
  const sendMessage = useCallback((orderId, message) => {
    if (socket) {
      socket.emit("message:send", {
        orderId,
        message,
        senderId: user?._id,
        senderName: user?.name,
      });
    }
  }, [socket, user]);

  // Start typing indicator
  const startTyping = useCallback((orderId) => {
    if (socket) {
      socket.emit("typing:start", {
        orderId,
        userId: user?._id,
        userName: user?.name,
      });

      // Clear existing timeout
      if (typingTimeoutRef.current[orderId]) {
        clearTimeout(typingTimeoutRef.current[orderId]);
      }

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current[orderId] = setTimeout(() => {
        stopTyping(orderId);
      }, 3000);
    }
  }, [socket, user]);

  // Stop typing indicator
  const stopTyping = useCallback((orderId) => {
    if (socket) {
      socket.emit("typing:stop", {
        orderId,
        userId: user?._id,
      });

      if (typingTimeoutRef.current[orderId]) {
        clearTimeout(typingTimeoutRef.current[orderId]);
        delete typingTimeoutRef.current[orderId];
      }
    }
  }, [socket, user]);

  // Mark messages as read
  const markAsRead = useCallback((orderId) => {
    if (socket) {
      socket.emit("message:read", {
        orderId,
        readBy: user?._id,
      });

      // Also update local state
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        const diff = newCounts[orderId] || 0;
        delete newCounts[orderId];
        setTotalUnread((t) => Math.max(0, t - diff));
        return newCounts;
      });
    }
  }, [socket, user]);

  // Mark notifications as read
  const markNotificationsRead = useCallback(() => {
    setUnreadNotifications(0);
    if (socket) {
      socket.emit("notifications:read", { userId: user?._id });
    }
  }, [socket, user]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  // Get typing users for an order
  const getTypingUsers = useCallback((orderId) => {
    return typingUsers[orderId] || [];
  }, [typingUsers]);

  // Get unread count for an order
  const getUnreadCount = useCallback((orderId) => {
    return unreadCounts[orderId] || 0;
  }, [unreadCounts]);

  const value = {
    socket,
    onlineUsers,
    typingUsers,
    unreadCounts,
    totalUnread,
    notifications,
    unreadNotifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    markNotificationsRead,
    isUserOnline,
    getTypingUsers,
    getUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
