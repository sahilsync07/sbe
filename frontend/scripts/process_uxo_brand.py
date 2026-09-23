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
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\ne-sbe/box/uxo\r\n'.encode('utf-8'))
    
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

# Exact map of Sept 12 images to UXO products
image_to_product = {
    'IMG-20260912-WA0067.jpg': ('UXO BOOMER-02 N.BLU,SKY(6X10)RS.395/-', 'UXO_BOOMER_02_NBLU_SKY.jpg'),
    'IMG-20260912-WA0068.jpg': ('UXO RIDER-03 L.GRY(6X10)RS.340/-', 'UXO_RIDER_03_LGRY.jpg'),
    'IMG-20260912-WA0069.jpg': ('UXO AIR-02 S.GRN,ORNG(6X10) RS.395/-', 'UXO_AIR_02_SGRN_ORNG.jpg'),
    'IMG-20260912-WA0070.jpg': ('UXO AIR-02 WHT,BLK(6X10) RS395/-', 'UXO_AIR_02_WHT_BLK.jpg'),
    'IMG-20260912-WA0071.jpg': ('STRIKER-03 N.BLU(6X10) RS375/-', 'UXO_STRIKER_03_NBLU.jpg'),
    'IMG-20260912-WA0072.jpg': ('UXO BOUNCER-01 WHT,PISTA (6X10) RS365/-', 'UXO_BOUNCER_01_WHT_PISTA.jpg'),
    'IMG-20260912-WA0073.jpg': ('UXO STRIKER-06 D.GREY(6X10) RS375/-', 'UXO_STRIKER_06_DGREY.jpg'),
    'IMG-20260912-WA0074.jpg': ('UXO RAFTAAR-03N.BLU (6X10) RS365/-', 'UXO_RAFTAAR_03_NBLU.jpg'),
    'IMG-20260912-WA0076.jpg': ('UXO RAFTAAR 05 BLK/GOLD (6X10) RS365/-', 'UXO_RAFTAAR_05_BLK_GOLD.jpg'),
    'IMG-20260912-WA0078.jpg': ('UXO HUNTER-02 AIRFORCE (6X10) RS340/-', 'UXO_HUNTER_02_AIRFORCE.jpg'),
}

print("Uploading UXO manufacturer images to Cloudinary (e-sbe/box/uxo)...")
uploaded_urls = {}
with zipfile.ZipFile(BOX_ZIP, 'r') as z:
    for zip_img, (prod_name, target_fn) in image_to_product.items():
        raw_data = z.read(zip_img)
        url = upload_image(raw_data, target_fn)
        uploaded_urls[prod_name] = url
        print(f"Uploaded {zip_img} -> {url} for {prod_name}")

# Also handle shared colorways/variants within same model
# UXO HUNTER-04 N.BLU WHT can share Hunter 02 image
uploaded_urls['UXO HUNTER-04 N.BLU WHT (6X10) RS340/-'] = uploaded_urls['UXO HUNTER-02 AIRFORCE (6X10) RS340/-']
# UXO BOOMER-03 GRY,ORNG can share Boomer 02 image
uploaded_urls['UXO BOOMER-03 GRY,ORNG (6X10) RS395/-'] = uploaded_urls['UXO BOOMER-02 N.BLU,SKY(6X10)RS.395/-']

print("\nExtracting UXO into its own dedicated Brand Group in stock-data.json...")

def update_stock_file(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        groups = json.load(f)
        
    uam = next((g for g in groups if g.get('groupName') == 'UAM FOOTWEAR'), None)
    if not uam:
        print(f"UAM FOOTWEAR not found in {file_path}")
        return
        
    uam_remaining_prods = []
    uxo_prods = []
    
    for p in uam['products']:
        pname = p['productName']
        if pname == 'UXO':
            continue # Remove placeholder group header product
        elif any(k in pname.upper() for k in ['UXO', 'STRIKER', 'RAFTAAR', 'HUNTER', 'BOOMER', 'BOUNCER', 'RIDER', 'AIR-02']):
            if pname in uploaded_urls:
                p['secondaryImageUrl'] = uploaded_urls[pname]
            uxo_prods.append(p)
        else:
            uam_remaining_prods.append(p)
            
    uam['products'] = uam_remaining_prods
    
    # Check if UXO group already exists
    uxo_group = next((g for g in groups if g.get('groupName') == 'UXO'), None)
    if uxo_group:
        uxo_group['products'] = uxo_prods
    else:
        # Insert UXO right after UAM FOOTWEAR
        uam_idx = groups.index(uam)
        new_uxo_group = {
            "groupName": "UXO",
            "products": uxo_prods
        }
        groups.insert(uam_idx + 1, new_uxo_group)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
        
    print(f"Updated {file_path}:")
    print(f"  UAM FOOTWEAR now has {len(uam_remaining_prods)} products")
    print(f"  UXO now has {len(uxo_prods)} products with {sum(1 for p in uxo_prods if p.get('secondaryImageUrl'))} secondary images!")

update_stock_file(STOCK_PATH)
update_stock_file(HUB_STOCK)
update_stock_file(SRIYA_STOCK)

print("\nDone! UXO brand successfully created and fulfilled!")
