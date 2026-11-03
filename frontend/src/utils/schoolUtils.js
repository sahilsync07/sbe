/**
 * School Footwear Utilities
 * Handles model classification, small vs large size grouping, rate parsing, and wide card data aggregation.
 */

export function parseSchoolRate(name) {
  if (!name) return { text: '—', num: 0 };
  const m = name.match(/[@]\s*(\d{2,4})|(?:MRP|RS|MRPP)[\.\s]*(\d{2,4})|(\d{2,4})\s*\/\-/i);
  if (m) {
    const val = m[1] || m[2] || m[3];
    return { text: `₹${val}`, num: parseInt(val, 10), raw: val };
  }
  return { text: '—', num: 0, raw: '' };
}

export function parseSchoolSize(name) {
  if (!name) return 'Standard';
  const m = name.match(/[\(\s]?(\d{1,2}\s*[\*\-xX\/]\s*\d{1,2})(?=[^\d]|$)/i)
         || name.match(/[\(\s](\d{1,2})[\)\s]/i);
  if (m) {
    let s = m[1].replace(/[*-\/]/g, 'X').replace(/\s+/g, '').toUpperCase();
    // Normalize leading zero: 07X10 -> 7X10
    s = s.replace(/^0+/, '');
    return s;
  }
  return 'Standard';
}

export function isSchoolLargeGroup(sizeStr, productName = '') {
  const normSize = (sizeStr || '').toUpperCase();
  const normName = (productName || '').toUpperCase();
  if (/^(6X10|7X10|7X8|6X9|7X9|9|10)$/i.test(normSize)) return true;
  if (/\b(GENTS|SENIOR|MEN)\b/i.test(normName)) return true;
  return false;
}

export function getSchoolModelInfo(product) {
  const u = (product.productName || '').toUpperCase();
  const group = product.groupName || '';
  const isDurolite = group === 'SCHOOL SHOE DUROLITE' || u.includes('DRL') || u.includes('DUROLITE');
  const color = (u.includes('WHT') || u.includes('WHITE')) ? 'White' : 'Black';

  if (isDurolite) {
    if (u.includes('BOY-01') || u.includes('BOY-1') || u.includes('BOY 1')) {
      return { id: `drl_boy_1_${color.toLowerCase()}`, name: 'DRL School Boy-1', color, category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
    }
    if (u.includes('GIRL-04') || u.includes('GIRL-4') || u.includes('GRL-4')) {
      return { id: `drl_girl_4_${color.toLowerCase()}`, name: 'DRL School Girl-4', color, category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
    }
    if (u.includes('GIRL-01') || u.includes('GIRL-1')) {
      return { id: `drl_girl_1_${color.toLowerCase()}`, name: 'DRL School Girl-1', color, category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
    }
    if (u.includes('GOLA-111') || u.includes('GOLLA-111')) {
      return { id: `drl_gola_111_${color.toLowerCase()}`, name: 'DRL School Gola-111', color, category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
    }
    if (u.includes('POLO 2')) {
      return { id: 'drl_polo_2', name: 'Durolite Polo 2', color: 'Black/White', category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
    }
    if (u.includes('SHALIMAR')) {
      return { id: 'drl_shalimar', name: 'Shalimar Rubber', color: 'Black', category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
    }
    return { id: `drl_misc_${color.toLowerCase()}`, name: 'Durolite School Shoe', color, category: 'Durolite School', groupName: 'SCHOOL SHOE DUROLITE' };
  } else {
    // Paragon School
    if (u.includes('784')) {
      return { id: `pg_784_${color.toLowerCase()}`, name: 'Paragon School 784', color, category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('785')) {
      return { id: `pg_785_${color.toLowerCase()}`, name: 'Paragon School 785', color, category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('770')) {
      return { id: 'pg_770_blk', name: 'Paragon 770 Velcro', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('792') || u.includes('0792')) {
      return { id: 'pg_792_blk', name: 'Paragon School 792', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('794') || u.includes('0794')) {
      return { id: 'pg_794_blk', name: 'Paragon School 794', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('797') || u.includes('0797')) {
      return { id: 'pg_797_blk', name: 'Paragon School 797', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('872')) {
      return { id: 'pg_872_blk', name: 'Paragon School 872', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('874')) {
      return { id: 'pg_874_blk', name: 'Paragon School 874', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('PV0017') || u.includes('PV0018') || u.includes('PV0019')) {
      return { id: 'pg_pv_boys', name: 'Paragon PV Boys', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('0205')) {
      return { id: 'pg_0205', name: 'Paragon School 0205', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('711')) {
      return { id: 'pg_711', name: 'Paragon School 711', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('751')) {
      return { id: 'pg_751', name: 'Paragon School 751', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('C100')) {
      return { id: 'pg_c100', name: 'Paragon School C100', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('0740')) {
      return { id: 'pg_0740', name: 'Tennis Canvas 0740', color: 'White', category: 'Paragon School', groupName: 'School' };
    }
    if (u.includes('TARA')) {
      return { id: 'tara_school', name: 'Tara School Shoe', color: 'Black', category: 'Paragon School', groupName: 'School' };
    }
    return { id: `pg_misc_${color.toLowerCase()}`, name: 'Paragon School Shoe', color, category: 'Paragon School', groupName: 'School' };
  }
}

/**
 * Groups an array of school products into consolidated Wide Model objects.
 */
export function groupSchoolProducts(products) {
  if (!products || products.length === 0) return [];
  const modelMap = new Map();

  products.forEach(p => {
    const info = getSchoolModelInfo(p);
    if (!modelMap.has(info.id)) {
      modelMap.set(info.id, {
        isSchoolWide: true,
        id: info.id,
        name: info.name,
        color: info.color,
        category: info.category,
        groupName: info.groupName,
        imageUrl: p.imageUrl || p.secondaryImageUrl || null,
        totalStock: 0,
        variants: []
      });
    }

    const entry = modelMap.get(info.id);
    if (!entry.imageUrl && (p.imageUrl || p.secondaryImageUrl)) {
      entry.imageUrl = p.imageUrl || p.secondaryImageUrl;
    }

    const rateInfo = parseSchoolRate(p.productName);
    const size = parseSchoolSize(p.productName);
    const isLarge = isSchoolLargeGroup(size, p.productName);
    const qty = Number(p.quantity) || 0;

    entry.variants.push({
      product: p,
      productName: p.productName,
      size,
      isLarge,
      rateText: rateInfo.text,
      rateNum: rateInfo.num,
      quantity: qty
    });

    entry.totalStock += qty;
  });

  // Post-process each model
  const result = [];
  for (const model of modelMap.values()) {
    // Sort variants: Small groups first (ascending size/rate), then Large groups (ascending size/rate)
    model.variants.sort((a, b) => {
      if (a.isLarge !== b.isLarge) return a.isLarge ? 1 : -1;
      if (a.rateNum !== b.rateNum) return a.rateNum - b.rateNum;
      return a.size.localeCompare(b.size, undefined, { numeric: true });
    });

    model.smallVariants = model.variants.filter(v => !v.isLarge);
    model.largeVariants = model.variants.filter(v => v.isLarge);

    result.push(model);
  }

  // Sort models: higher stock first, then alphabetically
  return result.sort((a, b) => {
    if (b.totalStock !== a.totalStock) return b.totalStock - a.totalStock;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Format a clean one-line breakdown for One Touch canvas / WhatsApp specs bar
 */
export function formatSchoolVariantsSummary(variants) {
  if (!variants || variants.length === 0) return '';
  return variants
    .filter(v => v.quantity > 0)
    .map(v => `${v.size}: ${v.rateText} (${v.quantity}p)`)
    .join('  •  ');
}
