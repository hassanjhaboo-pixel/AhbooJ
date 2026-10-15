// Jadesserts print pack — drawn in the page (sprites, font, logo inlined before this file by make-print.mjs).
// Every design renders at 300 dpi with a 0.125" bleed. Pixel art is drawn on an "art" grid (1 art px = 5 print px = 1/60 in)
// and scaled up crisp; text and QR codes are drawn straight at print resolution.
(function () {
'use strict';
const DPI = 300, BLEED = 0.125, A = 5; // print px per art px
const C = { ink: '#4a2236', cream: '#fff4dc', paper: '#fffaf0', pink: '#f4636f', pinkD: '#dd4652', blush: '#ffd9df', ging: '#ffbfca', wood: '#c48a55', woodD: '#9c6a3c', woodL: '#dba56f', woodO: '#5e3b22', gold: '#ffd166', green: '#1f7a4d', white: '#ffffff' };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c, g }; };
const P = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function disc(g, cx, cy, r, col) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + .5 - cx, dy = y + .5 - cy; if (dx * dx + dy * dy <= r * r) P(g, x, y, 1, 1, typeof col === 'function' ? col(dx / r, dy / r) : col); } }
function outline(c, col) { const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height, add = [];
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) add.push([x, y]);
  g.fillStyle = col; add.forEach(([x, y]) => g.fillRect(x, y, 1, 1)); return c; }
function icon(k) { const { c, g } = mk(16, 16);
  if (k === 'bread') { P(g, 1, 6, 14, 8, '#a8673c'); P(g, 2, 4, 12, 3, '#c07a46'); P(g, 3, 3, 10, 1, '#d18e57'); [[4, 7], [8, 9], [11, 7], [6, 11], [10, 12]].forEach(([x, y]) => P(g, x, y, 1, 1, '#4a2b1c')); P(g, 9, 2, 4, 2, '#ffe08a'); }
  if (k === 'cupcake') { P(g, 4, 9, 8, 6, '#f2c48d'); for (let x = 4; x < 12; x += 2) P(g, x, 9, 1, 6, '#d9a66a'); disc(g, 8, 7, 5, '#fff3f6'); disc(g, 8, 6, 3.5, '#ffe2ea'); disc(g, 8, 2.5, 1.8, '#e5484d'); P(g, 9, 0, 1, 1, '#4f8a58'); }
  if (k === 'tart') { disc(g, 8, 9, 7, '#e6b071'); disc(g, 8, 9, 5, '#c8303f'); P(g, 3, 8, 10, 1, '#f0c58a'); P(g, 7, 4, 1, 10, '#f0c58a'); P(g, 6, 7, 1, 1, '#ff8a92'); }
  if (k === 'puff') { disc(g, 8, 10, 6.5, (a, b) => (b < -.3 ? '#f3c983' : '#e3a95a')); P(g, 3, 9, 10, 2, '#ffb347'); P(g, 4, 10, 8, 1, '#ff9b2e'); }
  if (k === 'pastry') { for (let y = 0; y < 12; y++) P(g, 2 + y * .5, 3 + y, 12 - y, 1, y % 3 === 0 ? '#f6d08f' : '#e2ab5c'); P(g, 4, 6, 6, 1, '#c78a3e'); }
  if (k === 'drink') { P(g, 4, 4, 9, 11, '#e9f6ff'); P(g, 5, 7, 7, 7, '#f0566a'); P(g, 5, 7, 7, 2, '#ff8a96'); P(g, 10, 1, 1, 6, '#4f8a58'); disc(g, 12, 5, 2.5, '#9fdc6a'); P(g, 12, 5, 1, 1, '#e9ffcf'); }
  if (k === 'gift') { P(g, 2, 6, 12, 9, '#ffd3dc'); P(g, 1, 4, 14, 3, '#f2a7b7'); P(g, 7, 4, 2, 11, C.pinkD); P(g, 4, 1, 3, 3, C.pinkD); P(g, 9, 1, 3, 3, C.pinkD); P(g, 7, 3, 2, 1, C.pinkD); }
  if (k === 'chat') { disc(g, 8, 7.5, 7, '#3ccf6e'); P(g, 1, 12, 4, 4, '#3ccf6e'); P(g, 5, 4, 2, 3, '#fff'); P(g, 6, 7, 2, 2, '#fff'); P(g, 8, 9, 3, 2, '#fff'); return outline(c, '#1f7a4d'); }
  if (k === 'heart') { [[2, 0], [3, 0], [6, 0], [7, 0]].forEach(([x, y]) => P(g, x + 3, y + 4, 1, 1, C.pink)); for (let y = 1; y < 8; y++) { const w = y < 4 ? 8 : 8 - (y - 3) * 2; P(g, 3 + (8 - w) / 2 + 0, 4 + y, w, 1, C.pink); } }
  return outline(c, C.ink); }
let LOGO = null;
function logoPix(w) { const h = Math.round(w * LOGO.height / LOGO.width), big = mk(w * 4, h * 4); big.g.imageSmoothingEnabled = true; big.g.drawImage(LOGO, 0, 0, w * 4, h * 4); const { c, g } = mk(w, h); g.imageSmoothingEnabled = true; g.drawImage(big.c, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; g.putImageData(d, 0, 0); return c; }
const duoImg = o => toCanvas(duo(o)), soloImg = (w, o) => toCanvas(solo(w, o));
const HAPPY = { view: 'front', frame: 2, cherry: { turn: 1, look: 0, arms: 'wave', eyes: 'happy' }, bomb: { turn: 1, look: 0, arms: 'up', eyes: 'happy', mouth: 'grin' } };

// ---------------------------------------------------------------- a design surface: inches in, art + print layers out
function surface(wIn, hIn) {
  const W = Math.round((wIn + 2 * BLEED) * DPI), H = Math.round((hIn + 2 * BLEED) * DPI), art = mk(W / A, H / A), out = mk(W, H);
  const ax = i => Math.round((i + BLEED) * DPI / A), px = i => Math.round((i + BLEED) * DPI);   // inch (trim coords) -> art px / print px
  const S = {
    W, H, art, out, ax, px, wIn, hIn,
    fill(col) { P(art.g, 0, 0, art.c.width, art.c.height, col); },
    gingham(x0, y0, x1, y1, cell = 6) { const X0 = x0 == null ? 0 : ax(x0), Y0 = y0 == null ? 0 : ax(y0), X1 = x1 == null ? art.c.width : ax(x1), Y1 = y1 == null ? art.c.height : ax(y1);
      for (let y = Y0; y < Y1; y += cell) for (let x = X0; x < X1; x += cell) { const a = Math.floor((x - X0) / cell) % 2, b = Math.floor((y - Y0) / cell) % 2; P(art.g, x, y, Math.min(cell, X1 - x), Math.min(cell, Y1 - y), a && b ? C.ging : a || b ? C.blush : '#fff3f4'); } },
    wood(x, y, w, h, fill = C.cream) { const g = art.g, X = ax(x), Y = ax(y), Wd = ax(x + w) - X, Hd = ax(y + h) - Y; P(g, X - 1, Y - 1, Wd + 2, Hd + 2, C.woodO); P(g, X, Y, Wd, Hd, C.wood); P(g, X, Y, Wd, 1, C.woodL); P(g, X, Y + Hd - 1, Wd, 1, C.woodD); P(g, X + 3, Y + 3, Wd - 6, Hd - 6, C.woodD); P(g, X + 4, Y + 4, Wd - 8, Hd - 8, fill); },
    img(c, x, y, o = {}) { const k = o.scale || 1; art.g.save(); if (o.alpha != null) art.g.globalAlpha = o.alpha; art.g.drawImage(c, ax(x) - (o.center ? Math.round(c.width * k / 2) : 0), ax(y), Math.round(c.width * k), Math.round(c.height * k)); art.g.restore(); },
    // print-resolution layer (call after art is final)
    flatten() { out.g.imageSmoothingEnabled = false; out.g.drawImage(art.c, 0, 0, W, H); return out.g; },
    text(s, x, y, col, scale = 5, o = {}) { const g = out.g, w = textWidth(s) * scale; let X = px(x); if (o.align === 'center') X -= w / 2; if (o.align === 'right') X -= w; drawText(g, s, Math.round(X), px(y), col, { scale }); return w / DPI; },
    para(s, x, y, maxIn, col, scale = 5, lead = 1.55, o = {}) { const rows = wrap(s, maxIn * DPI / scale); rows.forEach((r, i) => S.text(r, o.align === 'center' ? x + maxIn / 2 : x, y + i * (10 * scale * lead / 1.55) / DPI * 1.0, col, scale, o)); return rows.length * (10 * scale) / DPI; },
    qr(mods, x, y, sizeIn, quiet = 2) { const g = out.g, n = mods.length, mpx = Math.floor(sizeIn * DPI / (n + quiet * 2)), total = mpx * (n + quiet * 2), X = px(x) + Math.floor((sizeIn * DPI - total) / 2), Y = px(y) + Math.floor((sizeIn * DPI - total) / 2);
      g.fillStyle = '#ffffff'; g.fillRect(X, Y, total, total); g.fillStyle = '#2a1620'; for (let r = 0; r < n; r++) for (let c2 = 0; c2 < n; c2++) if (mods[r][c2]) g.fillRect(X + (c2 + quiet) * mpx, Y + (r + quiet) * mpx, mpx, mpx); return mpx; },
  };
  return S;
}

// ---------------------------------------------------------------- 1 · business card (3.5 x 2)
function businessFront() {
  const S = surface(3.5, 2); S.fill(C.cream); S.gingham(null, 1.58, null, null);
  P(S.art.g, 0, S.ax(1.58) - 1, S.art.c.width, 1, C.ink);
  S.img(logoPix(118), 0.2, 0.3);
  S.img(toCanvas(shadow(50)), 2.55, 1.72); S.img(duoImg(HAPPY), 2.05, 0.6);
  S.flatten();
  S.text('Baked with grit & love', 0.24, 0.95, C.ink, 6); S.text('Treats · Sweet Boxes', 0.24, 1.15, C.pinkD, 5); S.text('& Gifts', 0.24, 1.32, C.pinkD, 5);
  return S.out.c;
}
function businessBack(Q) {
  const S = surface(3.5, 2); S.fill(C.pink);
  for (let x = 0; x < S.art.c.width; x += 2) { P(S.art.g, x, S.ax(1.84), 1, 1, C.pinkD); } // dotted hem
  S.wood(2.3, 0.2, 1.02, 1.02, C.white);
  S.img(icon('chat'), 0.22, 0.78);
  S.flatten();
  S.text('Talk to Jade', 0.22, 0.24, C.cream, 9);
  S.text('WhatsApp', 0.56, 0.8, C.cream, 5); S.text('(868) 715-4817', 0.56, 0.98, C.white, 7);
  S.text('Order · Pre-order · Gift a box', 0.22, 1.48, C.cream, 5);
  S.qr(Q.order, 2.3 + 0.075, 0.2 + 0.075, 0.87, 2);
  S.text('Scan to order', 2.81, 1.33, C.white, 4, { align: 'center' });
  return S.out.c;
}
// ---------------------------------------------------------------- 2 · loyalty card "Sweet Pass" (3.5 x 2)
function loyaltyFront() {
  const S = surface(3.5, 2); S.gingham();
  S.wood(0.42, 0.16, 2.66, 0.86);
  S.img(logoPix(92), 1.75, 0.27, { center: true });
  S.img(soloImg('cherry', { eyes: 'happy', arms: 'wave' }), 0.22, 1.25); S.img(soloImg('bomb', { eyes: 'sly', mouth: 'smirk', arms: 'up' }), 2.68, 1.25);
  S.flatten();
  S.text('SWEET PASS', 1.75, 0.71, C.pinkD, 10, { align: 'center' });
  S.text('Fill the bar,', 1.75, 1.36, C.ink, 6, { align: 'center' }); S.text('get a free treat!', 1.75, 1.56, C.ink, 6, { align: 'center' });
  return S.out.c;
}
function loyaltyBack() {
  const S = surface(3.5, 2); S.fill(C.cream);
  // the hotbar from the film: 6 slots on a wooden bar
  const x0 = 0.16, y0 = 0.42, slot = 0.47, gap = 0.04, n = 6, w = n * slot + (n - 1) * gap + 0.12;
  S.wood(x0, y0, w, slot + 0.12, C.wood);
  const items = ['bread', 'cupcake', 'tart', 'puff', 'pastry', 'gift'];
  items.forEach((k, i) => { const sx = x0 + 0.06 + i * (slot + gap), sy = y0 + 0.06, g = S.art.g, X = S.ax(sx), Y = S.ax(sy), D = S.ax(sx + slot) - X;
    P(g, X, Y, D, D, i === 5 ? '#ffe9ec' : '#f3ddb3'); P(g, X, Y, D, 1, '#c99a62'); P(g, X, Y, 1, D, '#c99a62');
    const ic = icon(k); S.img(ic, sx + slot / 2, sy + (i === 5 ? 0.05 : 0.11), { center: true, alpha: i === 5 ? 1 : 0.28 }); });
  S.img(icon('chat'), 0.2, 1.6);
  S.flatten();
  S.text('One stamp for every box', 1.75, 0.16, C.ink, 6, { align: 'center' });
  S.text('FREE', x0 + 0.06 + 5 * (slot + gap) + slot / 2, y0 + 0.39, C.pinkD, 4, { align: 'center' });
  S.text('Name', 0.2, 1.24, C.ink, 5); P(S.out.g, S.px(0.62), S.px(1.38), S.px(3.3) - S.px(0.62), 3, C.ink);
  S.text('6 stamps = a free treat ♥', 0.2, 1.42, C.pinkD, 5);
  S.text('WhatsApp (868) 715-4817', 0.52, 1.63, C.ink, 5);
  return S.out.c;
}
// ---------------------------------------------------------------- 3 · box insert (4 x 6, portrait)
function insert(Q) {
  const S = surface(4, 6); S.gingham(); S.wood(0.2, 0.2, 3.6, 5.6, C.paper);
  S.img(logoPix(170), 2, 0.42, { center: true });
  S.img(toCanvas(shadow(50)), 0.85, 3.58); S.img(duoImg(HAPPY), 0.32, 2.42);
  S.wood(1.78, 2.5, 1.86, 0.78, C.cream);
  S.wood(0.36, 4.16, 3.28, 1.5, C.cream);
  S.flatten();
  S.text('Thank you for your box!', 2, 1.06, C.pinkD, 7, { align: 'center' });
  const note = 'Every treat in here was baked by hand, with grit, passion and a lot of flour. I hope it made your day a little sweeter.';
  const rows = wrap(note, 3.1 * DPI / 5); rows.forEach((r, i) => S.text(r, 2, 1.34 + i * 0.17, C.ink, 5, { align: 'center' }));
  S.text('- Jade ♥', 3.42, 1.34 + rows.length * 0.17 + 0.02, C.pinkD, 6, { align: 'right' });
  // Bomb's line in a game dialog box, with his name plate
  const g = S.out.g; g.fillStyle = '#b52a3b'; g.fillRect(S.px(1.92), S.px(2.42), S.px(2.42) - S.px(1.92), S.px(2.6) - S.px(2.42)); S.text('Bomb', 1.98, 2.455, C.white, 4);
  S.text('Five stars.', 1.98, 2.72, C.ink, 6); S.text('No pressure.', 1.98, 2.92, C.ink, 6); S.text('▼', 3.44, 3.06, C.pinkD, 4);
  // QR panel
  S.qr(Q.review, 0.47, 4.27, 1.28, 2);
  S.text('Scan to tell', 1.86, 4.36, C.ink, 6); S.text('Jade how it was!', 1.86, 4.55, C.ink, 5);
  S.text('Or WhatsApp', 1.86, 4.84, C.green, 5); S.text('(868) 715-4817', 1.86, 5.01, C.ink, 5);
  S.text('Order · Pre-order', 1.86, 5.26, C.pinkD, 4); S.text('Gift a box', 1.86, 5.4, C.pinkD, 4);
  return S.out.c;
}
// ---------------------------------------------------------------- 4 · seal sticker (2 in round)
function seal() {
  const S = surface(2, 2), cx = 1, cy = 1; S.fill(C.pink);
  const g = S.art.g, R = 60, ccx = S.ax(cx), ccy = S.ax(cy);
  disc(g, ccx, ccy, 43, C.ink); disc(g, ccx, ccy, 42, C.cream);
  for (let a = 0; a < 360; a += 6) { const r = a * Math.PI / 180; P(g, ccx + Math.cos(r) * 57.5, ccy + Math.sin(r) * 57.5, 1, 1, C.pinkD); }
  const o = S.flatten();
  // the pair in the middle, drawn at 4 print px per sprite px
  const d = duoImg(HAPPY), k = 4; o.drawImage(d, S.px(cx) - d.width * k / 2, S.px(cy) - d.height * k / 2 + 6, d.width * k, d.height * k);
  // curved ring text: glyphs placed one by one around the circle
  const ring = (s, centreDeg, radiusIn, scale, bottom) => { const r = radiusIn * DPI, chars = [...s], widths = chars.map(ch => (textWidth(ch) + 1) * scale), total = widths.reduce((a, b) => a + b, 0) - scale;
    let acc = -total / 2; chars.forEach((ch, i) => { const mid = acc + widths[i] / 2 - scale / 2, ang = (centreDeg * Math.PI / 180) + (bottom ? -1 : 1) * mid / r; acc += widths[i];
      o.save(); o.translate(S.px(cx) + Math.cos(ang) * r, S.px(cy) + Math.sin(ang) * r); o.rotate(ang + (bottom ? -Math.PI / 2 : Math.PI / 2)); drawText(o, ch, Math.round(-textWidth(ch) * scale / 2), Math.round(-3.5 * scale), C.white, { scale }); o.restore(); }); };
  ring('JADESSERTS', -90, 0.85, 8, false);
  ring('MADE WITH LOVE', 90, 0.85, 6, true);
  [180, 0].forEach(deg => { const a = deg * Math.PI / 180, hrt = icon('heart'); o.drawImage(hrt, S.px(cx) + Math.cos(a) * 0.85 * DPI - 16 * 2, S.px(cy) + Math.sin(a) * 0.85 * DPI - 16 * 2 + 6, 64, 64); });
  return S.out.c;
}

window.RENDER = async (Q) => {
  LOGO = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = WORDMARK; });
  const out = {}; const put = (k, c) => { out[k] = c.toDataURL('image/png'); };
  put('business-front', businessFront()); put('business-back', businessBack(Q)); put('loyalty-front', loyaltyFront()); put('loyalty-back', loyaltyBack());
  put('insert', insert(Q)); put('seal', seal());
  return out;
};
})();
