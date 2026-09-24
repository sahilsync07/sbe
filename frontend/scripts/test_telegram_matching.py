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
    msg_blocks = re.split(r'<div class="message\s+', content)
    for b in msg_blocks:
        photo_m = re.search(r'<a\s+class="[^"]*photo_wrap[^"]*"[^>]*href="([^"]+)"', b)
        text_m = re.search(r'<div class="text">([\s\S]*?)</div>', b)
        if photo_m and text_m:
            fn = os.path.basename(photo_m.group(1))
            if fn in full_photos:
                txt = re.sub(r'<[^>]+>', ' ', text_m.group(1)).strip()
                if txt:
                    photos_with_caption.append((fn, txt))

print(f"Loaded {len(photos_with_caption)} photo-caption pairs")

with open(r"C:\Projects\sbe\frontend\public\assets\stock-data.json", 'r', encoding='utf-8') as f:
    groups = json.load(f)

# Build product dictionary of missing items
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

print(f"Total missing products across catalog: {len(missing_products)}")

# Normalization helper
def normalize(s):
    return re.sub(r'[^A-Z0-9]', '', s.upper())

# Let's inspect matching
matches = []
for fn, cap in photos_with_caption:
    # Clean caption
    cap_clean = re.sub(r'^[0-9_]+', '', cap).strip().upper()
    tokens = [t for t in re.split(r'[^A-Z0-9]+', cap_clean) if t]
    
    # Check if any missing product matches
    for prod in missing_products:
        pname = prod['name'].upper()
        # Extract model numbers or key terms
        # If tokens are e.g. ['VERTEX', '6768', 'BROWN']
        # Product might be 'PARAGON VERTEX 6768 BRN (6X10)' or 'VERTEX 6768...'
        if len(tokens) >= 2:
            model_word = tokens[0] # e.g. VERTEX, SOLEA, EEKEN, PTOES
            # find number if any
            numbers = [t for t in tokens if t.isdigit() and len(t) >= 3]
            if numbers:
                num = numbers[0]
                # Check if num and model_word are in pname
                if num in pname:
                    # check brand match
                    brand_match = False
                    if model_word in pname or prod['group'] in ['PARAGON GENTS', 'PARAGON LADIES', 'PARALITE', 'EEKEN', 'P-TOES', 'SOLEA DISC 40% OFFER']:
                        brand_match = True
                    
                    if brand_match:
                        # Check color if possible
                        colors = ['BLK', 'BLACK', 'BRN', 'BROWN', 'TAN', 'NAVY', 'NVY', 'BLU', 'BLUE', 'RED', 'WHT', 'WHITE', 'GRY', 'GREY', 'MUSTARD', 'OLIVE']
                        cap_colors = [c for c in colors if c in tokens]
                        prod_colors = [c for c in colors if re.search(r'\b' + c + r'\b', pname)]
                        
                        # If color matches or either has no color specified
                        color_ok = True
                        if cap_colors and prod_colors:
                            # check overlap
                            color_ok = any(
                                (c1 == c2) or 
                                (c1 in ['BLK', 'BLACK'] and c2 in ['BLK', 'BLACK']) or
                                (c1 in ['BRN', 'BROWN'] and c2 in ['BRN', 'BROWN']) or
                                (c1 in ['NVY', 'NAVY', 'BLU', 'BLUE'] and c2 in ['NVY', 'NAVY', 'BLU', 'BLUE']) or
                                (c1 in ['GRY', 'GREY'] and c2 in ['GRY', 'GREY'])
                                for c1 in cap_colors for c2 in prod_colors
                            )
                        
                        if color_ok:
                            matches.append((prod['group'], prod['name'], fn, cap))
                            break

print(f"\nFound {len(matches)} initial matches against missing products!")

by_grp = {}
for g, pn, fn, cap in matches:
    by_grp[g] = by_grp.get(g, 0) + 1

print("\nMatches by group:")
for g, cnt in sorted(by_grp.items(), key=lambda x: x[1], reverse=True):
    print(f"  {g}: {cnt}")

print("\nSample 20 matches:")
for g, pn, fn, cap in matches[:20]:
    print(f"[{g}] {pn} <---> {cap} (Photo: {fn})")
