// Toytown kit — scenery for brick worlds with a moulded-plastic, miniature-photography look.
// Pairs with kits/minifig.mjs. Group-local units are U (short side). Colours are palette roles.
// Depth of field: give a whole layer group `blur` (in U) — the engine renders it offscreen and blurs it once.

const r4 = v => Math.round(v * 10000) / 10000;
let SEED = 11;
export function seed(n) { SEED = n || 1; }
export function rand() { SEED = (SEED * 16807) % 2147483647; return SEED / 2147483647; }
export const pick = arr => arr[Math.floor(rand() * arr.length)];
const P = { plastic: 0.6, edge: true };
const part = o => Object.assign({}, P, o);
const rect = o => Object.assign({ type: 'rect', wUnit: 'U' }, o);

export function sky({ x = 0, y = 0, w = 40, h = 8, colors = ['chapter2', 'chapter1', 'bg'] } = {}) {
  return rect({ w, h, grad: colors, x, y, anchor: 'bottom' });
}
export function sun({ x, y, r = 0.14, fill = 'accent', glow = 'bg' }) {
  return { type: 'group', x, y, children: [
    { type: 'circle', r: r * 3.2, fill: glow, opacity: 0.35 }, { type: 'circle', r: r * 2, fill: glow, opacity: 0.4 },
    { type: 'rays', r: r * 3, count: 18, fill: 'white', opacity: 0.22, loop: { fx: 'spin', period: 40 } },
    part({ type: 'circle', r, fill, edge: false, loop: { fx: 'pulse', period: 3 } }),
  ] };
}
export function cloud({ x, y, s = 1 }) {
  return { type: 'group', x, y, scale: s, loop: { fx: 'float', period: 5 + rand() * 3, amp: 0.8 }, children: [
    { type: 'bricks', w: 0.26, wUnit: 'U', h: 0.04, fill: 'white', anchor: 'bottom', bw: 0.065, bh: 0.04, plastic: 0.5 },
    { type: 'bricks', w: 0.13, wUnit: 'U', h: 0.04, fill: 'white', anchor: 'bottom', x: -0.03, y: -0.04, bw: 0.065, bh: 0.04, plastic: 0.5 },
  ] };
}
// shiny glass pane with a frame, mullions and two diagonal reflections
export function windowPane({ w = 0.12, h = 0.14, frame = 'white', glass = 'glass', mull = true } = {}) {
  const k = [part({ type: 'rect', wUnit: 'U', w: w + 0.016, h: h + 0.016, fill: frame, radius: 0.006 }), rect({ w, h, fill: glass, radius: 0.004 }),
    { type: 'poly', pts: [[-w * 0.4, h / 2], [-w * 0.1, h / 2], [w * 0.35, -h / 2], [w * 0.05, -h / 2]], fill: 'white', opacity: 0.45 },
    { type: 'poly', pts: [[w * 0.0, h / 2], [w * 0.08, h / 2], [w * 0.48, -h / 2], [w * 0.4, -h / 2]], fill: 'white', opacity: 0.3 }];
  if (mull) k.push(rect({ w: 0.008, h, fill: frame }), rect({ w, h: 0.008, fill: frame }));
  return { type: 'group', children: k };
}
export function building({ x, y, w = 0.4, h = 0.6, color = 'lavender', trim = 'white', roof = 'blushDeep', rows = 3, cols = 2, door = true, sign = null }) {
  const kids = [{ type: 'bricks', w, wUnit: 'U', h, fill: color, anchor: 'bottom', bw: 0.06, bh: 0.03, plastic: 0.55 }];
  kids.push({ type: 'bricks', w: 0.035, wUnit: 'U', h, fill: trim, anchor: 'bottom', x: -w / 2 + 0.0175, bw: 0.035, bh: 0.03, studs: false, plastic: 0.5 });
  kids.push({ type: 'bricks', w: 0.035, wUnit: 'U', h, fill: trim, anchor: 'bottom', x: w / 2 - 0.0175, bw: 0.035, bh: 0.03, studs: false, plastic: 0.5 });
  kids.push({ type: 'bricks', w: w + 0.03, wUnit: 'U', h: 0.032, fill: roof, anchor: 'bottom', y: -h + 0.002, bw: 0.06, bh: 0.032, plastic: 0.6 });
  const gx = (w - 0.07) / cols, gy = (h - 0.12) / (rows + 0.4);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const pw = Math.min(0.085, gx * 0.62), ph = Math.min(0.1, gy * 0.62);
    kids.push(Object.assign(windowPane({ w: pw, h: ph, frame: trim }), { x: r4(-w / 2 + 0.035 + gx * (c + 0.5)), y: r4(-h + 0.09 + gy * (r + 0.5)) }));
  }
  if (door) kids.push(part({ type: 'rect', wUnit: 'U', w: 0.07, h: 0.11, fill: roof, anchor: 'bottom', radius: 0.012 }));
  if (sign) kids.push(sign);
  return { type: 'group', x, y, children: kids };
}
// a tree made of stacked round plates (miniature-model look)
export function tree({ x, y, s = 1, leaf = 'mint', trunk = 'wood' }) {
  return { type: 'group', x, y, scale: s, children: [
    part({ type: 'rect', wUnit: 'U', w: 0.024, h: 0.13, fill: trunk, anchor: 'bottom', radius: 0.004 }),
    ...[[0.13, -0.12], [0.11, -0.165], [0.085, -0.205], [0.055, -0.24]].map(([w, yy], i) => part({ type: 'pill', w, wUnit: 'U', h: 0.05, fill: leaf, y: yy, loop: i === 3 ? { fx: 'sway', period: 3.4, amp: 0.3 } : undefined })),
    part({ type: 'circle', r: 0.014, fill: leaf, y: -0.272 }),
  ] };
}
export function lamp({ x, y, s = 1, glow = 'accent' }) {
  return { type: 'group', x, y, scale: s, children: [
    part({ type: 'rect', wUnit: 'U', w: 0.012, h: 0.3, fill: 'ink', anchor: 'bottom', radius: 0.004 }),
    part({ type: 'rect', wUnit: 'U', w: 0.03, h: 0.015, fill: 'ink', anchor: 'bottom', radius: 0.003 }),
    part({ type: 'rect', wUnit: 'U', w: 0.044, h: 0.05, fill: 'glass', y: -0.31, radius: 0.008 }),
    { type: 'circle', r: 0.014, fill: glow, y: -0.31, loop: { fx: 'pulse', period: 1.6 } },
    part({ type: 'poly', pts: [[-0.03, -0.335], [0.03, -0.335], [0, -0.355]], fill: 'ink', radius: 0.002 }),
  ] };
}
export function planter({ x, y, w = 0.3, box = 'blushDeep', flowers = ['bg', 'accent', 'primary', 'lavender'], s = 1 }) {
  const n = Math.max(3, Math.round(w / 0.07));
  return { type: 'group', x, y, scale: s, children: [
    { type: 'bricks', w, wUnit: 'U', h: 0.07, fill: box, anchor: 'top', bw: 0.075, bh: 0.035, plastic: 0.6 },
    ...Array.from({ length: n }, (_, i) => ({ type: 'group', x: r4(-w / 2 + (w / n) * (i + 0.5)), y: -0.004, children: [
      rect({ w: 0.006, h: 0.05, fill: 'chapter3', anchor: 'bottom' }),
      part({ type: 'scallop', r: 0.02, bumps: 6, depth: 0.25, fill: flowers[i % flowers.length], y: -0.055, loop: { fx: 'sway', period: 2 + i * 0.3, amp: 1.2 } }),
      part({ type: 'circle', r: 0.007, fill: 'toyYellow', y: -0.055, edge: false }),
    ] })),
  ] };
}
// street: studded road plate + kerb + cream sidewalk bricks. y = top of the sidewalk (feet line).
export function street({ x, y, w = 12, road = 'secondary', walk = 'bg', kerb = 'white', depth = 0.12 }) {
  return { type: 'group', x, y, children: [
    { type: 'baseplate', w, wUnit: 'U', h: 3, fill: road, anchor: 'top', y: depth + 0.03, pitch: 0.042 },
    { type: 'bricks', w, wUnit: 'U', h: 0.03, fill: kerb, anchor: 'top', y: depth, bw: 0.09, bh: 0.03, plastic: 0.5, studs: false },
    { type: 'baseplate', w, wUnit: 'U', h: depth, fill: walk, anchor: 'top', y: 0, pitch: 0.042, rows: 2 },
  ] };
}
export function bunting({ points, colors = ['primary', 'bg', 'lavender', 'accent', 'mint'], every = 0.07 }) {
  const [[x0, y0], [x1, y1]] = points, n = Math.max(2, Math.round(Math.abs(x1 - x0) / every)), kids = [];
  kids.push({ type: 'path', points: [[x0, y0], [(x0 + x1) / 2, Math.max(y0, y1) + 0.04], [x1, y1]], stroke: 'ink', strokeW: 0.003 });
  for (let i = 1; i < n; i++) {
    const f = i / n, px = x0 + (x1 - x0) * f, py = y0 + (y1 - y0) * f + 0.04 * 4 * f * (1 - f);
    kids.push(part({ type: 'poly', pts: [[-0.018, 0], [0.018, 0], [0, 0.04]], fill: colors[i % colors.length], x: r4(px), y: r4(py), edge: false, loop: { fx: 'sway', period: 1.6 + (i % 3) * 0.3, amp: 1.2 } }));
  }
  return { type: 'group', children: kids };
}
