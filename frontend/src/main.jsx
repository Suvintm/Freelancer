import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ReelsProvider } from "./context/ReelsContext";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <AppProvider>
      <ReelsProvider>
        <BrowserRouter>
          <SocketProvider>
            <SubscriptionProvider>
              <App />
            </SubscriptionProvider>
          </SocketProvider>
        </BrowserRouter>
      </ReelsProvider>
    </AppProvider>
  </ThemeProvider>
);
