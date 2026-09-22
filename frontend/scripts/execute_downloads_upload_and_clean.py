import os
import sys
import json
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

PICTURES_DIR = r"C:\Users\Sahil Kumar\Downloads\Pictures"
ANALYSIS_REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\downloads_analysis_report.json"
STOCK_DATA_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK_DATA_PATH = r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
EXECUTION_REPORT_PATH = r"C:\Projects\sbe\frontend\scripts\downloads_execution_report.json"

CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
ASSET_FOLDER = "e-sbe"

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
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
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

def process_single_footwear(item):
    fname = item["file"]
    fpath = os.path.join(PICTURES_DIR, fname)
    if not os.path.exists(fpath):
        return None

    ext = os.path.splitext(fname)[1].lower()
    model = item.get("model") or "MODEL"
    color = item.get("detectedColor") or "UNKNOWN"
    price_str = f"_MRP{item['price']}" if item.get("price") else ""
    
    clean_model = re.sub(r'[^\w\-]', '_', model).strip('_')
    new_fname = f"FOOTWEAR_{clean_model}_{color}{price_str}{ext}"
    new_fpath = os.path.join(PICTURES_DIR, new_fname)

    # Rename
    final_path = fpath
    if fname != new_fname:
        try:
            counter = 1
            while os.path.exists(new_fpath) and new_fpath != fpath:
                new_fname = f"FOOTWEAR_{clean_model}_{color}_{counter}{price_str}{ext}"
                new_fpath = os.path.join(PICTURES_DIR, new_fname)
                counter += 1
            os.rename(fpath, new_fpath)
            final_path = new_fpath
        except Exception as e:
            print(f"⚠️ Rename failed for {fname}: {e}")
            final_path = fpath
            new_fname = fname

    # Upload
    public_id_base = os.path.splitext(new_fname)[0]
    secure_url = upload_to_cloudinary(final_path, public_id=public_id_base)

    return {
        "old_name": fname,
        "new_name": new_fname,
        "url": secure_url,
        "matchedProduct": item.get("matchedProduct"),
        "matchedGroup": item.get("matchedGroup")
    }

def main():
    if not os.path.exists(ANALYSIS_REPORT_PATH):
        print(f"Analysis report not found at {ANALYSIS_REPORT_PATH}!")
        return

    with open(ANALYSIS_REPORT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = data.get("results", [])
    footwear_items = [r for r in results if r.get("isFootwear")]
    non_footwear_items = [r for r in results if not r.get("isFootwear")]

    print(f"Loaded: {len(footwear_items)} Footwear items, {len(non_footwear_items)} Non-Footwear items.")

    # 1. Delete Non-Footwear Files
    print(f"\n--- Deleting {len(non_footwear_items)} Non-Footwear Files ---")
    deleted_count = 0
    for item in non_footwear_items:
        fpath = os.path.join(PICTURES_DIR, item["file"])
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
                deleted_count += 1
            except Exception as e:
                print(f"⚠️ Could not delete {item['file']}: {e}")
    print(f"✓ Deleted {deleted_count} non-footwear files from {PICTURES_DIR}")

    # 2. Process & Upload Footwear Files Concurrently (max_workers=6)
    print(f"\n--- Processing & Uploading {len(footwear_items)} Footwear Images ---")
    uploaded_results = []
    completed = 0

    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_item = {executor.submit(process_single_footwear, item): item for item in footwear_items}
        for future in as_completed(future_to_item):
            res = future.result()
            completed += 1
            if res and res.get("url"):
                uploaded_results.append(res)
            if completed % 25 == 0 or completed == len(footwear_items):
                print(f"Progress: [{completed}/{len(footwear_items)}] processed ({len(uploaded_results)} uploaded)")

    # 3. Update stock-data.json
    print(f"\n--- Updating stock-data.json with secondaryImageUrl ---")
    with open(STOCK_DATA_PATH, "r", encoding="utf-8") as f:
        stock_data = json.load(f)

    product_map = {}
    for group in stock_data:
        for p in (group.get("products") or []):
            product_map[p["productName"]] = p

    linked_count = 0
    for res in uploaded_results:
        pname = res.get("matchedProduct")
        if pname and pname in product_map:
            target_prod = product_map[pname]
            target_prod["secondaryImageUrl"] = res["url"]
            linked_count += 1

    with open(STOCK_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(stock_data, f, indent=2, ensure_ascii=False)
    print(f"✓ Updated {linked_count} products in {STOCK_DATA_PATH}")

    if os.path.exists(HUB_STOCK_DATA_PATH):
        with open(HUB_STOCK_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(stock_data, f, indent=2, ensure_ascii=False)
        print(f"✓ Synced to {HUB_STOCK_DATA_PATH}")

    # 4. Save Execution Report
    exec_summary = {
        "totalFootwear": len(footwear_items),
        "totalUploaded": len(uploaded_results),
        "totalLinked": linked_count,
        "totalDeleted": deleted_count,
        "uploads": uploaded_results
    }
    with open(EXECUTION_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(exec_summary, f, indent=2)

    print(f"\n==========================================")
    print(f"Execution Summary:")
    print(f"  Footwear Processed: {len(footwear_items)}")
    print(f"  Successfully Uploaded: {len(uploaded_results)}")
    print(f"  Linked secondaryImageUrl: {linked_count}")
    print(f"  Non-footwear Deleted: {deleted_count}")
    print(f"==========================================")

if __name__ == '__main__':
    main()
