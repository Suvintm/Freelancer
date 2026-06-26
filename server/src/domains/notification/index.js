// src/domains/notification/index.js
import { initNotificationSubscribers } from './notification.subscriber.js';
export { default as notificationRouter } from './notificationRoutes.js';

// Initialize domain listeners
initNotificationSubscribers();
