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

# Step 1: Specifically verify known inverted / corrected pairs
MANUAL_OVERRIDES = {
    # 24523
    ('24523', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151991/e-sbe/cubix/CUBIX_24523_GRN.jpg", # actually black
    ('24523', 'GRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151896/e-sbe/cubix/CUBIX_24523_BLK.jpg", # actually green

    # 24084
    ('24084', 'BLU'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151424/e-sbe/cubix/CUBIX_24084_GRP.jpg", # actually blue
    ('24084', 'GRP'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151362/e-sbe/cubix/CUBIX_24084_BLU.jpg", # actually grape
    ('24084', 'BLK'): None, # No black photo exists

    # 21521
    ('21521', 'GRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151474/e-sbe/cubix/CUBIX_21521_BLK.jpg", # actually green
    ('21521', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790087351/e-sbe/CBX_21521_GRN_MRP318.jpg", # actually pink
    ('21521', 'MRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790087353/e-sbe/CBX_21521_MRN_MRP318.jpg", # actually maroon
    ('21521', 'GLD'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151882/e-sbe/cubix/CUBIX_E_21521_PNK.jpg", # actually gold
    ('21521', 'BLK'): None, # No pure black photo verified

    # 29504
    ('29504', 'BRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151677/e-sbe/cubix/CUBIX_29504_PINK.jpg", # actually brown/coffee
    ('29504', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151495/e-sbe/cubix/CUBIX_29504_COFFE.jpg", # actually pink
    ('29504', 'BLK'): None, # No black photo exists

    # 29507
    ('29507', 'MRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151360/e-sbe/cubix/CUBIX_29507_GRN.jpg", # actually maroon
    ('29507', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151675/e-sbe/cubix/CUBIX_29507_PNK.jpg", # actually pink
    ('29507', 'BLK'): None, # No black photo exists
    ('29507', 'GRN'): None, # No green photo exists

    # 76546
    ('76546', 'BRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151873/e-sbe/cubix/CUBIX_L_76546_GREY.jpg", # actually chikku/brown
    ('76546', 'GRY'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151871/e-sbe/cubix/CUBIX_L_76546_CHIKKU.jpg", # actually grey

    # 30080
    ('30080', 'WHT'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151977/e-sbe/cubix/CUBIX_30080_PNK.jpg", # actually beige/cream
    ('30080', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151704/e-sbe/cubix/CUBIX_M_30080_CREAM.jpg", # actually pink

    # 50528
    ('50528', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790152005/e-sbe/cubix/CUBIX_50528_BRN.jpg", # actually black
    ('50528', 'WHT'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151747/e-sbe/cubix/CUBIX_50528_BLK.jpg", # actually cream/white
    ('50528', 'BRN'): None,

    # 60577
    ('60577', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151706/e-sbe/cubix/CUBIX_60577_CHIKKU.jpg", # actually pink
    ('60577', 'BRN'): None,

    # 60584
    ('60584', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151507/e-sbe/cubix/CUBIX_60584_MRN.jpg", # actually black
    ('60584', 'MRN'): None,

    # 77048
    ('77048', 'BRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151386/e-sbe/cubix/CUBIX_77048_GRN.jpg", # actually tan/brown
    ('77048', 'GRN'): None,

    # 24506
    ('24506', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151377/e-sbe/cubix/CUBIX_E_24506_GRN.jpg", # actually black
    ('24506', 'GRN'): None
}

total_fixes = []
for cp in cubix_products:
    pname = cp['pname']
    model = cp['model']
    fam = cp['color_fam']
    sec = cp['sec_url']

    if (model, fam) in MANUAL_OVERRIDES:
        target_url = MANUAL_OVERRIDES[(model, fam)]
        if sec != target_url:
            total_fixes.append({
                'pname': pname,
                'model': model,
                'fam': fam,
                'old_url': sec,
                'new_url': target_url,
                'type': 'MANUAL_SWAP' if target_url else 'MANUAL_DETACH'
            })
    else:
        # Check automatic OCR / Chromatic clash
        if not sec:
            continue
        cdata = ocr_cache.get(sec, {})
        ocr_text = cdata.get('text', '')
        det_col = cdata.get('detected_color', 'UNKNOWN')
        det_conf = cdata.get('color_confidence', 0)
        explicit_single, card_fams, clr_line = parse_card_colors(ocr_text)

        clash = False
        reason = ""
        if fam and explicit_single and explicit_single != fam:
            clash = True
            reason = f"Explicit card color '{explicit_single}' != prod '{fam}'"
        elif fam and card_fams and (fam not in card_fams):
            clash = True
            reason = f"Prod color '{fam}' not in card CLR line '{clr_line}'"
        elif fam and det_conf >= 55:
            if fam == 'BLK' and det_col in ['PNK', 'MRN', 'GRN', 'BLU', 'GRP', 'YLW_GLD']:
                clash = True
                reason = f"Prod BLK vs Shoe {det_col}"
            elif fam == 'GRN' and det_col in ['BLK', 'PNK', 'MRN', 'BLU']:
                clash = True
                reason = f"Prod GRN vs Shoe {det_col}"
            elif fam in ['GLD', 'YLW'] and det_col in ['BLK', 'PNK', 'MRN', 'GRN', 'BLU']:
                clash = True
                reason = f"Prod GLD vs Shoe {det_col}"
            elif fam == 'BLU' and det_col in ['BLK', 'PNK', 'MRN', 'GRN']:
                clash = True
                reason = f"Prod BLU vs Shoe {det_col}"

        if clash:
            total_fixes.append({
                'pname': pname,
                'model': model,
                'fam': fam,
                'old_url': sec,
                'new_url': None,
                'type': f'AUTO_DETACH ({reason})'
            })

print(f"Total Database Modifications to Apply: {len(total_fixes)}")
detach_count = sum(1 for f in total_fixes if f['new_url'] is None)
swap_count = sum(1 for f in total_fixes if f['new_url'] is not None)
print(f"  Swaps / Precision Corrections: {swap_count}")
print(f"  Detaches (Clearing Mismatched Colorways): {detach_count}")

print("\nSample Fixes:")
for f in total_fixes[:35]:
    old_fn = f['old_url'].split('/')[-1] if f['old_url'] else 'None'
    new_fn = f['new_url'].split('/')[-1] if f['new_url'] else 'None (DETACHED)'
    print(f"  [{f['type']}] {f['pname']}: {old_fn} -> {new_fn}")
