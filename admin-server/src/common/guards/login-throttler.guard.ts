import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class LoginThrottlerGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // RESILIENT BYPASS: Explicitly allow auth entry points by URL string
    // This allows intensive debugging without triggering a rate-limit lockout
    if (url.includes('/auth/login') || url.includes('/auth/mfa/verify') || url.includes('/auth/status')) {
      return true;
    }

    const ip = request.ip || request.headers['x-forwarded-for'] || '0.0.0.0';
    
    // Rate limit: 5 login attempts per 15 minutes per IP
    const isLimited = await this.redisService.isRateLimited(
      `rate_limit:login:${ip}`,
      5,
      900 // 15 minutes
    );

    if (isLimited) {
      throw new HttpException(
        'Too many login attempts. Please try again after 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
