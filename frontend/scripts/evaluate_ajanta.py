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

AJANTA_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with Ajanta.zip"
FRONTEND_STOCK = r"frontend/public/assets/stock-data.json"

COLOR_MAP = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN', 'CAMEL', 'TAN', 'CARAMEL', 'CHIKKU', 'CHIKU', 'LT.BRN', 'L.BRN', 'LT BRN', 'BRONZE', 'KHAKI'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE', 'BURGUNDI', 'BURGUNDY'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'F.GRN', 'MEHANDI', 'MHD', 'S.GRN', 'S GRN', 'B.GRN', 'B GRN'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'N.BLU', 'N BLU', 'SKY', 'D.SKY', 'P.BLU', 'R_BLUE', 'AIRFORCE', 'TURQUOISE', 'TURKISH', 'SKBLU', 'AQUA', 'CYAN', 'DP.CYAN', 'DP.C.BLU', 'DP.S.BLU', 'DP.S BLU', 'B.BLU'],
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
        if any(re.search(r'\b' + re.escape(a) + r'\b', pn) for a in aliases):
            found.append((col_key, aliases))
    return found

def normalize_model_str(name):
    # Strip brand, MRP, sizes
    p = name.upper()
    p = re.sub(r'\b(AJ|AJANTA|SHOES|PU|GENTS|LADIES|LDS|KIDS|MENS)\b', ' ', p)
    p = re.sub(r'\(.*?\)', ' ', p)
    p = re.sub(r'(?:MRP|RS|NET|RATE)[\s\.\:]*\d+(?:\.\d+)?/?-?', ' ', p)
    p = re.sub(r'\b\d{1,2}\s*[xX*]\s*\d{1,2}\b', ' ', p)
    # remove colors
    for aliases in COLOR_MAP.values():
        for a in aliases:
            p = re.sub(r'\b' + re.escape(a) + r'\b', ' ', p)
    return p.strip()

async def evaluate_ajanta_all():
    import winocr

    stock_data = json.load(open(FRONTEND_STOCK, 'r', encoding='utf-8'))
    ajanta_prods = []
    for g in stock_data:
        if g.get('groupName') == 'AJANTA':
            for p in g.get('products', []):
                pname = p.get('productName')
                ajanta_prods.append({
                    'product': p,
                    'pname': pname,
                    'colors': get_product_colors(pname),
                    'mrp': extract_mrp(pname),
                    'size': extract_size(pname),
                    'norm_model': normalize_model_str(pname),
                    'has_sec': bool(p.get('secondaryImageUrl'))
                })

    print(f"Total Ajanta products: {len(ajanta_prods)}")
    missing = [p for p in ajanta_prods if not p['has_sec']]
    print(f"Missing secondaryImageUrl: {len(missing)}")

    with zipfile.ZipFile(AJANTA_ZIP, 'r') as z:
        names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total photos in zip: {len(names)}")

        matches = {} # prod_pname -> list of candidate photos

        for idx, name in enumerate(names):
            try:
                b = z.read(name)
                img = Image.open(io.BytesIO(b)).convert('RGB')
                w, h = img.size
                if w / h < 0.50:
                    continue
                res = await winocr.recognize_pil(img, 'en')
                ocr = (res.text or '').upper()
            except Exception as e:
                continue

            card_mrp = extract_mrp(ocr)
            card_size = extract_size(ocr)

            # Test match against all missing products
            for p in missing:
                pname = p['pname']
                norm_m = p['norm_model']

                # 1. Model match: Check key identifiers in OCR
                # e.g. "CG 36", "CG 37", "8469/41", "LINA 03", "CPL 87", "DIVA 108", "TOTO SOFT/34"
                model_matched = False

                # Handle slash models like "8469/41", "8438/4", "9305/2", "TOTO SOFT/34"
                slash_nums = re.findall(r'\b\d{4,5}/\d{1,2}\b', pname)
                if slash_nums:
                    for sn in slash_nums:
                        sn_clean = sn.replace('/', ' ')
                        if sn in ocr or sn_clean in ocr or sn.replace('/', '') in ocr:
                            model_matched = True
                            break
                elif norm_m:
                    tokens = [t for t in re.split(r'[\s\/\-_]+', norm_m) if len(t) >= 2]
                    if tokens:
                        if all(re.search(r'\b' + re.escape(t) + r'\b', ocr) or t in ocr for t in tokens):
                            model_matched = True
                        elif len(tokens) >= 2 and re.search(r'\b' + re.escape(' '.join(tokens)) + r'\b', ocr):
                            model_matched = True

                if not model_matched:
                    continue

                # 2. Color match:
                col_ok = False
                if not p['colors']:
                    col_ok = True
                else:
                    for ckey, aliases in p['colors']:
                        if any(re.search(r'\b' + re.escape(a) + r'\b', ocr) or a in ocr for a in aliases):
                            col_ok = True
                            break

                # 3. MRP match with ±50 tolerance
                mrp_ok = False
                if p['mrp'] and card_mrp:
                    if abs(p['mrp'] - card_mrp) <= 50:
                        mrp_ok = True
                else:
                    mrp_ok = True # no MRP to conflict

                if model_matched and (col_ok or not p['colors']) and mrp_ok:
                    matches.setdefault(pname, []).append({
                        'file': name,
                        'card_mrp': card_mrp,
                        'card_size': card_size,
                        'ocr_snippet': ocr[:90].replace('\n', ' ')
                    })

    print(f"\nUnique Ajanta products matched: {len(matches)} / {len(missing)}")
    for pname, cand_list in matches.items():
        print(f"\nPROD: {pname} -> {len(cand_list)} photo candidates:")
        for c in cand_list[:3]:
            print(f"   {c['file']} (Card MRP={c['card_mrp']}, Size={c['card_size']}) | OCR: {c['ocr_snippet']}")

if __name__ == '__main__':
    asyncio.run(evaluate_ajanta_all())
