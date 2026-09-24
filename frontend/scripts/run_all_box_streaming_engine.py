import os
import sys
import json
import re
import asyncio
import io
import urllib.request
import zipfile
import glob
from datetime import datetime
from PIL import Image
import winocr

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
FRONTEND_STOCK = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
PROGRESS_JSON = r"C:\Projects\sbe\frontend\scripts\box_live_progress.json"
STREAM_LOG = r"C:\Projects\sbe\frontend\scripts\box_live_stream.log"
QUICK_SHARE_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"

MIRROR_SIZE_CLASSES = [
    {'4X7', '4X8', '5X8'},
    {'6X9', '6X10', '7X10'},
    {'11X13', '1X3'},
    {'15X18', '16X20'}
]

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

def are_sizes_mirror_overlapping(size_a, size_b):
    if not size_a or not size_b: return False
    sa = size_a.upper().replace('*', 'X').strip()
    sb = size_b.upper().replace('*', 'X').strip()
    if sa == sb: return True
    for cluster in MIRROR_SIZE_CLASSES:
        if sa in cluster and sb in cluster: return True
    return False

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
    color_aliases = {a for aliases in COLOR_MAP.values() for a in aliases}
    meaningful = [t for t in tokens if t not in filler and t not in color_aliases]
    return meaningful

def ocr_matches_color(ocr_text, prod_colors):
    if not prod_colors: return True
    ot = ocr_text.upper()
    single_clr_m = re.search(r'\bclr\s+([A-Za-z]+)\b', ot)
    if single_clr_m:
        card_col = single_clr_m.group(1).upper()
        for col_key, aliases in prod_colors:
            if any(a == card_col for a in aliases): return True
        return False
    for col_key, aliases in prod_colors:
        if any(re.search(r'\b' + re.escape(a) + r'\b', ot) for a in aliases): return True
    return False

def is_danger_image_pre_ocr(img):
    w, h = img.size
    ratio = w / h
    if ratio < 0.58:
        return True, f"status_aspect_ratio({ratio:.2f})"
    im_rgb = img.convert('RGB')
    top_strip = im_rgb.crop((0, 0, w, max(1, int(h * 0.08))))
    bot_strip = im_rgb.crop((0, int(h * 0.92), w, h))
    pt = list(top_strip.getdata())
    pb = list(bot_strip.getdata())
    tb = sum(p[0]+p[1]+p[2] for p in pt) / (len(pt) * 3)
    bb = sum(p[0]+p[1]+p[2] for p in pb) / (len(pb) * 3)
    if tb < 40 and bb < 40:
        return True, f"black_bars(top={tb:.1f},bot={bb:.1f})"
    return False, "ok"

def is_danger_image_post_ocr(ocr_text):
    t = ocr_text.lower()
    for kw in ['brundabana', 'brundaban', 'enterprises', 'enterprise', 'rayagada', 'rayasada', 'raygada', 'sbe']:
        if re.search(r'\b' + re.escape(kw) + r'\b', t): return True
    if re.search(r'\bqty\b|qty[\:\.\-]|quantity', t): return True
    if re.search(r'\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+202', t): return True
    return False

def upload_bytes_to_cloudinary(img_bytes, filename, folder_path="e-sbe/box"):
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
            return json.loads(resp.read()).get("secure_url")
    except Exception as e:
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

def log_event(message):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {message}\n"
    with open(STREAM_LOG, "a", encoding="utf-8") as f:
        f.write(line)

def update_progress_state(state):
    with open(PROGRESS_JSON, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

async def evaluate_image(z, name, product_index):
    try:
        img_bytes = z.read(name)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception:
        return None

    pre_flag, _ = is_danger_image_pre_ocr(img)
    if pre_flag:
        return None

    try:
        res = await winocr.recognize_pil(img, 'en')
        ocr_text = (res.text or "").upper()
    except Exception:
        return None

    if is_danger_image_post_ocr(ocr_text):
        return None

    matched_candidates = []
    for entry in product_index:
        tokens = entry['model_tokens']
        if not tokens: continue
        token_match = True
        for tok in tokens:
            tok_clean = tok.replace('-', '')
            if not (re.search(r'\b' + re.escape(tok) + r'\b', ocr_text) or re.search(r'\b' + re.escape(tok_clean) + r'\b', ocr_text)):
                token_match = False
                break
        if token_match and ocr_matches_color(ocr_text, entry['colors']):
            matched_candidates.append(entry)

    if not matched_candidates:
        return None

    first = matched_candidates[0]
    first_group = first['group']
    first_core = first['core_key']
    first_cols = sorted([c[0] for c in first['colors']])

    for c in matched_candidates:
        c_cols = sorted([col[0] for col in c['colors']])
        if c['group'] != first_group or c['core_key'] != first_core or c_cols != first_cols:
            return None

    sizes = [c['size_str'] for c in matched_candidates if c['size_str']]
    if sizes:
        base_size = sizes[0]
        for s in sizes[1:]:
            if not are_sizes_mirror_overlapping(base_size, s):
                return None

    return {
        'file': name,
        'img_bytes': img_bytes,
        'matched_products': [c['product'] for c in matched_candidates],
        'group': first_group,
        'primary_pname': first['product']['productName']
    }

async def process_archive(zip_path, target_brand_filter, product_index, stock_data, state, url_cache):
    archive_name = os.path.basename(zip_path)
    log_event(f"Opening archive: {archive_name} for brand filter: {target_brand_filter}")

    filtered_index = [
        p for p in product_index 
        if any(b.upper() in p['group'].upper() for b in target_brand_filter)
    ]
    log_event(f"Candidates in scope for {archive_name}: {len(filtered_index)}")

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        total_imgs = len(all_names)
        state["currentArchive"] = archive_name
        state["currentArchiveTotal"] = total_imgs
        state["currentArchiveProcessed"] = 0
        update_progress_state(state)

        batch_size = 35
        for i in range(0, total_imgs, batch_size):
            batch = all_names[i:i+batch_size]
            tasks = [evaluate_image(z, name, filtered_index) for name in batch]
            res = await asyncio.gather(*tasks)

            batch_uploaded = 0
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
                                state["totalUploaded"] += 1
                                batch_uploaded += 1
                                log_event(f"UPLOADED: {prod['productName']} ({group}) -> {sec_url}")
                                state["recentlyUploaded"].append({
                                    "product": prod['productName'],
                                    "group": group,
                                    "url": sec_url,
                                    "time": datetime.now().strftime("%H:%M:%S")
                                })
                                if len(state["recentlyUploaded"]) > 20:
                                    state["recentlyUploaded"].pop(0)

            if batch_uploaded > 0:
                with open(FRONTEND_STOCK, 'w', encoding='utf-8') as f:
                    json.dump(stock_data, f, indent=2, ensure_ascii=False)

            state["currentArchiveProcessed"] = min(i + batch_size, total_imgs)
            state["lastUpdated"] = datetime.now().isoformat()
            update_progress_state(state)

async def main():
    log_event("Starting Full Multi-Archive Box Engine...")

    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    product_index = []
    for g in stock_data:
        gname = g.get('groupName', '')
        for p in g.get('products', []):
            product_index.append({
                'product': p,
                'group': gname,
                'model_tokens': parse_model_tokens(gname, p['productName']),
                'colors': get_product_colors(p['productName']),
                'core_key': get_model_core_key(p['productName']),
                'size_str': extract_size_str(p['productName'])
            })

    state = {
        "status": "running",
        "currentArchive": "Initializing",
        "currentArchiveProcessed": 0,
        "currentArchiveTotal": 0,
        "totalUploaded": 0,
        "recentlyUploaded": [],
        "lastUpdated": datetime.now().isoformat()
    }
    update_progress_state(state)

    url_cache = {}

    # Define all Box archives and target brand groups
    archives_plan = [
        (os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with Action Synergy.zip"), ["ACTION"]),
        (os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with FLOREX GALLERY.zip"), ["FLOREX", "SWASTIK"]),
        (os.path.join(QUICK_SHARE_DIR, "WhatsApp Chat with NEW CUBIX GALLERY .zip"), ["CUBIX"]),
    ]

    for zip_path, brands in archives_plan:
        if os.path.exists(zip_path):
            await process_archive(zip_path, brands, product_index, stock_data, state, url_cache)

    state["status"] = "completed"
    state["lastUpdated"] = datetime.now().isoformat()
    update_progress_state(state)

    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    log_event(f"FULL BOX RUN COMPLETE: Uploaded {state['totalUploaded']} items across all archives.")

if __name__ == '__main__':
    asyncio.run(main())
