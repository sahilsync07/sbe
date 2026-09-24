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
    paragon: `${prefix}assets/logos/paragon-transparent-logo.png`,
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
    ajanta: `${prefix}assets/logos/ajanta-transparent-logo.png`,
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

  // Top 5 selling items (scored by units sold in productHistory, then quantity)
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

  // 5 Newest Items (sorted by firstSeenAt descending)
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
async function loadImgAsync(src, timeoutMs = 1200) {
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
 * Truncate text to fit within max width on Canvas
 */
function fitText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 0 && ctx.measureText(str + '...').width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str.trim() + '...';
}

/**
 * Generates dynamic, high-resolution (1080x2400) Summary Cover Image
 *
 * @param {Object} params
 * @param {string} params.groupLabel - Label for group, e.g. "Paragon", "Cubix", "Action"
 * @param {Array<string>} [params.subBrands] - List of included brands, e.g. ["Max", "PARAGON GENTS", "Escoute"]
 * @param {Array<Object>} params.products - Products in this group
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
  const HEIGHT = 2400;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // Compute metrics
  const analytics = computeGroupAnalytics(products);

  // Determine logo path
  const logoPath = customLogoUrl || getBrandLogoPath(groupLabel) || (subBrands.length > 0 ? getBrandLogoPath(subBrands[0]) : null);
  const logoImg = await loadImgAsync(logoPath);

  // 1. BASE BACKGROUND: Deep modern luxury gradient
  const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGrad.addColorStop(0, '#090D16');
  bgGrad.addColorStop(0.35, '#0F172A');
  bgGrad.addColorStop(0.75, '#131D38');
  bgGrad.addColorStop(1, '#0B0F19');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Background Ambient Glow Orbs
  const orb1 = ctx.createRadialGradient(200, 300, 50, 200, 300, 500);
  orb1.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
  orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, WIDTH, 800);

  const orb2 = ctx.createRadialGradient(900, 1400, 50, 900, 1400, 600);
  orb2.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
  orb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 800, WIDTH, 1200);

  // Top Accent Strip
  const topAccent = ctx.createLinearGradient(0, 0, WIDTH, 0);
  topAccent.addColorStop(0, '#F59E0B');
  topAccent.addColorStop(0.5, '#10B981');
  topAccent.addColorStop(1, '#38BDF8');
  ctx.fillStyle = topAccent;
  ctx.fillRect(0, 0, WIDTH, 16);

  // -------------------------------------------------------------
  // 2. HEADER SECTION (Y: 60 - 290)
  // -------------------------------------------------------------
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Top Badge
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 310, 60, 460, 48, 24, true, true);
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ TODAY\'S LIVE STOCK CATALOG ★', WIDTH / 2, 92);

  // Main Company Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('M/s Sri Brundaban Enterprises', WIDTH / 2, 175);

  // Subtitle / Location
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('RAYAGADA (ODISHA) • WHOLESALE FOOTWEAR DISTRIBUTOR', WIDTH / 2, 222);

  // Date Capsule
  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 360, 246, 360, 44, 22, true, true);
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`📅 ${dateFormatted}`, WIDTH / 2, 276);

  // -------------------------------------------------------------
  // 3. BRAND & INVENTORY HERO CARD (Y: 320 - 580)
  // -------------------------------------------------------------
  const cardX = 60;
  const cardY = 320;
  const cardW = 960;
  const cardH = 260;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 28, true, true);

  // Left: Logo Box (220 x 200)
  const logoBoxX = cardX + 30;
  const logoBoxY = cardY + 30;
  const logoBoxW = 220;
  const logoBoxH = 200;

  ctx.fillStyle = '#FFFFFF';
  drawRoundRect(ctx, logoBoxX, logoBoxY, logoBoxW, logoBoxH, 20, true, false);

  if (logoImg) {
    const pad = 24;
    const maxW = logoBoxW - pad * 2;
    const maxH = logoBoxH - pad * 2;
    const imgRatio = logoImg.width / logoImg.height;
    let drawW = maxW;
    let drawH = drawW / imgRatio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * imgRatio;
    }
    const drawX = logoBoxX + (logoBoxW - drawW) / 2;
    const drawY = logoBoxY + (logoBoxH - drawH) / 2;
    ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
  } else {
    // Stylized Monogram Fallback
    ctx.fillStyle = '#1E293B';
    ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    const initials = (groupLabel || 'SB').slice(0, 2).toUpperCase();
    ctx.fillText(initials, logoBoxX + logoBoxW / 2, logoBoxY + logoBoxH / 2 + 24);
  }

  // Right Side Info
  const textLeft = cardX + 280;
  ctx.textAlign = 'left';

  // Group Label Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const labelText = fitText(ctx, groupLabel.toUpperCase(), 640);
  ctx.fillText(labelText, textLeft, cardY + 75);

  // Sub-brands subtitle
  ctx.fillStyle = '#94A3B8';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const subText = subBrands && subBrands.length > 0 ? `Sub-brands: ${subBrands.join(' • ')}` : 'Comprehensive Company Stock';
  ctx.fillText(fitText(ctx, subText, 640), textLeft, cardY + 115);

  // Two Hero Metric Pills (Total Articles & Total Pairs)
  const pill1X = textLeft;
  const pillY = cardY + 150;
  const pillW = 310;
  const pillH = 75;

  // Metric 1: Total Articles
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, pill1X, pillY, pillW, pillH, 18, true, true);

  ctx.fillStyle = '#A7F3D0';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TOTAL ARTICLES', pill1X + 20, pillY + 30);

  ctx.fillStyle = '#34D399';
  ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${analytics.totalArticles}`, pill1X + 20, pillY + 65);

  // Metric 2: Total Pairs
  const pill2X = pill1X + pillW + 20;
  ctx.fillStyle = 'rgba(59, 130, 246, 0.16)';
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, pill2X, pillY, pillW, pillH, 18, true, true);

  ctx.fillStyle = '#BFDBFE';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TOTAL STOCK', pill2X + 20, pillY + 30);

  ctx.fillStyle = '#60A5FA';
  ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${analytics.totalPairs.toLocaleString()} Pairs`, pill2X + 20, pillY + 65);

  // -------------------------------------------------------------
  // 4. SECTION 1: ARTICLE QUANTITY BREAKDOWN (5 Brackets) (Y: 620 - 1160)
  // -------------------------------------------------------------
  const sec1Y = 620;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📊 ARTICLE QUANTITY BREAKDOWN', 60, sec1Y + 35);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Stock availability categorized by quantity brackets', 60, sec1Y + 68);

  const bracketList = [
    analytics.brackets.lt10,
    analytics.brackets.b10to20,
    analytics.brackets.b20to30,
    analytics.brackets.b30to40,
    analytics.brackets.gt40,
  ];

  let rowY = sec1Y + 90;
  const rowH = 78;
  const gap = 12;

  bracketList.forEach((b) => {
    // Card Background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, 60, rowY, 960, rowH, 18, true, true);

    // Left Colored Badge Capsule
    ctx.fillStyle = b.bg;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, 80, rowY + 14, 210, 50, 14, true, true);

    ctx.fillStyle = b.color;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.shortLabel, 80 + 105, rowY + 46);

    // Middle: Articles Count
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${b.count} Articles`, 330, rowY + 48);

    // Right: Total Pairs Quantity
    ctx.textAlign = 'right';
    ctx.fillStyle = b.color;
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${b.qty.toLocaleString()} Pairs`, 990, rowY + 48);

    // Subtle bottom progress line showing proportional weight
    const pct = analytics.totalPairs > 0 ? b.qty / analytics.totalPairs : 0;
    const barW = Math.max(12, Math.round(920 * pct));
    ctx.fillStyle = b.color;
    ctx.fillRect(80, rowY + rowH - 3, barW, 3);

    rowY += rowH + gap;
  });

  // -------------------------------------------------------------
  // 5. SECTION 2: TOP 5 FAST-MOVING ARTICLES (Y: 1190 - 1710)
  // -------------------------------------------------------------
  const sec2Y = 1190;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🔥 TOP 5 FAST-MOVING ARTICLES', 60, sec2Y + 35);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Highest demand & sales volume in this brand', 60, sec2Y + 68);

  let topY = sec2Y + 90;
  const topH = 80;

  if (analytics.topSelling.length === 0) {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    drawRoundRect(ctx, 60, topY, 960, topH, 18, true, false);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No sales history recorded yet for this group', WIDTH / 2, topY + 48);
  } else {
    analytics.topSelling.forEach((item, idx) => {
      // Row Card
      ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, 60, topY, 960, topH, 16, true, true);

      // Rank Icon
      const rankX = 85;
      const rankY = topY + 16;
      ctx.fillStyle = idx === 0 ? '#F59E0B' : idx === 1 ? '#E2E8F0' : idx === 2 ? '#B45309' : '#475569';
      drawRoundRect(ctx, rankX, rankY, 48, 48, 24, true, false);

      ctx.fillStyle = idx === 1 ? '#0F172A' : '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`#${idx + 1}`, rankX + 24, rankY + 33);

      // Article Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const cleanArticle = fitText(ctx, item.cleanName || item.name, 480);
      ctx.fillText(cleanArticle, 155, topY + 36);

      // Size & Price Line
      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Size: ${item.size}   •   MRP: ${item.price}`, 155, topY + 65);

      // Right Stats Pill (Sold Units or Stock)
      const pillW = 210;
      const pillH = 46;
      const pillX = 1020 - pillW - 20;
      const pillCardY = topY + 17;

      if (item.sold > 0) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, pillX, pillCardY, pillW, pillH, 14, true, true);

        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Sold: ${item.sold} prs`, pillX + pillW / 2, pillCardY + 30);
      } else {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, pillX, pillCardY, pillW, pillH, 14, true, true);

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Stock: ${item.qty} prs`, pillX + pillW / 2, pillCardY + 30);
      }

      topY += topH + 10;
    });
  }

  // -------------------------------------------------------------
  // 6. SECTION 3: 5 NEW ITEMS DETAILS (Y: 1740 - 2250)
  // -------------------------------------------------------------
  const sec3Y = 1740;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('✨ 5 LATEST ARRIVALS / NEW ARTICLES', 60, sec3Y + 35);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Fresh articles recently added to warehouse inventory', 60, sec3Y + 68);

  let newY = sec3Y + 90;
  const newH = 80;

  if (analytics.newArrivals.length === 0) {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    drawRoundRect(ctx, 60, newY, 960, newH, 18, true, false);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('All articles currently tracked', WIDTH / 2, newY + 48);
  } else {
    analytics.newArrivals.forEach((item, idx) => {
      // Row Card
      ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, 60, newY, 960, newH, 16, true, true);

      // "NEW" Badge
      const newBadgeX = 85;
      const newBadgeY = newY + 16;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, newBadgeX, newBadgeY, 68, 48, 12, true, true);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEW', newBadgeX + 34, newBadgeY + 31);

      // Article Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const cleanArticle = fitText(ctx, item.cleanName || item.name, 470);
      ctx.fillText(cleanArticle, 175, newY + 36);

      // Size & Price Line
      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Size: ${item.size}   •   MRP: ${item.price}`, 175, newY + 65);

      // Right Stats Pill (Available Stock)
      const pillW = 210;
      const pillH = 46;
      const pillX = 1020 - pillW - 20;
      const pillCardY = newY + 17;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.16)';
      ctx.strokeStyle = '#818CF8';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, pillX, pillCardY, pillW, pillH, 14, true, true);

      ctx.fillStyle = '#A5B4FC';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Stock: ${item.qty} prs`, pillX + pillW / 2, pillCardY + 30);

      newY += newH + 10;
    });
  }

  // -------------------------------------------------------------
  // 7. FOOTER SECTION (Y: 2270 - 2390)
  // -------------------------------------------------------------
  const footerY = 2270;

  // Divider Line
  const divGrad = ctx.createLinearGradient(60, 0, 1020, 0);
  divGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  divGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
  divGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(60, footerY, 960, 2);

  // Call to Action
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🛒 ORDER VIA WHATSAPP OR SBE STOCK APP', WIDTH / 2, footerY + 45);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Quality Products • Best Wholesale Prices • Rapid Dispatch • Rayagada (Odisha)', WIDTH / 2, footerY + 80);

  // Export
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const base64 = dataUrl.split(',')[1];
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));

  return {
    canvas,
    dataUrl,
    base64,
    blob,
  };
}
