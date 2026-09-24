import os
import sys
import json
import shutil
import re
import urllib.request
import urllib.parse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

LOGOS_SRC = r"C:\Users\Sahil Kumar\Downloads\Pictures\Logos"
QUICK_SHARE_SRC = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share"

LOGOS_DEST = r"C:\Projects\sbe\frontend\public\assets\logos"
CORE_DEST = r"C:\Projects\sbe\frontend\public\assets\core"

STOCK_DATA_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK_DATA_PATH = r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\core_and_logos_report.json"

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
ASSET_FOLDER = "e-sbe"

os.makedirs(LOGOS_DEST, exist_ok=True)
os.makedirs(CORE_DEST, exist_ok=True)

def upload_to_cloudinary(file_path, public_id=None):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()
    except Exception as e:
        print(f"      ❌ Could not read {file_path}: {e}")
        return None

    filename = os.path.basename(file_path)

    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="folder"\r\n\r\n{ASSET_FOLDER}\r\n'.encode())
    if public_id:
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="public_id"\r\n\r\n{public_id}\r\n'.encode())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: image/png\r\n\r\n")
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                resp_data = json.loads(resp.read().decode())
                return resp_data.get("secure_url")
        except Exception as e:
            if attempt == 2:
                print(f"      ❌ Upload failed for {filename}: {e}")
                return None
            time.sleep(1.0)
    return None

def main():
    print("=== Step 1: Copy Local Assets ===")
    # 1. Copy Logos
    logo_mapping = {
        'Paragon-logo.png': 'paragon-logo.png',
        'Paragon-logo-original.png': 'paragon-original-logo.png',
        'action-vector-logo.png': 'action-logo.png',
        'eeken-logo.png': 'eeken-logo.png',
        'vertex-logo.png': 'vertex-logo.png',
        'Solea-logo.png': 'solea-logo.png',
        'Paralite-Logo.png': 'paralite-logo.png',
        'max-logo.png': 'max-logo.png',
        'escoute-logo.png': 'escoute-logo.png',
        'meriva-logo.png': 'meriva-logo.png',
        'paragon-school-logo.png': 'paragon-school-logo.png',
        'comfy-logo.png': 'comfy-logo.png',
        'tuffboot-logo.png': 'tuffboot-logo.png',
        'fender-logo.png': 'fender-logo.png',
        'ATL Ajanta Transparent Logo.png': 'ajanta-transparent-logo.png'
    }

    copied_logos = {}
    for src_name, dest_name in logo_mapping.items():
        src_path = os.path.join(LOGOS_SRC, src_name)
        if os.path.exists(src_path):
            dest_path = os.path.join(LOGOS_DEST, dest_name)
            shutil.copy2(src_path, dest_path)
            copied_logos[dest_name] = dest_path
            print(f"✓ Copied logo: {src_name} -> {dest_name}")

    # 2. Copy Core Model Photos
    copied_core = {}
    for f in os.listdir(QUICK_SHARE_SRC):
        if f.startswith("Core-") and f.endswith(".png"):
            src_path = os.path.join(QUICK_SHARE_SRC, f)
            dest_path = os.path.join(CORE_DEST, f)
            shutil.copy2(src_path, dest_path)
            copied_core[f] = dest_path
            print(f"✓ Copied core model: {f}")

    print(f"\n=== Step 2: Upload Assets to Secondary Cloudinary ===")
    all_uploads = {}
    files_to_upload = list(copied_logos.values()) + list(copied_core.values())
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_path = {executor.submit(upload_to_cloudinary, p, os.path.splitext(os.path.basename(p))[0]): p for p in files_to_upload}
        for future in as_completed(future_to_path):
            p = future_to_path[future]
            fname = os.path.basename(p)
            url = future.result()
            if url:
                all_uploads[fname] = url
                print(f"✓ Uploaded {fname} -> {url}")

    print(f"\n=== Step 3: Link Core Models to stock-data.json ===")
    with open(STOCK_DATA_PATH, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    # Core model matching rules
    # Map model name pattern to Cloudinary URL or core filename
    core_rules = [
        {"pattern": r"\b1136\b", "core_file": "Core-1136.png"},
        {"pattern": r"\b1170\b", "core_file": "Core-1170.png"},
        {"pattern": r"\b1180\b", "core_file": "Core-1180.png"},
        {"pattern": r"\b1181\b", "core_file": "Core-1181.png"},
        {"pattern": r"\b1190\b", "core_file": "Core-1190.png"},
        {"pattern": r"\b1210\b", "core_file": "Core-1210.png"},
        {"pattern": r"\b1215\b", "core_file": "Core-1215.png"},
        {"pattern": r"\b1220\b", "core_file": "Core-1220.png"},
        {"pattern": r"\b1250\b.*(BKR|BLACK)", "core_file": "Core-1250-BKR.png"},
        {"pattern": r"\b1250\b.*(TQN|TURQUOISE)", "core_file": "Core-1250-TQN.png"},
        {"pattern": r"\b1250\b", "core_file": "Core-1250-BKR.png"},
        {"pattern": r"\b1251\b", "core_file": "Core-1251-BKR.png"},
        {"pattern": r"\b16048\b.*(BLK|BLACK)", "core_file": "Core-16048-BLK.png"},
        {"pattern": r"\b16048\b.*(MIG|GREY|GRAY)", "core_file": "Core-16048-MIG.png"},
        {"pattern": r"\b16048\b", "core_file": "Core-16048-BLK.png"},
        {"pattern": r"\b16049\b.*(BLK|BLACK)", "core_file": "Core-16049-BLK.png"},
        {"pattern": r"\b16049\b.*(RYB|BLUE)", "core_file": "Core-16049-RYB.png"},
        {"pattern": r"\b16049\b", "core_file": "Core-16049-BLK.png"},
        {"pattern": r"\bCUSHION\b", "core_file": "Core-cushion.png"}
    ]

    linked_count = 0
    for group in stock_data:
        gname = group.get("groupName", "").upper()
        # Apply to Paragon groups or relevant brand groups
        is_paragon_related = any(k in gname for k in ["PARAGON", "PARALITE", "P-TOES", "VERTEX", "MAX", "ESCOUTE", "SOLEA", "CUSHION", "HAWAI"])
        if not is_paragon_related:
            continue

        for p in (group.get("products") or []):
            pname = p["productName"].upper()
            matched_core_file = None
            for rule in core_rules:
                if re.search(rule["pattern"], pname, re.IGNORECASE):
                    matched_core_file = rule["core_file"]
                    break
            
            if matched_core_file and matched_core_file in all_uploads:
                p["secondaryImageUrl"] = all_uploads[matched_core_file]
                linked_count += 1

    print(f"✓ Linked secondaryImageUrl to {linked_count} Paragon Core products in stock-data.json")

    with open(STOCK_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)

    if os.path.exists(HUB_STOCK_DATA_PATH):
        with open(HUB_STOCK_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(stock_data, f, indent=2, ensure_ascii=False)
        print(f"✓ Synced to {HUB_STOCK_DATA_PATH}")

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "copiedLogos": copied_logos,
            "copiedCore": copied_core,
            "allUploads": all_uploads,
            "linkedCount": linked_count
        }, f, indent=2)

    print(f"\nReport written to {REPORT_PATH}")

if __name__ == '__main__':
    main()
