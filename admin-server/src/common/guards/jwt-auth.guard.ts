import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // RESILIENT BYPASS: Explicitly allow auth entry points by URL string
    // This resolves the issue where the Reflector is failing to read @Public() metadata
    if (url.includes('/auth/login') || url.includes('/auth/mfa/verify') || url.includes('/auth/status')) {
      return true;
    }

    try {
      if (this.reflector && typeof this.reflector.get === 'function') {
        const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler()) ||
                        this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getClass());
        if (isPublic) {
          return true;
        }
      }
    } catch (err) {
      // Fallback: If Reflector fails, we've already checked the URL above as a safety net
    }
    return super.canActivate(context);
  }
}
