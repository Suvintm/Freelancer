import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, tap } from 'rxjs';
import { AUDIT_ACTION_KEY, AuditOptions } from '../decorators/audit.decorator.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private eventEmitter: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // RESILIENT BYPASS: Do not crash if Reflector tool is broken
    // Especially important for auth status routes
    if (url.includes('/auth/status')) {
      return next.handle();
    }

    let auditOptions: AuditOptions | undefined;
    
    try {
      if (this.reflector && typeof this.reflector.getAllAndOverride === 'function') {
        auditOptions = this.reflector.getAllAndOverride<AuditOptions>(AUDIT_ACTION_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
      }
    } catch (err) {
      // Fail-safe: Log failure but do not crash the request
      console.warn('AuditInterceptor: Reflector mismatch - logging disabled for this request.');
    }

    if (!auditOptions) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          this.emitAuditEffect(context, auditOptions, startTime, 'SUCCESS', responseBody);
        },
        error: (error) => {
          this.emitAuditEffect(context, auditOptions, startTime, 'FAILURE', null, error);
        },
      }),
    );
  }

  private emitAuditEffect(
    context: ExecutionContext,
    options: AuditOptions,
    startTime: number,
    status: 'SUCCESS' | 'FAILURE',
    response?: any,
    error?: any,
  ) {
    const request = context.switchToHttp().getRequest();
    const durationMs = Date.now() - startTime;
    const user = request.user;

    const auditData = {
      adminId: user?.id,
      adminEmail: user?.email,
      action: options.action,
      resourceType: options.resource,
      resourceId: request.params?.id || request.body?.id,
      ipAddress: request.ip || request.headers['x-forwarded-for'],
      userAgent: request.headers['user-agent'],
      status,
      durationMs,
      oldValue: request.body?._oldValue, // Logic to capture old state can be added via specific services
      newValue: status === 'SUCCESS' ? request.body : null,
      failureReason: error?.message,
    };

    // Fire and forget - handled by AuditListener
    this.eventEmitter.emit('audit.log', auditData);
  }
}
