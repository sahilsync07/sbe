import os
import glob
import re
import asyncio
from PIL import Image
import winocr

tg_dir = r"C:\Users\Sahil Kumar\Downloads\Telegram Desktop\ChatExport_2026-09-23"
html_files = sorted(glob.glob(os.path.join(tg_dir, "messages*.html")))

pairs = []
for hf in html_files:
    with open(hf, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for b in re.split(r'<div class="message\s+', content):
        pm = re.search(r'<a\s+class="[^"]*photo_wrap[^"]*"[^>]*href="([^"]+)"', b)
        tm = re.search(r'<div class="text">([\s\S]*?)</div>', b)
        if pm and tm:
            fn = os.path.basename(pm.group(1))
            full_p = os.path.join(tg_dir, 'photos', fn)
            if os.path.exists(full_p) and not fn.endswith('_thumb.jpg'):
                txt = re.sub(r'<[^>]+>', ' ', tm.group(1)).strip()
                pairs.append((full_p, fn, txt))

print(f"Checking first 60 sample images from Telegram export with WinOCR...")

async def check():
    danger_count = 0
    clean_count = 0
    for full_p, fn, txt in pairs[:60]:
        img = Image.open(full_p)
        res = await winocr.recognize_pil(img.convert('RGB'), 'en')
        ocr_txt = (res.text or '').upper()
        has_danger = ('SBE RAYAGADA' in ocr_txt) or ('QTY:' in ocr_txt)
        if has_danger:
            danger_count += 1
            print(f"DANGER FOUND in {fn}: {ocr_txt[:80]}")
        else:
            clean_count += 1
            if clean_count <= 5:
                print(f"Clean sample {fn} ({txt}): {repr(ocr_txt[:60])}")
    print(f"\nDone! Clean: {clean_count}, Danger: {danger_count}")

asyncio.run(check())
