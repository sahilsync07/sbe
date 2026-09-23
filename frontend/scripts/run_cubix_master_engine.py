import os
import sys
import json
import re
import glob
import uuid
import hashlib
import zipfile
import io
import time
import urllib.request
from collections import defaultdict
from PIL import Image

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from frontend.scripts.cubix_color_detector import analyze_shoe_color

TARGET_STOCK_FILES = [
    os.path.join(REPO_ROOT, "frontend", "public", "assets", "stock-data.json"),
    os.path.join(REPO_ROOT, "sbe-hub", "public", "assets", "stock-data.json"),
    r"C:\Projects\sbe\frontend\public\assets\stock-data.json",
    r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
]

CACHE_FILE = os.path.join(REPO_ROOT, "frontend", "scripts", "cubix_ocr_cache.json")
WA_INDEX_FILE = os.path.join(REPO_ROOT, "frontend", "scripts", "cubix_wa_index.json")
WA_ZIP_PATH = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with NEW CUBIX GALLERY .zip"
TG_DIR = r"C:\Users\Sahil Kumar\Downloads\Telegram Desktop\ChatExport_2026-09-21"

CLOUDINARY_CLOUD_NAME = "dieqsg5tr"
CLOUDINARY_UPLOAD_PRESET = "e-sbe-pics"
CLOUDINARY_FOLDER = "e-sbe/box/cubix"

COLOR_FAMILIES = {
    'BLK': ['BLK', 'BLACK', 'BK', '8K'],
    'BRN': ['BRN', 'BROWN', 'CHESTNUT', 'TAN-BRN', 'CAMEL', 'TAN', 'CARAMEL', 'CHIKKU', 'CHIKU', 'CHIKOO', 'COFFE', 'COFFEE', 'KHAKI'],
    'PNK': ['PNK', 'PINK', 'ROSE'],
    'MRN': ['MRN', 'MAROON', 'CHRY', 'CHERRY', 'WINE', 'BURGUNDY'],
    'GRN': ['GRN', 'GREEN', 'OLV', 'OLIVE', 'PISTA', 'F_GREEN', 'FGRN', 'F.GRN', 'F GRN', 'F. GRN', 'F-GRN', 'MEHANDI', 'MHD', 'PEACOCK', 'PCK', 'RAMA'],
    'BLU': ['BLU', 'BLUE', 'NAVY', 'SKY', 'R_BLUE', 'AIRFORCE', 'TURQUOISE', 'SKBLU', 'AQUA'],
    'GRY': ['GRY', 'GREY', 'GRAY', 'SLATE'],
    'WHT': ['WHT', 'WHITE', 'CREAM', 'CRM', 'BEG', 'BGE', 'BEIGE', 'PEANUT', 'PNUT', 'BISCUIT', 'BSCT', 'BUSCUIT'],
    'YLW': ['YLW', 'YELLOW', 'MUSTARD', 'LEMON', 'MST'],
    'RED': ['RED', 'CHILI', 'TOMATO'],
    'SLV': ['SLV', 'SILVER', 'SILVR'],
    'GLD': ['GLD', 'GOLD', 'COPPER', 'CPR'],
    'PCH': ['PCH', 'PEACH'],
    'GRP': ['GRP', 'GRAPE', 'GRAP', 'PURPLE']
}

def extract_product_color_family(pname):
    pn = pname.upper()
    for fam, aliases in COLOR_FAMILIES.items():
        for a in aliases:
            if re.search(r'(?:\b|[^A-Z])' + re.escape(a) + r'(?:\b|[^A-Z])', pn):
                return fam, a
    return None, None

def extract_model_num(pname):
    m = re.search(r'(?:CBX|CUBIX)?\s*(?:E\-?\s*)?(\d{4,5})\b', pname.upper())
    if m:
        return m.group(1)
    return None

def color_matches(target_fam, target_tok, det_color):
    if not target_fam:
        return True # Neutral/no colorway in title
    if target_fam == det_color:
        return True
    # Compatible definitions:
    if target_fam == 'WHT' and det_color in ['WHT_BGE', 'GRY']:
        return True
    if target_fam == 'WHT' and det_color == 'BRN' and target_tok in ['BISCUIT', 'BSCT', 'BUSCUIT', 'PEANUT', 'PNUT', 'BEIGE', 'BEG', 'BGE', 'CREAM', 'CRM']:
        return True # Warm biscuit/beige leather
    if target_fam == 'BRN' and det_color == 'WHT_BGE':
        return True # Light camel/chikku/tan/beige
    if target_fam == 'BRN' and det_color in ['BRN', 'YLW_GLD', 'MRN']:
        return True # Tan, cognac, cherry, mahogany leather
    if target_fam in ['GLD', 'YLW'] and det_color in ['YLW_GLD', 'BRN', 'WHT_BGE']:
        return True # Gold, copper, champagne
    if target_fam == 'MRN' and det_color in ['MRN', 'PNK', 'GRP', 'BRN']:
        return True # Maroon, wine, burgundy, dark cherry
    if target_fam == 'GRP' and det_color in ['GRP', 'MRN', 'BLU']:
        return True
    if target_fam == 'GRN' and det_color in ['GRN']:
        return True
    if target_fam == 'GRN' and det_color == 'BRN' and target_tok in ['MHD', 'MEHANDI', 'OLV', 'OLIVE']:
        return True # Earthy olive/mehndi leather
    if target_fam == 'GRN' and det_color == 'BLU' and target_tok in ['F_GREEN', 'FGRN', 'F.GRN', 'F GRN', 'F. GRN', 'F-GRN', 'PEACOCK', 'PCK', 'RAMA']:
        return True # Peacock/fast green
    if target_fam in ['GRY', 'SLV'] and det_color in ['GRY', 'BLK', 'WHT_BGE']:
        return True
    return False


def is_valid_catalog_image(ocr_text):
    if not ocr_text:
        return True
    ot = ocr_text.upper()
    if re.search(r'\b(?:QTY|QUANTITY|WTY|PCS|SBE\s*RAYAGADA)\b', ot):
        return False
    return True

def upload_to_cloudinary(image_bytes, public_id):
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()

    def add_field(name, val):
        body.extend(f"--{boundary}\r\n".encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode('utf-8'))
        body.extend(f"{val}\r\n".encode('utf-8'))

    def add_file(name, filename, data):
        body.extend(f"--{boundary}\r\n".encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode('utf-8'))
        body.extend(b'Content-Type: image/jpeg\r\n\r\n')
        body.extend(data)
        body.extend(b'\r\n')

    add_field('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    add_field('folder', CLOUDINARY_FOLDER)
    if public_id:
        add_field('public_id', public_id)
    add_file('file', f"{public_id}.jpg", image_bytes)
    body.extend(f"--{boundary}--\r\n".encode('utf-8'))

    url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'User-Agent': 'Mozilla/5.0'
        }
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                return res_data.get('secure_url')
        except Exception as e:
            if attempt == 2:
                print(f"Cloudinary upload error for {public_id}: {e}")
                return None
            time.sleep(1.5)
    return None

def main():
    print("=" * 70)
    print("CUBIX MASTER EXECUTION ENGINE: COMPREHENSIVE RECOVERY & ATOMIC SYNC")
    print("=" * 70)

    # 1. Load primary stock data
    primary_stock_path = TARGET_STOCK_FILES[0]
    with open(primary_stock_path, 'r', encoding='utf-8') as f:
        stock_data = json.load(f)

    # 2. Load cache
    ocr_cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            ocr_cache = json.load(f)

    # 3. Load Telegram captions & photos
    tg_photos_by_model = defaultdict(list)
    html_files = sorted(glob.glob(os.path.join(TG_DIR, "messages*.html")))
    for hf in html_files:
        with open(hf, 'r', encoding='utf-8') as f:
            html = f.read()
        blocks = re.findall(r'href="(photos/[^"]+)".*?<div class="text">(.*?)</div>', html, re.DOTALL)
        for p_rel, t in blocks:
            t_clean = re.sub(r'<[^>]+>', ' ', t).strip()
            if not is_valid_catalog_image(t_clean):
                continue
            m = re.search(r'(?:CBX|CUBIX)?\s*(?:E\-?\s*)?(\d{4,5})\b', t_clean.upper())
            if m:
                mod = m.group(1)
                p_full = os.path.join(TG_DIR, p_rel.replace('/', os.sep))
                if os.path.exists(p_full):
                    tg_photos_by_model[mod].append((p_full, t_clean))

    print(f"Telegram photos mapped: {sum(len(v) for v in tg_photos_by_model.values())} across {len(tg_photos_by_model)} models")

    # 4. Load WhatsApp index
    wa_index = {}
    if os.path.exists(WA_INDEX_FILE):
        with open(WA_INDEX_FILE, 'r', encoding='utf-8') as f:
            wa_index = json.load(f)
    print(f"WhatsApp indexed photos: {len(wa_index)}")

    wa_photos_by_model = defaultdict(list)
    for img_name, meta in wa_index.items():
        mod = meta.get('model')
        if mod:
            txt = meta.get('ocr_text', '')
            if is_valid_catalog_image(txt):
                wa_photos_by_model[mod].append((img_name, meta))

    # Open WhatsApp zip
    wa_zip = None
    if os.path.exists(WA_ZIP_PATH):
        wa_zip = zipfile.ZipFile(WA_ZIP_PATH, 'r')

    # Gather all Cubix products
    cubix_items = []
    cubix_by_model = defaultdict(list)
    for g in stock_data:
        gname = g.get('groupName', '')
        if any(k in gname.upper() for k in ['CUBIX', 'CBX']):
            for p in g.get('products', []):
                pname = p.get('productName', '')
                mod = extract_model_num(pname)
                fam, tok = extract_product_color_family(pname)
                item = {
                    'product': p,
                    'group': gname,
                    'pname': pname,
                    'model': mod,
                    'target_fam': fam,
                    'target_tok': tok,
                    'orig_sec': p.get('secondaryImageUrl'),
                    'orig_img': p.get('imageUrl')
                }
                cubix_items.append(item)
                if mod:
                    cubix_by_model[mod].append(item)

    print(f"Total Cubix products: {len(cubix_items)} across {len(cubix_by_model)} models")

    # Map existing cached Cloudinary URLs by model
    cache_by_model = defaultdict(list)
    for url, meta in ocr_cache.items():
        fn = url.split('/')[-1]
        m = re.search(r'(?:CBX|CUBIX)?_?(?:E_?)?(\d{4,5})\b', fn.upper())
        if not m:
            ot = meta.get('text', '')
            m = re.search(r'\b(\d{4,5})\b', ot)
        if m:
            mod = m.group(1)
            cache_by_model[mod].append({
                'url': url,
                'detected_color': meta.get('detected_color', 'UNKNOWN'),
                'confidence': meta.get('color_confidence', 0),
                'filename': fn
            })

    # PHASE 1: Audit and Swap Existing Attachments within each model family
    print("\n--- PHASE 1: Existing Attachments Audit & Smart Variant Swapping ---")
    swapped_count = 0
    detached_count = 0

    for mod, prods in cubix_by_model.items():
        avail_urls = cache_by_model.get(mod, [])

        assigned_urls = set()
        
        # Pass 1: Keep URLs that already match product color
        for it in prods:
            sec = it['product'].get('secondaryImageUrl')
            fam = it['target_fam']
            tok = it['target_tok']
            if sec in ocr_cache:
                det = ocr_cache[sec].get('detected_color', 'UNKNOWN')
                if color_matches(fam, tok, det):
                    assigned_urls.add(sec)

        # Pass 2: For products whose current URL is mismatched/clashing, look for a matching URL in available cache
        for it in prods:
            sec = it['product'].get('secondaryImageUrl')
            fam = it['target_fam']
            tok = it['target_tok']
            is_good = False
            if sec in ocr_cache:
                det = ocr_cache[sec].get('detected_color', 'UNKNOWN')
                if color_matches(fam, tok, det):
                    is_good = True

            if not is_good:
                # Find available cached URL with matching color
                candidates = [u for u in avail_urls if u['url'] not in assigned_urls and color_matches(fam, tok, u['detected_color'])]
                if candidates:
                    chosen = candidates[0]['url']
                    assigned_urls.add(chosen)
                    old_sec = sec
                    it['product']['secondaryImageUrl'] = chosen
                    if not it['product'].get('imageUrl') or it['product'].get('imageUrl') == old_sec:
                        it['product']['imageUrl'] = chosen
                    swapped_count += 1
                    old_fn = old_sec.split('/')[-1] if old_sec else 'None'
                    new_fn = chosen.split('/')[-1]
                    print(f"  [SWAP] Model {mod} - {it['pname']} ({fam}): {old_fn} -> {new_fn} (Det: {candidates[0]['detected_color']})")
                else:
                    # Detach mismatched URL so genuine photo can be matched from TG/WA
                    if sec:
                        old_sec = sec
                        det = ocr_cache.get(sec, {}).get('detected_color', 'UNKNOWN')
                        it['product']['secondaryImageUrl'] = None
                        if it['product'].get('imageUrl') == old_sec:
                            it['product']['imageUrl'] = None
                        detached_count += 1
                        print(f"  [DETACH CLASH] Model {mod} - {it['pname']} ({fam}): Detached {old_sec.split('/')[-1]} (Det: {det})")

    print(f"Phase 1 complete: {swapped_count} variants swapped/corrected, {detached_count} clashes detached.")

    # PHASE 2: Discover and Match Missing Products from Telegram & WhatsApp
    print("\n--- PHASE 2: Discovery & Matching from Telegram & WhatsApp ---")
    matched_from_tg = []
    matched_from_wa = []

    tg_color_cache = {}

    missing_items = [it for it in cubix_items if not it['product'].get('secondaryImageUrl')]
    print(f"Products currently needing genuine images: {len(missing_items)}")

    # Track already used photos per model to prevent attaching the exact same photo to two different color variants
    used_tg_photos = set()
    used_wa_photos = set()

    for it in missing_items:
        mod = it['model']
        fam = it['target_fam']
        tok = it['target_tok']
        if not mod:
            continue

        matched_source = None
        matched_image_bytes = None
        matched_color = None

        # 1. Check Telegram candidates
        tg_candidates = tg_photos_by_model.get(mod, [])
        for photo_path, caption in tg_candidates:
            if photo_path in used_tg_photos:
                continue
            if photo_path not in tg_color_cache:
                try:
                    im = Image.open(photo_path).convert('RGB')
                    det_c, pct, _ = analyze_shoe_color(im)
                    tg_color_cache[photo_path] = (det_c, pct)
                except Exception:
                    tg_color_cache[photo_path] = ('UNKNOWN', 0)
            det_c, pct = tg_color_cache[photo_path]
            if color_matches(fam, tok, det_c):
                try:
                    with open(photo_path, 'rb') as f_img:
                        matched_image_bytes = f_img.read()
                    matched_source = ('TG', photo_path)
                    matched_color = det_c
                    used_tg_photos.add(photo_path)
                    break
                except Exception:
                    pass

        # 2. If not found in Telegram, check WhatsApp index
        if not matched_source and mod in wa_photos_by_model and wa_zip:
            wa_candidates = wa_photos_by_model[mod]
            for img_name, meta in wa_candidates:
                if img_name in used_wa_photos:
                    continue
                det_c = meta.get('detected_color', 'UNKNOWN')
                if color_matches(fam, tok, det_c):
                    try:
                        matched_image_bytes = wa_zip.read(img_name)
                        matched_source = ('WA', img_name)
                        matched_color = det_c
                        used_wa_photos.add(img_name)
                        break
                    except Exception:
                        pass

        if matched_source and matched_image_bytes:
            src_type, src_id = matched_source
            if src_type == 'TG':
                matched_from_tg.append((it, matched_image_bytes, matched_color, src_id))
            else:
                matched_from_wa.append((it, matched_image_bytes, matched_color, src_id))
            print(f"  ✓ Matched [{src_type}] {it['pname']} ({fam}) -> {os.path.basename(src_id)} (Det: {matched_color})")

    print(f"\nTotal new matches ready for upload:")
    print(f"  From Telegram: {len(matched_from_tg)}")
    print(f"  From WhatsApp: {len(matched_from_wa)}")
    total_new_matches = matched_from_tg + matched_from_wa
    print(f"  Total: {len(total_new_matches)}")

    # PHASE 3: Cloudinary Upload & Link Attachment
    print("\n--- PHASE 3: Cloudinary 2 Upload & Stock Linking ---")
    upload_success = 0
    upload_failed = 0

    for it, img_bytes, det_color, src_id in total_new_matches:
        mod = it['model']
        tok = it['target_tok'] or det_color or "SAMPLE"
        clean_tok = re.sub(r'[^A-Z0-9]', '', tok.upper())
        h_suffix = hashlib.md5(img_bytes).hexdigest()[:6]
        pub_id = f"CUBIX_{mod}_{clean_tok}_{h_suffix}"

        print(f"Uploading {pub_id} for {it['pname']}...")
        sec_url = upload_to_cloudinary(img_bytes, pub_id)
        if sec_url:
            it['product']['secondaryImageUrl'] = sec_url
            if not it['product'].get('imageUrl') or 'placeholder' in it['product'].get('imageUrl', '').lower():
                it['product']['imageUrl'] = sec_url

            # Record in cache
            ocr_cache[sec_url] = {
                'detected_color': det_color,
                'source': src_id,
                'public_id': pub_id,
                'status': 'uploaded'
            }
            upload_success += 1
            print(f"  -> SUCCESS: {sec_url}")
        else:
            upload_failed += 1
            print(f"  -> FAILED to upload {pub_id}")

    print(f"\nUpload completed: {upload_success} successful, {upload_failed} failed.")

    # Save cache
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(ocr_cache, f, indent=2, ensure_ascii=False)

    # PHASE 4: Atomic Sync across all 4 target files
    print("\n--- PHASE 4: Atomic Sync Across Target Repositories ---")
    for tf in TARGET_STOCK_FILES:
        target_dir = os.path.dirname(tf)
        if os.path.exists(target_dir):
            with open(tf, 'w', encoding='utf-8') as f:
                json.dump(stock_data, f, indent=2, ensure_ascii=False)
            print(f"  ✓ Successfully updated: {tf}")
        else:
            print(f"  - Directory not found, skipped: {tf}")

    # PHASE 5: Verification & Color Audit
    print("\n" + "=" * 70)
    print("PHASE 5: FINAL AUDIT VERIFICATION REPORT")
    print("=" * 70)
    final_attached = 0
    final_missing = 0
    verified_color_matches = 0
    remaining_clashes = 0

    for it in cubix_items:
        sec = it['product'].get('secondaryImageUrl')
        fam = it['target_fam']
        tok = it['target_tok']
        if sec:
            final_attached += 1
            det = ocr_cache.get(sec, {}).get('detected_color', 'UNKNOWN')
            if color_matches(fam, tok, det):
                verified_color_matches += 1
            else:
                remaining_clashes += 1
                print(f"  [COLOR MISMATCH] {it['pname']} ({fam}) -> {sec.split('/')[-1]} (Det: {det})")
        else:
            final_missing += 1

    print(f"Total Cubix Products: {len(cubix_items)}")
    print(f"Attached with Image: {final_attached} (was 395)")
    print(f"Missing Image: {final_missing} (was 120)")
    print(f"Verified Color Matches: {verified_color_matches}")
    print(f"Remaining Color Mismatches: {remaining_clashes}")
    print("=" * 70)

if __name__ == '__main__':
    main()
