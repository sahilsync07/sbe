import os
import sys
import json
import re
import asyncio
import io
import urllib.request
import zipfile
import glob
from PIL import Image
import winocr

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
FRONTEND_STOCK = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\box_multiagent_report.json"
QUICK_SHARE_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"

BOX_GROUPS = [
    'Mini F/w', 'ADDA', 'ADDOXY', 'AIRFAX', 'HITWAY', 'PARIS', 'TEUZ', 
    'VAISHNO PLASTIC', 'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 
    'GOKUL FOOTWEAR', 'NEXGEN FOOTWEAR', 'Kohinoor', 'UAM FOOTWEAR', 'BROCKKIE', 'Barun', 
    'RELIANCE FOOTWEAR', 'AJANTA'
]

MIRROR_SIZE_CLASSES = [
    {'4X7', '4X8', '5X8'},
    {'6X9', '6X10', '7X10'},
    {'11X13', '1X3'},
    {'15X18', '16X20'}
]

def are_sizes_mirror_overlapping(size_a, size_b):
    if not size_a or not size_b:
        return False
    sa = size_a.upper().replace('*', 'X').strip()
    sb = size_b.upper().replace('*', 'X').strip()
    if sa == sb:
        return True
    for cluster in MIRROR_SIZE_CLASSES:
        if sa in cluster and sb in cluster:
            return True
    return False

COLOR_MAP = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN', 'CAMEL', 'TAN', 'CARAMEL', 'CHIKKU', 'CHIKU'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE', 'BURGUNDY'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'MEHANDI', 'MHD'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'SKY', 'R_BLUE', 'AIRFORCE', 'TURQUOISE'],
    'GRY': ['GRY', 'GREY', 'GRAY', 'SLATE'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM', 'BEG', 'BGE', 'BEIGE', 'PEANUT', 'PNUT'],
    'YLW': ['YLW', 'YELLOW', 'MUSTARD', 'LEMON'],
    'RED': ['RED', 'CHILI', 'TOMATO'],
    'SLV': ['SLV', 'SILVER'],
    'GLD': ['GLD', 'GOLD'],
    'PCH': ['PCH', 'PEACH']
}

def extract_size_str(pname):
    m = re.search(r'(?:^|[\s\(])(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})(?:[\s\)]|$)', pname)
    return f"{m.group(1)}X{m.group(2)}" if m else ""

def get_product_colors(pname):
    found = []
    pn = pname.upper()
    for col_key, aliases in COLOR_MAP.items():
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            found.append((col_key, aliases))
    return found

def get_model_core_key(pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', ' ', clean).strip().upper()
    return clean

def parse_model_tokens(brand, pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    clean = re.sub(r'\b' + re.escape(brand) + r'\b', '', clean, flags=re.IGNORECASE)
    tokens = [t.upper() for t in re.split(r'[^A-Za-z0-9]+', clean) if len(t) >= 1]
    filler = {'LDS', 'GENTS', 'KIDS', 'MENS', 'BOYS', 'GIRLS', 'RS', 'MRP', 'CHAPPAL', 'SANDAL', 'SHOES', 'SLIPPER', 'PU', 'EVA', 'AIR', 'NEW', 'F', 'W', '40', '50'}
    # Also filter out recognized color aliases so colors aren't treated as model tokens
    color_aliases = {a for aliases in COLOR_MAP.values() for a in aliases}
    meaningful = [t for t in tokens if t not in filler and t not in color_aliases]
    return meaningful

def ocr_matches_color(ocr_text, prod_colors):
    if not prod_colors:
        return True
    ot = ocr_text.upper()
    single_clr_m = re.search(r'\bclr\s+([A-Za-z]+)\b', ot)
    if single_clr_m:
        card_col = single_clr_m.group(1).upper()
        for col_key, aliases in prod_colors:
            if any(a == card_col for a in aliases):
                return True
        return False
    for col_key, aliases in prod_colors:
        if any(re.search(r'\b' + re.escape(a) + r'\b', ot) for a in aliases):
            return True
    return False

def is_danger_image_pre_ocr(img):
    w, h = img.size
    ratio = w / h
    # Filter 1: Phone vertical status screenshot ratio
    if ratio < 0.58:
        return True, f"status_aspect_ratio({ratio:.2f})"

    im_rgb = img.convert('RGB')
    top_strip = im_rgb.crop((0, 0, w, max(1, int(h * 0.08))))
    bot_strip = im_rgb.crop((0, int(h * 0.92), w, h))
    pt = list(top_strip.getdata())
    pb = list(bot_strip.getdata())
    tb = sum(p[0]+p[1]+p[2] for p in pt) / (len(pt) * 3)
    bb = sum(p[0]+p[1]+p[2] for p in pb) / (len(pb) * 3)
    # Filter 2: Solid black top & bottom banner bars
    if tb < 40 and bb < 40:
        return True, f"black_bars(top={tb:.1f},bot={bb:.1f})"
    return False, "ok"

def is_danger_image_post_ocr(ocr_text):
    t = ocr_text.lower()
    # Filter 3: SBE / Dealer Watermarks
    for kw in ['brundabana', 'brundaban', 'enterprises', 'enterprise', 'rayagada', 'rayasada', 'raygada', 'sbe']:
        if re.search(r'\b' + re.escape(kw) + r'\b', t):
            return True, f"sbe_keyword_{kw}"
    # Filter 4: Qty indicator badges
    if re.search(r'\bqty\b|qty[\:\.\-]|quantity', t):
        return True, "qty_indicator"
    # Filter 5: WhatsApp promotional status date stamps
    if re.search(r'\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+202', t):
        return True, "status_date_header"
    return False, "ok"

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
    try:
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read())
            return res_data.get("secure_url")
    except Exception as e:
        print(f"Upload error: {e}", flush=True)
        return None

def clean_semantic_name(brand, pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', '', clean)
    clean = re.sub(r'\(\s*\)', '', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', '_', clean).strip('_')
    brand_pfx = brand.upper().replace(' ', '_')
    if not clean.upper().startswith(brand_pfx):
        clean = f"{brand_pfx}_{clean}"
    return clean + ".jpg"

async def evaluate_image(z, name, product_index):
    try:
        img_bytes = z.read(name)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception:
        return None

    # Pre-OCR Danger Filter
    pre_flag, _ = is_danger_image_pre_ocr(img)
    if pre_flag:
        return None

    # WinOCR Recognition
    try:
        res = await winocr.recognize_pil(img, 'en')
        ocr_text = (res.text or "").upper()
    except Exception:
        return None

    # Post-OCR Danger Filter
    post_flag, _ = is_danger_image_post_ocr(ocr_text)
    if post_flag:
        return None

    matched_candidates = []
    for entry in product_index:
        tokens = entry['model_tokens']
        if not tokens:
            continue

        # All primary model tokens (e.g. ['AMBITION', '1']) must be present in OCR text
        token_match = True
        for tok in tokens:
            # Check with and without hyphen or punctuation
            tok_clean = tok.replace('-', '')
            if not (re.search(r'\b' + re.escape(tok) + r'\b', ocr_text) or re.search(r'\b' + re.escape(tok_clean) + r'\b', ocr_text)):
                token_match = False
                break

        if token_match:
            if ocr_matches_color(ocr_text, entry['colors']):
                matched_candidates.append(entry)

    if not matched_candidates:
        return None

    # Verify that all candidates belong to the EXACT same brand, core model, and color
    first = matched_candidates[0]
    first_group = first['group']
    first_core = first['core_key']
    first_cols = sorted([c[0] for c in first['colors']])

    for c in matched_candidates:
        c_cols = sorted([col[0] for col in c['colors']])
        if c['group'] != first_group or c['core_key'] != first_core or c_cols != first_cols:
            return None # Rejection: cross-model or cross-color collision

    # Strict Mirror Size Overlap check
    sizes = [c['size_str'] for c in matched_candidates if c['size_str']]
    if sizes:
        base_size = sizes[0]
        for s in sizes[1:]:
            if not are_sizes_mirror_overlapping(base_size, s):
                return None # Rejection: non-mirror tier jump

    return {
        'file': name,
        'img_bytes': img_bytes,
        'matched_products': [c['product'] for c in matched_candidates],
        'group': first_group,
        'primary_pname': first['product']['productName']
    }

async def main():
    print("=" * 70, flush=True)
    print("PARALLEL MULTI-AGENT BOX PACKING ENGINE: FULL COVERAGE & ZERO DANGER", flush=True)
    print("=" * 70, flush=True)

    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    product_index = []
    for g in stock_data:
        gname = g.get('groupName', '')
        if any(b.lower() == gname.lower() for b in BOX_GROUPS):
            for p in g.get('products', []):
                product_index.append({
                    'product': p,
                    'group': gname,
                    'model_tokens': parse_model_tokens(gname, p['productName']),
                    'colors': get_product_colors(p['productName']),
                    'core_key': get_model_core_key(p['productName']),
                    'size_str': extract_size_str(p['productName'])
                })

    print(f"Indexed {len(product_index)} Box Packing candidates across {len(BOX_GROUPS)} brands.", flush=True)

    zip_files = glob.glob(os.path.join(QUICK_SHARE_DIR, '*BOX FOOTWEAR*.zip'))
    if not zip_files:
        print("ERROR: BOX FOOTWEAR zip file not found!", flush=True)
        return
    zip_path = zip_files[0]

    all_uploads = []
    url_cache = {}

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        total_imgs = len(all_names)
        print(f"Parallel Swarm Dispatch: Analyzing {total_imgs} images...", flush=True)

        batch_size = 50
        for i in range(0, total_imgs, batch_size):
            batch = all_names[i:i+batch_size]
            tasks = [evaluate_image(z, name, product_index) for name in batch]
            res = await asyncio.gather(*tasks)

            for r in res:
                if r:
                    primary_pname = r['primary_pname']
                    group = r['group']
                    semantic_file = clean_semantic_name(group, primary_pname)

                    if semantic_file in url_cache:
                        sec_url = url_cache[semantic_file]
                    else:
                        sec_url = upload_bytes_to_cloudinary(r['img_bytes'], semantic_file, folder_path=f"e-sbe/box/{group.lower().replace(' ', '_')}")
                        if sec_url:
                            url_cache[semantic_file] = sec_url

                    if sec_url:
                        for prod in r['matched_products']:
                            if not prod.get('secondaryImageUrl'):
                                prod['secondaryImageUrl'] = sec_url
                                all_uploads.append({
                                    'file': r['file'],
                                    'product': prod['productName'],
                                    'url': sec_url,
                                    'group': group
                                })
                                print(f" [CLEAN MATCH] {r['file']} -> {prod['productName']}", flush=True)

            print(f"Swarm Progress: {min(i+batch_size, total_imgs)}/{total_imgs} images processed", flush=True)

    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump({
            "totalNewlyLinked": len(all_uploads),
            "results": all_uploads
        }, f, indent=2)

    print("\n" + "=" * 70, flush=True)
    print(f"MULTI-AGENT ENGINE COMPLETE: Attached verified photos to {len(all_uploads)} items!", flush=True)
    print("=" * 70, flush=True)

if __name__ == '__main__':
    asyncio.run(main())
