import os
import sys
import json
import re
import asyncio
import io
import urllib.request
import zipfile
from datetime import datetime
from PIL import Image

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
PROGRESS_JSON = os.path.join(os.path.dirname(__file__), "cubix_loosened_progress.json")
STREAM_LOG = os.path.join(os.path.dirname(__file__), "cubix_loosened_stream.log")

CUBIX_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with NEW CUBIX GALLERY .zip"

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

def extract_mrp(text):
    m = re.search(r'(?:MRP|RS|NET|RATE|MEP|IRP)[\s\.\:\-]*(\d{2,4})', text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r'@\s*(\d{2,4})', text)
    if m:
        return int(m.group(1))
    m = re.search(r'\b(\d{2,4})\s*/-', text)
    if m:
        return int(m.group(1))
    return None

def get_product_colors(pname):
    found = []
    pn = pname.upper()
    for col_key, aliases in COLOR_MAP.items():
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            found.append((col_key, aliases))
    return found

def is_invoice_document(ocr_text):
    t = ocr_text.lower()
    has_sbe = any(kw in t for kw in ['brundabana', 'brundaban', 'rayagada', 'sbe'])
    has_qty = bool(re.search(r'\bqty\b|qty[\:\.]|quantity', t))
    if has_sbe and has_qty:
        return True
    return False

def clean_semantic_name(brand, pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', '', clean)
    clean = re.sub(r'\(\s*\)', '', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', '_', clean).strip('_')
    brand_pfx = brand.upper().replace(' ', '_')
    if not clean.upper().startswith(brand_pfx):
        clean = f"{brand_pfx}_{clean}"
    return clean + ".jpg"

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

async def run_loosened_cubix_engine():
    import winocr

    log_event("==================================================")
    log_event("STARTING CUBIX ENGINE (Loosened ±50 MRP Constraint)")
    log_event(f"Archive: {CUBIX_ZIP}")
    log_event("==================================================")

    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    cubix_candidates = []
    for g in stock_data:
        gname = g.get('groupName', '')
        if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
            for p in g.get('products', []):
                if not p.get('secondaryImageUrl'):
                    pname = p.get('productName', '')
                    nums = re.findall(r'\b\d{4,5}\b', pname)
                    cubix_candidates.append({
                        'product': p,
                        'pname': pname,
                        'group': gname,
                        'nums': nums,
                        'mrp': extract_mrp(pname),
                        'colors': get_product_colors(pname)
                    })

    log_event(f"Unfulfilled Cubix products in scope: {len(cubix_candidates)}")

    state = {
        "status": "running",
        "processedImages": 0,
        "totalImages": 0,
        "totalUploaded": 0,
        "recentlyUploaded": [],
        "lastUpdated": datetime.now().isoformat()
    }
    update_progress_state(state)

    url_cache = {}

    with zipfile.ZipFile(CUBIX_ZIP, 'r') as z:
        names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        state["totalImages"] = len(names)
        log_event(f"Total photos in Cubix archive to evaluate: {len(names)}")

        batch_size = 40
        for i in range(0, len(names), batch_size):
            batch_names = names[i:i+batch_size]

            async def eval_img(name):
                try:
                    img_bytes = z.read(name)
                    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
                    w, h = img.size
                    if w / h < 0.52:
                        return None
                    res = await winocr.recognize_pil(img, 'en')
                    ocr_text = (res.text or "").upper()
                    if is_invoice_document(ocr_text):
                        return None
                    return {
                        'name': name,
                        'img_bytes': img_bytes,
                        'ocr_text': ocr_text,
                        'card_mrp': extract_mrp(ocr_text)
                    }
                except Exception:
                    return None

            results = await asyncio.gather(*(eval_img(n) for n in batch_names))

            batch_uploaded = 0
            for item_data in results:
                if not item_data:
                    continue

                ocr_text = item_data['ocr_text']
                card_mrp = item_data['card_mrp']
                img_bytes = item_data['img_bytes']

                # Match against candidates
                for cand in cubix_candidates:
                    if cand['product'].get('secondaryImageUrl'):
                        continue

                    # Model check
                    if not any(re.search(r'\b' + re.escape(n) + r'\b', ocr_text) for n in cand['nums']):
                        continue

                    # Color check
                    if cand['colors']:
                        col_ok = False
                        for ckey, aliases in cand['colors']:
                            if any(re.search(r'\b' + re.escape(a) + r'\b', ocr_text) for a in aliases):
                                col_ok = True
                                break
                        if not col_ok:
                            continue

                    # MRP check with ±50 tolerance
                    prod_mrp = cand['mrp']
                    if prod_mrp and card_mrp:
                        diff = abs(prod_mrp - card_mrp)
                        if diff > 50:
                            continue
                    else:
                        diff = 0

                    # Matched!
                    prod = cand['product']
                    group = cand['group']
                    pname = cand['pname']

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
                        log_event(f"MATCHED & UPLOADED [Loosened MRP]: [{group}] {pname} (P.MRP={prod_mrp}, Card={card_mrp}, diff={diff}) -> {sec_url}")
                        state["recentlyUploaded"].append({
                            "product": pname,
                            "group": group,
                            "url": sec_url,
                            "file": item_data['name'],
                            "mrp_diff": diff,
                            "time": datetime.now().strftime("%H:%M:%S")
                        })
                        if len(state["recentlyUploaded"]) > 25:
                            state["recentlyUploaded"].pop(0)
                        break

            state["processedImages"] = min(i + batch_size, len(names))
            state["lastUpdated"] = datetime.now().isoformat()
            update_progress_state(state)

            if batch_uploaded > 0:
                with open(FRONTEND_STOCK, 'w', encoding='utf-8') as sf:
                    json.dump(stock_data, sf, indent=2, ensure_ascii=False)
                if os.path.exists(HUB_STOCK):
                    with open(HUB_STOCK, 'w', encoding='utf-8') as sf:
                        json.dump(stock_data, sf, indent=2, ensure_ascii=False)

    # Final save
    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as sf:
        json.dump(stock_data, sf, indent=2, ensure_ascii=False)
    if os.path.exists(HUB_STOCK):
        with open(HUB_STOCK, 'w', encoding='utf-8') as sf:
            json.dump(stock_data, sf, indent=2, ensure_ascii=False)

    state["status"] = "completed"
    state["lastUpdated"] = datetime.now().isoformat()
    update_progress_state(state)

    log_event(f"CUBIX LOOSENED MRP RUN COMPLETE: Attached and uploaded {state['totalUploaded']} items.")

if __name__ == '__main__':
    asyncio.run(run_loosened_cubix_engine())
