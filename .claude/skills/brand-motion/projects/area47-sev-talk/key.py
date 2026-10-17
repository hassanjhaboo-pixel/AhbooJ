#!/usr/bin/env python3
# Key the flat magenta background out of SEV art: soft alpha by colour distance + magenta despill on the edge pixels.
#   python3 key.py src.png out.png
import sys
import numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
a = np.array(Image.open(src).convert('RGB')).astype(np.float32)
M = np.median(np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3)]), axis=0)
d = np.sqrt(((a - M) ** 2).sum(-1))
alpha = np.clip((d - 60) / 90, 0, 1)
edge = np.array(Image.fromarray((alpha < 0.999).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7))) > 0
R, G, B = a[..., 0], a[..., 1], a[..., 2]
spill = edge & (R > G) & (B > G)
a[..., 0] = np.where(spill, np.minimum(R, G), R)          # magenta fringe -> cyan/white/black
# un-premultiply the background out of semi-transparent pixels
k = alpha[..., None]
fg = np.where(k > 0.05, (a - (1 - k) * np.where(spill[..., None], [0, 0, 0], M)) / np.maximum(k, 0.05), a)
fg = np.clip(np.where(spill[..., None], a, fg), 0, 255)
out = np.dstack([fg, alpha * 255]).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(dst)
print(dst, M)
