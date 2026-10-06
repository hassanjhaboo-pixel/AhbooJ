// Cherry & Bomb — procedural pixel sprites (deterministic, no assets).
// Every call returns a palette-indexed grid; toCanvas() rasterises it. Works in the browser (and in node for the grid).
//
//   duo({ view: 'side'|'front'|'back', frame: 0..7 (walk), walking: bool, cherry: {...}, bomb: {...}, dusty, jump })
//   per character: { eyes: 'open'|'blink'|'happy'|'sly'|'shock'|'shut', look: -1..1, turn: 0..1 (0 = 3/4 right, 1 = to camera),
//                    mouth: 'smile'|'grin'|'talk1'|'talk2'|'shock'|'flat'|'smirk'|'grit', arms: 'swing'|'down'|'up'|'wave'|'point'|'hold'|'shrug'|'behind',
//                    blush: bool, dusty: bool, item: 'scissors'|'sack'|'box'|null, dy: extra lift }
// Anchor: (ax, ay) = ground point under the pair. Pixel art scale is 1 grid px; scale up with nearest-neighbour.

export const PAL = {
  O: '#4a2236',          // outline
  W: '#fff6f1', P: '#2a1620', // eye white, pupil
  c0: '#ff9aa0', c1: '#f2626f', c2: '#d6434f', c3: '#a8303f',   // Cherry: light, base, shade, dark
  b0: '#ef5a66', b1: '#d23447', b2: '#ad2638', b3: '#7f1a2a',   // Bomb
  g1: '#79b77d', g2: '#4f8a58', l1: '#86c98d', l2: '#5f9f68',   // stem, leaf
  bl: '#ff8fa3', md: '#6e1828', tg: '#ff7c8e', th: '#ffffff',   // blush, mouth dark, tongue, teeth
  hi: '#fff4ee', fl: '#fbf7f2', fs: '#e9e1d8',                  // highlight, flour, flour shade
  k1: '#a7a2b3', k2: '#6d6880',                                 // scissors steel
  s1: '#e8d2a6', s2: '#c9ad7c', s3: '#9c825a',                  // sack
  x1: '#ffd3dc', x2: '#f2a7b7', xr: '#d6434f',                  // box pink + ribbon
};

class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
  set(x, y, v) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = v; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : null; }
  // 4-neighbour 1px outline around everything drawn in this layer
  outline(col = 'O') {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y) == null && (this.get(x - 1, y) != null || this.get(x + 1, y) != null || this.get(x, y - 1) != null || this.get(x, y + 1) != null)) add.push([x, y]);
    add.forEach(([x, y]) => this.set(x, y, col)); return this;
  }
  over(L) { for (let i = 0; i < L.c.length; i++) if (L.c[i] != null) this.c[i] = L.c[i]; return this; }
}
const layer = (G) => new Grid(G.w, G.h);

function ellipse(L, cx, cy, rx, ry, col) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) L.set(x, y, typeof col === 'function' ? col(dx, dy, x, y) : col);
  }
}
// capsule stroke: pixels whose centres are within r of the segment
function stroke(L, x0, y0, x1, y1, r, col) {
  const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1;
  for (let y = Math.floor(Math.min(y0, y1) - r - 1); y <= Math.ceil(Math.max(y0, y1) + r + 1); y++) for (let x = Math.floor(Math.min(x0, x1) - r - 1); x <= Math.ceil(Math.max(x0, x1) + r + 1); x++) {
    const px = x + 0.5, py = y + 0.5, t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / l2));
    const dx = px - (x0 + t * vx), dy = py - (y0 + t * vy);
    if (dx * dx + dy * dy <= r * r) L.set(x, y, typeof col === 'function' ? col(t, x, y) : col);
  }
}
const hash = (x, y, s = 1) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------- sphere body with banded light from the top-left ----------
const LIGHT = (() => { const v = [-0.5, -0.62, 0.6], n = Math.hypot(...v); return v.map(a => a / n); })();
function body(L, cx, cy, R, tone, back) {
  const t = tone === 'cherry' ? ['c0', 'c1', 'c2', 'c3'] : ['b0', 'b1', 'b2', 'b3'];
  const lx = back ? -LIGHT[0] : LIGHT[0];
  ellipse(L, cx, cy, R, R * 0.95, (dx, dy) => {
    const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)), d = dx * lx + dy * LIGHT[1] + nz * LIGHT[2];
    return d > 0.86 ? t[0] : d > 0.42 ? t[1] : d > 0.08 ? t[2] : t[3];
  });
  L.outline();
  // specular: a little window highlight like the kit
  const hx = back ? cx + R * 0.42 : cx - R * 0.48, hy = cy - R * 0.5, s = back ? -1 : 1;
  [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]].forEach(([x, y]) => L.set(hx + x * s, hy + y, 'hi'));
  L.set(hx + 3 * s, hy - 2, 'hi');
  // stem dimple
  L.set(cx + (back ? -2 : 2), cy - R * 0.95 + 1, t[3]); L.set(cx + (back ? -1 : 3), cy - R * 0.95 + 1, t[3]);
}

// ---------- faces (3/4 right; turn → 1 faces the camera) ----------
function eye(L, x, y, w, h, o, side, which) {
  const E = layer(L), rx = w / 2, ry = h / 2;
  if (o.eyes === 'blink' || o.eyes === 'shut') { // closed: a lid line
    for (let i = -Math.floor(rx); i <= Math.floor(rx); i++) L.set(x + i, y + 1, 'O');
    if (which === 'cherry') L.set(x + side * (Math.floor(rx) + 1), y, 'O');
    return;
  }
  if (o.eyes === 'happy') { // ^ ^
    for (let i = -Math.floor(rx); i <= Math.floor(rx); i++) L.set(x + i, y + (Math.abs(i) >= Math.floor(rx) ? 1 : 0), 'O');
    if (which === 'cherry') L.set(x + side * (Math.floor(rx) + 1), y - 1, 'O');
    return;
  }
  const big = o.eyes === 'shock' ? 1 : 0;
  ellipse(E, x + 0.5, y + 0.5, rx + big * 0.6, ry + big * 0.6, 'W'); E.outline();
  // pupil
  const look = o.look == null ? (1 - (o.turn || 0)) : o.look, pr = o.eyes === 'shock' ? rx * 0.45 : rx * 0.8;
  const px = x + 0.5 + look * Math.max(0, rx - pr) * 0.9, py = y + 0.5 + ry * 0.12;
  for (let yy = Math.floor(y - ry - 1); yy <= Math.ceil(y + ry + 1); yy++) for (let xx = Math.floor(x - rx - 1); xx <= Math.ceil(x + rx + 1); xx++) {
    const dx = (xx + 0.5 - px) / pr, dy = (yy + 0.5 - py) / (pr * 1.25);
    if (dx * dx + dy * dy <= 1 && E.get(xx, yy) === 'W') E.set(xx, yy, 'P');
  }
  if (o.eyes !== 'shock') { const gx = Math.floor(px - pr * 0.55), gy = Math.floor(py - pr * 1.0); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => { if (E.get(gx + a, gy + b) === 'P') E.set(gx + a, gy + b, 'W'); }); if (E.get(Math.floor(px + pr * 0.5), Math.floor(py + pr * 0.9)) === 'P') E.set(Math.floor(px + pr * 0.5), Math.floor(py + pr * 0.9), 'W'); } else E.set(Math.floor(px), Math.floor(py - 1), 'W');
  if (o.eyes === 'sly') for (let yy = Math.floor(y - ry - 1); yy <= Math.floor(y - ry * 0.15); yy++) for (let xx = Math.floor(x - rx - 1); xx <= Math.ceil(x + rx + 1); xx++) if (E.get(xx, yy) != null) E.set(xx, yy, yy === Math.floor(y - ry * 0.15) ? 'O' : (which === 'bomb' ? 'b2' : 'c2'));
  L.over(E);
  if (which === 'cherry') L.set(x + 0.5 + side * (rx + 0.6), y + 0.5 - ry + 0.2, 'O'); // lash
}
function brow(L, x, y, w, side, kind) {
  // Bomb's cocky angled brows; side = -1 (screen-left eye) or 1
  const inner = -side; // towards the face centre
  if (kind === 'flat') { for (let i = -2; i <= 2; i++) L.set(x + i, y, 'O'); return; }
  if (kind === 'up') { for (let i = -2; i <= 2; i++) L.set(x + i, y - (Math.abs(i) < 2 ? 1 : 0), 'O'); return; }
  for (let i = -2; i <= 2; i++) { const yy = y + Math.round(((i * inner) + 2) * 0.5); L.set(x + i + 0.5, yy, 'O'); L.set(x + i + 0.5, yy - 1, 'O'); }
}
function mouth(L, x, y, kind, which) {
  const M = layer(L), fill = (pts, c) => pts.forEach(([a, b]) => M.set(x + a, y + b, c));
  const line = (pts) => pts.forEach(([a, b]) => L.set(x + a, y + b, 'O'));
  switch (kind) {
    case 'smile': return line([[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]]);
    case 'flat': return line([[-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1]]);
    case 'smirk': return line([[-2, 1], [-1, 1], [0, 1], [1, 0], [2, -1]]);
    case 'grin': fill([[-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, -1], [4, -1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 0]], 'th');
      fill([[-2, 2], [-1, 2], [0, 2], [1, 2], [2, 1]], 'md'); fill([[0, 2], [1, 2]], 'tg'); M.outline(); L.over(M); [-2, 0, 2].forEach(a => L.set(x + a, y + (a === 2 ? 0 : 0), 'O')); return;
    case 'grit': fill([[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1]], 'th'); M.outline(); L.over(M); [-2, 0, 2].forEach(a => { L.set(x + a, y, 'O'); L.set(x + a, y + 1, 'O'); }); return;
    case 'shock': fill([[0, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]], 'md'); M.set(x, y + 1, 'tg'); M.outline(); L.over(M); return;
    case 'talk1': if (which === 'bomb') { fill([[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, -1]], 'th'); fill([[-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1]], 'md'); }
      else fill([[-1, 0], [0, 0], [1, 0], [0, 1]], 'md');
      M.outline(); L.over(M); return;
    case 'talk2': if (which === 'bomb') { fill([[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, -1]], 'th'); fill([[-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 0], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [-1, 3], [0, 3], [1, 3]], 'md'); fill([[0, 3], [1, 3], [0, 2]], 'tg'); }
      else { fill([[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]], 'md'); fill([[0, 2], [-1, 1]], 'tg'); M.set(x - 1, y + 1, 'md'); }
      M.outline(); L.over(M); return;
  }
}
function face(L, cx, cy, R, which, o) {
  const turn = o.turn || 0, fx = cx + Math.round((1 - turn) * R * 0.2), fy = cy + 1;
  const ew = 6, eh = which === 'bomb' ? 7 : 8;
  const nearX = fx - 6, farX = fx + Math.round(5 + turn), farW = turn > 0.5 ? ew : ew - 1;
  eye(L, nearX, fy - 2, ew, eh, o, -1, which);
  eye(L, farX, fy - 2, farW, eh, o, 1, which);
  if (which === 'bomb' && o.eyes !== 'happy') { const k = o.brow || (o.eyes === 'shock' ? 'up' : 'angry'); brow(L, nearX, fy - 9, ew, -1, k); brow(L, farX, fy - 9, farW, 1, k); }
  if (which === 'cherry' && o.brow === 'flat') { for (let i = -1; i <= 1; i++) { L.set(nearX + i, fy - 8, 'O'); L.set(farX + i, fy - 8, 'O'); } }
  if (o.blush !== false && which === 'cherry') { [[-3, 4], [-2, 4], [-3, 5], [-2, 5]].forEach(([a, b]) => L.set(nearX + a, fy + b, 'bl')); [[3, 4], [3, 5]].forEach(([a, b]) => L.set(farX + a, fy + b, 'bl')); }
  if (o.blush && which === 'bomb') { L.set(nearX - 1, fy + 3, 'bl'); L.set(farX + 2, fy + 3, 'bl'); }
  mouth(L, fx + (which === 'bomb' ? 1 : 0), fy + 5, o.mouth || (which === 'bomb' ? 'grin' : 'smile'), which);
}

// ---------- limbs ----------
const rad = d => d * Math.PI / 180;
function leg(L, hx, hy, ang, lift, tone, far, view) {
  const t = tone === 'cherry' ? (far ? 'c2' : 'c1') : (far ? 'b2' : 'b1'), len = 6.5;
  const ex = hx + Math.sin(rad(ang)) * len, ey = hy + Math.cos(rad(ang)) * len - lift;
  const Lg = layer(L);
  stroke(Lg, hx, hy, ex, ey, 1.9, t);
  if (view === 'side') ellipse(Lg, ex + 2, ey + 0.6, 3.3, 2, t);       // shoe pointing right
  else ellipse(Lg, ex, ey + 0.8, 2.3, 1.7, t);
  Lg.outline(); L.over(Lg);
}
function arm(L, sx, sy, ang, tone, far, hand = 'open') {
  const t = tone === 'cherry' ? (far ? 'c2' : 'c1') : (far ? 'b2' : 'b1'), len = 7;
  const ex = sx + Math.sin(rad(ang)) * len, ey = sy + Math.cos(rad(ang)) * len;
  const A = layer(L);
  stroke(A, sx, sy, ex, ey, 1.4, t);
  ellipse(A, ex, ey, hand === 'fist' ? 1.9 : 2.1, hand === 'fist' ? 1.9 : 2.1, t);
  A.outline(); L.over(A);
  return [ex, ey];
}
function item(L, kind, x, y) {
  const I = layer(L);
  if (kind === 'scissors') { stroke(I, x, y, x + 6, y - 3, 0.7, 'k1'); stroke(I, x, y - 3, x + 6, y, 0.7, 'k1'); ellipse(I, x - 1, y - 0.5, 1.5, 1.5, 'xr'); ellipse(I, x - 1, y - 3, 1.5, 1.5, 'xr'); }
  if (kind === 'sack') { ellipse(I, x + 2, y - 3, 5, 5.5, (dx, dy) => dy < -0.3 ? 's1' : dx > 0.4 ? 's3' : 's2'); stroke(I, x - 1, y - 9, x + 5, y - 9, 1, 's3'); }
  if (kind === 'box') { for (let yy = -6; yy <= 0; yy++) for (let xx = -1; xx <= 9; xx++) I.set(x + xx, y + yy, yy < -4 ? 'x2' : 'x1'); for (let yy = -6; yy <= 0; yy++) I.set(x + 4, y + yy, 'xr'); I.set(x + 3, y - 7, 'xr'); I.set(x + 5, y - 7, 'xr'); }
  I.outline(); L.over(I);
}

// ---------- one character ----------
function character(G, which, cx, groundY, o, view, frame, walking, jump) {
  const R = 14, ph = (frame % 8) / 8 * Math.PI * 2;
  const swing = walking ? Math.sin(ph) : 0, bob = walking ? -Math.round(Math.abs(Math.cos(ph)) * 1) + 1 : 0;
  const lift = o.dy || 0, cy = groundY - 7 - R + 1 - bob - lift;
  const L = layer(G), back = view === 'back';
  // legs
  const legA = jump ? -30 : view === 'side' ? swing * 32 : 0, hipY = cy + R - 3;
  const lifts = jump ? [2, 2] : [Math.max(0, Math.sin(ph)) * 1.5, Math.max(0, -Math.sin(ph)) * 1.5];
  if (view === 'side') { leg(L, cx + 3, hipY, -legA, lifts[1], which, true, view); }
  else { leg(L, cx + 5, hipY, jump ? 18 : 6, 0, which, false, view); }
  if (view === 'side') leg(L, cx - 3, hipY, legA, lifts[0], which, false, view);
  else leg(L, cx - 5, hipY, jump ? -18 : -6, 0, which, false, view);
  // arms behind the body
  const arms = o.arms || (walking ? 'swing' : 'down');
  const A = { swing: [swing * -38, swing * 38], down: [-25, 25], up: [-160, 160], wave: [-25, 150 + Math.sin(frame * 1.4) * 18], point: [-25, 100], hold: [40, 60], shrug: [-115, 115], behind: [-25, 25] }[arms] || [-25, 25];
  if (view === 'side') arm(L, cx + R - 4, cy + 4, arms === 'swing' ? 25 + swing * 30 : A[1], which, true, arms === 'point' ? 'fist' : 'open');
  const B = layer(G); body(B, cx, cy, R, which, back); L.over(B);
  if (!back) face(L, cx, cy, R, which, o);
  if (view !== 'side') { arm(L, cx - R + 1, cy + 2, A[0] < 0 ? -A[0] * -1 : A[0], which, false); arm(L, cx + R - 1, cy + 2, A[1], which, false); }
  else { const ang = arms === 'swing' ? -swing * 40 : arms === 'down' || arms === 'behind' ? 8 : arms === 'up' ? 160 : arms === 'point' ? 95 : arms === 'hold' ? 70 : arms === 'shrug' ? 120 : arms === 'wave' ? 150 + Math.sin(frame * 1.4) * 18 : 8;
    const [hx, hy] = arm(L, cx - R + 3, cy + 4, arms === 'swing' ? -12 - swing * 28 : ang, which, false, arms === 'point' ? 'fist' : 'open'); if (o.item) item(L, o.item, hx + 1, hy + 1); }
  // flour dust
  if (o.dusty) for (let i = 0; i < L.c.length; i++) {
    const v = L.c[i], x = i % L.w, y = (i / L.w) | 0; if (!v || v === 'P' || v === 'W' || v === 'th' || v === 'md') continue;
    const edge = cy - R * 0.3 + 1.6 * Math.sin(x * 0.9 + (which === 'bomb' ? 2 : 0)) + 1.2 * Math.sin(x * 0.37);
    if (y < edge - 1) L.c[i] = v === 'O' ? 'O' : (hash(x, y, 4) < 0.18 ? 'fs' : 'fl');
    else if (y < edge + 0.5) L.c[i] = v === 'O' ? 'O' : 'fs';
    else if (v !== 'O' && hash(x, y, which === 'bomb' ? 3 : 1) < 0.07) L.c[i] = 'fl';
  }
  G.over(L);
  return { cx, cy, top: cy - R };
}

// ---------- the pair, joined by one stem ----------
export function duo(o = {}) {
  const view = o.view || 'side', frame = o.frame || 0, walking = !!o.walking;
  const W = 84, H = 72, G = new Grid(W, H), ground = 68;
  const C = Object.assign({}, o.cherry || {}), Bm = Object.assign({}, o.bomb || {});
  if (o.dusty) C.dusty = Bm.dusty = true;
  // side/front: Cherry near (left, lower), Bomb far (right, raised). back: mirrored.
  const back = view === 'back';
  const cX = back ? 53 : 29, bX = back ? 30 : 52, cG = ground, bG = ground - 4;
  const fB = (frame + 2) % 8;
  const b = character(G, 'bomb', bX, bG, Bm, view, fB, walking, o.jump);
  // stem (drawn between the two bodies so it sinks into Cherry's top)
  const S = layer(G), jx = Math.round((cX + bX) / 2) + (back ? -3 : 3), jy = Math.min(bG, cG) - 7 - 28 - 11 - (o.jump ? 2 : 0);
  const cTopY = cG - 7 - 28 + 1 - (C.dy || 0) + (walking ? 0 : 1), bTopY = b.top + 1;
  const bend = (x0, y0, x1, y1, k) => { const mx = (x0 + x1) / 2 + k, my = (y0 + y1) / 2; stroke(S, x0, y0, mx, my, 0.75, 'g1'); stroke(S, mx, my, x1, y1, 0.75, 'g1'); };
  bend(cX + (back ? -2 : 2), cTopY, jx, jy, -1.5); bend(bX + (back ? -2 : 2), bTopY, jx, jy, 1.2);
  for (let i = -1; i <= 1; i++) S.set(jx + i, jy - 1, 'g2'); S.set(jx, jy - 2, 'g2');
  // leaf (lens) up and to the right
  const lx0 = jx + 1, ly0 = jy - 1, ang = rad(back ? 200 : -20), Lx = Math.cos(ang), Ly = Math.sin(ang), len = 14;
  for (let y = jy - 14; y <= jy + 8; y++) for (let x = jx - 16; x <= jx + 18; x++) {
    const px = x + 0.5 - lx0, py = y + 0.5 - ly0, t = (px * Lx + py * Ly) / len, d = -px * Ly + py * Lx;
    if (t > 0 && t < 1 && Math.abs(d) <= 4.2 * Math.sin(Math.PI * t)) S.set(x, y, Math.abs(d) < 0.6 && t < 0.85 ? 'g2' : d < 0 ? 'l1' : 'l2');
  }
  S.outline(); G.over(S);
  character(G, 'cherry', cX, cG, C, view, frame, walking, o.jump);
  return { grid: G, w: W, h: H, ax: Math.round((cX + bX) / 2), ay: ground + 1 };
}

// ground shadow (separate so the compositor can keep it on the ground during jumps)
export function shadow(w = 34) { const G = new Grid(w + 2, 5); ellipse(G, (w + 2) / 2, 2.5, w / 2, 2, 'sh'); return { grid: G, w: w + 2, h: 5 }; }

export function toCanvas(spr, doc = globalThis.document) {
  const cv = doc.createElement('canvas'); cv.width = spr.w; cv.height = spr.h;
  const x = cv.getContext('2d'), img = x.createImageData(spr.w, spr.h);
  const rgb = {}; for (const k in PAL) { const h = PAL[k]; rgb[k] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255]; }
  rgb.sh = [40, 20, 30, 70];
  spr.grid.c.forEach((v, i) => { if (v) { const c = rgb[v]; img.data.set(c, i * 4); } });
  x.putImageData(img, 0, 0); return cv;
}

// one character, front-on, for dialogue-box portraits
export function solo(which, o = {}) {
  const G = new Grid(36, 40), cx = 18;
  const S = layer(G); for (let y = 2; y <= 7; y++) S.set(cx + 2 + (y < 4 ? 1 : 0), y, 'g1');
  const lf = (x, y) => S.set(x, y, 'l1'); [[4, 1], [5, 1], [6, 1], [4, 2], [5, 2], [6, 2], [7, 2], [5, 3], [6, 3]].forEach(([a, b]) => lf(cx + a, b));
  S.outline(); G.over(S);
  character(G, which, cx, 38, Object.assign({ turn: 1, look: 0, arms: 'down' }, o), 'front', 0, false, false);
  return { grid: G, w: 36, h: 40 };
}
