import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly allowedIps: string[];

  constructor(private configService: ConfigService) {
    const ips = process.env.ALLOWED_ADMIN_IPS || '';
    this.allowedIps = ips.split(',').map(ip => ip.trim()).filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // RESILIENT BYPASS: Explicitly allow auth entry points by URL string
    // This ensures that the workstation can at least attempt to login/verify MFA
    if (url.includes('/auth/login') || url.includes('/auth/mfa/verify') || url.includes('/auth/status')) {
      return true;
    }

    const rawIp = request.ip || request.headers['x-forwarded-for'];
    
    // Normalize IP (remove ipv6 prefix if it's ipv4 mapped)
    const clientIp = typeof rawIp === 'string' ? rawIp.replace(/^.*:/, '') : '';

    if (this.allowedIps.length === 0) {
      return true; // Whitelist not configured
    }

    const isWhitelisted = this.allowedIps.includes(clientIp) || clientIp === '127.0.0.1' || clientIp === '::1';

    if (!isWhitelisted) {
       console.warn(`Blocked access from non-whitelisted IP: ${clientIp}`);
       throw new ForbiddenException(`Access denied for IP: ${clientIp}. This workstation is not whitelisted.`);
    }

    return true;
  }
}
