import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
src, out = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
be = a[..., 2] - a[..., 0]
bgm = be > 6
lab, n = nd.label(bgm); edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
conn = np.isin(lab, list(edge)); al = np.where(conn, np.clip((18 - be) / 12, 0, 1), 1.0)
lab, n = nd.label(al > 0.5); sz = nd.sum(al > 0.5, lab, range(1, n + 1)); al = al * nd.binary_dilation(lab == (np.argmax(sz) + 1), iterations=2)
al = nd.gaussian_filter(np.minimum(al, nd.grey_erosion(al, size=(3, 3))), 0.8)
b = a[..., 2]; lim = (a[..., 0] + a[..., 1]) / 2 + 4; a[..., 2] = np.where(al < 0.98, np.minimum(b, lim), b)
W = (al > 0.5).sum(1); rows = np.where(W > 40)[0]; print(src, 'rows', rows.min(), rows.max())
for y in range(rows.min(), rows.max() + 1, 60): print(' ', y, W[y])
Image.fromarray(np.dstack([np.clip(a, 0, 255), al * 255]).astype(np.uint8)).save(out)
