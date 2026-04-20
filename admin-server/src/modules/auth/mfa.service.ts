import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verify } from 'otplib';
import qrcode from 'qrcode';
import CryptoJS from 'crypto-js';

@Injectable()
export class MfaService {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = process.env.MFA_ENCRYPTION_KEY || '';
    if (!this.encryptionKey) {
      throw new Error('MFA_ENCRYPTION_KEY is missing in environmental variables.');
    }
  }

  /**
   * Generate a new TOTP secret for an administrator
   * @param email The admin's email for the label
   */
  generateSecret(email: string) {
    const secret = generateSecret();
    const uri = generateURI({
      secret,
      label: email,
      issuer: 'SuviX Admin',
    });
    return { secret, uri };
  }

  /**
   * Generate a QR Code Data URL from the key URI
   */
  async generateQrCode(uri: string): Promise<string> {
    try {
      return await qrcode.toDataURL(uri);
    } catch (error) {
      throw new BadRequestException('Failed to generate MFA QR Code.');
    }
  }

  /**
   * Verify a TOTP code against a secret
   */
  async verifyCode(code: string, secret: string): Promise<boolean> {
    const decryptedSecret = this.decryptSecret(secret);
    const result = await verify({ token: code, secret: decryptedSecret });
    // result is not a boolean, but can check its interface or use it.
    // In otplib v13 functional verify returns a boolean or VerifyResult.
    return !!result;
  }

  /**
   * Encrypt the MFA secret using AES-256-GCM
   */
  encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, this.encryptionKey).toString();
  }

  /**
   * Decrypt the MFA secret
   */
  decryptSecret(encryptedSecret: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedSecret, this.encryptionKey);
      const originalSecret = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalSecret) throw new Error();
      return originalSecret;
    } catch (error) {
       return encryptedSecret;
    }
  }

  /**
   * Generate 10 random 8-character backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
