#!/usr/bin/env python3
# Cut SEV's v3 sheets (walk cycle, hand poses, 8-angle head turn, eye chart) into transparent PNGs in
# brand/assets/area47/sev/{walk,hands,turn8,eyes}/ + sev/v3.json (names, sizes, anchors).
#   python3 cut_sheets.py <walk.png> <hands.png> <turn8.png> <eyes.png>
# Magenta is keyed like key.py. Walk frames share one canvas (shoe line + torso centre aligned) so they play without jitter;
# head turns share one canvas aligned on the shoulder line.
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
here = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(here, '..', '..', 'brand', 'assets', 'area47', 'sev'))

def key(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    M = np.median(np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3)]), axis=0)
    d = np.sqrt(((a - M) ** 2).sum(-1)); alpha = np.clip((d - 60) / 90, 0, 1)
    edge = np.array(Image.fromarray((alpha < 0.999).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 0
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    spill = edge & (R > G) & (B > G)
    a[..., 0] = np.where(spill, np.minimum(R, G), R)
    k = alpha[..., None]
    fg = np.where(k > 0.05, (a - (1 - k) * M) / np.maximum(k, 0.05), a)
    fg = np.clip(np.where(spill[..., None], a, fg), 0, 255)
    return np.dstack([fg, alpha * 255])

def components(rgba, merge_px, f=4, y_max=1.0, min_area=400):
    """bounding boxes of separate shapes; shapes closer than merge_px join (brows + eyes, hands + motion marks)"""
    A = rgba[..., 3] > 128
    h, w = A.shape
    small = np.array(Image.fromarray((A * 255).astype(np.uint8)).resize((w // f, h // f), Image.BOX)) > 20
    r = max(1, merge_px // f)
    small = np.array(Image.fromarray((small * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0
    lab = np.zeros(small.shape, np.int32); n = 0; boxes = []
    for y0 in range(small.shape[0]):
        for x0 in range(small.shape[1]):
            if not small[y0, x0] or lab[y0, x0]: continue
            n += 1; st = [(y0, x0)]; lab[y0, x0] = n; ys, xs = [], []
            while st:
                y, x = st.pop(); ys.append(y); xs.append(x)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    Y, X = y + dy, x + dx
                    if 0 <= Y < small.shape[0] and 0 <= X < small.shape[1] and small[Y, X] and not lab[Y, X]:
                        lab[Y, X] = n; st.append((Y, X))
            bx = [min(xs) * f, min(ys) * f, (max(xs) + 1) * f, (max(ys) + 1) * f]
            # tighten to the real alpha inside the box
            sub = A[bx[1]:bx[3], bx[0]:bx[2]]
            yy, xx = np.where(sub)
            if len(yy) < min_area: continue
            box = [bx[0] + xx.min(), bx[1] + yy.min(), bx[0] + xx.max() + 1, bx[1] + yy.max() + 1]
            if box[1] / h > y_max: continue
            boxes.append(box)
    # row-major order: rows by vertical centre, then left to right
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if rows and abs(cy - rows[-1][0]) < (b[3] - b[1]) * 0.5: rows[-1][1].append(b)
        else: rows.append([cy, [b]])
    return [b for _, row in rows for b in sorted(row, key=lambda b: b[0])]

def crop(rgba, b, pad=4):
    x0, y0, x1, y1 = max(0, b[0] - pad), max(0, b[1] - pad), min(rgba.shape[1], b[2] + pad), min(rgba.shape[0], b[3] + pad)
    return rgba[y0:y1, x0:x1]

def save(arr, rel):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    Image.fromarray(arr.astype(np.uint8), 'RGBA').save(p); return rel

def shared_canvas(rgba, boxes, align_x, pad=10):
    """paste frames into one canvas size, bottoms aligned, x aligned on align_x(frame) (px from frame left)"""
    frames = [crop(rgba, b, 0) for b in boxes]
    ax = [align_x(f) for f in frames]
    left = max(ax) + pad; right = max(f.shape[1] - a for f, a in zip(frames, ax)) + pad
    Hc = max(f.shape[0] for f in frames) + pad * 2; Wc = int(left + right)
    out = []
    for f, a in zip(frames, ax):
        c = np.zeros((Hc, Wc, 4), np.float32)
        x = int(round(left - a)); y = Hc - pad - f.shape[0]
        c[y:y + f.shape[0], x:x + f.shape[1]] = f
        out.append(c)
    return out

walk_p, hands_p, turn_p, eyes_p = sys.argv[1:5]
man = {'walk': {}, 'hands': {}, 'turn8': {}, 'eyes': {}}

# ---------- walk cycle: 8 frames, facing right ----------
W = key(walk_p)
wb = components(W, merge_px=2, f=2, y_max=0.75, min_area=5000)
print('walk boxes', [(b[0], b[2]) for b in wb])
assert len(wb) == 8, f'walk: found {len(wb)} frames'
def torso_x(f):
    h = f.shape[0]; band = f[int(h * 0.38):int(h * 0.6)]
    dark = (band[..., :3].max(-1) < 70) & (band[..., 3] > 230)
    return np.where(dark)[1].mean()
names = ['contact', 'down', 'passing', 'up', 'contact2', 'down2', 'passing2', 'up2']
for i, c in enumerate(shared_canvas(W, wb, torso_x)):
    man['walk'][f'walk-{i + 1}'] = {'file': save(c, f'walk/walk-{i + 1}.png'), 'w': c.shape[1], 'h': c.shape[0], 'pose': names[i]}

# ---------- hands: 4x3 grid ----------
Hh = key(hands_p)
hb = components(Hh, merge_px=10, min_area=3000)
assert len(hb) == 12, f'hands: found {len(hb)}'
for name, b in zip(['open', 'fist', 'point', 'thumbs-up', 'peace', 'spray', 'towel', 'wave', 'keys', 'four', 'ok', 'stop'], hb):
    c = crop(Hh, b)
    man['hands'][f'hand-{name}'] = {'file': save(c, f'hands/hand-{name}.png'), 'w': c.shape[1], 'h': c.shape[0], 'anchor': 'bottom (wrist cuff)'}

# ---------- head turnaround: 8 angles, shared canvas aligned on the shoulders ----------
T = key(turn_p)
tb = components(T, merge_px=2, f=2, min_area=5000)
print('turn boxes', [(int(b[0]), int(b[2])) for b in tb])
assert len(tb) == 8, f'turn8: found {len(tb)}'
angles = ['000-front', '045', '090-profile', '135', '180-back', '225', '270-profile', '315']
for a, c in zip(angles, shared_canvas(T, tb, lambda f: f.shape[1] / 2)):
    man['turn8'][f'head-{a}'] = {'file': save(c, f'turn8/head-{a}.png'), 'w': c.shape[1], 'h': c.shape[0]}

# ---------- eyes: 3 rows x 8 = 12 states x (viewer-left a, viewer-right b) ----------
E = key(eyes_p)
eb = components(E, merge_px=14, min_area=1500)
assert len(eb) == 24, f'eyes: found {len(eb)}'
states = ['neutral', 'half', 'closed', 'blink-half', 'look-left', 'look-right', 'look-up', 'side-eye', 'wink', 'wide', 'happy', 'squint']
for i, b in enumerate(eb):
    st, side = states[i // 2], 'ab'[i % 2]
    c = crop(E, b)
    man['eyes'][f'eye-{st}-{side}'] = {'file': save(c, f'eyes/eye-{st}-{side}.png'), 'w': c.shape[1], 'h': c.shape[0]}

json.dump(man, open(os.path.join(OUT, 'v3.json'), 'w'), indent=1)
print({k: len(v) for k, v in man.items()})
