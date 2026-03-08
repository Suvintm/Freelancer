// firebase-messaging-sw.js
// ✅ SW Version: v12 — Centralized Logic, Foreground delegation, Data-only support
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd/idb-keyval-iife.min.js');

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
  console.warn('[SW] No Firebase config in query params.');
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const messaging = firebase.messaging();

// =============================================================================
// CENTRALIZED DISPLAY LOGIC
// This function handles ALL notification display logic for:
// 1. Background messages (via onBackgroundMessage)
// 2. Foreground messages (via postMessage from main thread)
// =============================================================================
async function handleNotificationDisplay(data) {
  const type = data.type || "standard";
  const chatId = data.orderId || null;
  const orderNumber = data.orderNumber || null;
  const senderName = data.senderName || "SuviX";
  const messageBody = data.body || "";
  const notifTag = data.tag || undefined;

  // ── CHAT MESSAGE (Order Chat) ──────────────────────────────────────────────
  if (type === "chat_message" && chatId) {
    let history = [];
    try {
      history = (await idbKeyval.get(`chat_history_${chatId}`)) || [];
    } catch (_) {}

    history.push(messageBody);
    if (history.length > 5) history.shift();

    try {
      await idbKeyval.set(`chat_history_${chatId}`, history);
    } catch (_) {}

    const orderLabel = orderNumber ? `Order #${orderNumber}` : null;
    let displayTitle;
    if (orderLabel) {
      displayTitle = history.length > 1
        ? `${orderLabel} • ${senderName} (${history.length} messages)`
        : `${orderLabel} • ${senderName}`;
    } else {
      displayTitle = history.length > 1
        ? `${senderName} (${history.length} messages)`
        : senderName;
    }

    return self.registration.showNotification(displayTitle, {
      body: history.join("\n"),
      icon: data.senderAvatar || '/icons/notification-icon.png',
      badge: '/icons/notification-badge2.png',
      tag: `chat_${chatId}`,
      renotify: true,
      silent: false,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: {
        url: data.click_action || `/chat/${chatId}`,
        chatId: chatId,
      }
    });
  }

  // ── ALL OTHER NOTIFICATIONS ───────────────────────────────────────────────
  const title = data.title || "SuviX";

  return self.registration.showNotification(title, {
    body: messageBody,
    icon: data.senderAvatar || "/icons/notification-icon.png",
    badge: "/icons/notification-badge2.png",
    vibrate: [200, 100, 200],
    tag: notifTag,
    renotify: !!notifTag,
    requireInteraction: false,
    timestamp: Date.now(),
    data: {
      url: data.click_action || data.link || "/notifications"
    }
  });
}

// ── Background Handler ──────────────────────────────────────────────────────
messaging.onBackgroundMessage(async (payload) => {
  console.log('[SW] Background message:', payload);
  return handleNotificationDisplay(payload.data || {});
});

// ── Foreground Delegation Handler ───────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FOREGROUND_MESSAGE') {
    event.waitUntil(handleNotificationDisplay(event.data.payload || {}));
  }
});

// =============================================================================
// NOTIFICATION CLICK HANDLER
// =============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications";
  const chatId = event.notification.data?.chatId;

  if (chatId) {
    idbKeyval.del(`chat_history_${chatId}`).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// =============================================================================
// PUSH SAFETY-NET
// Handles raw push events if FCM SDK misses them.
// =============================================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    if (payload?.notification) {
      const { title = 'SuviX', body = '' } = payload.notification;
      event.waitUntil(
        self.registration.showNotification(title, {
          body,
          icon: '/icons/notification-icon.png',
          badge: '/icons/notification-badge2.png',
          data: { url: payload?.data?.click_action || payload?.data?.link || '/notifications' }
        })
      );
    }
  } catch (_) {}
});
