import os
import sys
import json
import re
import asyncio
import urllib.request
import urllib.parse
from PIL import Image
import cv2
import numpy as np
import winocr

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PHOTO_DIR = r"C:\Projects\Footwear Samples Comeback\Article_Photos"
STOCK_DATA_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK_DATA_PATH = r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\upload_report.json"

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
ASSET_FOLDER = "e-sbe"

COLOR_KEYWORDS = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BRN': ['BRN', 'BROWN'],
    'TAN': ['TAN', 'CAMEL', 'CARAMEL', 'CHIKKU', 'CHIKU'],
    'PNK': ['PNK', 'PINK'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'SKY'],
    'GRY': ['GRY', 'GREY', 'GRAY'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM', 'BEG', 'BGE', 'BEIGE', 'BISCUITE', 'PEANUT', 'PNUT'],
    'GLD': ['GLD', 'GOLD', 'COPPER', 'MST', 'MUSTARD', 'KAKKI', 'FOSSIL', 'SULTAN']
}

def detect_shoe_color(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return 'UNKNOWN', 0, 0, 0
    h, w = img.shape[:2]
    # Center 60% contains the footwear
    crop = img[int(h * 0.25):int(h * 0.75), int(w * 0.2):int(w * 0.8)]
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)

    # Filter out light/white background
    bg_mask = (hsv[:, :, 1] < 45) & (hsv[:, :, 2] > 180)
    shoe_rgb = rgb[~bg_mask]
    shoe_hsv = hsv[~bg_mask]

    if len(shoe_rgb) == 0:
        return 'UNKNOWN', 0, 0, 0

    # K-means clustering (k=3)
    data = np.float32(shoe_rgb)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(data, 3, None, criteria, 5, cv2.KMEANS_RANDOM_CENTERS)
    counts = np.bincount(labels.flatten())
    sorted_indices = np.argsort(-counts)

    # Classify based on the dominant cluster (or non-black if upper has color)
    best_color = 'UNKNOWN'
    best_h, best_s, best_v = 0, 0, 0

    for idx in sorted_indices:
        center = centers[idx]
        hsv_c = cv2.cvtColor(np.uint8([[center]]), cv2.COLOR_RGB2HSV)[0][0]
        h_val, s_val, v_val = int(hsv_c[0]), int(hsv_c[1]), int(hsv_c[2])

        # Classification rules in OpenCV HSV (H: 0-180, S: 0-255, V: 0-255)
        color = 'UNKNOWN'
        if v_val < 50 or (s_val < 40 and v_val < 75):
            color = 'BLK'
        elif s_val < 35 and v_val > 175:
            color = 'WHT'
        elif s_val < 35:
            color = 'GRY'
        elif 35 <= h_val <= 85:
            color = 'GRN'
        elif 90 <= h_val <= 135:
            color = 'BLU'
        elif 145 <= h_val <= 175 and v_val > 120 and s_val > 25:
            color = 'PNK'
        elif (h_val >= 165 or h_val <= 8) and s_val > 55 and v_val < 130:
            color = 'MRN'
        elif 8 <= h_val <= 25 and v_val < 130 and s_val > 50:
            color = 'BRN'
        elif 10 <= h_val <= 30 and v_val >= 120 and s_val > 40:
            color = 'TAN'
        elif 25 <= h_val <= 40 and s_val > 70:
            color = 'GLD'

        if color != 'UNKNOWN':
            best_color = color
            best_h, best_s, best_v = h_val, s_val, v_val
            break

    return best_color, best_h, best_s, best_v

def upload_image_to_cloudinary(file_path):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(file_path)

    body = bytearray()
    # upload_preset
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode())
    # folder
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="folder"\r\n\r\n{ASSET_FOLDER}\r\n'.encode())
    # file
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = json.loads(resp.read().decode())
                return resp_data.get("secure_url")
        except Exception as e:
            if attempt == 2:
                raise e
            asyncio.sleep(1)
    return None

async def main():
    print(f"Loading stock data from: {STOCK_DATA_PATH}")
    with open(STOCK_DATA_PATH, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    # Flatten all products
    all_products = []
    for group in stock_data:
        gname = group.get("groupName", "")
        for prod in (group.get("products") or []):
            all_products.append({"group": gname, "product": prod})

    files = sorted([f for f in os.listdir(PHOTO_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    print(f"Found {len(files)} photos in {PHOTO_DIR}\n")

    results = []
    matched_count = 0
    uploaded_count = 0

    for i, fname in enumerate(files, 1):
        fpath = os.path.join(PHOTO_DIR, fname)
        print(f"[{i}/{len(files)}] Processing: {fname}")

        # 1. OCR Extraction
        ocr_text = ""
        try:
            pil_img = Image.open(fpath)
            ocr_res = await winocr.recognize_pil(pil_img, 'en')
            ocr_text = ocr_res.text if ocr_res else ""
        except Exception as e:
            print(f"   ⚠️ OCR failed: {e}")

        # 2. Footwear Color Detection
        det_color, h_val, s_val, v_val = detect_shoe_color(fpath)
        print(f"   🔍 OCR: '{ocr_text.strip()}'")
        print(f"   🎨 Detected Color: {det_color} (H={h_val}, S={s_val}, V={v_val})")

        # 3. Model number extraction
        # Try from filename first: e.g. CBX_10100_BLK_... or CUBIX_E-24511_... or CUBIX_L-76512_...
        base_name = os.path.splitext(fname)[0]
        parts = base_name.split("_")
        
        # Model pattern in filename
        model = None
        for p in parts:
            if re.search(r'^[A-Za-z]?\d{3,6}', p) or re.search(r'^[A-Za-z]-\d{3,6}', p):
                model = p
                break
        
        # If not found in filename, try OCR
        if not model and ocr_text:
            m = re.search(r'\b([A-Za-z]?\d{4,6})\b', ocr_text)
            if m:
                model = m.group(1)

        # Color token in filename
        file_color = None
        for p in parts:
            clean_p = p.replace('-', '').strip().upper()
            for code, aliases in COLOR_KEYWORDS.items():
                if clean_p in aliases:
                    file_color = code
                    break
            if file_color:
                break

        # 4. Find matching products in stock_data
        candidates = []
        if model:
            clean_model = re.sub(r'^[A-Za-z]-', '', model).upper()
            for item in all_products:
                pname = item["product"]["productName"].upper()
                if model.upper() in pname or clean_model in pname:
                    candidates.append(item)

        matched_item = None
        # Preference 1: Match by Model + Detected Color
        if det_color != 'UNKNOWN':
            det_aliases = COLOR_KEYWORDS.get(det_color, [det_color])
            for c in candidates:
                pname = c["product"]["productName"].upper()
                if any(alias in pname for alias in det_aliases):
                    matched_item = c
                    break

        # Preference 2: Match by Model + Filename Color
        if not matched_item and file_color:
            file_aliases = COLOR_KEYWORDS.get(file_color, [file_color])
            for c in candidates:
                pname = c["product"]["productName"].upper()
                if any(alias in pname for alias in file_aliases):
                    matched_item = c
                    break

        # Preference 3: If only 1 candidate model exists, match it
        if not matched_item and len(candidates) == 1:
            matched_item = candidates[0]

        # Preference 4: First candidate as fallback
        if not matched_item and len(candidates) > 0:
            matched_item = candidates[0]

        if matched_item:
            matched_count += 1
            prod = matched_item["product"]
            print(f"   ✓ Matched: [{matched_item['group']}] {prod['productName']}")

            # 5. Upload to Cloudinary
            try:
                secure_url = upload_image_to_cloudinary(fpath)
                if secure_url:
                    uploaded_count += 1
                    prod["secondaryImageUrl"] = secure_url
                    print(f"   ☁️ Uploaded: {secure_url}")
                    results.append({
                        "file": fname,
                        "model": model,
                        "detectedColor": det_color,
                        "fileColor": file_color,
                        "ocrText": ocr_text,
                        "matchedProduct": prod["productName"],
                        "group": matched_item["group"],
                        "secondaryImageUrl": secure_url,
                        "status": "SUCCESS"
                    })
                else:
                    results.append({
                        "file": fname,
                        "model": model,
                        "detectedColor": det_color,
                        "matchedProduct": prod["productName"],
                        "status": "UPLOAD_FAILED"
                    })
            except Exception as up_err:
                print(f"   ❌ Upload error: {up_err}")
                results.append({
                    "file": fname,
                    "model": model,
                    "detectedColor": det_color,
                    "matchedProduct": prod["productName"],
                    "status": f"ERROR: {str(up_err)}"
                })
        else:
            print(f"   ⚠️ No match found for model: {model}")
            results.append({
                "file": fname,
                "model": model,
                "detectedColor": det_color,
                "fileColor": file_color,
                "ocrText": ocr_text,
                "matchedProduct": None,
                "status": "NO_MATCH"
            })

    # 6. Save updated stock data
    print(f"\n==========================================")
    print(f"Total files: {len(files)}")
    print(f"Matched: {matched_count}")
    print(f"Uploaded: {uploaded_count}")
    print(f"Saving updated stock-data.json...")

    with open(STOCK_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2)

    try:
        with open(HUB_STOCK_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(stock_data, f, indent=2)
        print(f"Updated hub stock-data.json at: {HUB_STOCK_DATA_PATH}")
    except Exception as e:
        print(f"Hub stock data save warning: {e}")

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Saved full report to: {REPORT_PATH}")

if __name__ == "__main__":
    asyncio.run(main())
