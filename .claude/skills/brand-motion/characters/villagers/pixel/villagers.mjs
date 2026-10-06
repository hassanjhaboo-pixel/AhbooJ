// Pixel villagers (chibi, 3/4 view facing right; mirror to face left). Same outline + palette language as Cherry & Bomb.
//   villager(def, { eyes, mouth, arms, sweat, tear, frame, item })  -> { grid, w, h, ax, ay, pal }
//   defs: VILLAGERS.mabel | darnell | kiki | rosa | joe, or randomVillager(seed)
//   eyes: open | blink | happy | shock | nervous | grump | closed     mouth: smile | talk1 | talk2 | flat | wobble | o | grin
//   arms: down | up | hold | wave | fist                                 item: cane | papers | null
export const VPAL = { O: '#4a2236', P: '#2a1620', W: '#fff6f1', bl: '#ff9aa8', md: '#6e1828', tg: '#ff7c8e', sw: '#9fd4f3', tear: '#7fbfff', shoe: '#5a3a2a', glass: '#4a2236' };
class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
  set(x, y, v) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = v; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : null; }
  outline(col = VPAL.O) { const add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y) == null && (this.get(x - 1, y) != null || this.get(x + 1, y) != null || this.get(x, y - 1) != null || this.get(x, y + 1) != null)) add.push([x, y]); add.forEach(([x, y]) => this.set(x, y, col)); return this; }
  over(L) { for (let i = 0; i < L.c.length; i++) if (L.c[i] != null) this.c[i] = L.c[i]; return this; }
}
const lay = G => new Grid(G.w, G.h);
function ell(L, cx, cy, rx, ry, col) { for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) L.set(x, y, typeof col === 'function' ? col(dx, dy, x, y) : col); } }
function rect(L, x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L.set(x + i, y + j, col); }
function line(L, x0, y0, x1, y1, r, col) { const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1; for (let y = Math.floor(Math.min(y0, y1) - r - 1); y <= Math.ceil(Math.max(y0, y1) + r + 1); y++) for (let x = Math.floor(Math.min(x0, x1) - r - 1); x <= Math.ceil(Math.max(x0, x1) + r + 1); x++) { const px = x + 0.5, py = y + 0.5, t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / l2)), dx = px - (x0 + t * vx), dy = py - (y0 + t * vy); if (dx * dx + dy * dy <= r * r) L.set(x, y, col); } }
const shade = (hex, k) => { const n = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return '#' + n.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).map(v => v.toString(16).padStart(2, '0')).join(''); };

export const VILLAGERS = {
  mabel: { skin: '#efc3a0', hair: '#cfcad8', style: 'bun', top: '#b9a3e3', bottom: '#8f78c4', glasses: true, h: 44, w: 16, brow: 'soft', item: 'cane', blush: true },
  darnell: { skin: '#7a4a30', hair: '#2a1a14', style: 'short', band: '#e5484d', top: '#4a6fa5', bottom: '#3a3a52', h: 50, w: 22, brow: 'thick', arms: 'thick' },
  kiki: { skin: '#b07a52', hair: '#3a2418', style: 'pigtails', bow: '#ffd166', top: '#ff9a3c', bottom: '#ff9a3c', h: 34, w: 13, brow: 'soft', blush: true, small: true },
  rosa: { skin: '#c68b5e', hair: '#3b2420', style: 'long', top: '#3c9b6e', bottom: '#2f6f8f', glasses: false, h: 46, w: 15, brow: 'soft', item: 'papers', earring: '#ffd166' },
  joe: { skin: '#e8b48a', hair: '#f2efe8', style: 'hat', hat: '#e8c36a', top: '#c94a4a', bottom: '#5a7fb5', beard: '#f2efe8', overalls: true, h: 46, w: 17, brow: 'grump' },
};
export function randomVillager(seed) {
  let s = seed * 9301 + 49297; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const skins = ['#f1c7a1', '#e0ac82', '#c68b5e', '#a8714d', '#8d5a3b', '#6e4228'], hairs = ['#2a1a14', '#3b2420', '#6b3e1f', '#c98a3e', '#e8d27a', '#cfcad8', '#a83a3a'];
  const tops = ['#ff9aa8', '#7fd2a2', '#ffd166', '#a687d9', '#7fa8e0', '#ffab55', '#e5484d', '#f6e8cf'], styles = ['short', 'long', 'bun', 'pigtails', 'short', 'cap'];
  const kid = r() < 0.18, top = tops[Math.floor(r() * tops.length)];
  return { skin: skins[Math.floor(r() * skins.length)], hair: hairs[Math.floor(r() * hairs.length)], style: styles[Math.floor(r() * styles.length)], top, bottom: r() < 0.5 ? shade(top, 0.7) : '#4a4a66',
    h: kid ? 34 : 42 + Math.floor(r() * 8), w: kid ? 13 : 14 + Math.floor(r() * 5), brow: 'soft', small: kid, cap: tops[Math.floor(r() * tops.length)], glasses: r() < 0.2, blush: r() < 0.5, bow: '#ffd166' };
}

export function villager(d, o = {}) {
  const W = 44, H = 66, G = new Grid(W, H), ground = 63, bob = (o.frame || 0) % 2;
  const cx = 22, legH = d.small ? 5 : 7, bodyH = d.h - legH - 18, hipY = ground - legH, shY = hipY - bodyH - bob, R = d.small ? 9 : 10, hy = shY - R + 2;
  const fx = cx + 3, fy = hy + 1, skinD = shade(d.skin, 0.85);
  // legs + shoes
  const Lg = lay(G); [-1, 1].forEach(sd => { rect(Lg, cx + sd * 3 - 1, hipY - 1, 3, legH, d.overalls ? d.bottom : shade(d.bottom, 0.85)); ell(Lg, cx + sd * 3 + 1.5, ground - 1, 2.6, 1.6, VPAL.shoe); }); Lg.outline(); G.over(Lg);
  // back hair (behind the body)
  const BH = lay(G);
  if (d.style === 'long') { ell(BH, cx - 4, hy + 6, 8, 11, d.hair); }
  if (d.style === 'pigtails') { ell(BH, cx - 10, hy + 2, 3.5, 4.5, d.hair); ell(BH, cx + 10, hy + 2, 3.5, 4.5, d.hair); }
  if (d.style === 'bun') ell(BH, cx - 6, hy - 9, 4.5, 4, d.hair);
  BH.outline(); G.over(BH);
  if (d.style === 'pigtails') { [cx - 10, cx + 10].forEach(x => { G.set(x - 1, hy - 3, d.bow); G.set(x, hy - 3, d.bow); G.set(x + 1, hy - 3, d.bow); G.set(x, hy - 2, shade(d.bow, 0.8)); }); }
  // arms behind (far arm)
  const armCol = d.top, hand = d.skin, aw = d.arms === 'thick' ? 2.1 : 1.4;
  const armPose = { down: [-12, 12], up: [-150, 150], hold: [70, 40], wave: [-12, 150], fist: [60, 50] }[o.arms || 'down']; // [near, far]
  const arm = (sx, sy, ang, front) => { const A = lay(G), r = ang * Math.PI / 180, ex = sx + Math.sin(r) * 7, ey = sy + Math.cos(r) * 7; line(A, sx, sy, ex, ey, aw, front ? armCol : shade(armCol, 0.85)); ell(A, ex, ey, 1.9, 1.9, front ? hand : skinD); A.outline(); G.over(A); return [ex, ey]; };
  arm(cx + d.w / 2 - 1, shY + 2, armPose[1], false);
  // body
  const Bd = lay(G); for (let y = shY; y <= hipY; y++) { const k = (y - shY) / Math.max(1, hipY - shY), half = d.w / 2 * (0.82 + 0.18 * k); for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) Bd.set(x, y, x > cx + half - 3 ? shade(d.top, 0.86) : d.top); }
  if (d.overalls) { rect(Bd, cx - 5, shY + 4, 11, hipY - shY - 3, d.bottom); rect(Bd, cx - 5, shY, 2, 4, d.bottom); rect(Bd, cx + 4, shY, 2, 4, d.bottom); Bd.set(cx - 4, shY + 5, '#ffd166'); Bd.set(cx + 4, shY + 5, '#ffd166'); }
  else if (!d.small) rect(Bd, Math.round(cx - d.w / 2 * 0.95), hipY - 3, Math.round(d.w * 0.95) + 1, 3, d.bottom);
  Bd.outline(); G.over(Bd);
  rect(G, cx - 2, shY, 5, 1, shade(d.top, 1.15)); // collar highlight
  // head
  const Hd = lay(G); ell(Hd, cx, hy, R, R * 0.95, (dx, dy) => (dx > 0.62 ? skinD : d.skin)); Hd.set(cx + R, hy + 1, d.skin); Hd.outline(); G.over(Hd);
  // hair cap / hats
  const Hr = lay(G);
  if (d.style === 'hat') { for (let y = hy - R - 4; y <= hy - R + 3; y++) for (let x = cx - 7; x <= cx + 7; x++) Hr.set(x, y, d.hat); ell(Hr, cx, hy - R + 3, R + 5, 2.2, d.hat); rect(Hr, cx - 7, hy - R + 1, 15, 1, '#c94a4a');
    rect(Hr, cx - R, hy - 3, 2, 5, d.hair); }
  else if (d.style === 'cap') { ell(Hr, cx, hy - R * 0.45, R * 0.98, R * 0.62, d.cap); rect(Hr, cx + 3, hy - R * 0.25, 9, 2, shade(d.cap, 0.8)); rect(Hr, cx - R, hy - 2, 2, 3, d.hair); }
  else { for (let y = Math.floor(hy - R - 1); y <= hy + 2; y++) for (let x = Math.floor(cx - R - 1); x <= Math.ceil(cx + R + 1); x++) { const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - hy) / (R * 0.95);
      if (dx * dx + dy * dy <= 1.04 && (dy < -0.25 + (dx < -0.2 ? 0.75 : 0) - (d.style === 'short' && dx > 0.3 ? 0.15 : 0))) Hr.set(x, y, dx + dy < -0.9 ? shade(d.hair, 1.15) : d.hair); }
    if (d.style === 'long') rect(Hr, cx - R, hy - 1, 3, 9, d.hair); }
  if (d.band) rect(Hr, cx - R + 1, hy - R * 0.45, R * 2 - 1, 2, d.band);
  Hr.outline(); G.over(Hr);
  // face
  const eyes = o.eyes || (d.brow === 'grump' ? 'grump' : 'open'), ex = [fx - 4, fx + 3];
  for (const [i, x] of ex.entries()) {
    if (eyes === 'blink' || eyes === 'closed') { rect(G, x - 1, fy + 1, 3, 1, VPAL.O); continue; }
    if (eyes === 'happy') { G.set(x - 1, fy + 1, VPAL.O); G.set(x, fy, VPAL.O); G.set(x + 1, fy + 1, VPAL.O); continue; }
    if (eyes === 'shock') { const E = lay(G); ell(E, x + 0.5, fy + 0.5, 2, 2.6, VPAL.W); E.outline(); G.over(E); G.set(x, fy, VPAL.P); G.set(x, fy + 1, VPAL.P); continue; }
    if (eyes === 'nervous') { G.set(x, fy, VPAL.P); G.set(x, fy + 1, VPAL.P); continue; }
    rect(G, x - (i ? 0 : 1), fy - 1, i ? 2 : 2, 3, VPAL.P); G.set(x - (i ? 0 : 1), fy - 1, VPAL.W);
  }
  // brows
  const bType = eyes === 'shock' || eyes === 'nervous' ? 'up' : eyes === 'grump' ? 'grump' : d.brow;
  ex.forEach((x, i) => { if (bType === 'grump') { G.set(x - 1, fy - 3 + (i ? 1 : 0), VPAL.O); G.set(x, fy - 3, VPAL.O); G.set(x + 1, fy - 3 + (i ? 0 : 1), VPAL.O); }
    else if (bType === 'up') { G.set(x - 1, fy - 4, VPAL.O); G.set(x, fy - 5, VPAL.O); G.set(x + 1, fy - 4, VPAL.O); }
    else if (bType === 'thick') { rect(G, x - 1, fy - 3, 3, 1, VPAL.O); }
    else if (!d.glasses) { G.set(x, fy - 3, shade(d.hair, 0.7)); G.set(x + 1, fy - 3, shade(d.hair, 0.7)); } });
  if (d.glasses) { ex.forEach((x, i) => { const gx = x - (i ? 0 : 1) - 1, gy = fy - 2; for (let k = 0; k < 4; k++) { G.set(gx + k, gy, VPAL.glass); G.set(gx + k, gy + 4, VPAL.glass); } for (let k = 0; k < 5; k++) { G.set(gx - 1, gy + k, VPAL.glass); G.set(gx + 4, gy + k, VPAL.glass); } }); }
  if (d.blush && eyes !== 'shock') { G.set(fx - 7, fy + 3, VPAL.bl); G.set(fx - 6, fy + 3, VPAL.bl); G.set(fx + 6, fy + 3, VPAL.bl); }
  if (d.earring) G.set(cx - 6, hy + 4, d.earring);
  // beard
  if (d.beard) { const Bb = lay(G); ell(Bb, fx - 1, fy + 6, 6, 3.5, d.beard); Bb.outline(); G.over(Bb); }
  // mouth
  const m = o.mouth || 'smile', mx = fx, my = fy + 5;
  const M = lay(G), ink = pts => pts.forEach(([a, b]) => G.set(mx + a, my + b, VPAL.O)), fill = (pts, c) => pts.forEach(([a, b]) => M.set(mx + a, my + b, c));
  if (m === 'smile') ink([[-1, 0], [0, 1], [1, 1], [2, 0]]);
  else if (m === 'flat') ink([[-1, 1], [0, 1], [1, 1], [2, 1]]);
  else if (m === 'wobble') ink([[-2, 1], [-1, 0], [0, 1], [1, 0], [2, 1], [3, 0]]);
  else if (m === 'o') { fill([[0, 0], [1, 0], [0, 1], [1, 1]], VPAL.md); M.outline(); G.over(M); }
  else if (m === 'talk1') { fill([[0, 0], [1, 0], [0, 1]], VPAL.md); M.outline(); G.over(M); }
  else if (m === 'talk2') { fill([[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]], VPAL.md); M.set(mx, my + 2, VPAL.tg); M.outline(); G.over(M); }
  else if (m === 'grin') { fill([[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1]], VPAL.W); M.outline(); G.over(M); }
  // near arm (in front) + held item
  const [hx, hyy] = arm(cx - d.w / 2 + 1, shY + 2, armPose[0], true);
  if (o.item === 'papers' || (o.item == null && d.item === 'papers' && (o.arms || 'down') === 'down')) { const Pp = lay(G); rect(Pp, Math.round(hx) - 1, Math.round(hyy) - 6, 7, 8, '#ffffff'); rect(Pp, Math.round(hx), Math.round(hyy) - 4, 5, 1, '#9aa3ad'); rect(Pp, Math.round(hx), Math.round(hyy) - 2, 5, 1, '#9aa3ad'); Pp.outline(); G.over(Pp); }
  if (o.item === 'cane' || (o.item == null && d.item === 'cane')) { const Cn = lay(G); line(Cn, hx - 1, hyy, hx - 3, ground, 0.8, '#8a5a34'); Cn.outline(); G.over(Cn); }
  // sweat + tears
  if (o.sweat) { const sx = cx + R - 1, sy = hy - 4; G.set(sx, sy, VPAL.sw); G.set(sx, sy + 1, VPAL.sw); G.set(sx - 1, sy + 1, VPAL.sw); G.set(sx + 1, sy + 1, VPAL.sw); G.set(sx, sy + 2, VPAL.sw); G.set(sx + 2, sy - 2, VPAL.sw); }
  if (o.tear) { G.set(ex[0] - 1, fy + 2, VPAL.tear); G.set(ex[0] - 1, fy + 3, VPAL.tear); }
  return { grid: G, w: W, h: H, ax: cx, ay: ground + 1, headY: hy - R };
}
export function vToCanvas(spr, doc = globalThis.document) {
  const cv = doc.createElement('canvas'); cv.width = spr.w; cv.height = spr.h; const x = cv.getContext('2d'), img = x.createImageData(spr.w, spr.h);
  spr.grid.c.forEach((v, i) => { if (v) img.data.set([parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 255], i * 4); });
  x.putImageData(img, 0, 0); return cv;
}
