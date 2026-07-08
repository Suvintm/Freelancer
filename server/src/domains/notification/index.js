// src/domains/notification/index.js
import { initNotificationSubscribers } from "./events/notification.handlers.js";
import logger from '../../infrastructure/monitoring/logger.js';
export { default as notificationRouter } from './notificationRoutes.js';

export function bootstrapNotification() {
  initNotificationSubscribers();
  logger.info('Notification domain bootstrapped');
}
