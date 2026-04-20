import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as maxmind from 'maxmind';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Injectable()
export class GeoIpService implements OnModuleInit {
  private lookup: maxmind.Reader<maxmind.CountryResponse> | null = null;
  private readonly logger = new Logger(GeoIpService.name);

  async onModuleInit() {
    try {
      const dbPath = path.resolve(__dirname, '../../../geoip/GeoLite2-Country.mmdb');
      this.lookup = await maxmind.open<maxmind.CountryResponse>(dbPath);
      this.logger.log('🗺️ Geo-IP Database loaded successfully.');
    } catch (error) {
       this.logger.warn('⚠️ Geo-IP Database failed to load. Location detection disabled.');
    }
  }

  getCountry(ip: string): string | null {
    if (!this.lookup) return null;
    const result = this.lookup.get(ip);
    return result?.country?.iso_code || null;
  }
}
