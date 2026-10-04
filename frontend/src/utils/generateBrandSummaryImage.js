import { formatProductName, getCleanProductName } from './formatters.js';
import { extractColor } from './colors.js';

/**
 * Maps brand/group names to local asset logo paths
 */
export function getBrandLogoPath(brandName) {
  if (!brandName) return null;
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  const logoMap = {
    paragon: `${prefix}assets/logos/paragon-original-logo.png`,
    solea: `${prefix}assets/logos/solea-logo.png`,
    paralite: `${prefix}assets/logos/paralite-logo.png`,
    'p-toes': `${prefix}assets/logos/ptoes-logo.png`,
    ptoes: `${prefix}assets/logos/ptoes-logo.png`,
    vertex: `${prefix}assets/logos/vertex-logo.png`,
    meriva: `${prefix}assets/logos/meriva-logo.png`,
    stimulus: `${prefix}assets/logos/stimulus-logo.png`,
    fender: `${prefix}assets/logos/fender-logo.png`,
    fencer: `${prefix}assets/logos/fender-logo.png`,
    comfy: `${prefix}assets/logos/comfy-logo.png`,
    walkaholic: `${prefix}assets/logos/walkaholic-logo.png`,
    cubix: `${prefix}assets/logos/cubix-logo.png`,
    florex: `${prefix}assets/logos/florex-logo.png`,
    action: `${prefix}assets/logos/action-logo.png`,
    reliance: `${prefix}assets/logos/reliance-logo.png`,
    eeken: `${prefix}assets/logos/eeken-logo.png`,
    ajanta: `${prefix}assets/logos/ajanta-logo-hd.png`,
    escoute: `${prefix}assets/logos/escoute-logo.png`,
    teuz: `${prefix}assets/logos/teuz-logo.png`,
    paris: `${prefix}assets/logos/paris-logo.jpg`,
    tara: `${prefix}assets/logos/tara-logo.png`,
    brockkie: `${prefix}assets/logos/brockkie-logo.png`,
    xpania: `${prefix}assets/logos/xpania-logo.png`,
    zibago: `${prefix}assets/logos/zibago-logo.png`,
    alida: `${prefix}assets/logos/alida-logo.png`,
    skil: `${prefix}assets/logos/skil-logo.png`,
    tuffboot: `${prefix}assets/logos/tuffboot-logo.png`,
    gumboot: `${prefix}assets/logos/gumboot-logo.png`,
    max: `${prefix}assets/logos/max-logo.png`,
    school: `${prefix}assets/logos/paragon-school-logo.png`,
  };

  const lower = brandName.toLowerCase();
  for (const [key, path] of Object.entries(logoMap)) {
    if (lower.includes(key)) {
      return path;
    }
  }
  return null;
}

/**
 * Parse product size from name
 */
function getProductSize(name) {
  if (!name) return null;
  const match = name.match(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/);
  if (match) {
    const low = Math.min(parseInt(match[1]), parseInt(match[2]));
    const high = Math.max(parseInt(match[1]), parseInt(match[2]));
    return `${low}x${high}`;
  }
  return null;
}

/**
 * Parse MRP/Price from name
 */
function getProductPrice(name) {
  if (!name) return '—';
  const match = name.match(/((?:RS|MRP|@))[.\s]*(\d+(\.\d+)?)/i);
  if (match) return `₹${match[2]}`;
  const fallback = name.match(/(\d+(\.\d+)?)(?!.*\d)/);
  return fallback ? `₹${fallback[0]}` : '—';
}

/**
 * Computes quantity distribution, top sellers, and new arrivals for a product group
 */
export function computeGroupAnalytics(products = []) {
  const brackets = {
    lt10: { label: '< 10 Pairs', shortLabel: '< 10 QTY', count: 0, qty: 0, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' },
    b10to20: { label: '10 - 20 Pairs', shortLabel: '10 - 20 QTY', count: 0, qty: 0, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
    b20to30: { label: '20 - 30 Pairs', shortLabel: '20 - 30 QTY', count: 0, qty: 0, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.16)' },
    b30to40: { label: '30 - 40 Pairs', shortLabel: '30 - 40 QTY', count: 0, qty: 0, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' },
    gt40: { label: '40+ Pairs (Bulk)', shortLabel: '40+ QTY', count: 0, qty: 0, color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  };

  let totalQty = 0;
  for (const p of products) {
    const q = Number(p.quantity) || 0;
    totalQty += q;
    if (q < 10) {
      brackets.lt10.count++;
      brackets.lt10.qty += q;
    } else if (q <= 20) {
      brackets.b10to20.count++;
      brackets.b10to20.qty += q;
    } else if (q <= 30) {
      brackets.b20to30.count++;
      brackets.b20to30.qty += q;
    } else if (q <= 40) {
      brackets.b30to40.count++;
      brackets.b30to40.qty += q;
    } else {
      brackets.gt40.count++;
      brackets.gt40.qty += q;
    }
  }

  const scoredProducts = products.map((p) => {
    let sold = 0;
    (p.productHistory || []).forEach((h) => {
      if (h.type === 'sold') sold += Number(h.qty) || 0;
    });
    return {
      product: p,
      name: p.productName,
      cleanName: getCleanProductName(p.productName) || p.productName,
      sold,
      qty: Number(p.quantity) || 0,
      size: getProductSize(p.productName) || 'STD',
      price: getProductPrice(p.productName),
      firstSeenAt: p.firstSeenAt ? new Date(p.firstSeenAt) : null,
    };
  });

  const topSelling = [...scoredProducts]
    .sort((a, b) => b.sold - a.sold || b.qty - a.qty)
    .slice(0, 5);

  const newArrivals = [...scoredProducts]
    .sort((a, b) => {
      const timeB = b.firstSeenAt ? b.firstSeenAt.getTime() : 0;
      const timeA = a.firstSeenAt ? a.firstSeenAt.getTime() : 0;
      return timeB - timeA || b.qty - a.qty;
    })
    .slice(0, 5);

  return {
    totalArticles: products.length,
    totalPairs: totalQty,
    brackets,
    topSelling,
    newArrivals,
  };
}

/**
 * Helper to draw a rounded rectangle on Canvas
 */
function drawRoundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  let r = radius;
  if (typeof r === 'number') {
    r = { tl: r, tr: r, br: r, bl: r };
  }
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Loads image from URL safely with timeout
 */
async function loadImgAsync(src, timeoutMs = 2500) {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Generates minimalistic, royal, sexy White-Gold Cover Image for One Touch sharing
 * Shows Date in big letters with Day, Brand Logo, and SBE Play Store Logo on white gold accent.
 *
 * @param {Object} params
 * @param {string} params.groupLabel - Label for group, e.g. "Paragon", "Cubix", "Action"
 * @param {Array<string>} [params.subBrands] - List of included brands
 * @param {Array<Object>} [params.products] - Products in this group
 * @param {string} [params.customLogoUrl] - Custom logo URL override
 * @returns {Promise<{ canvas: HTMLCanvasElement, dataUrl: string, base64: string, blob: Blob }>}
 */
export async function generateBrandSummaryImage({
  groupLabel = 'Footwear Catalog',
  subBrands = [],
  products = [],
  customLogoUrl = null,
} = {}) {
  const WIDTH = 1080;
  const HEIGHT = 1600;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Wait for web fonts if available
  try {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
  } catch (_) {}

  const FONT_SBE_SUB = 'bold 16px "Clash Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const FONT_DAY = 'bold 52px "Clash Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const FONT_DATE_NUM = 'bold 160px "Clash Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const FONT_MONTH_YEAR = 'bold 52px "Clash Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const FONT_CREST = 'bold 16px "Clash Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const FONT_BRAND_FALLBACK = 'bold 56px "Clash Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // 1. BASE BACKGROUND: Pure luminous ivory white with warm royal undertone
  ctx.fillStyle = '#FCFCFA';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. ROYAL DOUBLE GOLD BORDERS
  // Outer gold frame
  ctx.strokeStyle = '#D4AF37'; // Royal Gold
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80);

  // Inner thin gold frame
  ctx.strokeStyle = '#E5C768'; // Fine Champagne Gold
  ctx.lineWidth = 0.8;
  ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);

  // Corner Diamond Accents
  const corners = [
    [40, 40], [WIDTH - 40, 40],
    [40, HEIGHT - 40], [WIDTH - 40, HEIGHT - 40]
  ];
  ctx.fillStyle = '#D4AF37';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. TOP: SBE NEW LOGO (from C:\Projects\sbe\e-SBE new logo.png)
  const sbeLogoCandidates = [
    `${prefix}assets/logos/e-sbe-new-logo.png`,
    `${prefix}e-sbe-new-logo.png`,
    `${prefix}pwa-512x512.png`
  ];
  let sbeImg = null;
  for (const p of sbeLogoCandidates) {
    sbeImg = await loadImgAsync(p);
    if (sbeImg) break;
  }
  const iconSize = 185;
  const iconX = (WIDTH - iconSize) / 2;
  const iconY = 120;

  if (sbeImg) {
    // Outer luxury gold squircle ring
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    drawRoundRect(ctx, iconX - 4, iconY - 4, iconSize + 8, iconSize + 8, 36, false, true);

    // Clip image to rounded rect
    ctx.save();
    drawRoundRect(ctx, iconX, iconY, iconSize, iconSize, 32, false, false);
    ctx.clip();
    ctx.drawImage(sbeImg, iconX, iconY, iconSize, iconSize);
    ctx.restore();
  }

  // SBE Subtitle
  ctx.fillStyle = '#B8860B';
  ctx.font = FONT_SBE_SUB;
  ctx.textAlign = 'center';
  ctx.fillText('SRI BRUNDABANA ENTERPRISES  •  RAYAGADA', WIDTH / 2, 350);

  // Elegant Thin Gold Divider
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 140, 375);
  ctx.lineTo(WIDTH / 2 + 140, 375);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(WIDTH / 2, 375, 3, 0, Math.PI * 2);
  ctx.fill();

  // 4. CENTER: DYNAMIC BRAND LOGO
  const logoPath = customLogoUrl || getBrandLogoPath(groupLabel) || (subBrands.length > 0 ? getBrandLogoPath(subBrands[0]) : null);
  const logoImg = await loadImgAsync(logoPath);

  if (logoImg) {
    const maxW = 480;
    const maxH = 160;
    const ratio = logoImg.width / logoImg.height;
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
    const drawX = (WIDTH - drawW) / 2;
    const drawY = 480 + (maxH - drawH) / 2;
    ctx.save();
    drawRoundRect(ctx, drawX, drawY, drawW, drawH, 16, false, false);
    ctx.clip();
    ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    ctx.font = FONT_BRAND_FALLBACK;
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.fillText((groupLabel || 'FOOTWEAR').toUpperCase(), WIDTH / 2, 560);
  }

  // 5. LOWER CENTER: LUXURY DATE SECTION (BIG LETTERS + BIGGER DAY & MONTH-YEAR)
  const now = new Date();
  const dayStr = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  const dateNum = now.toLocaleDateString('en-GB', { day: '2-digit' });
  const monthYear = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();

  // Gold rule above date
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 220, 750);
  ctx.lineTo(WIDTH / 2 + 220, 750);
  ctx.stroke();

  // Day of week in grand gold display (larger)
  ctx.font = FONT_DAY;
  ctx.fillStyle = '#B8860B';
  ctx.textAlign = 'center';
  ctx.fillText(`—  ${dayStr}  —`, WIDTH / 2, 825);

  // Big Date Number (kept at 160px)
  ctx.font = FONT_DATE_NUM;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(dateNum, WIDTH / 2, 1000);

  // Month & Year (larger)
  ctx.font = FONT_MONTH_YEAR;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(monthYear, WIDTH / 2, 1080);

  // Gold rule below date
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 220, 1140);
  ctx.lineTo(WIDTH / 2 + 220, 1140);
  ctx.stroke();

  // 6. BOTTOM: ROYAL CATALOG CREST
  ctx.font = FONT_CREST;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('OFFICIAL WHOLESALE FOOTWEAR CATALOG', WIDTH / 2, 1480);

  // Export in HD quality
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64 = dataUrl.split(',')[1];
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));

  return {
    canvas,
    dataUrl,
    base64,
    blob,
  };
}
