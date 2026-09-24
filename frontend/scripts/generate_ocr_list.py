import json
import urllib.request
import io
from PIL import Image
import winocr
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def download_and_ocr(url, product_name):
    loop = asyncio.get_event_loop()
    try:
        def fetch():
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                return response.read()
        
        data = await loop.run_in_executor(None, fetch)
        img = Image.open(io.BytesIO(data)).convert('RGB')
        res = await winocr.recognize_pil(img, 'en')
        ocr_text = (res.text or "").replace('\n', ' | ')
        return f"**Product**: {product_name}\n**URL**: [Link]({url})\n**OCR Text**: `{ocr_text}`\n"
    except Exception as e:
        return f"**Product**: {product_name}\n**URL**: [Link]({url})\n**OCR Text**: `[Error: {str(e)}]`\n"

async def main():
    report_path = r'frontend\scripts\quick_share_full_report.json'
    with open(report_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    results = data.get('results', [])
    output = ["# OCR Extraction List from Quick Share Box Items\n\n"]
    output.append(f"Successfully processed {len(results)} images. Here is the OCR text extracted from them:\n\n")
    
    tasks = []
    for r in results:
        tasks.append(download_and_ocr(r['url'], r['product']))
        
    # Run in batches
    batch_size = 20
    for i in range(0, len(tasks), batch_size):
        batch = tasks[i:i+batch_size]
        res = await asyncio.gather(*batch)
        output.extend(res)
        print(f"Processed {min(i+batch_size, len(tasks))}/{len(tasks)}")
        
    # Copy to artifacts so user can see it
    import os
    app_data_dir = r"C:\Users\Sahil Kumar\.gemini\antigravity\brain\57b47e7b-3031-41cf-966a-764fd87ae7f7"
    with open(os.path.join(app_data_dir, 'ocr_list.md'), 'w', encoding='utf-8') as f:
        f.write("\n".join(output))

if __name__ == '__main__':
    asyncio.run(main())
