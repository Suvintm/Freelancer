// SocketContext.jsx - Production-ready WebSocket context with improved reliability
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useAppContext } from "./AppContext";
import { toast } from "react-toastify";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, backendURL } = useAppContext();
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState("disconnected"); // "connecting" | "connected" | "disconnected" | "reconnecting"
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  
  const typingTimeoutRef = useRef({});
  const messageQueueRef = useRef([]);
  const syncIntervalRef = useRef(null);
  const socketRef = useRef(null);

    const getSocketBaseUrl = useCallback(() => {
    try {
      if (!backendURL || backendURL.includes("://https")) {
        // Fallback for malformed .env or parsing errors
        return window.location.origin;
      }
      return backendURL.replace("/api", "");
    } catch (err) {
      return window.location.origin;
    }
  }, [backendURL]);

  // Initialize socket connection with production-ready settings
  useEffect(() => {
    if (!user?.token || !user?._id) {
      console.info("⚠️ Socket: No user token or ID, skipping connection");
      return;
    }

    const baseUrl = getSocketBaseUrl();
    console.log("🔌 Socket: Connecting to", baseUrl);
    setConnectionState("connecting");

    const newSocket = io(baseUrl, {
      auth: { token: user.token },
      query: { userId: user._id },
      // IMPORTANT: Use polling first for Render/cloud platforms (they handle upgrade better)
      transports: ["polling", "websocket"],
      upgrade: true, // Allow upgrade from polling to websocket
      // Production-ready reconnection settings
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000, // Start with 2s
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 60000, // 60 seconds - enough for cold server wake-up on Render
      forceNew: false, // Reuse connections
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Socket connected! ID:", newSocket.id);
      setConnectionState("connected");
      newSocket.emit("user:online", { userId: user._id });
      
      // Flush any queued messages
      if (messageQueueRef.current.length > 0) {
        console.log("📤 Flushing", messageQueueRef.current.length, "queued messages");
        messageQueueRef.current.forEach(msg => {
          newSocket.emit("message:send", msg);
        });
        messageQueueRef.current = [];
      }
      
      // Request fresh online users list
      newSocket.emit("request:online_users");
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnectionState("disconnected");
    });

    newSocket.on("reconnecting", (attemptNumber) => {
      console.log("🔄 Socket reconnecting, attempt:", attemptNumber);
      setConnectionState("reconnecting");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("✅ Socket reconnected after", attemptNumber, "attempts");
      setConnectionState("connected");
      newSocket.emit("user:online", { userId: user._id });
      newSocket.emit("request:online_users");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed after all attempts");
      setConnectionState("disconnected");
      toast.error("Connection lost. Please refresh the page.", { autoClose: false });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setConnectionState("disconnected");
      if (reason === "io server disconnect") {
        // Server forced disconnect, try to reconnect
        newSocket.connect();
      }
    });

    // Online users events
    newSocket.on("users:online", (users) => {
      console.log("👥 Online users:", users);
      setOnlineUsers(users);
    });

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("user:joined", (userId) => {
      console.log("🟢 User joined:", userId);
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on("user:left", (userId) => {
      console.log("🔴 User left:", userId);
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Message events - now includes real-time status updates
    newSocket.on("message:new", (message) => {
      // sender can be an ObjectId object (from populated toObject()) or a plain string
      const senderIdStr = (message.sender?._id ?? message.sender)?.toString();
      const currentUserIdStr = user._id?.toString();
      
      console.log(`[SocketContext] 💬 Message:new in order ${message.orderId || message.order} from ${senderIdStr}. Me: ${currentUserIdStr}`);

      if (senderIdStr !== currentUserIdStr) {
        console.log(`[SocketContext] 📈 Incrementing unread counts`);
        const orderKey = message.orderId || message.order;
        setUnreadCounts((prev) => ({
          ...prev,
          [orderKey]: (prev[orderKey] || 0) + 1,
        }));
        setTotalUnread((prev) => prev + 1);
        toast.info(`New message from ${message.senderName || message.sender?.name || "Someone"}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        console.log(`[SocketContext] 💁 Own message, NOT incrementing unread counts`);
      }
    });

    // Real-time message status updates
    newSocket.on("message:delivered", ({ messageId, orderId }) => {
      console.log("📨 Message delivered:", messageId);
      // This will trigger UI update in ChatPage
    });

    newSocket.on("message:seen", ({ messageId, orderId, seenBy, seenAt }) => {
      console.log("👁️ Message seen:", messageId, "by", seenBy);
      // This will trigger UI update in ChatPage
    });

    newSocket.on("messages:status_update", ({ orderId, messages }) => {
      console.log("📊 Message status update for order:", orderId);
      // Bulk status update for all messages in a chat
    });

    // ============ ADMIN REAL-TIME EVENTS ============
    // Listen for ban event - kicks user out immediately
    newSocket.on("admin:banned", ({ reason, message }) => {
      console.log("🚫 You have been banned:", reason);
      toast.error("Your account has been suspended!", { autoClose: false });
      
      // Store ban info and redirect immediately
      localStorage.setItem("banInfo", JSON.stringify({ banReason: reason, message }));
      localStorage.removeItem("user");
      
      // Small delay to show toast, then redirect
      setTimeout(() => {
        window.location.href = "/banned";
      }, 1000);
    });

    // Listen for maintenance mode - redirect to maintenance page
    newSocket.on("admin:maintenance", ({ isActive, message }) => {
      console.log("🔧 Maintenance mode:", isActive);
      if (isActive) {
        toast.warning("Site is going into maintenance mode!", { autoClose: false });
        localStorage.setItem("maintenanceMessage", message || "Under maintenance");
        
        setTimeout(() => {
          window.location.href = "/maintenance";
        }, 2000);
      }
    });

    // Typing events
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

    // Notification events
    newSocket.on("notification:new", (notification) => {
      console.log("🔔 New notification:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotifications((prev) => prev + 1);
      toast.info(notification.message, { position: "top-right", autoClose: 4000 });
    });

    // New Order events (for editor badge)
    newSocket.on("order:new", (order) => {
      console.log("📦 New order received:", order);
      if (user?.role === "editor") {
        setNewOrdersCount((prev) => prev + 1);
        toast.info(`New Order: ${order.title}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    });

    // Read receipts - only clear count for the specific user who marked as read
    newSocket.on("message:read", ({ orderId, readBy }) => {
      console.log("✓✓ Message read:", orderId, "by", readBy);
      // Use toString() to safely compare string vs ObjectId
      if (readBy?.toString() === user._id?.toString()) {
        setUnreadCounts((prev) => {
          const newCounts = { ...prev };
          const diff = newCounts[orderId] || 0;
          delete newCounts[orderId];
          setTotalUnread((t) => Math.max(0, t - diff));
          return newCounts;
        });
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Periodic sync - request online users every 30 seconds
    syncIntervalRef.current = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit("request:online_users");
      }
    }, 30000);


    // Visibility change handler - refresh state when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && newSocket.connected) {
        console.log("👁️ Tab visible, refreshing state");
        newSocket.emit("user:online", { userId: user._id });
        newSocket.emit("request:online_users");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Online/offline handler
    const handleOnline = () => {
      console.log("🌐 Browser online, reconnecting...");
      if (!newSocket.connected) {
        newSocket.connect();
      }
    };
    const handleOffline = () => {
      console.log("📴 Browser offline");
      setConnectionState("disconnected");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      console.log("🔌 Socket: Cleaning up connection");
      clearInterval(syncIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      newSocket.emit("user:offline", { userId: user._id });
      newSocket.disconnect();
    };
  }, [user?.token, user?._id, backendURL, user?.role]);

  // Fetch initial counts
  useEffect(() => {
    if (!user?.token || user?.role !== "editor") return;

    const fetchInitialCounts = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/orders/new-count`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.data.success) {
          setNewOrdersCount(res.data.count);
        }
      } catch (err) {
        console.error("Failed to fetch initial new orders count:", err);
      }
    };

    fetchInitialCounts();
  }, [user?.token, user?.role, backendURL]);

  // Join a chat room
  const joinRoom = useCallback((orderId) => {
    if (socketRef.current?.connected) {
      console.log("📥 Joining room: order_" + orderId);
      socketRef.current.emit("room:join", { orderId });
      socketRef.current.emit("joinOrderChat", orderId);
    }
  }, []);

  // Leave a chat room
  const leaveRoom = useCallback((orderId) => {
    if (socketRef.current?.connected) {
      console.log("📤 Leaving room: order_" + orderId);
      socketRef.current.emit("room:leave", { orderId });
      socketRef.current.emit("leaveOrderChat", orderId);
    }
  }, []);

  // Send a message with queue support
  const sendMessage = useCallback((orderId, message) => {
    const msgData = {
      orderId,
      message,
      senderId: user?._id,
      senderName: user?.name,
      tempId: `temp_${Date.now()}`, // Temporary ID for optimistic updates
    };

    if (socketRef.current?.connected) {
      console.log("📤 Sending message via socket:", message);
      socketRef.current.emit("message:send", msgData);
    } else {
      console.log("📤 Queuing message for later:", message);
      messageQueueRef.current.push(msgData);
      toast.warning("Message queued - will send when connected");
    }
  }, [user]);

  // Start typing
  const startTyping = useCallback((orderId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing:start", {
        orderId,
        userId: user?._id,
        userName: user?.name,
      });
      socketRef.current.emit("typing", { orderId, isTyping: true });

      if (typingTimeoutRef.current[orderId]) {
        clearTimeout(typingTimeoutRef.current[orderId]);
      }
      typingTimeoutRef.current[orderId] = setTimeout(() => {
        stopTyping(orderId);
      }, 3000);
    }
  }, [user]);

  // Stop typing
  const stopTyping = useCallback((orderId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing:stop", { orderId, userId: user?._id });
      socketRef.current.emit("typing", { orderId, isTyping: false });
    }
    if (typingTimeoutRef.current[orderId]) {
      clearTimeout(typingTimeoutRef.current[orderId]);
      delete typingTimeoutRef.current[orderId];
    }
  }, [user]);

  // Mark messages as read - triggers real-time seen status
  const markAsRead = useCallback((orderId) => {
    if (socketRef.current?.connected) {
      console.log("✓ Marking messages as read for order:", orderId);
      socketRef.current.emit("message:read", { orderId, readBy: user?._id });
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        const diff = newCounts[orderId] || 0;
        delete newCounts[orderId];
        setTotalUnread((t) => Math.max(0, t - diff));
        return newCounts;
      });
    }
  }, [user]);

  // Mark notifications as read
  const markNotificationsRead = useCallback(() => {
    setUnreadNotifications(0);
    if (socketRef.current?.connected) {
      socketRef.current.emit("notifications:read", { userId: user?._id });
    }
  }, [user]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  // Get typing users
  const getTypingUsers = useCallback((orderId) => {
    return typingUsers[orderId] || [];
  }, [typingUsers]);

  // Get unread count
  const getUnreadCount = useCallback((orderId) => {
    return unreadCounts[orderId] || 0;
  }, [unreadCounts]);

  const resetNewOrdersCount = useCallback(() => {
    setNewOrdersCount(0);
  }, []);

  // Update real-time availability (Phase B)
  const updateAvailability = useCallback((isAvailable) => {
    if (socketRef.current?.connected) {
      console.log("⚡ Broadcasting availability:", isAvailable);
      socketRef.current.emit("editor:availability", { userId: user?._id, isAvailable });
    }
  }, [user]);

  const value = {
    socket: socketRef.current,
    connectionState,
    onlineUsers,
    typingUsers,
    unreadCounts,
    totalUnread,
    notifications,
    unreadNotifications,
    newOrdersCount,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    markNotificationsRead,
    resetNewOrdersCount,
    updateAvailability,
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
