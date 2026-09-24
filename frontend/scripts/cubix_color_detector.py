import colorsys
from collections import Counter
from PIL import Image

def analyze_shoe_color(img):
    """
    Advanced chromatic classifier on foreground shoe pixels:
    - Crops center/upper ROI to isolate the shoe from header banners and bottom specs.
    - Filters out white pedestals, backdrops, and neutral grey studio walls.
    - Categorizes saturated and dark shoe pixels into standard footwear color families.
    """
    w, h = img.size
    # Shoe ROI: central 60% horizontally, 18%-70% vertically
    crop_box = (int(w * 0.20), int(h * 0.18), int(w * 0.80), int(h * 0.70))
    shoe_crop = img.crop(crop_box).resize((80, 80))
    
    pixels = []
    for y in range(80):
        for x in range(80):
            pixels.append(shoe_crop.getpixel((x, y))[:3])

    hsv_list = [colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0) for r, g, b in pixels]

    # Filter out studio background:
    # 1. White / pale cream pedestal or backdrop
    # 2. Neutral grey studio wall/floor (s < 0.10 and v > 0.35)
    shoe_px = []
    for h_deg, s, v in [(h*360, s, v) for h, s, v in hsv_list]:
        if v > 0.85 and s < 0.15:
            continue
        if s < 0.10 and v > 0.35:
            continue
        shoe_px.append((h_deg, s, v))

    if not shoe_px:
        return 'UNKNOWN', 0.0, {}

    bins = Counter()
    for h_deg, s, v in shoe_px:
        # Achromatic black vs saturated colors
        if v < 0.22 or (s < 0.14 and v < 0.30):
            bins['BLK'] += 1
        elif s < 0.14:
            if v > 0.65:
                bins['WHT_BGE'] += 1
            else:
                bins['GRY'] += 1
        else:
            # Saturated chromatic colors
            if 65 <= h_deg <= 168:
                bins['GRN'] += 1
            elif 170 <= h_deg <= 260:
                bins['BLU'] += 1
            elif 262 <= h_deg <= 328:
                bins['GRP'] += 1
            elif (335 < h_deg <= 360 or 0 <= h_deg <= 10):
                if v > 0.55:
                    bins['PNK'] += 1
                else:
                    bins['MRN'] += 1
            elif 10 < h_deg < 65:
                if s > 0.45 and v > 0.68 and h_deg >= 42:
                    bins['YLW_GLD'] += 1
                elif v > 0.65 and s <= 0.38:
                    bins['WHT_BGE'] += 1
                elif s > 0.16:
                    bins['BRN'] += 1
                else:
                    bins['WHT_BGE'] += 1
            else:
                bins['BRN'] += 1

    total = len(shoe_px)
    if not bins:
        return 'UNKNOWN', 0.0, {}

    # Dominant color selection:
    top_color, top_count = bins.most_common(1)[0]
    chroma_bins = {k: v for k, v in bins.items() if k not in ['BLK', 'GRY', 'WHT_BGE']}
    total_chroma = sum(chroma_bins.values())

    # Sole vs Upper logic:
    # If the base count is BLK or GRY, but there is a clear chromatic shoe upper:
    # Require at least 20% of the entire shoe area, and the best chroma must comprise
    # >= 60% of chromatic pixels and >= 20% of total shoe pixels.
    if top_color in ['BLK', 'GRY'] and total_chroma >= 0.20 * total:
        best_chroma, chroma_count = max(chroma_bins.items(), key=lambda x: x[1])
        if chroma_count >= 0.20 * total and chroma_count >= 0.60 * total_chroma:
            top_color = best_chroma
            top_count = chroma_count

    pct = round((top_count / total) * 100, 1)
    return top_color, pct, dict(bins)

