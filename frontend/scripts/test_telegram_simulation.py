import os
import re
import glob
import json

tg_dir = r"C:\Users\Sahil Kumar\Downloads\Telegram Desktop\ChatExport_2026-09-23"
tg_photos = os.path.join(tg_dir, "photos")
full_photos = set(f for f in os.listdir(tg_photos) if not f.endswith("_thumb.jpg"))

html_files = sorted(glob.glob(os.path.join(tg_dir, "messages*.html")))
photos_with_caption = []

for hf in html_files:
    with open(hf, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for b in re.split(r'<div class="message\s+', content):
        pm = re.search(r'<a\s+class="[^"]*photo_wrap[^"]*"[^>]*href="([^"]+)"', b)
        tm = re.search(r'<div class="text">([\s\S]*?)</div>', b)
        if pm and tm:
            fn = os.path.basename(pm.group(1))
            if fn in full_photos:
                txt = re.sub(r'<[^>]+>', ' ', tm.group(1)).strip()
                if txt:
                    photos_with_caption.append((fn, txt))

with open(r"C:\Projects\sbe\frontend\public\assets\stock-data.json", 'r', encoding='utf-8') as f:
    groups = json.load(f)

# Collect all products missing secondaryImageUrl
missing_products = []
for g in groups:
    gname = g.get('groupName', '')
    for p in g.get('products', []):
        if not p.get('secondaryImageUrl'):
            missing_products.append({
                'group': gname,
                'name': p['productName'],
                'p_obj': p
            })

print(f"Missing products: {len(missing_products)}")

# Physical mirror size clusters
CLUSTER_LADIES = {'4X7', '4X8', '5X8', '4*7', '4*8', '5*8'}
CLUSTER_GENTS = {'6X9', '6X10', '7X10', '8X10', '6*9', '6*10', '7*10', '8*10', '6/10', '06/10', '7/10', '07/10'}
CLUSTER_KIDS = {'11X13', '1X3', '1X4', '11*13', '1*3', '1*4'}
CLUSTER_TODDLER = {'15X18', '16X20', '15*18', '16*20'}

def extract_size(s):
    s = s.upper().replace(' ', '')
    for m in re.finditer(r'\(?([0-9]{1,2}[X\*\/][0-9]{1,2})\)?', s):
        return m.group(1)
    return None

def sizes_compatible(s1, s2):
    if not s1 or not s2:
        return True # if size is not specified in caption, allow if model & color match
    s1 = s1.upper().replace('*', 'X').replace('/', 'X')
    s2 = s2.upper().replace('*', 'X').replace('/', 'X')
    if s1 == s2:
        return True
    for cl in [CLUSTER_LADIES, CLUSTER_GENTS, CLUSTER_KIDS, CLUSTER_TODDLER]:
        cl_clean = {x.replace('*', 'X').replace('/', 'X') for x in cl}
        if s1 in cl_clean and s2 in cl_clean:
            return True
    return False

# Match simulation
matched_items = {} # prod_name -> (fn, caption)

for fn, cap in photos_with_caption:
    cap_clean = re.sub(r'^[0-9_]+', '', cap).strip().upper()
    tokens = [t for t in re.split(r'[^A-Z0-9]+', cap_clean) if t]
    cap_size = extract_size(cap)
    
    # Model numbers in caption
    numbers = [t for t in tokens if t.isdigit() and len(t) >= 3]
    
    # Colors in caption
    COLOR_KEYS = {
        'BLACK': 'BLK', 'BLK': 'BLK',
        'BROWN': 'BRN', 'BRN': 'BRN',
        'TAN': 'TAN',
        'NAVY': 'NVY', 'NVY': 'NVY', 'BLUE': 'BLU', 'BLU': 'BLU',
        'RED': 'RED',
        'WHITE': 'WHT', 'WHT': 'WHT',
        'GREY': 'GRY', 'GRAY': 'GRY', 'GRY': 'GRY',
        'MUSTARD': 'MUSTARD', 'OLIVE': 'OLIVE', 'YELLOW': 'YLW', 'YLW': 'YLW',
        'CHERRY': 'CHERRY', 'MEHNDI': 'MHD', 'MHD': 'MHD'
    }
    cap_colors = set()
    for t in tokens:
        if t in COLOR_KEYS:
            cap_colors.add(COLOR_KEYS[t])
            
    for prod in missing_products:
        pname = prod['name']
        if pname in matched_items:
            continue
        pname_upper = pname.upper()
        prod_size = extract_size(pname)
        
        # Check size cluster compatibility
        if not sizes_compatible(cap_size, prod_size):
            continue
            
        # Extract prod colors
        prod_colors = set()
        for word in re.split(r'[^A-Z0-9]+', pname_upper):
            if word in COLOR_KEYS:
                prod_colors.add(COLOR_KEYS[word])
                
        # Color match requirement: if both have colors, must overlap
        if cap_colors and prod_colors:
            if not (cap_colors & prod_colors):
                continue
                
        # Model number matching
        if numbers:
            num = numbers[0]
            # Check if number is in product name
            if re.search(r'\b' + num + r'\b', pname_upper) or num in pname_upper:
                # Brand check
                brand_ok = False
                brand_keywords = ['PARAGON', 'VERTEX', 'SOLEA', 'EEKEN', 'P-TOES', 'PTOES', 'PARALITE', 'MAX', 'COMFY', 'SLICKERS', 'FENDER', 'STIMULUS']
                for bk in brand_keywords:
                    if bk in cap_clean and (bk in pname_upper or prod['group'] in ['PARAGON GENTS', 'PARAGON LADIES', 'PARALITE', 'EEKEN', 'P-TOES', 'SOLEA DISC 40% OFFER']):
                        brand_ok = True
                        break
                if brand_ok:
                    matched_items[pname] = (fn, cap, prod['group'])

print(f"\nSimulated Matches with Mirror Size Clusters + Color Guard: {len(matched_items)}")
by_grp = {}
for pn, (fn, cap, g) in matched_items.items():
    by_grp[g] = by_grp.get(g, 0) + 1

for g, cnt in sorted(by_grp.items(), key=lambda x: x[1], reverse=True):
    print(f"  {g}: {cnt}")
