import os
import sys
import json
import asyncio
import urllib.request
import io
from PIL import Image
import colorsys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CACHE_FILE = r"c:\Projects\sbe\frontend\scripts\cubix_ocr_cache.json"

def analyze_shoe_color(img):
    w, h = img.size
    # Shoe is generally in the upper/middle area above the card text
    shoe_crop = img.crop((int(w * 0.20), int(h * 0.15), int(w * 0.80), int(h * 0.65))).resize((80, 80))
    pixels = list(shoe_crop.getdata())
    
    p_colors = {
        'BLK': 0, 'PNK': 0, 'MRN': 0, 'GRN': 0, 'BLU': 0,
        'GRP': 0, 'BRN': 0, 'WHT_BGE': 0, 'YLW_GLD': 0, 'GRY': 0, 'OTHER': 0
    }
    
    for r, g, b in pixels:
        rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
        h_deg, s, v = colorsys.rgb_to_hsv(rn, gn, bn)
        h_deg *= 360
        
        # Background filter (white/pedestal/very pale background)
        if v > 0.88 and s < 0.10:
            continue
        if v > 0.95:
            continue
            
        if v < 0.25:
            p_colors['BLK'] += 1
        elif s < 0.14:
            if v > 0.65:
                p_colors['WHT_BGE'] += 1
            else:
                p_colors['GRY'] += 1
        else:
            if 68 <= h_deg <= 165:
                p_colors['GRN'] += 1
            elif 175 <= h_deg <= 255:
                p_colors['BLU'] += 1
            elif 260 <= h_deg <= 325:
                p_colors['GRP'] += 1
            elif (325 < h_deg <= 360 or 0 <= h_deg <= 22):
                if v > 0.55:
                    p_colors['PNK'] += 1
                else:
                    p_colors['MRN'] += 1
            elif 22 < h_deg < 68:
                if s > 0.45 and v > 0.65:
                    p_colors['YLW_GLD'] += 1
                elif s > 0.18:
                    p_colors['BRN'] += 1
                else:
                    p_colors['WHT_BGE'] += 1
            else:
                p_colors['OTHER'] += 1

    valid = {k: v for k, v in p_colors.items() if k != 'OTHER'}
    total_valid = sum(valid.values())
    if total_valid == 0:
        return 'UNKNOWN', 0, valid
        
    top_color, top_count = max(valid.items(), key=lambda x: x[1])
    pct = (top_count / total_valid) * 100
    return top_color, round(pct, 1), valid

async def run_chromatic_sweep():
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        cache = json.load(f)

    urls = list(cache.keys())
    urls_to_proc = [u for u in urls if 'detected_color' not in cache[u]]
    print(f"Total cached URLs: {len(urls)}, Need chromatic analysis: {len(urls_to_proc)}")

    loop = asyncio.get_event_loop()

    async def proc_url(url):
        def fetch():
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read()
        try:
            data = await loop.run_in_executor(None, fetch)
            img = Image.open(io.BytesIO(data)).convert('RGB')
            top_col, pct, counts = analyze_shoe_color(img)
            return url, top_col, pct, counts
        except Exception as e:
            return url, 'ERROR', 0, {}

    batch_size = 20
    for i in range(0, len(urls_to_proc), batch_size):
        batch = urls_to_proc[i:i+batch_size]
        results = await asyncio.gather(*(proc_url(u) for u in batch))
        for url, top_col, pct, counts in results:
            cache[url]['detected_color'] = top_col
            cache[url]['color_confidence'] = pct
            cache[url]['color_counts'] = counts
        print(f"  Processed {min(i+batch_size, len(urls_to_proc))}/{len(urls_to_proc)}...")
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, indent=2)

    print("Chromatic sweep complete!")

if __name__ == '__main__':
    asyncio.run(run_chromatic_sweep())
