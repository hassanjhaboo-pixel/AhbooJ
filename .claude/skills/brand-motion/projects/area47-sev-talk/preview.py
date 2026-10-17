import json, os, sys
from PIL import Image
R = json.load(open('assets/rig/rig.json')); B = R['boxes']; P = R['pivots']
def L(n): return Image.open(f'assets/rig/{n}.png')
def pose(mouth='orig', aL=0, aR=0, hr=0, lids=False, bg=(20, 24, 30)):
    can = Image.new('RGBA', tuple(R['size']), bg + (255,))
    def put(img, box, piv, ang):
        layer = Image.new('RGBA', can.size, (0, 0, 0, 0)); layer.alpha_composite(img, (box['x'], box['y']))
        if ang: layer = layer.rotate(ang, resample=Image.BICUBIC, center=piv)
        can.alpha_composite(layer)
    put(L('body'), B['body'], None, 0)
    put(L('armL'), B['armL'], P['armL'], aL); put(L('armR'), B['armR'], P['armR'], aR)
    h = L('head-' + mouth)
    if lids: h = h.copy(); h.alpha_composite(L('lids'))
    put(h, B['head'], P['head'], hr)
    return can
row = [pose(), pose(aL=-10, aR=10, hr=6), pose(aL=8, aR=-8, hr=-6, lids=True)]
S = Image.new('RGB', (1024 * 3 // 2, 1100 // 2))
for i, im in enumerate(row): S.paste(im.crop((0, 0, 1024, 1100)).resize((512, 550)), (i * 512, 0))
S.save('out/rig-poses.png')
faces = [pose(m).crop((360, 180, 664, 440)) for m in R['mouths']] + [pose(lids=True).crop((360, 180, 664, 440))]
F = Image.new('RGB', (304 * 6, 260 * 2))
for i, f in enumerate(faces): F.paste(f, ((i % 6) * 304, (i // 6) * 260))
F.save('out/rig-faces.png')
