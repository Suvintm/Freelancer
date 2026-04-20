import { Controller, Post, Body, Get, Req, UseGuards, BadRequestException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service.js';
import { MfaService } from './mfa.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { LoginThrottlerGuard } from '../../common/guards/login-throttler.guard.js';
import { IpWhitelistGuard } from '../../common/guards/ip-whitelist.guard.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/types/permissions.types.js';
import { LogAudit } from '../../common/decorators/audit.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => MfaService))
    private readonly mfaService: MfaService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  @Public()
  @UseGuards(LoginThrottlerGuard, IpWhitelistGuard)
  @LogAudit('admin.login')
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('mfa/setup')
  @RequirePermissions(Permission.ADMINS_VIEW)
  async setupMfa(@CurrentUser() user: any) {
    const { secret, uri } = this.mfaService.generateSecret(user.email);
    const qrCode = await this.mfaService.generateQrCode(uri);
    
    // Encrypt and store temporarily (unactivated)
    const encryptedSecret = this.mfaService.encryptSecret(secret);
    await this.prisma.superAdmin.update({
      where: { id: user.id },
      data: { mfa_secret: encryptedSecret }
    });

    return { qrCode, secret };
  }

  @Post('mfa/activate')
  async activateMfa(@CurrentUser() user: any, @Body('code') code: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: user.id } });
    if (!admin?.mfa_secret) throw new BadRequestException('MFA not setup.');

    const isValid = await this.mfaService.verifyCode(code, admin.mfa_secret);
    if (!isValid) throw new UnauthorizedException('Invalid MFA code.');

    await this.prisma.superAdmin.update({
      where: { id: user.id },
      data: { mfa_enabled: true }
    });

    return { success: true, message: 'MFA activated successfully.' };
  }

  @Public()
  @Post('mfa/verify')
  async verifyMfa(@Body('mfaToken') mfaToken: string, @Body('code') code: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    try {
      const payload = this.jwtService.verify(mfaToken, {
        publicKey: this.config.get('JWT_PUBLIC_KEY'),
        algorithms: ['RS256']
      });

      if (payload.purpose !== 'mfa_verification') throw new Error();

      return this.authService.verifyMfaChallenge(payload.sub, code, ip, userAgent);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired MFA token.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return {
      success: true,
      data: user,
    };
  }

  @Public()
  @Get('status')
  async status() {
    return { status: 'Authentication Service Online (NestJS v11)' };
  }
}
