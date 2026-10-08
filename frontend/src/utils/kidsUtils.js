/**
 * kidsUtils.js
 * Comprehensive utility to identify Kids & Junior Footwear products across all brands and groups.
 * 
 * Sizing rules:
 * - Toddler & Infant Metric sizes: 15x18, 15x19, 15x20, 16x20, 18x19, 18x23, 18x27, 20x29, 21x26, 22x25, 24x29, 24x33, 27x30, 28x31, 30x35, 32x35.
 * - UK / Indian Kids sizes: 11x13, 11x1, 11x2, 11x3, 12x1, 12x2, 12x3, 1x3, 1x4, 1x5, 2x3, 2x4, 2x5, 3x5, 3x6, 4x5, 4x6, 8x10, 8x11, 8x13, 9x11, 9x13, 9x1, 9x3, 10x13.
 * - Hyphenated formats: (01-03), (08-10), (11-13), (8-11), (1-3).
 * 
 * Exclusions:
 * - 11x12 (Extra Large Gents)
 * - 9x10 (Extra Large Ladies)
 * - 6x9, 6x10, 7x10 (Standard Gents sizes)
 * - 4x7, 4x8, 5x8, 5x9 (Standard Ladies sizes)
 * - 5x10 (Only included if explicit kids keyword like '5x10 kids' is present)
 * - Color false-positives like 'baby pink' or 'baby blue'.
 */

const KIDS_EXPLICIT_KW = /\b(kids?|boys?|girls?|babys?|baba|bachha|bacha|chunchun|chuchu|chun\s*chun|junior|infant|child|children|toddler|fookids?|fookiddies)\b/i;
const COLOR_FALSE_POSITIVE = /\bbaby\s*(?:pink|blue|green|yellow)\b/i;
const EXTRA_LARGE_KW = /\b(?:extra\s*lrg|extra\s*large|xl)\b/i;

const KIDS_SIZE_SET = new Set([
  // Toddler / Metric infant sizes:
  '15x18', '15x19', '15x20', '16x20', '18x19', '18x23', '18x27', '20x29', '21x26', '22x25', '24x29', '24x33', '27x30', '28x31', '30x35', '32x35',
  // UK / Indian Kids & Junior sizes:
  '1x3', '1x4', '1x5', '2x3', '2x4', '2x5', '3x5', '3x6', '4x5', '4x6',
  '8x10', '8x11', '8x13', '9x11', '9x13', '9x1', '9x3', '10x13',
  '11x13', '11x1', '11x2', '11x3', '12x1', '12x2', '12x3'
]);

// Adult sizes (never kids unless explicit kids/boys/girls keyword)
const ADULT_SIZES = new Set([
  '11x12', '9x10', '6x9', '6x10', '7x10', '4x7', '4x8', '5x8', '5x9', '5x10', '36x39', '40x44', '41x44'
]);

export function isKidsProduct(productName, groupName = '') {
  const nameStr = productName || '';
  const grpStr = groupName || '';
  const combined = `${nameStr} ${grpStr}`;

  // If explicitly designated as extra large in adult categories, exclude
  if (EXTRA_LARGE_KW.test(nameStr)) {
    return false;
  }

  // 1. Check explicit keywords
  let hasKidKw = KIDS_EXPLICIT_KW.test(combined);
  if (hasKidKw) {
    // Check if the only match was "baby pink" or "baby blue"
    const cleaned = combined.replace(COLOR_FALSE_POSITIVE, '');
    if (!KIDS_EXPLICIT_KW.test(cleaned)) {
      hasKidKw = false;
    }
  }

  if (hasKidKw) {
    return true;
  }

  // 2. Check dedicated group (P-TOES is kids unless adult gents/ladies size like 6x9, 6x10, 11x12)
  if (grpStr.toUpperCase() === 'P-TOES') {
    const isAdultSize = /(?:^|[\s\(])(6\s*[*xX]\s*[9|10]|7\s*[*xX]\s*10|11\s*[*xX]\s*12)(?:[\s\)]|$)/i.test(nameStr);
    if (!isAdultSize) {
      return true;
    }
  }

  // 3. Check size patterns
  const sizeMatches = [...nameStr.matchAll(/(?:^|[\s\(])(\d{1,2})\s*[*xX\-\–]\s*(\d{1,2})(?:[\s\)]|$)/g)];
  for (const m of sizeMatches) {
    const num1 = parseInt(m[1], 10);
    const num2 = parseInt(m[2], 10);
    const lo = Math.min(num1, num2);
    const hi = Math.max(num1, num2);
    const szKey = `${lo}x${hi}`;

    // Skip adult sizes
    if (ADULT_SIZES.has(szKey)) {
      continue;
    }

    // Metric toddler range: 14 to 35 with difference between 2 and 10
    if (lo >= 14 && lo <= 32 && hi >= 18 && hi <= 35 && (hi - lo) >= 2 && (hi - lo) <= 10) {
      return true;
    }

    // Explicit Kids size
    if (KIDS_SIZE_SET.has(szKey)) {
      return true;
    }
  }

  return false;
}
