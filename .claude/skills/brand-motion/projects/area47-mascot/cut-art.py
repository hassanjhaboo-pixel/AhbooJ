import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
U='/root/.claude/uploads/63060df7-1021-5704-81f7-a131caf83c4b/'
OUT='/home/user/AhbooJ/.claude/skills/brand-motion/brand/assets/area47/sev/'
def key(path):
    im=Image.open(U+path).convert('RGB'); w,h=im.size
    k=im.copy()
    seeds=[(x,0) for x in range(0,w,8)]+[(x,h-1) for x in range(0,w,8)]+[(0,y) for y in range(0,h,8)]+[(w-1,y) for y in range(0,h,8)]
    for s in seeds:
        if k.getpixel(s)!=(255,0,255) and sum(k.getpixel(s))>690: ImageDraw.floodfill(k,s,(255,0,255),thresh=42)
    a=np.array(k); bg=(a[:,:,0]==255)&(a[:,:,1]==0)&(a[:,:,2]==255)
    alpha=Image.fromarray(np.where(bg,0,255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba=im.convert('RGBA'); rgba.putalpha(alpha); return rgba, ~bg
def spans(prof, minrun, gap):
    on=prof>0; out=[]; i=0; n=len(on)
    while i<n:
        if on[i]:
            j=i
            while j<n and (on[j] or (j+gap<n and on[j:j+gap].any())): j+=1
            if j-i>=minrun: out.append((i,j))
            i=j
        else: i+=1
    return out
def grid(path, names, rows=None):
    rgba,m=key(path); H,W=m.shape
    rs=spans(m.sum(1)>3, 60, 6) if rows is None else rows
    k=0
    for (y0,y1) in rs:
        cs=spans(m[y0:y1].sum(0)>3, 60, 6)
        for (x0,x1) in cs:
            if k>=len(names): break
            if names[k]:
                c=rgba.crop((x0,y0,x1,y1)); bb=c.getbbox(); c=c.crop(bb); c.save(OUT+names[k]+'.png'); print(names[k], c.size)
            k+=1
    print(path,'cells',k)
#grid('a283ce38-image.png',['face-smirk','face-wink','face-side','face-hype','face-chill','face-laugh','face-flat','face-shocked','face-proud'])
#grid('d0f7f9ab-image.png',['turn-front','turn-34','turn-side','turn-back'])
r,_=key('82765b15-image.jpg'); c=r.crop(r.getbbox()); c.save(OUT+'hero.png'); print('hero',c.size)
# fixed 3x3 grid for the expression sheet (rows touch, so projection splitting merges them)
rgba,m=key('a283ce38-image.png'); W,H=rgba.size; cw,ch=W/3,H/3
names=['face-smirk','face-wink','face-side','face-hype','face-chill','face-laugh','face-flat','face-shocked','face-proud']
for i,n in enumerate(names):
    r,c=divmod(i,3); box=(int(c*cw),int(r*ch)+6,int((c+1)*cw),int((r+1)*ch)-2)
    cell=rgba.crop(box); a=np.array(cell)
    cell=cell.crop(cell.getbbox()); cell.save(OUT+n+'.png'); print(n,cell.size)
# pose sheet (4x2): take the prop-free poses, cropped at the waist so the sneakers (Nike swoosh) never appear
rgba,m=key('bec04fa7-image.png'); W,H=rgba.size; cw=W/4; rh=H/2
for (r,c,n,keep) in [(0,1,'pose-point',0.62),(0,3,'pose-keys',0.62),(1,0,'pose-47',0.62)]:
    cell=rgba.crop((int(c*cw),int(r*rh)+4,int((c+1)*cw),int((r+1)*rh)-4)); cell=cell.crop(cell.getbbox())
    cell=cell.crop((0,0,cell.width,int(cell.height*keep))); cell.save(OUT+n+'.png'); print(n,cell.size)
