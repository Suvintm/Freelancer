/**
 * shared/kernel/events.js
 *
 * Internal event bus for domain-to-domain communication.
 * Domains emit events here instead of calling each other directly.
 *
 * HOW IT WORKS NOW (Monolith):
 *   eventBus.emit('user.registered', { userId, email })
 *   → notification domain picks it up via eventBus.on(...)
 *
 * HOW TO SCALE (Microservices):
 *   Replace eventBus.emit → kafka.publish(topic, payload)
 *   Replace eventBus.on   → kafka.subscribe(topic, handler)
 *   Zero changes to the emitting domain code.
 *
 * DOMAIN EVENT CATALOG:
 *   auth:
 *     user.registered        { userId, email, name }
 *     user.logged_in         { userId, ip, deviceId }
 *     user.password_reset    { userId, email }
 *
 *   user:
 *     user.profile_updated   { userId }
 *     user.followed          { followerId, followingId }
 *     user.unfollowed        { followerId, followingId }
 *     user.banned            { userId, reason }
 *
 *   content:
 *     post.created           { postId, userId, type }
 *     post.deleted           { postId, userId }
 *     story.created          { storyId, userId }
 *     story.expired          { storyId, userId }
 *     reaction.added         { postId, userId, emoji }
 *
 *   media:
 *     media.ready            { mediaId, userId, type, urls }
 *     media.failed           { mediaId, userId, error }
 *
 *   creator:
 *     channel.synced         { userId, channelId, videoCount }
 *     quota.exceeded         { remainingUnits }
 *
 *   payment:
 *     payment.success        { paymentId, userId, amount, planId }
 *     payment.failed         { paymentId, userId, reason }
 *     subscription.created   { subscriptionId, userId, planId }
 *     subscription.expired   { subscriptionId, userId }
 *
 *   community:
 *     community.created      { communityId, ownerId }
 *     member.joined          { communityId, userId }
 */

import EventEmitter from 'events';

class SuviXEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners to avoid memory leak warnings
    // (each domain registers multiple listeners)
    this.setMaxListeners(50);
  }

  /**
   * Typed emit — wraps standard emit with logging in dev mode
   */
  publish(event, payload) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[EventBus] 📡 ${event}`, payload);
    }
    this.emit(event, payload);
  }

  /**
   * Typed subscribe — wraps standard on
   */
  subscribe(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler); // Returns unsubscribe fn
  }
}

export const eventBus = new SuviXEventBus();
