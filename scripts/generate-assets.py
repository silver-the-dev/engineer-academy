#!/usr/bin/env python3
"""Generates the app icon set, splash, notification icon and widget preview.

Run from the EngineerAcademy folder:  python3 scripts/generate-assets.py
"""
import datetime as dt
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
WIDGET_RES = os.path.join(ROOT, "modules", "streak-widget", "android", "src", "main", "res", "drawable-nodpi")
os.makedirs(WIDGET_RES, exist_ok=True)

MATH_FONT = "/usr/share/fonts/google-noto/NotoSansMath-Regular.ttf"
BOLD_FONT = "/usr/share/fonts/julietaula-montserrat-fonts/Montserrat-ExtraBold.otf"
TEXT_FONT = "/usr/share/fonts/google-noto/NotoSans-Bold.ttf"

NAVY = (11, 16, 32)
PURPLE = (124, 92, 255)
CYAN = (0, 212, 255)
GOLD = (255, 200, 61)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size, c1, c2, angle_deg=135):
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    ang = math.radians(angle_deg)
    dx, dy = math.cos(ang), math.sin(ang)
    norm = abs(dx) * w + abs(dy) * h
    for y in range(h):
        for x in range(w):
            t = ((x * dx + y * dy) - min(0, dx * w) - min(0, dy * h)) / norm
            px[x, y] = lerp(c1, c2, max(0.0, min(1.0, t)))
    return img


def glyph_layer(size, color=(255, 255, 255, 255), scale=1.0, star=True):
    """White integral sign + small star, centered inside the adaptive-icon safe zone."""
    S = size * 4  # supersample
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    font = ImageFont.truetype(MATH_FONT, int(S * 0.50 * scale))
    text = "∫"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (S - tw) / 2 - bbox[0] - S * 0.02
    y = (S - th) / 2 - bbox[1]
    # soft shadow
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text((x + S * 0.01, y + S * 0.015), text, font=font, fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(S * 0.012))
    layer.alpha_composite(shadow)
    d.text((x, y), text, font=font, fill=color)
    if star:
        cx, cy, r = S * 0.665, S * 0.33, S * 0.065 * scale
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = r if i % 2 == 0 else r * 0.45
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        d.polygon(pts, fill=GOLD + (255,) if color[:3] == (255, 255, 255) else color)
    return layer.resize((size, size), Image.LANCZOS)


def rounded_mask(size, radius):
    S = size * 4
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, S - 1, S - 1), radius * 4, fill=255)
    return m.resize((size, size), Image.LANCZOS)


def main():
    # Adaptive icon background
    bg = gradient((1024, 1024), PURPLE, CYAN)
    bg.save(os.path.join(ASSETS, "android-icon-background.png"))
    # Foreground (glyph within safe zone ~ 66%)
    fg = glyph_layer(1024, scale=0.82)
    fg.save(os.path.join(ASSETS, "android-icon-foreground.png"))
    # Monochrome
    mono = glyph_layer(1024, scale=0.82, star=True)
    mono_px = mono.split()[3]
    mono_img = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
    mono_img.putalpha(mono_px)
    mono_img.save(os.path.join(ASSETS, "android-icon-monochrome.png"))
    # Legacy full icon
    full = bg.convert("RGBA")
    full.alpha_composite(glyph_layer(1024, scale=1.05))
    out = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    out.paste(full, (0, 0), rounded_mask(1024, 220))
    out.save(os.path.join(ASSETS, "icon.png"))
    out.resize((48, 48), Image.LANCZOS).save(os.path.join(ASSETS, "favicon.png"))
    # Splash icon (glyph on transparent, gradient circle)
    sp = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    circle = bg.convert("RGBA")
    cm = Image.new("L", (4096, 4096), 0)
    ImageDraw.Draw(cm).ellipse((0, 0, 4095, 4095), fill=255)
    sp.paste(circle, (0, 0), cm.resize((1024, 1024), Image.LANCZOS))
    sp.alpha_composite(glyph_layer(1024, scale=1.0))
    sp.save(os.path.join(ASSETS, "splash-icon.png"))
    # Notification icon: white silhouette on transparent, 96px
    n = glyph_layer(384, scale=1.25, star=False)
    alpha = n.split()[3]
    ni = Image.new("RGBA", n.size, (255, 255, 255, 0))
    ni.putalpha(alpha)
    ni.resize((96, 96), Image.LANCZOS).save(os.path.join(ASSETS, "notification-icon.png"))

    # Widget preview (sample heatmap)
    render_widget_preview(os.path.join(WIDGET_RES, "widget_preview.png"))
    print("assets ok")


def render_widget_preview(path):
    W, H, s = 760, 340, 2
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, W - 1, H - 1), 48, fill=(13, 17, 23, 255))
    levels = [(22, 27, 34), (14, 68, 41), (0, 109, 50), (38, 166, 65), (57, 211, 83)]
    f1 = ImageFont.truetype(TEXT_FONT, 32)
    f2 = ImageFont.truetype(TEXT_FONT, 22)
    d.text((28, 22), "12", font=f1, fill=(255, 159, 28))
    d.text((70, 22), " dias seguidos", font=f1, fill=(230, 237, 243))
    d.text((28, 68), "48 dias estudados · nível 7 · 2.340 XP", font=f2, fill=(139, 148, 158))
    random.seed(7)
    weeks, cell, gap = 22, 26, 6
    left, top = (W - (weeks * cell + (weeks - 1) * gap)) // 2, 112
    for c in range(weeks):
        for r in range(7):
            v = random.random()
            boost = c / weeks
            lvl = 0 if v > 0.35 + boost * 0.6 else min(4, int((v * 5 + boost * 3) % 5))
            if c >= weeks - 2:
                lvl = random.choice([3, 4])
            if c == weeks - 1 and r > 3:
                continue
            x, y = left + c * (cell + gap), top + r * (cell + gap)
            d.rounded_rectangle((x, y, x + cell, y + cell), 6, fill=levels[lvl] + (255,))
    img.save(path)


if __name__ == "__main__":
    main()
