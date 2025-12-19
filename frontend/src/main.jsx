import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { BrowserRouter } from "react-router-dom";
import "./index.css"; // 👈 ensure global styles are imported

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <AppProvider>
      <BrowserRouter>
        <SocketProvider>
          <SubscriptionProvider>
            <App />
          </SubscriptionProvider>
        </SocketProvider>
      </BrowserRouter>
    </AppProvider>
  </ThemeProvider>
);
