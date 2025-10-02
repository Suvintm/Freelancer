// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        showAuth,
        setShowAuth,
        backendURL: import.meta.env.VITE_BACKEND_URL, // global backend URL
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for easier usage
export const useAppContext = () => useContext(AppContext);
