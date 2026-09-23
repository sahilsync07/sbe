import os
import re
import glob

tg_dir = r"C:\Users\Sahil Kumar\Downloads\Telegram Desktop\ChatExport_2026-09-23"
tg_photos = os.path.join(tg_dir, "photos")
full_photos = set(f for f in os.listdir(tg_photos) if not f.endswith("_thumb.jpg"))

html_files = sorted(glob.glob(os.path.join(tg_dir, "messages*.html")))
full_with_caption = {}

for hf in html_files:
    with open(hf, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    msg_blocks = re.split(r'<div class="message\s+', content)
    for b in msg_blocks:
        photo_m = re.search(r'<a\s+class="[^"]*photo_wrap[^"]*"[^>]*href="([^"]+)"', b)
        text_m = re.search(r'<div class="text">([\s\S]*?)</div>', b)
        if photo_m:
            fn = os.path.basename(photo_m.group(1))
            if fn in full_photos and text_m:
                txt = re.sub(r'<[^>]+>', ' ', text_m.group(1)).strip()
                if txt:
                    full_with_caption[fn] = txt

print(f"Total full photos in folder: {len(full_photos)}")
print(f"Full photos matching HTML captions: {len(full_with_caption)}")

# Now let's test matching against stock-data.json
import json
with open(r"C:\Projects\sbe\frontend\public\assets\stock-data.json", 'r', encoding='utf-8') as f:
    groups = json.load(f)

# Find all products missing secondaryImageUrl in Paragon, EEKEN, P-TOES, SOLEA, etc.
missing_by_group = {}
for g in groups:
    gname = g.get('groupName', '')
    for p in g.get('products', []):
        if not p.get('secondaryImageUrl'):
            missing_by_group.setdefault(gname, []).append(p['productName'])

print("\nMissing secondaryImageUrl in relevant groups:")
for gname in ['PARAGON GENTS', 'PARAGON LADIES', 'PARALITE', 'EEKEN', 'P-TOES', 'SOLEA DISC 40% OFFER']:
    if gname in missing_by_group:
        print(f"  {gname}: {len(missing_by_group[gname])} missing")
