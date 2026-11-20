"""Storyboard frames for the Bisou breakfast reel, made from the real assets (540x960 each).
Run from motion/bisou: python3 -I tools/storyboard_frames.py  ->  storyboard/frames/N.jpg"""
import os, math, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G, HI, OUT = R + '/sources/gemini/', R + '/hi/', R + '/storyboard/frames/'
os.makedirs(OUT, exist_ok=True)
W, H = 540, 960
F800 = lambda s: ImageFont.truetype(R + '/fonts/Nunito-800.ttf', s)
F600 = lambda s: ImageFont.truetype(R + '/fonts/Nunito-600.ttf', s)
INK = (43, 26, 18)                       # cutting-board brown from their profile logo

def cover(img, w=W, h=H, cx=.5, cy=.5):
    s = max(w / img.width, h / img.height); im = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x = int((im.width - w) * cx); y = int((im.height - h) * cy); return im.crop((x, y, x + w, y + h))

MAT = cover(Image.open(G + 'placemat.jpg').convert('RGB'))
def mat(dim=0.0, blur=1.2):
    m = MAT.filter(ImageFilter.GaussianBlur(blur))
    return ImageEnhance.Brightness(m).enhance(1 - dim).convert('RGBA')

def plate(name, width, f='hero'):
    im = Image.open(HI + f'{name}_hero.png') if f == 'hero' else Image.open(G + f'{name}.jpg').convert('RGBA')
    s = width / im.width; return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)

def put(base, im, cx, cy, rot=0, shadow=True):
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    x, y = round(cx - im.width / 2), round(cy - im.height / 2)
    if shadow:
        a = im.split()[3].filter(ImageFilter.GaussianBlur(14)); sh = Image.new('RGBA', im.size, (20, 10, 5, 0)); sh.putalpha(a.point(lambda v: v * .45))
        base.alpha_composite(sh, (x + 10, y + 18))
    base.alpha_composite(im, (x, y))

def label(base, text, y, sub=None):
    d = ImageDraw.Draw(base); f = F800(30); tw = d.textlength(text, font=f)
    mark = Image.open(HI + 'mark_white.png'); u = mark.crop((330, 0, 1000, 520)); u = u.resize((round(u.width * 34 / u.height), 34), Image.LANCZOS)
    bw = int(tw + u.width + 52); x = (W - bw) // 2
    d.rectangle([x, y, x + bw, y + 58], fill=INK)
    base.alpha_composite(u, (x + 16, y + 12)); d.text((x + 16 + u.width + 14, y + 10), text, font=f, fill=(255, 250, 242))

def fork(base, tip_x, tip_y, ang=0, scale=.55):
    fk = Image.open(HI + 'fork.png'); fk = fk.resize((round(fk.width * scale), round(fk.height * scale)), Image.LANCZOS)
    put(base, fk.rotate(ang, expand=True, resample=Image.BICUBIC), tip_x, tip_y, shadow=True)

def caption(base, text, y, size=40):
    d = ImageDraw.Draw(base); f = F800(size); tw = d.textlength(text, font=f)
    d.text(((W - tw) / 2 + 2, y + 3), text, font=f, fill=(0, 0, 0, 120)); d.text(((W - tw) / 2, y), text, font=f, fill=(255, 250, 242))

def counter(base, n):
    d = ImageDraw.Draw(base); f = F800(64); t = f'{n}/5'
    x = W - 40 - d.textlength(t, font=f); d.text((x + 4, 58), t, font=f, fill=(0, 0, 0, 110)); d.text((x, 52), t, font=f, fill=(255, 250, 242))

def save(im, n): im.convert('RGB').save(OUT + f'{n}.jpg', quality=90)

# 1 hook: macro of the benedict, the fork sneaking in
b = cover(Image.open(HI + 'benedict_L2.png').convert('RGB')).convert('RGBA'); counter(b, 1); save(b, 1)
# 2 reveal the plate + name
b = mat(); put(b, plate('benedict', 470), W / 2, 430); label(b, 'Fried Chicken Eggs Benedict', 760); counter(b, 1); save(b, 2)
# 3 plate whips up, next plate arrives from below, fork stabs empty mat
b = mat(); p = plate('benedict', 470).filter(ImageFilter.GaussianBlur(3)); put(b, p, W / 2, -150)
put(b, plate('shakshuka', 470), W / 2, 820); counter(b, 2); save(b, 3)
# 4 shakshuka close-up + name
b = cover(Image.open(HI + 'shakshuka_L3.png').convert('RGB')).convert('RGBA'); label(b, 'Shakshuka', 820); counter(b, 2); save(b, 4)
# 5 turkish eggs, fork lunges in from the left and misses
b = mat(); put(b, plate('turkish', 470), W / 2, 430); label(b, 'Turkish Eggs & Bake', 760); counter(b, 3); save(b, 5)
# 6 chilli eggs close-up, fork waiting politely
b = cover(Image.open(HI + 'chilli_L2.png').convert('RGB'), cx=.6).convert('RGBA'); label(b, 'Eggs & Chilli Oil', 820); counter(b, 4); save(b, 6)
# 7 pancakes, sugar falling
b = cover(Image.open(HI + 'pancake_L3.png').convert('RGB')).convert('RGBA'); d = ImageDraw.Draw(b)
rng = np.random.default_rng(3)
for _ in range(160):
    x, y, r = rng.uniform(0, W), rng.uniform(0, H * .7), rng.uniform(1, 3.2); d.ellipse([x, y, x + r, y + r], fill=(255, 255, 255, 200))
label(b, 'Pancakes', 820); counter(b, 5); save(b, 7)
# 8 finally: the fork wins (half eaten)
b = mat(); put(b, Image.open(HI + 'pancake_eaten1_full.png').resize((640, 640), Image.LANCZOS), W / 2, 450)
save(b, 8)
# 9 finished plate, room dims
b = mat(dim=.55); im = Image.open(HI + 'pancake_eaten2_full.png').resize((640, 640), Image.LANCZOS); r, g, bb, a = im.split(); im = Image.merge('RGBA', [*ImageEnhance.Brightness(Image.merge('RGB', (r, g, bb))).enhance(.7).split(), a]); put(b, im, W / 2, 450); save(b, 9)
# 10 black: the plate rim becomes the O, utensils dropping onto the rail
b = Image.new('RGBA', (W, H), (8, 6, 5, 255)); m = Image.open(HI + 'mark_white.png'); mw = 430; m = m.resize((mw, round(m.height * mw / m.width)), Image.LANCZOS)
top = m.crop((0, 0, m.width, round(m.height * .5))); bot = m.crop((0, round(m.height * .5), m.width, m.height))
b.alpha_composite(bot, ((W - mw) // 2, 330 + round(m.height * .5)))
d = ImageDraw.Draw(b); ox, oy = (W - mw) / 2 + 266 / 440 * mw, 330 + 254 / 380 * m.height; d.ellipse([ox - 120, oy - 120, ox + 120, oy + 120], outline=(255, 255, 255, 110), width=4)
b.alpha_composite(top.rotate(0), ((W - mw) // 2, 200)); save(b, 10)
# 11 settled mark + line
b = Image.new('RGBA', (W, H), (8, 6, 5, 255)); b.alpha_composite(m, ((W - mw) // 2, 300)); caption(b, 'New on the breakfast menu', 720, 30); save(b, 11)
# 12 which one first? five plates in a row + handle
b = Image.new('RGBA', (W, H), (8, 6, 5, 255)); caption(b, 'Which one first?', 300, 50)
for i, n in enumerate(['benedict', 'shakshuka', 'turkish', 'chilli', 'pancake']):
    put(b, plate(n, 100), 58 + i * 106, 470, shadow=False)
caption(b, 'Tell us below', 580, 28); caption(b, '@bisoutt', 780, 30); save(b, 12)
print('frames ok')
