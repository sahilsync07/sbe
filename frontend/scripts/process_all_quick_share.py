import os
import sys
import json
import re
import io
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
REPORT_PATH = r"c:\Projects\sbe\frontend\scripts\quick_share_full_report.json"

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"

COMMON_PRICES = {
    '115', '120', '125', '130', '135', '140', '145', '149', '150', '160', '165', '170', '175', '180', '185', '189', '190', '195', '199',
    '210', '215', '219', '220', '225', '230', '233', '235', '240', '245', '249', '250', '254', '255', '259', '260', '265', '270', '275', '279', '280', '285', '289', '290', '294', '295', '299',
    '310', '319', '320', '325', '327', '329', '330', '335', '339', '340', '345', '349', '350', '354', '355', '359', '360', '365', '368', '369', '370', '375', '379', '380', '385', '389', '390', '395', '399',
    '410', '416', '419', '420', '425', '429', '430', '435', '439', '440', '445', '449', '450', '455', '460', '464', '465', '469', '470', '475', '479', '480', '485', '489', '490', '495', '499',
    '510', '519', '520', '525', '529', '530', '534', '535', '539', '540', '545', '549', '550', '555', '559', '560', '565', '569', '570', '575', '579', '580', '585', '589', '590', '595', '599',
    '610', '619', '620', '625', '629', '630', '635', '640', '645', '649', '650', '655', '660', '665', '669', '670', '675', '679', '680', '685', '689', '690', '695', '699',
    '710', '719', '720', '725', '730', '735', '740', '745', '749', '750', '755', '760', '765', '770', '775', '780', '785', '789', '790', '795', '799',
    '810', '819', '820', '825', '830', '840', '849', '850', '860', '870', '880', '890', '899',
    '910', '920', '930', '940', '950', '960', '970', '980', '990', '999',
    '1099', '1199', '1299', '1399', '1449', '1499', '1599', '1699', '1799', '1899', '1999',
    '2024', '2025', '2026', '1969'
}

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

def clean_semantic_name(brand, prod_name, ext=".jpg"):
    p = prod_name
    p = re.sub(r'\(.*?\)', ' ', p)
    p = re.sub(r'(?<!\d)\d{1,2}\s*[\*\-xX\/]\s*\d{1,2}(?!\d)', ' ', p)
    p = re.sub(r'(?:MRP|RS|NET|RATE)[\s\.\:]*\d+(?:\.\d+)?/?-?', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'@\s*\d+(?:\.\d+)?/?-?', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'\b\d{2,4}/-(?!\d)', ' ', p)
    p = re.sub(r'/(?!\w)', ' ', p)

    p = re.sub(r'\b(CBX|CUBIX|SWASTIK|FLOREX|AIRSUN|AIRSON|EEKEN|ACTION|RELIANCE|PARAGON|PARALITE|HITWAY|ADDA|AJANTA)\b', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'\b(GENTS|LADIES|LDS|BOYS|KIDS|SHOES?|SANDALS?|SLIPPERS?|CHAPPALS?|NEW|EVA|PVC|PU|SPORT)\b', ' ', p, flags=re.IGNORECASE)

    tokens = [t.strip() for t in re.split(r'[\s\/,\-_]+', p) if t.strip()]
    tokens = [re.sub(r'[^A-Za-z0-9]', '', t).upper() for t in tokens if re.sub(r'[^A-Za-z0-9]', '', t)]

    name_part = '_'.join(tokens[:4]) if tokens else 'ARTICLE'
    safe_brand = re.sub(r'[^A-Za-z0-9]', '', brand).upper()
    return f"{safe_brand}_{name_part}{ext}"

def upload_bytes_to_cloudinary(img_bytes, filename, folder_path="e-sbe"):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    public_id = os.path.splitext(filename)[0]

    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="folder"\r\n\r\n{folder_path}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="public_id"\r\n\r\n{public_id}\r\n'.encode())
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
                print(f"   Upload failed for {filename}: {e}", flush=True)
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

def check_sbe_qty_pre_ocr(img):
    """
    Fast pre-OCR filter:
    1. Aspect ratio: phone status screenshots have ratio < 0.58.
    2. Header/Footer black bars: SBE status cards have solid black bars at top and bottom.
    """
    w, h = img.size
    ratio = w / h
    if ratio < 0.58:
        return True, f"phone_aspect_ratio({ratio:.2f})"

    im_rgb = img.convert('RGB')
    top_strip = im_rgb.crop((0, 0, w, max(1, int(h * 0.05))))
    bot_strip = im_rgb.crop((0, int(h * 0.95), w, h))

    pixels_top = list(top_strip.getdata())
    pixels_bot = list(bot_strip.getdata())
    top_bright = sum(p[0]+p[1]+p[2] for p in pixels_top) / (len(pixels_top) * 3)
    bot_bright = sum(p[0]+p[1]+p[2] for p in pixels_bot) / (len(pixels_bot) * 3)

    if top_bright < 35 and bot_bright < 35:
        return True, f"black_bars(top={top_bright:.1f},bot={bot_bright:.1f})"

    return False, "ok"

def is_sbe_or_qty_post_ocr(ocr_full_text, top_ocr_text):
    all_txt = f"{ocr_full_text} {top_ocr_text}".lower()

    # SBE keywords including OCR variations
    sbe_keywords = ['brundabana', 'brundaban', 'enterprises', 'enterprise', 
                    'rayagada', 'rayasada', 'raygada', 'sbe']
    for kw in sbe_keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', all_txt):
            return True

    # Date header pattern
    if re.search(r'\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+202', top_ocr_text.lower()):
        return True

    # Qty / Quantity indicators
    if re.search(r'\bqty\b|qty[\:\.]|quantity', all_txt):
        return True

    return False

def matches_color(prod_name, ocr_text):
    pn = prod_name.upper()
    ot = ocr_text.upper()
    for col_key, aliases in COLOR_MAP.items():
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            if any(re.search(r'\b' + re.escape(a) + r'\b', ot) for a in aliases):
                return True
    return True

def should_update_secondary(curr_url):
    if not curr_url:
        return True
    if 'catalog_models' in curr_url or 'catalog_crops' in curr_url:
        return True
    if 'WA0' in curr_url or 'IMG-' in curr_url:
        return True
    return False

def save_databases(stock_data, all_results):
    print("Saving updated database to frontend and sbe-hub...", flush=True)
    with open(FRONTEND_STOCK, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)
    with open(HUB_STOCK, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    replacements = [r for r in all_results if r.get('replacedCatalog')]
    new_links = [r for r in all_results if not r.get('replacedCatalog')]
    full_report = {
        "totalProcessed": len(all_results),
        "newLinks": len(new_links),
        "replacedCatalogCrops": len(replacements),
        "results": all_results
    }
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2, ensure_ascii=False)
    print(f"Checkpoint saved: {len(all_results)} total semantic uploads ({len(replacements)} replaced catalog crops)", flush=True)

# =========================================================================
# 1. EEKEN PROCESSOR
# =========================================================================
async def process_eeken(stock_data):
    zip_path = os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with EEKEN PHOTO SAMPLES .zip")
    if not os.path.exists(zip_path):
        return []

    print("\n==================================================", flush=True)
    print("PROCESSING EEKEN GALLERY (Strict Semantic & SBE/Qty Filter)", flush=True)
    print("==================================================", flush=True)

    eeken_prods = []
    for g in stock_data:
        if 'EEKEN' in g.get('groupName', '').upper():
            for p in g.get('products', []):
                eeken_prods.append(p)

    results = []
    uploaded = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total EEKEN photos in zip: {len(all_names)}", flush=True)

        for name in all_names:
            if not any(should_update_secondary(p.get('secondaryImageUrl')) for p in eeken_prods):
                print("All EEKEN candidate products fulfilled!", flush=True)
                break

            img_bytes = z.read(name)
            try:
                img = Image.open(io.BytesIO(img_bytes))
            except Exception:
                continue

            # Layer 1 & 2: Pre-OCR check (aspect ratio and black bars)
            flagged, reason = check_sbe_qty_pre_ocr(img)
            if flagged:
                continue

            try:
                w, h = img.size
                top_box = img.crop((0, 0, w, max(1, int(h * 0.15))))
                res_full = await winocr.recognize_pil(img, 'en')
                res_top = await winocr.recognize_pil(top_box, 'en')
                ocr_full = (res_full.text or '') if res_full else ''
                ocr_top = (res_top.text or '') if res_top else ''
            except Exception:
                continue

            # Layer 3 & 4: Post-OCR check (SBE/Qty keywords and headers)
            if is_sbe_or_qty_post_ocr(ocr_full, ocr_top):
                continue

            raw_nums = re.findall(r'\b\d{3,5}\b', ocr_full)
            model_nums = [n for n in raw_nums if n not in COMMON_PRICES]
            if not model_nums:
                continue

            matched_prod = None
            for num in model_nums:
                for p in eeken_prods:
                    if not should_update_secondary(p.get('secondaryImageUrl')):
                        continue
                    clean_pn = strip_product_meta(p['productName']).upper()
                    if re.search(r'\b' + re.escape(num) + r'\b', clean_pn):
                        if matches_color(p['productName'], ocr_full):
                            matched_prod = p
                            break
                if matched_prod:
                    break

            if matched_prod:
                semantic_file = clean_semantic_name("EEKEN", matched_prod['productName'])
                sec_url = upload_bytes_to_cloudinary(img_bytes, semantic_file, folder_path="e-sbe/eeken")
                if sec_url:
                    prev_url = matched_prod.get('secondaryImageUrl')
                    is_replacement = bool(prev_url and ('catalog_models' in prev_url or 'catalog_crops' in prev_url))
                    matched_prod['secondaryImageUrl'] = sec_url
                    uploaded += 1
                    status = "REPLACED CATALOG CROP" if is_replacement else "NEW LINK"
                    print(f" [EEKEN #{uploaded}] [{status}] {semantic_file} -> {matched_prod['productName']}", flush=True)
                    results.append({
                        "brand": "EEKEN",
                        "file": semantic_file,
                        "product": matched_prod['productName'],
                        "url": sec_url,
                        "replacedCatalog": is_replacement
                    })

    return results

# =========================================================================
# 2. ACTION PROCESSOR
# =========================================================================
async def process_action(stock_data):
    zip_path = os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with Action Synergy.zip")
    if not os.path.exists(zip_path):
        return []

    print("\n==================================================", flush=True)
    print("PROCESSING ACTION SYNERGY GALLERY (Strict Semantic & SBE/Qty Filter)", flush=True)
    print("==================================================", flush=True)

    action_prods = []
    for g in stock_data:
        if 'ACTION' in g.get('groupName', '').upper():
            for p in g.get('products', []):
                action_prods.append(p)

    results = []
    uploaded = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total ACTION photos in zip: {len(all_names)}", flush=True)

        for name in all_names:
            if not any(should_update_secondary(p.get('secondaryImageUrl')) for p in action_prods):
                print("All ACTION candidate products fulfilled!", flush=True)
                break

            img_bytes = z.read(name)
            try:
                img = Image.open(io.BytesIO(img_bytes))
            except Exception:
                continue

            flagged, reason = check_sbe_qty_pre_ocr(img)
            if flagged:
                continue

            try:
                w, h = img.size
                top_box = img.crop((0, 0, w, max(1, int(h * 0.15))))
                res_full = await winocr.recognize_pil(img, 'en')
                res_top = await winocr.recognize_pil(top_box, 'en')
                ocr_full = (res_full.text or '') if res_full else ''
                ocr_top = (res_top.text or '') if res_top else ''
            except Exception:
                continue

            if is_sbe_or_qty_post_ocr(ocr_full, ocr_top):
                continue

            m_art = re.search(r'article\s+([A-Za-z0-9\-]+)', ocr_full, re.IGNORECASE)
            if not m_art:
                m_art = re.search(r'\b(axel|aptos|aqua|casio|clogs|core|electra|furr|megrez|power|spark|track|walker|handfree)\b', ocr_full, re.IGNORECASE)
            if not m_art:
                continue

            model_token = m_art.group(1).upper()
            matched_prod = None
            for p in action_prods:
                if not should_update_secondary(p.get('secondaryImageUrl')):
                    continue
                pname = p.get('productName', '').upper()
                if re.search(r'\b' + re.escape(model_token) + r'\b', pname):
                    if matches_color(pname, ocr_full):
                        matched_prod = p
                        break

            if matched_prod:
                semantic_file = clean_semantic_name("ACTION", matched_prod['productName'])
                sec_url = upload_bytes_to_cloudinary(img_bytes, semantic_file, folder_path="e-sbe/action")
                if sec_url:
                    prev_url = matched_prod.get('secondaryImageUrl')
                    is_replacement = bool(prev_url and ('catalog_models' in prev_url or 'catalog_crops' in prev_url))
                    matched_prod['secondaryImageUrl'] = sec_url
                    uploaded += 1
                    status = "REPLACED CATALOG CROP" if is_replacement else "NEW LINK"
                    print(f" [ACTION #{uploaded}] [{status}] {semantic_file} -> {matched_prod['productName']}", flush=True)
                    results.append({
                        "brand": "ACTION",
                        "file": semantic_file,
                        "product": matched_prod['productName'],
                        "url": sec_url,
                        "replacedCatalog": is_replacement
                    })

    return results

# =========================================================================
# 3. CUBIX PROCESSOR
# =========================================================================
async def process_cubix(stock_data):
    zip_path = os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with NEW CUBIX GALLERY .zip")
    if not os.path.exists(zip_path):
        return []

    print("\n==================================================", flush=True)
    print("PROCESSING CUBIX GALLERY (Strict Semantic & SBE/Qty Filter)", flush=True)
    print("==================================================", flush=True)

    cubix_prods = []
    for g in stock_data:
        gname = g.get('groupName', '').upper()
        if 'CUBIX' in gname:
            for p in g.get('products', []):
                cubix_prods.append(p)

    results = []
    uploaded = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total CUBIX photos in zip: {len(all_names)}", flush=True)

        for name in all_names:
            if not any(should_update_secondary(p.get('secondaryImageUrl')) for p in cubix_prods):
                print("All CUBIX candidate products fulfilled!", flush=True)
                break

            img_bytes = z.read(name)
            try:
                img = Image.open(io.BytesIO(img_bytes))
            except Exception:
                continue

            flagged, reason = check_sbe_qty_pre_ocr(img)
            if flagged:
                continue

            try:
                w, h = img.size
                top_box = img.crop((0, 0, w, max(1, int(h * 0.15))))
                res_full = await winocr.recognize_pil(img, 'en')
                res_top = await winocr.recognize_pil(top_box, 'en')
                ocr_full = (res_full.text or '') if res_full else ''
                ocr_top = (res_top.text or '') if res_top else ''
            except Exception:
                continue

            if is_sbe_or_qty_post_ocr(ocr_full, ocr_top):
                continue

            m_art = re.search(r'\b(cbx|cubix)\s*([A-Za-z0-9\-]+)', ocr_full, re.IGNORECASE)
            if not m_art:
                m_art = re.search(r'\b([mlc]?\d{4,6})\b', ocr_full)
            if not m_art:
                continue

            raw = m_art.group(len(m_art.groups())).upper()
            num_m = re.search(r'\d{4,6}', raw)
            if not num_m:
                continue
            model_num = num_m.group(0)
            if model_num in COMMON_PRICES:
                continue

            matched_prod = None
            for p in cubix_prods:
                if not should_update_secondary(p.get('secondaryImageUrl')):
                    continue
                pname = p.get('productName', '').upper()
                clean_pn = strip_product_meta(pname)
                if re.search(r'\b' + re.escape(model_num) + r'\b', clean_pn):
                    matched_prod = p
                    break

            if matched_prod:
                semantic_file = clean_semantic_name("CUBIX", matched_prod['productName'])
                sec_url = upload_bytes_to_cloudinary(img_bytes, semantic_file, folder_path="e-sbe/cubix")
                if sec_url:
                    matched_prod['secondaryImageUrl'] = sec_url
                    uploaded += 1
                    print(f" [CUBIX #{uploaded}] [NEW LINK] {semantic_file} -> {matched_prod['productName']}", flush=True)
                    results.append({
                        "brand": "CUBIX",
                        "file": semantic_file,
                        "product": matched_prod['productName'],
                        "url": sec_url,
                        "replacedCatalog": False
                    })

    return results

# =========================================================================
# 4. FLOREX PROCESSOR
# =========================================================================
async def process_florex(stock_data):
    zip_path = os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with FLOREX GALLERY.zip")
    if not os.path.exists(zip_path):
        return []

    print("\n==================================================", flush=True)
    print("PROCESSING FLOREX GALLERY (Strict Semantic & SBE/Qty Filter)", flush=True)
    print("==================================================", flush=True)

    florex_prods = []
    for g in stock_data:
        gname = g.get('groupName', '').upper()
        if 'FLOREX' in gname or 'SWASTIK' in gname:
            for p in g.get('products', []):
                florex_prods.append(p)

    results = []
    uploaded = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total FLOREX photos in zip: {len(all_names)}", flush=True)

        for name in all_names:
            if not any(should_update_secondary(p.get('secondaryImageUrl')) for p in florex_prods):
                print("All FLOREX candidate products fulfilled!", flush=True)
                break

            img_bytes = z.read(name)
            try:
                img = Image.open(io.BytesIO(img_bytes))
            except Exception:
                continue

            flagged, reason = check_sbe_qty_pre_ocr(img)
            if flagged:
                continue

            try:
                w, h = img.size
                top_box = img.crop((0, 0, w, max(1, int(h * 0.15))))
                res_full = await winocr.recognize_pil(img, 'en')
                res_top = await winocr.recognize_pil(top_box, 'en')
                ocr_full = (res_full.text or '') if res_full else ''
                ocr_top = (res_top.text or '') if res_top else ''
            except Exception:
                continue

            if is_sbe_or_qty_post_ocr(ocr_full, ocr_top):
                continue

            m_art = re.search(r'\b(alia|deluxe|fruit|frooty|juicy|mariya|ritika|simran|sweety|seltos)\b', ocr_full, re.IGNORECASE)
            if not m_art:
                continue

            raw = m_art.group(1).upper()
            num_m = re.search(r'\b\d{1,3}\b', ocr_full)
            sub_num = num_m.group(0) if num_m and num_m.group(0) not in COMMON_PRICES else None

            matched_prod = None
            for p in florex_prods:
                if not should_update_secondary(p.get('secondaryImageUrl')):
                    continue
                pname = p.get('productName', '').upper()
                clean_pn = strip_product_meta(pname)
                if re.search(r'\b' + re.escape(raw) + r'\b', clean_pn):
                    if sub_num:
                        if re.search(r'\b' + re.escape(sub_num) + r'\b', clean_pn):
                            matched_prod = p
                            break
                    else:
                        matched_prod = p
                        break

            if matched_prod:
                semantic_file = clean_semantic_name("FLOREX", matched_prod['productName'])
                sec_url = upload_bytes_to_cloudinary(img_bytes, semantic_file, folder_path="e-sbe/florex")
                if sec_url:
                    matched_prod['secondaryImageUrl'] = sec_url
                    uploaded += 1
                    print(f" [FLOREX #{uploaded}] [NEW LINK] {semantic_file} -> {matched_prod['productName']}", flush=True)
                    results.append({
                        "brand": "FLOREX",
                        "file": semantic_file,
                        "product": matched_prod['productName'],
                        "url": sec_url,
                        "replacedCatalog": False
                    })

    return results

# =========================================================================
# 5. BOX FOOTWEAR PROCESSOR
# =========================================================================
async def process_box_footwear(stock_data):
    zip_path = os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with BOX FOOTWEAR PHOTO GALLERY👟👞.zip")
    if not os.path.exists(zip_path):
        return []

    print("\n==================================================", flush=True)
    print("PROCESSING BOX FOOTWEAR GALLERY (Strict Semantic & SBE/Qty Filter)", flush=True)
    print("==================================================", flush=True)

    brand_prods = {}
    for g in stock_data:
        gname = g.get('groupName', '')
        if gname.startswith('_'):
            continue
        brand_prods[gname] = g.get('products', [])

    results = []
    uploaded = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total BOX FOOTWEAR photos in zip: {len(all_names)}", flush=True)

        for name in all_names:
            img_bytes = z.read(name)
            try:
                img = Image.open(io.BytesIO(img_bytes))
            except Exception:
                continue

            flagged, reason = check_sbe_qty_pre_ocr(img)
            if flagged:
                continue

            try:
                w, h = img.size
                top_box = img.crop((0, 0, w, max(1, int(h * 0.15))))
                res_full = await winocr.recognize_pil(img, 'en')
                res_top = await winocr.recognize_pil(top_box, 'en')
                ocr_full = (res_full.text or '') if res_full else ''
                ocr_top = (res_top.text or '') if res_top else ''
            except Exception:
                continue

            if is_sbe_or_qty_post_ocr(ocr_full, ocr_top):
                continue

            matched_prod = None
            target_brand = None

            # 1. RELIANCE (XM-xxxx, FM-xxxx, FK-xxxx)
            m_rel = re.search(r'\b(xm|fm|fk)[-\s]?(\d{4})\b', ocr_full, re.IGNORECASE)
            if m_rel:
                model_code = f"{m_rel.group(1).upper()}-{m_rel.group(2)}"
                for p in brand_prods.get('RELIANCE FOOTWEAR', []):
                    if not should_update_secondary(p.get('secondaryImageUrl')):
                        continue
                    pname = p.get('productName', '').upper()
                    if re.search(r'\b' + re.escape(model_code) + r'\b', pname) or re.search(r'\b' + re.escape(model_code.replace('-', '')) + r'\b', pname):
                        matched_prod = p
                        target_brand = "RELIANCE"
                        break

            # 2. HITWAY (ACTIVE-xx, ACTIVE ON-xx)
            if not matched_prod and 'hitway' in ocr_full.lower():
                m_hw = re.search(r'active[\s\-]+(?:on[\s\-]+)?(\d+)', ocr_full, re.IGNORECASE)
                if m_hw:
                    num = m_hw.group(1)
                    for p in brand_prods.get('HITWAY', []):
                        if not should_update_secondary(p.get('secondaryImageUrl')):
                            continue
                        pname = p.get('productName', '').upper()
                        if re.search(r'\b' + re.escape(num) + r'\b', pname):
                            matched_prod = p
                            target_brand = "HITWAY"
                            break

            # 3. GOKUL / AIRSON (SOFTY-xx, SPL-xx, STAR-xx)
            if not matched_prod:
                m_air = re.search(r'\b(softy|spl|star)[-\s]?(\d{1,4})\b', ocr_full, re.IGNORECASE)
                if m_air:
                    art_type = m_air.group(1).upper()
                    art_num = m_air.group(2)
                    for gname in ['GOKUL FOOTWEAR', 'AIRSON']:
                        for p in brand_prods.get(gname, []):
                            if not should_update_secondary(p.get('secondaryImageUrl')):
                                continue
                            pname = p.get('productName', '').upper()
                            if re.search(r'\b' + re.escape(art_type) + r'[-\s]*' + re.escape(art_num) + r'\b', pname):
                                matched_prod = p
                                target_brand = gname.split()[0]
                                break
                        if matched_prod:
                            break

            # 4. ADDA (AE-xx, AMBITION-xx, MELODY-xx)
            if not matched_prod and 'adda' in ocr_full.lower():
                m_adda = re.search(r'\b(ae|ambition|melody)[-\s]?(\d+)\b', ocr_full, re.IGNORECASE)
                if m_adda:
                    model_code = f"{m_adda.group(1).upper()}-{m_adda.group(2)}"
                    for p in brand_prods.get('ADDA', []):
                        if not should_update_secondary(p.get('secondaryImageUrl')):
                            continue
                        pname = p.get('productName', '').upper()
                        if re.search(r'\b' + re.escape(model_code) + r'\b', pname) or re.search(r'\b' + re.escape(m_adda.group(1).upper()) + r'\b', pname):
                            matched_prod = p
                            target_brand = "ADDA"
                            break

            # 5. AJANTA
            if not matched_prod and 'ajanta' in ocr_full.lower():
                m_aj = re.search(r'\b(cg|ceg)[-\s]?(\d+)\b', ocr_full, re.IGNORECASE)
                if m_aj:
                    code = f"{m_aj.group(1).upper()} {m_aj.group(2)}"
                    for p in brand_prods.get('AJANTA', []):
                        if not should_update_secondary(p.get('secondaryImageUrl')):
                            continue
                        pname = p.get('productName', '').upper()
                        if re.search(r'\b' + re.escape(code) + r'\b', pname) or re.search(r'\b' + re.escape(m_aj.group(2)) + r'\b', pname):
                            matched_prod = p
                            target_brand = "AJANTA"
                            break

            if matched_prod and target_brand:
                semantic_file = clean_semantic_name(target_brand, matched_prod['productName'])
                sec_url = upload_bytes_to_cloudinary(img_bytes, semantic_file, folder_path=f"e-sbe/{target_brand.lower()}")
                if sec_url:
                    prev_url = matched_prod.get('secondaryImageUrl')
                    is_replacement = bool(prev_url and ('catalog_models' in prev_url or 'catalog_crops' in prev_url))
                    matched_prod['secondaryImageUrl'] = sec_url
                    uploaded += 1
                    status = "REPLACED CATALOG CROP" if is_replacement else "NEW LINK"
                    print(f" [BOX #{uploaded}] [{status}] {semantic_file} -> {matched_prod['productName']}", flush=True)
                    results.append({
                        "brand": target_brand,
                        "file": semantic_file,
                        "product": matched_prod['productName'],
                        "url": sec_url,
                        "replacedCatalog": is_replacement
                    })

    return results

# =========================================================================
# 6. MAIN ORCHESTRATOR
# =========================================================================
async def main():
    print("Loading stock database...", flush=True)
    with open(FRONTEND_STOCK, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    all_results = []

    # 1. EEKEN
    eeken_res = await process_eeken(stock_data)
    all_results.extend(eeken_res)
    save_databases(stock_data, all_results)

    # 2. ACTION
    action_res = await process_action(stock_data)
    all_results.extend(action_res)
    save_databases(stock_data, all_results)

    # 3. CUBIX
    cubix_res = await process_cubix(stock_data)
    all_results.extend(cubix_res)
    save_databases(stock_data, all_results)

    # 4. FLOREX
    florex_res = await process_florex(stock_data)
    all_results.extend(florex_res)
    save_databases(stock_data, all_results)

    # 5. BOX FOOTWEAR
    box_res = await process_box_footwear(stock_data)
    all_results.extend(box_res)
    save_databases(stock_data, all_results)

    replacements = [r for r in all_results if r.get('replacedCatalog')]
    new_links = [r for r in all_results if not r.get('replacedCatalog')]

    print("\n==================================================", flush=True)
    print("QUICK SHARE PROCESSING COMPLETE WITH ZERO-TOLERANCE SBE/QTY FILTER", flush=True)
    print(f"Total uploads: {len(all_results)}", flush=True)
    print(f"New product links: {len(new_links)}", flush=True)
    print(f"Catalog crops upgraded to manufacturer photos: {len(replacements)}", flush=True)
    print(f"Report saved to: {REPORT_PATH}", flush=True)
    print("==================================================", flush=True)

if __name__ == '__main__':
    asyncio.run(main())
