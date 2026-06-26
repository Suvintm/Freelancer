import { eventBus } from "../../shared/kernel/events.js";
import notificationService from "./services/notificationService.js";
import logger from "../../infrastructure/monitoring/logger.js";

/**
 * Domain Subscriber
 * Listens to events from other domains (e.g. auth, user)
 * and triggers notification logic internally.
 */
export const initNotificationSubscribers = () => {
  eventBus.subscribe("user.registered", async (payload) => {
    try {
      const { userId, fullName } = payload;
      
      await notificationService.notify({
        userId,
        type: 'WELCOME',
        title: 'Welcome to SuviX! 🚀',
        body: `We're thrilled to have you here, ${fullName || 'User'}. Your professional profile is now live!`,
        priority: 'HIGH',
        metadata: { type: 'onboarding_welcome', onboarding_complete: true }
      });
      
      logger.info(`[Event] Processed user.registered for ${userId} in Notification domain.`);
    } catch (error) {
      logger.error(`[Event Error] Failed to process user.registered: ${error.message}`);
    }
  });
  
  logger.info("📡 [Subscribers] Notification domain subscribed to events.");
};
