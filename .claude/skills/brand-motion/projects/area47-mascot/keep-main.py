import numpy as np, sys
from PIL import Image
for n in sys.argv[1:]:
    im=Image.open(n+'.png'); a=np.array(im); op=a[:,:,3]>40; h,w=op.shape
    ys,xs=np.nonzero(op); d=(xs-w/2)**2+(ys-h*0.8)**2; i=int(np.argmin(d))
    reg=np.zeros_like(op); reg[ys[i],xs[i]]=True
    while True:  # region-grow inside the opaque mask (4-neighbour dilation until stable)
        g=reg.copy(); g[1:]|=reg[:-1]; g[:-1]|=reg[1:]; g[:,1:]|=reg[:,:-1]; g[:,:-1]|=reg[:,1:]; g&=op
        if g.sum()==reg.sum(): break
        reg=g
    keep=reg.copy()
    for _ in range(3):  # keep the soft edge pixels around the kept region
        k=keep.copy(); k[1:]|=keep[:-1]; k[:-1]|=keep[1:]; k[:,1:]|=keep[:,:-1]; k[:,:-1]|=keep[:,1:]; keep=k
    a[:,:,3]=np.where(keep,a[:,:,3],0)
    out=Image.fromarray(a); bb=out.getbbox(); assert bb and reg.sum()>0.5*op.sum(), n
    out=out.crop(bb); out.save(n+'.png'); print(n, im.size,'->',out.size,'kept',round(reg.sum()/op.sum(),3))
