"""Per-frame foreground matte for the Guangzhou aerial (Depth Anything V2): the tower and
skyline are exported as RGBA frames so hero type can sit *behind* them (V2 scene 1)."""
import cv2, numpy as np, onnxruntime as ort
s = ort.InferenceSession('/home/user/models/da2_vits.onnx')
cap = cv2.VideoCapture('assets/film/gz_tower.mp4')
prev, i = None, 0
while True:
    ok, img = cap.read()
    if not ok: break
    x = cv2.resize(img, (518, 518))[:, :, ::-1].astype(np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = s.run(None, {s.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    d = cv2.resize(d, (720, 1280), interpolation=cv2.INTER_CUBIC)
    prev = d if prev is None else prev * 0.45 + d * 0.55          # temporal smoothing
    a = np.clip((prev - 0.16) / 0.10, 0, 1)
    a = cv2.GaussianBlur(a, (0, 0), 1.2)
    small = cv2.resize(img, (720, 1280), interpolation=cv2.INTER_AREA)
    rgba = np.dstack([small, (a * 255).astype(np.uint8)])
    cv2.imwrite(f'assets/film/tower_fg/{i:04d}.webp', rgba, [cv2.IMWRITE_WEBP_QUALITY, 82])
    i += 1
print('frames', i)
