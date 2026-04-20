import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_RESOURCE_KEY = 'audit_resource';

export interface AuditOptions {
  action: string;
  resource?: string;
}

export const LogAudit = (options: AuditOptions | string) => {
  const auditOptions = typeof options === 'string' ? { action: options } : options;
  return SetMetadata(AUDIT_ACTION_KEY, auditOptions);
};
