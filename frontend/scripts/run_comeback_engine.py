import os
import sys
import json
import re
import asyncio
import io
import urllib.request
import glob
from datetime import datetime
from PIL import Image
import numpy as np

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FRONTEND_STOCK = os.path.join(REPO_ROOT, "frontend", "public", "assets", "stock-data.json")
HUB_STOCK = os.path.join(REPO_ROOT, "sbe-hub", "public", "assets", "stock-data.json")
PROGRESS_JSON = os.path.join(os.path.dirname(__file__), "comeback_progress.json")
STREAM_LOG = os.path.join(os.path.dirname(__file__), "comeback_stream.log")

COMEBACK_DIR = r"C:\Projects\Footwear Samples Comeback"
CHAT_EXPORT_DIR = os.path.join(COMEBACK_DIR, "ChatExport_2026-09-21")
PHOTOS_INDEX_PATH = os.path.join(COMEBACK_DIR, "photos_index_full.json")
PHOTOS_DIR = os.path.join(CHAT_EXPORT_DIR, "photos")

MIRROR_SIZE_CLASSES = [
    {'4X7', '4X8', '5X8'},
    {'5X9', '5X10', '6X9', '6X10', '7X10', '7X11'},
    {'11X13', '1X3', '1X4', '1X5'},
    {'15X18', '16X20'}
]

COLOR_MAP = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN', 'CAMEL', 'TAN', 'CARAMEL', 'CHIKKU', 'CHIKU', 'CHIKOO', 'COFFE', 'COFFEE'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE', 'BURGUNDY'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'F.GRN', 'MEHANDI', 'MHD'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'SKY', 'R_BLUE', 'AIRFORCE', 'TURQUOISE', 'SKBLU'],
    'GRY': ['GRY', 'GREY', 'GRAY', 'SLATE'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM', 'BEG', 'BGE', 'BEIGE', 'PEANUT', 'PNUT', 'BISCUIT', 'BSCT', 'BUSCUIT'],
    'YLW': ['YLW', 'YELLOW', 'MUSTARD', 'LEMON'],
    'RED': ['RED', 'CHILI', 'TOMATO'],
    'SLV': ['SLV', 'SILVER', 'SILVR'],
    'GLD': ['GLD', 'GOLD', 'COPPER', 'CPR'],
    'PCH': ['PCH', 'PEACH'],
    'GRP': ['GRP', 'GRAPE', 'GRAP', 'PURPLE'],
    'LAVENDER': ['LAVENDER', 'LAV']
}

def log_event(message):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {message}\n"
    print(line.strip())
    with open(STREAM_LOG, "a", encoding="utf-8") as f:
        f.write(line)

def update_progress_state(state):
    with open(PROGRESS_JSON, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def are_sizes_compatible(size_a, size_b):
    if not size_a or not size_b:
        return True
    sa = size_a.upper().replace('*', 'X').strip()
    sb = size_b.upper().replace('*', 'X').strip()
    if sa == sb:
        return True
    for cluster in MIRROR_SIZE_CLASSES:
        if sa in cluster and sb in cluster:
            return True
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

def parse_model_tokens(brand, pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    clean = re.sub(r'\b' + re.escape(brand) + r'\b', '', clean, flags=re.IGNORECASE)
    tokens = [t.upper() for t in re.split(r'[^A-Za-z0-9]+', clean) if len(t) >= 1]
    filler = {'LDS', 'GENTS', 'KIDS', 'MENS', 'BOYS', 'GIRLS', 'RS', 'MRP', 'CHAPPAL', 'SANDAL', 'SHOES', 'SLIPPER', 'PU', 'EVA', 'AIR', 'NEW', 'F', 'W', '40', '50'}
    color_aliases = {a for aliases in COLOR_MAP.values() for a in aliases}
    meaningful = [t for t in tokens if t not in filler and t not in color_aliases]
    return meaningful

def is_danger_image_pre_ocr(img):
    w, h = img.size
    ratio = w / h
    if ratio < 0.52:
        return True, f"status_aspect_ratio({ratio:.2f})"
    return False, "ok"

def is_danger_image_post_ocr(ocr_text):
    t = ocr_text.lower()
    for kw in ['brundabana', 'brundaban', 'enterprises', 'enterprise', 'rayagada', 'rayasada', 'raygada', 'sbe']:
        if re.search(r'\b' + re.escape(kw) + r'\b', t):
            return True
    if re.search(r'\bqty\b|qty[\:\.\-]|quantity', t):
        return True
    return False

def upload_bytes_to_cloudinary(img_bytes, filename, folder_path="e-sbe/box/cubix"):
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
        log_event(f"Upload error for {filename}: {e}")
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

async def run_comeback_engine():
    log_event("==================================================")
    log_event("STARTING FOOTWEAR SAMPLES COMEBACK STREAMING ENGINE")
    log_event(f"Directory: {COMEBACK_DIR}")
    log_event("==================================================")

    # 1. Load stock data
    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    # Build index of unfulfilled products (prioritize CUBIX, CUBIX 2, and other relevant brands)
    product_index = []
    for g in stock_data:
        gname = g.get('groupName', '')
        for p in g.get('products', []):
            if not p.get('secondaryImageUrl'):
                tokens = parse_model_tokens(gname, p['productName'])
                nums = re.findall(r'\b\d{4,5}\b', p['productName'])
                product_index.append({
                    'product': p,
                    'group': gname,
                    'pname': p['productName'],
                    'tokens': tokens,
                    'model_nums': nums,
                    'colors': get_product_colors(p['productName']),
                    'size': extract_size_str(p['productName'])
                })

    log_event(f"Target catalog unfulfilled candidates: {len(product_index)}")

    state = {
        "status": "running",
        "phase": "pre-indexed",
        "processedPhotos": 0,
        "totalPhotos": 0,
        "totalUploaded": 0,
        "recentlyUploaded": [],
        "lastUpdated": datetime.now().isoformat()
    }
    update_progress_state(state)

    url_cache = {}

    # 2. Phase 1: Process photos_index_full.json (2,878 indexed photos)
    if os.path.exists(PHOTOS_INDEX_PATH):
        with open(PHOTOS_INDEX_PATH, 'r', encoding='utf-8') as f:
            photos_idx = json.load(f)

        state["totalPhotos"] = len(photos_idx)
        log_event(f"Phase 1: Evaluating {len(photos_idx)} pre-indexed photos...")

        batch_uploaded = 0

        for key, pdata in photos_idx.items():
            state["processedPhotos"] += 1
            ocr_text = (pdata.get('ocr') or '').upper()
            if not ocr_text.strip():
                continue

            if is_danger_image_post_ocr(ocr_text):
                continue

            rel_full = pdata.get('full', '')
            full_path = os.path.join(CHAT_EXPORT_DIR, rel_full)
            if not os.path.exists(full_path):
                continue

            # Match candidate products
            matched_candidates = []
            for entry in product_index:
                if entry['product'].get('secondaryImageUrl'):
                    continue

                # Check model tokens or numbers
                matched_model = False
                for num in entry['model_nums']:
                    if re.search(r'\b' + re.escape(num) + r'\b', ocr_text):
                        matched_model = True
                        break

                if not matched_model:
                    for tok in entry['tokens']:
                        if len(tok) >= 3 and re.search(r'\b' + re.escape(tok) + r'\b', ocr_text):
                            matched_model = True
                            break

                if not matched_model:
                    continue

                # Check color matching
                p_colors = entry['colors']
                color_matched = False
                if not p_colors:
                    color_matched = True
                else:
                    for col_key, aliases in p_colors:
                        if any(re.search(r'\b' + re.escape(a) + r'\b', ocr_text) for a in aliases):
                            color_matched = True
                            break

                if not color_matched:
                    continue

                matched_candidates.append(entry)

            if not matched_candidates:
                continue

            # Read image and perform pre-OCR check
            try:
                with open(full_path, 'rb') as img_f:
                    img_bytes = img_f.read()
                img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            except Exception:
                continue

            danger_pre, _ = is_danger_image_pre_ocr(img)
            if danger_pre:
                continue

            # Assign to the best candidate
            target_entry = matched_candidates[0]
            prod = target_entry['product']
            group = target_entry['group']
            pname = target_entry['pname']

            semantic_file = clean_semantic_name(group, pname)

            if semantic_file in url_cache:
                sec_url = url_cache[semantic_file]
            else:
                folder = f"e-sbe/box/{group.lower().replace(' ', '_')}"
                sec_url = upload_bytes_to_cloudinary(img_bytes, semantic_file, folder_path=folder)
                if sec_url:
                    url_cache[semantic_file] = sec_url

            if sec_url:
                prod['secondaryImageUrl'] = sec_url
                state["totalUploaded"] += 1
                batch_uploaded += 1
                log_event(f"MATCHED & UPLOADED: [{group}] {pname} -> {sec_url}")
                state["recentlyUploaded"].append({
                    "product": pname,
                    "group": group,
                    "url": sec_url,
                    "file": os.path.basename(full_path),
                    "time": datetime.now().strftime("%H:%M:%S")
                })
                if len(state["recentlyUploaded"]) > 25:
                    state["recentlyUploaded"].pop(0)

                # Save incrementally every 5 uploads
                if batch_uploaded % 5 == 0:
                    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as sf:
                        json.dump(stock_data, sf, indent=2, ensure_ascii=False)
                    if os.path.exists(HUB_STOCK):
                        with open(HUB_STOCK, 'w', encoding='utf-8') as sf:
                            json.dump(stock_data, sf, indent=2, ensure_ascii=False)

            if state["processedPhotos"] % 100 == 0:
                state["lastUpdated"] = datetime.now().isoformat()
                update_progress_state(state)

    # Final save
    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as sf:
        json.dump(stock_data, sf, indent=2, ensure_ascii=False)
    if os.path.exists(HUB_STOCK):
        with open(HUB_STOCK, 'w', encoding='utf-8') as sf:
            json.dump(stock_data, sf, indent=2, ensure_ascii=False)

    state["status"] = "completed"
    state["lastUpdated"] = datetime.now().isoformat()
    update_progress_state(state)

    log_event(f"COMEBACK ENGINE RUN FINISHED: Attached and uploaded {state['totalUploaded']} items.")

if __name__ == '__main__':
    asyncio.run(run_comeback_engine())
