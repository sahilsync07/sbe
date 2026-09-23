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
REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\box_parallel_size_shared_report.json"
QUICK_SHARE_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"

BOX_GROUPS = [
    'Mini F/w', 'ADDA', 'ADDOXY', 'AIRFAX', 'HITWAY', 'PARIS', 'TEUZ', 
    'VAISHNO PLASTIC', 'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 
    'GOKUL FOOTWEAR', 'NEXGEN FOOTWEAR', 'Kohinoor', 'UAM FOOTWEAR', 'BROCKKIE', 'Barun', 
    'RELIANCE FOOTWEAR', 'AJANTA'
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

def get_product_colors(pname):
    found = []
    pn = pname.upper()
    for col_key, aliases in COLOR_MAP.items():
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            found.append((col_key, aliases))
    return found

def get_model_core_key(pname):
    """Normalize model by stripping size, price, and loose whitespace for cross-size sharing."""
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    clean = re.sub(r'[^A-Za-z0-9]+', ' ', clean).strip().upper()
    return clean

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

def extract_article_candidates(pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    candidates = re.findall(r'\b([A-Za-z0-9\-]{3,})\b', clean)
    colors_flat = [a for aliases in COLOR_MAP.values() for a in aliases]
    brands_flat = [b.upper() for b in BOX_GROUPS]
    
    final = []
    for c in candidates:
        cu = c.upper()
        if cu in colors_flat: continue
        if any(b in cu for b in brands_flat): continue
        if re.search(r'\d', cu): 
            final.append(cu)
    return final

async def process_image_with_size_sharing(z, name, product_index):
    try:
        img_bytes = z.read(name)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception:
        return None

    w, h = img.size
    if h > w * 2.5:
        return None

    try:
        res = await winocr.recognize_pil(img, 'en')
        ocr_text = (res.text or "").upper()
    except Exception:
        return None

    if "SBE" in ocr_text and "QTY" in ocr_text:
        return None

    matched_candidates = []
    for entry in product_index:
        art_match = False
        for art in entry['articles']:
            art_clean = art.replace('-', '')
            if re.search(r'\b' + re.escape(art) + r'\b', ocr_text) or re.search(r'\b' + re.escape(art_clean) + r'\b', ocr_text):
                art_match = True
                break
        
        if art_match:
            if ocr_matches_color(ocr_text, entry['colors']):
                matched_candidates.append(entry)

    if not matched_candidates:
        return None

    # Check if all matched candidates belong to the EXACT same brand and core model/color
    # (i.e. they differ ONLY in size specification like 4x7 vs 5x8, or 2x5 vs 6x9)
    first_group = matched_candidates[0]['group']
    first_core = matched_candidates[0]['core_key']
    first_cols = sorted([c[0] for c in matched_candidates[0]['colors']])

    same_model_size_variants = True
    for c in matched_candidates:
        c_cols = sorted([col[0] for col in c['colors']])
        if c['group'] != first_group or c['core_key'] != first_core or c_cols != first_cols:
            same_model_size_variants = False
            break

    if same_model_size_variants:
        return {
            'file': name,
            'img_bytes': img_bytes,
            'matched_products': [c['product'] for c in matched_candidates],
            'group': first_group,
            'primary_pname': matched_candidates[0]['product']['productName']
        }

    return None

async def main():
    print("Initializing Structural Shared-Size Parallel Engine...", flush=True)
    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    product_index = []
    for g in stock_data:
        gname = g.get('groupName', '')
        if any(b.lower() == gname.lower() for b in BOX_GROUPS):
            for p in g.get('products', []):
                arts = extract_article_candidates(p['productName'])
                cols = get_product_colors(p['productName'])
                core_key = get_model_core_key(p['productName'])
                product_index.append({
                    'product': p,
                    'group': gname,
                    'articles': arts,
                    'colors': cols,
                    'core_key': core_key
                })

    zip_files = glob.glob(os.path.join(QUICK_SHARE_DIR, '*BOX FOOTWEAR*.zip'))
    if not zip_files:
        print("Zip file not found.")
        return
    zip_path = zip_files[0]

    all_uploads = []
    uploaded_urls_cache = {}

    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total images: {len(all_names)}", flush=True)

        batch_size = 50
        for i in range(0, len(all_names), batch_size):
            batch = all_names[i:i+batch_size]
            tasks = [process_image_with_size_sharing(z, name, product_index) for name in batch]
            res = await asyncio.gather(*tasks)

            for r in res:
                if r:
                    primary_pname = r['primary_pname']
                    group = r['group']
                    semantic_file = clean_semantic_name(group, primary_pname)

                    if semantic_file in uploaded_urls_cache:
                        sec_url = uploaded_urls_cache[semantic_file]
                    else:
                        sec_url = upload_bytes_to_cloudinary(r['img_bytes'], semantic_file, folder_path=f"e-sbe/{group.lower().replace(' ', '_')}")
                        if sec_url:
                            uploaded_urls_cache[semantic_file] = sec_url

                    if sec_url:
                        for prod in r['matched_products']:
                            prod['secondaryImageUrl'] = sec_url
                            all_uploads.append({
                                'file': r['file'],
                                'product': prod['productName'],
                                'url': sec_url,
                                'group': group
                            })
                        print(f"[SIZE-SHARED MATCH] {r['file']} -> {len(r['matched_products'])} size variants of '{primary_pname}'", flush=True)

            print(f"Parallel Engine: Processed {min(i+batch_size, len(all_names))}/{len(all_names)}", flush=True)

    with open(FRONTEND_STOCK, 'w', encoding='utf-8') as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump({"totalLinked": len(all_uploads), "results": all_uploads}, f, indent=2)

    print(f"\nFinished Parallel Structural Engine: Successfully linked {len(all_uploads)} size variants!", flush=True)

if __name__ == '__main__':
    asyncio.run(main())
