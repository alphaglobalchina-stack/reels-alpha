"""Post-export QA: one frame every 0.5 s.

Writes out/qa/sheet_*.jpg (contact sheets with the reels safe-zone lines) and prints, per frame:
  * dead%   — share of the frame made of flat, lifeless near-white 40 px blocks
              (luminance > 238 and std < 1.2) → the client wants no flat white areas
  * green%  — share of pixels with a green hue (70–170°, saturation > 0.07) — brand rule: no green
              (the Langkawi photo is reported separately in the README)
  * edge    — dark ink pixels touching the left/right frame border inside the safe band (clipping hint)
usage: python3 scripts/qa_frames.py [video]
"""
import json
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

src = sys.argv[1] if len(sys.argv) > 1 else 'out/reel_malaysia.mp4'
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
times = [round(i * 0.5, 2) for i in range(int(dur / 0.5) + 1) if i * 0.5 <= dur - 0.02]
if times[-1] < 17.9:
    times.append(17.95)

rows = []
thumbs = []
for t in times:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    im = np.frombuffer(raw, np.uint8).reshape(1920, 1080, 3).astype(np.float32)
    lum = im @ np.array([0.299, 0.587, 0.114], np.float32)
    B = 40
    blocks = lum[: 1920 // B * B, : 1080 // B * B].reshape(1920 // B, B, 1080 // B, B)
    dead = ((blocks.mean((1, 3)) > 238) & (blocks.std((1, 3)) < 1.2)).mean() * 100
    mx = im.max(-1)
    mn = im.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    green = ((hue > 70) & (hue < 170) & (sat > 0.07) & (mx > 60)).mean() * 100
    band = slice(250, 1570)
    edge = int(((lum[band, :3] < 80).sum() + (lum[band, -3:] < 80).sum()))
    rows.append({'t': t, 'frame': int(round(t * 30)), 'dead_white_pct': round(float(dead), 2), 'green_pct': round(float(green), 3), 'edge_dark_px': edge})
    th = Image.fromarray(im.astype(np.uint8)).resize((270, 480))
    d = ImageDraw.Draw(th)
    for y in (250, 1570):
        d.line([(0, y / 4), (270, y / 4)], fill=(255, 0, 0))
    thumbs.append((t, th))

cols = 6
per_sheet = 18
for s in range(0, len(thumbs), per_sheet):
    chunk = thumbs[s : s + per_sheet]
    n_rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 270, n_rows * 502), 'white')
    d = ImageDraw.Draw(sheet)
    for i, (t, th) in enumerate(chunk):
        x, y = (i % cols) * 270, (i // cols) * 502
        sheet.paste(th, (x, y))
        d.text((x + 6, y + 484), f'{t:.1f}s  f{int(round(t * 30))}', fill='black')
    sheet.save(f'out/qa/sheet_{s // per_sheet + 1}.jpg', quality=88)

for r in rows:
    print(f"{r['t']:5.1f}s f{r['frame']:3d}  dead {r['dead_white_pct']:5.2f}%  green {r['green_pct']:6.3f}%  edge {r['edge_dark_px']}")
json.dump(rows, open('out/qa/frames_report.json', 'w'), indent=1)
print('max dead%', max(r['dead_white_pct'] for r in rows), ' max green%', max(r['green_pct'] for r in rows))
