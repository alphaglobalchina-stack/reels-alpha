"""Image preparation for the Malaysia reel.

* towers-cutout.png : Petronas Twin Towers cut out of petronas-kl.webp
  (per-row silhouette, 2px edge shrink, 1px feather -> no sky halo).
* logo-emblem.png   : gold tree/plane emblem lifted off the black logo background.
* city photos       : re-encoded at full frame (4:5, no crop). Langkawi gets a gentle
  warm grade that pulls the foliage away from saturated green (brand rule: no green).
* grain.png         : near-invisible canvas grain tile.
Run: python3 scripts/prep_images.py
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import median_filter, gaussian_filter

SRC = 'assets-src'
OUT = 'public/img'


def towers():
    im = np.asarray(Image.open(f'{SRC}/petronas-kl.webp').convert('RGB')).astype(float) / 255
    H, W, _ = im.shape
    br = im[..., 2] - im[..., 0]
    lum = im.mean(-1)
    tower = (br < 0.06) | (lum > 0.55)  # sky above y~330 is clearly blue

    def measured(lo, hi, y0, y1):
        xs = np.full((y1 - y0, 2), np.nan)
        for y in range(y0, y1):
            r = tower[y, lo:hi].astype(int)
            run = r[:-2] & r[1:-1] & r[2:]
            idx = np.where(run)[0]
            if len(idx):
                xs[y - y0] = (lo + idx[0], lo + idx[-1] + 3)
        return xs

    alpha = np.zeros((H, W))
    xx = np.arange(W)[None, :]

    def paint(y, xl, xr):
        a = np.clip(xx[0] - xl + 0.5, 0, 1) * np.clip(xr - xx[0] + 0.5, 0, 1)
        alpha[y] = np.maximum(alpha[y], a)

    # name, window, spire top, spire end, measured until, steps [(y_from, xl, xr)], axis
    specs = [
        dict(lo=420, hi=562, tip=27, crown=96, meas_end=332, axis=494.6,
             steps=[(332, 435.5, 545.5), (404, 428.0, 548.5)]),
        dict(lo=622, hi=760, tip=66, crown=128, meas_end=328, axis=689.0,
             steps=[(328, 636.0, 735.5), (423, 632.0, 741.0)]),
    ]
    SHRINK = 2.0
    for s in specs:
        y0 = s['crown']
        m = measured(s['lo'], s['hi'], y0, s['meas_end'])
        # monotone (towers only widen downward) + median smoothing
        l = median_filter(np.nan_to_num(m[:, 0], nan=s['axis']), 7)
        r = median_filter(np.nan_to_num(m[:, 1], nan=s['axis']), 7)
        l = np.minimum.accumulate(l)
        r = np.maximum.accumulate(r)
        for i, y in enumerate(range(y0, s['meas_end'])):
            paint(y, l[i] + SHRINK, r[i] - SHRINK)
        # spire: thin lit needle, keep 3px wide (no shrink or it vanishes)
        for y in range(s['tip'], y0):
            t = (y - s['tip']) / (y0 - s['tip'])
            hw = 1.2 + 2.2 * t ** 2
            paint(y, s['axis'] - hw, s['axis'] + hw)
        steps = s['steps']
        for k, (ys, xl, xr) in enumerate(steps):
            ye = steps[k + 1][0] if k + 1 < len(steps) else 872
            for y in range(ys, ye):
                paint(y, xl + SHRINK, xr - SHRINK)
    # skybridge + its two support legs
    for y in range(560, 583):
        paint(y, 545, 634)
    legs = np.zeros((H, W))
    from PIL import ImageDraw
    li = Image.new('L', (W * 4, H * 4), 0)
    d = ImageDraw.Draw(li)
    for a, b in [((590, 584), (548, 666)), ((590, 584), (632, 662))]:
        d.line([(a[0] * 4, a[1] * 4), (b[0] * 4, b[1] * 4)], fill=255, width=12)
    legs = np.asarray(li.resize((W, H), Image.LANCZOS)).astype(float) / 255
    alpha = np.maximum(alpha, legs * 0.95)
    alpha = gaussian_filter(alpha, 0.6)
    alpha[:, :] = np.clip(alpha, 0, 1)
    # fade the base into nothing (title sits on top of it)
    ys = np.arange(H)[:, None]
    alpha *= np.clip((872 - ys) / 260, 0, 1) ** 1.2
    rgba = np.dstack([im, alpha])
    x0, x1, y0, y1 = 414, 756, 18, 872
    out = (rgba[y0:y1, x0:x1] * 255).round().astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(f'{OUT}/towers-cutout.png', optimize=True)
    print('towers-cutout', out.shape)


def logo():
    im = np.asarray(Image.open(f'{SRC}/logo-original.jpg').convert('RGB')).astype(float) / 255
    # emblem only: arc + plane + dragon-blood tree (text is re-set live in El Messiri / Sora)
    crop = im[95:440, 200:500]
    lum = crop.max(-1)
    a = np.clip((lum - 0.10) / 0.55, 0, 1)
    gold = np.array([0.80, 0.63, 0.22])
    # un-premultiply against black, then pull toward a single champagne-gold
    col = np.where(a[..., None] > 0.01, crop / np.maximum(a[..., None], 1e-3), gold)
    col = np.clip(0.6 * col + 0.4 * gold, 0, 1)
    out = (np.dstack([col, a]) * 255).round().astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    bbox = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(bbox)
    img.save(f'{OUT}/logo-emblem.png', optimize=True)
    print('logo-emblem', img.size)


def cities():
    for src, dst in [('petronas-kl.webp', 'city-kuala-lumpur.jpg'),
                     ('langkawi-skybridge.webp', 'city-langkawi.jpg'),
                     ('putra-mosque.webp', 'city-selangor.jpg')]:
        img = Image.open(f'{SRC}/{src}').convert('RGB')
        if 'langkawi' in src:
            hsv = np.asarray(img.convert('HSV')).astype(float)
            h = hsv[..., 0] * 360 / 255
            green = np.clip(1 - np.abs(h - 100) / 50, 0, 1)  # 50..150 deg
            hsv[..., 0] = np.where(green > 0, hsv[..., 0] - green * (38 * 255 / 360), hsv[..., 0])
            hsv[..., 1] *= (1 - 0.35 * green)
            img = Image.fromarray(hsv.clip(0, 255).astype(np.uint8), 'HSV').convert('RGB')
        img.save(f'{OUT}/{dst}', quality=92)
        print(dst, img.size)


def grain():
    rng = np.random.default_rng(7)
    n = rng.normal(0, 1, (512, 512))
    n = gaussian_filter(n, 0.7, mode='wrap')
    n = (n - n.min()) / (n.max() - n.min())
    a = (np.abs(n - 0.5) * 2) ** 1.5
    rgb = np.where(n[..., None] > 0.5, [255, 255, 255], [60, 50, 40])
    out = np.dstack([rgb, a * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(f'{OUT}/grain.png', optimize=True)


if __name__ == '__main__':
    towers()
    logo()
    cities()
    grain()
