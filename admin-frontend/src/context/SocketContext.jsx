import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAdmin } from "./AdminContext";
import { toast } from "react-hot-toast";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};

export const SocketProvider = ({ children }) => {
  const { admin, backendURL, fetchNotifications, fetchAlerts } = useAdmin();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (!admin) return;

    // backendURL is likely "http://localhost:5000/api", we need the root
    const socketUrl = backendURL.replace("/api", "");
    const token = localStorage.getItem("adminToken");

    console.log("🔌 Admin Socket: Connecting to", socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Admin Socket Connected:", newSocket.id);
      setIsConnected(true);
      newSocket.emit("user:online", { userId: admin.id });
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Admin Socket Disconnected");
      setIsConnected(false);
    });

    // Real-time Notifications
    newSocket.on("notification:new", (notification) => {
      console.log("🔔 New Admin Notification:", notification);
      fetchNotifications();
      fetchAlerts(); // Refresh dashboard counts
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-surface shadow-premium rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-xs font-black text-primary uppercase tracking-tight">
                  {notification.title || "System Alert"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-surface rounded-lg p-2 flex items-center justify-center text-muted hover:text-primary transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    });

    // Global Maintenance Broadcast
    newSocket.on("admin:maintenance", ({ isActive }) => {
      if (isActive) {
         toast.error("SYSTEM ALERT: Maintenance mode is now ACTIVE platform-wide.", { duration: 10000 });
      } else {
         toast.success("SYSTEM ALERT: Maintenance mode has been deactivated.", { duration: 5000 });
      }
      fetchAlerts();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [admin, backendURL, fetchNotifications, fetchAlerts]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
