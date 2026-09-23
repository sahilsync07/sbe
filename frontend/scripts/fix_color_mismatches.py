import json

CHIKKU_IMG = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151843/e-sbe/cubix/CUBIX_C_60612_PNK.jpg" # Actually Chikku
PINK_IMG = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151815/e-sbe/cubix/CUBIX_C_60612_CHIKKU.jpg" # Actually Pink

# 24511 URLs
BLUE_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151415/e-sbe/cubix/CUBIX_E_24511_GRP.jpg" # Actually Blue
GRAPE_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151413/e-sbe/cubix/CUBIX_E_24511_BRN.jpg" # Actually Grape
BROWN_24511 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151384/e-sbe/cubix/CUBIX_24511_BRN.jpg"

# 24514 URLs
BISCUIT_24514 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151806/e-sbe/cubix/CUBIX_24514_BLK.jpg" # Actually Biscuit
BLACK_24514 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151800/e-sbe/cubix/CUBIX_24514_BISCUIT.jpg" # Actually Black

# 29506 URLs
GREEN_29506 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151347/e-sbe/cubix/CUBIX_E_29506_BLK.jpg" # Actually Green
BROWN_29506 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151803/e-sbe/cubix/CUBIX_29506_BRN.jpg" # Actually Brown

# 15007 URLs
BLUE_15007 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151595/e-sbe/cubix/CUBIX_15007_GRP.jpg" # Actually Silky Blue
GRAPE_15007 = "https://res.cloudinary.com/dieqsg5tr/image/upload/v1790151571/e-sbe/cubix/CUBIX_15007_BLU.jpg" # Actually Grape

def fix_database(file_path):
    print(f"\nProcessing: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changed = 0
    for g in data:
        gname = g.get('groupName', '').upper()
        if 'CUBIX' in gname:
            for p in g.get('products', []):
                pname = p.get('productName', '')

                # 1. 60612 Swap (Pink was Chikku, Chikku was Pink)
                if '60612' in pname:
                    if 'CHIKKU' in pname.upper() or 'CHIKOO' in pname.upper():
                        p['secondaryImageUrl'] = CHIKKU_IMG
                        print(f"  Fixed 60612 CHIKKU -> Chikku photo for {pname}")
                        changed += 1
                    elif 'PNK' in pname.upper() or 'PINK' in pname.upper():
                        p['secondaryImageUrl'] = PINK_IMG
                        print(f"  Fixed 60612 PINK -> Pink photo for {pname}")
                        changed += 1

                # 2. 21584 Silver has Brown photo -> Clear
                elif '21584' in pname and 'SILVER' in pname.upper():
                    p['secondaryImageUrl'] = None
                    print(f"  Cleared mismatched Brown photo from {pname}")
                    changed += 1

                # 3. 24511 Fixes
                elif '24511' in pname:
                    if 'BLU' in pname.upper() or 'BLUE' in pname.upper():
                        p['secondaryImageUrl'] = BLUE_24511
                        print(f"  Fixed 24511 BLUE -> Blue photo for {pname}")
                        changed += 1
                    elif 'GRP' in pname.upper() or 'GRAPE' in pname.upper():
                        p['secondaryImageUrl'] = GRAPE_24511
                        print(f"  Fixed 24511 GRAPE -> Grape photo for {pname}")
                        changed += 1
                    elif 'BRN' in pname.upper() or 'BROWN' in pname.upper():
                        p['secondaryImageUrl'] = BROWN_24511
                        print(f"  Fixed 24511 BROWN -> Brown photo for {pname}")
                        changed += 1
                    elif 'BLK' in pname.upper() or 'BLACK' in pname.upper():
                        p['secondaryImageUrl'] = None # Clear mislabeled brown photo
                        print(f"  Cleared mislabeled photo from {pname}")
                        changed += 1

                # 4. 24514 Fixes
                elif '24514' in pname:
                    if 'BISCUIT' in pname.upper():
                        p['secondaryImageUrl'] = BISCUIT_24514
                        print(f"  Fixed 24514 BISCUIT -> Biscuit photo for {pname}")
                        changed += 1
                    elif 'BLK' in pname.upper() or 'BLACK' in pname.upper():
                        p['secondaryImageUrl'] = BLACK_24514
                        print(f"  Fixed 24514 BLACK -> Black photo for {pname}")
                        changed += 1

                # 5. 29506 Fixes
                elif '29506' in pname:
                    if 'GRN' in pname.upper() or 'GREEN' in pname.upper():
                        p['secondaryImageUrl'] = GREEN_29506
                        print(f"  Fixed 29506 GREEN -> Green photo for {pname}")
                        changed += 1
                    elif 'BRN' in pname.upper() or 'BROWN' in pname.upper():
                        p['secondaryImageUrl'] = BROWN_29506
                        print(f"  Fixed 29506 BROWN -> Brown photo for {pname}")
                        changed += 1
                    elif 'BLK' in pname.upper() or 'BLACK' in pname.upper():
                        p['secondaryImageUrl'] = None # Clear green photo
                        print(f"  Cleared mismatched Green photo from {pname}")
                        changed += 1

                # 6. 15007 Fixes (Silky Blue vs Grape)
                elif '15007' in pname:
                    if 'BLU' in pname.upper() or 'BLUE' in pname.upper():
                        p['secondaryImageUrl'] = BLUE_15007
                        print(f"  Fixed 15007 BLUE -> Silky Blue photo for {pname}")
                        changed += 1
                    elif 'GRP' in pname.upper() or 'GRAP' in pname.upper():
                        p['secondaryImageUrl'] = GRAPE_15007
                        print(f"  Fixed 15007 GRAPE -> Grape photo for {pname}")
                        changed += 1

                # 7. Other blatant mismatches
                elif '50525' in pname and 'BLK' in pname.upper() and p.get('secondaryImageUrl', '').endswith('KAKKI_MRP329.jpg'):
                    p['secondaryImageUrl'] = None
                    print(f"  Cleared KAKKI from BLK: {pname}")
                    changed += 1
                elif '60557' in pname and 'TAN' in pname.upper() and p.get('secondaryImageUrl', '').endswith('BLK_MRP254.jpg'):
                    p['secondaryImageUrl'] = None
                    print(f"  Cleared BLK from TAN: {pname}")
                    changed += 1
                elif '77016' in pname and 'BLK' in pname.upper() and p.get('secondaryImageUrl', '').endswith('GRN_MRP379.jpg'):
                    p['secondaryImageUrl'] = None
                    print(f"  Cleared GRN from BLK: {pname}")
                    changed += 1
                elif '24506' in pname and 'BLK' in pname.upper() and p.get('secondaryImageUrl', '').endswith('BRN_MRP399.jpg'):
                    p['secondaryImageUrl'] = None
                    print(f"  Cleared BRN from BLK: {pname}")
                    changed += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Total fixes applied to {file_path}: {changed}")

if __name__ == '__main__':
    fix_database(r"c:\Projects\sbe\frontend\public\assets\stock-data.json")
    fix_database(r"c:\Projects\sbe\sbe-hub\public\assets\stock-data.json")
