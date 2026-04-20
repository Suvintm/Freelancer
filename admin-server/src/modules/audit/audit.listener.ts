import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AuditListener {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('audit.log', { async: true })
  async handleAuditLogEvent(payload: any) {
    try {
      await this.prisma.adminActivityLog.create({
        data: {
          adminId: payload.adminId,
          adminEmail: payload.adminEmail,
          action: payload.action,
          resourceType: payload.resourceType,
          resourceId: String(payload.resourceId || ''),
          oldValue: payload.oldValue,
          newValue: payload.newValue,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          status: payload.status,
          failureReason: payload.failureReason,
          durationMs: payload.durationMs,
        },
      });
    } catch (error) {
      // In production, send to fallback logger if DB logging fails
      console.error('CRITICAL: Audit Logging Failed:', error);
    }
  }
}
