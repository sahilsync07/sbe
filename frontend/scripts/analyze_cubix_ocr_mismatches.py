import json
import re

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
    """
    Look for:
    1) 'COLOUR: <color>' or 'COLOR: <color>'
    2) 'CLR <colors>'
    """
    ot = ocr_text.upper()
    explicit_single = None
    m_single = re.search(r'COLOU?R\s*[\:\.\-]\s*([A-Z\s]+?)(?:[\r\n]|\d{4,5}|SIZE|MRP)', ot)
    if m_single:
        cand = m_single.group(1).strip()
        for fam, aliases in COLOR_DEFINITIONS.items():
            if any(re.search(r'\b' + re.escape(a) + r'\b', cand) for a in aliases):
                explicit_single = fam
                break

    # Look for CLR line
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

products_audited = []
mismatches = []
model_mismatches = []

for g in stock_data:
    gname = g.get('groupName', '')
    if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
        for p in g.get('products', []):
            pname = p.get('productName', '')
            sec = p.get('secondaryImageUrl')
            if not sec:
                continue
            
            p_model = extract_model_num(pname)
            p_fam, p_token = extract_product_color_family(pname)
            
            ocr_info = ocr_cache.get(sec, {})
            ocr_text = ocr_info.get('text', '')
            
            # Check model on card
            card_model = None
            if p_model and re.search(r'\b' + re.escape(p_model) + r'\b', ocr_text):
                card_model = p_model
            else:
                m_nums = re.findall(r'\b\d{5}\b', ocr_text)
                if m_nums:
                    card_model = m_nums[0]
            
            if p_model and card_model and p_model != card_model:
                model_mismatches.append({
                    'pname': pname,
                    'prod_model': p_model,
                    'card_model': card_model,
                    'url': sec
                })

            explicit_single, card_fams, clr_line = parse_card_colors(ocr_text)
            
            # Color contradiction check
            is_mismatch = False
            reason = ""
            
            if p_fam:
                # 1. Card has explicit single color (e.g. COLOUR: GRAPE) and it differs from product
                if explicit_single and explicit_single != p_fam:
                    is_mismatch = True
                    reason = f"Explicit card color '{explicit_single}' != product color '{p_fam}'"
                # 2. Card has CLR line listing colors, and product's color is NOT IN THE LIST
                elif card_fams and (p_fam not in card_fams):
                    # Exception: BLK vs 8K OCR typo is covered in aliases
                    # Exception: TAN / BRN are in same BRN family
                    # Exception: BISCUIT / WHT in same WHT family
                    is_mismatch = True
                    reason = f"Product color '{p_fam}' not in card CLR line '{clr_line}' (card has {card_fams})"
                
            if is_mismatch:
                mismatches.append({
                    'pname': pname,
                    'prod_fam': p_fam,
                    'prod_token': p_token,
                    'explicit_single': explicit_single,
                    'card_fams': list(card_fams),
                    'clr_line': clr_line,
                    'url': sec,
                    'reason': reason
                })

print(f"Total Cubix products with secondaryImageUrl: {len(products_audited) + len(mismatches)}")
print(f"Model Mismatches: {len(model_mismatches)}")
for m in model_mismatches[:10]:
    print(f"  MODEL MISMATCH: {m['pname']} (prod model {m['prod_model']} vs card model {m['card_model']}) -> {m['url']}")

print(f"\nColor Contradictions / Mismatches: {len(mismatches)}")
for m in mismatches:
    print(f"  COLOR CLASH: {m['pname']}")
    print(f"    Reason: {m['reason']}")
    print(f"    URL:    {m['url']}")
