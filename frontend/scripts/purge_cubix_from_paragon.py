import os
import sys
import json
import re
import urllib.request
import urllib.parse
import base64
import asyncio
import io
from PIL import Image
import winocr

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CLOUD_NAME = 'dieqsg5tr'
API_KEY = '778282291518515'
API_SECRET = 'FQuxzNqkEqKXu8NpwUL6CFQWpNQ'

auth_str = f'{API_KEY}:{API_SECRET}'
b64_auth = base64.b64encode(auth_str.encode()).decode()

STOCK_FILES = [
    r'frontend/public/assets/stock-data.json',
    r'sbe-hub/public/assets/stock-data.json',
    r'C:\Projects\sriyasync_github\sbe\frontend\public\assets\stock-data.json'
]

PARAGON_GROUPS = [
    'PARAGON', 'PARAGON GENTS', 'PARAGON GENTS 40%', 'PARAGON LADIES',
    'PARAGON COMFY', 'Paragon Blot', 'Paralite', 'PARALITE OLD', 'P-TOES',
    'P-TOES PARALITE', 'Solea & Meriva , Mascara', 'SOLEA DISC 40% OFFER',
    'SOLA', 'Walkaholic', 'Max', 'Hawai Chappal', 'Escoute', 'Stimulus',
    'VERTEX, SLICKERS & FENDER'
]

def delete_cloudinary_resources(public_ids):
    if not public_ids:
        return
    print(f"Deleting {len(public_ids)} resources from Cloudinary...")
    # Cloudinary DELETE endpoint takes batches of up to 100 public_ids[]
    batch_size = 50
    for i in range(0, len(public_ids), batch_size):
        batch = public_ids[i:i+batch_size]
        query = '&'.join([f'public_ids[]={urllib.parse.quote(pid)}' for pid in batch])
        url = f'https://api.cloudinary.com/v1_1/{CLOUD_NAME}/resources/image/upload?{query}'
        req = urllib.request.Request(url, method='DELETE', headers={'Authorization': f'Basic {b64_auth}'})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                deleted_map = data.get('deleted', {})
                count = sum(1 for v in deleted_map.values() if v == 'deleted')
                print(f"  Batch {i//batch_size + 1}: successfully deleted {count}/{len(batch)} resources.")
        except Exception as e:
            print(f"  Error deleting batch: {e}")

async def inspect_and_ocr(url):
    loop = asyncio.get_event_loop()
    try:
        def fetch():
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read()
        data = await loop.run_in_executor(None, fetch)
        img = Image.open(io.BytesIO(data)).convert('RGB')
        res = await winocr.recognize_pil(img, 'en')
        text = (res.text or "").upper()
        
        # Check top 30% crop where Cubix logo typically is
        w, h = img.size
        top_crop = img.crop((0, 0, w, int(h * 0.35)))
        res_top = await winocr.recognize_pil(top_crop, 'en')
        top_text = (res_top.text or "").upper()
        
        full_text = text + " " + top_text
        
        # Check Cubix indicators
        is_cubix = False
        reason = ""
        
        if "CUBIX" in full_text or "CBX" in full_text or "CUBIS" in full_text:
            is_cubix = True
            reason = "Direct CUBIX / CBX / CUBIS text"
        elif re.search(r'R[HF]Y[TF][HF]M.*FOOT', full_text) or "RHYTHM OF FOOT" in full_text or "RFYF" in full_text:
            is_cubix = True
            reason = "Cubix slogan 'The rhythm of foot'"
        elif "THE RHYTHM" in full_text:
            is_cubix = True
            reason = "Cubix slogan fragment"
            
        return is_cubix, reason, text[:80]
    except Exception as e:
        return False, f"Error: {e}", ""

async def main():
    print("=== Step 1: Listing and Purging all resources in e-sbe/box/paragon_ladies ===")
    url = f'https://api.cloudinary.com/v1_1/{CLOUD_NAME}/resources/image/upload?prefix=e-sbe/box/paragon_ladies&max_results=500'
    req = urllib.request.Request(url, headers={'Authorization': f'Basic {b64_auth}'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pl_resources = [r['public_id'] for r in data.get('resources', [])]
            print(f"Found {len(pl_resources)} resources under e-sbe/box/paragon_ladies")
            delete_cloudinary_resources(pl_resources)
    except Exception as e:
        print(f"Error listing e-sbe/box/paragon_ladies: {e}")

    print("\n=== Step 2: Scanning all Paragon secondary image URLs ===")
    with open(STOCK_FILES[0], 'r', encoding='utf-8') as f:
        groups = json.load(f)

    # Collect all image URLs attached to Paragon products
    urls_to_products = {}
    for g in groups:
        gname = g.get('groupName', '')
        if gname in PARAGON_GROUPS or 'PARAGON' in gname.upper():
            for p in g.get('products', []):
                sec = p.get('secondaryImageUrl')
                if sec:
                    urls_to_products.setdefault(sec, []).append((gname, p.get('productName', '')))

    print(f"Total unique secondaryImageUrls in Paragon groups: {len(urls_to_products)}")

    bad_urls = set()
    urls_to_check = []

    for url, prods in urls_to_products.items():
        if 'e-sbe/box/paragon_ladies' in url or 'cubix' in url.lower() or 'cbx' in url.lower():
            bad_urls.add(url)
        else:
            urls_to_check.append(url)

    print(f"Immediately flagged {len(bad_urls)} URLs (paragon_ladies or cubix path).")
    print(f"Checking remaining {len(urls_to_check)} URLs with OCR...")

    # Process in batches
    batch_size = 15
    for i in range(0, len(urls_to_check), batch_size):
        batch = urls_to_check[i:i+batch_size]
        tasks = [inspect_and_ocr(u) for u in batch]
        results = await asyncio.gather(*tasks)
        for u, (is_cubix, reason, snippet) in zip(batch, results):
            if is_cubix:
                print(f"  FOUND CUBIX in Paragon URL: {u}")
                print(f"    Reason: {reason} | Text snippet: {snippet}")
                bad_urls.add(u)
        print(f"  Processed {min(i+batch_size, len(urls_to_check))}/{len(urls_to_check)} URLs...")

    print(f"\nTotal BAD Cubix URLs identified across Paragon: {len(bad_urls)}")

    # Extract public_ids from bad URLs on Cloudinary 2
    bad_public_ids = []
    for u in bad_urls:
        if f'res.cloudinary.com/{CLOUD_NAME}/image/upload/' in u:
            # Extract public_id
            m = re.search(r'/upload/(?:v\d+/)?(.+?)(?:\.[a-zA-Z0-9]+)?$', u)
            if m:
                bad_public_ids.append(m.group(1))

    print(f"Found {len(bad_public_ids)} Cloudinary 2 public_ids to delete.")
    delete_cloudinary_resources(bad_public_ids)

    print("\n=== Step 3: Cleansing stock-data.json across all repositories ===")
    for path in STOCK_FILES:
        if not os.path.exists(path):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            stock_groups = json.load(f)

        cleansed_count = 0
        for g in stock_groups:
            gname = g.get('groupName', '')
            if gname in PARAGON_GROUPS or 'PARAGON' in gname.upper():
                for p in g.get('products', []):
                    sec = p.get('secondaryImageUrl')
                    if sec and (sec in bad_urls or 'e-sbe/box/paragon_ladies' in sec or 'cubix' in sec.lower()):
                        p['secondaryImageUrl'] = None
                        cleansed_count += 1

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(stock_groups, f, indent=2, ensure_ascii=False)

        print(f"Cleansed {cleansed_count} bad entries from {path}")

    print("\nAll Cubix images purged and detached from Paragon successfully!")

if __name__ == '__main__':
    asyncio.run(main())
