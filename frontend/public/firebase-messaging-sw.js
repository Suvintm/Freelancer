// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd/idb-keyval-iife.min.js');

// Initialize the Firebase app in the service worker.
// These values are passed dynamically from the main thread during registration 
// to avoid hardcoding secrets in this public file.
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
  console.warn('[firebase-messaging-sw.js] No config found in query params. SW may not function correctly.');
}

// 🚀 Instant Activation: Ensure new versions take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const messaging = firebase.messaging();

// � Production: Native Push Event listener (The Slack/Discord trick)
// This listener fires as soon as the push packet arrives, often bypassing 
// the throttling that occasionally affects high-level wrappers.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    // Only show if it's a valid data-only payload with title
    if (payload.data && payload.data.title) {
      const title = payload.data.title;
      const options = {
        body: payload.data.body || "",
        icon: payload.data.senderAvatar || "/icons/notification-icon.png",
        badge: "/icons/notification-badge2.png",
        tag: payload.data.tag,
        renotify: true,
        timestamp: Date.now(), // 🕒 Production: Ensure correct OS ordering
        data: { url: payload.data.link || "/notifications" }
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (e) {} // Fail gracefully
});

// �📥 Note: We now use IndexedDB (idb-keyval) instead of in-memory store
// to ensure message history persists across Service Worker reloads.

// Handle background messages
messaging.onBackgroundMessage(async (payload) => {
  // 🧹 Production: Remove verbose logs for cleaner client console
  // console.log('[firebase-messaging-sw.js] Background Payload:', JSON.stringify(payload, null, 2));
  
  const type = payload.data?.type || "standard";
  const chatId = payload.data?.orderId || "default";
  const senderName = payload.data?.senderName || payload.notification?.title || "SuviX";
  const messageBody = payload.notification?.body || payload.data?.body || "";
  const tag = payload.notification?.tag || payload.data?.tag || undefined;

  // 1. Logic for Chat Message Stacking (InboxStyle + Persistent)
  if (type === "chat_message" && chatId !== "default") {
    // 📥 Retrieve persistent history from IndexedDB
    let messageLines = [];
    try {
      messageLines = (await idbKeyval.get(`chat_history_${chatId}`)) || [];
    } catch (e) {
      console.error("[SW] Error reading idb:", e);
    }
    
    // Add new message to the list
    messageLines.push(messageBody);
    
    // Keep only last 5 messages to avoid overflow
    if (messageLines.length > 5) {
      messageLines.shift();
    }
    
    // 💾 Save back to IndexedDB
    try {
      await idbKeyval.set(`chat_history_${chatId}`, messageLines);
    } catch (e) {
      console.error("[SW] Error writing idb:", e);
    }
    
    // 📱 Adaptive UI: Update title with count for clear mobile & desktop UX
    const displayTitle = senderName + (messageLines.length > 1 ? ` (${messageLines.length} messages)` : "");
    
    // Body shows the stacked history for desktop support
    const stackedBody = messageLines.join("\n");

    const notificationOptions = {
      body: stackedBody,
      icon: payload.data?.senderAvatar || payload.notification?.icon || "/icons/notification-icon.png",
      badge: "/icons/notification-badge2.png",
      image: payload.notification?.image || payload.data?.image || null,
      tag: `chat_${chatId}`,
      renotify: true,
      timestamp: Date.now(), // 🕒 Production: Correct chronology
      requireInteraction: false,
      data: {
        url: payload.data?.click_action || payload.data?.link || "/notifications",
        chatId: chatId
      }
    };

    return self.registration.showNotification(displayTitle, notificationOptions);
  }

  // 2. Standard Logic for other notifications (Follows, Orders, etc.)
  const notificationTitle = payload.notification?.title || payload.data?.title || 'SuviX';
  const icon = payload.data?.senderAvatar || payload.notification?.icon || '/icons/notification-icon.png';
  
  const notificationOptions = {
    body: messageBody,
    icon: icon,
    badge: '/icons/notification-badge2.png',
    image: payload.notification?.image || payload.data?.image || null,
    vibrate: [200, 100, 200],
    tag: tag,
    renotify: tag ? true : false,
    timestamp: Date.now(), // 🕒 Production: Correct chronology
    requireInteraction: false,
    actions: payload.notification?.actions || [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/notification-badge2.png'
      }
    ],
    data: {
      url: payload.data?.click_action || payload.data?.link || '/notifications'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification item click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data.url;
  const chatId = event.notification.data.chatId;

  // 🧹 Clear history from IndexedDB on click to reset the stack
  if (chatId) {
    idbKeyval.del(`chat_history_${chatId}`).catch(() => {});
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // 🔗 Production: Use .includes() to match URLs even if they have slightly different query params
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
