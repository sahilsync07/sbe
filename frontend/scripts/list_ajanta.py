import json

with open('frontend/public/assets/stock-data.json', 'r', encoding='utf-8') as f:
    stock_data = json.load(f)

for g in stock_data:
    if g.get('groupName') == 'AJANTA':
        for idx, p in enumerate(g.get('products', [])):
            c1 = bool(p.get('imageUrl'))
            c2 = bool(p.get('secondaryImageUrl'))
            print(f"{idx+1:2}. {p.get('productName'):45} | C1={c1} | C2={c2} | url={p.get('secondaryImageUrl')}")
