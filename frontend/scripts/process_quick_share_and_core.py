import os
import sys
import json
import re
import zipfile
import asyncio
import urllib.request
import urllib.parse
from PIL import Image
import winocr

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

QUICK_SHARE_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"
FRONTEND_STOCK = r"c:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK = r"c:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
REPORT_PATH = r"c:\Projects\sbe\frontend\scripts\quick_share_upload_report.json"

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
ASSET_FOLDER = "e-sbe"

COLOR_MAP = {
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

def upload_bytes_to_cloudinary(img_bytes, filename, folder_path=ASSET_FOLDER):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="folder"\r\n\r\n{folder_path}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(img_bytes)
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

async def process_core_cards(stock_data):
    print("\n==================================================")
    print("STEP 1: UPLOADING & LINKING CORE DESIGN CARDS")
    print("==================================================")
    core_files = sorted([f for f in os.listdir(QUICK_SHARE_DIR) if f.startswith('Core-') and f.endswith('.png')])
    print(f"Found {len(core_files)} Core design cards")

    core_results = []
    for cf in core_files:
        fpath = os.path.join(QUICK_SHARE_DIR, cf)
        # Parse model and color from filename: e.g. Core-1136.png, Core-1250-BKR.png, Core-cushion.png
        m = re.match(r'Core-([A-Za-z0-9]+)(?:-([A-Z]{3}))?', cf)
        if not m:
            continue
        model = m.group(1).upper()
        color = m.group(2).upper() if m.group(2) else None

        # Upload card to Cloudinary
        with open(fpath, 'rb') as f:
            bytes_data = f.read()
        sec_url = upload_bytes_to_cloudinary(bytes_data, cf, folder_path="e-sbe/core")
        if not sec_url:
            continue

        # Match against Paragon products
        matched_count = 0
        for g in stock_data:
            gname = g.get('groupName', '').upper()
            if any(k in gname for k in ['PARAGON', 'PARALITE']):
                for p in g.get('products', []):
                    pname = p.get('productName', '')
                    clean_pn = strip_product_meta(pname).upper()
                    # Check model match
                    model_match = False
                    if model == 'CUSHION':
                        model_match = 'CUSHION' in clean_pn
                    else:
                        model_match = bool(re.search(r'\b' + re.escape(model) + r'\b', clean_pn))

                    if model_match:
                        # Check color if specified
                        if color:
                            aliases = COLOR_MAP.get(color, [color])
                            if not any(a in pname.upper() for a in aliases):
                                continue
                        # Link
                        p['secondaryImageUrl'] = sec_url
                        matched_count += 1

        print(f" ✓ Uploaded {cf} -> {sec_url} (linked to {matched_count} products)")
        core_results.append({"file": cf, "model": model, "color": color, "url": sec_url, "matchedProducts": matched_count})

    return core_results

async def process_brand_zip(zip_name, target_group_brand, stock_data, max_items=60):
    zip_path = os.path.join(QUICK_SHARE_DIR, zip_name)
    if not os.path.exists(zip_path):
        print(f"Zip not found: {zip_path}")
        return []

    print(f"\n==================================================")
    print(f"PROCESSING: {zip_name} -> Brand: {target_group_brand}")
    print("==================================================")

    # Collect target products
    target_prods = []
    for g in stock_data:
        gname = g.get('groupName', '').upper()
        if target_group_brand in gname:
            for p in g.get('products', []):
                target_prods.append(p)

    print(f"Found {len(target_prods)} products for brand {target_group_brand}")

    results = []
    uploaded = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_imgs = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total images in zip: {len(all_imgs)}")

        for img_name in all_imgs:
            if uploaded >= max_items:
                break

            img_bytes = z.read(img_name)
            # Temp save for winocr
            temp_path = "temp_quick_share.jpg"
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            try:
                pil_img = Image.open(temp_path)
                ocr_res = await winocr.recognize_pil(pil_img, 'en')
                ocr_text = (ocr_res.text or '').lower() if ocr_res else ''
            except Exception:
                continue

            # ZERO-TOLERANCE FILTER: Discard any photo with "Sri Brundabana Enterprises" or "Qty"
            if 'brundabana' in ocr_text or 'enterprises' in ocr_text or 'sbe' in ocr_text:
                continue
            if 'qty' in ocr_text or 'qty:' in ocr_text or 'qty.' in ocr_text:
                continue

            # Extract model from OCR
            matched_prod = None

            if target_group_brand == 'ACTION':
                m_art = re.search(r'article\s+([A-Za-z0-9\-]+)', ocr_text)
                if not m_art:
                    m_art = re.search(r'\b(axel|aptos|aqua|casio|clogs|core|electra|furr|megrez|power|spark|track|walker|handfree)\b', ocr_text)
                if m_art:
                    model_token = m_art.group(1).upper()
                    for p in target_prods:
                        if p.get('secondaryImageUrl'):
                            continue
                        pname = p.get('productName', '').upper()
                        if re.search(r'\b' + re.escape(model_token) + r'\b', pname):
                            matched_prod = p
                            break

            elif target_group_brand == 'EEKEN':
                m_art = re.search(r'(?:model\s*no\.?\s*|eeken\s*)([A-Za-z0-9\-]+)', ocr_text)
                if not m_art:
                    m_art = re.search(r'\b(\d{3,6})\b', ocr_text)
                if m_art:
                    raw = m_art.group(1).upper()
                    num_m = re.search(r'\d{3,6}', raw)
                    if num_m:
                        model_num = num_m.group(0)
                        for p in target_prods:
                            if p.get('secondaryImageUrl'):
                                continue
                            pname = p.get('productName', '').upper()
                            clean_pn = strip_product_meta(pname)
                            if re.search(r'\b' + re.escape(model_num) + r'\b', clean_pn):
                                matched_prod = p
                                break

            elif target_group_brand == 'CUBIX':
                m_art = re.search(r'\b(cbx|cubix)\s*([A-Za-z0-9\-]+)', ocr_text)
                if not m_art:
                    m_art = re.search(r'\b(\d{4,6})\b', ocr_text)
                if m_art:
                    raw = m_art.group(len(m_art.groups())).upper()
                    num_m = re.search(r'\d{4,6}', raw)
                    if num_m:
                        model_num = num_m.group(0)
                        for p in target_prods:
                            if p.get('secondaryImageUrl'):
                                continue
                            pname = p.get('productName', '').upper()
                            clean_pn = strip_product_meta(pname)
                            if re.search(r'\b' + re.escape(model_num) + r'\b', clean_pn):
                                matched_prod = p
                                break

            elif target_group_brand == 'FLOREX':
                m_art = re.search(r'\b(swastik|florex)\s*([A-Za-z0-9\-]+)', ocr_text)
                if not m_art:
                    m_art = re.search(r'\b(alia|deluxe|fruit|frooty|juicy|mariya|ritika|simran|sweety)\b', ocr_text)
                if m_art:
                    raw = m_art.group(len(m_art.groups())).upper()
                    for p in target_prods:
                        if p.get('secondaryImageUrl'):
                            continue
                        pname = p.get('productName', '').upper()
                        clean_pn = strip_product_meta(pname)
                        if re.search(r'\b' + re.escape(raw) + r'\b', clean_pn):
                            matched_prod = p
                            break

            if matched_prod:
                safe_name = f"{target_group_brand}_{os.path.basename(img_name)}"
                sec_url = upload_bytes_to_cloudinary(img_bytes, safe_name, folder_path=f"e-sbe/{target_group_brand.lower()}")
                if sec_url:
                    uploaded += 1
                    matched_prod['secondaryImageUrl'] = sec_url
                    print(f" [{uploaded}/{max_items}] Uploaded {safe_name} -> {matched_prod['productName']}")
                    results.append({
                        "zip": zip_name,
                        "brand": target_group_brand,
                        "file": img_name,
                        "product": matched_prod['productName'],
                        "url": sec_url
                    })

    return results

async def main():
    print("Loading stock data...")
    with open(FRONTEND_STOCK, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    # 1. Process Core design cards (16 cards)
    core_results = await process_core_cards(stock_data)

    # 2. Process Action Synergy
    action_results = await process_brand_zip("WhatsApp Chat with Action Synergy.zip", "ACTION", stock_data, max_items=25)

    # 3. Process Eeken Photo Samples
    eeken_results = await process_brand_zip("WhatsApp Chat with EEKEN PHOTO SAMPLES .zip", "EEKEN", stock_data, max_items=25)

    # 4. Process Cubix Gallery (clean images only, no SBE/Qty)
    cubix_results = await process_brand_zip("WhatsApp Chat with NEW CUBIX GALLERY .zip", "CUBIX", stock_data, max_items=20)

    # 5. Process Florex Gallery (clean images only, no SBE/Qty)
    florex_results = await process_brand_zip("WhatsApp Chat with FLOREX GALLERY.zip", "FLOREX", stock_data, max_items=20)

    # Save stock data
    print("\nSaving stock data...")
    with open(FRONTEND_STOCK, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)
    with open(HUB_STOCK, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    total_uploaded = len(core_results) + len(action_results) + len(eeken_results) + len(cubix_results) + len(florex_results)
    report = {
        "totalUploaded": total_uploaded,
        "coreCards": core_results,
        "actionCards": action_results,
        "eekenCards": eeken_results,
        "cubixCards": cubix_results,
        "florexCards": florex_results
    }
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Completed: {total_uploaded} clean, verified secondary images uploaded to Cloudinary!")
    print(f"✓ Report saved to: {REPORT_PATH}")

if __name__ == '__main__':
    asyncio.run(main())
