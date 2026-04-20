import { Module, Global } from '@nestjs/common';
import { AuditListener } from './audit.listener.js';
import { GeoIpService } from './geoip.service.js';

@Global()
@Module({
  providers: [AuditListener, GeoIpService],
  exports: [AuditListener, GeoIpService],
})
export class AuditModule {}
