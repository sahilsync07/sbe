import os
import re
import io
import json
import zipfile
import asyncio
import urllib.request
from datetime import datetime
from PIL import Image
import numpy as np
import winocr

EEKEN_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with EEKEN PHOTO SAMPLES .zip"
STOCK_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
PROGRESS_JSON = r"C:\Projects\sbe\frontend\scripts\eeken_live_progress.json"
STREAM_LOG = r"C:\Projects\sbe\frontend\scripts\eeken_live_stream.log"

CLOUD_NAME = 'dieqsg5tr'
UPLOAD_PRESET = 'e-sbe-pics'
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

CLUSTER_LADIES = {'4X7', '4X8', '5X8', '4*7', '4*8', '5*8', '4/8', '04/08', '4/7', '04/07'}
CLUSTER_GENTS = {'6X9', '6X10', '7X10', '8X10', '6*9', '6*10', '7*10', '8*10', '6/10', '06/10', '6/11', '06/11', '7/10', '07/10'}
CLUSTER_KIDS = {'11X13', '1X3', '1X4', '11*13', '1*3', '1*4', '11/13', '1/3', '1/4'}

COLOR_KEYS = {
    'BLACK': 'BLK', 'BLK': 'BLK',
    'BROWN': 'BRN', 'BRN': 'BRN',
    'TAN': 'TAN',
    'NAVY': 'NVY', 'NVY': 'NVY', 'BLUE': 'BLU', 'BLU': 'BLU',
    'RED': 'RED',
    'WHITE': 'WHT', 'WHT': 'WHT',
    'GREY': 'GRY', 'GRAY': 'GRY', 'GRY': 'GRY',
    'MUSTARD': 'MUSTARD', 'OLIVE': 'OLIVE', 'YELLOW': 'YLW', 'YLW': 'YLW',
    'BEIGE': 'BGE', 'BGE': 'BGE',
    'PINK': 'PNK', 'PNK': 'PNK'
}

def log_msg(msg):
    t = datetime.now().strftime("%H:%M:%S")
    formatted = f"[{t}] {msg}"
    print(formatted)
    with open(STREAM_LOG, 'a', encoding='utf-8') as f:
        f.write(formatted + "\n")

def extract_size(s):
    s = s.upper().replace(' ', '')
    for m in re.finditer(r'\(?([0-9]{1,2}[X\*\/-][0-9]{1,2})\)?', s):
        return m.group(1).replace('-', 'X')
    return None

def sizes_compatible(s1, s2):
    if not s1 or not s2:
        return True
    s1 = s1.upper().replace('*', 'X').replace('/', 'X').replace('-', 'X').lstrip('0')
    s2 = s2.upper().replace('*', 'X').replace('/', 'X').replace('-', 'X').lstrip('0')
    if s1 == s2:
        return True
    for cl in [CLUSTER_LADIES, CLUSTER_GENTS, CLUSTER_KIDS]:
        cl_clean = {x.replace('*', 'X').replace('/', 'X').replace('-', 'X').lstrip('0') for x in cl}
        if s1 in cl_clean and s2 in cl_clean:
            return True
    return False

def check_danger_banner(img):
    try:
        w, h = img.size
        if h > 0 and (w / h) < 0.48:
            return True
        top = img.crop((0, 0, w, max(1, int(h * 0.12)))).convert('L')
        bot = img.crop((0, min(h - 1, int(h * 0.88)), w, h)).convert('L')
        if np.mean(top) < 35 and np.mean(bot) < 35:
            return True
        return False
    except Exception:
        return True

async def upload_image_async(img_bytes, filename):
    loop = asyncio.get_event_loop()
    def _upload():
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        body = bytearray()
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode('utf-8'))
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\ne-sbe/eeken\r\n'.encode('utf-8'))
        
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
    log_msg("=== Starting EEKEN WhatsApp Streaming Engine ===")
    
    with open(STOCK_PATH, 'r', encoding='utf-8') as f:
        groups = json.load(f)
        
    eeken_grp = next((g for g in groups if g.get('groupName') == 'EEKEN'), None)
    if not eeken_grp:
        log_msg("EEKEN group not found in stock-data.json")
        return
        
    missing_prods = [p for p in eeken_grp['products'] if not p.get('secondaryImageUrl')]
    log_msg(f"Total EEKEN products missing secondaryImageUrl: {len(missing_prods)}")
    
    if not missing_prods:
        log_msg("All EEKEN products already have secondaryImageUrl!")
        return

    # Parse EEKEN WhatsApp chat text for direct photo-caption hints
    chat_captions = {}
    with zipfile.ZipFile(EEKEN_ZIP, 'r') as z:
        if 'WhatsApp Chat with EEKEN PHOTO SAMPLES .txt' in z.namelist():
            with z.open('WhatsApp Chat with EEKEN PHOTO SAMPLES .txt') as f:
                lines = [line.decode('utf-8', errors='ignore').strip() for line in f]
            cur_img = None
            for l in lines:
                m = re.search(r'(IMG-\d+-WA\d+\.jpg)\s+\(file attached\)', l)
                if m:
                    cur_img = m.group(1)
                elif cur_img and l and not re.match(r'^\d{1,2}/\d{1,2}/\d{2}', l):
                    chat_captions[cur_img] = l.strip()
                    cur_img = None

    log_msg(f"Extracted {len(chat_captions)} photo captions from EEKEN chat log.")

    progress_state = {
        "status": "running",
        "totalImages": 0,
        "processed": 0,
        "totalUploaded": 0,
        "recentlyUploaded": [],
        "lastUpdated": datetime.now().isoformat()
    }

    url_cache = {}
    matched_prods = set()

    with zipfile.ZipFile(EEKEN_ZIP, 'r') as z:
        all_imgs = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        progress_state["totalImages"] = len(all_imgs)
        log_msg(f"Scanning {len(all_imgs)} images in EEKEN zip...")

        for idx, img_name in enumerate(all_imgs):
            progress_state["processed"] += 1
            try:
                raw_data = z.read(img_name)
                img = Image.open(io.BytesIO(raw_data))
                
                # Danger check: status bar
                if check_danger_banner(img):
                    continue
                    
                # Run WinOCR
                res = await winocr.recognize_pil(img.convert('RGB'), 'en')
                ocr_txt = (res.text or "").upper()
                
                # Danger check: text
                if "SBE RAYAGADA" in ocr_txt or "QTY:" in ocr_txt:
                    continue

                # Combine OCR text and chat caption
                cap_txt = chat_captions.get(img_name, "").upper()
                combined_text = f"{ocr_txt} {cap_txt}"
                
                # Extract model numbers and sizes from image
                img_size = extract_size(combined_text)
                img_numbers = re.findall(r'\b\d{3,6}\b', combined_text)
                
                img_colors = set()
                for t in re.split(r'[^A-Z0-9]+', combined_text):
                    if t in COLOR_KEYS:
                        img_colors.add(COLOR_KEYS[t])

                # Match against missing EEKEN products
                for prod in missing_prods:
                    pname = prod['productName']
                    if pname in matched_prods:
                        continue
                    pname_upper = pname.upper()
                    prod_nums = re.findall(r'\b\d{3,6}\b', pname_upper)
                    prod_size = extract_size(pname)
                    
                    # Number match (handling leading zeros e.g. 02154 vs 2154 or 069 vs 69)
                    num_matched = False
                    for inum in img_numbers:
                        for pnum in prod_nums:
                            if inum == pnum or inum.lstrip('0') == pnum.lstrip('0'):
                                num_matched = True
                                break
                        if num_matched:
                            break
                            
                    if not num_matched:
                        continue
                        
                    # Size cluster check
                    if not sizes_compatible(img_size, prod_size):
                        continue
                        
                    # Color check
                    prod_colors = set()
                    for word in re.split(r'[^A-Z0-9]+', pname_upper):
                        if word in COLOR_KEYS:
                            prod_colors.add(COLOR_KEYS[word])
                            
                    if img_colors and prod_colors:
                        if not (img_colors & prod_colors):
                            continue

                    # Direct match confirmed!
                    # Upload image or reuse cached URL
                    if img_name not in url_cache:
                        clean_num = prod_nums[0] if prod_nums else 'EEKEN'
                        target_filename = f"EEKEN_{clean_num}_{img_name}"
                        uploaded_url = await upload_image_async(raw_data, target_filename)
                        url_cache[img_name] = uploaded_url
                        progress_state["totalUploaded"] += 1
                        log_msg(f"Uploaded [{progress_state['totalUploaded']}] {img_name} -> {uploaded_url}")
                    else:
                        uploaded_url = url_cache[img_name]

                    prod['secondaryImageUrl'] = uploaded_url
                    matched_prods.add(pname)
                    log_msg(f"Matched & Attached: {pname} -> {uploaded_url}")

                    recent = {
                        "product": pname,
                        "group": "EEKEN",
                        "url": uploaded_url,
                        "time": datetime.now().strftime("%H:%M:%S")
                    }
                    progress_state["recentlyUploaded"].insert(0, recent)
                    if len(progress_state["recentlyUploaded"]) > 25:
                        progress_state["recentlyUploaded"].pop()

            except Exception as e:
                pass

            if (idx + 1) % 50 == 0 or idx == len(all_imgs) - 1:
                progress_state["lastUpdated"] = datetime.now().isoformat()
                with open(PROGRESS_JSON, 'w', encoding='utf-8') as pf:
                    json.dump(progress_state, pf, indent=2)
                # Incremental save
                with open(STOCK_PATH, 'w', encoding='utf-8') as sf:
                    json.dump(groups, sf, indent=2, ensure_ascii=False)

    log_msg(f"=== Completed! Matched {len(matched_prods)} EEKEN products. Total uploaded: {progress_state['totalUploaded']} ===")
    progress_state["status"] = "completed"
    with open(PROGRESS_JSON, 'w', encoding='utf-8') as pf:
        json.dump(progress_state, pf, indent=2)
    with open(STOCK_PATH, 'w', encoding='utf-8') as sf:
        json.dump(groups, sf, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    asyncio.run(main())
