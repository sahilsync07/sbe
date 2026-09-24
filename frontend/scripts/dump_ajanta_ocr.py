import os
import sys
import json
import re
import zipfile
import io
import asyncio
from PIL import Image

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

AJANTA_ZIP = r"C:\Users\Sahil Kumar\Downloads\Pictures\Quick Share\WhatsApp Chat with Ajanta.zip"
FRONTEND_STOCK = r"frontend/public/assets/stock-data.json"

async def dump_all_ajanta_ocr():
    import winocr
    
    with zipfile.ZipFile(AJANTA_ZIP, 'r') as z:
        names = [n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total photos in Ajanta zip: {len(names)}")
        
        all_ocr = []
        for idx, name in enumerate(names):
            try:
                b = z.read(name)
                img = Image.open(io.BytesIO(b)).convert('RGB')
                res = await winocr.recognize_pil(img, 'en')
                txt = (res.text or '').replace('\n', ' ').strip()
                all_ocr.append({'file': name, 'ocr': txt})
            except Exception as e:
                all_ocr.append({'file': name, 'ocr': f'ERROR: {e}'})

    with open('frontend/scripts/ajanta_all_ocr.json', 'w', encoding='utf-8') as f:
        json.dump(all_ocr, f, indent=2)
    print(f"Dumped {len(all_ocr)} OCR results to frontend/scripts/ajanta_all_ocr.json")

if __name__ == '__main__':
    asyncio.run(dump_all_ajanta_ocr())
