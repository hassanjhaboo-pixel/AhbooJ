"""Intro ("Bisou presents") concepts, three frames each, plus the new colour-slab label sitting below the plate.
Run from motion/bisou: python3 -I tools/intro_mockups.py  ->  storyboard/intro.png (+ intro_<n>_<f>.jpg)"""
import os, math, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); W, H = 1080, 1920
N = lambda w, s: ImageFont.truetype(f'{R}/fonts/Nunito-{w}.ttf', s)
M = lambda w, s: ImageFont.truetype(f'{R}/fonts/CourierPrime-{w}.ttf', s)
CREAM = (255, 248, 238); INK = (43, 26, 18); RED = (176, 22, 32); BLACK = (11, 8, 7)
MARK = Image.open(R + '/hi/mark_white.png'); UT = MARK.crop((330, 0, 1000, 520))
PCX, PCY, PD = 540, 820, 900                      # plate centre and diameter on screen (sits higher, label goes under it)

def cover(img):
    s = max(W / img.width, H / img.height); im = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    return im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))
MAT = cover(Image.open(R + '/sources/gemini/placemat.jpg').convert('RGB')).filter(ImageFilter.GaussianBlur(1.0))
def mat(): return MAT.copy().convert('RGBA')
def tint(im, rgb):
    a = im.split()[3]; c = Image.new('RGBA', im.size, rgb + (255,)); c.putalpha(a); return c
def shadow(base, im, x, y, blur=30, alpha=.5, off=(18, 30)):
    a = im.split()[3].filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * alpha)); s = Image.new('RGBA', im.size, (20, 10, 5, 0)); s.putalpha(a)
    base.alpha_composite(s, (int(x + off[0]), int(y + off[1])))
def plate(base, cy=PCY, d=PD, cx=PCX):
    im = Image.open(R + '/hi/benedict_hero.png'); s = d / (im.width * 0.99); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = cx - im.width / 2, cy - im.height / 2; shadow(base, im, x, y); base.alpha_composite(im, (int(x), int(y)))
def text_shadow(base, layer, blur=20, alpha=.7):
    a = layer.split()[3].filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * alpha)); s = Image.new('RGBA', base.size, (10, 5, 2, 0)); s.putalpha(a)
    base.alpha_composite(s, (0, 6)); base.alpha_composite(layer)
def slab(base, lines, col, y0=1335, size=100):      # chosen label style C, now under the plate
    d = ImageDraw.Draw(base); h = 56 + len(lines) * (size * .98) + 34; d.rectangle([0, y0, W, y0 + h], fill=col)
    y = y0 + 44
    for ln in lines: d.text((70, y), ln, font=N(900, size), fill=CREAM); y += size * .98
    ic = UT.resize((round(UT.width * 72 / UT.height), 72), Image.LANCZOS); base.alpha_composite(ic, (W - 70 - ic.width, int(y0 + 42)))

# ---------- 1. the cloche: a silver dome over the first plate, lifted to present it ----------
def cloche(R_=520, knob=72):
    S = 2 * R_ + 8; yy, xx = np.mgrid[0:S, 0:S].astype(np.float32); cx = cy = S / 2; dx, dy = (xx - cx) / R_, (yy - cy) / R_; r = np.hypot(dx, dy)
    nz = np.sqrt(np.clip(1 - r ** 2, 0, 1)) * 0.85 + 0.15; nx, ny = dx * 0.9, dy * 0.9; ln = np.array([-.48, -.62, .62]); ln /= np.linalg.norm(ln)
    diff = np.clip(nx * ln[0] + ny * ln[1] + nz * ln[2], 0, 1); hx, hy, hz = ln[0], ln[1], ln[2] + 1; hn = math.sqrt(hx * hx + hy * hy + hz * hz)
    spec = np.clip((nx * hx + ny * hy + nz * hz) / hn, 0, 1) ** 60
    warm = np.stack([0.80 + 0.06 * r, 0.78 + 0.02 * r, 0.76 - 0.04 * r], -1)          # picks up the warm room at the edges
    col = warm * (0.42 + 0.62 * diff[..., None]) + spec[..., None] * 1.1
    band = (r > 0.935) & (r < 1.0); col[band] = col[band] * 0.86 + 0.16                  # rolled lip
    groove = (r > 0.905) & (r < 0.935); col[groove] *= 0.78
    kr = np.hypot(xx - cx, yy - cy) / knob; kz = np.sqrt(np.clip(1 - kr ** 2, 0, 1)); kd = np.clip((-.48 * (xx - cx) / knob - .62 * (yy - cy) / knob + .62 * kz), 0, 1)
    ks = np.clip(kd, 0, 1) ** 30; kc = 0.45 + 0.6 * kd[..., None]; kc = np.repeat(kc, 3, -1) * np.array([.82, .8, .78]) + ks[..., None]
    ring = (kr > 1.0) & (kr < 1.35); col[ring] *= (0.72 + 0.28 * (kr[ring] - 1) / 0.35)[..., None]
    col = np.where((kr <= 1.0)[..., None], kc, col)
    a = np.clip((1 - r) * R_ * 0.9, 0, 1)
    return Image.fromarray(np.dstack([np.clip(col * 255, 0, 255), a * 255]).astype(np.uint8))
CL = cloche()
def c1(f):
    b = mat(); plate(b)
    if f == 0:
        shadow(b, CL, PCX - CL.width / 2, PCY - CL.height / 2, 34, .6, (20, 36)); b.alpha_composite(CL, (PCX - CL.width // 2, PCY - CL.height // 2))
        L = Image.new('RGBA', b.size); d = ImageDraw.Draw(L)
        for i, t in enumerate(['BISOU', 'PRESENTS']): f_ = N(900, 150); d.text(((W - f_.getlength(t)) / 2, 1430 + i * 150), t, font=f_, fill=CREAM)
        text_shadow(b, L)
    elif f == 1:
        big = CL.resize((int(CL.width * 1.45), int(CL.height * 1.45)), Image.LANCZOS); x, y = PCX - big.width / 2 - 330, PCY - big.height / 2 - 520
        shadow(b, big, x, y, 70, .35, (120, 200)); b.alpha_composite(big, (int(x), int(y)))
        slab(b, ['THE NEW', 'BREAKFAST MENU'], INK)
    else:
        slab(b, ['FRIED CHICKEN', 'EGGS BENEDICT'], RED)
    return b

# ---------- 2. the order ticket: a kitchen ticket prints the five new plates, then tears away ----------
TICKET = ['-' * 30, 'NEW BREAKFAST MENU', 'ORDER #001      TABLE: YOU', '-' * 30, '1  Fried Chicken Eggs Benedict',
          '1  Shakshuka', '1  Turkish Eggs & Bake', '1  Eggs & Chilli Oil', '1  Pancakes', '-' * 30, 'ITEMS                       5', '', 'ORDER UP']
def ticket(h=1520):
    w = 940; t = Image.new('RGBA', (w, h + 30)); d = ImageDraw.Draw(t)
    pts = [(0, 0), (w, 0), (w, h)] + [(w - i * 19 - (9.5 if True else 0), h + (14 if i % 2 == 0 else 0)) for i in range(int(w / 19) + 1)] + [(0, h)]
    d.polygon(pts, fill=(250, 247, 240, 255))
    n = np.asarray(t).astype(np.float32); rng = np.random.default_rng(2); n[..., :3] -= rng.normal(0, 3, n.shape[:2])[..., None]   # paper tooth
    t = Image.fromarray(np.clip(n, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(t)
    m = tint(MARK, INK).resize((300, round(MARK.height * 300 / MARK.width)), Image.LANCZOS); t.alpha_composite(m, ((w - 300) // 2, 90))
    y = 70 + m.height + 40
    for ln in TICKET:
        f_ = M(700, 40) if ln and not ln.startswith('1') else M(400, 40)
        if ln == 'ORDER UP': f_ = M(700, 96); d.text(((w - f_.getlength(ln)) / 2, y), ln, font=f_, fill=INK); y += 110; continue
        d.text((52 if ln.startswith(('1', 'ITEMS', 'ORDER #')) or ln.startswith('-') else (w - f_.getlength(ln)) / 2, y), ln, font=f_, fill=INK); y += 62
    return t
TK = ticket()
def c2(f):
    b = mat()
    if f == 0:
        shadow(b, TK, 70, -20, 26, .45, (14, 22)); b.alpha_composite(TK, (70, -20))
    elif f == 1:
        plate(b); tk = TK.rotate(5, expand=True, resample=Image.BICUBIC); y = -1150
        shadow(b, tk, 30, y, 40, .4, (30, 60)); b.alpha_composite(tk, (30, y))
        L = Image.new('RGBA', b.size); d = ImageDraw.Draw(L); f_ = M(700, 120); t = 'ORDER UP'; d.text(((W - f_.getlength(t)) / 2, 1440), t, font=f_, fill=CREAM); text_shadow(b, L)
    else:
        plate(b); slab(b, ['FRIED CHICKEN', 'EGGS BENEDICT'], RED)
    return b

# ---------- 3. curtain call: their own mark on black, then the black opens like doors onto the table ----------
def mark_on(b, y, w=640):
    m = MARK.resize((w, round(MARK.height * w / MARK.width)), Image.LANCZOS); b.alpha_composite(m, ((W - w) // 2, y)); return m.height
def c3(f):
    if f == 0:
        b = Image.new('RGBA', (W, H), BLACK + (255,)); h = mark_on(b, 560); d = ImageDraw.Draw(b); f_ = N(800, 62); t = 'presents'
        d.text(((W - f_.getlength(t)) / 2, 560 + h + 60), t, font=f_, fill=CREAM); return b
    title = Image.new('RGBA', (W, H), BLACK + (255,)); d = ImageDraw.Draw(title); f_ = N(900, 176)
    rows = [('THE NEW', None), ('BREAKFAST', None), ('MENU', RED)]; y = 560
    for t, col in rows:
        tw = f_.getlength(t); x = (W - tw) / 2
        if col: d.rectangle([x - 30, y + 20, x + tw + 30, y + 200], fill=col)
        d.text((x, y), t, font=f_, fill=CREAM); y += 190
    sm = MARK.resize((260, round(MARK.height * 260 / MARK.width)), Image.LANCZOS); title.alpha_composite(sm, ((W - 260) // 2, 240))
    if f == 1: return title
    b = mat(); plate(b); g = 340
    lh, rh = title.crop((0, 0, W // 2, H)), title.crop((W // 2, 0, W, H))
    for im, x, off in ((lh, -g, (16, 0)), (rh, W // 2 + g, (-16, 0))): shadow(b, im, x, 0, 24, .7, off); b.alpha_composite(im, (x, 0))
    return b

CONCEPTS = [('1  The cloche', 'A silver dome over the first plate. "BISOU / PRESENTS", the lid lifts toward camera and flies off, the dish is revealed.', c1),
            ('2  The order ticket', 'A kitchen ticket prints the five new plates (Table: you). It tears away with "ORDER UP" and the first plate is underneath.', c2),
            ('3  Curtain call', 'Their own mark on black, "presents", then THE NEW BREAKFAST MENU. The black splits like doors onto the table.', c3)]
FW, FH, G = 340, 604, 22; sheet = Image.new('RGB', (3 * FW + 4 * G + 470, len(CONCEPTS) * (FH + G) + G), (18, 13, 10)); d = ImageDraw.Draw(sheet)
for i, (name, desc, fn) in enumerate(CONCEPTS):
    y = G + i * (FH + G); d.text((G, y + 6), name, font=N(800, 40), fill=CREAM)
    words, line, yy = desc.split(), '', y + 70
    for w_ in words:
        if N(600, 26).getlength(line + ' ' + w_) > 420: d.text((G, yy), line.strip(), font=N(600, 26), fill=(214, 202, 190)); yy += 36; line = ''
        line += ' ' + w_
    d.text((G, yy), line.strip(), font=N(600, 26), fill=(214, 202, 190))
    for f in range(3):
        im = fn(f).convert('RGB'); im.save(R + f'/storyboard/intro_{i + 1}_{f + 1}.jpg', quality=92)
        sheet.paste(im.resize((FW, FH), Image.LANCZOS), (470 + G + f * (FW + G), y))
sheet.save(R + '/storyboard/intro.png'); print('ok')
