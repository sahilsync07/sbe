import os
import sys
import json
import re
import zipfile
import io
import asyncio
from PIL import Image

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CUBIX_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with NEW CUBIX GALLERY .zip"
STOCK_DATA_PATH = r"frontend/public/assets/stock-data.json"

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

def parse_model_tokens(brand, pname):
    clean = re.sub(r'((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)', '', pname, flags=re.IGNORECASE)
    clean = re.sub(r'(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)', ' ', clean)
    clean = re.sub(r'\b' + re.escape(brand) + r'\b', '', clean, flags=re.IGNORECASE)
    tokens = [t.upper() for t in re.split(r'[^A-Za-z0-9]+', clean) if len(t) >= 1]
    filler = {'LDS', 'GENTS', 'KIDS', 'MENS', 'BOYS', 'GIRLS', 'RS', 'MRP', 'CHAPPAL', 'SANDAL', 'SHOES', 'SLIPPER', 'PU', 'EVA', 'AIR', 'NEW', 'F', 'W', '40', '50'}
    color_aliases = {a for aliases in COLOR_MAP.values() for a in aliases}
    meaningful = [t for t in tokens if t not in filler and t not in color_aliases]
    return meaningful

def get_product_colors(pname):
    found = []
    pn = pname.upper()
    for col_key, aliases in COLOR_MAP.items():
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            found.append((col_key, aliases))
    return found

def extract_size_str(pname):
    m = re.search(r'(?:^|[\s\(])(\d{1,2})\s*[\*\-xX\/]\s*(\d{1,2})(?:[\s\)]|$)', pname)
    return f"{m.group(1)}X{m.group(2)}" if m else ""

def is_danger_image_pre_ocr(img):
    w, h = img.size
    ratio = w / h
    if ratio < 0.58:
        return True, f"Aspect ratio too tall/screenshot ({ratio:.2f} < 0.58)"
    im_rgb = img.convert('RGB')
    top_strip = im_rgb.crop((0, 0, w, max(1, int(h * 0.08))))
    bot_strip = im_rgb.crop((0, int(h * 0.92), w, h))
    pt = list(top_strip.getdata())
    pb = list(bot_strip.getdata())
    tb = sum(p[0]+p[1]+p[2] for p in pt) / (len(pt) * 3)
    bb = sum(p[0]+p[1]+p[2] for p in pb) / (len(pb) * 3)
    if tb < 40 and bb < 40:
        return True, f"Letterboxed/black bars (top={tb:.1f}, bot={bb:.1f})"
    return False, "ok"

def is_danger_image_post_ocr(ocr_text):
    t = ocr_text.lower()
    for kw in ['brundabana', 'brundaban', 'enterprises', 'enterprise', 'rayagada', 'rayasada', 'raygada', 'sbe']:
        if re.search(r'\b' + re.escape(kw) + r'\b', t):
            return True, f"Invoice/distributor watermark: '{kw}'"
    if re.search(r'\bqty\b|qty[\:\.\-]|quantity', t):
        return True, "Invoice/ledger text ('QTY')"
    if re.search(r'\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+202', t):
        return True, "Invoice calendar date"
    return False, "ok"

async def audit_cubix_zip():
    import winocr
    
    with open(STOCK_DATA_PATH, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    cubix_items = []
    for g in stock_data:
        gname = g.get('groupName', '')
        if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
            for p in g.get('products', []):
                cubix_items.append({
                    'productName': p.get('productName'),
                    'group': gname,
                    'tokens': parse_model_tokens(gname, p.get('productName')),
                    'colors': get_product_colors(p.get('productName')),
                    'size': extract_size_str(p.get('productName')),
                    'has_sec': bool(p.get('secondaryImageUrl')),
                    'sec_url': p.get('secondaryImageUrl')
                })

    print(f"Total Cubix products in DB: {len(cubix_items)}")
    missing = [c for c in cubix_items if not c['has_sec']]
    print(f"Cubix products missing secondary image: {len(missing)}")

    # We build a fast token lookup map: token -> list of products
    token_to_prods = {}
    for item in cubix_items:
        for t in item['tokens']:
            token_to_prods.setdefault(t, []).append(item)

    rejections = {
        'aspect_ratio': 0,
        'black_bars': 0,
        'post_ocr_danger': 0,
        'no_token_match': 0,
        'already_has_image': 0,
        'near_misses': []
    }

    print("\nAuditing images in WhatsApp Chat with NEW CUBIX GALLERY .zip...")
    with zipfile.ZipFile(CUBIX_ZIP, 'r') as z:
        names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total images in zip: {len(names)}")
        
        # Sample or run across names
        # Let's inspect first 500 images to get accurate statistical breakdown
        sample_names = names[:600]
        
        for idx, name in enumerate(sample_names):
            try:
                img_bytes = z.read(name)
                img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            except Exception:
                continue

            # 1. Pre-OCR Check
            pre_flag, pre_reason = is_danger_image_pre_ocr(img)
            if pre_flag:
                if 'aspect' in pre_reason:
                    rejections['aspect_ratio'] += 1
                else:
                    rejections['black_bars'] += 1
                continue

            # 2. OCR
            try:
                res = await winocr.recognize_pil(img, 'en')
                ocr_text = (res.text or "").upper()
            except Exception:
                continue

            if not ocr_text.strip():
                rejections['no_token_match'] += 1
                continue

            # 3. Post-OCR Danger Check
            post_flag, post_reason = is_danger_image_post_ocr(ocr_text)
            if post_flag:
                rejections['post_ocr_danger'] += 1
                continue

            # 4. Check Token Matches
            matched_prods = []
            for t, prods in token_to_prods.items():
                if len(t) >= 2 and (re.search(r'\b' + re.escape(t) + r'\b', ocr_text) or re.search(r'\b' + re.escape(t.replace('-', '')) + r'\b', ocr_text)):
                    for p in prods:
                        if p not in matched_prods:
                            matched_prods.append(p)

            if not matched_prods:
                rejections['no_token_match'] += 1
                continue

            # Model matched! Check why it didn't attach or if it was a near miss
            for prod in matched_prods:
                pname = prod['productName']
                
                # Check colors
                p_colors = prod['colors']
                color_matched = False
                if not p_colors:
                    color_matched = True
                else:
                    for col_key, aliases in p_colors:
                        if any(re.search(r'\b' + re.escape(a) + r'\b', ocr_text) for a in aliases):
                            color_matched = True
                            break

                # Check if it was already filled
                if prod['has_sec']:
                    rejections['already_has_image'] += 1
                    continue

                if not color_matched:
                    rejections['near_misses'].append({
                        'file': name,
                        'product': pname,
                        'reason': f"Color mismatch: Product expects {[c[0] for c in p_colors]}, but OCR card did not contain matching color keyword",
                        'ocr_snippet': ocr_text[:120].replace('\n', ' ')
                    })
                else:
                    # Color matched, check size or MRP
                    rejections['near_misses'].append({
                        'file': name,
                        'product': pname,
                        'reason': f"Strict single-variant / size ambiguity constraint",
                        'ocr_snippet': ocr_text[:120].replace('\n', ' ')
                    })

    print(f"\n--- AUDIT SUMMARY (Sample 600 images) ---")
    print(f"Rejected by Aspect Ratio (<0.58): {rejections['aspect_ratio']}")
    print(f"Rejected by Letterbox / Black Bars: {rejections['black_bars']}")
    print(f"Rejected by Invoice/Date/Watermark: {rejections['post_ocr_danger']}")
    print(f"No Model Token Match: {rejections['no_token_match']}")
    print(f"Model Matched but Product Already Had Image: {rejections['already_has_image']}")
    print(f"Near Misses (Model matched unfulfilled product): {len(rejections['near_misses'])}")
    
    print("\n--- SAMPLE NEAR MISSES & REJECTION REASONS ---")
    seen_prods = set()
    for nm in rejections['near_misses']:
        if nm['product'] not in seen_prods and len(seen_prods) < 15:
            seen_prods.add(nm['product'])
            print(f"Product: {nm['product']}")
            print(f"  File: {nm['file']}")
            print(f"  Reason: {nm['reason']}")
            print(f"  OCR Snippet: {nm['ocr_snippet']}\n")

if __name__ == '__main__':
    asyncio.run(audit_cubix_zip())
