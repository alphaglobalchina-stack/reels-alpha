"""Cuts the Petronas towers out of the KL night photo (rembg / isnet-general-use).

Output: assets/malaysia/kl-towers-cutout.png — same pixel grid as kl-petronas-night.jpg
(top 620 rows), so it sits exactly on the photo and continues the towers past the card edge.
Edges are colour-decontaminated (edge pixels take the colour of the nearest solid tower
pixel) and the alpha is tightened slightly, so no sky fringe / halo shows on light cards.
Requires: pip install "rembg[cpu]" numpy pillow scipy
"""
import numpy as np
from PIL import Image
from scipy import ndimage
from pathlib import Path
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'malaysia'
im = Image.open(ROOT / 'kl-petronas-night.jpg').convert('RGB')
W, H = im.size
X0, X1, Y1 = 380, 800, 620
cut = remove(im.crop((X0, 0, X1, Y1)), session=new_session('isnet-general-use'))
c = np.asarray(cut).astype(np.float32) / 255
rgb, al = c[..., :3], c[..., 3]
# keep only the two big components (towers + sky-bridge)
lab, n = ndimage.label(al > 0.5)
sizes = ndimage.sum(np.ones_like(al), lab, range(1, n + 1))
keep = np.isin(lab, 1 + np.argsort(sizes)[-2:])
keep = ndimage.binary_dilation(keep, iterations=3)
al = al * keep
# tighten + decontaminate
al = np.clip((al - 0.18) / 0.8, 0, 1)
solid = al > 0.97
_, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
rgb = np.where((al < 0.97)[..., None], rgb[iy, ix], rgb)
# fade the bottom: it sits over the identical photo there, so the fade is invisible
al = al * np.clip((575 - np.arange(Y1)) / 80, 0, 1)[:, None]
full = np.zeros((Y1, W, 4), np.float32)
full[:, X0:X1, :3] = rgb
full[:, X0:X1, 3] = al
Image.fromarray((full * 255 + 0.5).astype(np.uint8), 'RGBA').save(ROOT / 'kl-towers-cutout.png')
print('saved')
