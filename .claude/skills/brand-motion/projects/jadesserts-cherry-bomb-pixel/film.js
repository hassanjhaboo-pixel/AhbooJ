// "Meet Cherry & Bomb" v2 — HD-2D pixel film. Runs in the page; build.mjs inlines (before this file):
//   sprites (duo, solo, shadow, toCanvas, PAL), font (drawText, textWidth, wrap, LINE_H), and globals TL, FMT, WORDMARK.
// Pixel art is authored at art resolution and drawn with nearest-neighbour at S=5; positions are fractional, so the
// camera and anything moving glide smoothly while every sprite stays crisp.
(function () {
'use strict';
const TALL = FMT === '9x16', W = 1080, H = TALL ? 1920 : 1080, S = TALL ? 7 : 5, AW = W / S, AH = H / S, U = TALL ? 6 : 5, UW = W / U, UH = H / U;
const Y = TALL ? { horizon: 96, far: 104, road: 118, ground: 152, roadB: 166, near: 178 }
               : { horizon: 66, far: 74, road: 88, ground: 120, roadB: 132, near: 142 };
const HY = TALL ? { hud: 34, box: 214, boxH: 58 } : { hud: 6, box: 152, boxH: 58 }; // HUD layout, in UI px
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const main = cv.getContext('2d');
const EV = TL.ev, AT = TL.at;

// ---------------------------------------------------------------- utils
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeIO = k => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const backOut = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const win = (t, a, b) => clamp((t - a) / (b - a));
function rng(seed) { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c, g }; }
const P = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function disc(g, cx, cy, r, col) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) P(g, x, y, 1, 1, typeof col === 'function' ? col(dx / r, dy / r) : col); } }
function mixHex(a, b, k) { const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',') + ')'; }
// outline everything opaque on a canvas (1px, 4-neighbour)
function outlineCanvas(c, col) {
  const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height, add = [];
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) add.push([x, y]);
  g.fillStyle = col; add.forEach(([x, y]) => g.fillRect(x, y, 1, 1)); return c;
}
const cache = new Map();
function cached(key, fn) { let v = cache.get(key); if (!v) { v = fn(); cache.set(key, v); } return v; }

// ---------------------------------------------------------------- camera + drawing into the current target
let ctx = main, cam = { x: 0, y: AH / 2, z: 1, sx: 0, sy: 0 };
const toSX = (lx, f = 1) => W / 2 + (lx - f * cam.x) * S * cam.z + cam.sx;
const toSY = wy => H / 2 + (wy - cam.y) * S * cam.z + cam.sy;
// draw an art-res canvas with its top-left at layer coords (lx, wy) on parallax layer f
function blit(img, lx, wy, f = 1, o = {}) {
  const k = S * cam.z * (o.scale || 1), w = img.width * k * (o.sx == null ? 1 : Math.abs(o.sx)), h = img.height * k * (o.sy || 1);
  let x = toSX(lx, f), y = toSY(wy);
  if (o.anchor) { x -= o.anchor[0] * w; y -= o.anchor[1] * h; }
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.sx != null && o.sx < 0) { ctx.save(); ctx.translate(Math.round(x + w), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, Math.round(w), Math.round(h)); ctx.restore(); }
  else ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.globalAlpha = 1;
}
function tiled(img, wy, f, period = img.width) {
  const left = f * cam.x - (W / 2 + cam.sx) / (S * cam.z), right = f * cam.x + (W / 2 + Math.abs(cam.sx)) / (S * cam.z);
  for (let k = Math.floor(left / period) - 1; k * period < right + period; k++) blit(img, k * period, wy, f);
}
// screen-space art drawing (HUD): art px -> screen px, unaffected by camera
function hud(img, ax, ay, o = {}) {
  const px = o.px || U, k = px * (o.scale || 1), w = img.width * k * (o.kx || 1), h = img.height * k * (o.ky || 1);
  let x = ax * px, y = ay * px; if (o.anchor) { x -= o.anchor[0] * w; y -= o.anchor[1] * h; }
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); ctx.globalAlpha = 1;
}
function hudText(s, ax, ay, col, o = {}) { // crisp text at art px positions
  ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  drawText(ctx, s, Math.round(ax * U), Math.round(ay * U), col, { scale: U * (o.k || 1), shadow: o.shadow, upto: o.upto }); ctx.restore();
}

// ---------------------------------------------------------------- time of day
const SKY = {
  day: ['#9fd4f3', '#d3ecf8', '#ffe5ea'], night: ['#1d1c44', '#2f2c63', '#5a4a86'], gold: ['#c9a2e0', '#ffbe8a', '#ffe2a6'],
};
function tod(t) {
  let n = 0, g = 0;
  const [l0, l1] = EV.lapse; if (t > l0 && t < l1) { const u = (t - l0) / (l1 - l0); n = (1 - Math.cos(u * Math.PI * 4)) / 2; n = ss(n * 1.15 - 0.075); }
  g = ss((t - EV.stop) / 3.5);
  return { n, g, u: t > l0 && t < l1 ? (t - l0) / (l1 - l0) : t >= l1 ? 1 : 0 };
}
const skyCol = (i, d) => { const base = d.g > 0 ? mixHex(SKY.day[i], SKY.gold[i], d.g) : SKY.day[i]; return d.n > 0 ? mixHex(base[0] === '#' ? base : SKY.day[i], SKY.night[i], d.n) : base; };

// ---------------------------------------------------------------- world art (generated once)
const C = {
  grass: '#8fd19e', grassD: '#76bf8a', grassL: '#aee3bb', grassDD: '#5ea677',
  road: '#efdab4', roadD: '#e0c69a', peb: '#c9a77a', pebL: '#fbeed3', roadE: '#cfae80',
  hillF: '#cdb8ec', hillFL: '#ddd0f4', hillN: '#9fd6ad', hillNL: '#bde7c8', hillND: '#84c497',
  leaf: '#7fc794', leafL: '#a3dcb2', leafD: '#5ba574', trunk: '#9a6a43', treeO: '#3f6a52',
  wood: '#c48a55', woodD: '#9c6a3c', woodL: '#dba56f', woodO: '#5e3b22',
  ink: '#4a2236', cream: '#fff4dc', pink: '#f4636f', pinkD: '#dd4652', blush: '#ffc7cf',
  win: '#bfe3f2', winN: '#ffd98a', fence: '#f6e8cf', fenceD: '#d9c19c', fenceO: '#8a6a4a',
};
const flowerCols = ['#ff9aa8', '#ffd166', '#fff6f1', '#c9b3ea', '#ffab55'];

function genHills(w, h, base, light, dark, seedA, amp, freqs) {
  const { c, g } = mk(w, h), r = rng(seedA);
  const ridge = x => h - (amp + freqs.reduce((s, [k, a, p]) => s + a * Math.sin((x / w) * Math.PI * 2 * k + p), 0));
  for (let x = 0; x < w; x++) { const top = Math.round(ridge(x)); P(g, x, top, 1, h - top, base); P(g, x, top, 1, 2, light); if (dark && ((x + top) % 3 === 0)) P(g, x, top + 5 + ((x * 7) % 4), 1, 1, dark); }
  return { c, ridge };
}
function tree(g, x, base, s, r) { // round pixel tree
  const R = 7 * s, cx = x, cy = base - 10 * s - R + 2;
  P(g, cx - 1, base - 10 * s, 3, 10 * s, C.trunk);
  disc(g, cx, cy, R, (dx, dy) => (dx + dy < -0.55 ? C.leafL : dx + dy > 0.55 ? C.leafD : C.leaf));
  disc(g, cx + R * 0.7, cy + R * 0.35, R * 0.62, (dx, dy) => (dx + dy > 0.4 ? C.leafD : C.leaf));
}
let WORLD;
function genWorld() {
  const hf = genHills(512, 70, C.hillF, C.hillFL, null, 3, 26, [[2, 10, 1], [5, 6, 2.2], [9, 2, 0.4]]);
  const hn = genHills(512, 56, C.hillN, C.hillNL, C.hillND, 5, 18, [[3, 8, 0.3], [7, 4, 1.7], [11, 2, 2.9]]);
  // little trees on the near hills
  { const g = hn.c.getContext('2d'), r = rng(17); for (let i = 0; i < 9; i++) { const x = Math.floor(r() * 512), top = Math.round(hn.ridge(x)); P(g, x - 2, top - 5, 5, 4, C.leaf); P(g, x - 1, top - 6, 3, 1, C.leafL); P(g, x, top - 1, 1, 2, C.trunk); } }
  // tree line (tileable 640)
  const tl = mk(640, 54); { const r = rng(23); const feats = []; for (let i = 0; i < 26; i++) feats.push([Math.floor(r() * 640), 0.75 + r() * 0.55, r()]);
    for (const [x, s, k] of feats) for (const dx of [-640, 0, 640]) { if (k < 0.62) tree(tl.g, x + dx, 54, s, r); else { disc(tl.g, x + dx, 50, 7 * s, (a, b) => (a + b < -0.5 ? C.leafL : a + b > 0.5 ? C.leafD : C.leaf)); } }
    outlineCanvas(tl.c, C.treeO); }
  // far verge grass
  const fvH = Y.road - Y.far, fv = mk(256, fvH + 4); { const r = rng(31); P(fv.g, 0, 3, 256, fvH + 1, C.grass); P(fv.g, 0, 3, 256, 1, C.grassL);
    for (let i = 0; i < 140; i++) { const x = Math.floor(r() * 256), y = 4 + Math.floor(r() * (fvH - 3)); P(fv.g, x, y, 1, 1, r() < 0.5 ? C.grassD : C.grassL); if (r() < 0.15) P(fv.g, x, y - 1, 1, 1, flowerCols[Math.floor(r() * 5)]); }
    for (let x = 0; x < 256; x += 2) if ((x * 13) % 7 < 3) P(fv.g, x, 1 + ((x * 5) % 3), 1, 3, C.grassD); P(fv.g, 0, fvH + 2, 256, 2, C.grassDD); }
  // road (one row per art line; perspective is applied per row at draw time)
  const rH = Y.roadB - Y.road, rd = mk(256, rH); { const r = rng(41); P(rd.g, 0, 0, 256, rH, C.road);
    for (let x = 0; x < 256; x++) { const a = Math.round(rH * 0.42 + Math.sin(x * 0.08) * 0.6), b = Math.round(rH * 0.8 + Math.sin(x * 0.05 + 2) * 0.6); P(rd.g, x, a, 1, 2, C.roadD); P(rd.g, x, b, 1, 2, C.roadD); }
    for (let i = 0; i < 90; i++) { const x = Math.floor(r() * 256), y = 3 + Math.floor(r() * (rH - 6)); P(rd.g, x, y, 2, 1, C.peb); P(rd.g, x, y - 1, 1, 1, C.pebL); }
    for (let x = 0; x < 256; x++) { P(rd.g, x, 0, 1, 1, C.roadE); if ((x * 7) % 11 < 4) P(rd.g, x, 1, 1, 1 + ((x * 3) % 2), C.grassD); P(rd.g, x, rH - 1, 1, 1, C.roadE); if ((x * 5) % 9 < 3) P(rd.g, x, rH - 2, 1, 1, C.grass); } }
  // near verge + fence
  const nvH = Y.near - Y.roadB, nv = mk(256, nvH + 14); { const r = rng(53); P(nv.g, 0, 12, 256, nvH + 2, C.grass); P(nv.g, 0, 12, 256, 1, C.grassD);
    for (let i = 0; i < 60; i++) P(nv.g, Math.floor(r() * 256), 13 + Math.floor(r() * nvH), 1, 1, r() < 0.5 ? C.grassL : C.grassD);
    const F = mk(256, 14); for (let x = 4; x < 256; x += 16) { P(F.g, x, 1, 3, 12, C.fence); P(F.g, x + 2, 1, 1, 12, C.fenceD); P(F.g, x + 1, 0, 1, 1, C.fence); }
    P(F.g, 0, 4, 256, 2, C.fence); P(F.g, 0, 9, 256, 2, C.fence); P(F.g, 0, 5, 256, 1, C.fenceD); P(F.g, 0, 10, 256, 1, C.fenceD); outlineCanvas(F.c, C.fenceO);
    nv.g.drawImage(F.c, 0, 0); }
  // meadow (below the near verge)
  const mH = AH - Y.near, md = mk(256, mH + 2); { const r = rng(61); for (let y = 0; y < mH + 2; y++) P(md.g, 0, y, 256, 1, mixHex(C.grass, '#79c08d', clamp(y / 80)));
    for (let i = 0; i < 260; i++) { const x = Math.floor(r() * 256), y = Math.floor(r() * mH), k = r(); if (k < 0.16) { P(md.g, x, y, 2, 2, flowerCols[Math.floor(r() * 5)]); P(md.g, x, y + 2, 1, 2, C.grassDD); } else P(md.g, x, y, 1, 2, k < 0.6 ? C.grassD : C.grassL); } }
  // foreground plants (blurred, close to camera)
  const fg = [0, 1, 2].map(i => { const p = mk(40, 60), r = rng(70 + i); for (let k = 0; k < 9; k++) { const x = 6 + Math.floor(r() * 28), hh = 26 + Math.floor(r() * 30); for (let y = 0; y < hh; y++) P(p.g, x + Math.round(Math.sin(y * 0.12 + k) * (y / 14)), 60 - y, 2, 1, y > hh - 3 ? C.grassL : k % 2 ? C.grassDD : '#4f9a68'); }
    if (i !== 1) { disc(p.g, 20, 14, 6, (a, b) => (a * a + b * b < 0.2 ? '#ffd166' : flowerCols[i * 2 % 5])); } return p.c; });
  // clouds
  const clouds = [0, 1, 2].map(i => { const p = mk(48, 22), r = rng(90 + i); for (let k = 0; k < 6; k++) disc(p.g, 8 + k * 6 + r() * 3, 13 - Math.sin(k / 5 * Math.PI) * 6 + r() * 2, 5 + r() * 3, (a, b) => (b > 0.45 ? '#e8eef9' : '#ffffff')); outlineCanvas(p.c, '#c6d3ea'); return p.c; });
  WORLD = { hf: hf.c, hn: hn.c, tl: tl.c, fv: fv.c, rd: rd.c, nv: nv.c, md: md.c, fg, clouds };
}

// ---------------------------------------------------------------- stations (roadside props on the far verge, f = FV)
const FV = 0.86;
function board() { // the logo sign the duo starts on
  return cached('board', () => {
    const lw = 112, lh = Math.round(lw * WM.height / WM.width), bw = lw + 12, bh = lh + 12, ph = 26, { c, g } = mk(bw + 2, bh + ph + 2);
    P(g, 14, bh, 5, ph, C.wood); P(g, bw - 19, bh, 5, ph, C.wood); P(g, 17, bh, 2, ph, C.woodD); P(g, bw - 16, bh, 2, ph, C.woodD);
    P(g, 1, 1, bw, bh, C.wood); for (let y = 1; y < bh; y += 6) { P(g, 1, y, bw, 1, C.woodD); P(g, 1, y + 1, bw, 1, C.woodL); }
    for (let y = 4; y < bh; y += 6) for (let x = 6 + (y % 12 ? 0 : 20); x < bw; x += 40) P(g, x, y, 1, 1, C.woodO);
    P(g, 4, 4, bw - 6, bh - 6, C.cream);
    g.drawImage(WMpix(lw), 7, 7);
    outlineCanvas(c, C.woodO); return { c, w: bw + 2, h: bh + ph + 2, top: 1 };
  });
}
let WM; // the brand wordmark image
function WMpix(w) { // the wordmark, pixelated to w art px (alpha thresholded so edges stay hard)
  return cached('wm' + w, () => {
    const h = Math.round(w * WM.height / WM.width), big = mk(w * 4, h * 4); big.g.imageSmoothingEnabled = true; big.g.imageSmoothingQuality = 'high'; big.g.drawImage(WM, 0, 0, w * 4, h * 4);
    const { c, g } = mk(w, h); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(big.c, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) d.data[i + 3] = d.data[i + 3] > 110 ? 255 : 0; g.putImageData(d, 0, 0); return c;
  });
}
function house(v, night) {
  return cached('house' + v + (night > 0.5 ? 'n' : 'd'), () => {
    const walls = ['#ffe4e8', '#fdf0d5', '#e3d5f7', '#d9f0e2'][v % 4], roof = ['#f4636f', '#a687d9', '#ffab55', '#7fd2a2'][v % 4], roofD = ['#dd4652', '#8a6cc0', '#e08a35', '#5fb685'][v % 4];
    const w = 40 + (v % 3) * 6, h = 26, { c, g } = mk(w + 8, h + 22);
    P(g, 4, 22, w, h, walls); for (let y = 24; y < 22 + h; y += 4) P(g, 4, y, w, 1, mixHex(walls, '#c9a0a8', 0.18));
    for (let i = 0; i < 18; i++) P(g, 4 - 4 + i * 0, 0, 0, 0, roof);
    for (let y = 0; y < 18; y++) { const inset = Math.round((18 - y) * (w / 2 + 4) / 18 * 0.95); P(g, 4 + w / 2 - (w / 2 + 4 - inset), 4 + y, (w / 2 + 4 - inset) * 2, 1, y % 3 === 2 ? roofD : roof); }
    const wc = night > 0.5 ? C.winN : C.win; P(g, 10, 30, 9, 8, wc); P(g, w - 15, 30, 9, 8, wc); P(g, 14, 30, 1, 8, C.ink); P(g, w - 11, 30, 1, 8, C.ink); P(g, 10, 33, 9, 1, C.ink); P(g, w - 15, 33, 9, 1, C.ink);
    P(g, 4 + w / 2 - 4, 22 + h - 13, 8, 13, '#b07a4a'); P(g, 4 + w / 2 + 2, 22 + h - 7, 1, 1, '#ffd166');
    P(g, 8, 39, 13, 2, C.woodD); P(g, 9, 38, 2, 1, '#ff9aa8'); P(g, 14, 38, 2, 1, '#ffd166');
    outlineCanvas(c, C.ink); return c;
  });
}
function cottage(night) {
  return cached('cottage' + (night > 0.5 ? 'n' : 'd'), () => {
    const { c, g } = mk(80, 70), wl = '#fff0e6';
    P(g, 6, 30, 68, 38, wl); for (let y = 33; y < 68; y += 5) P(g, 6, y, 68, 1, '#f3dccf');
    for (let y = 0; y < 26; y++) { const half = Math.round(4 + y * 1.45); P(g, 40 - half, 4 + y, half * 2, 1, y % 3 === 2 ? C.pinkD : C.pink); }
    P(g, 54, 2, 8, 14, '#c98a8a'); P(g, 54, 2, 8, 2, '#a86a6a');
    const wc = night > 0.5 ? C.winN : C.win; P(g, 12, 38, 16, 13, wc); P(g, 52, 38, 16, 13, wc); P(g, 19, 38, 2, 13, C.ink); P(g, 59, 38, 2, 13, C.ink); P(g, 12, 44, 16, 1, C.ink); P(g, 52, 44, 16, 1, C.ink);
    P(g, 34, 46, 12, 22, '#b07a4a'); P(g, 35, 47, 10, 1, '#c99266'); P(g, 43, 57, 1, 2, '#ffd166');
    P(g, 31, 34, 18, 8, C.cream); drawText(g, 'BAKE', 32, 35, C.pinkD); P(g, 10, 52, 20, 3, C.woodD); P(g, 50, 52, 20, 3, C.woodD);
    for (let i = 0; i < 6; i++) { P(g, 11 + i * 3, 51, 2, 1, flowerCols[i % 5]); P(g, 51 + i * 3, 51, 2, 1, flowerCols[(i + 2) % 5]); }
    outlineCanvas(c, C.ink); return c;
  });
}
function bakery() {
  return cached('bakery', () => {
    const { c, g } = mk(96, 78);
    P(g, 10, 30, 76, 46, '#fde9d6'); for (let y = 34; y < 76; y += 6) P(g, 10, y, 76, 1, '#f0d3b9');
    for (let x = 10; x < 86; x += 6) P(g, x, 30, 1, 46, '#e8c7a6');
    for (let y = 0; y < 22; y++) { const half = Math.round(40 + y * 0.2); if (y % 2) P(g, 48 - half, 8 + y, half * 2, 1, y % 4 === 1 ? '#c9b3ea' : '#a687d9'); }
    // scaffolding
    for (const x of [4, 30, 60, 90]) P(g, x, 6, 2, 72, '#9aa3ad'); for (const y of [20, 44, 66]) P(g, 2, y, 92, 2, '#9aa3ad');
    for (let i = 0; i < 4; i++) P(g, 6 + i * 22, 22 + (i % 2) * 24, 22, 1, '#7d8792');
    P(g, 26, 50, 44, 18, '#fff4dc'); drawText(g, 'COMING', 30, 52, C.pinkD); drawText(g, 'SOON', 36, 60, C.pinkD);
    P(g, 16, 2, 64, 8, C.pink); drawText(g, 'BAKERY', 30, 2, '#ffffff');
    outlineCanvas(c, C.ink); return c;
  });
}
function crate() { return cached('crate', () => { const { c, g } = mk(16, 11); P(g, 0, 0, 16, 11, C.wood); P(g, 0, 3, 16, 1, C.woodD); P(g, 0, 7, 16, 1, C.woodD); P(g, 2, 0, 1, 11, C.woodL); P(g, 13, 0, 1, 11, C.woodL); outlineCanvas(c, C.woodO); return c; }); }
function sackImg() { return cached('sack', () => { const { c, g } = mk(12, 13); disc(g, 6, 8, 5.4, (a, b) => (b < -0.3 ? '#efdcb2' : a > 0.4 ? '#b89a6c' : '#d9bf8f')); P(g, 4, 1, 4, 3, '#d9bf8f'); P(g, 3, 3, 6, 1, '#9c825a'); drawText(g, 'F', 5, 6, '#9c825a'); outlineCanvas(c, '#6d5638'); return c; }); }
function lamp(night) { return cached('lamp' + (night > 0.5), () => { const { c, g } = mk(9, 34); P(g, 3, 6, 2, 28, '#5c5470'); P(g, 1, 2, 6, 5, night > 0.5 ? '#ffe39a' : '#f7f1e3'); P(g, 0, 1, 8, 1, '#5c5470'); outlineCanvas(c, C.ink); return c; }); }

// tiny people for the vignettes
function person(g, x, y, o) { // x,y = feet centre
  const sk = o.skin || '#c68b5e', sh = o.shirt || '#7fa8e0', hr = o.hair || '#3a2a24', pose = o.pose || 'stand';
  const hy = pose === 'slump' ? y - 11 : pose === 'sit' ? y - 11 : pose === 'cheer' ? y - 15 : y - 14;
  if (pose !== 'sit') { P(g, x - 2, y - 4, 2, 4, '#4a4466'); P(g, x + 1, y - 4, 2, 4, '#4a4466'); }
  P(g, x - 3, hy + 5, 7, pose === 'sit' ? 5 : 6, sh);
  if (pose === 'cheer') { P(g, x - 5, hy + 1, 2, 5, sk); P(g, x + 4, hy + 1, 2, 5, sk); } else { P(g, x - 4, hy + 6, 1, 4, sk); P(g, x + 4, hy + 6, 1, 4, sk); }
  const hx = pose === 'slump' ? x + 1 : x; P(g, hx - 2, hy, 5, 5, sk); P(g, hx - 2, hy, 5, 2, hr); P(g, hx - 3, hy + 1, 1, 2, hr);
  if (pose !== 'slump') { P(g, hx + 1, hy + 2, 1, 1, '#2a1620'); P(g, hx - 1, hy + 2, 1, 1, '#2a1620'); }
}
function boxIcon() { return cached('boxi', () => { const { c, g } = mk(10, 9); P(g, 0, 2, 10, 7, '#ffd3dc'); P(g, 0, 2, 10, 2, '#f2a7b7'); P(g, 4, 2, 2, 7, C.pinkD); P(g, 3, 0, 1, 2, C.pinkD); P(g, 6, 0, 1, 2, C.pinkD); outlineCanvas(c, C.ink); return c; }); }
// a vignette = a little diorama; state 0 before the box lands, 1 after
function vignette(kind, k, t) {
  const step = k < 0.5 ? 0 : 1 + (Math.floor(t * 4) % 2);
  return cached('vg' + kind + step, () => {
    const { c, g } = mk(54, 48);
    if (kind === 'office') { P(g, 2, 4, 50, 44, '#cfd6e4'); for (let y = 8; y < 44; y += 9) for (let x = 6; x < 50; x += 11) P(g, x, y, 7, 6, '#8fa3c4');
      P(g, 6, 26, 28, 20, '#fff2c4'); P(g, 6, 40, 28, 6, '#b07a4a'); person(g, 20, 44, { pose: step ? 'cheer' : 'slump', shirt: '#9aa7b8' }); P(g, 26, 37, 6, 3, '#e8eef9'); }
    if (kind === 'lunch') { P(g, 4, 34, 46, 4, '#b07a4a'); P(g, 8, 38, 2, 10, '#8a5a34'); P(g, 44, 38, 2, 10, '#8a5a34'); P(g, 4, 31, 46, 3, '#fff6f1');
      [12, 27, 42].forEach((x, i) => person(g, x, 31, { pose: step ? (i === 1 ? 'cheer' : 'stand') : 'sit', shirt: ['#ff9aa8', '#7fd2a2', '#ffd166'][i], skin: ['#8d5a3b', '#c68b5e', '#a8714d'][i], hair: '#2a1d18' }));
      [10, 22, 34].forEach(x => { P(g, x, 29, 5, 2, '#ffffff'); }); }
    if (kind === 'exam') { P(g, 2, 8, 6, 40, '#9aa3ad'); P(g, 46, 8, 6, 40, '#9aa3ad'); P(g, 2, 6, 50, 8, '#4a6fa5'); drawText(g, 'SCHOOL', 9, 7, '#ffffff');
      for (let x = 9; x < 46; x += 4) P(g, x, 20, 1, 28, '#7d8792'); P(g, 8, 20, 38, 1, '#7d8792'); person(g, 27, 47, { pose: step ? 'cheer' : 'slump', shirt: '#ffffff', hair: '#1d1410' }); }
    if (kind === 'sad') { P(g, 8, 38, 38, 3, '#b07a4a'); P(g, 10, 41, 2, 7, '#8a5a34'); P(g, 42, 41, 2, 7, '#8a5a34'); P(g, 8, 32, 38, 2, '#b07a4a');
      person(g, 27, 46, { pose: step ? 'stand' : 'slump', shirt: '#a687d9' });
      if (!step) { disc(g, 27, 6, 6, '#9aa3b8'); disc(g, 20, 8, 5, '#9aa3b8'); disc(g, 34, 8, 5, '#9aa3b8'); } else { disc(g, 40, 7, 5, '#ffd166'); } }
    if (kind === 'happy') { P(g, 4, 6, 46, 9, C.pink); drawText(g, 'YAY!', 15, 7, '#ffffff'); P(g, 6, 14, 1, 34, C.woodD); P(g, 47, 14, 1, 34, C.woodD);
      person(g, 18, 47 - (step === 2 ? 2 : 0), { pose: 'cheer', shirt: '#ffd166', skin: '#8d5a3b' }); person(g, 34, 47 - (step === 1 ? 2 : 0), { pose: step ? 'cheer' : 'stand', shirt: '#7fd2a2' }); }
    if (step) g.drawImage(boxIcon(), kind === 'lunch' ? 22 : kind === 'office' ? 8 : 34, kind === 'lunch' ? 22 : kind === 'office' ? 30 : 38);
    outlineCanvas(c, C.ink); return c;
  });
}

// ---------------------------------------------------------------- walking: integrate speed -> camera x + walk phase
const SP = TL.speed, STEP = 1 / 240, NS = Math.ceil(TL.duration / STEP) + 2, XS = new Float32Array(NS), PH = new Float32Array(NS);
function speedAt(t) { // smooth interpolation between keys
  if (t <= SP[0][0]) return SP[0][1];
  for (let i = 1; i < SP.length; i++) if (t < SP[i][0]) { const [t0, v0] = SP[i - 1], [t1, v1] = SP[i]; return lerp(v0, v1, ss((t - t0) / (t1 - t0))); }
  return SP[SP.length - 1][1];
}
const STRIDE = 13; // art px per full walk cycle (8 frames)
for (let i = 1; i < NS; i++) { const v = speedAt(i * STEP); XS[i] = XS[i - 1] + v * STEP; PH[i] = PH[i - 1] + (v / STRIDE) * 8 * STEP; }
const look = (arr, t) => { const f = clamp(t / STEP, 0, NS - 2), i = Math.floor(f); return lerp(arr[i], arr[i + 1], f - i); };
const camXAt = t => look(XS, t);

// ---------------------------------------------------------------- dialogue state + acting
const LINES = TL.lines;
function lineAt(t) { for (let i = LINES.length - 1; i >= 0; i--) { const l = LINES[i]; if (t >= l.at && t < l.at + l.dur) return l; } return null; }
function envAt(l, t) { const q = Math.floor((t - l.at) * 12) / 12, i = Math.floor(q * l.fps); return l.env[Math.max(0, Math.min(l.env.length - 1, i))] || 0; }
const POSE = {
  c_start: { c: { turn: 0.5 } }, b_ooh: { b: { eyes: 'shock' } }, c_dont: { c: { eyes: 'shock' }, b: { eyes: 'sly', mouth: 'smirk' } },
  c_flour: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat', turn: 1, look: 0 }, b: { eyes: 'blink' } }, b_hehe: { b: { eyes: 'happy', mouth: 'grin', blush: true, turn: 1, look: 0 }, c: { eyes: 'sly', brow: 'flat', mouth: 'flat' } },
  c_mmhm: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat', turn: 1, look: 0 }, b: { eyes: 'happy', blush: true } },
  c_love: { c: { eyes: 'happy', turn: 0.5 } }, b_nights: { b: { eyes: 'sly', turn: 0.5 } }, c_taste: { c: { eyes: 'happy', turn: 0.5 } },
  b_diff: { b: { turn: 1, look: 0 } }, c_nothing: { c: { turn: 1, look: 0 } }, b_what: { b: { eyes: 'shock', mouth: 'shock' }, c: { turn: 1, look: 0 } },
  c_corners: { c: { turn: 0.5 } }, b_corner: { b: { eyes: 'sly', mouth: 'smirk', turn: 0.5 } }, c_scissors: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat' }, b: { eyes: 'sly', mouth: 'smirk' } },
  b_fine: { b: { eyes: 'sly', mouth: 'grit' }, c: { eyes: 'sly', brow: 'flat', mouth: 'flat' } },
  b_lunch: { b: { eyes: 'happy' } }, b_sad: { b: { eyes: 'shut', brow: 'flat', mouth: 'flat' } }, c_happy: { c: { eyes: 'happy' } }, b_brighten: { b: { arms: 'up' } }, c_someone: { c: { turn: 1, look: 0, eyes: 'happy' } },
  c_free: { c: { eyes: 'happy', turn: 0.5 } }, b_chaos: { b: { eyes: 'sly', mouth: 'smirk', turn: 1, look: 0 } }, c_you: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat' } },
  b_me: { b: { arms: 'up', eyes: 'happy' }, c: { eyes: 'sly', brow: 'flat', mouth: 'flat' } }, c_uhhuh: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat', turn: 1, look: 0 } },
  b_dream: { b: { eyes: 'happy', arms: 'up' } }, c_more: { c: { turn: 0.5 } }, c_whatsapp: { c: { turn: 1, look: 0 } }, b_order: { b: { eyes: 'shock', arms: 'up', turn: 0.5 } },
  c_maybe: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat', turn: 1, look: 0 }, b: { eyes: 'happy', blush: true } },
  c_shy: { c: { turn: 1, look: 0, eyes: 'blink', blush: true } }, b_soon: { b: { turn: 1, look: 0, mouth: 'smile' }, c: { turn: 1, look: 0 } },
  c_start2: { c: { turn: 1, look: 0 }, b: { turn: 1, look: 0, mouth: 'smile' } }, b_journey: { b: { turn: 1, look: 0, mouth: 'smile' }, c: { turn: 1, look: 0, eyes: 'happy' } },
};
// emote bubbles: [time, who, kind]
const EMO = [
  [AT.c_dont.at + 0.1, 'b', '!'], [EV.boom + 1.2, 'c', '…'], [AT.c_mmhm.at, 'c', 'anger'], [AT.b_what.at + 0.05, 'b', '!'], [AT.c_nothing.end - 0.2, 'b', '?'],
  [AT.c_scissors.at, 'c', 'anger'], [AT.b_fine.at + 0.3, 'b', 'anger'], [EV.kind, 'c', '♥'], [AT.c_you.at, 'c', '…'], [AT.c_uhhuh.at, 'c', 'anger'],
  [AT.b_dream.at + 0.4, 'b', '♪'], [AT.c_maybe.at, 'c', 'anger'], [AT.c_shy.at + 0.4, 'c', '♥'], [AT.b_journey.end - 0.2, 'b', '♥'],
];
function actors(t) {
  // which line is active (the last one to start, held briefly so faces don't snap back mid-pause)
  let cur = null; for (const l of LINES) if (t >= l.at - 0.05 && t < l.at + l.dur + 0.5) cur = l;
  const pose = (cur && POSE[cur.id]) || {}, c = Object.assign({}, pose.c || {}), b = Object.assign({}, pose.b || {});
  const spk = lineAt(t);
  if (spk) { const e = envAt(spk, t), m = e > 0.5 ? 'talk2' : e > 0.14 ? 'talk1' : null; const who = spk.who === 'cherry' ? c : b; if (m) who.mouth = m; if (spk.who === 'cherry' && b.look == null && !b.turn) b.look = -1; }
  // blinks
  const bl = (ph, x) => (x.eyes == null || x.eyes === 'open') && ((t + ph) % 3.7) < 0.12;
  if (bl(0, c)) c.eyes = 'blink'; if (bl(1.6, b)) b.eyes = 'blink';
  return { c, b, cur };
}

// ---------------------------------------------------------------- effects
const flourP = (() => { const r = rng(777), a = []; for (let i = 0; i < 260; i++) { const ang = -Math.PI * (0.05 + r() * 0.9) + (r() < 0.2 ? Math.PI * 0.3 : 0), sp = 30 + r() * 120; a.push([Math.cos(ang) * sp * (r() < 0.5 ? -1 : 1), Math.sin(ang) * sp, 1 + (r() < 0.3 ? 1 : 0), 1.5 + r() * 2.5, r()]); } return a; })();
function flourFx(t, ox, oy) {
  const u = t - EV.boom; if (u < 0 || u > 5) return;
  // flash
  if (u < 0.16) { ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - u / 0.16)})`; ctx.fillRect(0, 0, W, H); }
  // soft cloud (full-res, smooth) — billows then thins
  for (let i = 0; i < 9; i++) { const a = i * 2.39, d = (8 + (i % 3) * 7) * easeOut(u * 2.2), x = toSX(ox + Math.cos(a) * d), y = toSY(oy - 10 + Math.sin(a) * d * 0.6 - u * 2), R = (16 + (i % 4) * 5) * easeOut(u * 1.8) * S * cam.z;
    const al = 0.62 * clamp(1 - (u - 0.6) / 3.6) * clamp(u * 8); if (al <= 0) continue;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(255,252,246,${al})`); gr.addColorStop(0.6, `rgba(250,245,236,${al * 0.7})`); gr.addColorStop(1, 'rgba(250,245,236,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); }
  // shock ring (pixel)
  if (u < 0.45) { const R = 6 + 70 * easeOut(u / 0.45), al = 1 - u / 0.45; ctx.fillStyle = `rgba(255,255,255,${al})`; for (let k = 0; k < 120; k++) { const a = k / 120 * Math.PI * 2, x = Math.round(ox + Math.cos(a) * R), y = Math.round(oy - 10 + Math.sin(a) * R * 0.55); const sx = toSX(x), sy = toSY(y); ctx.fillRect(Math.round(sx), Math.round(sy), Math.round(S * cam.z * 2), Math.round(S * cam.z)); } }
  // pixel particles (flour chunks) — burst, drag, then drift down and settle
  const k = 2.2;
  for (const [vx, vy, sz, life, seed] of flourP) { if (u > life) continue; const dr = (1 - Math.exp(-k * u)) / k, x = ox + vx * dr + Math.sin(u * 2 + seed * 9) * 2, y = oy - 10 + vy * dr + 9 * u * u * 0.5 + 6 * u;
    const al = clamp((life - u) / 0.8); ctx.fillStyle = seed < 0.5 ? `rgba(255,255,255,${al})` : `rgba(240,232,220,${al})`; const s = S * cam.z * sz; ctx.fillRect(Math.round(toSX(x)), Math.round(toSY(y)), Math.round(s), Math.round(s)); }
}
function shakeAt(t) { let a = 0; const u = t - EV.boom; if (u > 0 && u < 0.7) a += 9 * Math.exp(-u * 6); const w = t - EV.freeze[0]; if (w > 0 && w < 0.4) a += 6 * Math.exp(-w * 9); const j = t - EV.jump - 0.35; if (j > 0 && j < 0.3) a += 3 * Math.exp(-j * 12);
  return a ? [Math.round(Math.sin(t * 91) * a), Math.round(Math.cos(t * 77) * a * 0.6)] : [0, 0]; }
function emoteImg(kind) {
  return cached('emo' + kind, () => {
    const { c, g } = mk(15, 15); P(g, 1, 1, 13, 11, '#ffffff'); P(g, 0, 2, 15, 9, '#ffffff'); P(g, 2, 0, 11, 13, '#ffffff'); P(g, 5, 12, 4, 2, '#ffffff'); P(g, 5, 14, 2, 1, '#ffffff');
    const col = { '!': '#e5484d', '?': '#4a6fa5', '…': C.ink, '♥': C.pink, '♪': '#7a5cc0', anger: '#e5484d' }[kind];
    if (kind === 'anger') { [[4, 3], [5, 3], [3, 4], [3, 5], [9, 3], [10, 3], [11, 4], [11, 5], [3, 8], [3, 9], [4, 10], [5, 10], [11, 8], [11, 9], [10, 10], [9, 10]].forEach(([x, y]) => P(g, x, y, 1, 1, col)); }
    else if (kind === '…') { [3, 7, 11].forEach(x => P(g, x, 7, 2, 2, col)); }
    else drawText(g, kind, kind === '!' ? 7 : 5, 2, col);
    outlineCanvas(c, C.ink); return c;
  });
}
function emotes(t, pos) {
  for (const [at, who, kind] of EMO) { const u = t - at; if (u < 0 || u > 1.5) continue;
    const k = u < 0.2 ? backOut(u / 0.2) : u > 1.25 ? 1 - (u - 1.25) / 0.25 : 1, p = pos[who], img = emoteImg(kind);
    const bob = Math.round(Math.sin(u * 10) * 0.6);
    blit(img, p[0], p[1] - 4 + bob, 1, { anchor: [0.5, 1], scale: k, alpha: clamp(k) });
  }
}

// ---------------------------------------------------------------- HUD: hotbar, toasts, clock, notification, menu, dialogue box
const ITEMS = [['Chocolate Banana Bread', 'bread'], ['Vanilla Cupcake', 'cupcake'], ['Cherry Jam Tart', 'tart'], ['Cheese Paste Puff', 'puff'], ['Chicken Puff Pastry', 'pastry'], ['Fruit Punch Limeade', 'drink']];
function icon(k) {
  return cached('ico' + k, () => {
    const { c, g } = mk(16, 16);
    if (k === 'bread') { P(g, 1, 6, 14, 8, '#a8673c'); P(g, 2, 4, 12, 3, '#c07a46'); P(g, 3, 3, 10, 1, '#d18e57'); [[4, 7], [8, 9], [11, 7], [6, 11], [10, 12]].forEach(([x, y]) => P(g, x, y, 1, 1, '#4a2b1c')); P(g, 9, 2, 4, 2, '#ffe08a'); }
    if (k === 'cupcake') { P(g, 4, 9, 8, 6, '#f2c48d'); for (let x = 4; x < 12; x += 2) P(g, x, 9, 1, 6, '#d9a66a'); disc(g, 8, 7, 5, '#fff3f6'); disc(g, 8, 6, 3.5, '#ffe2ea'); disc(g, 8, 2.5, 1.8, '#e5484d'); P(g, 9, 0, 1, 1, '#4f8a58'); }
    if (k === 'tart') { disc(g, 8, 9, 7, '#e6b071'); disc(g, 8, 9, 5, '#c8303f'); P(g, 3, 8, 10, 1, '#f0c58a'); P(g, 7, 4, 1, 10, '#f0c58a'); P(g, 6, 7, 1, 1, '#ff8a92'); }
    if (k === 'puff') { disc(g, 8, 10, 6.5, (a, b) => (b < -0.3 ? '#f3c983' : '#e3a95a')); P(g, 3, 9, 10, 2, '#ffb347'); P(g, 4, 10, 8, 1, '#ff9b2e'); }
    if (k === 'pastry') { for (let y = 0; y < 12; y++) P(g, 2 + y * 0.5, 3 + y, 12 - y, 1, y % 3 === 0 ? '#f6d08f' : '#e2ab5c'); P(g, 4, 6, 6, 1, '#c78a3e'); }
    if (k === 'drink') { P(g, 4, 4, 9, 11, '#e9f6ff'); P(g, 5, 7, 7, 7, '#f0566a'); P(g, 5, 7, 7, 2, '#ff8a96'); P(g, 10, 1, 1, 6, '#4f8a58'); disc(g, 12, 5, 2.5, '#9fdc6a'); P(g, 12, 5, 1, 1, '#e9ffcf'); }
    outlineCanvas(c, C.ink); return c;
  });
}
const HB = { n: 6, slot: 18, gap: 2 };
function hotbarImg() { return cached('hb', () => { const w = HB.n * HB.slot + (HB.n - 1) * HB.gap + 8, h = HB.slot + 8, { c, g } = mk(w + 2, h + 2);
  P(g, 1, 1, w, h, C.wood); P(g, 1, 1, w, 2, C.woodL); P(g, 1, h - 1, w, 2, C.woodD);
  for (let i = 0; i < HB.n; i++) { const x = 5 + i * (HB.slot + HB.gap); P(g, x, 5, HB.slot, HB.slot, '#f3ddb3'); P(g, x, 5, HB.slot, 1, '#c99a62'); P(g, x, 5, 1, HB.slot, '#c99a62'); }
  outlineCanvas(c, C.woodO); return { c, w: w + 2, h: h + 2 }; }); }
function slotPos(i) { const hb = hotbarImg(), x0 = (UW - hb.w) / 2; return [x0 + 6 + i * (HB.slot + HB.gap) + HB.slot / 2, HY.hud + 6 + HB.slot / 2]; }
function panel(w, h, fill = C.cream) { return cached('pn' + w + 'x' + h + fill, () => { const { c, g } = mk(w + 2, h + 2); P(g, 1, 1, w, h, C.wood); P(g, 1, 1, w, 1, C.woodL); P(g, 1, h, w, 1, C.woodD); P(g, 4, 4, w - 6, h - 6, fill); P(g, 4, 4, w - 6, 1, mixHex(fill, '#c99a62', 0.3)); outlineCanvas(c, C.woodO); return c; }); }

function drawHUD(t, duoScreen) {
  const showHB = win(t, EV.items - 0.6, EV.items - 0.2) * (1 - win(t, EV.bakery - 1.6, EV.bakery - 1.0));
  if (showHB > 0) {
    const hb = hotbarImg(), slide = (1 - easeOut(showHB)) * -40;
    hud(hb.c, (UW - hb.w) / 2, HY.hud + slide);
    for (let i = 0; i < 6; i++) { const ta = EV.items + i * 0.42, land = ta + 0.5; const [sx, sy] = slotPos(i);
      if (t >= land) { const pop = t - land < 0.2 ? backOut((t - land) / 0.2) : 1; hud(icon(ITEMS[i][1]), sx, sy + slide, { anchor: [0.5, 0.5], scale: pop }); }
      else if (t >= ta) { const k = (t - ta) / 0.5, [dx, dy] = duoScreen, x = lerp(dx, sx, easeIO(k)), y = lerp(dy, sy, easeIO(k)) - Math.sin(k * Math.PI) * 26; hud(icon(ITEMS[i][1]), x, y, { anchor: [0.5, 0.5], scale: 0.7 + 0.5 * k }); }
      // toast
      const tu = t - land; if (tu > 0 && tu < 1.1) { const s = '+1 ' + ITEMS[i][0], tw = textWidth(s) + 10, al = clamp(tu / 0.12) * clamp((1.1 - tu) / 0.25);
        const ty = HY.hud + 30 + i % 2 * 0; ctx.globalAlpha = al; hud(panel(tw, 15, '#4a2236'), (UW - tw) / 2 - 1, ty); hudText(s, (UW - tw) / 2 + 4, ty + 4, '#fff4dc', { alpha: al }); ctx.globalAlpha = 1; }
      // sparkle on land
      if (tu > 0 && tu < 0.35) { const k2 = tu / 0.35; ctx.fillStyle = `rgba(255,236,150,${1 - k2})`; for (let a = 0; a < 4; a++) { const ang = a * Math.PI / 2 + 0.6, r = 4 + 9 * k2; ctx.fillRect(Math.round((sx + Math.cos(ang) * r) * U), Math.round((sy + slide + Math.sin(ang) * r) * U), U, U); } }
    }
  }
  // clock (time-lapse)
  const [l0, l1] = EV.lapse, cs = win(t, l0 - 0.3, l0) * (1 - win(t, l1, l1 + 0.4));
  if (cs > 0) { const u = clamp((t - l0) / (l1 - l0)), hrs = 18 + u * 36, h24 = Math.floor(hrs) % 24, m = Math.floor((hrs % 1) * 60 / 10) * 10, h12 = ((h24 + 11) % 12) + 1;
    const s = `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`, pw = 62, px = UW - pw - 6, py = HY.hud + (TALL ? 0 : 0);
    ctx.globalAlpha = cs; hud(panel(pw, 22), px, py); const night = tod(t).n; hud(night > 0.5 ? moonIcon() : sunIcon(), px + 6, py + 5); hudText(s, px + 20, py + 8, C.ink, { alpha: cs }); ctx.globalAlpha = 1; }
  // WhatsApp notification
  const nu = t - EV.notify; if (nu > 0 && t < EV.stop) { const k = easeOut(nu / 0.35), out = win(t, EV.stop - 0.6, EV.stop - 0.1), pw = 150, px = (UW - pw) / 2, py = HY.hud + (1 - k) * -40 - out * 40;
    hud(panel(pw, 30, '#f2fff5'), px, py); hud(chatIcon(), px + 6, py + 6); hudText('WhatsApp Jade', px + 30, py + 7, '#1f7a4d'); hudText('(868) 715-4817', px + 30, py + 18, C.ink); }
  // order menu (Bomb's list)
  const mu = t - EV.menu; if (mu > 0 && t < EV.menuEnd + 0.4) { const opts = ['Order!', 'Pre-order!', 'Gift a box!', 'Tell her your feelings!'], words = LINES.find(l => l.id === 'b_order');
    const out = win(t, EV.menuEnd, EV.menuEnd + 0.4), pw = 142, px = UW - pw - 6, py = HY.hud + 40;
    const nShow = opts.filter((o, i) => t > words.at + words.dur * [0, 0.16, 0.36, 0.6][i]).length;
    if (nShow) { ctx.globalAlpha = 1 - out; hud(panel(pw, 10 + nShow * 11), px, py); opts.slice(0, nShow).forEach((o, i) => hudText((i === nShow - 1 ? '▸ ' : '  ') + o, px + 6, py + 6 + i * 11, i === nShow - 1 ? C.pinkD : C.ink)); ctx.globalAlpha = 1; } }
}
function sunIcon() { return cached('sunI', () => { const { c, g } = mk(11, 11); disc(g, 5.5, 5.5, 4.5, '#ffd166'); outlineCanvas(c, '#c98a1a'); return c; }); }
function moonIcon() { return cached('moonI', () => { const { c, g } = mk(11, 11); disc(g, 5.5, 5.5, 4.5, '#fff1c9'); disc(g, 7.5, 4, 3.5, 'rgba(0,0,0,0)'); g.clearRect(6, 1, 4, 3); outlineCanvas(c, '#8a7a4a'); return c; }); }
function chatIcon() { return cached('chatI', () => { const { c, g } = mk(18, 18); disc(g, 9, 8.5, 7.5, '#3ccf6e'); P(g, 2, 13, 4, 4, '#3ccf6e'); P(g, 6, 5, 2, 3, '#ffffff'); P(g, 7, 8, 2, 2, '#ffffff'); P(g, 9, 10, 3, 2, '#ffffff'); outlineCanvas(c, '#1f7a4d'); return c; }); }

// split a line into game-style pages (<= maxRows rows each), breaking at sentences when possible
function paginate(text, tw, maxRows) {
  const sents = text.match(/[^.!?…]+[.!?…—]*\s*/g) || [text], pages = []; let cur = '';
  const push = s => { const rows = wrap(s.trim(), tw); pages.push({ rows, n: rows.reduce((a, r) => a + r.length, 0) }); };
  for (const se of sents) { const t = cur ? cur + se : se; if (wrap(t.trim(), tw).length <= maxRows) cur = t; else { if (cur) push(cur); cur = se;
      while (wrap(cur.trim(), tw).length > maxRows) { const rows = wrap(cur.trim(), tw), head = rows.slice(0, maxRows).join(' '); push(head); cur = cur.trim().slice(head.length).trim() + ' '; } } }
  if (cur.trim()) push(cur); return pages;
}
// dialogue box with portrait, name plate and speech-synced typewriter text
function boxState(t) { // the line on screen (held while the conversation continues)
  let cur = null; for (const l of LINES) { if (t >= l.at && t < l.at + l.dur + 0.9) cur = l; }
  if (!cur) return null; const next = LINES[LINES.indexOf(cur) + 1];
  const hold = next && next.at - (cur.at + cur.dur) < 1.3 ? next.at : cur.at + cur.dur + 0.9;
  if (t >= hold) return null;
  // open/close animation only at the edges of a conversation
  const prev = LINES[LINES.indexOf(cur) - 1], startsConv = !prev || cur.at - (prev.at + prev.dur) >= 1.3;
  const open = startsConv ? easeOut((t - cur.at + 0.05) / 0.16) : 1, close = !(next && next.at - (cur.at + cur.dur) < 1.3) ? clamp((hold - t) / 0.16) : 1;
  return { l: cur, k: Math.min(open, close) };
}
function drawBox(t) {
  if (t > EV.fade - 0.2) return;
  const st = boxState(t); if (!st) return;
  const { l, k } = st, bx = 5, bw = UW - 10, bh = HY.boxH, by = HY.box + (1 - k) * 8;
  ctx.globalAlpha = clamp(k * 1.4);
  hud(panel(bw, bh), bx, by);
  // portrait
  const pw = 44; hud(panel(pw, pw, l.who === 'cherry' ? '#ffe4e8' : '#ffd9d2'), bx + 6, by + 7);
  const a = actors(t), face = Object.assign({}, l.who === 'cherry' ? a.c : a.b, { turn: 1, look: 0, arms: 'down' }); delete face.item;
  const key = 'solo' + l.who + JSON.stringify(face), por = cached(key, () => toCanvas(solo(l.who, face)));
  ctx.save(); ctx.beginPath(); ctx.rect((bx + 10) * U, (by + 11) * U, (pw - 6) * U, (pw - 6) * U); ctx.clip(); hud(por, bx + 10 + 1, by + 8); ctx.restore();
  // name plate
  const nm = l.who === 'cherry' ? 'Cherry' : 'Bomb', nw = textWidth(nm) + 12; hud(panel(nw, 14, l.who === 'cherry' ? C.pink : '#b52a3b'), bx + 6, by - 9); hudText(nm, bx + 12, by - 5, '#ffffff');
  // text: reveal follows the speech envelope
  const tx = bx + pw + 13, tw = bw - pw - 20, pages = cached('pg' + l.id + tw, () => paginate(l.text, tw, 3));
  const fr = clamp((t - l.at) * l.fps, 0, l.rev.length - 1), rv = t >= l.at + l.dur ? 1 : l.rev[Math.floor(fr)] || 0;
  const total = pages.reduce((s2, pg) => s2 + pg.n, 0); let shown = Math.ceil(rv * total * 1.03), pi = 0;
  while (pi < pages.length - 1 && shown > pages[pi].n + 2) { shown -= pages[pi].n; pi++; }
  const rows = pages[pi].rows, ty0 = by + 9 + Math.max(0, (3 - rows.length) * 6);
  rows.forEach((r, i) => { const n = Math.max(0, Math.min(r.length, shown)); shown -= r.length; if (n > 0) hudText(r, tx, ty0 + i * 12, C.ink, { upto: n }); });
  if (rv >= 1 && Math.floor(t * 2.5) % 2 === 0) hudText('▼', bx + bw - 12, by + bh - 11, C.pinkD);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- the world scene (sign -> walk -> stop)
function stationsAt(t) { // [img, layerX, baseY, f, opts]
  const out = [], n = tod(t).n;
  out.push([board().c, -board().w / 2, Y.road - board().h + 2, FV]);
  const cx = FV * camXAt(EV.boom) + 34; out.push([cottage(n), cx - 40, Y.road - 70 + 3, FV]);
  const bk = FV * camXAt(EV.bakery + 1.5) + 34; out.push([bakery(), bk - 48, Y.road - 78 + 3, FV]);
  const VOFF = TALL ? [46, 46, 46, 38, 68] : [60, 60, 60, 50, 86];
  ['office', 'lunch', 'exam', 'sad', 'happy'].forEach((kind, i) => { const ta = EV.vign[i], vx = FV * camXAt(ta + 0.4) + VOFF[i]; out.push([vignette(kind, win(t, ta + 0.55, ta + 0.57), t), vx - 27, Y.road - 48 + 2, FV, kind, ta]); });
  // village fill: houses + lamps between the story stations
  const r = rng(404), busy = out.map(s => [s[1] - 14, s[1] + (s[0].width || 80) + 14]);
  for (let x = 120; x < camXAt(TL.duration) + 400; x += 40 + Math.floor(r() * 50)) { const v = Math.floor(r() * 7); if (busy.some(([a, b]) => x + 50 > a && x < b)) continue;
    if (v < 3) out.push([house(v + Math.floor(r() * 3), n), x, Y.road - 48 + 3, FV]); else if (v < 5) out.push([lamp(n), x, Y.road - 34 + 3, FV, 'lamp']); }
  return out;
}
function drawWorld(t, opts = {}) {
  const d = tod(t);
  // sky (smooth)
  const gr = ctx.createLinearGradient(0, 0, 0, toSY(Y.far)); gr.addColorStop(0, skyCol(0, d)); gr.addColorStop(0.55, skyCol(1, d)); gr.addColorStop(1, skyCol(2, d)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  // stars
  if (d.n > 0.05) { const r = rng(5); ctx.fillStyle = `rgba(255,248,220,${d.n})`; for (let i = 0; i < 70; i++) { const x = r() * AW, y = r() * (Y.horizon - 20); if ((i + Math.floor(t * 3)) % 9) ctx.fillRect(Math.round(x * S), Math.round(y * S), S, S); } }
  // sun / moon (arc during the lapse; low and warm at golden hour)
  const [l0, l1] = EV.lapse, lu = clamp((t - l0) / (l1 - l0));
  const sunUp = d.n < 0.5, ang = (t > l0 && t < l1) ? lu * Math.PI * 4 : 0;
  let sx = AW * 0.24 + Math.sin(ang) * 30, sy = (TALL ? 40 : 24) + (1 - Math.cos(ang)) * 0.5 * (Y.horizon - 30) * 0.9 + d.g * (TALL ? 34 : 22);
  const glow = (x, y, R, col) => { const gg = ctx.createRadialGradient(x, y, 0, x, y, R); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.fillRect(x - R, y - R, R * 2, R * 2); };
  if (d.n < 0.98) { const sxs = sx * S, sys = (sy - (cam.y - AH / 2) * 0.1) * S; glow(sxs, sys, 260, `rgba(255,236,170,${0.55 * (1 - d.n)})`); hud(sunSpr(d.g), sx, sy - (cam.y - AH / 2) * 0.1, { anchor: [0.5, 0.5], alpha: 1 - d.n, px: S }); }
  if (d.n > 0.02) { const mx = AW * 0.74, my = (TALL ? 34 : 20); glow(mx * S, my * S, 180, `rgba(220,225,255,${0.35 * d.n})`); hud(moonSpr(), mx, my, { anchor: [0.5, 0.5], alpha: d.n, px: S }); }
  // clouds
  WORLD.clouds.forEach((c, i) => { for (let k = -1; k < 3; k++) { const lx = ((i * 140 + k * 420 + t * 2.2) % 1260) - 300; blit(c, lx + 0.08 * cam.x, (TALL ? 14 : 6) + i * (TALL ? 14 : 12), 0.08, { alpha: 1 - d.n * 0.6 }); } });
  // hills (far one slightly soft: depth of field)
  ctx.filter = 'blur(1.2px)'; tiled(WORLD.hf, Y.far - 70 + 4, 0.16); ctx.filter = 'none';
  tiled(WORLD.hn, Y.far - 56 + 3, 0.3);
  tiled(WORLD.tl, Y.far - 54 + 2, 0.55);
  tiled(WORLD.fv, Y.far - 3, FV);
  // stations (behind the road)
  const st = stationsAt(t);
  for (const [img, lx, by, f, kind, ta] of st) { if (toSX(lx + img.width, f) < -50 || toSX(lx, f) > W + 50) continue; blit(img, lx, by, f);
    if (ta != null) { const u = t - ta - 0.2, bx = lx + (kind === 'lunch' ? 22 : kind === 'office' ? 8 : 34), byy = by + (kind === 'lunch' ? 22 : kind === 'office' ? 30 : 38);
      if (u > 0 && u < 0.36) { const k = u / 0.36; blit(boxIcon(), bx, byy - 40 * (1 - k * k), f); }
      const h = u - 0.4; if (h > 0 && h < 1.4) { const kk = h < 0.2 ? backOut(h / 0.2) : h > 1.15 ? 1 - (h - 1.15) / 0.25 : 1; blit(emoteImg('♥'), lx + 27, by - 2 + Math.sin(h * 9) * 0.6, f, { anchor: [0.5, 1], scale: kk, alpha: clamp(kk) }); } } }
  // road: each art row slides at its own depth (far edge slower) -> perspective ground
  const rd = WORLD.rd, rows = rd.height;
  for (let r = 0; r < rows; r++) { const f = 1 + ((Y.road + r) - Y.ground) / rows * 0.16, off = f * cam.x, y = toSY(Y.road + r), h = Math.ceil(S * cam.z) + 1;
    const left = off - (W / 2 + 40) / (S * cam.z); for (let k = Math.floor(left / 256); k * 256 < left + W / (S * cam.z) + 300; k++) { const x = toSX(k * 256, f); ctx.drawImage(rd, 0, r, 256, 1, Math.round(x), Math.round(y), Math.round(256 * S * cam.z), h); } }
  return st;
}
function drawFront(t) { // in front of the duo
  tiled(WORLD.nv, Y.roadB - 12, 1.1);
  tiled(WORLD.md, Y.near, 1.22);
  const n = tod(t).n;
  // foreground plants, very close: big parallax + blur
  ctx.filter = 'blur(3px)';
  for (let i = -2; i < 80; i++) { const lx = i * 150 + (i % 3) * 37; const img = WORLD.fg[(i + 3) % 3]; if (toSX(lx + 40, 1.7) < -200 || toSX(lx, 1.7) > W + 200) continue; blit(img, lx, AH - 52 - (i % 2) * 6, 1.7, { scale: 1.6 }); }
  ctx.filter = 'none';
}
function sunSpr(g) { return cached('sun' + Math.round(g * 4), () => { const { c, g: x } = mk(26, 26); disc(x, 13, 13, 10.5, (a, b) => (a + b < -0.6 ? mixHex('#fff1b8', '#ffe0b0', g) : mixHex('#ffd166', '#ff9a5a', g))); outlineCanvas(c, mixHex('#f2a93b', '#e0703a', g)); return c; }); }
function moonSpr() { return cached('moon', () => { const { c, g } = mk(22, 22); disc(g, 11, 11, 8.5, '#fff3cf'); disc(g, 8, 9, 2, '#efe0b4'); disc(g, 13, 14, 1.5, '#efe0b4'); outlineCanvas(c, '#b9a978'); return c; }); }

// lighting: time-of-day tint + night window glows + vignette (HD-2D)
function light(t, st) {
  const d = tod(t);
  if (d.n > 0.01) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = mixHex('#ffffff', '#5b5ea8', d.n * 0.85); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'lighter';
    for (const [img, lx, by, f, kind] of st) { const x = toSX(lx + img.width / 2, f); if (x < -200 || x > W + 200) continue; const y = toSY(by + (kind === 'lamp' ? 4 : img.height * 0.55)), R = (kind === 'lamp' ? 34 : 46) * S * 0.6;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, R); gg.addColorStop(0, `rgba(255,200,110,${0.42 * d.n})`); gg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = gg; ctx.fillRect(x - R, y - R, R * 2, R * 2); }
    ctx.globalCompositeOperation = 'source-over'; }
  if (d.g > 0.01) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,170,90,${0.55 * d.g})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    const gg = ctx.createLinearGradient(0, 0, W, 0); gg.addColorStop(0, `rgba(255,190,120,${0.22 * d.g})`); gg.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); }
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(40,20,40,0)'); vg.addColorStop(1, 'rgba(40,20,40,0.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// the duo on the road (or on the sign) — returns head positions for emotes and a screen point for item pickups
function duoState(t) {
  const bt = board(), boardTop = Y.road - bt.h + 2 + bt.top - 1;
  const a = actors(t), s = { view: 'side', walking: false, frame: 0, x: camXAt(t), y: Y.ground, sx: 1, sy: 1, scale: 1, dusty: false, jump: false, c: a.c, b: a.b };
  if (t < EV.hop) { s.view = t < EV.turn + 0.1 ? 'back' : 'front'; s.x = 0; s.y = boardTop;
    if (t >= EV.turn - 0.1 && t < EV.turn + 0.22) { const k = (t - EV.turn + 0.1) / 0.32; s.sx = k < 0.6 ? Math.cos(k / 0.6 * Math.PI / 2) : backOut((k - 0.6) / 0.4); s.y -= Math.sin(clamp(k) * Math.PI) * 5; s.sx = Math.max(0.06, s.sx); }
    if (s.view === 'front') { s.c = Object.assign({ turn: 1, look: 0 }, s.c); s.b = Object.assign({ turn: 1, look: 0 }, s.b);
      if (t > AT.c_hi.at - 0.1 && t < AT.c_hi.end + 0.3) { s.c.arms = 'wave'; s.c.eyes = s.c.eyes === 'blink' ? 'blink' : 'happy'; }
      if (t > AT.b_hi.at && t < AT.b_hi.end + 0.2) s.b.arms = 'up';
      if (t > AT.c_walk.at) { s.c.arms = 'wave'; } }
    // hook: wobble at the start
    const w = t - 0.15; if (w > 0 && w < 0.6) { s.sy = 1 - Math.sin(w * 22) * 0.05 * (1 - w / 0.6); }
    s.frame = Math.floor(t * 6);
  } else if (t < EV.walk0) { const k = clamp((t - EV.hop) / 0.62); s.x = 0; s.y = lerp(boardTop, Y.ground, k) - Math.sin(k * Math.PI) * 22; s.view = 'side'; s.jump = k < 1;
    s.c = Object.assign({ eyes: 'happy', arms: 'up' }, s.c); s.b = Object.assign({ arms: 'up' }, s.b);
    const land = t - EV.hop - 0.62; if (land > 0 && land < 0.18) { s.sy = 1 - 0.12 * Math.sin(land / 0.18 * Math.PI); s.sx = 1 + 0.08 * Math.sin(land / 0.18 * Math.PI); }
  } else {
    const v = speedAt(t); s.walking = v > 3; s.frame = Math.floor(look(PH, t)) % 8;
    if (t > EV.boom && t < EV.resume + 0.25) s.dusty = true;
    if (t > EV.grab && t < EV.boom) s.b = Object.assign({}, s.b, { item: 'sack' });
    if (t > EV.scissors[0] && t < EV.toss) s.b = Object.assign({}, s.b, { item: 'scissors' });
    // jump toward camera on "That's me!"
    const j = t - EV.jump; if (j > 0 && j < 0.75) { const k = j / 0.75; s.y = Y.ground + Math.sin(k * Math.PI) * 7; s.scale = 1 + 0.16 * Math.sin(k * Math.PI); s.jump = k > 0.1 && k < 0.85; s.dy = Math.sin(k * Math.PI) * 10; }
    // shake-off when they walk on
    const so = t - EV.resume; if (so > -0.3 && so < 0.25) { s.sx = 1 + Math.sin(so * 60) * 0.06; }
  }
  // freeze: everything holds its pose
  return s;
}
function drawDuo(t, s) {
  const o = { view: s.view, walking: s.walking, frame: s.frame, cherry: s.c, bomb: s.b, dusty: s.dusty, jump: s.jump };
  const key = JSON.stringify(o), spr = cached(key, () => { const d = duo(o); return { c: toCanvas(d), ax: d.ax, ay: d.ay, w: d.w, h: d.h }; });
  // shadow stays on the ground
  const groundY = s.view === 'front' || s.view === 'back' ? s.y : Y.ground;
  if (t >= EV.hop || s.view !== 'side') { const sh = cached('shadow', () => toCanvas(shadow(50))); blit(sh, s.x - 26, (t < EV.hop ? s.y : groundY) - 2, 1, { alpha: 0.9 - (s.jump ? 0.35 : 0), scale: 1 }); }
  const lift = s.dy || 0, k = s.scale;
  const x = s.x - spr.ax * k * Math.abs(s.sx), y = s.y - lift - spr.ay * k * s.sy;
  blit(spr.c, x, y, 1, { scale: k, sx: s.sx, sy: s.sy });
  // positions for emotes (heads) and HUD pickups (screen art coords)
  const cHead = [s.x - 11 * k, s.y - lift - 50 * k], bHead = [s.x + 11 * k, s.y - lift - 54 * k];
  return { c: cHead, b: bHead, screen: [toSX(s.x) / U, toSY(s.y - 30) / U] };
}

// crate + sack by the cottage, scissors toss, birds
function props(t) {
  const gx = camXAt(EV.grab) + 18; blit(crate(), gx - 8, Y.ground - 13, 1);
  if (t < EV.grab) blit(sackImg(), gx - 6, Y.ground - 24, 1);
  const u = t - EV.toss; if (u > 0 && u < 1.2) { const x = camXAt(t) + 14 + u * 40, y = Y.ground - 30 - 50 * u + 70 * u * u; blit(cached('scs', () => { const { c, g } = mk(10, 7); P(g, 3, 1, 6, 1, '#a7a2b3'); P(g, 3, 4, 6, 1, '#a7a2b3'); P(g, 5, 2, 1, 2, '#6d6880'); disc(g, 1.5, 1.5, 1.5, C.pinkD); disc(g, 1.5, 5, 1.5, C.pinkD); outlineCanvas(c, C.ink); return c; }), x, y, 1); }
}
function birds(t) {
  const u = t - EV.birds; if (u < -2 || u > 3) return;
  const img = f => cached('bird' + f, () => { const { c, g } = mk(7, 5); if (f) { P(g, 0, 0, 2, 1, C.ink); P(g, 5, 0, 2, 1, C.ink); P(g, 2, 1, 3, 2, C.ink); } else { P(g, 0, 2, 2, 1, C.ink); P(g, 5, 2, 2, 1, C.ink); P(g, 2, 1, 3, 2, C.ink); } return c; });
  for (let i = 0; i < 6; i++) { const bx = camXAt(EV.birds) * 1.1 + 30 + i * 9; if (u < 0) { blit(img(0), bx, Y.roadB - 14 - (i % 2), 1.1); continue; }
    const k = u * (0.8 + i * 0.07); blit(img(Math.floor(t * 10 + i) % 2), bx + k * 26 * (i % 2 ? 1 : -0.4), Y.roadB - 14 - k * k * 24 - k * 18, 1.1); }
}

// ---------------------------------------------------------------- scene 8: the long road (true perspective floor, rendered per frame at art res)
const RW = Math.ceil(AW), RH = Math.ceil(AH), ROAD8 = mk(RW, RH);
function drawRoad(t) {
  const u = t - EV.whip, g = ROAD8.g, img = g.createImageData(RW, RH), D = img.data, hz = Math.round(RH * (TALL ? 0.42 : 0.38)), camZ = 2 + 1.6 * easeOut(u / 3), K = RH * 0.9;
  const sky = (y) => { const k = y / hz; return k < 0.6 ? mixHex('#c9a2e0', '#ffb98a', k / 0.6) : mixHex('#ffb98a', '#ffe2a6', (k - 0.6) / 0.4); };
  for (let y = 0; y < RH; y++) {
    if (y <= hz) { const col = sky(y), m = col.match(/\d+/g).map(Number); for (let x = 0; x < RW; x++) { const i = (y * RW + x) * 4; D[i] = m[0]; D[i + 1] = m[1]; D[i + 2] = m[2]; D[i + 3] = 255; } continue; }
    const z = K / (y - hz), fog = clamp(1 - z / 60), wz = z + camZ;
    for (let x = 0; x < RW; x++) {
      const wx = (x + 0.5 - RW / 2) * z / K * 2.2, ax = Math.abs(wx); let col;
      if (ax < 1.25) { col = (Math.floor(wz * 3) + Math.floor(wx * 9)) % 7 === 0 ? [214, 182, 136] : [228, 198, 150];
        const az = (wz % 6) - 3; // painted arrows (↑) every 6 units
        if (az > 0 && az < 1.6 && ax < 0.42 - (az < 0.7 ? 0 : (az - 0.7) * 0.45) && (az < 0.7 ? ax < 0.14 : true)) col = [255, 255, 255];
        if (ax > 1.13) col = [180, 140, 96]; }
      else { const row = Math.floor((ax - 1.25) / 0.55), band = (ax - 1.25) % 0.55; col = band < 0.18 ? [118, 186, 132] : row % 2 ? [150, 214, 165] : [140, 206, 156];
        if (band < 0.18 && ((Math.floor(wz * 2) + row) % 3 === 0)) col = [255, 186, 196]; }
      const sk = [255, 214, 170]; const k2 = 1 - fog; const i = (y * RW + x) * 4;
      D[i] = Math.round(lerp(col[0], sk[0], k2 * 0.5)); D[i + 1] = Math.round(lerp(col[1], sk[1], k2 * 0.5)); D[i + 2] = Math.round(lerp(col[2], sk[2], k2 * 0.5)); D[i + 3] = 255; }
  }
  g.putImageData(img, 0, 0);
  // far hills + sun on the horizon (into the art canvas)
  const sunY = hz - 6; disc(g, RW / 2, sunY, 16, (a, b) => (a + b < -0.6 ? '#fff1b8' : '#ffd166'));
  for (let x = 0; x < RW; x++) { const h = 6 + Math.round(4 * Math.sin(x * 0.07) + 3 * Math.sin(x * 0.19 + 1)); P(g, x, hz - h, 1, h + 1, x % 2 ? '#c9a2d8' : '#c4a0d4'); }
  ctx.drawImage(ROAD8.c, 0, 0, RW * S, RH * S);
  const gl = ctx.createRadialGradient(W / 2, (hz - 6) * S, 0, W / 2, (hz - 6) * S, W * 0.7); gl.addColorStop(0, 'rgba(255,230,160,0.55)'); gl.addColorStop(1, 'rgba(255,230,160,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  // signpost: three boards, all pointing forward (up)
  const sp = cached('post', () => { const { c, g: s } = mk(64, 70); P(s, 30, 10, 4, 60, C.wood); P(s, 32, 10, 2, 60, C.woodD);
    ['FULL BAKERY', 'MORE TREATS', 'YOU ♥'].forEach((txt, i) => { const w = textWidth(txt) + 10, x = 32 - w / 2, y = 4 + i * 14; P(s, x, y + 3, w, 10, [C.pink, '#a687d9', '#ffab55'][i]); P(s, x + w / 2 - 4, y, 8, 3, [C.pink, '#a687d9', '#ffab55'][i]); P(s, x + w / 2 - 2, y - 2, 4, 2, [C.pink, '#a687d9', '#ffab55'][i]); drawText(s, txt, x + 5, y + 4, '#ffffff'); });
    outlineCanvas(c, C.ink); return c; });
  const zS = 9 - camZ * 0.8, spy = hz + K / zS, sps = clamp(4.6 / zS, 0.4, 1.1);
  ctx.drawImage(sp, Math.round((RW / 2 + 1.5 * K / zS / 2.2) * S - 32 * S * sps), Math.round(spy * S - 70 * S * sps), Math.round(64 * S * sps), Math.round(70 * S * sps));
  // the duo from behind, walking away
  const wk = Math.max(0, t - EV.roadWalk), dz = 3.2 + wk * 0.55, py = hz + K / dz * 0.98, ps = clamp(3.2 / dz, 0.25, 1.15);
  const walking = t > EV.roadWalk, a = actors(t), o = { view: 'back', walking, frame: walking ? Math.floor(wk * 9) % 8 : 0, cherry: {}, bomb: {} };
  const spr = cached('road' + JSON.stringify(o), () => { const d = duo(o); return { c: toCanvas(d), ax: d.ax, ay: d.ay }; });
  const sh = cached('shadow', () => toCanvas(shadow(50)));
  ctx.globalAlpha = 0.8; ctx.drawImage(sh, Math.round(W / 2 - 26 * S * ps), Math.round((py - 2) * S), Math.round(sh.width * S * ps), Math.round(sh.height * S * ps)); ctx.globalAlpha = 1;
  ctx.drawImage(spr.c, Math.round(W / 2 - spr.ax * S * ps), Math.round(py * S - spr.ay * S * ps), Math.round(spr.c.width * S * ps), Math.round(spr.c.height * S * ps));
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(40,20,40,0)'); vg.addColorStop(1, 'rgba(40,20,40,0.3)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  return { c: [0, 0], b: [0, 0] };
}

// ---------------------------------------------------------------- end card
function drawEnd(t) {
  const u = t - EV.end;
  // gingham tablecloth backdrop (pixel)
  const bg = cached('ging', () => { const { c, g } = mk(16, 16); P(g, 0, 0, 16, 16, '#fff3f4'); P(g, 0, 0, 8, 16, '#ffd9df'); P(g, 0, 0, 16, 8, '#ffd9df'); P(g, 0, 0, 8, 8, '#ffbfca'); return c; });
  for (let y = 0; y < UH; y += 16) for (let x = 0; x < UW; x += 16) hud(bg, x - ((u * 4) % 16), y);
  const k = easeOut(u / 0.6), lw = 150, lg = WMpix(lw), ly = TALL ? 52 : 12;
  hud(lg, UW / 2, ly + (1 - k) * -30 + Math.sin(u * 2) * 1, { anchor: [0.5, 0], alpha: k });
  // menu panel
  const pw = 170, ph = 92, px = (UW - pw) / 2, py = ly + lg.height + (TALL ? 22 : 8), k2 = easeOut((u - 0.4) / 0.5);
  if (k2 > 0) { ctx.globalAlpha = k2; hud(panel(pw, ph), px, py + (1 - k2) * 12);
    hudText('Talk to Jade', px + (pw - textWidth('Talk to Jade')) / 2, py + 9 + (1 - k2) * 12, C.pinkD);
    const opts = ['Order', 'Pre-order', 'Gift a box'], sel = Math.floor(Math.max(0, u - 1.2) / 1.0) % 3;
    opts.forEach((o, i) => { const y = py + 24 + i * 12 + (1 - k2) * 12; if (i === sel) { P(ctx, 0, 0, 0, 0, 0); ctx.fillStyle = '#ffe4e8'; ctx.fillRect((px + 18) * U, (y - 2) * U, (pw - 36) * U, 11 * U); }
      hudText((i === sel && Math.floor(u * 3) % 2 ? '▸ ' : '  ') + o, px + 24, y, i === sel ? C.pinkD : C.ink); });
    hud(chatIcon(), px + 14, py + ph - 26 + (1 - k2) * 12); hudText('(868) 715-4817', px + 36, py + ph - 21 + (1 - k2) * 12, C.ink);
    ctx.globalAlpha = 1; }
  const k3 = clamp((u - 1.4) / 0.5); if (k3 > 0) { const s = 'Thanks for playing ♥'; hudText(s, (UW - textWidth(s)) / 2, py + ph + (TALL ? 14 : 6), C.pinkD, { alpha: k3 }); }
  // the duo waving
  const k4 = easeOut((u - 0.8) / 0.6); if (k4 > 0 && TALL) { const o = { view: 'front', cherry: { turn: 1, look: 0, arms: 'wave', eyes: 'happy', mouth: 'talk2' }, bomb: { turn: 1, look: 0, arms: 'up' }, frame: Math.floor(u * 6) };
    const spr = cached('endduo' + o.frame % 8, () => toCanvas(duo(Object.assign({}, o, { frame: o.frame % 8 })))); hud(spr, UW / 2, UH - 92 + (1 - k4) * 30 + Math.abs(Math.sin(u * 3)) * -2, { anchor: [0.5, 0] }); }
  if (!TALL && k4 > 0) { const o = { view: 'front', cherry: { turn: 1, look: 0, arms: 'wave', eyes: 'happy' }, bomb: { turn: 1, look: 0, arms: 'up' }, frame: Math.floor(u * 6) % 8 };
    const spr = cached('endduo1' + o.frame, () => toCanvas(duo(o))); hud(spr, UW - 46, UH - 76 + (1 - k4) * 30, { anchor: [0.5, 0], scale: 0.8 }); }
  if (u < 0.5) { ctx.fillStyle = `rgba(0,0,0,${1 - u / 0.5})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------------------------------------------------------- compose a frame
const off = [mk(W, H), mk(W, H)];
function worldFrame(target, t) {
  const prev = ctx; ctx = target; ctx.imageSmoothingEnabled = false;
  // camera
  cam = { x: camXAt(t), y: AH / 2, z: 1, sx: 0, sy: 0 };
  if (t < EV.zoomOut[1]) { const k = easeIO(win(t, EV.zoomOut[0], EV.zoomOut[1])), bt = board(), focusY = Y.road - bt.h + (TALL ? 14 : -4); cam.z = lerp(TALL ? 2.3 : 1.9, 1, k); cam.y = lerp(focusY, AH / 2, k); }
  // freeze-frame punch-in on Bomb
  const fr = t > EV.freeze[0] && t < EV.freeze[1] ? 1 : 0;
  const fk = ss(win(t, EV.freeze[0], EV.freeze[0] + 0.12)) * (1 - ss(win(t, EV.freeze[1] - 0.25, EV.freeze[1])));
  // the stop: ease in on the pair
  const sk = ss(win(t, EV.stop + 0.6, EV.stop + 3.4));
  cam.z *= 1 + 0.32 * fk + 0.28 * sk; cam.y = lerp(cam.y, Y.ground - 30, Math.max(fk, sk)); cam.x += 10 * fk;
  const [shx, shy] = shakeAt(t); cam.sx = shx; cam.sy = shy;
  const wt = fr ? EV.freeze[0] + 0.02 : t; // world time holds during the freeze
  const st = drawWorld(wt);
  props(wt);
  const s = duoState(wt), pos = drawDuo(wt, s);
  birds(wt);
  drawFront(wt);
  flourFx(t, camXAt(EV.boom) + 14, Y.ground - 22);
  light(wt, st);
  if (fk > 0) { // comic burst behind the freeze
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(255,255,255,${0.18 * fk})`; ctx.fillRect(0, 0, W, H);
    const cx = toSX(s.x + 11), cy = toSY(Y.ground - 36); ctx.strokeStyle = `rgba(255,255,255,${0.75 * fk})`; ctx.lineWidth = S;
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r0 = 240 + (i % 3) * 40, r1 = 900; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); } }
  emotes(t, pos);
  ctx = prev; return pos;
}
let READY = false;
function frame(t) {
  ctx = main; ctx.imageSmoothingEnabled = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let pos = null;
  if (t < EV.whip) { pos = worldFrame(main, t); }
  else if (t < EV.whip + 0.5) { // whip-pan round behind them
    const k = easeIO((t - EV.whip) / 0.5);
    worldFrame(off[0].g, t); const g0 = off[0].c; ctx = off[1].g; drawRoad(t); ctx = main;
    const blur = Math.sin(k * Math.PI) * 14;
    ctx.filter = `blur(${blur.toFixed(1)}px)`; ctx.drawImage(g0, -k * W, 0); ctx.drawImage(off[1].c, W - k * W, 0); ctx.filter = 'none';
  } else if (t < EV.black) { drawRoad(t); const f = win(t, EV.fade, EV.black); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); } }
  else if (t < EV.end) { /* black */ }
  else drawEnd(t);
  // HUD over the world
  if (t < EV.fade + 1.3 && t < EV.black) {
    ctx = main;
    if (t < EV.whip) drawHUD(t, pos ? pos.screen : [UW / 2, UH / 2]);
    drawBox(t);
  }
}

// ---------------------------------------------------------------- page API for the renderer
window.MG_duration = TL.duration; window.MG_fps = 30; window.MG_size = [W, H];
window.MG_seek = t => frame(Math.max(0, Math.min(TL.duration - 1e-3, t)));
WM = new Image(); WM.onload = () => { genWorld(); frame(0); window.MG_ready = true; }; WM.src = WORDMARK;
window.MG_ready = undefined;
})();
