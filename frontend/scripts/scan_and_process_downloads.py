import os
import sys
import json
import re
import asyncio
from PIL import Image
import cv2
import numpy as np
import winocr

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

TARGET_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures"
STOCK_DATA_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\downloads_analysis_report.json"

COLOR_KEYWORDS = {
    'BLK': ['BLK', 'BLACK', 'BK'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN'],
    'TAN': ['TAN', 'CAMEL', 'CARAMEL', 'CHIKKU', 'CHIKU'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE', 'BURGUNDY'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'MEHANDI', 'MHD'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'SKY', 'R_BLUE', 'AIRFORCE', 'TURQUOISE'],
    'GRY': ['GRY', 'GREY', 'GRAY', 'SLATE'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM', 'BEG', 'BGE', 'BEIGE', 'BISCUITE', 'PEANUT', 'PNUT'],
    'GLD': ['GLD', 'GOLD', 'COPPER', 'MST', 'MUSTARD', 'KAKKI', 'FOSSIL', 'SULTAN', 'YELLOW', 'ORANGE', 'RED']
}

# Footwear keywords to positively identify footwear
FOOTWEAR_KEYWORDS = [
    'size', 'mrp', 'pairs', 'pair', 'pack of', 'step', 'shoes', 'shoe',
    'sole', 'anti-skid', 'anti-slip', 'lightweight', 'comfort', 'kids',
    'airforce', 'running', 'hitway', 'ajanta', 'mgt', 'seltos', 'rado',
    'cubix', 'paragon', 'vkc', 'bata', 'action', 'sparx', 'campus',
    'relaxo', 'flite', 'walkaroo', 'khadim', 'inblu', 'v-walk', 'vwalk',
    'hawai', 'sandal', 'slipper', 'clog', 'eva', 'pvc', 'pu', 'flip-flop',
    'ladies collection', 'mens collection', 'kids collection', 'net rate',
    'prs', 'loose', 'durable', 'box packing', 'super soft', 'cushion'
]

# Non-footwear keywords to positively exclude
NON_FOOTWEAR_KEYWORDS = [
    'state bank of india', 'sbi', 'bank of baroda', 'account statement',
    'transaction', 'balance check', 'current balance', 'annexure', 'cheque',
    'birthday', 'happy birthday', 'raksha bandhan', 'rakhi', 'diwali', 'puja',
    'greetings', 'congratulations', 'wishing you', 'wedding', 'invitation',
    'qr code', 'wi-fi', 'district map', 'odisha', 'one piece', 'avatar',
    'harley davidson', 'motorcycle', 'director', 'tollywood', 'kollywood'
]

def detect_shoe_color(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return 'UNKNOWN', 0, 0, 0
        h, w = img.shape[:2]
        crop = img[int(h * 0.25):int(h * 0.75), int(w * 0.2):int(w * 0.8)]
        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)

        # Filter out light/white background
        bg_mask = (hsv[:, :, 1] < 45) & (hsv[:, :, 2] > 180)
        shoe_rgb = rgb[~bg_mask]
        shoe_hsv = hsv[~bg_mask]

        if len(shoe_rgb) == 0:
            return 'UNKNOWN', 0, 0, 0

        data = np.float32(shoe_rgb)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(data, 3, None, criteria, 5, cv2.KMEANS_RANDOM_CENTERS)
        counts = np.bincount(labels.flatten())
        sorted_indices = np.argsort(-counts)

        best_color = 'UNKNOWN'
        best_h, best_s, best_v = 0, 0, 0

        for idx in sorted_indices:
            center = centers[idx]
            hsv_c = cv2.cvtColor(np.uint8([[center]]), cv2.COLOR_RGB2HSV)[0][0]
            h_val, s_val, v_val = int(hsv_c[0]), int(hsv_c[1]), int(hsv_c[2])

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
    except Exception:
        return 'UNKNOWN', 0, 0, 0

async def analyze_all():
    print(f"Loading stock data from: {STOCK_DATA_PATH}")
    with open(STOCK_DATA_PATH, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    all_products = []
    for group in stock_data:
        gname = group.get("groupName", "")
        for prod in (group.get("products") or []):
            all_products.append({"group": gname, "product": prod})

    files = sorted([f for f in os.listdir(TARGET_DIR) if os.path.isfile(os.path.join(TARGET_DIR, f))])
    print(f"Scanning {len(files)} files in {TARGET_DIR}...")

    analysis = []
    footwear_count = 0
    non_footwear_count = 0

    for i, fname in enumerate(files, 1):
        fpath = os.path.join(TARGET_DIR, fname)
        ocr_text = ""
        try:
            pil_img = Image.open(fpath)
            ocr_res = await winocr.recognize_pil(pil_img, 'en')
            ocr_text = ocr_res.text if ocr_res else ""
        except Exception as e:
            ocr_text = ""

        ocr_lower = ocr_text.lower()
        fname_lower = fname.lower()

        # Classification heuristics
        is_non_footwear = any(kw in ocr_lower or kw in fname_lower for kw in NON_FOOTWEAR_KEYWORDS)
        footwear_hits = [kw for kw in FOOTWEAR_KEYWORDS if kw in ocr_lower or kw in fname_lower]

        is_footwear = (len(footwear_hits) >= 1 and not is_non_footwear)

        det_color, h_val, s_val, v_val = 'UNKNOWN', 0, 0, 0
        if is_footwear:
            det_color, h_val, s_val, v_val = detect_shoe_color(fpath)

        # Model / Article extraction
        model = None
        # From OCR: e.g. "Stream-101", "Zap-01", "AN-12208", "CG-37", "Seltos-6", "8511", "Tech-125", "Mafia-02", "Rado-26", "CBX 10100"
        m = re.search(r'\b([A-Za-z]+[- ]?\d{2,6})\b', ocr_text)
        if m:
            model = m.group(1).replace(" ", "-")
        else:
            m2 = re.search(r'\b(\d{4,6})\b', ocr_text)
            if m2:
                model = m2.group(1)

        # Price extraction
        price = None
        p_match = re.search(r'(?:MRP|RATE|NET)[:\s\.\-]*[^\d]*(\d{2,4})', ocr_text, re.IGNORECASE)
        if p_match:
            price = p_match.group(1)

        # Matched product in catalog
        matched_product = None
        matched_group = None
        if model:
            clean_m = re.sub(r'^[A-Za-z]+[- ]?', '', model).upper()
            candidates = []
            for item in all_products:
                pname = item["product"]["productName"].upper()
                if model.upper() in pname or (len(clean_m) >= 3 and clean_m in pname):
                    candidates.append(item)
            
            if len(candidates) == 1:
                matched_product = candidates[0]["product"]["productName"]
                matched_group = candidates[0]["group"]
            elif len(candidates) > 1:
                # Disambiguate by color if available
                best_c = None
                if det_color != 'UNKNOWN':
                    aliases = COLOR_KEYWORDS.get(det_color, [det_color])
                    for c in candidates:
                        pname = c["product"]["productName"].upper()
                        if any(a in pname for a in aliases):
                            best_c = c
                            break
                if not best_c:
                    best_c = candidates[0]
                matched_product = best_c["product"]["productName"]
                matched_group = best_c["group"]

        if is_footwear:
            footwear_count += 1
        else:
            non_footwear_count += 1

        record = {
            "file": fname,
            "size": os.path.getsize(fpath),
            "isFootwear": is_footwear,
            "footwearHits": footwear_hits,
            "ocrSnippet": ocr_text[:120].replace("\n", " "),
            "model": model,
            "price": price,
            "detectedColor": det_color,
            "matchedProduct": matched_product,
            "matchedGroup": matched_group
        }
        analysis.append(record)

        if i % 50 == 0 or i == len(files):
            print(f"Processed {i}/{len(files)} files: {footwear_count} footwear, {non_footwear_count} non-footwear")

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "totalFiles": len(files),
            "footwearCount": footwear_count,
            "nonFootwearCount": non_footwear_count,
            "results": analysis
        }, f, indent=2)

    print(f"\nReport written to {REPORT_PATH}")
    print(f"Summary: Total: {len(files)} | Footwear: {footwear_count} | Non-Footwear: {non_footwear_count}")

if __name__ == '__main__':
    asyncio.run(analyze_all())
