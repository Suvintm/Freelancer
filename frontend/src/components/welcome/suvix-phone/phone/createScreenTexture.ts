// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE SCREEN TEXTURE GENERATOR — PRODUCTION EDITION (1024x2048)
// Ultra-Crisp Light Mode Ask SuviX Interface with Authentic Assets & Full Viewport Fill
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import asksuvixWhiteBg from '../../../../assets/asksuvixwhitebg.png';
import officialLogo from '../../../../assets/officiallogo.png';

export function createScreenTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  // Render function that draws the complete interface
  function render(bgImage?: HTMLImageElement, logoImage?: HTMLImageElement) {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // ── 1. BASE BACKGROUND & SIGNATURE RIBBON ─────────────────────────────
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      // Draw authentic Ask SuviX white background ribbon asset
      ctx.drawImage(bgImage, 0, 0, width, height);
    } else {
      // High-fidelity programmatic gradient fallback
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#fbfcfe');
      bgGrad.addColorStop(0.3, '#f8fafc');
      bgGrad.addColorStop(0.7, '#f1f5f9');
      bgGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Top ambient purple flow
      const topFlow = ctx.createRadialGradient(width * 0.5, -40, 80, width * 0.5, 0, 550);
      topFlow.addColorStop(0, 'rgba(168, 85, 247, 0.16)');
      topFlow.addColorStop(0.6, 'rgba(216, 180, 254, 0.06)');
      topFlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = topFlow;
      ctx.fillRect(0, 0, width, 550);

      // Bottom fluid ribbon wave
      const ribbonY = height - 420;
      const waveGrad = ctx.createLinearGradient(0, ribbonY, width, ribbonY + 120);
      waveGrad.addColorStop(0, '#0284c7');
      waveGrad.addColorStop(0.35, '#7c3aed');
      waveGrad.addColorStop(0.7, '#c026d3');
      waveGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = waveGrad;
      ctx.beginPath();
      ctx.moveTo(0, ribbonY);
      ctx.bezierCurveTo(width * 0.3, ribbonY - 90, width * 0.7, ribbonY + 60, width, ribbonY - 20);
      ctx.lineTo(width, ribbonY + 70);
      ctx.bezierCurveTo(width * 0.7, ribbonY + 140, width * 0.3, ribbonY - 10, 0, ribbonY + 80);
      ctx.closePath();
      ctx.fill();
    }

    // Edge-to-edge layout geometry with comfortable safe area margins
    const padX = 58;
    const cardW = width - padX * 2; // 908px wide for expansive readability

    // ── 2. STATUS BAR (Top Safe Area) ─────────────────────────────────────
    // Generous insets ensuring complete visibility inside the rounded top corners
    const statusMarginX = 86;
    const statusY = 108;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillText('9:41', statusMarginX, statusY);

    // Status Icons: 5G / Signal Bars, Wi-Fi, Battery
    const iconX = width - statusMarginX - 165;
    // 4 Signal bars
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 4; i++) {
      const h = 12 + i * 6;
      ctx.fillRect(iconX + i * 13, statusY - 4 - h, 8, h);
    }
    // Wifi symbol
    ctx.beginPath();
    ctx.arc(iconX + 78, statusY - 14, 18, Math.PI * 1.25, Math.PI * 1.75);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(iconX + 78, statusY - 11, 10, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // Battery capsule
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(iconX + 108, statusY - 26, 52, 26);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(iconX + 114, statusY - 21, 34, 16);
    ctx.fillRect(iconX + 162, statusY - 19, 4, 12);

    // ── 3. APP HEADER (Ask SuviX Brand) ───────────────────────────────────
    const headerY = 180;
    const logoRadius = 38;
    const logoCenterX = padX + logoRadius + 8;

    if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
      // Draw circular clip around official logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCenterX, headerY, logoRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImage, logoCenterX - logoRadius, headerY - logoRadius, logoRadius * 2, logoRadius * 2);
      ctx.restore();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(logoCenterX, headerY, logoRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Clean fallback avatar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(logoCenterX, headerY, logoRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(logoCenterX, headerY, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title: Ask SuviX
    const titleX = logoCenterX + logoRadius + 18;
    ctx.fillStyle = '#090d16';
    ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillText('Ask SuviX', titleX, headerY + 4);

    // BETA pill badge
    const titleWidth = ctx.measureText('Ask SuviX').width;
    const betaX = titleX + titleWidth + 14;
    const betaY = headerY - 26;
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    roundRect(ctx, betaX, betaY, 84, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('BETA', betaX + 17, betaY + 24);

    // 4-Point Sparkle Icon
    drawSparkle(ctx, betaX + 104, headerY - 8, 14, '#9333ea');

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Your data. Your insights. Your growth.', titleX, headerY + 38);

    // Header Right: Options Button (3 dots)
    const menuX = width - padX - 24;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(menuX, headerY - 10, 3.5, 0, Math.PI * 2);
    ctx.arc(menuX, headerY, 3.5, 0, Math.PI * 2);
    ctx.arc(menuX, headerY + 10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ── 4. CATEGORY TABS [Ask] [Analyze] [Discover] ───────────────────────
    const tabY = 250;
    const tabH = 64;
    const tabGap = 12;
    const tabW = (cardW - tabGap * 2) / 3;

    // Tab 1: Ask (Active dark pill)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    roundRect(ctx, padX, tabY, tabW, tabH, 32);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('🤖  Ask', padX + tabW / 2 - 44, tabY + 41);

    // Tab 2: Analyze (Glass pill)
    drawTabPill(ctx, padX + tabW + tabGap, tabY, tabW, tabH, '📊  Analyze');

    // Tab 3: Discover (Glass pill)
    drawTabPill(ctx, padX + (tabW + tabGap) * 2, tabY, tabW, tabH, '🧭  Discover');

    // ── 5. MAIN AI MESSAGE CARD (Elevated White Card) ─────────────────────
    const msgCardY = 345;
    const msgCardH = 345;

    // Drop shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, padX, msgCardY, cardW, msgCardH, 32);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Message Avatar
    const msgAvatarX = padX + 54;
    const msgAvatarY = msgCardY + 54;
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(msgAvatarX, msgAvatarY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Avatar silhouette
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(msgAvatarX, msgAvatarY - 4, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    roundRect(ctx, msgAvatarX - 12, msgAvatarY + 9, 24, 14, 7);
    ctx.fill();

    // Message Title + Blue Verified Badge
    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText("Hi! I'm SuviX", msgAvatarX + 44, msgAvatarY + 8);

    const verifiedX = msgAvatarX + 248;
    const verifiedY = msgAvatarY - 2;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(verifiedX, verifiedY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(verifiedX - 5, verifiedY);
    ctx.lineTo(verifiedX - 1, verifiedY + 5);
    ctx.lineTo(verifiedX + 7, verifiedY - 4);
    ctx.stroke();

    // Greeting description lines
    ctx.fillStyle = '#334155';
    ctx.font = '500 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Your AI co-pilot for the creator economy.', padX + 36, msgCardY + 128);
    ctx.fillText('Ask me anything about content ideas, brand deals,', padX + 36, msgCardY + 168);
    ctx.fillText('analytics, earnings, or monetization growth.', padX + 36, msgCardY + 208);

    // Callout highlight pill
    const highlightY = msgCardY + 245;
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    roundRect(ctx, padX + 30, highlightY, cardW - 60, 68, 18);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('⚡  Engagement increased by +18.4% this week!', padX + 50, highlightY + 43);

    // ── 6. "TRY ASKING" INTERACTIVE PROMPT CARDS (3 Stacked Cards) ────────
    const promptHeaderY = 725;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Try asking', padX + 8, promptHeaderY);

    // Refresh icon
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(width - padX - 20, promptHeaderY - 8, 10, 0, Math.PI * 1.5);
    ctx.stroke();

    // Prompt Cards (3 items)
    const promptStartY = 750;
    const promptH = 110;
    const promptGap = 14;

    drawPromptCard(
      ctx,
      padX,
      promptStartY,
      cardW,
      promptH,
      '📊',
      '#f3e8ff',
      'How is my content performing?',
      'Avg. Retention: 42.6s (+12%) • 3,840 profile views'
    );

    drawPromptCard(
      ctx,
      padX,
      promptStartY + promptH + promptGap,
      cardW,
      promptH,
      '🎁',
      '#dcfce7',
      'Show brand opportunities for me',
      '3 active deals matched • Est. $850 - $1,500'
    );

    drawPromptCard(
      ctx,
      padX,
      promptStartY + (promptH + promptGap) * 2,
      cardW,
      promptH,
      '💡',
      '#fef3c7',
      'Suggest ideas to grow my audience',
      'Reels breakdown + Bio link strategy • +15.2K reach'
    );

    // ── 7. CREATOR INSIGHT SPOTLIGHT CARD (Fills the Screen Center) ────────
    const spotY = 1145;
    const spotH = 265;

    // Gradient spotlight background
    const spotGrad = ctx.createLinearGradient(padX, spotY, padX + cardW, spotY + spotH);
    spotGrad.addColorStop(0, '#ffffff');
    spotGrad.addColorStop(1, '#f8fafc');

    ctx.shadowColor = 'rgba(15, 23, 42, 0.07)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    roundRect(ctx, padX, spotY, cardW, spotH, 30);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spotlight Header
    drawSparkle(ctx, padX + 44, spotY + 38, 12, '#7c3aed');
    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Creator Insight Spotlight', padX + 66, spotY + 44);

    // LIVE pill
    const liveX = width - padX - 98;
    ctx.fillStyle = '#dcfce7';
    ctx.beginPath();
    roundRect(ctx, liveX, spotY + 22, 72, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(liveX + 18, spotY + 37, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('LIVE', liveX + 30, spotY + 43);

    // 3 Metric Pills Row
    const metricY = spotY + 80;
    const metricW = (cardW - 40 - 24) / 3;
    const metricH = 88;

    drawMetricBox(ctx, padX + 20, metricY, metricW, metricH, '42.6s', 'Avg. Retention', '+12%', '#16a34a');
    drawMetricBox(ctx, padX + 20 + metricW + 12, metricY, metricW, metricH, '3,840', 'Profile Views', '+24%', '#16a34a');
    drawMetricBox(ctx, padX + 20 + (metricW + 12) * 2, metricY, metricW, metricH, '6.2%', 'Save Rate', '+5.1%', '#16a34a');

    // Bottom actionable tip
    ctx.fillStyle = '#475569';
    ctx.font = '500 21px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('💡 Post your next Reel on Wednesday at 6:30 PM for peak reach.', padX + 24, spotY + 222);

    // ── 8. SEARCH / PROMPT INPUT CONTAINER ────────────────────────────────
    const inputY = 1445;
    const inputH = 105;

    ctx.shadowColor = 'rgba(15, 23, 42, 0.1)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, padX, inputY, cardW, inputH, inputH / 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Attachment Paperclip Icon
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(padX + 50, inputY + 48, 12, Math.PI * 0.8, Math.PI * 2);
    ctx.lineTo(padX + 50, inputY + 64);
    ctx.stroke();

    // Placeholder
    ctx.fillStyle = '#64748b';
    ctx.font = '500 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Ask anything about your content, deals...', padX + 88, inputY + 64);

    // Black Circular Send Button
    const sendBtnX = padX + cardW - 55;
    const sendBtnY = inputY + inputH / 2;
    const sendBtnR = 36;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(sendBtnX, sendBtnY, sendBtnR, 0, Math.PI * 2);
    ctx.fill();

    // White Arrow Inside Send Button
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sendBtnX - 8, sendBtnY - 12);
    ctx.lineTo(sendBtnX + 11, sendBtnY);
    ctx.lineTo(sendBtnX - 8, sendBtnY + 12);
    ctx.lineTo(sendBtnX - 3, sendBtnY);
    ctx.closePath();
    ctx.fill();

    // ── 9. ACTION BUTTON: "Open SuviX Studio" (Sleek Pill Capsule) ─────
    const actionBtnY = 1575;
    const actionBtnH = 70;
    const actionBtnW = cardW - 120;
    const actionBtnX = (width - actionBtnW) / 2;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    roundRect(ctx, actionBtnX, actionBtnY, actionBtnW, actionBtnH, actionBtnH / 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Open SuviX Studio  →', width / 2, actionBtnY + 45);
    ctx.textAlign = 'left';

    // ── 10. DISCLAIMER & BRANDING (Safe from Bottom Curves) ───────────────
    const discY = 1810;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Powered by SuviX AI  ✨', width / 2, discY);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('SuviX may make mistakes. Verify important creator decisions.', width / 2, discY + 36);
    ctx.textAlign = 'left';

    // ── 11. MODERN GESTURE NAVIGATION PILL (Safe from Bottom Edge) ────────
    const navY = height - 100;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    roundRect(ctx, width * 0.5 - 90, navY, 180, 8, 4);
    ctx.fill();

    texture.needsUpdate = true;
  }

  // 1. Synchronous initial render (ensures zero-delay first frame)
  render();

  // 2. Asynchronous asset enhancement: load background ribbon & official logo
  let loadedBg: HTMLImageElement | undefined;
  let loadedLogo: HTMLImageElement | undefined;

  const bg = new Image();
  bg.crossOrigin = 'anonymous';
  bg.onload = () => {
    loadedBg = bg;
    render(loadedBg, loadedLogo);
  };
  bg.src = asksuvixWhiteBg;

  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.onload = () => {
    loadedLogo = logo;
    render(loadedBg, loadedLogo);
  };
  logo.src = officialLogo;

  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWING UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTabPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 32);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 41);
  ctx.textAlign = 'left';
}

function drawPromptCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  icon: string,
  iconBg: string,
  title: string,
  sub: string
) {
  ctx.shadowColor = 'rgba(15, 23, 42, 0.05)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 24);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Icon square
  const iconSize = 64;
  const iconX = x + 24;
  const iconY = y + (h - iconSize) / 2;
  ctx.fillStyle = iconBg;
  ctx.beginPath();
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 18);
  ctx.fill();

  ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(icon, iconX + 16, iconY + 44);

  // Text
  const textX = iconX + iconSize + 20;
  ctx.fillStyle = '#090d16';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(title, textX, y + 46);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(sub, textX, y + 78);

  // Chevron Right (→)
  const arrX = x + w - 44;
  const arrY = y + h / 2;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(arrX - 6, arrY - 8);
  ctx.lineTo(arrX + 4, arrY);
  ctx.lineTo(arrX - 6, arrY + 8);
  ctx.stroke();
}

function drawMetricBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  badge: string,
  badgeColor: string
) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top row: Value + Badge
  ctx.fillStyle = '#090d16';
  ctx.font = '900 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(value, x + 16, y + 40);

  ctx.fillStyle = badgeColor;
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(badge, x + w - 58, y + 38);

  // Bottom row: Label
  ctx.fillStyle = '#64748b';
  ctx.font = '500 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(label, x + 16, y + 68);
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.quadraticCurveTo(cx, cy, cx + radius, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + radius);
  ctx.quadraticCurveTo(cx, cy, cx - radius, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - radius);
  ctx.closePath();
  ctx.fill();
}
