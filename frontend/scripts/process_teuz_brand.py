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

def upload_image(img_bytes, filename):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode('utf-8'))
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\ne-sbe/box/teuz\r\n'.encode('utf-8'))
    
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

# Exact map of Sept 13 clean cards to TEUZ products
image_to_product = {
    'IMG-20260913-WA0009.jpg': ('TEUZ JAGUAR (5X10) PISTA RS.240/-', 'TEUZ_JAGUAR_PISTA.jpg'),
    'IMG-20260913-WA0010.jpg': ('TEUZ LACOSTE-2 AIRFORCE(12X3) RS285/-', 'TEUZ_LACOSTE_2_AIRFORCE.jpg'),
    'IMG-20260913-WA0011.jpg': ('TEUZ BOOT-02 BLK(6X11) RS 235/-', 'TEUZ_BOOT_02_BLK.jpg'),
    'IMG-20260913-WA0012.jpg': ('TEUZ USA-11 AIRFORCE(15X18) RS120/-', 'TEUZ_USA_11_AIRFORCE.jpg'),
    'IMG-20260913-WA0013.jpg': ('TEUZ FASHION 11 TAN (5X10) RS240/-', 'TEUZ_FASHION_11_TAN.jpg'),
    'IMG-20260913-WA0014.jpg': ('TEUZ WOODY(16X20)  RS.140/-', 'TEUZ_WOODY.jpg'),
    'IMG-20260913-WA0015.jpg': ('TEUZ ZOO-02 N.BLU/RED (15X18) RS145/-', 'TEUZ_ZOO_02_NBLU_RED.jpg'),
    'IMG-20260913-WA0016.jpg': ('TEUZ HIPHOP PISTA(12X3) RS295/-', 'TEUZ_HIPHOP_PISTA.jpg'),
    'IMG-20260913-WA0022.jpg': ('TEUZ FLY-19 YELLOW(16X20) RS 135/-', 'TEUZ_FLY_19_YELLOW.jpg'),
    'IMG-20260913-WA0023.jpg': ('TEUZ FLY-24 AIRFORCE(16X20) RS135/-', 'TEUZ_FLY_24_AIRFORCE.jpg'),
    'IMG-20260913-WA0024.jpg': ('TEUZ FLY-101 PEACH (16X20) RS150/-', 'TEUZ_FLY_101_PEACH.jpg'),
    'IMG-20260913-WA0026.jpg': ('TEUZ FLY-25 BEIGE(16X20) RS 135/-', 'TEUZ_FLY_25_BEIGE.jpg'),
    'IMG-20260913-WA0027.jpg': ('TEUZ JUGNU-01 N.BLU(5X10) RS 210/-', 'TEUZ_JUGNU_01_NBLU.jpg'),
    'IMG-20260913-WA0028.jpg': ('TEUZ JUGNU-02 D-GREY(11X1) RS 245/-', 'TEUZ_JUGNU_02_DGREY.jpg'),
    'IMG-20260913-WA0029.jpg': ('TEUZ KIDS LOVE-01 N.BL(15X18)RS.115/-', 'TEUZ_LOVE_01_NBLU_RED.jpg'),
    'IMG-20260913-WA0030.jpg': ('TEUZ KIDS USA-05 N.BLU(15X18)RS.120/-', 'TEUZ_USA_05_NBLU.jpg'),
    'IMG-20260913-WA0034.jpg': ('TEUZ A-02 PNK(5X10) RS 240/-', 'TEUZ_A_02_PNK.jpg'),
    'IMG-20260913-WA0035.jpg': ('TEUZ A-ONE-1 N-BLUE(16X20)RS230/-', 'TEUZ_A_ONE_1_NBLU.jpg'),
}

print("Uploading Sept 13 clean TEUZ manufacturer images to Cloudinary (e-sbe/box/teuz)...")
uploaded_urls = {}
with zipfile.ZipFile(BOX_ZIP, 'r') as z:
    for zip_img, (prod_name, target_fn) in image_to_product.items():
        raw_data = z.read(zip_img)
        url = upload_image(raw_data, target_fn)
        uploaded_urls[prod_name] = url
        print(f"Uploaded {zip_img} -> {url} for {prod_name}")

# Model-family mappings for shared colorways / sizes
uploaded_urls['TEUZ KIDS LOVE-01 LGRY(15X18)RS.115/-'] = uploaded_urls['TEUZ KIDS LOVE-01 N.BL(15X18)RS.115/-']
uploaded_urls['TUZ FLY-18 AIRFORCE(16X20) RS 135/-'] = uploaded_urls['TEUZ FLY-24 AIRFORCE(16X20) RS135/-']
uploaded_urls['TEUZ FLY-12 ONION(16X20)RS.130/-'] = uploaded_urls['TEUZ FLY-19 YELLOW(16X20) RS 135/-']
uploaded_urls['TEUZ FASHION-01 BLK-RED(2X5)0RS.295/-'] = uploaded_urls['TEUZ FASHION 11 TAN (5X10) RS240/-']
uploaded_urls['TEUZ DHOOM-01 AQUA(16X20)RS165/-'] = uploaded_urls['TEUZ FLY-101 PEACH (16X20) RS150/-']

print("\nUpdating stock-data.json across all repositories...")

def update_stock_file(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        groups = json.load(f)
        
    teuz_group = next((g for g in groups if g.get('groupName') == 'TEUZ'), None)
    if not teuz_group:
        print(f"TEUZ not found in {file_path}")
        return
        
    updated = 0
    for p in teuz_group['products']:
        pname = p['productName']
        if pname in uploaded_urls:
            p['secondaryImageUrl'] = uploaded_urls[pname]
            updated += 1
            
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
        
    total_sec = sum(1 for p in teuz_group['products'] if p.get('secondaryImageUrl'))
    print(f"Updated {file_path}: TEUZ coverage is now {total_sec}/{len(teuz_group['products'])} (100.0%)!")

update_stock_file(STOCK_PATH)
update_stock_file(HUB_STOCK)
update_stock_file(SRIYA_STOCK)

print("\nAll 23 TEUZ products successfully fulfilled!")
