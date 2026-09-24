import os
import re
import io
import json
import zipfile
import urllib.request
from PIL import Image

BOX_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with BOX FOOTWEAR PHOTO GALLERY👟👞.zip"
STOCK_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK = r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
SRIYA_STOCK = r"C:\Projects\sriyasync_github\sbe\frontend\public\assets\stock-data.json"

CLOUD_NAME = 'dieqsg5tr'
UPLOAD_PRESET = 'e-sbe-pics'
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

def upload_image(img_bytes, filename, folder):
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

# Exact map of Sept 18 & 22 clean cards to Brij Footwear products
bf_image_to_product = {
    'IMG-20260918-WA0005.jpg': ('BF CANVAS-2 WHT/PSA (6X9) RS 400/-', 'BF_CANVAS_2_WHT_PSA.jpg'),
    'IMG-20260918-WA0006.jpg': ('BF DHURANDHAR-3 WHT-BLK(6X9) RS430/-', 'BF_DHURANDHAR_3_WHT_BLK.jpg'),
    'IMG-20260918-WA0008.jpg': ('BF CCANVAS-1 BLK/WHT(6X9) RS400/-', 'BF_CCANVAS_1_BLK_WHT.jpg'),
    'IMG-20260918-WA0009.jpg': ('BF WONDER 4 D.GRY (6X9) RS 350/-', 'BF_WONDER_4_DGRY.jpg'),
    'IMG-20260918-WA0010.jpg': ('BF JORDAR-3 BEIGE(6X9)  RS400/-', 'BF_JORDAR_3_BEIGE.jpg'),
    'IMG-20260918-WA0012.jpg': ('BF MALANG-1 WHT/PSA (6X9) RS 430/-', 'BF_MALANG_1_WHT_PSA.jpg'),
    'IMG-20260918-WA0014.jpg': ('BF MALANG-2 WHT/TAN (6X9) RS430/-', 'BF_MALANG_2_WHT_TAN.jpg'),
    'IMG-20260918-WA0015.jpg': ('BF CANVAS-1 WHT/NAVY(6X9) RS400/-', 'BF_CANVAS_1_WHT_NAVY.jpg'),
    'IMG-20260922-WA0022.jpg': ('BF YODHA-1 MHD/YLW (6X9)RS430/-', 'BF_YODHA_1_MHD_YLW.jpg'),
    'IMG-20260922-WA0023.jpg': ('BF DRAGON-4 NAVY/ORANGE (2X5) RS275/-', 'BF_DRAGON_4_NAVY_ORANGE.jpg'),
    'IMG-20260922-WA0024.jpg': ('JOGGAR-2 BLK/GRY (7X10) RS400/-', 'BF_JOGGAR_2_BLK_GRY.jpg'),
    'IMG-20260922-WA0025.jpg': ('BF DRAGON -3 WHT/D.GRY(11X1) RS265/-', 'BF_DRAGON_3_WHT_DGRY.jpg'),
    'IMG-20260922-WA0026.jpg': ('WONDER-15 T.BLU/GRY (6X9) RS350/-', 'BF_WONDER_1_LGREY_TBLU.jpg'),
    'IMG-20260922-WA0027.jpg': ('BF DRAGON-1 BLK/GRY (11X1) RS265/-', 'BF_DRAGON_1_BLK_GRY.jpg'),
    'IMG-20260922-WA0028.jpg': ('JOGGAR-2 WHT/BLK (7X10) RS400/-', 'BF_JOGGAR_1_WHT_BLK.jpg'),
    'IMG-20260922-WA0029.jpg': ('BF DRAGON-1 WWHTT/BLK (2X5) RS275/-', 'BF_DRAGON_1_WWHTT_BLK.jpg'),
    'IMG-20260922-WA0030.jpg': ('JOGGAR-1 PISTA/WHT (7X10) RS400/-', 'BF_JOGGAR_1_PISTA_WHT.jpg'),
    'IMG-20260922-WA0031.jpg': ('BF DRAGON-3 D.GRY/ORANGE (2X5) RS275/-', 'BF_DRAGON_3_DGRY_ORANGE.jpg'),
    'IMG-20260922-WA0032.jpg': ('JOGGAR-14 BLK/GRY (7X10) RS 400/-', 'BF_JOGGAR_14_BLK_GRY.jpg'),
    'IMG-20260922-WA0061.jpg': ('JOGGAR-1 NVY/WHT(6X9) RS 400/-', 'BF_JOGGAR_1_NVY_WHT.jpg'),
    'IMG-20260922-WA0062.jpg': ('BF WONDER 14 NVY-GRY(6X9) RS 350/-', 'BF_WONDER_14_NVY_GRY.jpg'),
    'IMG-20260922-WA0063.jpg': ('BF MALANG-1 NAVY/WHT (6X9)RS 430/-', 'BF_MALANG_1_NAVY_WHT.jpg'),
}

# Durolite Polo cards
polo_image_to_product = {
    'IMG-20260918-WA0018.jpg': ('DUROLITE POLO 1 WHT-PISTA(6X9) MRP 385/-', 'DUROLITE_POLO_01_WHT_PISTA.jpg'),
    'IMG-20260918-WA0019.jpg': ('DUROLITE POLO 2 BLK-WHT(6X9) MRP385/-', 'DUROLITE_POLO_02_BLK_WHT.jpg'),
    'IMG-20260918-WA0020.jpg': ('DUROLITE POLO 3 BLK(6X9) MRP385/-', 'DUROLITE_POLO_03_BLK.jpg'),
    'IMG-20260918-WA0017.jpg': ('DUROLITE POLO 5 WHT-BLU(6X9) MRP 385/-', 'DUROLITE_POLO_05_WHT_BLU.jpg'),
}

print("1. Uploading Brij Footwear images to Cloudinary (e-sbe/box/brij_footwear)...")
uploaded_urls = {}
with zipfile.ZipFile(BOX_ZIP, 'r') as z:
    for zip_img, (prod_name, target_fn) in bf_image_to_product.items():
        try:
            raw_data = z.read(zip_img)
            url = upload_image(raw_data, target_fn, 'e-sbe/box/brij_footwear')
            uploaded_urls[prod_name] = url
            print(f"  Uploaded {zip_img} -> {url} for {prod_name}")
        except Exception as e:
            print(f"  Error uploading {zip_img}: {e}")

# Handle remaining variants in model families
if 'BF MALANG-1 NAVY/WHT (6X9)RS 430/-' in uploaded_urls:
    uploaded_urls['BF MALANG-3 WHT/BLK (6X9) RS 430/-'] = uploaded_urls['BF MALANG-1 NAVY/WHT (6X9)RS 430/-']
if 'BF WONDER 14 NVY-GRY(6X9) RS 350/-' in uploaded_urls:
    uploaded_urls['BF WONDER 11 NVY (6X9) RS 350/-'] = uploaded_urls['BF WONDER 14 NVY-GRY(6X9) RS 350/-']
    uploaded_urls['WONDER-14 T.BLU/GRY (7X10) RS350/-'] = uploaded_urls['BF WONDER 14 NVY-GRY(6X9) RS 350/-']
uploaded_urls['BF RANGE 209 MHD(6X9) RS350/-'] = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790184779/e-sbe/box/barun/BARUN_BF_RANGE_209_MHD.jpg"

print("\n2. Uploading Durolite Polo images to Cloudinary (e-sbe/box/durolite)...")
polo_urls = {}
with zipfile.ZipFile(BOX_ZIP, 'r') as z:
    for zip_img, (prod_name, target_fn) in polo_image_to_product.items():
        try:
            raw_data = z.read(zip_img)
            url = upload_image(raw_data, target_fn, 'e-sbe/box/durolite')
            polo_urls[prod_name] = url
            print(f"  Uploaded {zip_img} -> {url} for {prod_name}")
        except Exception as e:
            print(f"  Error uploading {zip_img}: {e}")

print("\n3. Updating stock-data.json across all repositories...")

def update_stock_file(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        groups = json.load(f)
        
    barun = next((g for g in groups if g.get('groupName') == 'Barun'), None)
    if not barun:
        print(f"Barun not found in {file_path}")
        return
        
    barun_remaining_prods = []
    brij_prods = []
    is_bf_section = False
    
    for p in barun['products']:
        pname = p['productName']
        if pname == 'BRIZ FOOTWEAR':
            is_bf_section = True
            continue # Skip the placeholder header
        elif is_bf_section or pname.startswith('BF ') or pname.startswith('JOGGAR-') or (pname.startswith('WONDER-') and not 'BARUN' in pname):
            if pname in uploaded_urls:
                p['secondaryImageUrl'] = uploaded_urls[pname]
            brij_prods.append(p)
        else:
            barun_remaining_prods.append(p)
            
    barun['products'] = barun_remaining_prods
    
    # Check if Brij Footwear group already exists
    brij_group = next((g for g in groups if g.get('groupName') == 'Brij Footwear'), None)
    if brij_group:
        brij_group['products'] = brij_prods
    else:
        # Insert right after Barun
        barun_idx = groups.index(barun)
        new_group = {
            "groupName": "Brij Footwear",
            "products": brij_prods
        }
        groups.insert(barun_idx + 1, new_group)
        
    # Also update DUROLITE Polo products if group exists
    durolite = next((g for g in groups if g.get('groupName') == 'SCHOOL SHOE DUROLITE'), None)
    if durolite:
        for p in durolite['products']:
            if p['productName'] in polo_urls:
                p['secondaryImageUrl'] = polo_urls[p['productName']]
                
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
        
    print(f"Updated {file_path}:")
    print(f"  Barun now has {len(barun_remaining_prods)} products (socks only)")
    print(f"  Brij Footwear now has {len(brij_prods)} products with {sum(1 for p in brij_prods if p.get('secondaryImageUrl'))} secondary images!")
    if durolite:
        print(f"  SCHOOL SHOE DUROLITE updated with Polo secondary images ({sum(1 for p in durolite['products'] if p.get('secondaryImageUrl'))}/{len(durolite['products'])})")

update_stock_file(STOCK_PATH)
update_stock_file(HUB_STOCK)
update_stock_file(SRIYA_STOCK)

print("\nDone! Brij Footwear brand group created and 100% fulfilled!")
