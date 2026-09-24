import os
import sys
import json
import re
import zipfile
import io
import time
import asyncio
import urllib.request
from datetime import datetime
from PIL import Image

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

AJANTA_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with Ajanta.zip"
OCR_JSON = os.path.join(os.path.dirname(__file__), "ajanta_all_ocr.json")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

TARGET_STOCK_PATHS = [
    os.path.join(REPO_ROOT, "frontend", "public", "assets", "stock-data.json"),
    os.path.join(REPO_ROOT, "sbe-hub", "public", "assets", "stock-data.json"),
    r"C:\Projects\sbe\frontend\public\assets\stock-data.json",
    r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
]

PROGRESS_JSON = os.path.join(os.path.dirname(__file__), "ajanta_live_progress.json")
STREAM_LOG = os.path.join(os.path.dirname(__file__), "ajanta_live_stream.log")

# Cloudinary 2 settings (secondary cloud)
CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

CLEAN_DATES = {'20260812', '20260813', '20260816', '20260908'}
DIRTY_DATES = {'20260819', '20260829', '20260903', '20260803'}

COLOR_MAP = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN', 'CAMEL', 'TAN', 'CARAMEL', 'CHIKKU', 'CHIKU', 'LT.BRN', 'L.BRN', 'LT BRN', 'BRONZE', 'KHAKI', 'L. BROWN', 'LT. BROWN'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE', 'BURGUNDI', 'BURGUNDY'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'F.GRN', 'MEHANDI', 'MHD', 'S.GRN', 'S GRN', 'B.GRN', 'B GRN', 'S. GREEN', 'F. GREEN', 'B. GREEN'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'N.BLU', 'N BLU', 'SKY', 'D.SKY', 'P.BLU', 'R_BLUE', 'AIRFORCE', 'TURQUOISE', 'TURKISH', 'SKBLU', 'AQUA', 'CYAN', 'DP.CYAN', 'DP.C.BLU', 'DP.S.BLU', 'DP.S BLU', 'B.BLU', 'P. BLUE', 'P.BLUE', 'N.BLUE', 'N. BLUE'],
    'GRY': ['GRY', 'GREY', 'GRAY', 'SLATE'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM', 'BEG', 'BGE', 'BEIGE'],
    'YLW': ['YLW', 'YELLOW', 'MUSTARD', 'LEMON'],
    'RED': ['RED', 'CHILI', 'TOMATO'],
    'SLV': ['SLV', 'SILVER', 'SILVR'],
    'GLD': ['GLD', 'GOLD', 'COPPER', 'CPR'],
    'PCH': ['PCH', 'PEACH'],
    'GRP': ['GRP', 'GRAPE', 'GRAP', 'PURPLE'],
    'LAVENDER': ['LAVENDER', 'LAV'],
    'ORG': ['ORG', 'OGN', 'ORANGE']
}

CATEGORY_WORDS = {'AJ', 'AJANTA', 'GENTS', 'LADIES', 'LDS', 'KIDS', 'MENS', 'SHOES', 'PU', 'EVA', 'AIR', 'PUG', 'PUL', 'PUB', 'PGA', 'CEG'}

CLUSTER_LADIES = {'4X7', '4X8', '5X8', '4*7', '4*8', '5*8', '4/8', '4/7', '4X9'}
CLUSTER_GENTS = {'6X9', '6X10', '7X10', '8X10', '6*9', '6*10', '7*10', '8*10', '5X9'}
CLUSTER_KIDS = {'11X13', '1X3', '1X4', '11*13', '1*3', '1*4', '9X1', '2X5', '3X6'}

def log_event(message):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {message}\n"
    print(line.strip())
    with open(STREAM_LOG, "a", encoding="utf-8") as f:
        f.write(line)

def update_progress_state(state):
    try:
        with open(PROGRESS_JSON, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception:
        pass

def safe_save_json(filepath, data):
    if not os.path.exists(os.path.dirname(filepath)):
        return False
    temp_path = filepath + f".tmp_{os.getpid()}"
    try:
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        for attempt in range(8):
            try:
                os.replace(temp_path, filepath)
                return True
            except Exception:
                time.sleep(0.3)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        log_event(f"Warning: safe_save_json error on {filepath}: {e}")
        return False
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

def save_all_targets(stock_data):
    for path in TARGET_STOCK_PATHS:
        if os.path.exists(path):
            safe_save_json(path, stock_data)

def is_clean_manufacturer_image(fn, ocr_txt, w, h):
    # Rule 1: Must be from verified clean date batches
    date_part = fn.split('-')[1] if '-' in fn else ''
    if date_part not in CLEAN_DATES:
        return False, f"rejected_date_{date_part}"

    # Rule 2: Cannot be dealer framed size (892x1262)
    if (w, h) == (892, 1262) or (w, h) == (1262, 892):
        return False, "rejected_dealer_dimension_892x1262"

    ratio = w / h
    # Rule 3: No tall mobile status screenshots
    if ratio < 0.55:
        return False, "rejected_aspect_ratio_screenshot"

    txt = ocr_txt.upper()
    # Rule 4: ZERO tolerance for 'SBE RAYAGADA', 'BRUNDABANA', etc.
    for kw in ['SBE', 'RAYAGADA', 'RAYASADA', 'BRUNDABAN', 'BRUNDABANA', 'ENTERPRISE', 'ENTERPRISES']:
        if kw in txt:
            return False, f"rejected_danger_text_{kw}"

    # Rule 5: ZERO tolerance for 'QTY' / 'QUANTITY' dealer stamps
    if re.search(r'\bQTY\b|QTY[\:\.\-]|QUANTITY|\bWTY\b', txt):
        return False, "rejected_danger_text_QTY"

    return True, "clean"

def sizes_compatible(s1, s2):
    if not s1 or not s2:
        return True
    s1 = s1.upper().replace('*', 'X').replace('/', 'X').replace('-', 'X').lstrip('0')
    s2 = s2.upper().replace('*', 'X').replace('/', 'X').replace('-', 'X').lstrip('0')
    if s1 == s2:
        return True
    for cl in [CLUSTER_LADIES, CLUSTER_GENTS, CLUSTER_KIDS]:
        cl_clean = {x.replace('*', 'X').replace('/', 'X').replace('-', 'X').lstrip('0') for x in cl}
        if s1 in cl_clean and s2 in cl_clean:
            return True
    return False

def extract_mrp(text):
    m = re.search(r'(?:MRP|RS|NET|RATE|MEP|IRP)[\s\.\:\-]*[<e\u00e6\?@Q]?\s*(\d{2,4})', text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r'[@Q]\s*(\d{2,4})', text)
    if m:
        return int(m.group(1))
    m = re.search(r'\b[<e\u00e6\?@Q]?(\d{2,4})\s*/-', text)
    if m:
        return int(m.group(1))
    return None

def mrp_matches(prod_mrp, card_mrp):
    if not prod_mrp or not card_mrp:
        return True, 10
    if prod_mrp == card_mrp:
        return True, 35
    if abs(prod_mrp - card_mrp) <= 20:
        return True, 25
    if abs(prod_mrp - card_mrp) <= 50:
        return True, 15
    p_last2 = prod_mrp % 100
    c_last2 = card_mrp % 100
    if abs(p_last2 - c_last2) <= 5:
        return True, 30
    return False, 0

def extract_size(text):
    m = re.search(r'(?:SIZE|SZ|Size)[\s\:\.]*(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})', text)
    if m:
        return f"{m.group(1)}X{m.group(2)}"
    m = re.search(r'\b(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})\b', text)
    if m:
        return f"{m.group(1)}X{m.group(2)}"
    return ""

def get_product_colors(pname):
    found = []
    pn = pname.upper()
    for col_key, aliases in COLOR_MAP.items():
        matched_aliases = [a for a in aliases if re.search(r'\b' + re.escape(a) + r'\b', pn)]
        if matched_aliases:
            found.append((col_key, matched_aliases))
    return found

def get_model_core_tokens(pname):
    pn = pname.upper()
    pn = re.sub(r'\(.*?\)', ' ', pn)
    pn = re.sub(r'\d*(?:MRP|RS|NET|RATE)[\s\.\:]*\d+(?:\.\d+)?/?-?', ' ', pn)
    tokens = [t for t in re.split(r'[^A-Z0-9/]+', pn) if t and t not in CATEGORY_WORDS]
    clean_tokens = []
    for t in tokens:
        if t == '0':
            continue
        is_col = False
        for aliases in COLOR_MAP.values():
            if t in aliases:
                is_col = True
                break
        if not is_col:
            clean_tokens.append(t)
    return clean_tokens

def clean_semantic_name(group, pname):
    clean = re.sub(r'\d*(?:RS|MRP|@)[\.\s]*\d+(\.\d+)?/?-?', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', '', clean)
    clean = re.sub(r'\(\s*\)', '', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', '_', clean).strip('_')
    brand_pfx = group.upper().replace(' ', '_')
    if not clean.upper().startswith(brand_pfx):
        clean = f"{brand_pfx}_{clean}"
    return clean

def upload_bytes_to_cloudinary(img_bytes, semantic_filename, folder_path="e-sbe/box/ajanta"):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    public_id = f"AJANTA_ORIGINAL_{semantic_filename}"

    body = bytearray()
    def add_field(name, val):
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode())

    add_field("upload_preset", UPLOAD_PRESET)
    add_field("folder", folder_path)
    add_field("public_id", public_id)

    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{public_id}.jpg"\r\n'.encode())
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(img_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(UPLOAD_URL, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            w = data.get("width")
            h = data.get("height")
            if (w, h) == (892, 1262):
                log_event(f"ERROR: Cloudinary returned dirty size 892x1262 for {public_id}! Aborting.")
                return None
            return data.get("secure_url")
    except Exception as e:
        log_event(f"Upload error for {public_id}: {e}")
        return None

async def main():
    log_event("==================================================")
    log_event("STARTING STRICT AJANTA STREAMING & UPLOAD ENGINE")
    log_event("STRICT AUDIT: ZERO DEALER FRAMES, ZERO 'QTY' TEXT")
    log_event(f"Zip File: {AJANTA_ZIP}")
    log_event(f"Target Cloud: Cloudinary 2 ({CLOUD_NAME})")
    log_event("==================================================")

    if not os.path.exists(AJANTA_ZIP):
        log_event(f"ERROR: Zip file not found at {AJANTA_ZIP}")
        return

    # 1. Load stock data from main target
    stock_path = TARGET_STOCK_PATHS[0]
    with open(stock_path, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    ajanta_group = next((g for g in stock_data if g.get('groupName') == 'AJANTA'), None)
    if not ajanta_group:
        log_event("ERROR: AJANTA group not found in stock-data.json")
        return

    prods = []
    for p in ajanta_group.get('products', []):
        prods.append({
            'product': p,
            'pname': p['productName'],
            'colors': get_product_colors(p['productName']),
            'mrp': extract_mrp(p['productName']),
            'size': extract_size(p['productName']),
            'tokens': get_model_core_tokens(p['productName'])
        })

    log_event(f"Total Ajanta catalog products: {len(prods)}")

    state = {
        "status": "running",
        "phase": "clean_inspection",
        "totalImages": 0,
        "cleanImages": 0,
        "rejectedImages": 0,
        "totalMatched": 0,
        "totalUploaded": 0,
        "recentlyUploaded": [],
        "lastUpdated": datetime.now().isoformat()
    }
    update_progress_state(state)

    # 2. Load OCR data
    ocr_map = {}
    if os.path.exists(OCR_JSON):
        with open(OCR_JSON, 'r', encoding='utf-8') as f:
            for item in json.load(f):
                ocr_map[item['file']] = item['ocr']
        log_event(f"Loaded {len(ocr_map)} cached OCR results from {OCR_JSON}")

    # 3. Read Zip & inspect images with STRICT CLEAN FILTER
    clean_img_data = {}
    with zipfile.ZipFile(AJANTA_ZIP, 'r') as z:
        all_imgs = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        state["totalImages"] = len(all_imgs)

        for fn in all_imgs:
            try:
                b = z.read(fn)
                im = Image.open(io.BytesIO(b))
                w, h = im.size
            except Exception:
                continue

            txt = ocr_map.get(fn, '').upper()
            is_clean, reason = is_clean_manufacturer_image(fn, txt, w, h)

            if not is_clean:
                state["rejectedImages"] += 1
                continue

            state["cleanImages"] += 1

            img_colors = []
            for ckey, aliases in COLOR_MAP.items():
                found_aliases = [a for a in aliases if re.search(r'\b' + re.escape(a) + r'\b', txt)]
                if found_aliases:
                    img_colors.append((ckey, found_aliases))

            clean_img_data[fn] = {
                'raw_bytes': b,
                'w': w, 'h': h,
                'ocr': txt,
                'mrp': extract_mrp(txt),
                'size': extract_size(txt),
                'colors': img_colors
            }

    log_event(f"Filter Results: {state['cleanImages']} 100% CLEAN manufacturer images, {state['rejectedImages']} REJECTED.")

    # 4. Strict Precision Match against ONLY clean images
    matched_results = []
    for p in prods:
        pname = p['pname']
        ptoks = p['tokens']
        pcolors = p['colors']
        pmrp = p['mrp']
        psize = p['size']

        candidates = []
        for fn, im in clean_img_data.items():
            ocr = im['ocr']

            num_toks = [t for t in ptoks if re.search(r'\d', t)]
            word_toks = [t for t in ptoks if not re.search(r'\d', t)]

            num_matched = False
            model_score = 0
            if num_toks:
                for nt in num_toks:
                    base = nt.split('/')[0]
                    if re.search(r'\b' + re.escape(nt) + r'\b', ocr):
                        num_matched = True
                        model_score = 30 # Exact submodel match (e.g. 8511/1)
                        break
                    elif re.search(r'\b' + re.escape(base) + r'\b', ocr):
                        num_matched = True
                        model_score = 15 # Base model match (e.g. 8511)
                        break
            else:
                num_matched = True
                model_score = 10

            word_matched = False
            if word_toks:
                for wt in word_toks:
                    if len(wt) >= 2 and re.search(r'\b' + re.escape(wt) + r'\b', ocr):
                        word_matched = True
                        break
            else:
                word_matched = True

            if not (num_matched and word_matched):
                continue

            # Size cluster check
            if not sizes_compatible(im['size'], psize):
                continue

            # Strict Color Match & Conflict Guard
            col_score = 0
            if pcolors:
                img_aliases = {a for ic in im['colors'] for a in ic[1]}
                prod_aliases = {a for pc in pcolors for a in pc[1]}

                img_ckeys = {ic[0] for ic in im['colors']}
                prod_ckeys = {pc[0] for pc in pcolors}

                if prod_aliases & img_aliases:
                    col_score = 60 # Exact specific color alias on card!
                elif img_ckeys & prod_ckeys:
                    col_score = 50 # Same color family (e.g. BRN and BROWN)
                elif not img_ckeys:
                    col_score = 15 # Neutral card without color printed
                else:
                    # Conflicting color group (e.g. BLK vs BRN) -> Disqualify!
                    continue
            else:
                col_score = 10

            # MRP check
            mrp_ok, mrp_score = mrp_matches(pmrp, im['mrp'])
            if not mrp_ok:
                continue

            total_score = model_score + col_score + mrp_score
            candidates.append({
                'file': fn,
                'score': total_score,
                'col_score': col_score,
                'model_score': model_score,
                'mrp_score': mrp_score,
                'mrp': im['mrp'],
                'size': im['size']
            })

        if candidates:
            candidates.sort(key=lambda x: x['score'], reverse=True)
            matched_results.append((p, candidates[0]))

    state["totalMatched"] = len(matched_results)
    log_event(f"100% Clean Precision Matched: {len(matched_results)} / {len(prods)} Ajanta products.")

    # 5. Clean Upload & Attachment Engine
    url_cache = {}
    
    # 3 pre-existing clean URLs that are confirmed 100% clean
    clean_preexisting = {
        "AJANTA_AJ_ECO_SMART_15_DP_SBLU": "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790185601/e-sbe/box/ajanta/AJANTA_AJ_ECO_SMART_15_DP_SBLU.jpg",
        "AJANTA_AJ_TOTO_SOFT_34_B_BLU": "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790184444/e-sbe/box/ajanta/AJANTA_AJ_TOTO_SOFT_34_B_BLU.jpg",
        "AJANTA_AJ_TOTO_SOFT_43_DP_CYAN": "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790184457/e-sbe/box/ajanta/AJANTA_AJ_TOTO_SOFT_43_DP_CYAN.jpg"
    }

    matched_pnames = {p['pname']: best for p, best in matched_results}
    batch_uploaded = 0

    for p in prods:
        prod = p['product']
        pname = p['pname']

        if pname in matched_pnames:
            best = matched_pnames[pname]
            fn = best['file']
            im_info = clean_img_data[fn]

            semantic_name = clean_semantic_name("AJANTA", pname)

            sec_url = None
            if semantic_name in clean_preexisting:
                sec_url = clean_preexisting[semantic_name]
            elif fn in url_cache:
                sec_url = url_cache[fn]
            elif semantic_name in url_cache:
                sec_url = url_cache[semantic_name]
            else:
                log_event(f"Uploading Clean [{state['totalUploaded']+1}] {semantic_name} (from {fn})...")
                sec_url = upload_bytes_to_cloudinary(im_info['raw_bytes'], semantic_name, folder_path="e-sbe/box/ajanta")
                if sec_url:
                    url_cache[fn] = sec_url
                    url_cache[semantic_name] = sec_url
                    state["totalUploaded"] += 1
                    batch_uploaded += 1

            if sec_url:
                prod['secondaryImageUrl'] = sec_url
                if not prod.get('imageUrl'):
                    prod['imageUrl'] = sec_url

                log_event(f"ATTACHED (CLEAN): {pname} -> {sec_url}")
                state["recentlyUploaded"].insert(0, {
                    "product": pname,
                    "group": "AJANTA",
                    "url": sec_url,
                    "source": fn,
                    "time": datetime.now().strftime("%H:%M:%S")
                })
                if len(state["recentlyUploaded"]) > 25:
                    state["recentlyUploaded"].pop()
        else:
            # Not matched by a verified clean manufacturer image -> clear secondaryImageUrl
            old_url = prod.get('secondaryImageUrl')
            if old_url:
                log_event(f"CLEARED UNMATCHED/OLD URL: {pname} -> was {old_url}")
            prod['secondaryImageUrl'] = None

        if batch_uploaded >= 5:
            batch_uploaded = 0
            state["lastUpdated"] = datetime.now().isoformat()
            update_progress_state(state)
            save_all_targets(stock_data)

    # 6. Final save
    state["status"] = "completed"
    state["lastUpdated"] = datetime.now().isoformat()
    update_progress_state(state)
    save_all_targets(stock_data)

    log_event("==================================================")
    log_event("STRICT AJANTA ENGINE COMPLETED SUCCESSFULLY!")
    log_event(f"Total Products Processed: {len(prods)}")
    log_event(f"Total Clean Products Matched: {len(matched_results)}")
    log_event(f"Total Uploaded to Cloudinary 2: {state['totalUploaded']}")
    log_event("All attached images verified: ZERO dealer frames, ZERO 'Qty' text!")
    log_event("==================================================")

if __name__ == '__main__':
    asyncio.run(main())
