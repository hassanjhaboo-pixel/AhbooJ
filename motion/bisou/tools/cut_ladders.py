"""Cut each dish's hero off the teal backdrop and register its close-ups onto it (zoom ladder).
Uses the keying/registration from ../tools/cut_hero_and_ladder.py; close-ups are not keyed (the plate fills them).
Writes hi/<dish>_hero.png, hi/<dish>_L2.png, hi/<dish>_L3.png and hi/ladders.json.
Run from motion/bisou:  python3 -I tools/cut_ladders.py [dish ...]"""
import sys, os, json, numpy as np, cv2
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.argv = [sys.argv[0], ROOT] + sys.argv[1:]          # cut_hero_and_ladder reads argv[1] as its root
src = open(os.path.join(ROOT, '../tools/cut_hero_and_ladder.py')).read().split('out = {}')[0]
exec(src)                                                 # key_green, despill, biggest, feats, sim
S = ROOT + '/sources/gemini/'; O = ROOT + '/hi/'
def hero(f):
    a = np.asarray(Image.open(S + f).convert('RGB')).astype(np.float32)
    bg = np.concatenate([a[5:60, 5:60].reshape(-1, 3), a[5:60, -60:-5].reshape(-1, 3), a[-60:-5, 5:60].reshape(-1, 3)]).mean(0)
    al = biggest(key_green(a, bg, 0.035, 0.07))
    rgba = np.dstack([np.clip(a, 0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.where(al > 0.05); return rgba[max(0, ys.min() - 8):ys.max() + 8, max(0, xs.min() - 8):xs.max() + 8]
def close(f):
    a = np.asarray(Image.open(S + f).convert('RGB'))
    h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
    al = np.clip(np.minimum.reduce([xx, w - 1 - xx, h - 1 - yy, yy]) / 40, 0, 1)
    return np.dstack([a, al * 255]).astype(np.uint8)
dishes = sys.argv[2:] or ['benedict', 'shakshuka', 'turkish', 'chilli', 'pancake']
path = O + 'ladders.json'; out = json.load(open(path)) if os.path.exists(path) else {}
for d in dishes:
    H = hero(f'{d}_hero.jpg'); Image.fromarray(H).save(O + f'{d}_hero.png'); print(d, 'hero', H.shape)
    prev, T = H, np.eye(3); out[d] = {}
    for i in (2, 3):
        L = close(f'{d}_z{i}.jpg'); Image.fromarray(L).save(O + f'{d}_L{i}.png'); print(d, f'z{i}', end='')
        M = sim(L, prev); T = T @ M; out[d][i] = [float(T[0, 0]), float(T[1, 0]), float(T[0, 2]), float(T[1, 2])]; prev = L
json.dump(out, open(path, 'w'), indent=1)
