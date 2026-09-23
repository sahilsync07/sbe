import os
import sys
import json
import re
import urllib.request
import io
from PIL import Image
import colorsys
import asyncio
import winocr

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

FRONTEND_STOCK = r"c:\Projects\sbe\frontend\public\assets\stock-data.json"

COLOR_DEFINITIONS = {
    'BLK': ['BLK', 'BLACK', 'BK'],
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
    # Try exact word matches first
    for fam, aliases in COLOR_DEFINITIONS.items():
        for a in aliases:
            # Check standalone word or within brackets or after model
            if re.search(r'(?:\b|[^A-Z])' + re.escape(a) + r'(?:\b|[^A-Z])', pn):
                return fam, a
    return None, None

def extract_model_num(pname):
    # Match 4 or 5 digit model numbers or E-12345
    m = re.search(r'(?:CBX|CUBIX)?\s*(?:E\-)?(\d{4,5})\b', pname.upper())
    if m:
        return m.group(1)
    return None

def analyze_image_colors(img):
    """Analyze the center region of image (where the shoe is) in HSV space."""
    w, h = img.size
    # Shoe is typically in center 50% horizontally and 20%-80% vertically
    crop_box = (int(w * 0.20), int(h * 0.20), int(w * 0.80), int(h * 0.75))
    shoe_crop = img.crop(crop_box).resize((100, 100))
    
    pixels = list(shoe_crop.getdata())
    
    # Filter out near-white or background pixels (e.g. background walls/pedestals)
    # Backgrounds are usually uniform grey/white or subtle gradient
    shoe_pixels = []
    for r, g, b in pixels:
        # Normalize
        rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
        h_val, s_val, v_val = colorsys.rgb_to_hsv(rn, gn, bn)
        
        # Skip pure white/near-white pedestal/background
        if v_val > 0.92 and s_val < 0.12:
            continue
        # Skip extremely faint pastel background
        if v_val > 0.85 and s_val < 0.08:
            continue
        shoe_pixels.append((h_val * 360, s_val, v_val, r, g, b))
        
    if not shoe_pixels:
        return "UNKNOWN", 0, 0, 0

    # Categorize pixels
    counts = {
        'BLK': 0,
        'GRN': 0,
        'BLU': 0,
        'PNK': 0,
        'MRN': 0,
        'GRP': 0,
        'BRN': 0,
        'YLW_GLD': 0,
        'WHT_BGE': 0,
        'GRY': 0
    }

    for h_deg, s, v, r, g, b in shoe_pixels:
        if v < 0.28:
            counts['BLK'] += 1
        elif s < 0.15:
            if v > 0.70:
                counts['WHT_BGE'] += 1
            else:
                counts['GRY'] += 1
        else:
            # Saturated colors
            if 70 <= h_deg <= 165:
                counts['GRN'] += 1
            elif 175 <= h_deg <= 255:
                counts['BLU'] += 1
            elif 260 <= h_deg <= 325:
                counts['GRP'] += 1
            elif (325 < h_deg <= 360 or 0 <= h_deg <= 20):
                if v > 0.55 and s < 0.65:
                    counts['PNK'] += 1
                elif v <= 0.55 and s > 0.25:
                    counts['MRN'] += 1
                else:
                    counts['PNK'] += 1
            elif 20 < h_deg < 60:
                if s > 0.50 and v > 0.70:
                    counts['YLW_GLD'] += 1
                elif s > 0.25:
                    counts['BRN'] += 1
                else:
                    counts['WHT_BGE'] += 1
            else:
                counts['BRN'] += 1

    total = len(shoe_pixels)
    dom_color = max(counts.items(), key=lambda x: x[1])
    pct = (dom_color[1] / total) * 100
    return dom_color[0], pct, counts, total

async def main():
    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        data = json.load(f)

    cubix_items = []
    for g in data:
        gname = g.get('groupName', '')
        if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
            for p in g.get('products', []):
                pname = p.get('productName', '')
                sec = p.get('secondaryImageUrl')
                img = p.get('imageUrl')
                fam, token = extract_product_color_family(pname)
                model = extract_model_num(pname)
                cubix_items.append({
                    'product': p,
                    'group': gname,
                    'pname': pname,
                    'model': model,
                    'color_family': fam,
                    'color_token': token,
                    'sec_url': sec,
                    'img_url': img
                })

    print(f"Loaded {len(cubix_items)} Cubix items.")
    items_with_sec = [it for it in cubix_items if it['sec_url']]
    print(f"Items with secondaryImageUrl: {len(items_with_sec)}")

    # Group by model
    by_model = {}
    for it in cubix_items:
        if it['model']:
            by_model.setdefault(it['model'], []).append(it)

    print(f"Unique Cubix models: {len(by_model)}")

    # Check for known blatant filename mismatches
    print("\n=== Scanning Filename vs Product Color Mismatches ===")
    filename_mismatches = []
    for it in items_with_sec:
        sec = it['sec_url']
        fn = sec.split('/')[-1].upper()
        fam = it['color_family']
        
        # Check if filename has an explicit color suffix contradicting product color
        file_fam = None
        for cf, aliases in COLOR_DEFINITIONS.items():
            for a in aliases:
                if re.search(r'[\_\-]' + re.escape(a) + r'(?:\.|\_)', fn):
                    file_fam = cf
                    break
            if file_fam:
                break
                
        if fam and file_fam and fam != file_fam:
            # e.g. fam is BLK, file_fam is GRN
            filename_mismatches.append((it, fam, file_fam, fn))

    print(f"Found {len(filename_mismatches)} obvious filename-level color clashes:")
    for it, fam, file_fam, fn in filename_mismatches:
        print(f"  Prod: {it['pname']}")
        print(f"    Product Color: {fam} vs Image Filename: {file_fam} ({fn})")

if __name__ == '__main__':
    asyncio.run(main())
