import os
import re
import glob
import json
import io
import time
import urllib.request
import asyncio
from datetime import datetime
from PIL import Image
import numpy as np
import winocr

# Config
TG_DIR = r"C:\Users\Sahil Kumar\Downloads\Telegram Desktop\ChatExport_2026-09-23"
TG_PHOTOS = os.path.join(TG_DIR, "photos")
STOCK_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
PROGRESS_JSON = r"C:\Projects\sbe\frontend\scripts\paragon_live_progress.json"
STREAM_LOG = r"C:\Projects\sbe\frontend\scripts\paragon_live_stream.log"

CLOUD_NAME = 'dieqsg5tr'
UPLOAD_PRESET = 'e-sbe-pics'
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

CLUSTER_LADIES = {'4X7', '4X8', '5X8', '4*7', '4*8', '5*8'}
CLUSTER_GENTS = {'6X9', '6X10', '7X10', '8X10', '6*9', '6*10', '7*10', '8*10', '6/10', '06/10', '7/10', '07/10'}
CLUSTER_KIDS = {'11X13', '1X3', '1X4', '11*13', '1*3', '1*4'}
CLUSTER_TODDLER = {'15X18', '16X20', '15*18', '16*20'}

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

def log_msg(msg):
    t = datetime.now().strftime("%H:%M:%S")
    formatted = f"[{t}] {msg}"
    print(formatted)
    with open(STREAM_LOG, 'a', encoding='utf-8') as f:
        f.write(formatted + "\n")

def extract_size(s):
    s = s.upper().replace(' ', '')
    for m in re.finditer(r'\(?([0-9]{1,2}[X\*\/][0-9]{1,2})\)?', s):
        return m.group(1)
    return None

def sizes_compatible(s1, s2):
    if not s1 or not s2:
        return True
    s1 = s1.upper().replace('*', 'X').replace('/', 'X')
    s2 = s2.upper().replace('*', 'X').replace('/', 'X')
    if s1 == s2:
        return True
    for cl in [CLUSTER_LADIES, CLUSTER_GENTS, CLUSTER_KIDS, CLUSTER_TODDLER]:
        cl_clean = {x.replace('*', 'X').replace('/', 'X') for x in cl}
        if s1 in cl_clean and s2 in cl_clean:
            return True
    return False

def check_danger_banner(img_path):
    try:
        img = Image.open(img_path)
        w, h = img.size
        # Ultra tall status screenshots (20:9 or 21:9)
        if h > 0 and (w / h) < 0.48:
            return True
        top = img.crop((0, 0, w, max(1, int(h * 0.12)))).convert('L')
        bot = img.crop((0, min(h - 1, int(h * 0.88)), w, h)).convert('L')
        if np.mean(top) < 35 and np.mean(bot) < 35:
            return True # solid black status header and footer
        return False
    except Exception:
        return True

async def upload_image_async(img_bytes, filename, folder='e-sbe/paragon'):
    loop = asyncio.get_event_loop()
    def _upload():
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        body = bytearray()
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode('utf-8'))
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n{folder}\r\n'.encode('utf-8'))
        
        base_id = os.path.splitext(filename)[0]
        clean_id = re.sub(r'[^a-zA-Z0-9_-]', '_', base_id)
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="public_id"\r\n\r\n{clean_id}\r\n'.encode('utf-8'))
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
        body.extend(img_bytes)
        body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
        
        req = urllib.request.Request(UPLOAD_URL, data=bytes(body))
        req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
        with urllib.request.urlopen(req, timeout=30) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            return res.get('secure_url')
            
    return await loop.run_in_executor(None, _upload)

async def main():
    log_msg("=== Starting Paragon / EEKEN / P-TOES Telegram Live Streaming Engine ===")
    
    # 1. Parse HTML captions
    full_photos = set(f for f in os.listdir(TG_PHOTOS) if not f.endswith("_thumb.jpg"))
    html_files = sorted(glob.glob(os.path.join(TG_DIR, "messages*.html")))
    
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

    log_msg(f"Extracted {len(photos_with_caption)} photo-caption pairs from Telegram HTML export.")
    
    # 2. Load stock data
    with open(STOCK_PATH, 'r', encoding='utf-8') as f:
        groups = json.load(f)
        
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
    log_msg(f"Catalog missing products to fulfill: {len(missing_products)}")
    
    # 3. Match items with strict guards
    matched_mapping = {} # fn -> list of product dicts
    assigned_prods = set()
    
    for fn, cap in photos_with_caption:
        full_p = os.path.join(TG_PHOTOS, fn)
        if not os.path.exists(full_p):
            continue
            
        # Danger check
        if check_danger_banner(full_p):
            continue
            
        cap_clean = re.sub(r'^[0-9_]+', '', cap).strip().upper()
        tokens = [t for t in re.split(r'[^A-Z0-9]+', cap_clean) if t]
        cap_size = extract_size(cap)
        numbers = [t for t in tokens if t.isdigit() and len(t) >= 3]
        
        cap_colors = set()
        for t in tokens:
            if t in COLOR_KEYS:
                cap_colors.add(COLOR_KEYS[t])
                
        for prod in missing_products:
            pname = prod['name']
            if pname in assigned_prods:
                continue
            pname_upper = pname.upper()
            prod_size = extract_size(pname)
            
            if not sizes_compatible(cap_size, prod_size):
                continue
                
            prod_colors = set()
            for word in re.split(r'[^A-Z0-9]+', pname_upper):
                if word in COLOR_KEYS:
                    prod_colors.add(COLOR_KEYS[word])
                    
            if cap_colors and prod_colors:
                if not (cap_colors & prod_colors):
                    continue
                    
            if numbers:
                num = numbers[0]
                if re.search(r'\b' + num + r'\b', pname_upper) or num in pname_upper:
                    brand_ok = False
                    brand_keywords = ['PARAGON', 'VERTEX', 'SOLEA', 'EEKEN', 'P-TOES', 'PTOES', 'PARALITE', 'MAX', 'COMFY', 'SLICKERS', 'FENDER', 'STIMULUS']
                    for bk in brand_keywords:
                        if bk in cap_clean and (bk in pname_upper or prod['group'] in ['PARAGON GENTS', 'PARAGON LADIES', 'PARALITE', 'EEKEN', 'P-TOES', 'SOLEA DISC 40% OFFER']):
                            brand_ok = True
                            break
                    if brand_ok:
                        matched_mapping.setdefault(fn, []).append((prod, cap))
                        assigned_prods.add(pname)

    total_matched_products = len(assigned_prods)
    total_unique_photos = len(matched_mapping)
    log_msg(f"Matching Complete: {total_matched_products} products matched across {total_unique_photos} unique photos!")
    
    # 4. Upload photos to Cloudinary in batches and update stock data
    uploaded_cache = {}
    progress_state = {
        "status": "uploading",
        "totalPhotos": total_unique_photos,
        "uploadedPhotos": 0,
        "totalProductsMatched": total_matched_products,
        "updatedProducts": 0,
        "recentlyUploaded": [],
        "lastUpdated": datetime.now().isoformat()
    }
    
    # Save initial progress
    with open(PROGRESS_JSON, 'w', encoding='utf-8') as f:
        json.dump(progress_state, f, indent=2)
        
    batch_size = 5
    photo_list = list(matched_mapping.items())
    
    for idx in range(0, len(photo_list), batch_size):
        chunk = photo_list[idx:idx + batch_size]
        
        async def handle_photo(fn, prod_cap_list):
            full_path = os.path.join(TG_PHOTOS, fn)
            with open(full_path, 'rb') as f:
                img_data = f.read()
                
            # Verify zero danger text using WinOCR before uploading
            pil_img = Image.open(io.BytesIO(img_data)).convert('RGB')
            ocr_res = await winocr.recognize_pil(pil_img, 'en')
            ocr_txt = (ocr_res.text or "").upper()
            if "SBE RAYAGADA" in ocr_txt or "QTY:" in ocr_txt:
                log_msg(f"REJECTED {fn}: Detected danger text in OCR ('SBE RAYAGADA' or 'QTY:')")
                return None
                
            sample_cap = prod_cap_list[0][1]
            clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', sample_cap[:30]).strip('_')
            target_fn = f"PG_{clean_name}_{fn}"
            
            # Determine folder by primary matched group
            grp = prod_cap_list[0][0]['group']
            target_folder = 'e-sbe/paragon'
            if 'EEKEN' in grp:
                target_folder = 'e-sbe/eeken'
            elif 'P-TOES' in grp:
                target_folder = 'e-sbe/ptoes'
                
            url = await upload_image_async(img_data, target_fn, folder=target_folder)
            return fn, url, prod_cap_list

        tasks = [handle_photo(fn, pcl) for fn, pcl in chunk]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if not res or isinstance(res, Exception):
                if isinstance(res, Exception):
                    log_msg(f"Upload error: {str(res)}")
                continue
            fn, url, prod_cap_list = res
            uploaded_cache[fn] = url
            progress_state["uploadedPhotos"] += 1
            
            for prod_dict, cap in prod_cap_list:
                p_obj = prod_dict['p_obj']
                if not p_obj.get('secondaryImageUrl'):
                    p_obj['secondaryImageUrl'] = url
                    progress_state["updatedProducts"] += 1
                    
                    recent_entry = {
                        "product": prod_dict['name'],
                        "group": prod_dict['group'],
                        "url": url,
                        "time": datetime.now().strftime("%H:%M:%S")
                    }
                    progress_state["recentlyUploaded"].insert(0, recent_entry)
                    if len(progress_state["recentlyUploaded"]) > 25:
                        progress_state["recentlyUploaded"].pop()
                        
            log_msg(f"Uploaded [{progress_state['uploadedPhotos']}/{total_unique_photos}] {fn} -> {url} (Attached to {len(prod_cap_list)} products)")

        progress_state["lastUpdated"] = datetime.now().isoformat()
        with open(PROGRESS_JSON, 'w', encoding='utf-8') as f:
            json.dump(progress_state, f, indent=2)

    # 5. Save updated stock data
    log_msg("Saving updated stock-data.json...")
    with open(STOCK_PATH, 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
        
    progress_state["status"] = "completed"
    progress_state["lastUpdated"] = datetime.now().isoformat()
    with open(PROGRESS_JSON, 'w', encoding='utf-8') as f:
        json.dump(progress_state, f, indent=2)
        
    log_msg(f"=== ALL DONE! Attached secondaryImageUrl to {progress_state['updatedProducts']} products across {progress_state['uploadedPhotos']} photos ===")

if __name__ == '__main__':
    asyncio.run(main())
