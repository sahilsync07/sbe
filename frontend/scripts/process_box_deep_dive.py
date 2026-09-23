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
REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\box_deep_dive_report.json"
QUICK_SHARE_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"

BOX_GROUPS = ['Mini F/w', 'ADDA', 'ADDOXY', 'AIRFAX', 'HITWAY', 'PARIS', 'TEUZ', 
              'VAISHNO PLASTIC', 'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 
              'GOKUL FOOTWEAR', 'NEXGEN FOOTWEAR', 'Kohinoor', 'UAM FOOTWEAR', 'BROCKKIE', 'Barun', 'RELIANCE FOOTWEAR', 'AJANTA']

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
        print(f"Upload failed for {filename}: {e}", flush=True)
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

def ocr_matches_color(ocr_text, prod_colors):
    if not prod_colors:
        return True # No color in product name
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

def check_sbe_qty_pre_ocr(img):
    w, h = img.size
    if h > w * 2.5: return True, "Vertical aspect ratio (Screenshot)"
    return False, ""

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

def build_product_index(stock_data):
    index = []
    for g in stock_data:
        gname = g.get('groupName', '')
        if any(b.lower() == gname.lower() for b in BOX_GROUPS):
            for p in g.get('products', []):
                # Only try to match products that don't have a secondary URL yet (or a working one)
                # We'll allow overriding if it doesn't have one
                if p.get('secondaryImageUrl'):
                    # Skip if already perfectly matched? 
                    pass # We will allow it to match but maybe log it
                
                arts = extract_article_candidates(p['productName'])
                cols = get_product_colors(p['productName'])
                index.append({
                    'product': p,
                    'group': gname,
                    'articles': arts,
                    'colors': cols,
                    'pname_upper': p['productName'].upper()
                })
    return index

async def process_image(z, name, product_index):
    try:
        img_bytes = z.read(name)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception:
        return None

    flagged, reason = check_sbe_qty_pre_ocr(img)
    if flagged: return None

    try:
        res = await winocr.recognize_pil(img, 'en')
        ocr_text = (res.text or "").upper()
    except Exception:
        return None

    if "SBE" in ocr_text and "QTY" in ocr_text: return None

    # Find matches
    matched_candidates = []
    for entry in product_index:
        pname = entry['pname_upper']
        # Must match at least one article candidate
        art_match = False
        for art in entry['articles']:
            # Handle possible variations in OCR (e.g. TZ-123 vs TZ 123)
            art_clean = art.replace('-', '')
            if re.search(r'\b' + re.escape(art) + r'\b', ocr_text) or re.search(r'\b' + re.escape(art_clean) + r'\b', ocr_text):
                art_match = True
                break
        
        if art_match:
            if ocr_matches_color(ocr_text, entry['colors']):
                matched_candidates.append(entry)
                
    # Strict Uniqueness Check
    if len(matched_candidates) == 1:
        entry = matched_candidates[0]
        prod = entry['product']
        return {
            'file': name,
            'img_bytes': img_bytes,
            'matched_prod': prod,
            'group': entry['group']
        }
    elif len(matched_candidates) > 1:
        # Check if they are actually the exact same product name (just duplicate entries in DB)
        first_name = matched_candidates[0]['product']['productName']
        if all(c['product']['productName'] == first_name for c in matched_candidates):
            entry = matched_candidates[0]
            prod = entry['product']
            return {
                'file': name,
                'img_bytes': img_bytes,
                'matched_prod': prod,
                'group': entry['group']
            }
        print(f"Skipping {name}: Matches multiple distinct products: {[c['product']['productName'] for c in matched_candidates]}", flush=True)
    return None

async def main():
    print("Loading stock data...")
    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    product_index = build_product_index(stock_data)
    print(f"Built dynamic index of {len(product_index)} Box Packing products.")

    zip_files = glob.glob(os.path.join(QUICK_SHARE_DIR, '*BOX FOOTWEAR*.zip'))
    if not zip_files:
        print("Could not find BOX FOOTWEAR zip file.")
        return
    zip_path = zip_files[0]
    print("Found zip file.")

    results = []
    
    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total images to process: {len(all_names)}")
        
        batch_size = 50
        for i in range(0, len(all_names), batch_size):
            batch = all_names[i:i+batch_size]
            tasks = [process_image(z, name, product_index) for name in batch]
            res = await asyncio.gather(*tasks)
            
            for r in res:
                if r:
                    matched_prod = r['matched_prod']
                    group = r['group']
                    semantic_file = clean_semantic_name(group, matched_prod['productName'])
                    
                    sec_url = upload_bytes_to_cloudinary(r['img_bytes'], semantic_file, folder_path=f"e-sbe/{group.lower().replace(' ', '_')}")
                    if sec_url:
                        matched_prod['secondaryImageUrl'] = sec_url
                        results.append({
                            "brand": group,
                            "file": semantic_file,
                            "product": matched_prod['productName'],
                            "url": sec_url
                        })
                        print(f"[MATCHED] {r['file']} -> {matched_prod['productName']}")
            
            print(f"Processed {min(i+batch_size, len(all_names))}/{len(all_names)}")

    if results:
        with open(FRONTEND_STOCK, 'w', encoding='utf-8') as f:
            json.dump(stock_data, f, indent=2, ensure_ascii=False)
            
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            json.dump({"total": len(results), "results": results}, f, indent=2)
            
        print(f"\nSUCCESS: Matched and uploaded {len(results)} new images!")
    else:
        print("\nNo new distinct matches found.")

if __name__ == '__main__':
    asyncio.run(main())
