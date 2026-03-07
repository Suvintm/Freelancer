// server/utils/firebaseAdmin.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import logger from "./logger.js";

let firebaseApp = null;

export const initFirebaseAdmin = () => {
  if (firebaseApp) return firebaseApp;

  // Check if already initialized by another module
  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
    return firebaseApp;
  }

  // Check for credentials in environment variables
  const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    logger.warn("⚠️ Firebase Admin credentials missing. Push notifications and Storage will be disabled.");
    return null;
  }

  try {
    const serviceAccount = {
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/"/g, ""), // Handle escapes and quotes
      clientEmail: FIREBASE_CLIENT_EMAIL,
    };

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    logger.info("✅ Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    logger.error("❌ Firebase Admin initialization failed:", error.message);
    return null;
  }
};

export default initFirebaseAdmin;
