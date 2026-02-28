#!/usr/bin/env node
/**
 * gen-img.cjs — Download styled product catalog images from stock-data.json into a ZIP
 * Uses Puppeteer to render the images exactly like the web app's PDF generator
 * (Beige background, wave graphics, Helvetica bold text, etc.)
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// ── ANSI Colors ─────────────────────────────────────────────────────────────
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    white: '\x1b[37m',
};

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

function sanitize(name) {
    return name.replace(/[<>:"/\\|?*%]/g, '_').trim();
}

const getHtmlTemplate = (imgSrc, brandName, productName, quantity, showBrand) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0; padding: 0;
    width: 800px; height: 1131px;
    background-color: #faf8f6;
    font-family: Arial, Helvetica, sans-serif;
    position: relative; overflow: hidden;
  }
  .wave-top { position: absolute; top: 0; left: 0; width: 100%; height: auto; }
  .wave-bottom { position: absolute; bottom: 0; left: 0; width: 100%; height: auto; }
  .brand {
    position: absolute; top: 40px; width: 100%; text-align: center;
    color: #c8c8c8; font-size: 45px; font-weight: bold; z-index: 10;
  }
  .img-container {
    position: absolute; top: 120px; left: 40px; right: 40px; height: 750px;
    display: flex; justify-content: center; align-items: center; z-index: 20;
  }
  .img-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .details { position: absolute; bottom: 80px; width: 100%; text-align: center; z-index: 30; }
  .name { font-size: 24px; font-weight: bold; color: #000; padding: 0 40px; }
  .qty { font-size: 28px; font-weight: bold; color: #d40000; margin-top: 15px; }
</style>
</head>
<body>
  <svg class="wave-top" viewBox="0 0 600 150" preserveAspectRatio="none">
    <path d="M 0 0 L 200 80 C 266 26, 400 33, 600 100" fill="transparent" stroke="#e0e0e0" stroke-width="4"/>
  </svg>
  <svg class="wave-bottom" viewBox="0 0 600 150" preserveAspectRatio="none" style="bottom:0; top:auto; height:150px;">
    <path d="M 0 150 L 250 50 C 316 117, 433 134, 600 100" fill="transparent" stroke="#e0e0e0" stroke-width="4"/>
  </svg>

  <div class="brand" style="display: ${showBrand ? 'block' : 'none'}">${brandName}</div>
  
  <div class="img-container">
    <img src="${imgSrc}" />
  </div>

  <div class="details">
    <div class="name">${productName}</div>
    <div class="qty">Qty: ${quantity}</div>
  </div>
</body>
</html>
`;

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    let puppeteer;
    try {
        puppeteer = require('puppeteer');
    } catch (e) {
        console.error(`\n${c.red}❌ Puppeteer is not installed.${c.reset}`);
        console.error(`${c.yellow}Please run: npm install puppeteer${c.reset}\n`);
        process.exit(1);
    }

    const startTime = Date.now();

    // Banner
    console.log(`\n${c.bright}${c.cyan}📸  SBE CATALOG IMAGE GENERATOR (PUPPETEER)  ${c.reset}`);

    const dataPath = path.join(__dirname, 'public', 'assets', 'stock-data.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`\n${c.red}❌ stock-data.json not found${c.reset}`);
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
        console.log(`  ${config.icon}  ${config.folder.padEnd(30)} ${c.green}${products.length} products${c.reset}`);
    }

    console.log(`\n  ${c.bright}TOTAL: ${grandTotal} images to generate${c.reset}`);

    header('STARTING BROWSER ENGINE');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1131 });

    header('RENDERING IMAGES');
    const zip = new JSZip();
    let totalImages = 0;
    let globalDone = 0;

    for (const { config, products } of groupResults) {
        if (products.length === 0) continue;

        console.log(`\n  ${config.icon}  ${c.bright}${c.yellow}${config.folder}${c.reset}`);
        let isFirstInBrand = true;
        let pidx = 0;

        for (const prod of products) {
            pidx++;
            const fileName = `${sanitize(prod.productName)}.jpg`;
            const folderPath = products.length > BATCH_SIZE
                ? `${config.folder}/Batch ${Math.ceil(pidx / BATCH_SIZE)}`
                : config.folder;

            clearLine();
            process.stdout.write(`     ${progressBar(pidx, products.length)} `);

            const html = getHtmlTemplate(prod.imageUrl, prod.brandName, prod.productName, prod.quantity, isFirstInBrand);
            isFirstInBrand = false;

            try {
                // Wait for the img element to finish loading its source
                await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
                // We inject a small script to guarantee the <img> is fully decoded before screenshotting
                await page.evaluate(async () => {
                    const img = document.querySelector('.img-container img');
                    if (img && !img.complete) {
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                        });
                    }
                });
                const buffer = await page.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 800, height: 1131 } });
                zip.folder(folderPath).file(fileName, buffer);
                totalImages++;
            } catch (err) {
                clearLine();
                console.log(`     ${c.red}✗ FAILED: ${prod.productName} (${err.message})${c.reset} `);
            }
        }
        console.log(`\n     ${c.green}✓ ${config.folder} done${c.reset} `);
    }

    await browser.close();

    header('GENERATING ZIP ARCHIVE');
    const zipPath = path.join(__dirname, '..', 'latest-stock.zip');
    const extractDir = path.join(__dirname, '..', 'latest-stock');

    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });

    let lastPct = -1;
    const content = await zip.generateAsync(
        { type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => {
            const pct = Math.round(meta.percent);
            if (pct !== lastPct && pct % 5 === 0) {
                lastPct = pct;
                clearLine();
                process.stdout.write(`     ${progressBar(pct, 100)} `);
            }
        }
    );

    fs.writeFileSync(zipPath, content);
    console.log(`\n\n  ${c.cyan}📂 Extracting to latest - stock / ...${c.reset} `);

    const extractZip = await JSZip.loadAsync(content);
    for (const [relativePath, zipEntry] of Object.entries(extractZip.files)) {
        const destPath = path.join(extractDir, relativePath);
        if (zipEntry.dir) fs.mkdirSync(destPath, { recursive: true });
        else {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.writeFileSync(destPath, await zipEntry.async('nodebuffer'));
        }
    }

    console.log(`\n  ${c.green}✓ ALL DONE in ${((Date.now() - startTime) / 1000).toFixed(1)}s${c.reset} \n`);
}

main().catch(console.error);
