"""
create_icons.py
Generates simple placeholder PNG icons for the CareerTracker Clipper extension.
Requires: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs("icons", exist_ok=True)

BG_COLOR = (34, 139, 230)   # #228be6  (Mantine blue)
TEXT_COLOR = (255, 255, 255)

SIZES = {
    "icons/icon16.png": 16,
    "icons/icon48.png": 48,
    "icons/icon128.png": 128,
}

for path, size in SIZES.items():
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    radius = size // 5
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG_COLOR)

    # "CT" text
    label = "CT"
    font_size = max(6, int(size * 0.38))
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()

    # Centre the text
    bbox = draw.textbbox((0, 0), label, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), label, fill=TEXT_COLOR, font=font)

    img.save(path)
    print(f"Created {path} ({size}x{size})")

print("Done! Icons saved to icons/")
