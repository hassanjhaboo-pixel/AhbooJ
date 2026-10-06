// "How was your box?" — Cherry & Bomb survey the villagers outside the Jadesserts bakery. HD-2D pixel film.
// Inlined before this file by build.mjs: sprites (duo, solo, shadow, toCanvas), villagers (villager, VILLAGERS, randomVillager, vToCanvas),
// font (drawText, textWidth, wrap), and globals FMT, TL, WORDMARK.
(function () {
'use strict';
const TALL = FMT === '9x16', W = 1080, H = TALL ? 1920 : 1080, S = TALL ? 7 : 5, AW = W / S, AH = H / S, U = TALL ? 6 : 5, UW = W / U, UH = H / U;
const GY = TALL ? 176 : 122, BY = GY - 30;                 // ground line (table) and the bakery's base
const HY = TALL ? { box: 214, boxH: 58, card: 22 } : { box: 152, boxH: 58, card: 6 };
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const main = cv.getContext('2d');
const EV = TL.ev, AT = TL.at, IVS = TL.interviews, LINES = TL.lines, CAST = TL.cast;

// ------------------------------------------------------------------ utils
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = k => { k = clamp(k); return k * k * (3 - 2 * k); }, easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeIO = k => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const backOut = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const win = (t, a, b) => clamp((t - a) / (b - a));
function rng(seed) { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c, g }; }
const P = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function disc(g, cx, cy, r, col) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) P(g, x, y, 1, 1, typeof col === 'function' ? col(dx / r, dy / r) : col); } }
function mixHex(a, b, k) { const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',') + ')'; }
function outlineCanvas(c, col) { const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height, add = [];
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) add.push([x, y]);
  g.fillStyle = col; add.forEach(([x, y]) => g.fillRect(x, y, 1, 1)); return c; }
const cache = new Map(); function cached(k, fn) { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; }
const C = { ink: '#4a2236', cream: '#fff4dc', pink: '#f4636f', pinkD: '#dd4652', wood: '#c48a55', woodD: '#9c6a3c', woodL: '#dba56f', woodO: '#5e3b22', leaf: '#7fc794', leafD: '#5ba574', leafL: '#a3dcb2' };

// ------------------------------------------------------------------ camera + drawing
let ctx = main, cam = { x: 0, y: AH / 2, z: 1, sx: 0, sy: 0 };
const toSX = lx => W / 2 + (lx - cam.x) * S * cam.z + cam.sx, toSY = wy => H / 2 + (wy - cam.y) * S * cam.z + cam.sy;
function blit(img, lx, wy, o = {}) { const k = S * cam.z * (o.scale || 1), w = img.width * k, h = img.height * k * (o.sy || 1); let x = toSX(lx), y = toSY(wy);
  if (o.anchor) { x -= o.anchor[0] * w; y -= o.anchor[1] * h; } if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha);
  if (o.flip) { ctx.save(); ctx.translate(Math.round(x + w), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, Math.round(w), Math.round(h)); ctx.restore(); }
  else ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); ctx.globalAlpha = 1; }
function hud(img, ax, ay, o = {}) { const k = U * (o.scale || 1), w = img.width * k, h = img.height * k; let x = ax * U, y = ay * U; if (o.anchor) { x -= o.anchor[0] * w; y -= o.anchor[1] * h; }
  if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha); ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); ctx.globalAlpha = 1; }
function hudText(s, ax, ay, col, o = {}) { ctx.save(); if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha); drawText(ctx, s, Math.round(ax * U), Math.round(ay * U), col, { scale: U * (o.k || 1), upto: o.upto }); ctx.restore(); }
function panel(w, h, fill = C.cream) { return cached('pn' + w + 'x' + h + fill, () => { const { c, g } = mk(w + 2, h + 2); P(g, 1, 1, w, h, C.wood); P(g, 1, 1, w, 1, C.woodL); P(g, 1, h, w, 1, C.woodD); P(g, 4, 4, w - 6, h - 6, fill); outlineCanvas(c, C.woodO); return c; }); }
let WM; function WMpix(w) { return cached('wm' + w, () => { const h = Math.round(w * WM.height / WM.width), big = mk(w * 4, h * 4); big.g.imageSmoothingEnabled = true; big.g.drawImage(WM, 0, 0, w * 4, h * 4);
  const { c, g } = mk(w, h); g.imageSmoothingEnabled = true; g.drawImage(big.c, 0, 0, w, h); const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; g.putImageData(d, 0, 0); return c; }); }

// ------------------------------------------------------------------ the set: bakery, plaza, sky, table, banner, mailbox
const MAILBOX = { x: 44, y: BY - 2 };
function bakery(t) {
  const lit = Math.floor(t * 2) % 2;
  return cached('bakery' + lit, () => {
    const w = 150, h = 112, { c, g } = mk(w, h), base = h - 1;
    // roof
    for (let y = 0; y < 22; y++) { const inset = Math.round((22 - y) * 1.6); P(g, 6 + inset, 8 + y, w - 12 - inset * 2, 1, y % 3 === 2 ? '#c94a5a' : '#e5677a'); }
    P(g, 112, 0, 10, 16, '#b07a6a'); P(g, 110, 0, 14, 3, '#8e5a4a');
    // walls
    P(g, 8, 30, w - 16, base - 30, '#fff4e6'); for (let y = 34; y < base; y += 6) P(g, 8, y, w - 16, 1, '#f6e2cf');
    P(g, 8, base - 6, w - 16, 6, '#e7c3a5'); for (let x = 10; x < w - 10; x += 8) P(g, x, base - 6, 1, 6, '#d6ab8a');
    // sign board with the logo
    P(g, 28, 32, 94, 22, C.wood); P(g, 30, 34, 90, 18, C.cream); g.drawImage(WMpix(84), 33, 36);
    // awning (striped, scalloped)
    for (let x = 8; x < w - 8; x++) { const stripe = Math.floor((x - 8) / 7) % 2; P(g, x, 56, 1, 9, stripe ? '#ffffff' : C.pink); const sc = (x - 8) % 7; if (sc > 0 && sc < 6) P(g, x, 65, 1, 2, stripe ? '#ffffff' : C.pink); }
    P(g, 8, 56, w - 16, 1, C.pinkD);
    // display window with cakes
    P(g, 16, 72, 66, 30, '#cfe9f5'); P(g, 18, 74, 62, 26, '#e8f6fb'); P(g, 18, 88, 62, 2, C.wood); P(g, 18, 99, 62, 1, C.wood);
    const cakes = [['#ffd3dc', '#f4636f'], ['#f2c48d', '#a8673c'], ['#fff3f6', '#e5484d'], ['#ffe08a', '#e2ab5c'], ['#d9f0e2', '#7fc794']];
    cakes.forEach(([a, b], i) => { const x = 22 + i * 12; P(g, x, 81, 8, 7, a); P(g, x, 81, 8, 2, b); P(g, x + 3, 79, 2, 2, '#e5484d'); P(g, x + 1, 93, 6, 6, b); P(g, x + 1, 92, 6, 2, '#ffffff'); });
    P(g, 46, 72, 2, 30, '#ffffff');
    // door with bell
    P(g, 92, 66, 24, 39, '#b07a4a'); P(g, 95, 70, 18, 14, '#e8f6fb'); P(g, 103, 70, 2, 14, '#b07a4a'); P(g, 112, 86, 2, 2, '#ffd166'); P(g, 102, 62, 4, 4, '#ffd166');
    P(g, 96, 90, 16, 10, C.cream); drawText(g, 'OPEN', 97, 91, C.pinkD);
    // flower boxes + string lights
    [[14, 103], [120, 103]].forEach(([x, y]) => { P(g, x, y, 22, 4, C.woodD); for (let i = 0; i < 7; i++) P(g, x + 1 + i * 3, y - 2, 2, 2, ['#ff9aa8', '#ffd166', '#c9b3ea'][i % 3]); });
    for (let x = 12; x < w - 12; x += 6) { const sag = Math.round(Math.sin((x - 12) / (w - 24) * Math.PI * 3) * 1.5); P(g, x, 55 + sag, 2, 2, (x / 6 + lit) % 2 ? '#ffe39a' : '#fff6d6'); }
    // chalkboard easel
    P(g, 122, 76, 22, 18, '#3a4a42'); P(g, 121, 75, 24, 1, C.wood); drawText(g, 'SURVEY', 123, 77, '#ffffff'); drawText(g, 'DAY!', 126, 86, '#ffd166'); P(g, 124, 94, 2, 10, C.woodD); P(g, 140, 94, 2, 10, C.woodD);
    outlineCanvas(c, C.ink); return c;
  });
}
function mailboxImg(flag) { return cached('mb' + flag, () => { const { c, g } = mk(18, 26); P(g, 7, 12, 3, 14, '#8a5a34'); P(g, 1, 2, 15, 11, C.pink); P(g, 1, 2, 15, 3, '#ff8a92'); P(g, 3, 7, 11, 2, C.pinkD); drawText(g, 'J', 6, 4, '#ffffff');
  if (flag) { P(g, 15, -0, 2, 7, '#ffd166'); P(g, 15, 0, 3, 3, '#e5484d'); } else { P(g, 15, 8, 3, 2, '#e5484d'); } outlineCanvas(c, C.ink); return c; }); }
function sky() { return cached('sky', () => { const { c, g } = mk(8, 64); const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#9fd4f3'); gr.addColorStop(0.6, '#d3ecf8'); gr.addColorStop(1, '#ffe5ea'); g.fillStyle = gr; g.fillRect(0, 0, 8, 64); return c; }); }
function treeRow() { return cached('trees', () => { const { c, g } = mk(320, 60), r = rng(9); for (let i = 0; i < 14; i++) { const x = r() * 320, s = 0.8 + r() * 0.6; for (const dx of [-320, 0, 320]) { P(g, x + dx - 1, 60 - 12 * s, 3, 12 * s, '#9a6a43'); disc(g, x + dx, 60 - 12 * s - 7 * s, 8 * s, (a, b) => (a + b < -0.5 ? C.leafL : a + b > 0.5 ? C.leafD : C.leaf)); } } outlineCanvas(c, '#3f6a52'); return c; }); }
function hills() { return cached('hills', () => { const { c, g } = mk(320, 50); for (let x = 0; x < 320; x++) { const h = 22 + 8 * Math.sin(x / 320 * Math.PI * 4 + 1) + 5 * Math.sin(x / 320 * Math.PI * 10); P(g, x, 50 - h, 1, h, '#cdb8ec'); P(g, x, 50 - h, 1, 2, '#ddd0f4'); } return c; }); }
function plaza() { return cached('plaza', () => { const { c, g } = mk(64, 32), r = rng(3); P(g, 0, 0, 64, 32, '#efdcc4'); for (let y = 0; y < 32; y += 6) for (let x = (y / 6) % 2 ? 4 : 0; x < 64; x += 8) { P(g, x, y, 7, 5, r() < 0.5 ? '#e6cfb2' : '#f4e4cf'); P(g, x, y + 5, 7, 1, '#d6bb98'); } return c; }); }
function cloud() { return cached('cloud', () => { const { c, g } = mk(48, 22), r = rng(91); for (let k = 0; k < 6; k++) disc(g, 8 + k * 6 + r() * 3, 13 - Math.sin(k / 5 * Math.PI) * 6, 5 + r() * 3, (a, b) => (b > 0.45 ? '#e8eef9' : '#ffffff')); outlineCanvas(c, '#c6d3ea'); return c; }); }
function tableImg() { return cached('table', () => { const { c, g } = mk(36, 26); P(g, 2, 6, 32, 4, '#ffe4e8'); for (let x = 2; x < 34; x += 4) P(g, x, 6, 2, 4, '#ffbfca'); for (let x = 2; x < 34; x += 4) P(g, x, 10, 2, 7, x % 8 ? '#ffd3dc' : '#ffbfca'); P(g, 2, 10, 32, 7, 'rgba(0,0,0,0)');
  for (let y = 10; y < 17; y++) for (let x = 2; x < 34; x++) P(g, x, y, 1, 1, (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? '#ffd3dc' : '#fff3f4');
  P(g, 16, 17, 4, 9, C.woodD); P(g, 10, 24, 16, 2, C.woodD);
  P(g, 5, 2, 7, 4, '#ffffff'); P(g, 6, 1, 5, 1, '#9aa3ad'); P(g, 6, 3, 5, 1, '#c9d5e8'); // clipboard + cards
  P(g, 15, 1, 4, 5, '#cfe9f5'); P(g, 15, 0, 1, 2, C.pink); P(g, 17, 0, 1, 2, '#7fa8e0'); // pen jar
  P(g, 24, 4, 8, 2, '#e8eef9'); P(g, 27, 1, 2, 3, '#e8eef9'); P(g, 25, -1, 6, 3, '#ffd3dc'); P(g, 27, -2, 2, 1, '#e5484d'); // cupcake on stand
  outlineCanvas(c, C.ink); return c; }); }
function bannerImg() { return cached('banner', () => { const txt = 'HOW WAS YOUR BOX?', tw = textWidth(txt), w = tw + 18, { c, g } = mk(w + 4, 46); P(g, 1, 6, 2, 40, C.woodD); P(g, w + 1, 6, 2, 40, C.woodD);
  P(g, 3, 6, w - 2, 13, '#fff4dc'); for (let x = 3; x < w + 1; x += 6) P(g, x, 19, 3, 2, x % 12 ? C.pink : '#ffd166'); drawText(g, txt, 3 + (w - 2 - tw) / 2, 9, C.pinkD); outlineCanvas(c, C.ink); return c; }); }
function crateImg() { return cached('crate', () => { const { c, g } = mk(16, 9); P(g, 0, 0, 16, 9, C.wood); P(g, 0, 4, 16, 1, C.woodD); P(g, 2, 0, 1, 9, C.woodL); P(g, 13, 0, 1, 9, C.woodL); outlineCanvas(c, C.woodO); return c; }); }
function boxIcon() { return cached('boxi', () => { const { c, g } = mk(12, 10); P(g, 0, 2, 12, 8, '#ffd3dc'); P(g, 0, 2, 12, 2, '#f2a7b7'); P(g, 5, 2, 2, 8, C.pinkD); P(g, 4, 0, 1, 2, C.pinkD); P(g, 7, 0, 1, 2, C.pinkD); outlineCanvas(c, C.ink); return c; }); }

// ------------------------------------------------------------------ cast + acting
const DUO_X = -24, V_X = 22, TABLE_X = -1;
const ORDER = IVS.map(i => i.who);
const RANDOS = Array.from({ length: 70 }, (_, i) => randomVillager(i * 13 + 5));
// queue path (relative to the interview spot), y relative to GY; depth makes later villagers smaller
const QPATH = [[44, -2], [210, -4], [214, -13], [56, -13], [52, -22], [214, -22], [218, -31], [60, -31], [56, -40], [218, -40], [222, -49], [64, -49], [60, -58], [240, -58]];
function pathAt(d) { let acc = 0; for (let i = 1; i < QPATH.length; i++) { const [x0, y0] = QPATH[i - 1], [x1, y1] = QPATH[i], seg = Math.hypot(x1 - x0, y1 - y0); if (acc + seg >= d) { const k = (d - acc) / seg; return [lerp(x0, x1, k), lerp(y0, y1, k)]; } acc += seg; } const [x, y] = QPATH[QPATH.length - 1]; return [x + (d - acc), y]; }
const SLOT = 17;
function lineAt(t) { for (let i = LINES.length - 1; i >= 0; i--) { const l = LINES[i]; if (t >= l.at && t < l.at + l.dur) return l; } return null; }
function envAt(l, t) { const q = Math.floor((t - l.at) * 12) / 12, i = Math.floor(q * l.fps); return l.env[Math.max(0, Math.min(l.env.length - 1, i))] || 0; }
const IN = id => { const a = AT[id]; return a ? [a.at, a.end] : [-1, -1]; };
const POSE = {
  c_intro: { c: { turn: 0.6, look: 0 }, b: { turn: 0.5, look: 0 } }, b_intro: { b: { eyes: 'sly', mouth: 'smirk', turn: 1, look: 0 } }, c_next1: { c: { eyes: 'happy' } },
  m1: { c: { eyes: 'happy' } }, c_aww: { c: { eyes: 'happy', blush: true }, v: { eyes: 'happy' } }, m2: { v: { tear: true, eyes: 'happy' }, b: { eyes: 'blink' } }, b_five: { b: { eyes: 'sly', mouth: 'smirk' } }, m3: { v: { eyes: 'happy', mouth: 'grin' } },
  d1: { v: { mouth: 'flat' } }, b_good: { b: { eyes: 'sly', mouth: 'grit', brow: 'angry' }, v: { eyes: 'shock', sweat: true, mouth: 'o' } },
  d2: { v: { eyes: 'shock', sweat: true, arms: 'up' }, b: { eyes: 'sly', mouth: 'grit' } }, b_thought: { b: { eyes: 'sly', mouth: 'smirk' }, v: { eyes: 'nervous', sweat: true, mouth: 'wobble' } },
  c_pin: { c: { eyes: 'sly', brow: 'flat', mouth: 'flat' }, b: { eyes: 'happy', blush: true }, v: { eyes: 'nervous', mouth: 'wobble', sweat: true } },
  k1: { v: { eyes: 'happy', arms: 'up' }, c: { eyes: 'happy' } }, c_mom: { c: { eyes: 'shock', mouth: 'shock' } }, k2: { v: { eyes: 'happy', mouth: 'grin' }, b: { eyes: 'shock', mouth: 'shock' } },
  b_respect: { b: { eyes: 'sly', mouth: 'smirk', turn: 1, look: 0 }, v: { eyes: 'happy' } },
  r1: { c: { eyes: 'happy' } }, r2: { v: { eyes: 'happy' } }, b_two: { b: { eyes: 'shock' }, v: { eyes: 'happy', mouth: 'grin' } },
  j1: { v: { mouth: 'flat' } }, b_four: { b: { eyes: 'sly', mouth: 'grit' } }, j2: { b: { eyes: 'sly', mouth: 'grit' } }, b_fair: { b: { eyes: 'blink', mouth: 'flat' }, v: { eyes: 'happy', mouth: 'smile' } },
  c_compliment: { c: { eyes: 'happy' }, b: { eyes: 'happy' }, v: { eyes: 'happy' } }, c_love: { c: { eyes: 'happy', turn: 1, look: 0 } }, b_next: { b: { turn: 0.5, look: 0 } },
};
function actors(t) {
  let cur = null; for (const l of LINES) if (t >= l.at - 0.05 && t < l.at + l.dur + 0.6) cur = l;
  const p = (cur && POSE[cur.id]) || {}, c = Object.assign({}, p.c || {}), b = Object.assign({}, p.b || {}), v = Object.assign({}, p.v || {});
  // tension holds
  if (t > EV.goodZoom[0] && t < EV.goodZoom[1]) { Object.assign(b, { eyes: 'sly', mouth: 'grit', brow: 'angry' }); Object.assign(v, { eyes: 'nervous', sweat: true, mouth: 'flat' }); }
  if (t > EV.fourZoom[0] && t < AT.b_four.end) { Object.assign(b, { eyes: Math.floor(t * 9) % 3 ? 'sly' : 'open', mouth: 'grit', brow: 'angry' }); }
  if (t > EV.reveal) { Object.assign(c, { eyes: 'shock', mouth: 'shock', turn: 1, look: 0 }); Object.assign(b, { eyes: 'shock', mouth: 'shock', turn: 1, look: 0 }); }
  const spk = lineAt(t);
  if (spk) { const e = envAt(spk, t), cherryBomb = spk.who === 'cherry' || spk.who === 'bomb';
    const m = cherryBomb ? (e > 0.5 ? 'talk2' : e > 0.14 ? 'talk1' : null) : (e > 0.45 ? 'talk2' : e > 0.12 ? 'talk1' : null);
    if (m) (spk.who === 'cherry' ? c : spk.who === 'bomb' ? b : v).mouth = m;
    if (!cherryBomb) { if (c.look == null && !c.turn) c.look = 1; if (b.look == null && !b.turn) b.look = 1; } }
  const blink = (ph, x) => (x.eyes == null || x.eyes === 'open') && ((t + ph) % 3.9) < 0.12; if (blink(0, c)) c.eyes = 'blink'; if (blink(1.7, b)) b.eyes = 'blink'; if (blink(0.9, v)) v.eyes = 'blink';
  if (t > EV.pin[0] && t < EV.pin[1]) b.item = 'pin';
  return { c, b, v, cur };
}
// where is each named villager / random at time t?  returns [{def, key, x, y, s, flip, walking, ...}]
function crowd(t) {
  const out = [];
  // interview state
  let calledCount = 0; IVS.forEach(iv => { if (t >= iv.step) calledCount++; });
  const shiftK = i => { const iv = IVS[i]; return iv ? easeIO((t - iv.step) / 0.9) : 0; };
  // named villagers
  IVS.forEach((iv, i) => {
    const def = VILLAGERS[iv.who];
    if (t < iv.step) { // in the queue: slot = index among the not-yet-called, sliding forward as others are called
      let slot = i; IVS.forEach((o, j) => { if (j < i) slot -= shiftK(j); });
      const [x, y] = pathAt(slot * SLOT); out.push({ def, key: iv.who, x: V_X + x, y: GY + y, s: 1 + y * 0.007, flip: true, walking: (t > (IVS[i - 1] || {}).step && t < (IVS[i - 1] || {}).step + 0.9), q: true });
    } else if (t < iv.exit) { const k = easeIO((t - iv.step) / 0.9), [x, y] = pathAt(0); out.push({ def, key: iv.who, x: V_X + lerp(x, 0, k), y: GY + lerp(y, 0, k), s: 1, flip: true, walking: k < 1, current: true });
    } else if (t < iv.exit + 1.6) { const k = (t - iv.exit) / 1.6; out.push({ def, key: iv.who, x: V_X + k * 60, y: GY + k * 34, s: 1 + k * 0.3, flip: false, walking: true, leaving: true }); }
  });
  // randoms behind the named ones
  RANDOS.forEach((def, i) => { let slot = IVS.length + i; IVS.forEach((o, j) => { slot -= shiftK(j); });
    const [x, y] = pathAt(slot * SLOT); out.push({ def, key: 'r' + i, x: V_X + x, y: GY + y, s: 1 + y * 0.007, flip: true, walking: IVS.some(o => t > o.step && t < o.step + 0.9), q: true }); });
  return out;
}

// ------------------------------------------------------------------ camera choreography
const STATES = {
  wide: { x: 14, y: TALL ? GY - 34 : GY - 30, z: 1, f: 0 },
  two: { x: -2, y: GY - 34, z: TALL ? 1.5 : 1.95, f: 1 },
  mid: { x: 12, y: GY - 38, z: TALL ? 1.2 : 1.35, f: 0.15 },
  bomb: { x: DUO_X + 12, y: GY - 16, z: TALL ? 3.0 : 3.2, f: 1 },
  vill: { x: V_X, y: GY - 28, z: TALL ? 2.8 : 3.0, f: 1 },
  reveal: { x: TALL ? 72 : 84, y: TALL ? GY - 40 : GY - 36, z: TALL ? 0.56 : 0.52, f: 0 },
};
const KEYS = [[0, 'wide', 0]];
IVS.forEach((iv, i) => { KEYS.push([iv.step, 'two', 1.2]); KEYS.push([iv.card + 0.7, 'mid', 1.1]); });
KEYS.push([EV.goodZoom[0], 'bomb', 0.22], [EV.panic[0], 'vill', 0.16], [EV.panic[1], 'two', 0.45]);
KEYS.push([EV.fourZoom[0], 'bomb', 0.3], [EV.fourZoom[1], 'two', 0.4]);
KEYS.push([EV.reveal, 'reveal', 1.7]);
KEYS.sort((a, b) => a[0] - b[0]);
function camAt(t) {
  let st = Object.assign({}, STATES.wide);
  for (let i = 0; i < KEYS.length; i++) { const [kt, name, dur] = KEYS[i]; if (t < kt) break; const k = dur ? easeIO((t - kt) / dur) : 1, to = STATES[name]; st = { x: lerp(st.x, to.x, k), y: lerp(st.y, to.y, k), z: lerp(st.z, to.z, k), f: lerp(st.f, to.f, k), cu: name === 'bomb' || name === 'vill' ? k : 0 }; }
  // the opening drifts in a touch
  st.z *= 1 + 0.04 * ss(t / 4) * (t < (IVS[0] || {}).step ? 1 : 0);
  return st;
}
const focusAt = t => camAt(t).f; // 0 = wide, 1 = intimate

// ------------------------------------------------------------------ review cards
function starImg(on) { return cached('star' + on, () => { const { c, g } = mk(11, 11), pts = [[5, 0], [6, 3], [10, 4], [7, 6], [8, 10], [5, 8], [2, 10], [3, 6], [0, 4], [4, 3]];
  g.fillStyle = on ? '#ffd166' : '#eadbcb'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + 0.5, y + 0.5) : g.moveTo(x + 0.5, y + 0.5))); g.closePath(); g.fill();
  const d = g.getImageData(0, 0, 11, 11); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; g.putImageData(d, 0, 0); if (on) P(g, 4, 3, 2, 2, '#fff1b8'); outlineCanvas(c, on ? '#c98a1a' : '#c9b4a2'); return c; }); }
function drawCard(t) {
  for (let n = 0; n < IVS.length; n++) {
    const iv = IVS[n], u = t - iv.card, crayonEnd = iv.crayon ? 1.9 : 0, flyAt = 1.9 + crayonEnd; if (u < 0 || u > flyAt + 0.6) continue;
    const cw = 150, ch = iv.note ? 84 : 78, cx = (UW - cw) / 2, cy = HY.card;
    const pop = u < 0.25 ? backOut(u / 0.25) : 1, fly = clamp((u - flyAt) / 0.55);
    ctx.save();
    // fly to the mailbox (screen point) when done
    const mbx = toSX(MAILBOX.x + 8) / U, mby = toSY(MAILBOX.y - 18) / U;
    const ox = cx + cw / 2, oy = cy + ch / 2, tx = lerp(ox, mbx, easeIO(fly)), ty = lerp(oy, mby, easeIO(fly)) - Math.sin(fly * Math.PI) * 20, sc = pop * lerp(1, 0.08, easeIO(fly));
    ctx.translate(tx * U, ty * U); ctx.scale(sc, sc); ctx.rotate((fly * 0.6) - 0.02); ctx.translate(-ox * U, -oy * U);
    hud(panel(cw, ch, '#fffaf0'), cx, cy);
    const head = `REVIEW #${n + 1}`; hudText(head, cx + (cw - textWidth(head)) / 2, cy + 7, '#9c6a3c');
    for (let s = 0; s < 5; s++) { const st = 0.3 + s * 0.16, on = s < iv.stars && u > st, k = on ? (u - st < 0.15 ? backOut((u - st) / 0.15) : 1) : 1; hud(starImg(on), cx + cw / 2 - 31 + s * 13 + 5.5, cy + 24, { anchor: [0.5, 0.5], scale: k }); }
    // crayon fifth star (Bomb)
    if (iv.crayon && u > 1.9) { const k = clamp((u - 1.9) / 0.9), pts = [[5, 0], [6, 3], [10, 4], [7, 6], [8, 10], [5, 8], [2, 10], [3, 6], [0, 4], [4, 3], [5, 0]], n2 = Math.floor(k * (pts.length - 1) * 6);
      ctx.fillStyle = '#ff7a2e'; const sx0 = cx + cw / 2 - 31 + 4 * 13, sy0 = cy + 18.5;
      for (let q = 0; q < n2; q++) { const a = Math.floor(q / 6), f = (q % 6) / 6, [x0, y0] = pts[a], [x1, y1] = pts[a + 1]; const x = lerp(x0, x1, f) + Math.sin(q * 2.1) * 0.4, y = lerp(y0, y1, f) + Math.cos(q * 1.7) * 0.4; ctx.fillRect(Math.round((sx0 + x) * U), Math.round((sy0 + y) * U), U, U); }
      if (u > 2.9) hudText('(+1 by Bomb)', cx + cw - 6 - textWidth('(+1 by Bomb)'), cy + 31, '#ff7a2e'); }
    const q = '"' + iv.quote + '"', rows = wrap(q, cw - 16); rows.slice(0, 2).forEach((r, i) => hudText(r, cx + (cw - textWidth(r)) / 2, cy + 37 + i * 11, C.ink, { alpha: clamp((u - 0.9) / 0.2) }));
    hudText(iv.sign, cx + cw - 8 - textWidth(iv.sign), cy + ch - 15 - (iv.note ? 9 : 0), C.pinkD, { alpha: clamp((u - 1.0) / 0.2) });
    if (iv.note) hudText(iv.note, cx + (cw - textWidth(iv.note)) / 2, cy + ch - 15, '#9aa3ad', { alpha: clamp((u - 1.1) / 0.2) });
    // stamp
    const stT = 1.35 + (iv.crayon ? 1.6 : 0); if (u > stT) { const k = clamp((u - stT) / 0.14), s2 = lerp(1.8, 1, easeOut(k)), txt = 'SENT TO JADE ♥', tw = textWidth(txt) + 8;
      ctx.save(); const sx = (cx + 10 + tw / 2) * U, sy = (cy + ch - 22) * U; ctx.translate(sx, sy); ctx.rotate(-0.13); ctx.scale(s2, s2); ctx.globalAlpha = clamp(k * 1.2) * 0.92;
      ctx.strokeStyle = '#e5484d'; ctx.lineWidth = U; ctx.strokeRect(-tw / 2 * U, -6 * U, tw * U, 12 * U); drawText(ctx, txt, Math.round(-tw / 2 * U + 4 * U), Math.round(-3.5 * U), '#e5484d', { scale: U }); ctx.restore(); }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ dialogue box
function paginate(text, tw, maxRows) { const sents = text.match(/[^.!?…]+[.!?…—]*\s*/g) || [text], pages = []; let cur = '';
  const push = s => { const rows = wrap(s.trim(), tw); pages.push({ rows, n: rows.reduce((a, r) => a + r.length, 0) }); };
  for (const se of sents) { const t2 = cur ? cur + se : se; if (wrap(t2.trim(), tw).length <= maxRows) cur = t2; else { if (cur) push(cur); cur = se; } } if (cur.trim()) push(cur); return pages; }
function boxState(t) { let cur = null; for (const l of LINES) if (t >= l.at && t < l.at + l.dur + 0.9) cur = l; if (!cur) return null; const i = LINES.indexOf(cur), next = LINES[i + 1], prev = LINES[i - 1];
  const cont = next && next.at - (cur.at + cur.dur) < 1.3, hold = cont ? next.at : cur.at + cur.dur + 0.9; if (t >= hold) return null;
  const startsConv = !prev || cur.at - (prev.at + prev.dur) >= 1.3; return { l: cur, k: Math.min(startsConv ? easeOut((t - cur.at + 0.05) / 0.16) : 1, cont ? 1 : clamp((hold - t) / 0.16)) }; }
function portrait(who, a, t) {
  if (who === 'cherry' || who === 'bomb') { const face = Object.assign({}, who === 'cherry' ? a.c : a.b, { turn: 1, look: 0, arms: 'down' }); delete face.item; return [cached('solo' + who + JSON.stringify(face), () => toCanvas(solo(who, face))), 1, 8]; }
  const o = Object.assign({}, a.v); delete o.arms; const def = VILLAGERS[who]; return cached('vp' + who + JSON.stringify(o), () => { const s2 = villager(def, o); return [vToCanvas(s2), 1, s2.headY]; });
}
function drawBox(t) {
  if (t > EV.endcard - 0.1) return; const st = boxState(t); if (!st) return; const { l, k } = st, cast = CAST[l.who], bx = 5, bw = UW - 10, bh = HY.boxH, by = HY.box + (1 - k) * 8;
  ctx.globalAlpha = clamp(k * 1.4); hud(panel(bw, bh), bx, by); const pw = 44; hud(panel(pw, pw, '#ffe9ec'), bx + 6, by + 7);
  const a = actors(t), [img, , dy] = portrait(l.who, a, t);
  ctx.save(); ctx.beginPath(); ctx.rect((bx + 10) * U, (by + 11) * U, (pw - 6) * U, (pw - 6) * U); ctx.clip();
  if (l.who === 'cherry' || l.who === 'bomb') hud(img, bx + 11, by + 8); else hud(img, bx + 6 + pw / 2 + 1, by + 13 - dy, { anchor: [0.5, 0] }); ctx.restore();
  const nw = textWidth(cast.name) + 12; hud(panel(nw, 14, cast.plate), bx + 6, by - 9); hudText(cast.name, bx + 12, by - 5, '#ffffff');
  const tx = bx + pw + 13, tw = bw - pw - 20, pages = cached('pg' + l.id + tw, () => paginate(l.text, tw, 3));
  const fr = clamp((t - l.at) * l.fps, 0, l.rev.length - 1), rv = t >= l.at + l.dur ? 1 : l.rev[Math.floor(fr)] || 0, total = pages.reduce((s2, pg) => s2 + pg.n, 0);
  let shown = Math.ceil(rv * total * 1.03), pi = 0; while (pi < pages.length - 1 && shown > pages[pi].n + 2) { shown -= pages[pi].n; pi++; }
  const rows = pages[pi].rows, ty0 = by + 9 + Math.max(0, (3 - rows.length) * 6);
  rows.forEach((r, i) => { const n = Math.max(0, Math.min(r.length, shown)); shown -= r.length; if (n > 0) hudText(r, tx, ty0 + i * 12, C.ink, { upto: n }); });
  if (rv >= 1 && Math.floor(t * 2.5) % 2 === 0) hudText('▼', bx + bw - 12, by + bh - 11, C.pinkD); ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ emotes
function emoteImg(kind) { return cached('emo' + kind, () => { const { c, g } = mk(15, 15); P(g, 1, 1, 13, 11, '#fff'); P(g, 0, 2, 15, 9, '#fff'); P(g, 2, 0, 11, 13, '#fff'); P(g, 5, 12, 4, 2, '#fff'); P(g, 5, 14, 2, 1, '#fff');
  const col = { '!': '#e5484d', '?': '#4a6fa5', '…': C.ink, '♥': C.pink, '♪': '#7a5cc0', anger: '#e5484d' }[kind];
  if (kind === 'anger') [[4, 3], [5, 3], [3, 4], [3, 5], [9, 3], [10, 3], [11, 4], [11, 5], [3, 8], [3, 9], [4, 10], [5, 10], [11, 8], [11, 9], [10, 10], [9, 10]].forEach(([x, y]) => P(g, x, y, 1, 1, col));
  else if (kind === '…') [3, 7, 11].forEach(x => P(g, x, 7, 2, 2, col)); else drawText(g, kind, kind === '!' ? 7 : 5, 2, col); outlineCanvas(c, C.ink); return c; }); }
const EMO = [[AT.c_aww.at, 'c', '♥'], [AT.m3.at, 'v', '♥'], [AT.d1.end + 0.25, 'b', 'anger'], [AT.b_good.at, 'v', '!'], [AT.c_pin.at, 'c', 'anger'], [AT.k1.at + 0.2, 'v', '♪'],
  [AT.k2.end - 0.3, 'b', '!'], [EV.boxSlide + 0.4, 'v', '♥'], [AT.j1.end + 0.2, 'b', 'anger'], [AT.b_fair.at, 'b', '…'], [AT.c_compliment.end - 0.2, 'v', '♥'], [AT.c_love.at, 'c', '♥'], [EV.reveal + 0.5, 'b', '!'], [EV.reveal + 0.6, 'c', '!']];
function emotes(t, heads) { for (const [at, who, kind] of EMO) { const u = t - at; if (u < 0 || u > 1.4 || !heads[who]) continue; const k = u < 0.2 ? backOut(u / 0.2) : u > 1.15 ? 1 - (u - 1.15) / 0.25 : 1;
  blit(emoteImg(kind), heads[who][0], heads[who][1] - 3 + Math.sin(u * 10) * 0.6, { anchor: [0.5, 1], scale: k, alpha: k }); } }

// ------------------------------------------------------------------ compose
const bgBuf = mk(W, H);
function drawBackground(t, focus) {
  // sky, hills, trees, bakery, mailbox, queue (everything behind the interview) -> blurred + dimmed when intimate
  const prev = ctx; ctx = bgBuf.g; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sky(), 0, 0, W, H);
  for (let i = 0; i < 3; i++) { const x = ((i * 130 + t * 2.5) % 420) - 160; blit(cloud(), x + cam.x * 0.9 - 40, BY - 130 + i * 18 - (TALL ? 30 : 0), { alpha: 0.95 }); }
  for (let k = -3; k < 4; k++) blit(hills(), k * 320 + cam.x * 0.6 - 160, BY - 92);
  for (let k = -3; k < 4; k++) blit(treeRow(), k * 320 + cam.x * 0.3 - 160, BY - 62);
  // plaza (fills the ground)
  ctx.fillStyle = '#efdcc4'; ctx.fillRect(0, Math.round(toSY(BY - 1)), W, H);
  for (let y = BY - 1; y < GY + 200; y += 32) for (let x = Math.floor((cam.x - 400) / 64) * 64; x < cam.x + 400; x += 64) blit(plaza(), x, y);
  blit(bakery(t), -96, BY - 112 + 1);
  const mbFlag = IVS.some(iv => t > iv.card + (iv.crayon ? 3.8 : 2.4) && t < iv.card + (iv.crayon ? 5.2 : 3.8));
  blit(mailboxImg(mbFlag ? 1 : 0), MAILBOX.x, MAILBOX.y - 26);
  // queue (background people) — sorted back to front
  const people = crowd(t).filter(p => p.q || p.leaving).sort((a, b) => a.y - b.y);
  for (const p of people) drawVillager(p, t, p.q ? 1 - focus : 1 - focus * 0.6);
  ctx = prev;
  // composite with depth of field
  const blur = focus * 7;
  ctx.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none'; ctx.drawImage(bgBuf.c, 0, 0); ctx.filter = 'none';
  if (focus > 0) { ctx.fillStyle = `rgba(40,20,36,${0.42 * focus})`; ctx.fillRect(0, 0, W, H); }
}
function drawVillager(p, t, alpha = 1) {
  if (alpha <= 0.02) return;
  const a = p.current ? actors(t).v : {}, frame = p.walking ? Math.floor(t * 7) % 2 : 0;
  const o = Object.assign({}, a, { frame }); const key = 'v' + p.key + JSON.stringify(o), spr = cached(key, () => { const s = villager(p.def, o); return { c: vToCanvas(s), ax: s.ax, ay: s.ay, headY: s.headY }; });
  const lift = p.key === 'kiki' && p.current ? 8 : 0;
  if (lift) blit(crateImg(), p.x - 8, p.y - 9, { scale: 1 });
  const sh = cached('shv', () => { const { c, g } = mk(22, 4); g.fillStyle = 'rgba(40,20,30,0.25)'; g.beginPath(); g.ellipse(11, 2, 11, 2, 0, 0, 7); g.fill(); return c; });
  if (!lift) blit(sh, p.x - 11 * p.s, p.y - 2, { scale: p.s, alpha });
  blit(spr.c, p.x - (p.flip ? spr.c.width - spr.ax : spr.ax) * p.s, p.y - lift - spr.ay * p.s, { scale: p.s, flip: p.flip, alpha });
  return [p.x + (p.flip ? -2 : 2), p.y - lift - (spr.ay - spr.headY) * p.s];
}
function frame(t) {
  ctx = main; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.imageSmoothingEnabled = false;
  if (t >= EV.endcard) { endCard(t); return; }
  const st = camAt(t); cam = { x: st.x, y: st.y, z: st.z, sx: 0, sy: 0 };
  // tension shake + panic shake
  if (t > EV.panic[0] && t < EV.panic[1]) { cam.sx = Math.round(Math.sin(t * 70) * 4); cam.sy = Math.round(Math.cos(t * 53) * 3); }
  const focus = focusAt(t);
  drawBackground(t, focus);
  // spotlight on the table (smooth light pool)
  if (focus > 0) { const lx = toSX(-3), ly = toSY(GY - 26), R = 70 * S * cam.z; const g = ctx.createRadialGradient(lx, ly, R * 0.15, lx, ly, R); g.addColorStop(0, `rgba(255,214,150,${0.22 * focus})`); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  // banner, duo, table, current villager
  blit(bannerImg(), TABLE_X - bannerImg().width / 2, GY - 86);
  const a = actors(t), bob = Math.round(Math.sin(t * 2.2) * 0.5 + 0.5) * 0;
  const o = { view: 'side', walking: false, frame: 0, cherry: a.c, bomb: a.b };
  const dk = JSON.stringify(o), dspr = cached(dk, () => { const d = duo(o); return { c: toCanvas(d), ax: d.ax, ay: d.ay }; });
  const sh = cached('shd', () => toCanvas(shadow(50))); blit(sh, DUO_X - 26, GY - 2);
  if (st.cu > 0.5) blit(tableImg(), TABLE_X - 18, GY - 25); // close-ups: nothing in front of the faces
  blit(dspr.c, DUO_X - dspr.ax, GY - dspr.ay - bob);
  const heads = { c: [DUO_X - 11, GY - 50], b: [DUO_X + 11, GY - 54] };
  if (!(st.cu > 0.5)) blit(tableImg(), TABLE_X - 18, GY - 25);
  // second box for Ms. Rosa slides across the table
  const bs = t - EV.boxSlide; if (bs > 0 && t < IVS[3].exit) { const k = easeOut(bs / 0.4); blit(boxIcon(), lerp(TABLE_X - 12, TABLE_X + 6, k), GY - 33); }
  // the rolling pin falls when Cherry says so
  const pf = t - EV.pin[1]; if (pf > 0 && pf < 0.5) { const k = pf / 0.5; blit(cached('pinI', () => { const g2 = mk(20, 6); P(g2.g, 3, 1, 13, 4, '#e8c08a'); P(g2.g, 0, 2, 3, 2, '#b07a4a'); P(g2.g, 16, 2, 3, 2, '#b07a4a'); outlineCanvas(g2.c, C.ink); return g2.c; }), DUO_X + 16, GY - 30 + 28 * k * k); }
  const cur = crowd(t).filter(p => p.current);
  for (const p of cur) { const h2 = drawVillager(p, t); if (h2) heads.v = h2; }
  // tension grade: red-dark vignette on the "Good?" and "Four?"
  const tense = Math.max(win(t, EV.goodZoom[0], EV.goodZoom[0] + 0.3) * (1 - win(t, EV.panic[0], EV.panic[0] + 0.2)), win(t, EV.fourZoom[0], EV.fourZoom[0] + 0.3) * (1 - win(t, EV.fourZoom[1], EV.fourZoom[1] + 0.3)));
  if (tense > 0) { const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H * 0.45, Math.max(W, H) * 0.7); vg.addColorStop(0, 'rgba(120,0,20,0)'); vg.addColorStop(1, `rgba(90,0,20,${0.7 * tense})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  emotes(t, heads);
  // soft vignette always
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(40,20,40,0)'); vg.addColorStop(1, 'rgba(40,20,40,0.26)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // HUD
  drawCard(t); drawBox(t);
  // reveal sting title
  const ru = t - EV.reveal - 1.6; if (ru > 0) { const s = '...SO MANY REVIEWS', k = backOut(ru / 0.3); ctx.save(); ctx.globalAlpha = clamp(ru / 0.2); hud(panel(textWidth(s) + 14, 16, '#4a2236'), (UW - textWidth(s) - 14) / 2, TALL ? 40 : 10); hudText(s, (UW - textWidth(s)) / 2, (TALL ? 40 : 10) + 5, '#fff4dc'); ctx.restore(); }
  if (t > EV.endcard - 0.35) { ctx.fillStyle = `rgba(0,0,0,${clamp((t - EV.endcard + 0.35) / 0.35)})`; ctx.fillRect(0, 0, W, H); }
}
function chatIcon() { return cached('chatI', () => { const { c, g } = mk(18, 18); disc(g, 9, 8.5, 7.5, '#3ccf6e'); P(g, 2, 13, 4, 4, '#3ccf6e'); P(g, 6, 5, 2, 3, '#fff'); P(g, 7, 8, 2, 2, '#fff'); P(g, 9, 10, 3, 2, '#fff'); outlineCanvas(c, '#1f7a4d'); return c; }); }
function endCard(t) {
  const u = t - EV.endcard;
  const bg = cached('ging', () => { const { c, g } = mk(16, 16); P(g, 0, 0, 16, 16, '#fff3f4'); P(g, 0, 0, 8, 16, '#ffd9df'); P(g, 0, 0, 16, 8, '#ffd9df'); P(g, 0, 0, 8, 8, '#ffbfca'); return c; });
  for (let y = 0; y < UH; y += 16) for (let x = -16; x < UW + 16; x += 16) hud(bg, x + ((u * 4) % 16), y);
  const k = easeOut(u / 0.6), lg = WMpix(150), ly = TALL ? 40 : 10; hud(lg, UW / 2, ly + (1 - k) * -30, { anchor: [0.5, 0], alpha: k });
  const pw = 172, ph = 104, px = (UW - pw) / 2, py = ly + lg.height + (TALL ? 18 : 8), k2 = easeOut((u - 0.4) / 0.5);
  if (k2 > 0) { ctx.globalAlpha = k2; const yo = (1 - k2) * 12; hud(panel(pw, ph), px, py + yo);
    const t1 = 'Your turn!', t2 = 'Tell Jade how YOUR', t3 = 'box was ♥'; hudText(t1, px + (pw - textWidth(t1)) / 2, py + 9 + yo, C.pinkD); hudText(t2, px + (pw - textWidth(t2)) / 2, py + 24 + yo, C.ink); hudText(t3, px + (pw - textWidth(t3)) / 2, py + 35 + yo, C.ink);
    for (let s = 0; s < 5; s++) { const on = u > 1.0 + s * 0.15; hud(starImg(on), px + pw / 2 - 31 + s * 13, py + 49 + yo, { scale: on && u - 1 - s * 0.15 < 0.15 ? backOut((u - 1 - s * 0.15) / 0.15) : 1 }); }
    hud(chatIcon(), px + 16, py + ph - 30 + yo); hudText('WhatsApp', px + 38, py + ph - 30 + yo, '#1f7a4d'); hudText('(868) 715-4817', px + 38, py + ph - 19 + yo, C.ink); ctx.globalAlpha = 1; }
  const k3 = clamp((u - 1.6) / 0.5); if (k3 > 0) { const s = 'Order · Pre-order · Gift a box'; hudText(s, (UW - textWidth(s)) / 2, py + ph + (TALL ? 12 : 6), C.pinkD, { alpha: k3 }); }
  const k4 = easeOut((u - 0.8) / 0.6); if (k4 > 0) { const lu = AT.c_turn, talking = t > lu.at && t < lu.end, f = Math.floor(u * 6) % 8;
    const o = { view: 'front', cherry: { turn: 1, look: 0, arms: 'wave', eyes: 'happy', mouth: talking && Math.floor(u * 9) % 2 ? 'talk2' : 'smile' }, bomb: { turn: 1, look: 0, arms: 'up' }, frame: f };
    const spr = cached('end' + JSON.stringify(o), () => toCanvas(duo(o))); hud(spr, TALL ? UW / 2 : UW - 28, TALL ? UH - 96 + (1 - k4) * 30 : UH - 46 + (1 - k4) * 30, { anchor: [0.5, 0], scale: TALL ? 1 : 0.6 }); }
  if (u < 0.4) { ctx.fillStyle = `rgba(0,0,0,${1 - u / 0.4})`; ctx.fillRect(0, 0, W, H); }
}

window.MG_duration = TL.duration; window.MG_fps = 30; window.MG_size = [W, H];
window.MG_seek = t => frame(Math.max(0, Math.min(TL.duration - 1e-3, t)));
WM = new Image(); WM.onload = () => { frame(0); window.MG_ready = true; }; WM.src = WORDMARK;
})();
