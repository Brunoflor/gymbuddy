#!/usr/bin/env python3
"""Draw the GymBuddy app icons. Requires Pillow."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def icon(size: int) -> Image.Image:
    image = Image.new("RGB", (size, size), "#1e3a32")
    draw = ImageDraw.Draw(image)
    margin = int(size * 0.14)
    radius = int(size * 0.18)
    draw.rounded_rectangle(
        (margin, margin, size - margin, size - margin),
        radius=radius,
        fill="#f3eee4",
    )
    bar_top = int(size * 0.58)
    draw.rounded_rectangle(
        (int(size * 0.24), bar_top, int(size * 0.76), bar_top + int(size * 0.07)),
        radius=int(size * 0.03),
        fill="#c2410c",
    )
    font = ImageFont.truetype(FONT, int(size * 0.28))
    text = "GB"
    box = draw.textbbox((0, 0), text, font=font)
    width = box[2] - box[0]
    draw.text(((size - width) / 2, int(size * 0.22)), text, font=font, fill="#1e3a32")
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon(192).save(OUT / "icon-192.png")
    icon(512).save(OUT / "icon-512.png")
    icon(180).save(OUT / "apple-touch-icon.png")


if __name__ == "__main__":
    main()
