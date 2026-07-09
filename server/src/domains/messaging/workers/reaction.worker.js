import reactionBuffer from '../services/reaction.service.js';
import prisma from '../../../infrastructure/database/postgres.js';

/**
 * Reaction Worker (ES Module)
 * 
 * Periodically flushes buffered reactions to the primary database.
 */

class ReactionWorker {
  constructor(intervalMs = 10000) {
    this.intervalMs = intervalMs;
    this.timer = null;
    this.isProcessing = false;
  }

  start() {
    console.log(`🚀 [WORKER] Reaction worker started (Interval: ${this.intervalMs}ms)`);
    this.timer = setInterval(() => this.process(), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('🛑 [WORKER] Reaction worker stopped');
    }
  }

  async process() {
    if (this.isProcessing) return;
    
    const items = reactionBuffer.flush();
    if (items.length === 0) return;

    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      console.log(`📂 [WORKER] Processing ${items.length} reactions...`);

      // Using transaction for safe batch processing
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const { messageId, userId, emoji, type } = item;
          
          if (type === 'add') {
            await tx.communityMessageReaction.upsert({
              where: {
                messageId_userId_emoji: { messageId, userId, emoji }
              },
              create: { messageId, userId, emoji },
              update: {}
            });
          } else if (type === 'remove') {
            try {
              await tx.communityMessageReaction.delete({
                where: {
                  messageId_userId_emoji: { messageId, userId, emoji }
                }
              });
            } catch (err) {
              // Ignore if already deleted
            }
          }
        }
      }, {
        timeout: 15000 // Higher timeout for large batches
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [WORKER] Successfully persisted ${items.length} reactions in ${duration}ms`);
    } catch (error) {
      console.error('❌ [WORKER] Critical error in reaction worker:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const initReactionWorker = (interval) => {
  const worker = new ReactionWorker(interval);
  worker.start();
  return worker;
};
