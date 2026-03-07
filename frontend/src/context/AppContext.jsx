import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
          .catch((err) => {
            // Check if user is banned
            if (err.response?.data?.isBanned) {
              localStorage.setItem("banInfo", JSON.stringify({
                banReason: err.response.data.banReason,
                message: err.response.data.message,
              }));
              setUser(null);
              localStorage.removeItem("user");
              window.location.href = "/banned";
              return;
            }
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

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  // ============ FIREBASE FCM INIT ============
  useEffect(() => {
    if (user?.token) {
      const initFCM = async () => {
        try {
          const { requestForToken, onMessageListener } = await import("../firebaseConfig");
          
          // Sync token with server (Internal utility handles permission)
          const token = await requestForToken(backendURL);
          if (token) {
            console.log("🚀 SuviX Push Notifications Active");
          }
          
          // Foreground listener
          onMessageListener().then(async payload => {
            console.log("🔔 Foreground Notification:", payload);
            fetchNotifications();
            
            // FORCE SYSTEM NOTIFICATION in foreground for "Production Level" feel
            if (Notification.permission === 'granted') {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                const title = payload.notification?.title || payload.data?.title || "SuviX";
                const options = {
                  body: payload.notification?.body || payload.data?.body || "",
                  icon: "/icons/suvix-icon.png",
                  badge: "/icons/suvix-badge.png",
                  tag: payload.notification?.tag || payload.data?.tag || "suvix-notification",
                  renotify: true,
                  data: {
                    url: payload.data?.click_action || payload.data?.link || "/notifications"
                  }
                };
                registration.showNotification(title, options);
              }
            }
          }).catch(err => console.log("FCM Listener error:", err));
          
        } catch (err) {
          console.error("FCM Initialization failed:", err);
        }
      };
      initFCM();
    }
  }, [user?.token, backendURL]);

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
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
