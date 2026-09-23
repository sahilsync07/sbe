import os
import sys
import json
import re

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
FRONTEND_STOCK = os.path.join(REPO_ROOT, "frontend", "public", "assets", "stock-data.json")
HUB_STOCK = os.path.join(REPO_ROOT, "sbe-hub", "public", "assets", "stock-data.json")
REPORT_PATH = os.path.join(SCRIPT_DIR, "cleansing_report.json")

BRAND_MAP = {
    'PARAGON': ['PARAGON', 'SOLEA', 'PARALITE', 'VERTEX', 'BLOT', 'PTOES', 'P-TOES', 'MERIVA', 'ESCOUTE', 'MAX', 'TUFFBOOT', 'WALKAHOLIC', 'STIMULUS', 'SCHOOL'],
    'EEKEN': ['EEKEN'],
    'ACTION': ['ACTION'],
    'AJANTA': ['AJANTA'],
    'CUBIX': ['CUBIX', 'CBX'],
    'FLOREX': ['FLOREX', 'SWASTIK'],
    'RELIANCE': ['RELIANCE'],
    'AAGAM': ['AAGAM'],
    'ADDA': ['ADDA'],
    'AIRSON': ['AIRSON'],
    'MARUTI': ['MARUTI'],
    'MAGNET': ['MAGNET'],
    'PARIS': ['PARIS'],
    'ORTHO': ['ORTHO'],
    'BROCKKIE': ['BROCKKIE'],
    'HAWAI': ['HAWAI']
}

PSEUDO_MODEL_TOKENS = [
    'RATE', 'VIEW', 'DISCOUNT', 'SINCE', 'ESTD', 'AUG-', 'JAN-', 'FEB-', 'MAR-', 'APR-', 'MAY-', 'JUN-', 'JUL-', 'SEP-', 'OCT-', 'NOV-', 'DEC-'
]

def get_brand(name):
    u = (name or '').upper()
    for brand, tokens in BRAND_MAP.items():
        if any(t in u for t in tokens):
            return brand
    return None

def strip_product_meta(pname):
    p = pname or ''
    # Remove sizes e.g. (6x10), (04/08), 2*5, 6*9, (5X8)
    p = re.sub(r'\(.*?\)', ' ', p)
    p = re.sub(r'(?<!\d)\d{1,2}\s*[\*\-xX\/]\s*\d{1,2}(?!\d)', ' ', p)
    # Remove prices e.g. MRP 399/-, RS.100/-, @499, 399/-
    p = re.sub(r'(?:MRP|RS|NET|RATE)[\s\.\:]*\d+(?:\.\d+)?/?-?', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'@\s*\d+(?:\.\d+)?/?-?', ' ', p, flags=re.IGNORECASE)
    p = re.sub(r'\b\d{2,4}/-(?!\d)', ' ', p)
    return p.strip()

def evaluate_image_link(group_name, product_name, sec_url):
    if not sec_url:
        return True, "NO_IMAGE"

    fname = sec_url.split('/')[-1]
    stem = fname.rsplit('.', 1)[0]
    parts = stem.split('_')

    g_brand = get_brand(group_name) or get_brand(product_name)
    img_brand = get_brand(fname)

    # 1. Zero Cross-Brand Pollution Check
    if img_brand == 'PARAGON' and g_brand != 'PARAGON':
        return False, f"PARAGON_IMAGE_ON_NON_PARAGON_GROUP: Product is in '{group_name}' ({g_brand}), image is Paragon ({fname})"
    if g_brand and img_brand and g_brand != img_brand:
        return False, f"CROSS_BRAND_MISMATCH: Product is {g_brand}, image is {img_brand} ({fname})"

    # 2. Check if the model token itself is a pseudo-model (RATE-xxx, VIEW-xxx, DISCOUNT-xxx, SINCE-xxx, AUG-xxx)
    if len(parts) >= 2:
        model_part = parts[1].upper()
        if any(token in model_part for token in PSEUDO_MODEL_TOKENS):
            return False, f"PSEUDO_MODEL_TOKEN: Model token '{model_part}' is a price/discount/slogan/date in ({fname})"

    # 3. Known generic / false matches
    clean_pname = strip_product_meta(product_name).upper()
    clean_pname_alnum = re.sub(r'[^A-Z0-9]', '', clean_pname)

    # 3-word-boundary: If FOOTWEAR_<model>_... ensure model is a distinct word/token in clean product name
    if fname.startswith('FOOTWEAR_') and len(parts) >= 2:
        raw_m = parts[1].upper()
        clean_m = raw_m.replace('-', ' ').strip()
        # Ensure model is not just a price
        if raw_m in ['MRP-399', 'MRP-027', 'MRP-025']:
            if '4809' not in product_name:
                return False, f"PSEUDO_MODEL: Price model {raw_m}"
        else:
            # Check distinct word match
            # e.g. 'ON-210' should match word 'ON-210' or 'ON 210', not substring of '1210'
            has_word_match = False
            for m_variant in [raw_m, raw_m.replace('-', ''), raw_m.replace('-', ' ')]:
                if re.search(r'(?:\b|_)' + re.escape(m_variant) + r'(?:\b|_)', clean_pname, re.IGNORECASE):
                    has_word_match = True
                    break
            # Also check if it's a known model like Deluxe-58 or Mafia-02
            if not has_word_match:
                # Check pure digits with word boundary
                digits = re.findall(r'\d+', raw_m)
                if digits:
                    for d in digits:
                        if len(d) >= 3 and re.search(r'\b' + re.escape(d) + r'\b', clean_pname):
                            has_word_match = True
                            break
                if not has_word_match:
                    return False, f"MODEL_NOT_FOUND_IN_ARTICLE: Footwear model '{raw_m}' does not match article '{clean_pname}'"

    # 3a. Generic MRP-399 photo (4809)
    if 'FOOTWEAR_MRP-399' in fname:
        if '4809' in product_name:
            return True, "VALID_BLOT_4809"
        else:
            return False, f"GENERIC_MRP_399: Generic MRP-399 image linked to non-4809 product '{product_name}'"

    # 3b. Acusole 145 vs Acusole 033
    if 'ACUSOLE_145' in fname.upper() and '033' in product_name:
        return False, f"MODEL_MISMATCH: Image is ACUSOLE 145 but product is ACUSOLE 033"

    # 3c. Walkaholic E3652 vs 3653
    if 'E3652' in fname and '3653' in clean_pname:
        return False, f"MODEL_MISMATCH: Image is E3652 but product is 3653"

    # 3d. Princess 1190 vs Gents 1190
    if 'PRINCESS-1190' in fname.upper() and 'GENTS' in clean_pname:
        return False, f"GENDER_MISMATCH: Princess (Ladies) image linked to Gents product"

    # 3e. EV1449 on Eeken 069
    if 'EV1449' in fname.upper() and '069' in clean_pname and '1449' not in clean_pname:
        return False, f"CROSS_MODEL_PRICE_POLLUTION: EV1449 linked to Eeken 069 based on MRP"

    # 3f. Price matched models
    if 'RESTO-100' in fname.upper() and 'RESTO' not in clean_pname:
        return False, f"PRICE_MATCHED_PSEUDO: Resto-100 matched on RS.100/-"
    if 'TECH-165' in fname.upper() and 'TECH' not in clean_pname and '165' not in clean_pname:
        return False, f"PRICE_MATCHED_PSEUDO: Tech-165 matched on RS.165/-"
    if 'E139' in fname.upper() and '139' not in clean_pname:
        return False, f"PRICE_MATCHED_PSEUDO: e139 matched on MRP139/-"
    if 'E-500' in fname.upper() and '500' not in clean_pname:
        return False, f"PARTIAL_NUMBER_MISMATCH: e-500 matched on 35005"
    if 'E-759' in fname.upper() and '9759' in clean_pname and '759' not in clean_pname:
        return False, f"PARTIAL_NUMBER_MISMATCH: e-759 matched on 9759"
    if 'LASTING-004' in fname.upper():
        return False, f"PSEUDO_MODEL: LASTING-004 is a slogan"
    if 'FOOTWEAR_MRP-' in fname.upper() and '4809' not in product_name:
        return False, f"PSEUDO_MODEL: FOOTWEAR_MRP-xxx matched on price"

    # 3g. PARAGON_<mrp>_UNKNOWN matched on product MRP
    m_prg_num = re.match(r'^PARAGON_(\d{2,4})_', fname, re.IGNORECASE)
    if m_prg_num:
        num = m_prg_num.group(1)
        # Check if this number is ONLY in product's MRP, but not in its article name
        # e.g. Escoute 335 MRP292/- -> num is 292
        # Durolite Glide-04 MRP738/- -> num is 738
        # Xpania H-4 MRP396/- -> num is 396
        if f"MRP{num}" in re.sub(r'[\s\.\:]', '', product_name).upper() or f"MRP.{num}" in re.sub(r'[\s\:]', '', product_name).upper():
            if num not in clean_pname:
                return False, f"MATCHED_ON_MRP: Image {fname} ({num}) was matched on MRP price in '{product_name}'"

    return True, "VALID"

def cleanse_database(file_path):
    print(f"\nCleansing database: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    purged_count = 0
    retained_count = 0
    purged_details = []

    for group in data:
        gname = group.get('groupName', '')
        for prod in group.get('products', []):
            pname = prod.get('productName', '')

            # Check legacy corrupted primary images
            prim = prod.get('imageUrl')
            if prim:
                if 'ACUSOLE_145' in prim.upper() and '033' in pname:
                    purged_count += 1
                    purged_details.append({
                        "group": gname,
                        "product": pname,
                        "purgedUrl": prim,
                        "reason": "PRIMARY_MISMATCH: Acusole 145 image assigned to Acusole 033"
                    })
                    prod['imageUrl'] = None
                elif 'E3652' in prim.upper() and '3653' in pname:
                    purged_count += 1
                    purged_details.append({
                        "group": gname,
                        "product": pname,
                        "purgedUrl": prim,
                        "reason": "PRIMARY_MISMATCH: E3652 image assigned to Walkaholic 3653"
                    })
                    prod['imageUrl'] = None

            sec = prod.get('secondaryImageUrl')
            if not sec:
                continue

            is_valid, reason = evaluate_image_link(gname, pname, sec)

            if not is_valid:
                purged_count += 1
                purged_details.append({
                    "group": gname,
                    "product": pname,
                    "purgedUrl": sec,
                    "reason": reason
                })
                prod['secondaryImageUrl'] = None
            else:
                retained_count += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  ✓ Retained: {retained_count} valid secondary images")
    print(f"  🗑️ Purged: {purged_count} invalid / contaminated secondary images")

    return purged_details

def main():
    print("==================================================")
    print("STARTING ZERO-TOLERANCE DATABASE CLEANSING")
    print("==================================================")

    purged_frontend = cleanse_database(FRONTEND_STOCK)
    purged_hub = cleanse_database(HUB_STOCK)

    report = {
        "timestamp": "2026-09-23",
        "purgedTotal": len(purged_frontend),
        "purgedItems": purged_frontend
    }

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Cleansing report saved to: {REPORT_PATH}")
    print(f"\nTotal purged items: {len(purged_frontend)}")
    for item in purged_frontend:
        print(f" - [{item['reason']}] Group: {item['group']} | Prod: {item['product']}")

if __name__ == '__main__':
    main()
