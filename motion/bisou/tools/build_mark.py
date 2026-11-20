"""Rebuild the white Bisou mark (utensil rail + BISOU + BISTRO & CAKERY) as clean vectors.

Utensils: traced from their outro frame (sources/outro_mark_crop.png), since they are hand drawn.
Lettering: Nunito outlines, fitted to the measured bands of the original.
Writes hi/mark_white.svg (all white) and hi/mark_parts.json (separate paths for animating).
Run: python3 -I tools/build_mark.py   (from motion/bisou)
"""
import json, os, cv2, numpy as np, potrace
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'sources/outro_mark_crop.png')
FONT = os.path.join(ROOT, 'fonts/nunito-latin-var.woff2')
W, H = 440, 380                       # same frame as the source crop, so overlays line up

# measured from the source crop (rows/cols of white pixels)
BANDS = {
    'word': dict(text='BISOU', wght=470, box=(24, 199, 407, 308), track=None, over=1.03),
    'sub':  dict(text='BISTRO & CAKERY', wght=820, box=(29, 327, 397, 351), track=None, over=1.0),
}

def trace_utensils():
    im = cv2.imread(SRC, 0)
    x0, y0, x1, y1 = 100, 5, 330, 195
    reg = im[y0:y1, x0:x1]
    K = 8
    up = cv2.resize(reg, None, fx=K, fy=K, interpolation=cv2.INTER_CUBIC)
    bw = up < 160                     # potracer fills the True region's complement; invert so white ink is the fill
    pl = potrace.Bitmap(bw).trace(turdsize=200, alphamax=1.1, opticurve=True, opttolerance=0.4)
    paths = []
    for c in pl:
        f = lambda p: f"{p.x / K + x0:.2f},{p.y / K + y0:.2f}"
        d = "M" + f(c.start_point)
        for s in c.segments:
            d += (f"L{f(s.c)}L{f(s.end_point)}" if s.is_corner else f"C{f(s.c1)} {f(s.c2)} {f(s.end_point)}")
        paths.append(d + "Z")
    return [''.join(paths)]          # one path, so potrace's hole curves cut out with evenodd

def letter_boxes(y0, y1):
    """bbox of each letter in a band of the source, left to right (x, y, w, h in crop px)."""
    im = cv2.imread(SRC, 0)
    b = (im[y0:y1] > 128).astype(np.uint8)
    n, _, st, _ = cv2.connectedComponentsWithStats(b, 8)
    boxes = sorted((int(x), int(y) + y0, int(w), int(h)) for x, y, w, h, a in st[1:] if a > 8)
    return boxes

def glyph_paths(font, text, box, track=None, over=1.0):
    """Each glyph scaled to the measured bbox of the same letter in the original,
    with one shared vertical scale so the letters stay one family."""
    gs, cmap = font.getGlyphSet(), font.getBestCmap()
    names = [cmap[ord(ch)] for ch in text if ch != ' ']
    boxes = letter_boxes(box[1], box[3] + 1)
    assert len(boxes) == len(names), (text, len(boxes), len(names))
    capH = font['OS/2'].sCapHeight
    top, base = min(b[1] for b in boxes), max(b[1] + b[3] for b in boxes)
    sy = (base - top) / (capH * over)
    ov = (base - top - capH * sy) / 2           # round letters overshoot the cap line and baseline
    out = []
    for n, (bx, by, bw, bh) in zip(names, boxes):
        bp = BoundsPen(gs); gs[n].draw(bp); g = bp.bounds
        sx = bw / (g[2] - g[0])
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
        gs[n].draw(TransformPen(pen, (sx, 0, 0, -sy, bx - g[0] * sx, base - ov)))
        out.append(pen.getCommands())
    return out

def main():
    parts = {'utensils': trace_utensils()}
    for key, spec in BANDS.items():
        f = instancer.instantiateVariableFont(TTFont(FONT), {'wght': spec['wght']})
        parts[key] = glyph_paths(f, spec['text'], spec['box'], spec['track'], spec['over'])
    # traced utensils need evenodd (holes are separate curves); font outlines overlap, so they need nonzero
    rule = lambda k: 'evenodd' if k == 'utensils' else 'nonzero'
    body = ''.join(f'<path fill-rule="{rule(k)}" d="{d}"/>' for k in parts for d in parts[k])
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
           f'<g fill="#fff">{body}</g></svg>')
    open(os.path.join(ROOT, 'hi/mark_white.svg'), 'w').write(svg)
    json.dump({'w': W, 'h': H, **parts}, open(os.path.join(ROOT, 'hi/mark_parts.json'), 'w'))
    print({k: len(v) for k, v in parts.items()})

if __name__ == '__main__':
    main()
