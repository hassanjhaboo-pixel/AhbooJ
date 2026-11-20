import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
fs = sorted(glob.glob(os.path.join(d, '*.jpg')), key=lambda f: float(os.path.basename(f)[:-4])); w, h = 240, 427
s = Image.new('RGB', (cols * w, ((len(fs) + cols - 1) // cols) * h), 'gray')
for i, f in enumerate(fs):
    im = Image.open(f).resize((w, h)); ImageDraw.Draw(im).text((6, 6), os.path.basename(f)[:-4] + 's', fill='white'); s.paste(im, ((i % cols) * w, (i // cols) * h))
s.save(out, quality=85)
