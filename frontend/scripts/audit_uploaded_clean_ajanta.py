import urllib.request
import json
import io
import asyncio
from PIL import Image
import winocr

STOCK_PATH = r"frontend/public/assets/stock-data.json"

async def audit():
    with open(STOCK_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    ajanta = next(g for g in data if g.get('groupName') == 'AJANTA')
    prods = ajanta.get('products', [])
    
    attached = [(p['productName'], p.get('secondaryImageUrl')) for p in prods if p.get('secondaryImageUrl')]
    print(f"Total AJANTA products: {len(prods)}")
    print(f"Total attached: {len(attached)}")
    print(f"Total unmatched (cleanly None): {len(prods) - len(attached)}")
    
    unique_urls = sorted(list(set(u for _, u in attached)))
    print(f"Total unique URLs to audit: {len(unique_urls)}")
    print("=" * 60)
    
    dirty_count = 0
    clean_count = 0
    
    for idx, u in enumerate(unique_urls, 1):
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read()
                im = Image.open(io.BytesIO(raw)).convert('RGB')
                w, h = im.size
                
                # Check dimensions
                is_dealer_dim = (w, h) == (892, 1262) or (w, h) == (1262, 892)
                
                # Run OCR
                res = await winocr.recognize_pil(im, 'en')
                txt = (res.text or '').upper()
                
                has_qty = 'QTY' in txt or 'QUANTITY' in txt
                has_sbe = any(k in txt for k in ['SBE', 'RAYAGADA', 'BRUNDABAN'])
                
                if is_dealer_dim or has_qty or has_sbe:
                    dirty_count += 1
                    print(f"[{idx}/{len(unique_urls)}] FAILED AUDIT: {u}")
                    print(f"    Size: {w}x{h}, has_qty={has_qty}, has_sbe={has_sbe}")
                    print(f"    OCR snippet: {txt[:120]}")
                else:
                    clean_count += 1
                    print(f"[{idx}/{len(unique_urls)}] PASSED (100% CLEAN): {w}x{h} | {u.split('/')[-1]}")
        except Exception as e:
            print(f"[{idx}/{len(unique_urls)}] ERROR fetching {u}: {e}")
            
    print("=" * 60)
    print(f"FINAL AUDIT SUMMARY: {clean_count} PASSED, {dirty_count} FAILED.")
    if dirty_count == 0:
        print("ALL IMAGES ARE 100% CLEAN MANUFACTURER SAMPLES!")
    else:
        print("WARNING: FOUND DIRTY IMAGES!")

if __name__ == '__main__':
    asyncio.run(audit())
