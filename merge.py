import json
import codecs

def get_image_mapping(data, mapping):
    if isinstance(data, dict):
        if "productName" in data and "imageUrl" in data and data["imageUrl"] is not None:
            mapping[data["productName"]] = {
                "imageUrl": data["imageUrl"],
                "imageUploadedAt": data.get("imageUploadedAt")
            }
        for key, value in data.items():
            get_image_mapping(value, mapping)
    elif isinstance(data, list):
        for item in data:
            get_image_mapping(item, mapping)

def apply_mapping(data, mapping):
    updated = 0
    if isinstance(data, dict):
        if "productName" in data and data["productName"] in mapping:
            # Only update if the current one doesn't have an image or we want to overwrite
            new_data = mapping[data["productName"]]
            if data.get("imageUrl") is None and new_data["imageUrl"] is not None:
                data["imageUrl"] = new_data["imageUrl"]
                data["imageUploadedAt"] = new_data["imageUploadedAt"]
                updated += 1
        for key, value in data.items():
            updated += apply_mapping(value, mapping)
    elif isinstance(data, list):
        for item in data:
            updated += apply_mapping(item, mapping)
    return updated

try:
    with codecs.open('stashed-stock-data.json', 'r', encoding='utf-16le') as f:
        stashed_data = json.load(f)
except Exception:
    with codecs.open('stashed-stock-data.json', 'r', encoding='utf-8') as f:
        stashed_data = json.load(f)

mapping = {}
get_image_mapping(stashed_data, mapping)
print(f"Found {len(mapping)} products with images in stash.")

current_file = 'frontend/public/assets/stock-data.json'
with codecs.open(current_file, 'r', encoding='utf-8') as f:
    current_data = json.load(f)

updated_count = apply_mapping(current_data, mapping)
print(f"Updated {updated_count} products in current data.")

with codecs.open(current_file, 'w', encoding='utf-8') as f:
    json.dump(current_data, f, indent=2, ensure_ascii=False)
