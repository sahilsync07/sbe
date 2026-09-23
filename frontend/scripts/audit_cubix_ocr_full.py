import os
import sys
import json
import re
import asyncio
import urllib.request
import io
from PIL import Image
import winocr

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

FRONTEND_STOCK = r"c:\Projects\sbe\frontend\public\assets\stock-data.json"
CACHE_FILE = r"c:\Projects\sbe\frontend\scripts\cubix_ocr_cache.json"

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

def extract_colors_from_text(text):
    t = text.upper()
    found = set()
    for fam, aliases in COLOR_DEFINITIONS.items():
        for a in aliases:
            if re.search(r'(?:\b|[^A-Z])' + re.escape(a) + r'(?:\b|[^A-Z])', t):
                found.add(fam)
                break
    return found

async def fetch_and_ocr(url):
    loop = asyncio.get_event_loop()
    try:
        def fetch():
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read()
        img_bytes = await loop.run_in_executor(None, fetch)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # 1. Full image OCR
        res = await winocr.recognize_pil(img, 'en')
        full_text = (res.text or "").strip()
        
        # 2. Bottom crop OCR (where model, clr, mrp are typically printed)
        w, h = img.size
        bot_crop = img.crop((0, int(h * 0.55), w, h))
        res_bot = await winocr.recognize_pil(bot_crop, 'en')
        bot_text = (res_bot.text or "").strip()
        
        # 3. Top crop OCR (where "COLOUR: GRAPE" or logo might be)
        top_crop = img.crop((0, 0, w, int(h * 0.40)))
        res_top = await winocr.recognize_pil(top_crop, 'en')
        top_text = (res_top.text or "").strip()
        
        combined_text = f"{full_text}\n---\n{bot_text}\n---\n{top_text}"
        
        return {
            'text': combined_text,
            'status': 'ok'
        }
    except Exception as e:
        return {
            'text': '',
            'status': f'error: {e}'
        }

async def run_ocr_sweep():
    # Load cache if exists
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cache = json.load(f)
        except Exception:
            cache = {}

    with open(FRONTEND_STOCK, 'r', encoding='utf-8') as f:
        data = json.load(f)

    unique_urls = set()
    for g in data:
        gname = g.get('groupName', '')
        if 'CUBIX' in gname.upper() or 'CBX' in gname.upper():
            for p in g.get('products', []):
                sec = p.get('secondaryImageUrl')
                if sec:
                    unique_urls.add(sec)

    urls_to_fetch = [u for u in unique_urls if u not in cache or cache[u].get('status') != 'ok']
    print(f"Total unique Cubix URLs: {len(unique_urls)}")
    print(f"Cached: {len(cache)}, Remaining to fetch: {len(urls_to_fetch)}")

    batch_size = 15
    for i in range(0, len(urls_to_fetch), batch_size):
        batch = urls_to_fetch[i:i+batch_size]
        tasks = [fetch_and_ocr(u) for u in batch]
        results = await asyncio.gather(*tasks)
        for u, res in zip(batch, results):
            cache[u] = res
        print(f"  Processed {min(i+batch_size, len(urls_to_fetch))}/{len(urls_to_fetch)} URLs...")
        # Save cache periodically
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, indent=2)

    print("All URLs fetched and cached!")

if __name__ == '__main__':
    asyncio.run(run_ocr_sweep())
