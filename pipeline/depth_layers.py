"""
Break photos into depth layers for real parallax (V2).

Depth Anything V2 (small, ONNX) → relative depth → far / mid / near layers with feathered
alpha. Regions occupied by nearer layers are inpainted in the layers behind them so the
camera can travel between layers without revealing holes. Person cut-outs (u2net human
segmentation via rembg) are exported separately as foreground occluders.

Out: assets/film/layers/<name>_{far,mid,near}.webp (+ <name>_person.webp), depth previews
in pipeline/work/depth/.
"""
import os, sys
import cv2
import numpy as np
import onnxruntime as ort

M = '/home/user/models/da2_vits.onnx'
OUT = 'assets/film/layers'
os.makedirs(OUT, exist_ok=True)
os.makedirs('pipeline/work/depth', exist_ok=True)
sess = ort.InferenceSession(M)

# name: (source, near quantile, far quantile, max width)
PHOTOS = {
    'hall': ('assets/film/fair_hall.webp', 0.80, 0.45, 1080),
    'booth': ('assets/film/fair_booth.webp', 0.72, 0.40, 1254),
    'exterior': ('assets/film/fair_exterior.webp', 0.82, 0.50, 1254),
    'cmp': ('assets/photos16/cmp.jpg', 0.70, 0.40, 1100),
    'line': ('assets/photos16/line.jpg', 0.78, 0.45, 1100),
    'insp': ('assets/photos16/insp.jpg', 0.70, 0.40, 1100),
    'cnc': ('assets/photos16/cnc.jpg', 0.75, 0.42, 1100),
    'pack': ('assets/photos16/pack.jpg', 0.78, 0.45, 1100),
    'factory': ('assets/photos17/n4.jpg', 0.78, 0.45, 1344),
    'ware': ('assets/photos16/ware.jpg', 0.75, 0.45, 1100),
}

def depth(img):
    h, w = img.shape[:2]
    x = cv2.resize(img, (518, 518), interpolation=cv2.INTER_CUBIC)[:, :, ::-1].astype(np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = cv2.resize(d, (w, h), interpolation=cv2.INTER_CUBIC)
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    return cv2.bilateralFilter(d.astype(np.float32), 9, 0.1, 9)

def inpaint(img, mask):
    """fill masked area from surroundings (downscaled Telea + blur, good enough behind parallax)"""
    s = 0.25
    small = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    m = cv2.resize(mask, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    filled = cv2.inpaint(small, m, 9, cv2.INPAINT_TELEA)
    filled = cv2.GaussianBlur(filled, (0, 0), 3)
    big = cv2.resize(filled, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)
    mm = cv2.GaussianBlur((mask > 0).astype(np.float32), (0, 0), 6)[..., None]
    return (img * (1 - mm) + big * mm).astype(np.uint8)

def save(name, img, alpha=None):
    if alpha is None:
        cv2.imwrite(f'{OUT}/{name}.webp', img, [cv2.IMWRITE_WEBP_QUALITY, 88])
    else:
        a = np.clip(alpha * 255, 0, 255).astype(np.uint8)
        cv2.imwrite(f'{OUT}/{name}.webp', np.dstack([img, a]), [cv2.IMWRITE_WEBP_QUALITY, 90])

only = set(sys.argv[1:])
for name, (src, qn, qf, maxw) in PHOTOS.items():
    if only and name not in only:
        continue
    cap = cv2.VideoCapture(src) if src.endswith('.webp') else None
    img = cap.read()[1] if cap is not None else cv2.imread(src)
    if img.shape[1] > maxw:
        img = cv2.resize(img, (maxw, round(img.shape[0] * maxw / img.shape[1])), interpolation=cv2.INTER_AREA)
    d = depth(img)
    cv2.imwrite(f'pipeline/work/depth/{name}.png', (d * 255).astype(np.uint8))
    tn, tf = np.quantile(d, qn), np.quantile(d, qf)
    near = (d >= tn).astype(np.uint8)
    nearfar = (d >= tf).astype(np.uint8)
    # clean masks: keep sizeable blobs, smooth edges
    for m in (near, nearfar):
        m[:] = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
        m[:] = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    feather = lambda m, r: np.clip(cv2.GaussianBlur(cv2.dilate(m, np.ones((r, r), np.uint8)).astype(np.float32), (0, 0), r / 2.5), 0, 1)
    far_img = inpaint(img, nearfar * 255)
    mid_img = inpaint(img, near * 255)
    save(f'{name}_far', far_img)
    save(f'{name}_mid', mid_img, feather(nearfar, 7))
    save(f'{name}_near', img, feather(near, 5))
    print(name, img.shape[1], img.shape[0], 'near', round(near.mean(), 2), 'mid+near', round(nearfar.mean(), 2))

# person occluders
if not only or 'people' in only:
    from rembg import new_session, remove
    hs = new_session('u2net_human_seg')
    for name, src in [('hall', 'assets/film/fair_hall.webp'), ('booth', 'assets/film/fair_booth.webp'), ('insp', 'assets/photos16/insp.jpg')]:
        cap = cv2.VideoCapture(src) if src.endswith('.webp') else None
        img = cap.read()[1] if cap is not None else cv2.imread(src)
        rgba = remove(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), session=hs, post_process_mask=True)
        rgba = cv2.cvtColor(np.array(rgba), cv2.COLOR_RGBA2BGRA)
        cv2.imwrite(f'{OUT}/{name}_person.webp', rgba, [cv2.IMWRITE_WEBP_QUALITY, 90])
        print('person', name, round((rgba[..., 3] > 128).mean(), 3))
