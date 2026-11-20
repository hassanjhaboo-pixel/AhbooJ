import numpy as np, json, sys
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd
import cv2
R = sys.argv[1]; S = R + '/src/'; O = R + '/hi/'
def biggest(al):
    lab, n = nd.label(al > 0.3)
    if n <= 1: return al
    sz = nd.sum(np.ones_like(al), lab, range(1, n + 1)); keep = lab == (np.argmax(sz) + 1)
    keep = nd.binary_dilation(keep, iterations=3); return al * keep
def rgba(f): return np.asarray(Image.open(f).convert('RGBA')).astype(np.float32)
def put(a, f): Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f)
# clean stray specks on cups and ladder panels
for f in ['cup1', 'cup2', 'cup3', 'ladder1_raw', 'ladder2_raw', 'ladder3_raw', 'ladder4_raw']:
    a = rgba(O + f + '.png'); a[..., 3] = biggest(a[..., 3] / 255) * 255; put(a, O + f + '.png')
# feather panel crop borders where the cup is cut by the panel edge
for i in range(2, 5):
    a = rgba(O + f'ladder{i}_raw.png'); h, w = a.shape[:2]; r = 14
    yy, xx = np.mgrid[0:h, 0:w]; ramp = np.clip(np.minimum.reduce([xx, w - 1 - xx, h - 1 - yy]) / r, 0, 1)
    a[..., 3] *= ramp; put(a, O + f'ladder{i}.png')
put(rgba(O + 'ladder1_raw.png'), O + 'ladder1.png')
# register each ladder panel into cup1 pixel space (similarity transform), chained panel by panel
orb = cv2.SIFT_create(4000)
def feats(f):
    a = rgba(f); g = cv2.cvtColor(a[..., :3].astype(np.uint8), cv2.COLOR_RGB2GRAY); m = (a[..., 3] > 200).astype(np.uint8) * 255
    return orb.detectAndCompute(g, m)
def sim(fa, fb):   # transform mapping image a coords -> image b coords
    ka, da = feats(fa); kb, db = feats(fb); bf = cv2.BFMatcher()
    ms = [m for m, n in bf.knnMatch(da, db, k=2) if m.distance < 0.75 * n.distance]
    A = np.float32([ka[m.queryIdx].pt for m in ms]); Bp = np.float32([kb[m.trainIdx].pt for m in ms])
    M, inl = cv2.estimateAffinePartial2D(A, Bp, method=cv2.RANSAC, ransacReprojThreshold=3)
    print(fa.split('/')[-1], '->', fb.split('/')[-1], 'matches', len(ms), 'inliers', int(inl.sum()), 'scale', np.hypot(M[0, 0], M[1, 0]))
    return np.vstack([M, [0, 0, 1]])
T = {1: sim(O + 'ladder1_raw.png', O + 'cup1.png')}
for i in range(2, 5): T[i] = T[i - 1] @ sim(O + f'ladder{i}_raw.png', O + f'ladder{i-1}_raw.png')
json.dump({i: [float(T[i][0, 0]), float(T[i][1, 0]), float(T[i][0, 2]), float(T[i][1, 2])] for i in T}, open(O + 'ladder.json', 'w'))
print(json.load(open(O + 'ladder.json')))
# ---- props from the overhead flat-lay (white backdrop)
p = np.asarray(Image.open(S + 'props_top.jpg').convert('RGB')).astype(np.float32)
def key_white(a):
    lum = a.mean(2); sat = a.max(2) - a.min(2); d = np.clip((248 - lum) / 22, 0, 1) * 0 + 0
    soft = np.clip(((240 - lum) / 25) + sat / 40, 0, 1)
    bgm = soft < 0.5; lab, n = nd.label(bgm); edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    conn = np.isin(lab, list(edge)); al = np.where(conn, soft, 1.0); return nd.gaussian_filter(al, 0.6)
cells = {'cinnamon_b': (130, 70, 420, 220), 'anise_p': (590, 70, 820, 250), 'beans_p': (960, 50, 1260, 260), 'pumpkin_t': (170, 270, 380, 470),
         'leaves_p': (550, 270, 850, 500), 'spice_p': (1000, 290, 1240, 480), 'coconut_t': (140, 500, 380, 720), 'nutmeg_p': (600, 520, 820, 700), 'flakes_p': (950, 510, 1270, 710)}
for k, (x0, y0, x1, y1) in cells.items():
    c = p[y0:y1, x0:x1]; al = key_white(c)
    if k not in ('beans_p', 'spice_p', 'flakes_p', 'anise_p'): al = biggest(al)
    ys, xs = np.where(al > 0.05); c2 = np.dstack([c, al * 255])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; put(c2, O + k + '.png')
# ---- the real lazy Susan, cut from its set
t = Image.open(S + 'turntable_set.jpg').convert('RGB'); m = Image.new('L', t.size, 0); dr = ImageDraw.Draw(m)
cx, cy, rx, ry, th = 635, 622, 377, 67, 40
for d in range(0, th + 1): dr.ellipse([cx - rx, cy - ry + d, cx + rx, cy + ry + d], fill=255)
m = m.filter(ImageFilter.GaussianBlur(1.2)); t.putalpha(m); t.crop((cx - rx - 4, cy - ry - 4, cx + rx + 4, cy + ry + th + 4)).save(O + 'turntable.png')
# ---- world, cropped to the 1536x1024 frame the scene code expects
w = Image.open(S + 'coquito_world.jpg').convert('RGB'); s = 1024 / w.height; w = w.resize((round(w.width * s), 1024), Image.LANCZOS)
x0 = (w.width - 1536) // 2; w.crop((x0, 0, x0 + 1536, 1024)).save(O + 'world.png'); print('world scale', s, 'offset', x0)
