#!/usr/bin/env python3
# Topographic contour lines for the AREA 47 topo Story: a smooth terrain field -> marching squares -> stitched, simplified polylines.
# The field covers more than the 1080x1920 frame, so the lines can scale and rotate without bare edges.
# Output contours.json: {levels:[{major:bool, lines:[[[x,y],...]]}]} in frame fractions.
import json, math, os
import numpy as np
here = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
rng = np.random.default_rng(47)
x0, x1, y0, y1 = -420, 1500, -380, 2300
NX, NY = 200, 280
xs = np.linspace(x0, x1, NX); ys = np.linspace(y0, y1, NY)
X, Y = np.meshgrid(xs, ys)
# terrain: one summit off-centre (behind the type), a few hills, a ridge, low-frequency waves
Z = 1.25 * np.exp(-(((X - 600) / 330) ** 2 + ((Y - 860) / 420) ** 2))
for _ in range(9):
    cx, cy = rng.uniform(x0, x1), rng.uniform(y0, y1)
    sx, sy = rng.uniform(140, 380), rng.uniform(140, 420)
    Z += rng.uniform(-0.6, 0.75) * np.exp(-(((X - cx) / sx) ** 2 + ((Y - cy) / sy) ** 2))
for _ in range(5):
    k = rng.uniform(0.002, 0.006); a = rng.uniform(0, math.pi)
    Z += 0.12 * np.sin(k * (X * math.cos(a) + Y * math.sin(a)) + rng.uniform(0, 6.28))
levels = np.linspace(Z.min() + 0.08, Z.max() - 0.03, 26)

def march(level):
    segs = []
    v = Z - level
    for j in range(NY - 1):
        for i in range(NX - 1):
            a, b, c, d = v[j, i], v[j, i + 1], v[j + 1, i + 1], v[j + 1, i]
            idx = (a > 0) | ((b > 0) << 1) | ((c > 0) << 2) | ((d > 0) << 3)
            if idx in (0, 15): continue
            def e(p, q, pv, qv):
                t = pv / (pv - qv); return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]))
            P = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            E = {0: lambda: e(P[0], P[1], a, b), 1: lambda: e(P[1], P[2], b, c), 2: lambda: e(P[2], P[3], c, d), 3: lambda: e(P[3], P[0], d, a)}
            table = {1: [(3, 0)], 2: [(0, 1)], 3: [(3, 1)], 4: [(1, 2)], 5: [(3, 0), (1, 2)], 6: [(0, 2)], 7: [(3, 2)],
                     8: [(2, 3)], 9: [(0, 2)], 10: [(0, 1), (2, 3)], 11: [(1, 2)], 12: [(1, 3)], 13: [(0, 1)], 14: [(3, 0)]}
            for p, q in table[idx]:
                segs.append((E[p](), E[q]()))
    return segs

def stitch(segs):
    key = lambda p: (round(p[0], 4), round(p[1], 4))
    adj = {}
    for s in segs:
        for k in (0, 1): adj.setdefault(key(s[k]), []).append((s, k))
    used = set(); lines = []
    for s in segs:
        if id(s) in used: continue
        used.add(id(s)); line = [s[0], s[1]]
        for end in (1, 0):
            while True:
                tip = line[-1] if end else line[0]
                nxt = None
                for t, k in adj.get(key(tip), []):
                    if id(t) not in used: nxt = (t, k); break
                if not nxt: break
                t, k = nxt; used.add(id(t)); p = t[1 - k]
                if end: line.append(p)
                else: line.insert(0, p)
        lines.append(line)
    return lines

def to_px(p):
    return (x0 + p[0] * (x1 - x0) / (NX - 1), y0 + p[1] * (y1 - y0) / (NY - 1))

def simplify(pts, tol=2.5):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0]), np.array(pts[-1]); best, bi = 0, 0
    ab = b - a; L = np.hypot(*ab)
    for i in range(1, len(pts) - 1):
        p = np.array(pts[i])
        d = abs(ab[0] * (a[1] - p[1]) - ab[1] * (a[0] - p[0])) / L if L > 1e-9 else np.hypot(*(p - a))
        if d > best: best, bi = d, i
    if best > tol: return simplify(pts[:bi + 1], tol)[:-1] + simplify(pts[bi:], tol)
    return [pts[0], pts[-1]]

out = []; total = 0
for li, lv in enumerate(levels):
    lines = []
    for ln in stitch(march(lv)):
        px = [to_px(p) for p in ln]
        if len(px) < 6: continue
        px = simplify(px, 2.2)
        if len(px) < 3: continue
        lines.append([[round(x / W, 4), round(y / H, 4)] for x, y in px]); total += len(px)
    out.append({'major': li % 4 == 0, 'lines': lines})
json.dump({'levels': out}, open(os.path.join(here, 'contours.json'), 'w'))
print(f'contours.json: {len(out)} levels, {sum(len(l["lines"]) for l in out)} lines, {total} points')
