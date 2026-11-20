"""Four label styles on real frames (benedict plate, shakshuka close-up). Writes storyboard/labels.png
Run from motion/bisou: python3 -I tools/label_mockups.py"""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = lambda w, s: ImageFont.truetype(f'{R}/fonts/Nunito-{w}.ttf', s)
CREAM = (255, 248, 238); INK = (43, 26, 18)
FRAMES = [('raw_4.png', ['FRIED CHICKEN', 'EGGS BENEDICT'], 'BENEDICT', 'Fried chicken eggs', (176, 22, 32)),
          ('raw_9.6.png', ['SHAKSHUKA'], 'SHAKSHUKA', 'New on the menu', (205, 72, 40))]
MARK = Image.open(R + '/hi/mark_white.png').crop((330, 0, 1000, 520))

def shadowed(base, layer, blur=22, alpha=0.75, off=(0, 6)):
    a = layer.split()[3].filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * alpha))
    sh = Image.new('RGBA', base.size, (12, 6, 3, 0)); sh.putalpha(a); base.alpha_composite(sh, off); base.alpha_composite(layer)

def fit(text, w, weight=900, start=220):
    s = start
    while F(weight, s).getlength(text) > w and s > 20: s -= 2
    return F(weight, s)

def icon(h):
    return MARK.resize((round(MARK.width * h / MARK.height), h), Image.LANCZOS)

def style_a(im, lines, word, sub, col):      # editorial stack, low left, accent rule + mark
    L = Image.new('RGBA', im.size); d = ImageDraw.Draw(L); f = F(900, 116); y = 1560 - len(lines) * 108
    for ln in lines: d.text((70, y), ln, font=f, fill=CREAM); y += 108
    d.rectangle([74, y + 44, 374, y + 52], fill=col); L.alpha_composite(icon(46), (394, y + 26))
    shadowed(im, L)

def style_b(im, lines, word, sub, col):      # one giant word, full width, the rest under it
    L = Image.new('RGBA', im.size); d = ImageDraw.Draw(L); f = fit(word, 960); bb = d.textbbox((0, 0), word, font=f)
    x = (1080 - (bb[2] - bb[0])) / 2 - bb[0]; y = 1250
    d.text((x, y), word, font=f, fill=CREAM); yb = y + bb[3] + 18
    fs = F(800, 46); d.text(((1080 - fs.getlength(sub)) / 2, yb), sub, font=fs, fill=CREAM)
    d.rectangle([490, yb + 74, 590, yb + 80], fill=col)
    shadowed(im, L, blur=26, alpha=0.8)

def style_c(im, lines, word, sub, col):      # solid colour slab in the dish's colour, type knocked out of it
    d = ImageDraw.Draw(im); f = F(900, 104); h = 70 + len(lines) * 100 + 40; y0 = 1600 - h
    d.rectangle([0, y0, 1080, 1600], fill=col)
    y = y0 + 52
    for ln in lines: d.text((70, y), ln, font=f, fill=CREAM); y += 100
    ic = icon(70); im.alpha_composite(ic, (1080 - 70 - ic.width, y0 + 40))

def style_d(im, lines, word, sub, col):   # set around the plate, like a stamp
    cx, cy, r = (540, 960, 455) if len(lines) > 1 else (622, 900, 440)
    text = '  ·  '.join([' '.join(lines)] * (1 if len(lines) > 1 else 2)) + '  ·  '; f = F(900, 56 if len(lines) > 1 else 64)
    L = Image.new('RGBA', im.size); total = sum(f.getlength(ch) + 6 for ch in text); ang = -math.pi / 2 - (total / r) / 2
    for ch in text:
        w = f.getlength(ch) + 6; a = ang + (w / 2) / r; g = Image.new('RGBA', (120, 120)); ImageDraw.Draw(g).text((60, 60), ch, font=f, fill=CREAM, anchor='mm')
        g = g.rotate(-math.degrees(a + math.pi / 2), resample=Image.BICUBIC)
        L.alpha_composite(g, (int(cx + r * math.cos(a) - 60), int(cy + r * math.sin(a) - 60))); ang += w / r
    shadowed(im, L, blur=14, alpha=0.8, off=(0, 4))
    d = ImageDraw.Draw(im); d.rectangle([490, 1700, 590, 1706], fill=col)

STYLES = [('A  Editorial stack', style_a), ('B  One giant word', style_b), ('C  Colour slab', style_c), ('D  Around the plate', style_d)]
W, Hh = 432, 768; sheet = Image.new('RGB', (len(STYLES) * (W + 24) + 24, 2 * (Hh + 24) + 110), (18, 13, 10)); d = ImageDraw.Draw(sheet)
for i, (name, fn) in enumerate(STYLES):
    d.text((24 + i * (W + 24), 34), name, font=F(800, 40), fill=CREAM)
    for j, (f, lines, word, sub, col) in enumerate(FRAMES):
        im = Image.open(R + '/storyboard/' + f).convert('RGBA'); fn(im, lines, word, sub, col)
        im.convert('RGB').save(R + f'/storyboard/label_{name[0]}_{j}.jpg', quality=92)
        sheet.paste(im.convert('RGB').resize((W, Hh), Image.LANCZOS), (24 + i * (W + 24), 100 + j * (Hh + 24)))
sheet.save(R + '/storyboard/labels.png'); print('ok')
