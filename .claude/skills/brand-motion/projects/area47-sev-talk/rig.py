#!/usr/bin/env python3
# Cut SEV's master A-pose into a 2D puppet: body, left/right arm (pivot at the shoulder), head (pivot at the neck),
# 11 head variants (original mouth + the 10 mouth-chart shapes blended into the face) and an eyelid overlay for blinks.
#   python3 key.py src/master.png assets/master.png && python3 key.py src/mouths.png assets/mouths.png && python3 rig.py
# Writes assets/rig/*.png + assets/rig/rig.json (every layer's box in master pixels + pivots).
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
here = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(here, 'assets', 'rig'); os.makedirs(OUT, exist_ok=True)
M = np.array(Image.open(os.path.join(here, 'assets', 'master.png'))).astype(np.float32)
Hh, Ww = M.shape[:2]
A = M[..., 3] / 255
SKIN = np.array([7, 216, 253], np.float32)
HOOD = (16, 16, 19)

def poly_mask(pts):
    im = Image.new('L', (Ww, Hh), 0); ImageDraw.Draw(im).polygon(pts, fill=255); return np.array(im) > 0
yy, xx = np.mgrid[0:Hh, 0:Ww]

# ---------- regions ----------
HEAD = poly_mask([(318, 474), (318, 0), (712, 0), (712, 474), (614, 474), (606, 398), (562, 382), (512, 409), (462, 382), (418, 398), (410, 474)])
def xline(y, a, b): return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])
LCUT = ((426, 466), (353, 737)); RCUT = ((Ww - 426, 466), (Ww - 353, 737))
ARM_L = (~HEAD) & (yy >= 466) & (((yy < 737) & (xx < xline(yy, *LCUT))) | ((yy >= 737) & (yy < 1100) & (xx < 318)))
ARM_R = (~HEAD) & (yy >= 466) & (((yy < 737) & (xx > xline(yy, *RCUT))) | ((yy >= 737) & (yy < 1100) & (xx > Ww - 318)))
PIV = {'head': (512, 420), 'armL': (388, 522), 'armR': (Ww - 388, 522)}

def save(name, rgba, mask=None):
    img = rgba.copy()
    if mask is not None: img[..., 3] = img[..., 3] * mask
    al = img[..., 3] > 2
    ys, xs = np.where(al); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(img[y0:y1, x0:x1].astype(np.uint8), 'RGBA').save(os.path.join(OUT, name + '.png'))
    return {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}

boxes = {}
# ---------- body: everything else, with the hood filled in behind the head and the torso side filled under the arms ----------
body = M.copy()
keep = ~(HEAD | ARM_L | ARM_R)
body[..., 3] *= keep
fill = (HEAD & poly_mask([(340, 330), (684, 330), (704, 474), (320, 474)])) | \
       ((ARM_L | ARM_R) & (poly_mask([(426, 466), (353, 737), (318, 737), (330, 600), (372, 500)]) | poly_mask([(Ww - 426, 466), (Ww - 353, 737), (Ww - 318, 737), (Ww - 330, 600), (Ww - 372, 500)])))
body[fill] = [*HOOD, 255]
im = Image.fromarray(body.astype(np.uint8), 'RGBA'); d = ImageDraw.Draw(im)
for side in (1, -1):   # torso side outline that shows when an arm swings out (cyan rim + black line, like the art)
    X = lambda x: x if side == 1 else Ww - x
    d.line([(X(372), 500), (X(338), 640), (X(326), 737)], fill=(0, 185, 252, 255), width=9)
    d.line([(X(376), 500), (X(342), 640), (X(331), 737)], fill=(5, 5, 7, 255), width=5)
body = np.array(im).astype(np.float32)
# put the original pixels back where the arm cut line sits on top of real torso (keeps the art crisp at rest)
boxes['body'] = save('body', body)
boxes['armL'] = save('armL', M, ARM_L)
boxes['armR'] = save('armR', M, ARM_R)

# ---------- face mask (skin + its enclosed holes: nostrils, mouth line) ----------
def grow(mask, seed):
    """pixels of mask 4-connected to seed (numpy region grow; PIL floodfill is unreliable on these masks)"""
    reg = np.zeros_like(mask); reg[seed[1], seed[0]] = True
    while True:
        n = reg.copy()
        n[1:] |= reg[:-1]; n[:-1] |= reg[1:]; n[:, 1:] |= reg[:, :-1]; n[:, :-1] |= reg[:, 1:]
        n &= mask
        if (n == reg).all(): return reg
        reg = n
def component(mask, seed, box):
    """pixels of mask connected to seed inside box, with enclosed holes filled"""
    x0, y0, x1, y1 = box
    comp = grow(mask[y0:y1, x0:x1], (seed[0] - x0, seed[1] - y0))
    pad = np.pad(~comp, 1, constant_values=True)
    outside = grow(pad, (0, 0))[1:-1, 1:-1]
    out = np.zeros(mask.shape, bool); out[y0:y1, x0:x1] = ~outside; return out
skin = (np.sqrt(((M[..., :3] - SKIN) ** 2).sum(-1)) < 70) & (A > 0.9)
face = component(skin, (512, 372), (370, 190, 660, 420))
face &= ~((yy < 336))                                                    # never touch the nose
face_soft = np.array(Image.fromarray((face * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(2))) / 255

# ---------- mouth chart -> face patches ----------
CH = np.array(Image.open(os.path.join(here, 'assets', 'mouths.png'))).astype(np.float32)
MB = [(31, 225, 296, 413), (326, 224, 598, 420), (629, 188, 904, 437), (928, 196, 1210, 421), (1268, 209, 1491, 424),
      (48, 572, 275, 783), (327, 568, 594, 784), (623, 570, 907, 782), (934, 573, 1206, 786), (1238, 569, 1506, 795)]
NAMES = ['closed', 'rest', 'ah', 'ee', 'oh', 'oo', 'fv', 'l', 'smirk', 'laugh']
SC, MOUTH_TOP, MOUTH_X = 0.4, 343, 512
head_base = M.copy(); head_base[..., 3] *= HEAD
heads = {'orig': head_base}
for name, (x0, y0, x1, y1) in zip(NAMES, MB):
    c = CH[y0:y1, x0:x1]
    al = c[..., 3] / 255
    skin_c = np.sqrt(((c[..., :3] - SKIN) ** 2).sum(-1)) < 80
    ys = np.arange(c.shape[0])[:, None]
    feat = (al > 0.9) & ~skin_c & (ys > 70)                                # lips / teeth / tongue, below the nostrils
    fy, fxs = np.where(feat)
    # keep the biggest feature cluster near the centre (drops the outline of the chin)
    cx = c.shape[1] / 2; sel = np.abs(fxs - cx) < c.shape[1] * 0.36
    fy, fxs = fy[sel], fxs[sel]
    bx0, by0, bx1, by1 = fxs.min(), fy.min(), fxs.max(), fy.max()
    pad = 10
    region = np.zeros(al.shape, np.float32); region[max(0, by0 - pad):by1 + pad, max(0, bx0 - pad):bx1 + pad] = 1
    region = np.array(Image.fromarray((region * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))) / 255
    patch = np.dstack([c[..., :3], al * region * 255]).astype(np.uint8)
    pim = Image.fromarray(patch, 'RGBA')
    pw, ph = int(pim.width * SC), int(pim.height * SC)
    pim = pim.resize((pw, ph), Image.LANCZOS)
    ox = int(MOUTH_X - (bx0 + bx1) / 2 * SC); oy = int(MOUTH_TOP - by0 * SC)
    layer = Image.new('RGBA', (Ww, Hh), (0, 0, 0, 0)); layer.alpha_composite(pim, (ox, oy))
    L = np.array(layer).astype(np.float32)
    # inside the face: first paint plain skin over the old mouth, then the new mouth
    h = head_base.copy()
    cover = face_soft * (yy > 340)
    h[..., :3] = h[..., :3] * (1 - cover[..., None]) + SKIN * cover[..., None]
    la = (L[..., 3] / 255) * face_soft
    h[..., :3] = h[..., :3] * (1 - la[..., None]) + L[..., :3] * la[..., None]
    heads[name] = h
hb = None
for name, h in heads.items():
    b = save('head-' + name, h)
    hb = hb or b
    assert b == hb, (name, b, hb)                                           # identical boxes so swaps line up
boxes['head'] = hb

# ---------- eyelids (blink overlay, same box as the head) ----------
lid = np.zeros_like(M)
dark = (M[..., :3].max(-1) < 70) & (A > 0.9)
lim = Image.new('RGBA', (Ww, Hh), (0, 0, 0, 0)); dd = ImageDraw.Draw(lim)
for (ex, ey) in [(445, 266), (580, 266)]:
    ys0, xs0 = np.where(dark[ey - 12:ey + 12, ex - 12:ex + 12]); sx, sy = int(xs0[0]) + ex - 12, int(ys0[0]) + ey - 12
    e = component(dark, (sx, sy), (ex - 75, ey - 45, ex + 75, ey + 45))
    e = np.array(Image.fromarray((e * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    lid[e] = [*SKIN, 255]
    ys_, xs_ = np.where(e); x0, x1 = xs_.min() + 4, xs_.max() - 4
    inner = x1 if ex < 512 else x0; outer = x0 if ex < 512 else x1
    yo, yi = ys_[xs_ == xs_.min() if ex < 512 else xs_ == xs_.max()].mean(), ys_.mean()
    pts = [(outer + (inner - outer) * t, yo + (yi + 6 - yo) * t + 14 * t * (1 - t)) for t in np.linspace(0, 1, 24)]
    lid_line = pts
    lim2 = Image.fromarray(lid.astype(np.uint8), 'RGBA'); lid = np.array(lim2).astype(np.float32)
    dd.line(pts, fill=(5, 5, 7, 255), width=7, joint='curve')
base = Image.fromarray(lid.astype(np.uint8), 'RGBA'); base.alpha_composite(lim); lid = np.array(base).astype(np.float32)
lid[..., 3] *= HEAD
li = Image.fromarray(lid.astype(np.uint8), 'RGBA').crop((hb['x'], hb['y'], hb['x'] + hb['w'], hb['y'] + hb['h']))
li.save(os.path.join(OUT, 'lids.png'))
json.dump({'size': [Ww, Hh], 'boxes': boxes, 'pivots': PIV, 'mouths': ['orig'] + NAMES}, open(os.path.join(OUT, 'rig.json'), 'w'), indent=1)
print(json.dumps(boxes))
