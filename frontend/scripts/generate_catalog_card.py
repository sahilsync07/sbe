import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def create_catalog_card(
    shoe_img_path,
    brand_logo_path,
    sub_brand_text,
    article_number,
    color_text,
    size_text,
    mrp_text,
    sole_text="EVA",
    packing_text="24 PAIRS",
    out_path="catalog_card_sample.webp",
    theme="blue"
):
    # Standard Card Canvas: 900 x 1200
    W, H = 900, 1200
    card = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(card)

    # 1. Gradient Background
    if theme == "blue":
        top_color = (224, 242, 254)   # #e0f2fe
        bot_color = (186, 230, 253)   # #bae6fd
        wave_color = (2, 132, 199)    # #0284c7
        deep_wave = (3, 105, 161)     # #0369a1
    elif theme == "rose":
        top_color = (255, 241, 242)
        bot_color = (254, 205, 211)
        wave_color = (225, 29, 72)
        deep_wave = (159, 18, 57)
    else:
        top_color = (248, 250, 252)
        bot_color = (226, 232, 240)
        wave_color = (15, 23, 42)
        deep_wave = (2, 6, 23)

    # Draw vertical linear gradient
    for y in range(H):
        r = int(top_color[0] + (bot_color[0] - top_color[0]) * (y / H))
        g = int(top_color[1] + (bot_color[1] - top_color[1]) * (y / H))
        b = int(top_color[2] + (bot_color[2] - top_color[2]) * (y / H))
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Bottom stylized wave curves
    draw.polygon([(0, 1060), (300, 1030), (600, 1070), (W, 1040), (W, H), (0, H)], fill=wave_color)
    draw.polygon([(0, 1100), (400, 1080), (750, 1110), (W, 1090), (W, H), (0, H)], fill=deep_wave)

    # 2. Add Brand Logo on Top Left
    if os.path.exists(brand_logo_path):
        logo = Image.open(brand_logo_path).convert("RGBA")
        logo.thumbnail((260, 90), Image.Resampling.LANCZOS)
        card.paste(logo, (50, 50), logo)

    # 3. Add Sub-Brand & Article Number on Top Right
    try:
        font_sub = ImageFont.truetype("arialbd.ttf", 46)
        font_art = ImageFont.truetype("arialbd.ttf", 56)
        font_color = ImageFont.truetype("arialbd.ttf", 32)
        font_strip = ImageFont.truetype("arialbd.ttf", 26)
    except Exception:
        font_sub = font_art = font_color = font_strip = ImageFont.load_default()

    sub_w = draw.textlength(sub_brand_text, font=font_sub)
    draw.text((W - 60 - sub_w, 55), sub_brand_text, fill=(15, 23, 42), font=font_sub)
    art_w = draw.textlength(article_number, font=font_art)
    draw.text((W - 60 - art_w, 115), article_number, fill=(15, 23, 42), font=font_art)

    # 4. Center Footwear with Soft Shadow
    shoe = Image.open(shoe_img_path).convert("RGBA")
    # Make white background transparent
    datas = shoe.getdata()
    newData = []
    for item in datas:
        # If near white, set transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    shoe.putdata(newData)

    # Resize shoe to fit central area (max 650x700)
    shoe.thumbnail((620, 680), Image.Resampling.LANCZOS)
    shoe_x = (W - shoe.width) // 2
    shoe_y = 230 + (680 - shoe.height) // 2

    # Drop Shadow
    shadow = Image.new("RGBA", (shoe.width + 40, shoe.height + 40), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.ellipse([20, shadow.height - 50, shadow.width - 20, shadow.height - 10], fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(15))
    card.paste(shadow, (shoe_x - 20, shoe_y - 10), shadow)

    # Paste Shoe
    card.paste(shoe, (shoe_x, shoe_y), shoe)

    # 5. Color Label above bottom wave
    draw.text((60, 960), color_text.upper(), fill=(15, 23, 42), font=font_color)

    # 6. Bottom Specification Strip (White text on deep wave)
    strip_line1 = f"SIZE : {size_text}   |   MRP : {mrp_text}"
    strip_line2 = f"SOLE : {sole_text}   |   PACKING : {packing_text}"
    l1_w = draw.textlength(strip_line1, font=font_strip)
    l2_w = draw.textlength(strip_line2, font=font_strip)
    draw.text(((W - l1_w) // 2, 1115), strip_line1, fill=(255, 255, 255), font=font_strip)
    draw.text(((W - l2_w) // 2, 1150), strip_line2, fill=(255, 255, 255), font=font_strip)

    # Save as high-quality WebP
    card.convert("RGB").save(out_path, "WEBP", quality=92)
    print(f"✓ Generated catalog card: {out_path}")

if __name__ == '__main__':
    create_catalog_card(
        shoe_img_path=r"frontend/public/assets/catalog_models/PARAGON_033_P5.webp",
        brand_logo_path=r"frontend/public/assets/logos/paragon-logo.png",
        sub_brand_text="ParaLite",
        article_number="033",
        color_text="BLACK",
        size_text="02/05, 06/09",
        mrp_text="₹135.00, ₹145.00",
        sole_text="EVA",
        packing_text="24 PAIRS",
        out_path=r"frontend/public/assets/catalog_models/PARAGON_033_CARD.webp",
        theme="blue"
    )
