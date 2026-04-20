import { Injectable, OnModuleDestroy, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD;

    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return 10000; // Wait 10 seconds between retries
      },
      maxRetriesPerRequest: 0, // Fail immediately instead of buffering
    });
  }

  getClient(): Redis {
    return this.client;
  }

  /**
   * Sliding window rate limiter logic using Redis ZSET
   * @param key The unique key for the limiter (e.g. rate_limit:login:1.2.3.4)
   * @param limit Max requests allowed in the window
   * @param windowSeconds Duration of the window in seconds
   */
  async isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const oldestTimestamp = now - windowMs;

    const pipeline = this.client.pipeline();

    // Remove old timestamps outside the window
    pipeline.zremrangebyscore(key, 0, oldestTimestamp);
    // Add current timestamp
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    // Count timestamps in the window
    pipeline.zcard(key);
    // Set expiry on the key
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();
    if (!results) return false;

    const count = results[2][1] as number;
    return count > limit;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
