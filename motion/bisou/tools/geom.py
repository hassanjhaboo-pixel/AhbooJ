"""Geometry the reel needs, written to hi/geom.json: hero crop offsets, ladder focus points, the pancake plate rim,
the O of BISOU and each utensil's column and hook. Run from motion/bisou: python3 -I tools/geom.py"""
import json, re, sys, os, numpy as np, cv2
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); G = R + '/sources/gemini/'; O = R + '/hi/'
sys.argv = ['x', R]; exec(open(R + '/../tools/cut_hero_and_ladder.py').read().split('out = {}')[0])
def keyed(f):
    a = np.asarray(Image.open(G + f).convert('RGB')).astype(np.float32)
    bg = np.concatenate([a[5:60, 5:60].reshape(-1, 3), a[5:60, -60:-5].reshape(-1, 3), a[-60:-5, 5:60].reshape(-1, 3)]).mean(0)
    return a, biggest(key_green(a, bg, 0.035, 0.07))
lad = json.load(open(O + 'ladders.json')); g = {'dish': {}}
for d in ['benedict', 'shakshuka', 'turkish', 'chilli', 'pancake']:
    a, al = keyed(f'{d}_hero.jpg'); ys, xs = np.where(al > 0.05); off = [int(max(0, xs.min() - 8)), int(max(0, ys.min() - 8))]
    hw = Image.open(O + f'{d}_hero.png').size
    ys2, xs2 = np.where(al > 0.5); cx, cy = (xs2.min() + xs2.max()) / 2 - off[0], (ys2.min() + ys2.max()) / 2 - off[1]; r = (xs2.max() - xs2.min() + ys2.max() - ys2.min()) / 4
    deep = max(lad[d], key=int); A, B, tx, ty = lad[d][deep]; L = Image.open(O + f'{d}_L{deep}.png').size
    fx, fy = A * L[0] / 2 - B * L[1] / 2 + tx, B * L[0] / 2 + A * L[1] / 2 + ty
    g['dish'][d] = {'off': off, 'size': list(hw), 'plate': [cx, cy, r], 'focus': [fx, fy], 'deep': int(deep)}
# pancake plate rim in the full (uncropped) frame of the eaten shots
_, al = keyed('pancake_eaten2.jpg'); ys, xs = np.where(al > 0.5)
g['rim'] = [(xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, (xs.max() - xs.min() + ys.max() - ys.min()) / 4]
# the O of BISOU (4th glyph of the word) and utensil columns, in the mark's 440x380 viewBox
parts = json.load(open(O + 'mark_parts.json'))
nums = [float(v) for v in re.findall(r'-?\d+\.?\d*', parts['word'][3])]; xs, ys = nums[0::2], nums[1::2]
g['O'] = [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (max(xs) - min(xs)) / 2, (max(ys) - min(ys)) / 2]
m = cv2.imread(R + '/sources/outro_mark_crop.png', 0) > 128
band = m[45:190, :]; cols = np.where(band.any(0))[0]; runs = []; s = cols[0]; p = cols[0]
for c in cols[1:]:
    if c != p + 1: runs.append((int(s), int(p))); s = c
    p = c
runs.append((int(s), int(p)))
rail = m[5:45, :]; ry = [int(np.where(rail[:, x])[0].min()) + 5 if rail[:, x].any() else None for x in range(m.shape[1])]
g['utensils'] = [{'x0': a - 6, 'x1': b + 6, 'hook': [(a + b) / 2, ry[(a + b) // 2]]} for a, b in runs]
g['railY'] = int(np.median([v for v in ry if v is not None]))
json.dump(g, open(O + 'geom.json', 'w'), indent=1); print(json.dumps(g, indent=1))
