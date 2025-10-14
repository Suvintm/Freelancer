import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const backendURL = import.meta.env.VITE_BACKEND_URL;

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
