"""QA: grab a frame every 0.5 s from a video and tile them (with the reels safe-zone lines)."""
import subprocess
import sys

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
start = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
end = float(sys.argv[4]) if len(sys.argv) > 4 else None
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 6
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
end = min(end or dur, dur - 0.01)
times = []
t = start
while t <= end + 1e-6:
    times.append(round(t, 2))
    t += 0.5
W, H = 270, 480
rows = (len(times) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 22)), 'white')
d = ImageDraw.Draw(sheet)
for i, t in enumerate(times):
    tmp = f'/tmp/_cs_{i}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', src, '-frames:v', '1', tmp], check=True)
    im = Image.open(tmp).convert('RGB').resize((W, H))
    dd = ImageDraw.Draw(im)
    for y in (250, 1920 - 350):
        dd.line([(0, y * H / 1920), (W, y * H / 1920)], fill=(255, 0, 0), width=1)
    x, y = (i % cols) * W, (i // cols) * (H + 22)
    sheet.paste(im, (x, y))
    d.text((x + 6, y + H + 4), f'{t:.1f}s  f{int(round(t * 30))}', fill='black')
sheet.save(out, quality=88)
print(out, len(times), 'frames')
