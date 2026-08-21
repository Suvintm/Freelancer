import QRCode from 'qrcode';
import prisma from '../../../infrastructure/database/postgres.js';
import logger from '../../../infrastructure/monitoring/logger.js';
import { uploadBuffer } from '../../../infrastructure/storage/storage-client.js';

export class BioQrService {
  /**
   * Synchronously generate or regenerate personalized QR code for a creator
   * @param {string} userId - Authenticated user UUID
   * @param {Object} options - { slug?: string, color?: string, bg?: string }
   */
  async generateQr(userId, options = {}) {
    console.log(`\n=============================================================`);
    console.log(`🚀 [QR ENGINE] Initiating QR Code Generation for User ID: ${userId}`);
    logger.info(`🚀 [QR ENGINE] Initiating QR Code Generation for User ID: ${userId}`);

    // 1. Fetch user & profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        username: true,
        name: true,
        profile_picture: true,
        qr_generated: true,
        qr_svg_url: true,
        qr_png_url: true,
        qr_version: true,
        qr_generated_at: true,
      },
    });

    if (!userProfile) {
      console.error(`❌ [QR ENGINE] User profile not found for user ${userId}`);
      const error = new Error('User profile not found');
      error.statusCode = 404;
      throw error;
    }

    const username = userProfile.username || 'creator';
    const slug = options.slug && options.slug !== 'main' ? `/${options.slug}` : '';
    const targetUrl = `https://suvix.in/u/${username}${slug}`;

    console.log(`👤 [QR ENGINE] Creator: @${username} (${userProfile.name})`);
    console.log(`🎯 [QR ENGINE] Target Public URL: ${targetUrl}`);

    // 2. Anti-spam rate-limit check (Reject requests within 3 seconds of previous generation)
    if (userProfile.qr_generated_at) {
      const secondsSinceLast = (Date.now() - new Date(userProfile.qr_generated_at).getTime()) / 1000;
      if (secondsSinceLast < 3) {
        console.log(`⏳ [QR ENGINE] Serving cached QR (Generated ${secondsSinceLast.toFixed(1)}s ago)`);
        return {
          success: true,
          cached: true,
          qrSvg: userProfile.qr_svg_url,
          qrPng: userProfile.qr_png_url,
          qrVersion: userProfile.qr_version,
          qrGeneratedAt: userProfile.qr_generated_at,
          targetUrl,
          message: 'QR code freshly generated. Serving cached result.',
        };
      }
    }

    const darkColor = options.color || '#000000';
    const lightColor = options.bg || '#ffffff';

    // 3. Synchronous High-Speed Generation (Level H Error Correction)
    console.log(`⚡ [QR ENGINE] Generating high-resolution Vector SVG and PNG buffers...`);
    const qrSvg = await QRCode.toString(targetUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });

    const qrPngDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 800,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });

    const qrPngBuffer = await QRCode.toBuffer(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 800,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });

    // 4. Upload PNG buffer to S3 storage under folder 'brands/qr-codes'
    let s3StorageKey = null;
    try {
      console.log(`📦 [QR ENGINE] Uploading QR code to S3 storage folder: 'brands/qr-codes'...`);
      const uploadResult = await uploadBuffer(qrPngBuffer, 'brands/qr-codes', {
        userId,
        filename: `${username}_bio_qr_${Date.now()}.png`,
        contentType: 'image/png',
      });

      if (uploadResult && (uploadResult.secure_url || uploadResult.key)) {
        s3StorageKey = uploadResult.secure_url || uploadResult.key;
        console.log(`✅ [QR ENGINE] S3 Upload Successful! Stored Key: ${s3StorageKey}`);
      }
    } catch (s3Error) {
      console.warn(`⚠️ [QR ENGINE] S3 Upload warning (Using high-res data URL fallback): ${s3Error.message}`);
    }

    const newVersion = (userProfile.qr_version || 0) + 1;
    const now = new Date();

    // 5. UPDATE DATABASE ONLY AFTER SUCCESSFUL GENERATION & STORAGE
    console.log(`💾 [QR ENGINE] Updating PostgreSQL Database with new QR metadata (Version ${newVersion})...`);
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: {
        qr_generated: true,
        qr_svg_url: qrSvg,
        qr_png_url: s3StorageKey || qrPngDataUrl,
        qr_version: newVersion,
        qr_generated_at: now,
      },
      select: {
        qr_generated: true,
        qr_version: true,
        qr_generated_at: true,
      },
    });

    console.log(`🎉 [QR ENGINE] Success! QR Code successfully saved to database. Version: ${updated.qr_version}`);
    console.log(`=============================================================\n`);

    return {
      success: true,
      cached: false,
      qrSvg,
      qrPng: s3StorageKey || qrPngDataUrl,
      qrVersion: updated.qr_version,
      qrGeneratedAt: updated.qr_generated_at,
      targetUrl,
    };
  }

  /**
   * Get current QR status for a creator
   */
  async getQrStatus(userId) {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        qr_generated: true,
        qr_svg_url: true,
        qr_png_url: true,
        qr_version: true,
        qr_generated_at: true,
        username: true,
        name: true,
        profile_picture: true,
      },
    });

    if (!userProfile) {
      return { qrGenerated: false };
    }

    return {
      qrGenerated: userProfile.qr_generated,
      qrSvg: userProfile.qr_svg_url,
      qrPng: userProfile.qr_png_url,
      qrVersion: userProfile.qr_version,
      qrGeneratedAt: userProfile.qr_generated_at,
      username: userProfile.username,
      name: userProfile.name,
      avatarUrl: userProfile.profile_picture,
      targetUrl: `https://suvix.in/u/${userProfile.username}`,
    };
  }
}

export default new BioQrService();
