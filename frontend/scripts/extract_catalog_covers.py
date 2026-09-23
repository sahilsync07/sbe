import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import fitz
from PIL import Image
import urllib.request
import json
import base64

# Cloudinary Secondary Config
CLOUD_NAME = "dieqsg5tr"
UPLOAD_PRESET = "e-sbe-pics"
CLOUDINARY_FOLDER = "e-sbe/banners"

PARAGON_PDF = r"C:\Users\Sahil Kumar\Downloads\Pictures\catalogs\05 PARAGON E-CATALOGUE APRIL 2026.pdf"
EEKEN_PDF = r"C:\Users\Sahil Kumar\Downloads\Pictures\catalogs\EEKENCATALOGUEAPRIL2026.pdf"
OUTPUT_DIR = r"c:\Projects\sbe\frontend\public\assets\banners"

os.makedirs(OUTPUT_DIR, exist_ok=True)

BANNERS_SPEC = [
    {
        "id": "paragon_main",
        "file": PARAGON_PDF,
        "page": 1,
        "filename": "01_paragon_main.webp",
        "title": "Paragon 2026 Collection",
        "subtitle": "India's Most Trusted Footwear",
        "tab": "PARAGON GENTS",
        "brand": "PARAGON"
    },
    {
        "id": "solea",
        "file": PARAGON_PDF,
        "page": 16,
        "filename": "02_solea_cover.webp",
        "title": "Paragon Solea",
        "subtitle": "Elegance & Comfort For Women",
        "tab": "PARAGON LADIES",
        "brand": "SOLEA"
    },
    {
        "id": "vertex",
        "file": PARAGON_PDF,
        "page": 38,
        "filename": "03_vertex_cover.webp",
        "title": "Paragon Vertex",
        "subtitle": "Premium PU Footwear for Men",
        "tab": "PARAGON GENTS",
        "brand": "VERTEX"
    },
    {
        "id": "comfy",
        "file": PARAGON_PDF,
        "page": 66,
        "filename": "04_comfy_cover.webp",
        "title": "Paragon Comfy",
        "subtitle": "Ultra Soft Daily Comfort",
        "tab": "PARAGON GENTS",
        "brand": "COMFY"
    },
    {
        "id": "escoute",
        "file": PARAGON_PDF,
        "page": 76,
        "filename": "05_escoute_cover.webp",
        "title": "Escoute Premium",
        "subtitle": "Sophisticated Men's PU",
        "tab": "Escoute",
        "brand": "ESCOUTE"
    },
    {
        "id": "paralite",
        "file": PARAGON_PDF,
        "page": 80,
        "filename": "06_paralite_cover.webp",
        "title": "Paralite Light Weight",
        "subtitle": "Lightweight Waterproof Daily Slippers",
        "tab": "PARALITE",
        "brand": "PARALITE"
    },
    {
        "id": "meriva",
        "file": PARAGON_PDF,
        "page": 102,
        "filename": "07_meriva_cover.webp",
        "title": "Meriva by Paragon",
        "subtitle": "Stylish & Soft Women's Footwear",
        "tab": "PARAGON LADIES",
        "brand": "MERIVA"
    },
    {
        "id": "paragon_max",
        "file": PARAGON_PDF,
        "page": 106,
        "filename": "08_paragon_max_cover.webp",
        "title": "Paragon Max",
        "subtitle": "Durable Athletic & Daily Shoes",
        "tab": "Max",
        "brand": "MAX"
    },
    {
        "id": "ptoes",
        "file": PARAGON_PDF,
        "page": 116,
        "filename": "09_ptoes_cover.webp",
        "title": "P-Toes Kids",
        "subtitle": "Smart Footwear For Kids",
        "tab": "P-TOES PARALITE",
        "brand": "P-TOES"
    },
    {
        "id": "school_shoes",
        "file": PARAGON_PDF,
        "page": 132,
        "filename": "10_school_shoes_cover.webp",
        "title": "Paragon School Shoes",
        "subtitle": "Durolite All-Weather School Collection",
        "tab": "School",
        "brand": "SCHOOL"
    },
    {
        "id": "tuffboot",
        "file": PARAGON_PDF,
        "page": 139,
        "filename": "11_tuffboot_cover.webp",
        "title": "Tuffboot Safety",
        "subtitle": "Heavy Duty Industrial & Safety Footwear",
        "tab": "Safety",
        "brand": "TUFFBOOT"
    },
    {
        "id": "eeken_main",
        "file": EEKEN_PDF,
        "page": 1,
        "filename": "12_eeken_main.webp",
        "title": "Eeken by Paragon",
        "subtitle": "Get Fluent In Fun #WeekendEveryday",
        "tab": "EEKEN",
        "brand": "EEKEN"
    },
    {
        "id": "eeken_clogs",
        "file": EEKEN_PDF,
        "page": 3,
        "filename": "13_eeken_clogs.webp",
        "title": "Eeken Casual Clogs",
        "subtitle": "Men's Collection - Max Comfort",
        "tab": "EEKEN",
        "brand": "EEKEN"
    },
    {
        "id": "eeken_casuals",
        "file": EEKEN_PDF,
        "page": 8,
        "filename": "14_eeken_casuals.webp",
        "title": "Eeken EVA Casuals",
        "subtitle": "Ultra-light Everyday Slides",
        "tab": "EEKEN",
        "brand": "EEKEN"
    },
    {
        "id": "eeken_sandals",
        "file": EEKEN_PDF,
        "page": 30,
        "filename": "15_eeken_sandals.webp",
        "title": "Eeken Sports Sandals",
        "subtitle": "Trendsetting Comfort #WeekendEveryday",
        "tab": "EEKEN",
        "brand": "EEKEN"
    }
]

def render_and_save():
    print("=== Extracting and Optimizing Catalog Coverpage Banners ===")
    results = []

    # Cache fitz docs
    doc_cache = {}
    for spec in BANNERS_SPEC:
        pdf_path = spec["file"]
        if pdf_path not in doc_cache:
            doc_cache[pdf_path] = fitz.open(pdf_path)
        
        doc = doc_cache[pdf_path]
        page_idx = spec["page"] - 1
        page = doc[page_idx]

        # Render at 150 DPI for crystal clear HD banner (1241 x 1754 approx)
        pix = page.get_pixmap(dpi=150)
        
        # Convert to PIL Image
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Optimize as WebP
        out_path = os.path.join(OUTPUT_DIR, spec["filename"])
        img.save(out_path, format="WEBP", quality=85, method=6)
        file_size_kb = os.path.getsize(out_path) / 1024

        print(f"✓ Extracted {spec['filename']} ({img.width}x{img.height}) - {file_size_kb:.1f} KB")

        results.append({
            "id": spec["id"],
            "title": spec["title"],
            "subtitle": spec["subtitle"],
            "tab": spec["tab"],
            "brand": spec["brand"],
            "localPath": out_path,
            "filename": spec["filename"],
            "localUrl": f"/assets/banners/{spec['filename']}",
            "cloudinaryUrl": None
        })

    return results

def upload_to_cloudinary(banners):
    print("\n=== Uploading Banners to Secondary Cloudinary (dieqsg5tr) ===")
    upload_url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

    for b in banners:
        filename = b["filename"]
        filepath = b["localPath"]
        public_id = f"{CLOUDINARY_FOLDER}/{os.path.splitext(filename)[0]}"

        try:
            with open(filepath, "rb") as f:
                img_data = f.read()

            boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
            body = []
            
            # upload_preset
            body.append(f"--{boundary}".encode())
            body.append(f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n{UPLOAD_PRESET}'.encode())
            
            # public_id
            body.append(f"--{boundary}".encode())
            body.append(f'Content-Disposition: form-data; name="public_id"\r\n\r\n{public_id}'.encode())

            # file
            body.append(f"--{boundary}".encode())
            body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
            body.append(b"Content-Type: image/webp\r\n")
            body.append(img_data)
            
            body.append(f"--{boundary}--\r\n".encode())
            payload = b"\r\n".join(body)

            req = urllib.request.Request(
                upload_url,
                data=payload,
                headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                b["cloudinaryUrl"] = res_data.get("secure_url")
                print(f"✓ Cloudinary Uploaded: {filename} -> {b['cloudinaryUrl']}")

        except Exception as e:
            print(f"⚠ Cloudinary upload failed for {filename}: {e}")
            # Fallback to local
            b["cloudinaryUrl"] = None

    manifest_path = os.path.join(OUTPUT_DIR, "banners_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(banners, f, indent=2)
    print(f"\n✓ Saved banner manifest to {manifest_path}")

if __name__ == "__main__":
    banners = render_and_save()
    upload_to_cloudinary(banners)
