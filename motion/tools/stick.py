# wrap a flat sticker onto a cup cut-out: python3 -I stick.py cup.png sticker.png out.png centre_row arc_diameter
import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
cupf, stf, outf, yc, D = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
cup = np.asarray(Image.open(cupf).convert('RGBA')).astype(np.float32); rgb = cup[..., :3]; ca = cup[..., 3] / 255; H, W = ca.shape
st = np.asarray(Image.open(stf).convert('RGBA')).astype(np.float32); SH, SW = st.shape[:2]
L = np.full(H, np.nan); R = np.full(H, np.nan)
for y in range(H):
    xs = np.where(ca[y] > 0.5)[0]
    if len(xs) > 50: L[y], R[y] = xs.min(), xs.max()
rows = np.arange(H); ok = ~np.isnan(L); L = np.interp(rows, rows[ok], L[ok]); R = np.interp(rows, rows[ok], R[ok])
L = nd.uniform_filter1d(L, 41); R = nd.uniform_filter1d(R, 41); cx = (L + R) / 2; r = (R - L) / 2 * 0.97
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
q = (xx - cx[:, None]) / r[:, None]; th = np.arcsin(np.clip(q, -0.999, 0.999)); s = r[:, None] * th
u = s / D + 0.5; v = (yy - (yc - D / 2)) / D; valid = (np.abs(q) < 0.999) & (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1)
samp = np.stack([nd.map_coordinates(st[..., c], [v * (SH - 1), u * (SW - 1)], order=1, mode='constant') for c in range(4)], -1)
sa = samp[..., 3:4] / 255 * valid[..., None]
shade = (0.8 + 0.2 * np.cos(th)) * (1.03 - 0.09 * (q + 1) / 2); col = samp[..., :3] * shade[..., None]
lum = rgb.mean(2); hp = lum - nd.gaussian_filter(lum, 3 * H / 1678); drops = np.clip(hp - 4, 0, 80); dark = np.clip(-(hp + 6), 0, 40)
col = col + drops[..., None] * 0.9 - dark[..., None] * 0.35
out = rgb * (1 - sa) + col * sa
Image.fromarray(np.dstack([np.clip(out, 0, 255), cup[..., 3:4]]).astype(np.uint8)).save(outf)
