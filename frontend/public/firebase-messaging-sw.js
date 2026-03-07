// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  // 🧹 Production: Remove verbose logs for cleaner client console
  // console.log('[firebase-messaging-sw.js] Background Payload:', JSON.stringify(payload, null, 2));
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'SuviX';
  const tag = payload.notification?.tag || payload.data?.tag || undefined;
  
  // 📷 Instagram-style: Show sender avatar as icon if available, otherwise brand logo
  const icon = payload.data?.senderAvatar || payload.notification?.icon || '/icons/notification-icon.png';
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: icon,
    badge: '/icons/notification-badge2.png',
    image: payload.notification?.image || payload.data?.image || null, // Rich media thumbnail
    vibrate: [200, 100, 200],
    tag: tag,
    renotify: tag ? true : false,
    requireInteraction: false, // Don't block screen for standard alerts (User preference)
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
