"""Curtain call, round 2: screen 2 options and screen 3 transitions. Run from motion/bisou: python3 -I tools/intro2_mockups.py
-> storyboard/intro2.png and storyboard/intro2_<key>.jpg"""
import os, math, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'intro_mockups.py')).read().split('# ---------- 1. the cloche')[0])
CREAM_A = CREAM + (255,)

def comp_tex(name, w, h, zoom=0.5, cx=0.5, cy=0.5):   # a food texture cut from a baked dish image
    im = Image.open(f'{R}/hi/{name}_comp.png').convert('RGB'); s = min(im.size) * zoom
    box = (im.width * cx - s / 2, im.height * cy - s / 2, im.width * cx + s / 2, im.height * cy + s / 2)
    c = im.crop(tuple(int(v) for v in box)); k = max(w / c.width, h / c.height); c = c.resize((math.ceil(c.width * k), math.ceil(c.height * k)), Image.LANCZOS)
    return c.crop(((c.width - w) // 2, (c.height - h) // 2, (c.width - w) // 2 + w, (c.height - h) // 2 + h))

def fit(text, w, weight=900, start=400):
    s = start
    while N(weight, s).getlength(text) > w: s -= 2
    return N(weight, s)

# ---------- screen 2A: the words are cut out of the food ----------
def s2_food():
    b = Image.new('RGBA', (W, H), BLACK + (255,)); sm = MARK.resize((240, round(MARK.height * 240 / MARK.width)), Image.LANCZOS); b.alpha_composite(sm, ((W - 240) // 2, 230))
    rows = [('THE NEW', 'shakshuka', .42, .55, .5), ('BREAKFAST', 'benedict', .45, .5, .48), ('MENU', 'pancake', .4, .52, .55)]; y = 560
    for t, dish, z, cx, cy in rows:
        f_ = fit(t, 980); bb = f_.getbbox(t); tw, th = bb[2] - bb[0], bb[3] - bb[1]
        m = Image.new('L', (W, th + 20)); ImageDraw.Draw(m).text(((W - tw) / 2 - bb[0], 10 - bb[1]), t, font=f_, fill=255)
        tex = comp_tex(dish, W, th + 20, z, cx, cy); tile = Image.new('RGBA', (W, th + 20)); tile.paste(tex, (0, 0)); tile.putalpha(m)
        glow = m.filter(ImageFilter.GaussianBlur(18)).point(lambda v: int(v * .35)); g = Image.new('RGBA', m.size, (255, 200, 140, 0)); g.putalpha(glow)
        b.alpha_composite(g, (0, y)); b.alpha_composite(tile, (0, y)); y += th + 46
    d = ImageDraw.Draw(b); f_ = N(800, 44); t = 'five new plates'; d.text(((W - f_.getlength(t)) / 2, y + 40), t, font=f_, fill=CREAM)
    return b

# ---------- screen 2B: a printed Bisou menu card, presented ----------
def s2_card():
    b = Image.new('RGBA', (W, H), BLACK + (255,)); cw, ch = 800, 1260; card = Image.new('RGBA', (cw, ch), (247, 241, 230, 255)); d = ImageDraw.Draw(card)
    d.rectangle([24, 24, cw - 24, ch - 24], outline=INK + (255,), width=3)
    m = tint(MARK, INK).resize((300, round(MARK.height * 300 / MARK.width)), Image.LANCZOS); card.alpha_composite(m, ((cw - 300) // 2, 90))
    y = 90 + m.height + 60; f_ = N(900, 96); t = 'Breakfast'; d.text(((cw - f_.getlength(t)) / 2, y), t, font=f_, fill=INK); y += 120
    f_ = N(700, 34); t = 'new on the menu'; d.text(((cw - f_.getlength(t)) / 2, y), t, font=f_, fill=INK); y += 90
    ic = tint(UT, INK).resize((round(UT.width * 34 / UT.height), 34), Image.LANCZOS)
    for i, n in enumerate(['Fried Chicken Eggs Benedict', 'Shakshuka', 'Turkish Eggs & Bake', 'Eggs & Chilli Oil', 'Pancakes']):
        f_ = N(800, 44); d.text(((cw - f_.getlength(n)) / 2, y), n, font=f_, fill=INK); y += 70
        if i < 4: card.alpha_composite(ic, ((cw - ic.width) // 2, y)); y += 58
    card = card.rotate(-3, expand=True, resample=Image.BICUBIC); x, yy = (W - card.width) // 2, (H - card.height) // 2 + 40
    shadow(b, card, x, yy, 40, .9, (0, 30)); b.alpha_composite(card, (x, yy)); return b

def scene(label=False):
    b = mat(); plate(b)
    if label: slab(b, ['FRIED CHICKEN', 'EGGS BENEDICT'], RED)
    return b

# ---------- screen 3, transition 1: through the O. The camera flies into the O; its ring becomes the plate rim ----------
def through_o(k):
    O = (266, 254, 48, 54.8); rx = lerp(160, PD / 2 * 1.02, k); s = rx / O[2]; ocx, ocy = PCX, PCY
    b = Image.new('RGBA', (W, H), BLACK + (255,)); sc = scene().resize((round(W * rx / (PD / 2)), round(H * rx / (PD / 2))), Image.LANCZOS)
    sx, sy = ocx - PCX * rx / (PD / 2), ocy - PCY * rx / (PD / 2)
    msk = Image.new('L', (W, H)); ImageDraw.Draw(msk).ellipse([ocx - rx * 0.86, ocy - rx * 0.86 * O[3] / O[2], ocx + rx * 0.86, ocy + rx * 0.86 * O[3] / O[2]], fill=255)
    layer = Image.new('RGBA', (W, H)); layer.paste(sc, (int(sx), int(sy))); layer.putalpha(ImageChops.multiply(layer.split()[3], msk)); b.alpha_composite(layer)
    mk = MARK.resize((round(440 * s), round(380 * s)), Image.LANCZOS)   # mark png is 3x the 440x380 viewBox
    b.alpha_composite(mk, (int(ocx - O[0] * s), int(ocy - O[1] * s))); return b
def lerp(a, b_, k): return a + (b_ - a) * k

# ---------- screen 3, transition 2: the tablecloth trick. A black cloth is whipped off the table ----------
def tablecloth(k):
    b = scene(); cloth = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(cloth)
    edge = []
    for i in range(41):
        u = i / 40; x = lerp(-200, W + 200, u); y = H * (1 - k * 1.25) + math.sin(u * math.pi * 1.6 + k * 4) * 140 + (u - .5) * -620 * k
        edge.append((x, y))
    d.polygon(edge + [(W + 200, -300), (-200, -300)], fill=(8, 7, 7, 255))
    a = np.asarray(cloth).astype(np.float32); yy, xx = np.mgrid[0:H, 0:W]
    folds = (np.sin(xx / 60 + yy / 140) * .5 + .5) ** 6 * 38 + (np.sin(xx / 23 - yy / 90 + 1) * .5 + .5) ** 10 * 22   # satin sheen
    a[..., :3] += folds[..., None] * (a[..., 3:] / 255); cloth = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    shadow(b, cloth, 0, 0, 30, .8, (0, 26)); b.alpha_composite(cloth); return b

# ---------- screen 3, transition 3: spotlight. Lights off, one beam finds the plate, then the room warms up ----------
def spotlight(k):
    b = scene(); dark = Image.new('RGBA', (W, H), (6, 4, 3, 255)); m = Image.new('L', (W, H), 255)
    r = PD / 2 * 1.12; ImageDraw.Draw(m).ellipse([PCX - r, PCY - r, PCX + r, PCY + r], fill=int(255 * (1 - 0.98)))
    m = m.filter(ImageFilter.GaussianBlur(50)).point(lambda v: int(v * (1 - k)))
    dark.putalpha(m); b.alpha_composite(dark)
    if k < .5:
        beam = Image.new('L', (W, H)); ImageDraw.Draw(beam).ellipse([PCX - r * 1.05, PCY - r * 1.05, PCX + r * 1.05, PCY + r * 1.05], fill=40)
        warm = Image.new('RGBA', (W, H), (255, 220, 170, 0)); warm.putalpha(beam.filter(ImageFilter.GaussianBlur(70))); b.alpha_composite(warm)
    return b

S1 = Image.open(R + '/storyboard/intro_3_1.jpg').convert('RGBA')
ROWS = [('Screen 1 (yours)', [('Mark + presents', S1)]),
        ('Screen 2 · A: food letters', [('THE NEW BREAKFAST MENU, letters filled with the dishes', s2_food())]),
        ('Screen 2 · B: menu card', [('A printed Bisou breakfast card, presented', s2_card())]),
        ('Screen 3, transition 1: through the O', [('Camera flies into the O', through_o(0.25)), ('Its ring becomes the plate rim', through_o(0.85)), ('Lands on the plate', scene(True))]),
        ('Screen 3, transition 2: tablecloth trick', [('Black cloth whipped off', tablecloth(0.35)), ('Almost gone', tablecloth(0.75)), ('Plate stays perfectly still', scene(True))]),
        ('Screen 3, transition 3: spotlight', [('Lights off, one beam', spotlight(0.0)), ('Room warms up', spotlight(0.6)), ('Full light', scene(True))])]
FW, FH, G = 300, 533, 20; HDR = 46
sheet = Image.new('RGB', (G + 3 * (FW + G) + 40, 0), (18, 13, 10))
blocks = []
for title, frames in ROWS:
    blk = Image.new('RGB', (sheet.width, HDR + FH + 70), (18, 13, 10)); d = ImageDraw.Draw(blk); d.text((G, 6), title, font=N(800, 32), fill=CREAM)
    for i, (cap, im) in enumerate(frames):
        im.convert('RGB').save(R + f'/storyboard/intro2_{len(blocks)}_{i}.jpg', quality=92); blk.paste(im.convert('RGB').resize((FW, FH), Image.LANCZOS), (G + i * (FW + G), HDR))
        words, line, yy = cap.split(), '', HDR + FH + 8
        for w_ in words:
            if N(600, 20).getlength(line + ' ' + w_) > FW: d.text((G + i * (FW + G), yy), line.strip(), font=N(600, 20), fill=(214, 202, 190)); yy += 26; line = ''
            line += ' ' + w_
        d.text((G + i * (FW + G), yy), line.strip(), font=N(600, 20), fill=(214, 202, 190))
    blocks.append(blk)
# two columns of blocks: screens on the left, transitions on the right
L, Rr = blocks[:3], blocks[3:]; colw = blocks[0].width
lw = G + FW + G; left = [b.crop((0, 0, lw + 10, b.height)) for b in L]
out = Image.new('RGB', (lw + 10 + colw, max(sum(b.height for b in left), sum(b.height for b in Rr))), (18, 13, 10)); y = 0
for b in left: out.paste(b, (0, y)); y += b.height
y = 0
for b in Rr: out.paste(b, (lw + 10, y)); y += b.height
out.save(R + '/storyboard/intro2.png'); print('ok', out.size)
