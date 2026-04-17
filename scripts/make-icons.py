#!/usr/bin/env python3
"""Generate FC-monogram placeholder icons for Fair Copy.

Canonical color: #7A1F2B (Fair Copy burgundy — derived from the
editorial red used in the task-pane UI).

Sizes output:
  - App sizes for Office:         16, 32, 64, 80, 128
  - AppSource Partner Center:     300 (square logo), 512 (large)

Usage:
  python3 -m venv /tmp/fc-venv
  /tmp/fc-venv/bin/pip install pillow
  /tmp/fc-venv/bin/python scripts/make-icons.py

Outputs are written to `public/assets/icon-<size>.png` and picked up by
vite's public/ convention so they ship inside `dist/`.

These icons are PLACEHOLDERS. Replace with real branded art before
AppSource submission — see docs/launch/appsource/submission-checklist.md.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os

SIZES = [16, 32, 64, 80, 128, 300, 512]
BG = (122, 31, 43, 255)  # #7A1F2B — Fair Copy burgundy
FG = (245, 233, 221, 255)  # warm cream — matches Fraunces editorial aesthetic
BORDER = (72, 18, 25, 255)  # darker burgundy for bezel

# Font candidates — Georgia Bold is always present on macOS; Times New
# Roman Bold is the fallback. Fraunces is the "real" Fair Copy brand face
# but isn't a system font; subbing Georgia keeps the editorial feel.
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttc",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
    "/Library/Fonts/Georgia.ttf",
]


def pick_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def main():
    outdir = Path("public/assets")
    outdir.mkdir(parents=True, exist_ok=True)

    for size in SIZES:
        img = Image.new("RGBA", (size, size), BG)
        draw = ImageDraw.Draw(img)

        # Subtle bezel so the icon reads against both light and dark chrome.
        border_width = max(1, size // 40)
        for i in range(border_width):
            draw.rectangle([i, i, size - 1 - i, size - 1 - i], outline=BORDER)

        # "FC" at legible sizes; just "F" at 32px and below (two letters
        # become unreadable mush at those scales).
        text = "FC" if size >= 48 else "F"
        pct = 0.55 if text == "FC" else 0.70
        font = pick_font(int(size * pct))

        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (size - tw) // 2 - bbox[0]
        y = (size - th) // 2 - bbox[1] - max(1, size // 40)

        if size >= 64:
            shadow_offset = max(1, size // 80)
            draw.text(
                (x + shadow_offset, y + shadow_offset),
                text,
                fill=(0, 0, 0, 80),
                font=font,
            )

        draw.text((x, y), text, fill=FG, font=font)

        out_path = outdir / f"icon-{size}.png"
        img.save(out_path, "PNG")
        print(f"wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
