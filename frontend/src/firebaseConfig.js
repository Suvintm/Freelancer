// frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// FOR PROD: Add these to your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request permission and get token
export const requestForToken = async (backendURL) => {
  try {
    // 1. Register Service Worker explicitly (FCM requires this for background messages)
    if ('serviceWorker' in navigator) {
      // 🚀 SW_VERSION v2: Automatic update detection
      const SW_VERSION = "v2";
      
      // Pass config and version as query parameters to avoid hardcoding secrets
      const swUrl = `/firebase-messaging-sw.js?v=${SW_VERSION}&` + 
        `apiKey=${encodeURIComponent(import.meta.env.VITE_FIREBASE_API_KEY)}&` +
        `authDomain=${encodeURIComponent(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)}&` +
        `projectId=${encodeURIComponent(import.meta.env.VITE_FIREBASE_PROJECT_ID)}&` +
        `storageBucket=${encodeURIComponent(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)}&` +
        `messagingSenderId=${encodeURIComponent(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)}&` +
        `appId=${encodeURIComponent(import.meta.env.VITE_FIREBASE_APP_ID)}`;

      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('✅ Service Worker registered with scope:', registration.scope);
    }

    // 2. Request permission
    const permission = await Notification.requestPermission();
    console.log('🔔 Notification Permission:', permission);
    
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
      });
      
      if (currentToken) {
        console.log('✅ FCM Token generated:', currentToken.substring(0, 10) + '...');
        
        const userData = localStorage.getItem('user');
        if (!userData) return null;
        const user = JSON.parse(userData);

        // Register token with backend
        await fetch(`${backendURL}/api/user/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ token: currentToken })
        });
        return currentToken;
      } else {
        console.warn('⚠️ No registration token available. Request permission to generate one.');
      }
    } else {
      console.warn('❌ Notification permission denied');
    }
  } catch (err) {
    console.error('❌ Error getting FCM token:', err);
  }
  return null;
};

// Listen for messages while app is in foreground
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("🔔 Foreground Message:", payload);
      resolve(payload);
    });
  });
