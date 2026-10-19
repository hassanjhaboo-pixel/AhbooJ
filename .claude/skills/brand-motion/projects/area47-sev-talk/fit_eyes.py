#!/usr/bin/env python3
# Fit the eye chart (brand/assets/area47/sev/eyes/) onto the talking rig's head: one overlay per eye state, in the head
# layer's box, that paints skin over the original eyes + brows and places the chart pair on top.
#   python3 rig.py && python3 cut_sheets.py … && python3 fit_eyes.py   → assets/rig/eyes-<state>.png + rig.json "eyes"
import json, os
import numpy as np
from PIL import Image, ImageFilter
here = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.join(here, 'assets', 'rig'); SEV = os.path.normpath(os.path.join(here, '..', '..', 'brand', 'assets', 'area47', 'sev'))
M = np.array(Image.open(os.path.join(here, 'assets', 'master.png'))).astype(np.float32)
Hh, Ww = M.shape[:2]; A = M[..., 3] / 255
SKIN = np.array([7, 216, 253], np.float32)
rig = json.load(open(os.path.join(RIG, 'rig.json'))); hb = rig['boxes']['head']

def grow(mask, seed):
    reg = np.zeros_like(mask); reg[seed[1], seed[0]] = True
    while True:
        n = reg.copy(); n[1:] |= reg[:-1]; n[:-1] |= reg[1:]; n[:, 1:] |= reg[:, :-1]; n[:, :-1] |= reg[:, 1:]; n &= mask
        if (n == reg).all(): return reg
        reg = n

# eye blobs in the master (dark almonds), and the region to repaint (eyes + brows inside the face)
dark = (M[..., :3].max(-1) < 70) & (A > 0.9)
eyes = []
for ex, ey in [(445, 266), (580, 266)]:
    ys, xs = np.where(dark[ey - 12:ey + 12, ex - 12:ex + 12]); seed = (int(xs[0]) + ex - 12, int(ys[0]) + ey - 12)
    box = (ex - 80, ey - 50, ex + 80, ey + 45)
    sub = grow(dark[box[1]:box[3], box[0]:box[2]], (seed[0] - box[0], seed[1] - box[1]))
    yy, xx = np.where(sub); eyes.append({'x0': xx.min() + box[0], 'x1': xx.max() + box[0], 'y0': yy.min() + box[1], 'y1': yy.max() + box[1]})
skin = (np.sqrt(((M[..., :3] - SKIN) ** 2).sum(-1)) < 70) & (A > 0.9)
x0, y0, x1, y1 = 370, 180, 660, 420
comp = grow(skin[y0:y1, x0:x1], (512 - x0, 372 - y0))
outside = grow(np.pad(~comp, 1, constant_values=True), (0, 0))[1:-1, 1:-1]
face = np.zeros((Hh, Ww), bool); face[y0:y1, x0:x1] = ~outside
yy, xx = np.mgrid[0:Hh, 0:Ww]
repaint = face & ~skin & (yy < 300)
for e in eyes: repaint |= (xx >= e['x0'] - 3) & (xx <= e['x1'] + 3) & (yy >= e['y0'] - 3) & (yy <= e['y1'] + 3) & face
repaint = np.array(Image.fromarray((repaint * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
repaint &= face

man = json.load(open(os.path.join(SEV, 'v3.json')))['eyes']
def almond(img):
    """bbox of the eye itself (the big dark/blue almond), skipping the brow above it"""
    a = np.array(img).astype(np.float32); al = a[..., 3] > 200
    rows = np.where(al.sum(1) > al.shape[1] * 0.45)[0]               # brow rows are thin; the eye rows are wide
    return rows.min(), rows.max()
states = sorted({k.split('-', 1)[1].rsplit('-', 1)[0] for k in man})
ref = Image.open(os.path.join(SEV, man['eye-neutral-a']['file']))
r0, r1 = almond(ref)
scale = ((eyes[0]['x1'] - eyes[0]['x0']) * 1.12) / ref.width              # chart eye slightly larger than the master almond
for st in states:
    layer = Image.new('RGBA', (Ww, Hh), (0, 0, 0, 0))
    base = np.zeros((Hh, Ww, 4), np.float32); base[repaint] = [*SKIN, 255]
    layer = Image.fromarray(base.astype(np.uint8), 'RGBA')
    for side, e in zip('ab', eyes):
        im = Image.open(os.path.join(SEV, man[f'eye-{st}-{side}']['file']))
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        cy_chart = (r0 + r1) / 2 * scale                                  # align the almond centre (not the brow)
        cx, cy = (e['x0'] + e['x1']) / 2, (e['y0'] + e['y1']) / 2
        layer.alpha_composite(im, (int(cx - im.width / 2), int(cy - cy_chart)))
    out = layer.crop((hb['x'], hb['y'], hb['x'] + hb['w'], hb['y'] + hb['h']))
    out.save(os.path.join(RIG, f'eyes-{st}.png'))
rig['eyes'] = states
json.dump(rig, open(os.path.join(RIG, 'rig.json'), 'w'), indent=1)
print('eye states:', states)
