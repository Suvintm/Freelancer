import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get(`${backendURL}/api/notifications?limit=5`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.token) {
        // Set default auth header globally
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${parsedUser.token}`;

        axios
          .get(`${backendURL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${parsedUser.token}` },
          })
          .then((res) => {
            // ✅ preserve token after refresh
            const updatedUser = { ...res.data.user, token: parsedUser.token };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            fetchNotifications(); // Fetch notifications on load
          })
          .catch(() => {
            setUser(null);
            localStorage.removeItem("user");
          })
          .finally(() => setLoadingUser(false));
      } else {
        setLoadingUser(false);
      }
    } else {
      setLoadingUser(false);
    }
  }, [backendURL]);

  const [socket, setSocket] = useState(null);

  // Socket.io Connection
  useEffect(() => {
    if (user) {
      const socketInstance = io(backendURL, {
        query: { userId: user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("newNotification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        // Optional: Play a sound or show a toast
      });

      return () => socketInstance.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user, backendURL]);

  // Initial fetch on load
  useEffect(() => {
    if (user?.token) {
      fetchNotifications();
    }
  }, [user?.token]);

  // Keep localStorage synced when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      if (user.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
      }
    } else {
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        showAuth,
        setShowAuth,
        backendURL,
        loadingUser,
        notifications,
        unreadCount,
        fetchNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
