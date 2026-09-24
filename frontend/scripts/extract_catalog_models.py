import os
import sys
import json
import re
import asyncio
import urllib.request
import urllib.parse
from PIL import Image
import fitz

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PARAGON_PDF = r"C:\Users\Sahil Kumar\Downloads\Pictures\catalogs\05 PARAGON E-CATALOGUE APRIL 2026.pdf"
EEKEN_PDF = r"C:\Users\Sahil Kumar\Downloads\Pictures\catalogs\EEKENCATALOGUEAPRIL2026.pdf"
FRONTEND_STOCK = r"c:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK = r"c:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
OUTPUT_DIR = r"c:\Projects\sbe\frontend\public\assets\catalog_models"
REPORT_PATH = r"c:\Projects\sbe\frontend\scripts\catalog_extraction_report.json"

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
ASSET_FOLDER = "e-sbe/catalog_models"

os.makedirs(OUTPUT_DIR, exist_ok=True)

COLORS_MAP = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'SKY', 'TRQ', 'TURQUOISE', 'R_BLUE', 'AIRFORCE', 'COB', 'TLB', 'NYB', 'SBL', 'FBL'],
    'RED': ['RED', 'CHERRY', 'CHRY', 'MRN', 'MAROON', 'WINE', 'MAR'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN'],
    'TAN': ['TAN', 'CAMEL', 'CARAMEL', 'CHIKKU', 'CHIKU', 'BGE', 'BEIGE', 'BISCUITE', 'PEANUT'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'MEHANDI', 'MHD'],
    'GRY': ['GRY', 'GREY', 'GRAY', 'SLATE', 'DGY', 'SLB'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'GLD': ['GLD', 'GOLD', 'COPPER', 'MST', 'MUSTARD', 'KAKKI', 'FOSSIL', 'SULTAN', 'YLW', 'YELLOW', 'ORG', 'ORANGE']
}

def upload_image_to_cloudinary(file_path):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(file_path)

    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="folder"\r\n\r\n{ASSET_FOLDER}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: image/webp\r\n\r\n")
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = json.loads(resp.read().decode())
                return resp_data.get("secure_url")
        except Exception as e:
            if attempt == 2:
                print(f"   Upload failed for {filename}: {e}")
                return None
            asyncio.sleep(1)
    return None

def strip_product_meta(pname):
    p = pname or ''
    p = re.sub(r'\(.*?\)', ' ', p)
    p = re.sub(r'(?<!\d)\d{1,2}\s*[\*\-xX\/]\s*\d{1,2}(?!\d)', ' ', p)
    p = re.sub(r'(?:MRP|RS|NET|RATE)[\s\.\:]*\d+(?:\.\d+)?/?-?', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'@\s*\d+(?:\.\d+)?/?-?', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'\b\d{2,4}/-(?!\d)', ' ', p)
    return p.strip()

def process_and_crop(page, bbox, out_path):
    # Render at 300 DPI (zoom 300 / 72 = 4.167)
    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)
    
    # Add 5% padding around bbox, clamped to page rect
    w = bbox.x1 - bbox.x0
    h = bbox.y1 - bbox.y0
    pad_x = w * 0.05
    pad_y = h * 0.05
    
    clip_rect = fitz.Rect(
        max(0, bbox.x0 - pad_x),
        max(0, bbox.y0 - pad_y),
        min(page.rect.x1, bbox.x1 + pad_x),
        min(page.rect.y1, bbox.y1 + pad_y)
    )
    
    pix = page.get_pixmap(matrix=mat, clip=clip_rect, alpha=False)
    # Save as WebP via PIL for optimal compression and quality
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img.save(out_path, "WEBP", quality=90)

async def extract_catalog(pdf_path, brand_name, stock_data, max_extract=50):
    print(f"\n==================================================")
    print(f"PARSING {brand_name} CATALOG: {pdf_path}")
    print(f"==================================================")

    doc = fitz.open(pdf_path)
    print(f"Total pages: {len(doc)}")

    # Collect missing products for this brand
    brand_products = []
    for g in stock_data:
        gname = g.get('groupName', '').upper()
        if brand_name in gname or (brand_name == 'PARAGON' and any(k in gname for k in ['SOLEA', 'PARALITE', 'VERTEX', 'WALKAHOLIC', 'ESCOUTE', 'MAX', 'SCHOOL'])):
            for p in g.get('products', []):
                # We target products missing secondary image or missing both
                if not p.get('imageUrl') or not p.get('secondaryImageUrl'):
                    brand_products.append({'group': g.get('groupName'), 'product': p})

    print(f"Found {len(brand_products)} {brand_name} products eligible for catalog image linking")

    extracted_count = 0
    matched_results = []

    for pno in range(len(doc)):
        if extracted_count >= max_extract:
            break

        page = doc[pno]
        blocks = page.get_text('blocks')
        images = page.get_image_info()

        if not images:
            continue

        # Filter out tiny icon images (width or height < 50)
        valid_imgs = [img for img in images if img.get('width', 0) > 60 and img.get('height', 0) > 60]
        if not valid_imgs:
            continue

        # Extract article blocks from page text
        for b in blocks:
            if extracted_count >= max_extract:
                break

            t = b[4].strip()
            lines = [line.strip() for line in t.split('\n') if line.strip()]
            if not lines:
                continue
            first_line = lines[0]
            block_clean = " ".join(lines)
            if not re.search(r'\d', block_clean):
                continue
            m = re.search(r'(?:MODEL\s*NO\.?\s*|EEVGI|EEVGOA|EEFBGOA|EEFBGI|EEKEN|PARALITE|SOLEA|VERTEX|ACUSOLE|HAWAI|PARAGON|COMFY|ESCOUTE|MAX)\s*([A-Za-z0-9\-]+)', block_clean, re.I)
            if not m:
                m = re.search(r'\b([A-Za-z0-9\-]+(?:\s*\d+)?)\b', first_line, re.I)
                if not m:
                    continue

            raw_art = m.group(1).upper().strip()
            num_match = re.search(r'\d{3,6}', raw_art)
            if not num_match:
                continue

            model_num = num_match.group(0)

            # Match against eligible products
            matching_items = []
            for item in brand_products:
                prod = item['product']
                pname = prod['productName'].upper()
                clean_pn = strip_product_meta(pname)
                # Strict word boundary match
                if re.search(r'\b' + re.escape(model_num) + r'\b', clean_pn):
                    matching_items.append(item)

            if not matching_items:
                continue

            # Find closest shoe image to this text block
            b_y0, b_y1 = b[1], b[3]
            # In catalogs, images are typically directly above or adjacent to the text block
            best_img = None
            min_dist = 999999

            for img in valid_imgs:
                bbox = fitz.Rect(img['bbox'])
                # Prefer images above the text block or vertically overlapping
                if bbox.y1 <= b_y1 + 40:
                    dist = abs(b_y0 - bbox.y1)
                    if dist < min_dist:
                        min_dist = dist
                        best_img = bbox

            if not best_img:
                # Fallback to closest center distance
                b_center = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
                for img in valid_imgs:
                    bbox = fitz.Rect(img['bbox'])
                    img_center = (bbox.x0 + bbox.x1) / 2, (bbox.y0 + bbox.y1) / 2
                    dist = ((b_center[0] - img_center[0])**2 + (b_center[1] - img_center[1])**2)**0.5
                    if dist < min_dist:
                        min_dist = dist
                        best_img = bbox

            if not best_img:
                continue

            # Process matching product
            for item in matching_items:
                prod = item['product']
                # Skip if already has secondaryImageUrl
                if prod.get('secondaryImageUrl'):
                    continue

                safe_art = re.sub(r'[^A-Za-z0-9]', '_', raw_art)
                out_filename = f"{brand_name}_{safe_art}_P{pno+1}.webp"
                out_path = os.path.join(OUTPUT_DIR, out_filename)

                # Render & enhance
                process_and_crop(page, best_img, out_path)

                # Upload to Cloudinary
                sec_url = upload_image_to_cloudinary(out_path)
                if not sec_url:
                    # Fallback to local asset
                    sec_url = f"/assets/catalog_models/{out_filename}"

                # Assign secondaryImageUrl
                prod['secondaryImageUrl'] = sec_url
                if not prod.get('imageUrl'):
                    prod['imageUrl'] = sec_url

                extracted_count += 1
                matched_results.append({
                    "catalog": brand_name,
                    "page": pno + 1,
                    "catalogArticle": first_line,
                    "modelNumber": model_num,
                    "group": item['group'],
                    "product": prod['productName'],
                    "imageUrl": sec_url
                })
                print(f"[{extracted_count}/{max_extract}] Matched P{pno+1}: {raw_art} -> [{item['group']}] {prod['productName']}")
                break

    return matched_results

async def main():
    print("Loading stock data...")
    with open(FRONTEND_STOCK, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    # Extract verified models from Paragon and Eeken catalogs
    paragon_results = await extract_catalog(PARAGON_PDF, "PARAGON", stock_data, max_extract=40)
    eeken_results = await extract_catalog(EEKEN_PDF, "EEKEN", stock_data, max_extract=20)

    all_results = paragon_results + eeken_results

    # Save updated stock data to both frontend and sbe-hub
    print("\nSaving updated stock data...")
    with open(FRONTEND_STOCK, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)
    with open(HUB_STOCK, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    # Save report
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "totalExtracted": len(all_results),
            "paragonCount": len(paragon_results),
            "eekenCount": len(eeken_results),
            "results": all_results
        }, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Completed catalog extraction: {len(all_results)} verified models extracted and uploaded!")
    print(f"✓ Report saved to: {REPORT_PATH}")

if __name__ == '__main__':
    asyncio.run(main())
