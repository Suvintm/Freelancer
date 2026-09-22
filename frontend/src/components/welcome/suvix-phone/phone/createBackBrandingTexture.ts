// ─────────────────────────────────────────────────────────────────────────────
// SUVIX BACK PANEL BRANDING TEXTURE GENERATOR
// Procedurally generates the authentic SuviX brand emblem and
// "CREATORS WITHOUT BORDERS" typography for the rear matte AG glass
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import blackBgLogoUrl from '../../../../assets/blackbglogo.png';

export function createBackBrandingTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Transparent base
  ctx.clearRect(0, 0, width, height);

  // Position logo in lower-middle section (around y = 1360)
  const centerX = width / 2;
  const logoCenterY = 1340;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;

  const renderContent = (logoImg?: HTMLImageElement) => {
    ctx.clearRect(0, 0, width, height);

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      // Draw official SuviX logo image with high fidelity
      const targetW = 440;
      const targetH = (logoImg.naturalHeight / logoImg.naturalWidth) * targetW;
      ctx.drawImage(logoImg, centerX - targetW / 2, logoCenterY - targetH / 2, targetW, targetH);
    } else {
      // Immediate crisp fallback: SuviX emblem + typography
      const iconRadius = 42;
      const iconX = centerX - 110;

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(iconX, logoCenterY, iconRadius, 0, Math.PI * 2);
      ctx.fill();

      // Fingers
      ctx.fillStyle = '#ffffff';
      const barW = 8;
      const heights = [34, 46, 46, 36];
      const offsets = [-15, -5, 5, 15];
      for (let i = 0; i < 4; i++) {
        const bx = iconX + offsets[i] - barW / 2;
        const by = logoCenterY + 14 - heights[i];
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, heights[i], barW / 2);
        ctx.fill();
      }

      ctx.fillStyle = '#090d16';
      ctx.font = 'bold 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('SuviX', iconX + 60, logoCenterY);
    }

    // Tagline: "CREATORS WITHOUT BORDERS" (Clean geometric spaced caps)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillStyle = '#475569';

    const letterSpacing = 10;
    drawSpacedText(ctx, 'CREATORS', centerX, logoCenterY + 130, letterSpacing);
    drawSpacedText(ctx, 'WITHOUT', centerX, logoCenterY + 175, letterSpacing);
    drawSpacedText(ctx, 'BORDERS', centerX, logoCenterY + 220, letterSpacing);

    texture.needsUpdate = true;
  };

  // Initial draw
  renderContent();

  // Load blackbglogo image
  const img = new Image();
  img.src = blackBgLogoUrl;
  img.onload = () => {
    renderContent(img);
  };

  return texture;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  const characters = text.split('');
  let totalWidth = 0;
  const charWidths = characters.map((char) => {
    const w = ctx.measureText(char).width;
    totalWidth += w;
    return w;
  });
  totalWidth += (characters.length - 1) * spacing;

  let currentX = x - totalWidth / 2;
  for (let i = 0; i < characters.length; i++) {
    ctx.fillText(characters[i], currentX + charWidths[i] / 2, y);
    currentX += charWidths[i] + spacing;
  }
}
