import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as nd
import cv2
R = sys.argv[1]; S = R + '/src/'; O = R + '/hi/'
def load(f): return np.asarray(Image.open(S + f).convert('RGB')).astype(np.float32)
def chroma(a): s = a.sum(2, keepdims=True) + 1; return a / s
def key_green(a, bg, t1=0.035, t2=0.07, border=None):
    # background = same chroma as the backdrop (shadows included), connected to the image edge
    d = np.linalg.norm(chroma(a) - chroma(np.array(bg, np.float32)[None, None]), axis=2)
    lum = a.mean(2); d = d + np.maximum(0, lum - np.mean(bg) - 25) / 600   # brighter than the backdrop is never background
    bgm = d < t2; lab, n = nd.label(bgm)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    conn = np.isin(lab, list(edge))
    alpha = np.where(conn, np.clip((d - t1) / (t2 - t1), 0, 1), 1.0)
    alpha = nd.gaussian_filter(alpha, 0.6)
    return alpha
def despill(a, alpha):
    g = a[..., 1]; lim = (a[..., 0] + a[..., 2]) / 2 + 12; a = a.copy(); m = alpha < 0.98
    a[..., 1] = np.where(m, np.minimum(g, lim), g); return a
def save(a, alpha, f, crop=True, pad=6):
    rgba = np.dstack([np.clip(a, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    if crop:
        ys, xs = np.where(alpha > 0.05); y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + pad, max(0, xs.min() - pad), xs.max() + pad
        rgba = rgba[y0:y1, x0:x1]
    else: y0 = x0 = 0
    Image.fromarray(rgba).save(O + f); return x0, y0
# ---- cups
a = load('coquito_cups.jpg'); bg = a[10:60, 10:60].reshape(-1, 3).mean(0); print('cup bg', bg)
al = key_green(a, bg); a2 = despill(a, al)
H, W = al.shape; cols = np.where(al.max(0) > 0.5)[0]
# split into three by gaps in columns
runs = np.split(cols, np.where(np.diff(cols) > 8)[0] + 1); runs = [r for r in runs if len(r) > 60]; print('cup runs', [(r[0], r[-1]) for r in runs])
cup_off = {}
for i, r in enumerate(runs[:3]):
    m = np.zeros_like(al); m[:, r[0]:r[-1] + 1] = al[:, r[0]:r[-1] + 1]
    x0, y0 = save(a2, m, f'cup{i+1}.png'); cup_off[i + 1] = (x0, y0)
# ---- zoom ladder
z = load('zoomA_coquito_latte.jpg'); colmean = z.mean((0, 2)); 
dark = np.where(colmean < colmean.mean() * 0.55)[0]; print('dark cols', dark[:40], len(dark))
bars = [b for b in np.split(dark, np.where(np.diff(dark) > 3)[0] + 1) if len(b)]
edges = [0] + [int(b.mean()) for b in bars] + [z.shape[1]]
print('panel edges', edges)
json.dump({'edges': edges}, open(R + '/src/ladder_edges.json', 'w'))
for i in range(len(edges) - 1):
    x0, x1 = edges[i] + 5, edges[i + 1] - 5; p = z[:, x0:x1]
    al = key_green(p, bg); p2 = despill(p, al)
    Image.fromarray(np.dstack([np.clip(p2, 0, 255), al * 255]).astype(np.uint8)).save(O + f'ladder{i+1}_raw.png')
