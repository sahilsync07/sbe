import os
import sys
import json
import re

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE_FILE = os.path.join(os.path.dirname(__file__), "cubix_ocr_cache.json")

TARGET_FILES = [
    os.path.join(REPO_ROOT, "frontend", "public", "assets", "stock-data.json"),
    os.path.join(REPO_ROOT, "sbe-hub", "public", "assets", "stock-data.json"),
    r"C:\Projects\sriyasync_github\sbe\frontend\public\assets\stock-data.json",
    r"C:\Projects\sriyasync_github\sbe\sbe-hub\public\assets\stock-data.json"
]

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

MANUAL_OVERRIDES = {
    # 24523 (Inverted pair)
    ('24523', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151991/e-sbe/cubix/CUBIX_24523_GRN.jpg",
    ('24523', 'GRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151896/e-sbe/cubix/CUBIX_24523_BLK.jpg",

    # 24084 (Crossed pair + Grape card on Black)
    ('24084', 'BLU'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151424/e-sbe/cubix/CUBIX_24084_GRP.jpg",
    ('24084', 'GRP'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151362/e-sbe/cubix/CUBIX_24084_BLU.jpg",
    ('24084', 'BLK'): None,

    # 21521 (Card colorways sorted by genuine shoe pixels)
    ('21521', 'GRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151474/e-sbe/cubix/CUBIX_21521_BLK.jpg",
    ('21521', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790087351/e-sbe/CBX_21521_GRN_MRP318.jpg",
    ('21521', 'MRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790087353/e-sbe/CBX_21521_MRN_MRP318.jpg",
    ('21521', 'GLD'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151882/e-sbe/cubix/CUBIX_E_21521_PNK.jpg",
    ('21521', 'BLK'): None,

    # 29504 (Pink & Coffee swapped, Black detached)
    ('29504', 'BRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151677/e-sbe/cubix/CUBIX_29504_PINK.jpg",
    ('29504', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151495/e-sbe/cubix/CUBIX_29504_COFFE.jpg",
    ('29504', 'BLK'): None,

    # 29507 (MRN & PNK cards isolated, Black & Green detached)
    ('29507', 'MRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151360/e-sbe/cubix/CUBIX_29507_GRN.jpg",
    ('29507', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151675/e-sbe/cubix/CUBIX_29507_PNK.jpg",
    ('29507', 'BLK'): None,
    ('29507', 'GRN'): None,

    # 76546 (Inverted Chikku / Grey pair)
    ('76546', 'BRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151873/e-sbe/cubix/CUBIX_L_76546_GREY.jpg",
    ('76546', 'GRY'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151871/e-sbe/cubix/CUBIX_L_76546_CHIKKU.jpg",

    # 30080 (Inverted Cream / Pink pair)
    ('30080', 'WHT'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151977/e-sbe/cubix/CUBIX_30080_PNK.jpg",
    ('30080', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151704/e-sbe/cubix/CUBIX_M_30080_CREAM.jpg",

    # 50528 (Cream card on Black, Black on Cream)
    ('50528', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790152005/e-sbe/cubix/CUBIX_50528_BRN.jpg",
    ('50528', 'WHT'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151747/e-sbe/cubix/CUBIX_50528_BLK.jpg",
    ('50528', 'BRN'): None,

    # 60577 (Pink card on Chikku)
    ('60577', 'PNK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151706/e-sbe/cubix/CUBIX_60577_CHIKKU.jpg",
    ('60577', 'BRN'): None,

    # 60584 (Black card on Maroon)
    ('60584', 'BLK'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151507/e-sbe/cubix/CUBIX_60584_MRN.jpg",
    ('60584', 'MRN'): None,

    # 77048 (Tan card on Green)
    ('77048', 'BRN'): "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151386/e-sbe/cubix/CUBIX_77048_GRN.jpg",
    ('77048', 'GRN'): None,

    # 24506
    ('24506', 'BLK'): None,
    ('24506', 'GRN'): None
}

def apply_fixes_to_file(file_path, ocr_cache):
    if not os.path.exists(file_path):
        print(f"Skipping non-existent file: {file_path}")
        return 0

    print(f"\n==================================================")
    print(f"Applying Precision Cubix Fixes: {file_path}")
    print(f"==================================================")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changes = []
    
    for g in data:
        gname = g.get('groupName', '')
        if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
            for p in g.get('products', []):
                pname = p.get('productName', '')
                model = extract_model_num(pname)
                fam, tok = extract_product_color_family(pname)
                sec = p.get('secondaryImageUrl')

                new_sec = sec
                change_desc = ""

                # 1. Check manual overrides
                if (model, fam) in MANUAL_OVERRIDES:
                    target_url = MANUAL_OVERRIDES[(model, fam)]
                    if sec != target_url:
                        new_sec = target_url
                        change_desc = f"MANUAL_OVERRIDE ({'SWAP' if target_url else 'DETACH'})"

                # 2. Check automatic OCR / Chromatic clash if not overridden
                elif sec:
                    cdata = ocr_cache.get(sec, {})
                    ocr_text = cdata.get('text', '')
                    det_col = cdata.get('detected_color', 'UNKNOWN')
                    det_conf = cdata.get('color_confidence', 0)
                    explicit_single, card_fams, clr_line = parse_card_colors(ocr_text)

                    clash = False
                    reason = ""
                    if fam and explicit_single and explicit_single != fam:
                        clash = True
                        reason = f"Card color '{explicit_single}' != prod '{fam}'"
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
                        elif fam == 'BRN' and det_col in ['PNK', 'BLU', 'GRN']:
                            clash = True
                            reason = f"Prod BRN vs Shoe {det_col}"

                    if clash:
                        new_sec = None
                        change_desc = f"AUTO_DETACH ({reason})"

                if new_sec != sec:
                    p['secondaryImageUrl'] = new_sec
                    changes.append((pname, sec, new_sec, change_desc))

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Total changes applied to {file_path}: {len(changes)}")
    for prod, old_u, new_u, desc in changes[:20]:
        old_fn = old_u.split('/')[-1] if old_u else 'None'
        new_fn = new_u.split('/')[-1] if new_u else 'None'
        print(f"  ✓ {desc}: {prod} [{old_fn} -> {new_fn}]")
    if len(changes) > 20:
        print(f"  ... and {len(changes) - 20} more modifications.")

    return len(changes)

def main():
    if not os.path.exists(CACHE_FILE):
        print("Error: cubix_ocr_cache.json not found!")
        return

    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        ocr_cache = json.load(f)

    for target in TARGET_FILES:
        apply_fixes_to_file(target, ocr_cache)

if __name__ == '__main__':
    main()
