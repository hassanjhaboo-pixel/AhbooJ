import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
R = sys.argv[1]; O = R + '/hi/'
p = np.asarray(Image.open(R + '/src/props_top.jpg').convert('RGB')).astype(np.float32)
paper = np.median(p[5:40, 5:400].reshape(-1, 3), 0); print('paper', paper)
cells = {'cinnamon_b': (130, 70, 420, 220), 'coconut_t': (130, 495, 400, 740), 'nutmeg_p': (600, 520, 820, 700), 'flakes_p': (950, 510, 1270, 710), 'anise_p': (590, 70, 820, 250)}
for k, (x0, y0, x1, y1) in cells.items():
    c = p[y0:y1, x0:x1]; lum = c.mean(2); sat = c.max(2) - c.min(2)
    obj = ((sat > 22) & ((lum < 205) | (sat > 45))) | (lum < 125) if k != 'flakes_p' else (sat > 22) | (lum < 125)
    if k == 'nutmeg_p': obj |= (np.abs(c - paper).max(2) > 38)
    obj = nd.binary_closing(obj, iterations=2); obj = nd.binary_fill_holes(obj)
    lab, n = nd.label(obj); sz = nd.sum(obj, lab, range(1, n + 1)); obj = np.isin(lab, [i + 1 for i in range(n) if sz[i] > 25])
    obj = nd.binary_erosion(obj, iterations=2); a_obj = nd.gaussian_filter(obj.astype(np.float32), 0.8)
    hh, ww = obj.shape; yy, xx = np.mgrid[0:hh, 0:ww]; edge = np.clip(np.minimum.reduce([xx, ww - 1 - xx, yy, hh - 1 - yy]) / 25, 0, 1)
    shade = np.clip((paper.mean() - lum - 4) / 90, 0, 0.55) * edge   # the soft shadow becomes a real dark, see-through shadow
    al = np.maximum(a_obj, shade * (1 - a_obj))
    core = nd.binary_erosion(obj, iterations=1); _, (iy, ix) = nd.distance_transform_edt(~core, return_indices=True)
    objc = c[iy, ix]; f = (a_obj / np.maximum(al, 1e-3))[..., None]
    rgb = objc * f + np.array([25, 15, 8]) * (1 - f)
    ys, xs = np.where(al > 0.04); out = np.dstack([np.clip(rgb, 0, 255), al * 255])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(out.astype(np.uint8)).save(O + k + '.png')
