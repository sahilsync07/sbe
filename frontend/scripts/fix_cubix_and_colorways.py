import os
import sys
import json
import re

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. Image URLs verified via Computer Vision & Chromatic Sampling
BLUE_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151382/e-sbe/cubix/CUBIX_24511_BLU.jpg"
GRAPE_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151413/e-sbe/cubix/CUBIX_E_24511_BRN.jpg"
BLACK_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151626/e-sbe/cubix/CUBIX_24511_TAN.jpg"
WARM_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151422/e-sbe/cubix/CUBIX_24511_GRP.jpg"

BISCUIT_24514 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151806/e-sbe/cubix/CUBIX_24514_BLK.jpg"
BLACK_24514 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151800/e-sbe/cubix/CUBIX_24514_BISCUIT.jpg"

GREEN_29506 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151347/e-sbe/cubix/CUBIX_E_29506_BLK.jpg"
BROWN_29506 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151803/e-sbe/cubix/CUBIX_29506_BRN.jpg"

BLUE_15007 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151595/e-sbe/cubix/CUBIX_15007_GRP.jpg"
GRAPE_15007 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151571/e-sbe/cubix/CUBIX_15007_BLU.jpg"

CHIKKU_60612 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151843/e-sbe/cubix/CUBIX_C_60612_PNK.jpg"
PINK_60612 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151815/e-sbe/cubix/CUBIX_C_60612_CHIKKU.jpg"

GRAPE_67765 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790087527/e-sbe/CUBIX_67765_GRP_MRP289.jpg"
BEG_30080 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790152014/e-sbe/cubix/CUBIX_30080_BEG.jpg"

def fix_database(file_path):
    print(f"\n==================================================")
    print(f"Applying Precision Colorway Fixes: {file_path}")
    print(f"==================================================")
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changes = []
    
    for g in data:
        gname = g.get('groupName', '')
        is_cubix = 'CUBIX' in gname.upper() or 'CBX' in gname.upper()
        
        for p in g.get('products', []):
            pname = p.get('productName', '')
            p_upper = pname.upper()
            sec = p.get('secondaryImageUrl')
            
            # --- 1. MODEL 24511 ---
            if '24511' in p_upper and is_cubix:
                if any(c in p_upper for c in ['BLU', 'BLUE']):
                    if sec != BLUE_24511:
                        p['secondaryImageUrl'] = BLUE_24511
                        changes.append((pname, sec, BLUE_24511, "24511 -> Assigned Verified BLUE photo"))
                elif any(c in p_upper for c in ['GRP', 'GRAPE', 'GRAP']):
                    if sec != GRAPE_24511:
                        p['secondaryImageUrl'] = GRAPE_24511
                        changes.append((pname, sec, GRAPE_24511, "24511 -> Assigned Verified GRAPE photo"))
                elif any(c in p_upper for c in ['BLK', 'BLACK']):
                    if sec != BLACK_24511:
                        p['secondaryImageUrl'] = BLACK_24511
                        changes.append((pname, sec, BLACK_24511, "24511 -> Assigned Verified BLACK photo"))
                elif any(c in p_upper for c in ['TAN', 'BRN', 'BROWN']):
                    if sec != WARM_24511:
                        p['secondaryImageUrl'] = WARM_24511
                        changes.append((pname, sec, WARM_24511, "24511 -> Assigned Verified TAN/BRN photo"))

            # --- 2. MODEL 24514 ---
            elif '24514' in p_upper and is_cubix:
                if any(c in p_upper for c in ['BISCUIT', 'BSCT', 'BUSCUIT']):
                    if sec != BISCUIT_24514:
                        p['secondaryImageUrl'] = BISCUIT_24514
                        changes.append((pname, sec, BISCUIT_24514, "24514 -> Assigned Verified BISCUIT photo"))
                elif any(c in p_upper for c in ['BLK', 'BLACK']):
                    if sec != BLACK_24514:
                        p['secondaryImageUrl'] = BLACK_24514
                        changes.append((pname, sec, BLACK_24514, "24514 -> Assigned Verified BLACK photo"))

            # --- 3. MODEL 29506 ---
            elif '29506' in p_upper and is_cubix:
                if any(c in p_upper for c in ['GRN', 'GREEN']):
                    if sec != GREEN_29506:
                        p['secondaryImageUrl'] = GREEN_29506
                        changes.append((pname, sec, GREEN_29506, "29506 -> Assigned Verified GREEN photo"))
                elif any(c in p_upper for c in ['BRN', 'BROWN']):
                    if sec != BROWN_29506:
                        p['secondaryImageUrl'] = BROWN_29506
                        changes.append((pname, sec, BROWN_29506, "29506 -> Assigned Verified BROWN photo"))
                elif any(c in p_upper for c in ['BLK', 'BLACK']):
                    if sec is not None:
                        p['secondaryImageUrl'] = None
                        changes.append((pname, sec, None, "29506 -> Cleared Green photo from Black variant"))

            # --- 4. MODEL 15007 ---
            elif '15007' in p_upper and is_cubix:
                if any(c in p_upper for c in ['BLU', 'BLUE', 'SKBLU']):
                    if sec != BLUE_15007:
                        p['secondaryImageUrl'] = BLUE_15007
                        changes.append((pname, sec, BLUE_15007, "15007 -> Assigned Verified BLUE photo"))
                elif any(c in p_upper for c in ['GRP', 'GRAPE', 'GRAP']):
                    if sec != GRAPE_15007:
                        p['secondaryImageUrl'] = GRAPE_15007
                        changes.append((pname, sec, GRAPE_15007, "15007 -> Assigned Verified GRAPE photo"))

            # --- 5. MODEL 60612 ---
            elif '60612' in p_upper and is_cubix:
                if any(c in p_upper for c in ['CHIKKU', 'CHIKOO', 'CHIKU']):
                    if sec != CHIKKU_60612:
                        p['secondaryImageUrl'] = CHIKKU_60612
                        changes.append((pname, sec, CHIKKU_60612, "60612 -> Assigned Verified CHIKKU photo"))
                elif any(c in p_upper for c in ['PNK', 'PINK']):
                    if sec != PINK_60612:
                        p['secondaryImageUrl'] = PINK_60612
                        changes.append((pname, sec, PINK_60612, "60612 -> Assigned Verified PINK photo"))

            # --- 6. MODEL 67765 ---
            elif '67765' in p_upper and is_cubix:
                if any(c in p_upper for c in ['GRP', 'GRAPE', 'GRAP']):
                    if sec != GRAPE_67765:
                        p['secondaryImageUrl'] = GRAPE_67765
                        changes.append((pname, sec, GRAPE_67765, "67765 -> Assigned Verified GRAPE photo"))
                elif any(c in p_upper for c in ['BLK', 'BLACK']):
                    if sec is not None:
                        p['secondaryImageUrl'] = None
                        changes.append((pname, sec, None, "67765 -> Cleared GRAPE photo from BLK variant"))

            # --- 7. MODEL 30080 ---
            elif '30080' in p_upper and is_cubix:
                if any(c in p_upper for c in ['BEG', 'BEIGE']):
                    if sec != BEG_30080:
                        p['secondaryImageUrl'] = BEG_30080
                        changes.append((pname, sec, BEG_30080, "30080 -> Assigned Verified BEIGE photo"))

            # --- 8. SPECIFIC MISMATCH CLEANSING ---
            elif '24116' in p_upper and any(c in p_upper for c in ['BRN', 'BROWN']):
                if sec and 'TAN' in sec.upper():
                    p['secondaryImageUrl'] = None
                    changes.append((pname, sec, None, "24116 -> Cleared TAN photo from BRN variant"))

            elif any(pseudo in (sec or '') for pseudo in ['VIEW-275', 'RATE-275', 'RATE-430']):
                p['secondaryImageUrl'] = None
                changes.append((pname, sec, None, "Barun -> Cleared pseudo-model price photo"))

            elif 'DELUXE-58' in p_upper and 'GRY' in p_upper:
                if sec and 'BLK' in sec.upper():
                    p['secondaryImageUrl'] = None
                    changes.append((pname, sec, None, "Deluxe-58 -> Cleared BLK photo from GRY variant"))

            elif '6814' in p_upper and 'BRN' in p_upper:
                if sec and 'BLK' in sec.upper():
                    p['secondaryImageUrl'] = None
                    changes.append((pname, sec, None, "Vertex 6814 -> Cleared BLK photo from BRN variant"))

            elif 'SELTOS-39' in p_upper and 'BLU' in p_upper:
                if sec and 'PNK' in sec.upper():
                    p['secondaryImageUrl'] = None
                    changes.append((pname, sec, None, "Seltos-39 -> Cleared PNK photo from BLU variant"))

            elif any(teuz in p_upper for teuz in ['JUGNU-01', 'USA-05']) and any(c in p_upper for c in ['BLU', 'N.BLU']):
                if sec and 'BLK' in sec.upper():
                    p['secondaryImageUrl'] = None
                    changes.append((pname, sec, None, f"{pname} -> Cleared BLK photo from BLU variant"))

            elif any(uam in p_upper for uam in ['STRIKER-03', 'STRIKER-06']):
                if ('BLU' in p_upper or 'GREY' in p_upper) and (sec and 'BLK' in sec.upper()):
                    p['secondaryImageUrl'] = None
                    changes.append((pname, sec, None, f"{pname} -> Cleared BLK photo from BLU/GREY variant"))

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Total changes applied: {len(changes)}")
    for prod, old_u, new_u, desc in changes:
        old_fn = old_u.split('/')[-1] if old_u else 'None'
        new_fn = new_u.split('/')[-1] if new_u else 'None'
        print(f"  ✓ {desc}: {prod} [{old_fn} -> {new_fn}]")

    return len(changes)

if __name__ == '__main__':
    frontend_path = r"c:\Projects\sriyasync_github\sbe\frontend\public\assets\stock-data.json"
    hub_path = r"c:\Projects\sriyasync_github\sbe\sbe-hub\public\assets\stock-data.json"
    fix_database(frontend_path)
    fix_database(hub_path)
