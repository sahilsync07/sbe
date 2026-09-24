import os
import sys
import zipfile
import io
import time
import winocr
import asyncio
import re
import json
from PIL import Image

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from frontend.scripts.cubix_color_detector import analyze_shoe_color

WA_ZIP_PATH = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with NEW CUBIX GALLERY .zip"
OUTPUT_INDEX = os.path.join(REPO_ROOT, "frontend", "scripts", "cubix_wa_index.json")
STOCK_FILE = os.path.join(REPO_ROOT, "frontend", "public", "assets", "stock-data.json")

# Load catalog model numbers
with open(STOCK_FILE, 'r', encoding='utf-8') as f:
    stock_data = json.load(f)

catalog_models = set()
for g in stock_data:
    if any(k in g.get('groupName', '').upper() for k in ['CUBIX', 'CBX']):
        for p in g.get('products', []):
            m = re.search(r'(?:CBX|CUBIX)?\s*(?:E\-?\s*)?(\d{4,5})\b', p['productName'].upper())
            if m:
                catalog_models.add(m.group(1))

print(f"Loaded {len(catalog_models)} unique Cubix models from stock-data.json")

async def main():
    # Load existing index if any to allow resume
    index = {}
    if os.path.exists(OUTPUT_INDEX):
        try:
            with open(OUTPUT_INDEX, 'r', encoding='utf-8') as f:
                index = json.load(f)
            print(f"Loaded existing index with {len(index)} items")
        except Exception:
            index = {}

    with zipfile.ZipFile(WA_ZIP_PATH, 'r') as z:
        all_imgs = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        to_process = [n for n in all_imgs if n not in index]
        print(f"Total WhatsApp images: {len(all_imgs)}. Already indexed: {len(index)}. Remaining: {len(to_process)}")

        t0 = time.time()
        count = 0
        matched_catalog = 0

        for name in to_process:
            try:
                b = z.read(name)
                im = Image.open(io.BytesIO(b)).convert('RGB')
                w, h = im.size

                # 1. OCR bottom 45% (where model card usually sits)
                crop_bot = im.crop((0, int(h * 0.55), w, h))
                res_bot = await winocr.recognize_pil(crop_bot, 'en')
                txt_bot = (res_bot.text or "").strip()

                found_model = None
                # Check 4-5 digit numbers
                candidates = re.findall(r'\b\d{4,5}\b', txt_bot)
                # Prioritize numbers in catalog
                for c in candidates:
                    if c in catalog_models:
                        found_model = c
                        break
                if not found_model and candidates:
                    found_model = candidates[0]

                # If no model in bottom, try top 40%
                if not found_model:
                    crop_top = im.crop((0, 0, w, int(h * 0.40)))
                    res_top = await winocr.recognize_pil(crop_top, 'en')
                    txt_top = (res_top.text or "").strip()
                    top_candidates = re.findall(r'\b\d{4,5}\b', txt_top)
                    for c in top_candidates:
                        if c in catalog_models:
                            found_model = c
                            break
                    if not found_model and top_candidates:
                        found_model = top_candidates[0]
                    full_text = f"{txt_top} \n---\n {txt_bot}"
                else:
                    full_text = txt_bot

                # 2. Analyze shoe color
                c, pct, counts = analyze_shoe_color(im)

                index[name] = {
                    'model': found_model,
                    'is_catalog': (found_model in catalog_models) if found_model else False,
                    'detected_color': c,
                    'color_confidence': pct,
                    'ocr_text': full_text
                }

                if found_model in catalog_models:
                    matched_catalog += 1

            except Exception as e:
                index[name] = {'error': str(e)}

            count += 1
            if count % 250 == 0:
                elapsed = time.time() - t0
                rate = count / elapsed if elapsed > 0 else 0
                print(f"Processed {count}/{len(to_process)} ({rate:.1f} img/s) - Matched catalog models: {matched_catalog}")
                with open(OUTPUT_INDEX, 'w', encoding='utf-8') as f:
                    json.dump(index, f, indent=2, ensure_ascii=False)

        # Final save
        with open(OUTPUT_INDEX, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)

        total_time = time.time() - t0
        print(f"Indexing complete! {len(index)} total indexed in {total_time:.2f}s. Catalog matches: {matched_catalog}")

if __name__ == '__main__':
    asyncio.run(main())
