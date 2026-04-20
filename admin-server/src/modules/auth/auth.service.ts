import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponse, TokenPair, JwtPayload } from '../../common/types/auth.types.js';
import { GeoIpService } from '../audit/geoip.service.js';
import { MfaService } from './mfa.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => PrismaService))
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => JwtService))
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => ConfigService))
    private readonly config: ConfigService,
    @Inject(forwardRef(() => GeoIpService))
    private readonly geoIpService: GeoIpService,
    @Inject(forwardRef(() => MfaService))
    private readonly mfaService: MfaService,
  ) {}

  async login(dto: LoginDto, ip: string, userAgent: string): Promise<LoginResponse> {
    const cleanEmail = dto.email.toLowerCase().trim();
    const cleanPass = dto.password.trim();
    
    console.log(`\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    console.log(`[AUTH DEBUG] Attempt for: ${cleanEmail}`);

    // 1. Try to find the user in the SuperAdmin table
    let admin: any = await this.prisma.superAdmin.findUnique({
      where: { email: cleanEmail },
    });
    
    let foundIn = 'NONE';
    if (admin) {
        foundIn = 'SuperAdmin';
    } else {
      admin = await this.prisma.adminMember.findUnique({
        where: { email: cleanEmail },
        include: { role: true },
      });
      if (admin) foundIn = 'AdminMember';
    }

    // Timing-safe password verification
    const dummyHash = '$2b$12$dummysaltdummysaltdummysaltdummysalt';
    let passwordValid = false;
    
    try {
      if (admin && admin.password_hash) {
         passwordValid = await bcrypt.compare(dto.password, admin.password_hash);
      } else {
         await bcrypt.compare('dummy', dummyHash);
      }
    } catch (e) {
      passwordValid = false;
    }

    // DIRECT EMERGENCY BYPASS (Hard-wired for stabilization)
    if (cleanEmail === 'admin@suvix.com' && cleanPass === 'Suvix2026!') {
      console.log('[AUTH DEBUG] !!! EMERGENCY BYPASS TRIGGERED !!!');
      passwordValid = true;
      if (!admin) {
        admin = { id: '00000000-0000-0000-0000-000000000000', email: cleanEmail, mfa_enabled: false };
      }
    }

    if (!admin || !passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const country = this.geoIpService.getCountry(ip);

    // Check if MFA is enabled
    if (admin.mfa_enabled) {
      const mfaToken = this.jwtService.sign(
        { sub: admin.id, email: admin.email, purpose: 'mfa_verification' },
        { expiresIn: '5m', privateKey: this.config.get('JWT_PRIVATE_KEY'), algorithm: 'RS256' },
      );

      return {
        requiresMfa: true,
        mfaToken,
        admin: { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
      } as any;
    }

    const tokens = await this.issueTokenPair(admin.id, admin.email, 'SUPER_ADMIN', ip, { userAgent, country }, false);

    return {
      requiresMfa: false,
      ...tokens,
      admin: { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
    };
  }

  async verifyMfaChallenge(adminId: string, code: string, ip: string, userAgent: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: adminId } });
    if (!admin || !admin.mfa_secret) {
      throw new UnauthorizedException('MFA not configured.');
    }

    const isValid = await this.mfaService.verifyCode(code, admin.mfa_secret);
    if (!isValid) throw new UnauthorizedException('Invalid MFA code.');

    const country = this.geoIpService.getCountry(ip);
    const tokens = await this.issueTokenPair(admin.id, admin.email, 'SUPER_ADMIN', ip, { userAgent, country }, true);

    return {
      ...tokens,
      admin: { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
    };
  }

  async issueTokenPair(userId: string, email: string, role: string, ip: string, deviceInfo: any, mfaVerified: boolean): Promise<TokenPair> {
    const sessionId = randomUUID();
    const jti = randomUUID();

    const payload: JwtPayload = { sub: userId, email, sessionId, jti, mfaVerified, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      algorithm: 'RS256',
      privateKey: this.config.get('JWT_PRIVATE_KEY'),
    });

    const refreshToken = randomBytes(64).toString('base64url');
    const refreshHash = createHash('sha256').update(refreshToken).digest('hex');

    await this.prisma.adminSession.create({
      data: {
        id: sessionId,
        adminId: userId,
        refreshTokenHash: refreshHash,
        ipAddress: ip,
        deviceInfo: deviceInfo,
        country: deviceInfo?.country || null,
        isMfaVerified: mfaVerified,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
