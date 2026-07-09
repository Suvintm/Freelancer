// src/domains/creator/index.js
export { default as creatorRouter } from './youtubeRoutes.js';
export { default as youtubeQuotaManager } from './services/youtubeQuotaManager.js';
import { bootstrapCreatorEvents } from './events/creator.events.js';

export function bootstrapCreator() {
    bootstrapCreatorEvents();
}
