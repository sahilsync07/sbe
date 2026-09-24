import os
import sys
import json
import re

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CACHE_FILE = r"c:\Projects\sbe\frontend\scripts\cubix_ocr_cache.json"
STOCK_FILE = r"c:\Projects\sbe\frontend\public\assets\stock-data.json"

COLOR_DEFINITIONS = {
    'BLK': ['BLK', 'BLACK', 'BK', '8K'],
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
    'GRP': ['GRP', 'GRAPE', 'GRAP', 'PURPLE']
}

def extract_product_color_family(pname):
    pn = pname.upper()
    for fam, aliases in COLOR_DEFINITIONS.items():
        for a in aliases:
            if re.search(r'(?:\b|[^A-Z])' + re.escape(a) + r'(?:\b|[^A-Z])', pn):
                return fam, a
    return None, None

def extract_model_num(pname):
    m = re.search(r'(?:CBX|CUBIX)?\s*(?:E\-)?(\d{4,5})\b', pname.upper())
    if m:
        return m.group(1)
    return None

def parse_card_colors(ocr_text):
    ot = ocr_text.upper()
    explicit_single = None
    m_single = re.search(r'COLOU?R\s*[\:\.\-]\s*([A-Z\s]+?)(?:[\r\n]|\d{4,5}|SIZE|MRP)', ot)
    if m_single:
        cand = m_single.group(1).strip()
        for fam, aliases in COLOR_DEFINITIONS.items():
            if any(re.search(r'\b' + re.escape(a) + r'\b', cand) for a in aliases):
                explicit_single = fam
                break

    clr_line = ""
    m_clr = re.search(r'(?:CLR|COLOR|COLOUR)\s*([A-Z0-9\,\s\.\/\-\*\&]+?)(?:SIZE|MRP|\d{2,4}\/\-|\n|\r)', ot)
    if m_clr:
        clr_line = m_clr.group(1).strip()

    available_fams = set()
    for fam, aliases in COLOR_DEFINITIONS.items():
        for a in aliases:
            if re.search(r'(?:\b|[^A-Z])' + re.escape(a) + r'(?:\b|[^A-Z])', clr_line):
                available_fams.add(fam)

    return explicit_single, available_fams, clr_line

with open(CACHE_FILE, 'r', encoding='utf-8') as f:
    ocr_cache = json.load(f)

with open(STOCK_FILE, 'r', encoding='utf-8') as f:
    stock_data = json.load(f)

# Collect all cubix products
cubix_products = []
for g in stock_data:
    gname = g.get('groupName', '')
    if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
        for p in g.get('products', []):
            pname = p.get('productName', '')
            model = extract_model_num(pname)
            fam, tok = extract_product_color_family(pname)
            cubix_products.append({
                'product': p,
                'group': gname,
                'pname': pname,
                'model': model,
                'color_fam': fam,
                'color_tok': tok,
                'sec_url': p.get('secondaryImageUrl'),
                'img_url': p.get('imageUrl')
            })

print(f"Total Cubix products: {len(cubix_products)}")

# Check each product for mismatch
mismatches = []
swaps = []
detaches = []

# Map of (model, color_fam) -> list of URLs that genuinely match that color
# based on OCR and chromatic analysis
model_color_to_urls = {}
for url, cdata in ocr_cache.items():
    ocr_text = cdata.get('text', '')
    det_color = cdata.get('detected_color', 'UNKNOWN')
    det_conf = cdata.get('color_confidence', 0)
    
    # Model on card
    m_nums = re.findall(r'\b\d{5}\b', ocr_text)
    explicit_single, card_fams, clr_line = parse_card_colors(ocr_text)
    
    # Determine the actual color of the shoe in this image
    actual_shoe_color = None
    if explicit_single:
        actual_shoe_color = explicit_single
    elif det_conf >= 45 and det_color in ['BLK', 'PNK', 'MRN', 'GRN', 'BLU', 'GRP', 'BRN', 'WHT_BGE', 'YLW_GLD', 'GRY']:
        # Map detected color to standard family
        if det_color == 'WHT_BGE':
            actual_shoe_color = 'WHT'
        elif det_color == 'YLW_GLD':
            actual_shoe_color = 'GLD'
        else:
            actual_shoe_color = det_color
    elif len(card_fams) == 1:
        actual_shoe_color = list(card_fams)[0]

    for m in set(m_nums):
        if actual_shoe_color:
            model_color_to_urls.setdefault((m, actual_shoe_color), []).append(url)

for cp in cubix_products:
    pname = cp['pname']
    sec = cp['sec_url']
    if not sec:
        continue

    p_model = cp['model']
    p_fam = cp['color_fam']

    cdata = ocr_cache.get(sec, {})
    ocr_text = cdata.get('text', '')
    det_color = cdata.get('detected_color', 'UNKNOWN')
    det_conf = cdata.get('color_confidence', 0)

    explicit_single, card_fams, clr_line = parse_card_colors(ocr_text)

    is_clash = False
    clash_reason = ""

    # Check 1: Explicit card single color differs
    if p_fam and explicit_single and explicit_single != p_fam:
        # e.g. Card says COLOUR: GRAPE and prod is BLK
        is_clash = True
        clash_reason = f"Explicit card color '{explicit_single}' != prod '{p_fam}'"

    # Check 2: Card has CLR list, and prod color is not in CLR list
    elif p_fam and card_fams and (p_fam not in card_fams):
        is_clash = True
        clash_reason = f"Prod color '{p_fam}' not in card CLR line '{clr_line}'"

    # Check 3: Chromatic color detection with high confidence directly contradicts product color
    elif p_fam and det_conf >= 55:
        # Clashing pairs
        # Black shoe cannot be PNK, MRN, GRN, BLU, GRP, GLD
        if p_fam == 'BLK' and det_color in ['PNK', 'MRN', 'GRN', 'BLU', 'GRP', 'YLW_GLD']:
            is_clash = True
            clash_reason = f"Prod is BLK but shoe pixel color is {det_color} ({det_conf}%)"
        # Green shoe cannot be BLK, PNK, MRN, BLU
        elif p_fam == 'GRN' and det_color in ['BLK', 'PNK', 'MRN', 'BLU']:
            is_clash = True
            clash_reason = f"Prod is GRN but shoe pixel color is {det_color} ({det_conf}%)"
        # Pink shoe cannot be BLK, GRN, BLU
        elif p_fam == 'PNK' and det_color in ['BLK', 'GRN', 'BLU']:
            is_clash = True
            clash_reason = f"Prod is PNK but shoe pixel color is {det_color} ({det_conf}%)"
        # Blue shoe cannot be BLK, PNK, MRN, GRN
        elif p_fam == 'BLU' and det_color in ['BLK', 'PNK', 'MRN', 'GRN']:
            is_clash = True
            clash_reason = f"Prod is BLU but shoe pixel color is {det_color} ({det_conf}%)"
        # Gold/Yellow shoe cannot be BLK, PNK, MRN, GRN, BLU
        elif p_fam in ['GLD', 'YLW'] and det_color in ['BLK', 'PNK', 'MRN', 'GRN', 'BLU']:
            is_clash = True
            clash_reason = f"Prod is {p_fam} but shoe pixel color is {det_color} ({det_conf}%)"
        # Brown/Coffee shoe cannot be PNK, GRN, BLU
        elif p_fam == 'BRN' and det_color in ['PNK', 'GRN', 'BLU']:
            is_clash = True
            clash_reason = f"Prod is BRN but shoe pixel color is {det_color} ({det_conf}%)"

    if is_clash:
        # Can we find a replacement URL for this model and p_fam?
        replacement = None
        if p_model and p_fam and (p_model, p_fam) in model_color_to_urls:
            candidates = [u for u in model_color_to_urls[(p_model, p_fam)] if u != sec]
            if candidates:
                replacement = candidates[0]

        mismatches.append({
            'cp': cp,
            'reason': clash_reason,
            'replacement': replacement
        })

print(f"\n==================================================")
print(f"TOTAL IDENTIFIED COLOR MISMATCHES: {len(mismatches)}")
print(f"==================================================")
for m in mismatches:
    cp = m['cp']
    rep = m['replacement']
    rep_str = f"-> SWAP TO: {rep.split('/')[-1]}" if rep else "-> DETACH (No authentic color photo)"
    print(f"  ✗ {cp['pname']}")
    print(f"      Reason: {m['reason']}")
    print(f"      Current: {cp['sec_url'].split('/')[-1]}")
    print(f"      Action:  {rep_str}")
