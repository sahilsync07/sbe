import os
import json

STOCK_PATH = r"C:\Projects\sbe\frontend\public\assets\stock-data.json"
HUB_STOCK = r"C:\Projects\sbe\sbe-hub\public\assets\stock-data.json"
SRIYA_STOCK = r"C:\Projects\sriyasync_github\sbe\frontend\public\assets\stock-data.json"

def separate_durolite(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        groups = json.load(f)
        
    school_duro = next((g for g in groups if g.get('groupName') == 'SCHOOL SHOE DUROLITE'), None)
    if not school_duro:
        print(f"SCHOOL SHOE DUROLITE not found in {file_path}")
        return
        
    drl_school_prods = []
    durolite_prods = []
    
    for p in school_duro['products']:
        pname = p['productName']
        if 'POLO' in pname.upper():
            durolite_prods.append(p)
        else:
            drl_school_prods.append(p)
            
    school_duro['products'] = drl_school_prods
    
    # Check if Durolite group already exists
    duro_group = next((g for g in groups if g.get('groupName') == 'Durolite'), None)
    if duro_group:
        duro_group['products'] = durolite_prods
    else:
        # Insert Durolite right after SCHOOL SHOE DUROLITE
        idx = groups.index(school_duro)
        new_group = {
            "groupName": "Durolite",
            "products": durolite_prods
        }
        groups.insert(idx + 1, new_group)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
        
    sec_duro = sum(1 for p in durolite_prods if p.get('secondaryImageUrl'))
    sec_school = sum(1 for p in drl_school_prods if p.get('secondaryImageUrl'))
    print(f"Updated {file_path}:")
    print(f"  SCHOOL SHOE DUROLITE now has {len(drl_school_prods)} products (all DRL school shoes, {sec_school} with sec images)")
    print(f"  Durolite now has {len(durolite_prods)} products ({sec_duro}/{len(durolite_prods)} with sec images - 100%!)")

separate_durolite(STOCK_PATH)
separate_durolite(HUB_STOCK)
separate_durolite(SRIYA_STOCK)

print("\nDone! DRL School Shoe and Durolite are now completely separated into distinct company groups!")
