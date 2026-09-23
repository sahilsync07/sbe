import os, sys, json, re, asyncio, io, urllib.request, zipfile, glob
from PIL import Image
import winocr

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
REPO_DIR = r"C:\Projects\sriyasync_github\sbe"
FRONTEND_STOCK = os.path.join(REPO_DIR, r"frontend\public\assets\stock-data.json")
REPORT_PATH = os.path.join(REPO_DIR, r"frontend\scripts\loose_bulletproof_report.json")
QUICK_SHARE_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"

LOOSE_GROUPS = [
    'ASHU', 'PANKAJ PLASTIC', 'TARA', 'J.K Plastic', 'MAGNET', 'MARUTI PLASTICS',
    'AAGAM POLYMER', 'A G ENTERPRISES', 'NAV DURGA ENTERPRISES', 'NEXUS', 'R K TRADERS',
    'SRG ENTERPRISES', 'VARDHMAN PLASTICS', 'YASH FOOTWEAR', 'KRISHNA AGENCY',
    'SHYAM', 'AVTAR V V POLYMERS', 'ATHARV PLASTIC'
]

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

def upload_bytes_to_cloudinary(img_bytes, filename, folder_path="e-sbe/loose"):
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
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})(?:[\s\)]|$)', '', clean)
    clean = re.sub(r'\(\s*\)', '', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', '_', clean).strip('_')
    brand_pfx = brand.upper().replace(' ', '_')
    if not clean.upper().startswith(brand_pfx):
        clean = f"{brand_pfx}_{clean}"
    return clean + ".jpg"

def get_product_colors(pname):
    found = []
    pn = pname.upper()
    for col_key, aliases in COLOR_MAP.items():
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            found.append((col_key, aliases))
    return found

def get_model_core_key(pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', ' ', clean).strip().upper()
    return clean

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

def extract_article_candidates(pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    candidates = re.findall(r'\b([A-Za-z0-9\-]{3,})\b', clean)
    colors_flat = [a for aliases in COLOR_MAP.values() for a in aliases]
    brands_flat = [b.upper() for b in LOOSE_GROUPS]
    final = []
    for c in candidates:
        cu = c.upper()
        if cu in colors_flat or any(b in cu for b in brands_flat): continue
        if re.match(r'^\d{1,2}[\-X\*\/]\d{1,2}$', cu): continue
        if re.search(r'\d', cu): final.append(cu)
    return final

async def process_image_bulletproof(z, name, product_index):
    try:
        img_bytes = z.read(name)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception: return None

    # Pre-OCR Filter
    pre_flag, _ = is_danger_image_pre_ocr(img)
    if pre_flag: return None

    # OCR Recognition
    try:
        res = await winocr.recognize_pil(img, 'en')
        ocr_text = (res.text or "").upper()
    except Exception: return None

    # Post-OCR Filter
    if is_danger_image_post_ocr(ocr_text): return None

    # Candidate Matching
    matched_candidates = []
    for entry in product_index:
        art_match = False
        for art in entry['articles']:
            art_clean = art.replace('-', '')
            if re.search(r'\b' + re.escape(art) + r'\b', ocr_text) or re.search(r'\b' + re.escape(art_clean) + r'\b', ocr_text):
                art_match = True
                break
        if art_match and ocr_matches_color(ocr_text, entry['colors']):
            matched_candidates.append(entry)

    if not matched_candidates: return None

    # Mirror Cluster Verification
    first = matched_candidates[0]
    first_group = first['group']
    first_core = first['core_key']
    first_cols = sorted([c[0] for c in first['colors']])

    for c in matched_candidates:
        c_cols = sorted([col[0] for col in c['colors']])
        if c['group'] != first_group or c['core_key'] != first_core or c_cols != first_cols:
            return None # Cross-brand/model collision

    sizes = [c['size_str'] for c in matched_candidates if c['size_str']]
    if sizes:
        base_size = sizes[0]
        for s in sizes[1:]:
            if not are_sizes_mirror_overlapping(base_size, s):
                return None # Non-mirror tier jump

    return {
        'file': name,
        'img_bytes': img_bytes,
        'matched_products': [c['product'] for c in matched_candidates],
        'group': first_group,
        'primary_pname': first['product']['productName']
    }

async def main():
    print("=" * 65, flush=True)
    print("BULLETPROOF LOOSE ENGINE: ZERO DANGER BARS & STRICT MIRROR SIZES", flush=True)
    print("=" * 65, flush=True)

    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    product_index = []
    for g in stock_data:
        gname = g.get('groupName', '')
        if any(b.lower() == gname.lower() for b in LOOSE_GROUPS):
            for p in g.get('products', []):
                product_index.append({
                    'product': p,
                    'group': gname,
                    'articles': extract_article_candidates(p['productName']),
                    'colors': get_product_colors(p['productName']),
                    'core_key': get_model_core_key(p['productName']),
                    'size_str': extract_size_str(p['productName'])
                })

    print(f"Indexed {len(product_index)} Loose Packing candidates.", flush=True)

    zip_files = glob.glob(os.path.join(QUICK_SHARE_DIR, '*LOOSE FOOTWEAR*.zip'))
    if not zip_files:
        print("ERROR: LOOSE FOOTWEAR zip file not found!", flush=True)
        return

    all_uploads = []
    url_cache = {}

    with zipfile.ZipFile(zip_files[0], 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        total_imgs = len(all_names)
        print(f"Analyzing {total_imgs} images through Bulletproof Filters...", flush=True)

        batch_size = 50
        for i in range(0, total_imgs, batch_size):
            batch = all_names[i:i+batch_size]
            tasks = [process_image_bulletproof(z, name, product_index) for name in batch]
            res = await asyncio.gather(*tasks)

            for r in res:
                if r:
                    primary_pname = r['primary_pname']
                    group = r['group']
                    semantic_file = clean_semantic_name(group, primary_pname)

                    if semantic_file in url_cache:
                        sec_url = url_cache[semantic_file]
                    else:
                        sec_url = upload_bytes_to_cloudinary(r['img_bytes'], semantic_file, folder_path=f"e-sbe/loose/{group.lower().replace(' ', '_')}")
                        if sec_url: url_cache[semantic_file] = sec_url

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

            print(f"Progress: {min(i+batch_size, total_imgs)}/{total_imgs} processed", flush=True)

    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump({"totalVerifiedUploaded": len(all_uploads), "results": all_uploads}, f, indent=2)

    print("\n" + "=" * 65, flush=True)
    print(f"EXECUTION COMPLETE: Successfully attached clean photos to {len(all_uploads)} Loose items!", flush=True)
    print("=" * 65, flush=True)

if __name__ == '__main__':
    asyncio.run(main())
