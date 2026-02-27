#!/usr/bin/env node
/**
 * gen-img.cjs — Download product images from stock-data.json into a structured ZIP
 * With visual progress bars and colored output for Windows terminal
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const JSZip = require('jszip');

// ── ANSI Colors ─────────────────────────────────────────────────────────────
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    bgGreen: '\x1b[42m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgRed: '\x1b[41m',
    bgWhite: '\x1b[47m',
    bgGray: '\x1b[100m',
};

// ── Pretty helpers ──────────────────────────────────────────────────────────
function progressBar(current, total, width = 30) {
    const pct = total > 0 ? current / total : 0;
    const filled = Math.round(pct * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const pctText = `${Math.round(pct * 100)}%`.padStart(4);
    return `${c.green}${bar}${c.reset} ${c.bright}${pctText}${c.reset}`;
}

function header(text) {
    const line = '─'.repeat(56);
    console.log(`\n${c.cyan}${line}${c.reset}`);
    console.log(`${c.bright}${c.cyan}  ${text}${c.reset}`);
    console.log(`${c.cyan}${line}${c.reset}`);
}

function sectionHeader(icon, name, brandCount) {
    console.log(`\n  ${icon}  ${c.bright}${c.yellow}${name}${c.reset} ${c.dim}(${brandCount} brand${brandCount > 1 ? 's' : ''})${c.reset}`);
}

function clearLine() {
    process.stdout.write('\r\x1b[K');
}

// ── Configuration ───────────────────────────────────────────────────────────
const GROUPS = [
    { folder: 'Cubix', brands: ['CUBIX', 'CUBIX 2'], onlyWithPhotos: true, minQty: 6, icon: '👟' },
    { folder: 'Florex', brands: ['Florex (Swastik)'], onlyWithPhotos: true, minQty: 6, icon: '🌸' },
    { folder: 'Action', brands: ['ACTION'], onlyWithPhotos: true, minQty: 6, icon: '⚡' },
    { folder: 'Paragon Gents', brands: ['PARAGON GENTS'], onlyWithPhotos: true, minQty: 8, icon: '👞' },
    { folder: 'Eeken', brands: ['EEKEN'], onlyWithPhotos: true, minQty: 4, icon: '🏃' },
    { folder: 'Meriva and Paragon Ladies', brands: ['Meriva', 'PARAGON LADIES'], onlyWithPhotos: true, minQty: 4, icon: '👠' },
    {
        folder: 'Loose General Packing',
        brands: ['ASHU', 'PANKAJ PLASTIC', 'TARA', 'J.K Plastic', 'Magnet', 'Maruti Plastics',
            'AAGAM POLYMER', 'A G ENTERPRISES', 'NAV DURGA ENTERPRISES', 'NEXUS', 'R K TRADERS',
            'SRG Enterprises', 'Vardhman Plastics', 'YASH FOOTWEAR', 'KRishna Agency', 'SHYAM',
            'AVTAR V V POLYMERS', 'ATHARV PLASTIC'],
        onlyWithPhotos: true, minQty: 4, icon: '📦'
    },
    {
        folder: 'Box Packing',
        brands: ['ADDA', 'ADDOXY', 'AIRFAX', 'Hitway', 'Paris', 'TEUZ', 'VAISHNO PLASTIC',
            'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 'GOKUL FOOTWEAR',
            'NEXGEN FOOTWEAR', 'KOHINOOR', 'UAM FOOTWEAR'],
        onlyWithPhotos: true, minQty: 4, icon: '📥'
    },
    { folder: 'Solea Disc 40 Percent Offer', brands: ['SOLEA DISC 40% OFFER'], onlyWithPhotos: true, minQty: 0, icon: '🏷️' },
    { folder: 'Reliance Footwear', brands: ['RELIANCE FOOTWEAR'], onlyWithPhotos: true, minQty: 4, icon: '🔷' },
    { folder: 'Paralite', brands: ['PARALITE'], onlyWithPhotos: true, minQty: 8, icon: '🔶' },
    { folder: 'P-Toes Paralite', brands: ['P-TOES PARALITE'], onlyWithPhotos: true, minQty: 8, icon: '🟠' },
    { folder: 'Socks', brands: ['BArun', 'PAreek Soucks', 'LEo'], onlyWithPhotos: true, minQty: 0, icon: '🧦' },
    { folder: 'School Shoe Durolite', brands: ['SCHOOL SHOE DUROLITE'], onlyWithPhotos: true, minQty: 0, icon: '🎒' },
];

const BATCH_SIZE = 99;

// ── Download helper ─────────────────────────────────────────────────────────
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const get = (u, redirects = 0) => {
            if (redirects > 5) return reject(new Error('Too many redirects'));
            https.get(u, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return get(res.headers.location, redirects + 1);
                }
                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                const chunks = [];
                res.on('data', ch => chunks.push(ch));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            }).on('error', reject);
        };
        get(url);
    });
}

function getExtension(url) {
    try {
        const ext = path.extname(new URL(url).pathname).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    } catch { return '.jpg'; }
}

function sanitize(name) {
    return name.replace(/[<>:"/\\|?*%]/g, '_').trim();
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    const startTime = Date.now();

    // Banner
    console.log(`\n${c.bgBlue}${c.bright}${c.white}                                                        ${c.reset}`);
    console.log(`${c.bgBlue}${c.bright}${c.white}    📸  SBE CATALOG IMAGE GENERATOR                      ${c.reset}`);
    console.log(`${c.bgBlue}${c.bright}${c.white}    Sri Brundabana Enterprises                            ${c.reset}`);
    console.log(`${c.bgBlue}${c.bright}${c.white}                                                        ${c.reset}`);

    const dataPath = path.join(__dirname, 'public', 'assets', 'stock-data.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`\n${c.red}❌ stock-data.json not found at: ${dataPath}${c.reset}`);
        process.exit(1);
    }

    const stockData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const normalize = (s) => s ? s.toLowerCase().trim() : '';

    const groupMap = new Map();
    for (const g of stockData) {
        if (g.groupName === '_META_DATA_') continue;
        groupMap.set(normalize(g.groupName), g);
    }

    header('SCANNING GROUPS');

    // Pre-scan to count products
    const groupResults = [];
    let grandTotal = 0;

    for (const config of GROUPS) {
        const products = [];
        for (const brandName of config.brands) {
            const entry = groupMap.get(normalize(brandName));
            if (!entry) continue;
            for (const prod of entry.products) {
                if (config.onlyWithPhotos && !prod.imageUrl) continue;
                if (config.minQty > 0 && prod.quantity < config.minQty) continue;
                products.push({ ...prod, brandName: entry.groupName });
            }
        }
        groupResults.push({ config, products });
        grandTotal += products.length;

        const filters = [];
        if (config.onlyWithPhotos) filters.push('📷 Photos Only');
        if (config.minQty > 0) filters.push(`📊 Min ${config.minQty} pairs`);
        const filterStr = filters.length ? `${c.dim}[${filters.join(', ')}]${c.reset}` : '';
        const countStr = products.length > 0
            ? `${c.green}${products.length} products${c.reset}`
            : `${c.red}0 products${c.reset}`;
        console.log(`  ${config.icon}  ${config.folder.padEnd(30)} ${countStr}  ${filterStr}`);
    }

    console.log(`\n  ${c.bright}${c.magenta}TOTAL: ${grandTotal} images to download${c.reset}`);

    // Download
    header('DOWNLOADING IMAGES');

    const zip = new JSZip();
    let totalImages = 0;
    let totalFailed = 0;
    let globalDone = 0;

    for (const { config, products } of groupResults) {
        if (products.length === 0) continue;

        sectionHeader(config.icon, config.folder, config.brands.length);

        const needsBatching = products.length > BATCH_SIZE;
        if (needsBatching) {
            const batches = Math.ceil(products.length / BATCH_SIZE);
            console.log(`     ${c.yellow}⚠ ${products.length} images → splitting into ${batches} batches of ${BATCH_SIZE}${c.reset}`);
        }

        for (let i = 0; i < products.length; i++) {
            const prod = products[i];
            const idx = i + 1;
            const ext = getExtension(prod.imageUrl);
            const fileName = `${sanitize(prod.productName)}${ext}`;

            let folderPath;
            if (needsBatching) {
                const batchNum = Math.ceil(idx / BATCH_SIZE);
                folderPath = `${config.folder}/Batch ${batchNum}`;
            } else {
                folderPath = config.folder;
            }

            const shortName = prod.productName.length > 35
                ? prod.productName.substring(0, 35) + '...'
                : prod.productName;

            clearLine();
            process.stdout.write(`     ${progressBar(idx, products.length)} ${c.dim}${idx}/${products.length}${c.reset} ${c.white}${shortName}${c.reset}`);

            try {
                const imgData = await downloadImage(prod.imageUrl);
                zip.folder(folderPath).file(fileName, imgData);
                totalImages++;
            } catch (err) {
                clearLine();
                console.log(`     ${c.red}✗ FAILED: ${shortName} (${err.message})${c.reset}`);
                totalFailed++;
            }

            globalDone++;
        }

        clearLine();
        console.log(`     ${c.green}✓ ${config.folder}: ${products.length} images done${c.reset}`);
    }

    // Generate ZIP
    header('GENERATING ZIP FILE');

    const today = new Date().toISOString().split('T')[0];
    const zipFileName = `Catalog_Images_${today}.zip`;
    // Save directly under sbe (parent of frontend)
    const zipPath = path.join(__dirname, '..', zipFileName);

    console.log(`\n  ${c.cyan}📦 Compressing ${totalImages} images...${c.reset}`);

    let lastPct = -1;
    const content = await zip.generateAsync(
        { type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => {
            const pct = Math.round(meta.percent);
            if (pct !== lastPct && pct % 5 === 0) {
                lastPct = pct;
                clearLine();
                process.stdout.write(`     ${progressBar(pct, 100)} ${c.dim}Compressing...${c.reset}`);
            }
        }
    );

    clearLine();
    fs.writeFileSync(zipPath, content);
    const sizeMB = (content.length / (1024 * 1024)).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Final summary
    console.log('');
    console.log(`${c.bgGreen}${c.bright}${c.white}                                                        ${c.reset}`);
    console.log(`${c.bgGreen}${c.bright}${c.white}    ✅  ALL DONE!                                        ${c.reset}`);
    console.log(`${c.bgGreen}${c.bright}${c.white}                                                        ${c.reset}`);
    console.log('');
    console.log(`  ${c.bright}File:${c.reset}       ${c.cyan}${zipPath}${c.reset}`);
    console.log(`  ${c.bright}Size:${c.reset}       ${c.yellow}${sizeMB} MB${c.reset}`);
    console.log(`  ${c.bright}Images:${c.reset}     ${c.green}${totalImages} downloaded${c.reset}${totalFailed > 0 ? `  ${c.red}${totalFailed} failed${c.reset}` : ''}`);
    console.log(`  ${c.bright}Time:${c.reset}       ${c.magenta}${elapsed}s${c.reset}`);
    console.log('');
}

main().catch(err => {
    console.error(`\n${c.red}Fatal error: ${err.message}${c.reset}`);
    console.error(err.stack);
    process.exit(1);
});
