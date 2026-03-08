// firebase-messaging-sw.js
// ✅ SW Version: v10 — Data-only payload, Order ID display, Smart grouping, App-closed support
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd/idb-keyval-iife.min.js');

// Initialize Firebase using config passed in query params (avoids hardcoding secrets)
const urlParams = new URL(location).searchParams;
const config = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};

if (config.apiKey) {
  firebase.initializeApp(config);
} else {
  console.warn('[SW] No Firebase config in query params. Working in limited mode.');
}

// ⚡ Instant Activation — new SW activates immediately without waiting for old clients
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const messaging = firebase.messaging();

// =============================================================================
// BACKGROUND MESSAGE HANDLER — the ONLY notification display handler.
// ✅ Works when app is open, backgrounded, OR CLOSED.
// ✅ Handles chat message stacking with persistent IndexedDB history.
// ✅ Shows Order ID in notification title for order-related messages.
// ✅ Groups messages per order — each order has its own stacked notification.
// =============================================================================
messaging.onBackgroundMessage(async (payload) => {
  const data = payload.data || {};
  const type = data.type || "standard";
  const chatId = data.orderId || null;
  const orderNumber = data.orderNumber || null;
  const senderName = data.senderName || "SuviX";
  const messageBody = data.body || "";
  const notifTag = data.tag || undefined;

  // ── CHAT MESSAGE (Order Chat) ──────────────────────────────────────────────
  if (type === "chat_message" && chatId) {
    // 1. Load persistent history for this chat from IndexedDB
    let history = [];
    try {
      history = (await idbKeyval.get(`chat_history_${chatId}`)) || [];
    } catch (_) {}

    // 2. Append new message
    history.push(messageBody);
    if (history.length > 5) history.shift(); // keep last 5

    // 3. Persist updated history
    try {
      await idbKeyval.set(`chat_history_${chatId}`, history);
    } catch (_) {}

    // 4. Build rich display
    //    Title: "Order #SUVIX-001 • SenderName" or "SenderName (N messages)"
    const orderLabel = orderNumber ? `Order #${orderNumber}` : null;
    let displayTitle;
    if (orderLabel) {
      // With order number: "Order #SUVIX-001 • Suvin (3 messages)"
      displayTitle = history.length > 1
        ? `${orderLabel} • ${senderName} (${history.length} messages)`
        : `${orderLabel} • ${senderName}`;
    } else {
      // Fallback without order number
      displayTitle = history.length > 1
        ? `${senderName} (${history.length} messages)`
        : senderName;
    }

    // 5. Body: stacked messages (desktop shows all; mobile shows latest naturally)
    const stackedBody = history.join("\n");

    return self.registration.showNotification(displayTitle, {
      body: stackedBody,
      icon: data.senderAvatar || "/icons/notification-icon.png",
      badge: "/icons/notification-badge2.png",
      // 🔑 tag = chat_${orderId} → same order messages UPDATE the same notification
      //    Different orders get different tags → stack independently in the tray
      tag: `chat_${chatId}`,
      renotify: true,           // Buzz/alert user even when updating existing notification
      requireInteraction: false,
      timestamp: Date.now(),
      data: {
        url: data.click_action || data.link || `/chat/${chatId}`,
        chatId: chatId,
      }
    });
  }

  // ── ALL OTHER NOTIFICATIONS (Follow, Order status, etc.) ──────────────────
  const title = data.title || "SuviX";

  return self.registration.showNotification(title, {
    body: messageBody,
    icon: data.senderAvatar || "/icons/notification-icon.png",
    badge: "/icons/notification-badge2.png",
    vibrate: [200, 100, 200],
    tag: notifTag,
    renotify: notifTag ? true : false,
    requireInteraction: false,
    timestamp: Date.now(),
    data: {
      url: data.click_action || data.link || "/notifications"
    }
  });
});

// =============================================================================
// NOTIFICATION CLICK HANDLER
// Opens the correct URL or focuses existing tab. Clears chat history on click.
// =============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications";
  const chatId = event.notification.data?.chatId;

  // Clear stacked history when user clicks — fresh start for next batch of messages
  if (chatId) {
    idbKeyval.del(`chat_history_${chatId}`).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if already open
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
