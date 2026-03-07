// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// This will be replaced by the actual config later.
firebase.initializeApp({
  apiKey: "AIzaSyDG7yF_Wi7w-kQlexlf_mUHLCzqfHTjRy4",
  authDomain: "suvix-2b3f9.firebaseapp.com",
  projectId: "suvix-2b3f9",
  storageBucket: "suvix-2b3f9.firebasestorage.app",
  messagingSenderId: "154559332423",
  appId: "1:154559332423:web:068a1c3d25da2210587162"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || payload.data.title || 'SuviX';
  const notificationOptions = {
    body: payload.notification.body || payload.data.body || '',
    icon: payload.notification.icon || '/icons/suvix-icon.png',
    badge: '/icons/suvix-badge.png',
    image: payload.notification.image || payload.data.image || null, // Rich media image
    vibrate: [200, 100, 200],
    tag: payload.notification.tag || payload.data.tag || 'suvix-notification',
    renotify: true,
    requireInteraction: true,
    actions: payload.notification.actions || [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/suvix-badge.png'
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
        if (client.url === targetUrl && 'focus' in client) {
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
