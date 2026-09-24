import urllib.request
import urllib.parse
import json
import base64
import time
import os

CLOUD_NAME = "dieqsg5tr"
API_KEY = "778282291518515"
API_SECRET = "FQuxzNqkEqKXu8NpwUL6CFQWpNQ"

auth_header = "Basic " + base64.b64encode(f"{API_KEY}:{API_SECRET}".encode('utf-8')).decode('utf-8')

def delete_by_prefix(prefix):
    print(f"Deleting all resources with prefix '{prefix}' from Cloudinary...")
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/resources/image/upload?prefix={urllib.parse.quote(prefix)}&all=true"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("Authorization", auth_header)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Delete response:", data)
            return data
    except Exception as e:
        print("Delete error:", e)
        return None

# Delete all images uploaded to e-sbe/box/paragon_ladies
delete_by_prefix("e-sbe/box/paragon_ladies")

# Also delete folder if empty
def delete_folder(folder):
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/folders/{urllib.parse.quote(folder)}"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("Authorization", auth_header)
    try:
        with urllib.request.urlopen(req) as resp:
            print("Folder delete response:", json.loads(resp.read().decode('utf-8')))
    except Exception as e:
        print("Folder delete error:", e)

delete_folder("e-sbe/box/paragon_ladies")

# Now cleanse stock-data.json in C:\Projects\sriyasync_github\sbe
sriya_stock = r"C:\Projects\sriyasync_github\sbe\frontend\public\assets\stock-data.json"
if os.path.exists(sriya_stock):
    print(f"Cleansing {sriya_stock}...")
    with open(sriya_stock, 'r', encoding='utf-8') as f:
        groups = json.load(f)
    
    cleansed = 0
    for g in groups:
        for p in g.get('products', []):
            sec = p.get('secondaryImageUrl', '') or ''
            if 'e-sbe/box/paragon_ladies' in sec or ('paragon' in g.get('groupName', '').lower() and 'cubix' in sec.lower()):
                p['secondaryImageUrl'] = None
                cleansed += 1
                
    with open(sriya_stock, 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
    print(f"Cleansed {cleansed} bad secondaryImageUrl entries from sriyasync_github stock-data.json!")

# Check local stock-data.json as well
local_stock = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
if os.path.exists(local_stock):
    with open(local_stock, 'r', encoding='utf-8') as f:
        groups = json.load(f)
    cleansed = 0
    for g in groups:
        for p in g.get('products', []):
            sec = p.get('secondaryImageUrl', '') or ''
            if 'e-sbe/box/paragon_ladies' in sec or ('paragon' in g.get('groupName', '').lower() and 'cubix' in sec.lower()):
                p['secondaryImageUrl'] = None
                cleansed += 1
    if cleansed > 0:
        with open(local_stock, 'w', encoding='utf-8') as f:
            json.dump(groups, f, indent=2, ensure_ascii=False)
        print(f"Cleansed {cleansed} bad entries from local stock-data.json!")
    else:
        print("Local stock-data.json has 0 bad entries.")
