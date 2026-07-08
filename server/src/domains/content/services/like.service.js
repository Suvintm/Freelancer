import redisProxy from '../../../infrastructure/cache/redis.client.js';
import logger from '../../../infrastructure/monitoring/logger.js';

const LUA_TOGGLE_LIKE = `
  local likeSetKey = KEYS[1]
  local countKey = KEYS[2]
  local dirtyKey = KEYS[3]
  local userId = ARGV[1]
  local itemKey = ARGV[2]
  local action = ARGV[3]
  local nowScore = ARGV[4]

  local isCurrentlyLiked = redis.call('sismember', likeSetKey, userId)
  
  local shouldLike = 0
  if action == "like" then
    shouldLike = 1
  elseif action == "unlike" then
    shouldLike = 0
  else
    -- Fallback to toggle behavior if no explicit action
    if isCurrentlyLiked == 1 then
      shouldLike = 0
    else
      shouldLike = 1
    end
  end

  if shouldLike == 1 and isCurrentlyLiked == 0 then
    -- User wants to like, and is NOT currently liking
    redis.call('sadd', likeSetKey, userId)
    redis.call('incr', countKey)
    redis.call('zadd', dirtyKey, nowScore, itemKey)
    return {1, redis.call('get', countKey)}
  elseif shouldLike == 0 and isCurrentlyLiked == 1 then
    -- User wants to unlike, and IS currently liking
    redis.call('srem', likeSetKey, userId)
    redis.call('decr', countKey)
    redis.call('zadd', dirtyKey, nowScore, itemKey)
    return {0, redis.call('get', countKey)}
  else
    -- No-op: already in desired state
    return {isCurrentlyLiked, redis.call('get', countKey)}
  end
`;

/**
 * Handle a like/unlike optimally using a strictly atomic Redis Lua Script
 * @param {string} type - 'POST', 'REEL', 'YOUTUBE_POST', 'POLL'
 * @param {string} id - The content ID
 * @param {string} userId - The user ID
 * @param {string} action - 'like' or 'unlike' (optional, falls back to toggle)
 */
export const toggleLike = async (type, id, userId, action = "") => {
    if (!redisProxy) {
        throw new Error("Redis is required for this operation");
    }

    const setKey = `feed:likes:users:${type}:${id}`;
    const countKey = `feed:likes:count:${type}:${id}`;
    const dirtyKey = `feed:likes:dirty`;
    const itemKey = `${type}:${id}`;
    const nowScore = Date.now().toString();

    const [isLikedResult, newCount] = await redisProxy.eval(
        LUA_TOGGLE_LIKE,
        3, // number of keys
        setKey, countKey, dirtyKey,
        userId, itemKey, action, nowScore
    );

    return { 
        isLiked: isLikedResult === 1,
        count: parseInt(newCount || '0', 10) 
    };
};

/**
 * Helper to fetch the current count from Redis, falling back to DB eventually
 */
export const getLikeCount = async (type, id) => {
    const countKey = `feed:likes:count:${type}:${id}`;
    const val = await redisProxy.get(countKey);
    return val ? parseInt(val, 10) : null;
};
