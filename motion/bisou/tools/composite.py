"""Bake each dish's close-ups into ONE large still, so the camera zooms into a single image and nothing swaps mid-zoom.
The hero is upscaled to the deepest close-up's resolution; each close-up is warped in, colour-matched to what is
already there, and blended through its soft edges; the plate outline is kept. Writes hi/<dish>_comp.png and
hi/comp.json ({dish: factor}, comp px = hero px * factor). Run from motion/bisou: python3 -I tools/composite.py"""
import os, json, numpy as np, cv2
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); O = R + '/hi/'
lad = json.load(open(O + 'ladders.json')); out = {}
def match(src, ref, m):   # move src's Lab mean/std to ref's, measured where both are valid
    s = cv2.cvtColor(src, cv2.COLOR_RGB2LAB).astype(np.float32); r = cv2.cvtColor(ref, cv2.COLOR_RGB2LAB).astype(np.float32)
    for c in range(3):
        ms, ss = s[..., c][m].mean(), s[..., c][m].std() + 1e-3; mr, sr = r[..., c][m].mean(), r[..., c][m].std() + 1e-3
        s[..., c] = (s[..., c] - ms) * (sr / ss) + mr
    return cv2.cvtColor(np.clip(s, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
for d, levels in lad.items():
    hero = np.asarray(Image.open(O + f'{d}_hero.png').convert('RGBA')); h, w = hero.shape[:2]
    kd = min(np.hypot(v[0], v[1]) for v in levels.values()); F = min(1 / kd, 4600 / max(h, w))
    W, H = int(round(w * F)), int(round(h * F))
    canvas = cv2.resize(hero, (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    for l in sorted(levels, key=int):
        A, B, tx, ty = levels[l]; L = np.asarray(Image.open(O + f'{d}_L{l}.png').convert('RGBA'))
        M = np.float32([[A * F, -B * F, tx * F], [B * F, A * F, ty * F]])
        Lw = cv2.warpAffine(L, M, (W, H), flags=cv2.INTER_LANCZOS4, borderValue=(0, 0, 0, 0)).astype(np.float32)
        a = Lw[..., 3:] / 255; both = (a[..., 0] > 0.95) & (canvas[..., 3] > 240)
        if both.sum() > 1000: Lw[..., :3] = match(Lw[..., :3].astype(np.uint8), canvas[..., :3].astype(np.uint8), both)
        # only take the close-up where it agrees with what is already there; where Gemini moved something, keep the base
        diff = cv2.GaussianBlur(np.abs(Lw[..., :3] - canvas[..., :3]).mean(2), (0, 0), 6 * F)
        agree = np.clip(1 - (diff - 22) / 28, 0, 1); agree = cv2.GaussianBlur(cv2.erode(agree, np.ones((int(9 * F), int(9 * F)), np.uint8)), (0, 0), 10 * F)
        a = a * agree[..., None]; print('   kept', round(float(a.sum() / max(1, (Lw[..., 3] > 0).sum() * 255 / 255)), 2))
        canvas[..., :3] = canvas[..., :3] * (1 - a) + Lw[..., :3] * a
        print(d, f'L{l}', 'scale', round(float(np.hypot(A, B) * F), 3))
    canvas[..., 3] = cv2.resize(hero[..., 3], (W, H), interpolation=cv2.INTER_LINEAR)   # keep the plate outline
    Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).save(O + f'{d}_comp.png', optimize=False, compress_level=3)
    out[d] = F; print(d, 'comp', W, H, 'factor', round(F, 3))
json.dump(out, open(O + 'comp.json', 'w'), indent=1)
