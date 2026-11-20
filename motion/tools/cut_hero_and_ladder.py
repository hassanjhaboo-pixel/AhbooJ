import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as nd
import cv2
R = sys.argv[1]; S = R + '/src/'; O = R + '/hi/'
def chroma(a): return a / (a.sum(2, keepdims=True) + 1)
def key_green(a, bg, t1=0.03, t2=0.06):
    d = np.linalg.norm(chroma(a) - chroma(np.array(bg, np.float32)[None, None]), axis=2)
    d = d + np.maximum(0, a.mean(2) - np.mean(bg) - 25) / 600
    lab, n = nd.label(d < t2); edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    conn = np.isin(lab, list(edge)); al = np.where(conn, np.clip((d - t1) / (t2 - t1), 0, 1), 1.0); return nd.gaussian_filter(al, 0.8)
def despill(a, al):
    a = a.copy(); lim = (a[..., 0] + a[..., 2]) / 2 + 10; a[..., 1] = np.where(al < 0.98, np.minimum(a[..., 1], lim), a[..., 1]); return a
def biggest(al):
    lab, n = nd.label(al > 0.3)
    if n <= 1: return al
    sz = nd.sum(np.ones_like(al), lab, range(1, n + 1)); return al * nd.binary_dilation(lab == (np.argmax(sz) + 1), iterations=3)
def prep(src, crop, feather):
    a = np.asarray(Image.open(S + src).convert('RGB')).astype(np.float32)
    bg = np.concatenate([a[5:60, 5:60].reshape(-1, 3), a[5:60, -60:-5].reshape(-1, 3)]).mean(0)
    al = biggest(key_green(a, bg)); a = despill(a, al)
    if feather:
        h, w = al.shape; yy, xx = np.mgrid[0:h, 0:w]; al = al * np.clip(np.minimum.reduce([xx, w - 1 - xx, h - 1 - yy, yy]) / 30, 0, 1)
    rgba = np.dstack([np.clip(a, 0, 255), al * 255]).astype(np.uint8)
    if crop:
        ys, xs = np.where(al > 0.05); rgba = rgba[max(0, ys.min() - 8):ys.max() + 8, max(0, xs.min() - 8):xs.max() + 8]
    return rgba
sift = cv2.SIFT_create(6000)
def feats(rgba, sc=0.5):
    g = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2GRAY); m = (rgba[..., 3] > 200).astype(np.uint8) * 255
    g = cv2.resize(g, None, fx=sc, fy=sc); m = cv2.resize(m, None, fx=sc, fy=sc, interpolation=cv2.INTER_NEAREST)
    k, d = sift.detectAndCompute(g, m); return np.float32([p.pt for p in k]) / sc, d
def sim(A, Bimg):
    pa, da = feats(A); pb, db = feats(Bimg)
    ms = [m for m, n in cv2.BFMatcher().knnMatch(da, db, k=2) if m.distance < 0.75 * n.distance]
    M, inl = cv2.estimateAffinePartial2D(pa[[m.queryIdx for m in ms]], pb[[m.trainIdx for m in ms]], method=cv2.RANSAC, ransacReprojThreshold=6)
    res = np.vstack([M, [0, 0, 1]]); print('  matches', len(ms), 'inliers', int(inl.sum()), 'scale', round(float(np.hypot(M[0, 0], M[1, 0])), 3)); return res
out = {}
import os
JOBS = [('latte', 'latte_hero.jpg', ['latte_z2.jpg', 'latte_z3.jpg', 'latte_z4.jpg'])]
OUTJ = O + 'ladders3.json'
for name, hero, chain in JOBS:
    H = prep(hero, True, False); Image.fromarray(H).save(O + f'{name}_hero.png'); print(name, 'hero', H.shape)
    prev, T = H, np.eye(3); out[name] = {}
    for i, f in enumerate(chain):
        L = prep(f, False, True); Image.fromarray(L).save(O + f'{name}_L{i+2}.png')
        print(name, f); M = sim(L, prev); T = T @ M; out[name][i + 2] = [float(T[0, 0]), float(T[1, 0]), float(T[0, 2]), float(T[1, 2])]; prev = L
json.dump(out, open(OUTJ, 'w'), indent=1); print(json.dumps(out))
