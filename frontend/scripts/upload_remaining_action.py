import zipfile
import io
import json
import os
import urllib.request
import re
from PIL import Image

zpath = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with Action Synergy.zip"
stock_path = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"

CLOUD_NAME = 'dieqsg5tr'
UPLOAD_PRESET = 'e-sbe-pics'
UPLOAD_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

def upload_image(img_bytes, filename):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode('utf-8'))
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\ne-sbe/action\r\n'.encode('utf-8'))
    
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

new_uploads = {
    'IMG-20260216-WA0032.jpg': 'ACTION_COMBO.jpg',
    'IMG-20260216-WA0021.jpg': 'ACTION_JUST.jpg',
    'IMG-20260216-WA0039.jpg': 'ACTION_VELFAIR_BLK.jpg',
    'IMG-20260410-WA0109.jpg': 'ACTION_KAVA_BLK_GRY.jpg',
    'IMG-20260423-WA0051.jpg': 'ACTION_KAVA_GRY_BLK.jpg',
    'IMG-20260410-WA0110.jpg': 'ACTION_RIDE_BLK_BRN.jpg',
    'IMG-20260410-WA0111.jpg': 'ACTION_RIDE_GRY_BLK.jpg',
    'IMG-20260423-WA0043.jpg': 'ACTION_TECH_NBLU_WHT.jpg',
    'IMG-20260423-WA0044.jpg': 'ACTION_KINDLE_NVY_DGRY.jpg',
    'IMG-20260423-WA0047.jpg': 'ACTION_KINDLE_BLK_DGRY.jpg',
    'IMG-20260508-WA0030.jpg': 'ACTION_REFOAM_NVY.jpg',
    'IMG-20260508-WA0031.jpg': 'ACTION_REFOAM_GRY.jpg',
    'IMG-20260508-WA0034.jpg': 'ACTION_FLORA_BLK.jpg',
    'IMG-20260523-WA0989.jpg': 'ACTION_HECTOR.jpg'
}

print("Checking and uploading new Action images...")
uploaded_urls = {}
with zipfile.ZipFile(zpath, 'r') as z:
    for zip_img, target_name in new_uploads.items():
        data = z.read(zip_img)
        # Danger verify
        img = Image.open(io.BytesIO(data))
        w, h = img.size
        assert w / h >= 0.58, f"Image {zip_img} has status screenshot aspect ratio!"
        url = upload_image(data, target_name)
        uploaded_urls[zip_img] = url
        print(f"Uploaded {zip_img} as {target_name} -> {url}")

print("\nUploading complete. Mapping all 28 missing Action products...")

# Complete mapping for all 28 missing Action items:
action_full_map = {
    # Existing uploaded Cloudinary images
    'ACTION AXEL NBLU/GRY(7X10)MRP299/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150938/e-sbe/action/ACTION_AXEL_BLK_WHT.jpg',
    'ACTION WALKER NEW GRY(7X10)MRP187/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150943/e-sbe/action/ACTION_WALKER_BRN.jpg',
    'ACTION WALKER NEW BLK(6X9)MRP187/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150943/e-sbe/action/ACTION_WALKER_BRN.jpg',
    'ACTION CASIO(7X10) NV MRP699/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150945/e-sbe/action/ACTION_CASIO_WHT_BLK.jpg',
    'NIKHIL HANDFREE NAVY (6X110) MRP749/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150949/e-sbe/action/ACTION_ACTON_HANDFREE_DGRY.jpg',
    'NIKHIL HANDFREE BLK(6X10) MRP735/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150949/e-sbe/action/ACTION_ACTON_HANDFREE_DGRY.jpg',
    'ACTION MEGRAZ LGRY(7X10)MRP249/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790150932/e-sbe/action/ACTION_MEGREZ_WHT.jpg',
    'ACTION EASY WALK DGRY(7X10)MRP249/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151256/e-sbe/action/ACTION_EASY_WALK_MHD.jpg',
    'ACTION  EASY WALK BLK(7X10)MRP233/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151256/e-sbe/action/ACTION_EASY_WALK_MHD.jpg',
    'ACTION EASY WALK D.GRY(6X9)MRP233/-': 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151256/e-sbe/action/ACTION_EASY_WALK_MHD.jpg',
    
    # Newly uploaded Cloudinary images
    'ACTION COMBO (6X10) D.GRY MRP655/-': uploaded_urls['IMG-20260216-WA0032.jpg'],
    'ACTION COMBO (6X10) NVY MRP655/-': uploaded_urls['IMG-20260216-WA0032.jpg'],
    'ACTION JUST (7X10) NVY MRP655/-': uploaded_urls['IMG-20260216-WA0021.jpg'],
    'ACTION VELFAIR (6X10) BLK MRP655/-': uploaded_urls['IMG-20260216-WA0039.jpg'],
    'ACTION KAVA BLK GRY (6X10) MRP399/-': uploaded_urls['IMG-20260410-WA0109.jpg'],
    'ACTION KAVA GRY/BLK (6X10)MRP399/-': uploaded_urls['IMG-20260423-WA0051.jpg'],
    'ACTION KAVA GRY/AIRFORCE (6X10)MRP399/-': uploaded_urls['IMG-20260423-WA0051.jpg'],
    'ACTION KAVA NVY/AIRFORCE (6X10)MRP399/-': uploaded_urls['IMG-20260410-WA0109.jpg'],
    'ACTION RIDE BLK BRN(6X10) MRP399/-': uploaded_urls['IMG-20260410-WA0110.jpg'],
    'ACTION RIDE GRY BLK(6X10)MRP399/-': uploaded_urls['IMG-20260410-WA0111.jpg'],
    'ACTION TECH NBLU/WHT(6X10)MRP349/-': uploaded_urls['IMG-20260423-WA0043.jpg'],
    'ACTION KIDLE NVY/DGRY(6X10)MRP349/-': uploaded_urls['IMG-20260423-WA0044.jpg'],
    'ACTION KIDLE BLK/DGRY(6X10)MRP399/-': uploaded_urls['IMG-20260423-WA0047.jpg'],
    'ACTION REFOAM NVY(7X10)MRP233/-': uploaded_urls['IMG-20260508-WA0030.jpg'],
    'ACTION REFOAM GRY(7X10)MRP233/-': uploaded_urls['IMG-20260508-WA0031.jpg'],
    'ACTION FLORA BLK(5X8)MRP280/-': uploaded_urls['IMG-20260508-WA0034.jpg'],
    'ACTION HECTOR LGRY(7X10)MRP233/-': uploaded_urls['IMG-20260523-WA0989.jpg'],
    'ACTION HECTOR GRY(7X10)MRP233/-': uploaded_urls['IMG-20260523-WA0989.jpg']
}

with open(stock_path, 'r', encoding='utf-8') as f:
    groups = json.load(f)

action_grp = next(g for g in groups if g['groupName'] == 'ACTION')
prods = action_grp['products']

updated_count = 0
for p in prods:
    name = p['productName']
    if name in action_full_map and not p.get('secondaryImageUrl'):
        p['secondaryImageUrl'] = action_full_map[name]
        updated_count += 1
        print(f"Set secondaryImageUrl for: {name}")

with open(stock_path, 'w', encoding='utf-8') as f:
    json.dump(groups, f, indent=2, ensure_ascii=False)

print(f"\nSuccessfully attached secondaryImageUrl to {updated_count} Action items!")
total_with_sec = sum(1 for p in prods if p.get('secondaryImageUrl'))
print(f"Action group new coverage: {total_with_sec}/{len(prods)} ({total_with_sec/len(prods)*100:.1f}%)")
