"""Prepares the Malaysia reel images (assets/malaysia/src -> assets/malaysia).

- grade(): pulls foliage greens toward a warm champagne/olive tone (the brand forbids green)
- logo: keys the black background out of the Socotra logo -> transparent PNG
"""
import sys
import numpy as np
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'malaysia'
SRC = ROOT / 'src'


def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = (mx == r) & m; gg = (mx == g) & m & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    h = h * 60.0
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    c = v * s
    hp = (h % 360) / 60.0
    x = c * (1 - np.abs(hp % 2 - 1))
    z = np.zeros_like(h)
    conds = [(hp < 1), (hp < 2), (hp < 3), (hp < 4), (hp < 5), (hp >= 5)]
    rgbs = [(c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x)]
    r = np.select(conds, [t[0] for t in rgbs]); g = np.select(conds, [t[1] for t in rgbs]); b = np.select(conds, [t[2] for t in rgbs])
    m = v - c
    return np.stack([r + m, g + m, b + m], -1)


def grade(img, strength=float(sys.argv[1]) if len(sys.argv) > 1 else 1.0):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    h, s, v = rgb_to_hsv(a)
    # weight: 1 in the green band (75..165deg), smooth falloff to 0 at 55 / 190
    # hue shift only inside the foliage band (shifting cyan would sweep it *through* green)
    wh = np.clip((h - 40) / 16, 0, 1) * np.clip((150 - h) / 20, 0, 1) * strength
    # saturation pull covers foliage + turquoise water
    ws = np.clip((h - 40) / 16, 0, 1) * np.clip((205 - h) / 25, 0, 1) * strength
    cyan = np.clip((h - 150) / 20, 0, 1)  # water keeps more of its colour than foliage
    target_h = 30.0  # warm champagne / bronze
    h2 = h + (target_h - h) * wh
    s2 = s * (1 - ws * (0.8 - 0.35 * cyan))
    v2 = v * (1 - 0.04 * wh)
    out = hsv_to_rgb(h2, s2, v2)
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


for name in ['langkawi-skybridge', 'genting-cablecar', 'kl-petronas-night']:
    im = Image.open(SRC / f'{name}.webp')
    grade(im).save(ROOT / f'{name}.jpg', quality=93)

# Logo: luminance -> alpha, un-premultiply so the gold keeps its colour (no dark fringe)
lg = np.asarray(Image.open(SRC / 'socotra-logo.jpg').convert('RGB')).astype(np.float32) / 255
alpha = np.clip((lg.max(-1) - 0.06) / 0.55, 0, 1)
col = np.clip(lg / np.maximum(alpha[..., None], 1e-3), 0, 1)
rgba = np.concatenate([col, alpha[..., None]], -1)
Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(ROOT / 'socotra-logo.png')
# Mark only (tree + plane ring), cropped above the wordmark
mark = Image.open(ROOT / 'socotra-logo.png').crop((195, 90, 500, 445))
mark.save(ROOT / 'socotra-mark.png')
print('ok')
