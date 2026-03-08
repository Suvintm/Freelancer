import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ReelsProvider } from "./context/ReelsContext";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// Instagram-style smart refresh:
// If user was away for 30+ minutes, invalidate all caches on return.
const AWAY_THRESHOLD = 30 * 60 * 1000; // 30 min
let hiddenAt = null;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hiddenAt = Date.now();
  } else if (hiddenAt && Date.now() - hiddenAt > AWAY_THRESHOLD) {
    queryClient.invalidateQueries(); // background refetch all
    hiddenAt = null;
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);
export default App;