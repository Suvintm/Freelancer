import * as dotenv from 'dotenv';
dotenv.config();

const { default: redis } = await import('./src/infrastructure/cache/redis.client.js');

const keys = await redis.call('KEYS', '*subscription*');
if (keys && keys.length) {
    // Delete keys one by one using redis.del because it expects the string key
    for (const key of keys) {
        await redis.del(key);
    }
    console.log('Cleared', keys.length, 'keys');
} else {
    console.log('No subscription cache keys found.');
}
process.exit(0);
