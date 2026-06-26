/**
 * Reaction Buffer Service (ES Module)
 * 
 * This service manages an in-memory queue of reactions to be persisted to the database.
 * In a multi-instance production environment, this should be replaced with Redis.
 */

class ReactionBufferService {
  constructor() {
    this.buffer = [];
  }

  /**
   * Push a new reaction intent to the buffer
   * @param {Object} reaction { messageId, userId, emoji, type: 'add' | 'remove' }
   */
  push(reaction) {
    this.buffer.push({
      ...reaction,
      timestamp: new Date()
    });
    
    if (this.buffer.length % 50 === 0 && this.buffer.length > 0) {
      console.log(`📊 [BUFFER] Reaction buffer reached ${this.buffer.length} items`);
    }
  }

  /**
   * Get and clear the current buffer
   */
  flush() {
    if (this.buffer.length === 0) return [];
    const currentItems = [...this.buffer];
    this.buffer = [];
    return currentItems;
  }
}

const reactionBuffer = new ReactionBufferService();
export default reactionBuffer;
