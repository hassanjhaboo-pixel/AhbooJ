// Brick-world kit — builders for a toy-brick universe rendered with the brand-motion engine.
// Everything returns plain storyboard elements (groups / poly / bricks / text), so it is brand-agnostic:
// colours are palette ROLES. Add these extra roles to the brand file (or alias them):
//   toyYellow, toySkinShade, bone, wood, cardboard, glass  (see brand/jadesserts.json for an example)
//
// Coordinates: inside groups, x/y are short-side units (U). A figure's origin is the centre between its feet.
// Figures are original blocky designs ("brick people"), not a copy of any trademarked toy figure.

const r4 = v => Math.round(v * 10000) / 10000;
let SEED = 1;
export function seed(n) { SEED = n || 1; }
export function rand() { SEED = (SEED * 16807) % 2147483647; return SEED / 2147483647; }
export const pick = arr => arr[Math.floor(rand() * arr.length)];

const rectU = (o) => Object.assign({ type: 'rect', wUnit: 'U' }, o);

// ---------- faces & hair ----------
function face(kind, opts = {}) {
  const ink = opts.ink || 'ink', els = [];
  const eye = x => ({ type: 'circle', r: kind === 'skull' ? 0.011 : 0.0055, fill: ink, x, y: -0.006, loop: kind === 'sleep' || kind === 'skull' ? undefined : { fx: 'blink', period: 2.6 + rand() * 2.2, phase: rand() * 2 } });
  if (kind === 'sleep') {
    els.push({ type: 'path', points: [[-0.017, -0.006], [-0.007, -0.004]], stroke: ink, strokeW: 0.0035, smooth: false });
    els.push({ type: 'path', points: [[0.007, -0.004], [0.017, -0.006]], stroke: ink, strokeW: 0.0035, smooth: false });
  } else { els.push(eye(-0.012), eye(0.012)); }
  if (kind === 'angry') {
    els.push({ type: 'path', points: [[-0.021, -0.019], [-0.006, -0.012]], stroke: ink, strokeW: 0.0042, smooth: false });
    els.push({ type: 'path', points: [[0.021, -0.019], [0.006, -0.012]], stroke: ink, strokeW: 0.0042, smooth: false });
  }
  const m = opts.talk ? 'talk' : kind;
  if (m === 'talk') els.push({ type: 'pill', w: 0.017, wUnit: 'U', h: 0.011, fill: ink, x: 0, y: 0.012, loop: { fx: 'talk', seed: opts.seed || 1 } });
  else if (m === 'grin') els.push({ type: 'poly', pts: [[-0.015, 0.006], [0.015, 0.006], [0.008, 0.018], [-0.008, 0.018]], radius: 0.003, fill: ink });
  else if (m === 'angry') els.push({ type: 'path', points: [[-0.012, 0.017], [0, 0.01], [0.012, 0.017]], stroke: ink, strokeW: 0.004 });
  else if (m === 'sleep' || m === 'o') els.push({ type: 'circle', r: 0.0055, fill: ink, x: 0, y: 0.013 });
  else if (m === 'skull') {
    els.push({ type: 'poly', pts: [[-0.003, 0.004], [0.003, 0.004], [0, 0.01]], fill: ink });
    els.push({ type: 'path', points: [[-0.012, 0.017], [0.012, 0.017]], stroke: ink, strokeW: 0.003, smooth: false });
    [-0.008, -0.003, 0.002, 0.007].forEach(x => els.push({ type: 'path', points: [[x + 0.0015, 0.014], [x + 0.0015, 0.02]], stroke: ink, strokeW: 0.002, smooth: false }));
  } else els.push({ type: 'path', points: [[-0.013, 0.009], [0, 0.016], [0.013, 0.009]], stroke: ink, strokeW: 0.004 });
  return els;
}

function hair(kind, color) {
  switch (kind) {
    case 'cap': return [{ type: 'poly', pts: [[-0.034, -0.013], [0.034, -0.013], [0.032, -0.036], [-0.032, -0.036]], radius: 0.012, fill: color }, rectU({ w: 0.05, h: 0.008, fill: color, anchor: 'left', x: 0.006, y: -0.013, radius: 0.004 })];
    case 'bob': return [{ type: 'poly', pts: [[-0.038, 0.014], [-0.038, -0.024], [-0.024, -0.037], [0.024, -0.037], [0.038, -0.024], [0.038, 0.014], [0.03, 0.014], [0.03, -0.018], [-0.03, -0.018], [-0.03, 0.014]], radius: 0.006, fill: color }];
    case 'bun': return [...hair('bob', color), { type: 'circle', r: 0.014, fill: color, x: 0, y: -0.045 }];
    case 'spiky': return [{ type: 'poly', pts: [[-0.034, -0.016], [-0.03, -0.042], [-0.016, -0.03], [-0.006, -0.048], [0.006, -0.032], [0.018, -0.046], [0.024, -0.03], [0.036, -0.04], [0.034, -0.016]], radius: 0.002, fill: color }];
    case 'beanie': return [{ type: 'poly', pts: [[-0.034, -0.012], [0.034, -0.012], [0.03, -0.036], [0, -0.044], [-0.03, -0.036]], radius: 0.01, fill: color }, { type: 'circle', r: 0.009, fill: 'bg', x: 0, y: -0.048 }, rectU({ w: 0.07, h: 0.009, fill: 'bg', y: -0.013, radius: 0.004 })];
    case 'chef': return [{ type: 'poly', pts: [[-0.03, -0.016], [0.03, -0.016], [0.03, -0.034], [-0.03, -0.034]], radius: 0.004, fill: 'white' }, { type: 'scallop', r: 0.03, bumps: 7, depth: 0.12, fill: 'white', x: 0, y: -0.058 }];
    case 'ponytail': return [...hair('bob', color), { type: 'pill', w: 0.014, wUnit: 'U', h: 0.034, fill: color, x: 0.04, y: -0.012, rot: 20 }];
    default: return [];
  }
}

// ---------- the brick person ----------
// pose: arms 'down' | 'up' | 'wave' | 'swing' | 'hold' | 'hips' ; legs 'stand' | 'run' | 'sit'
export function figure(o = {}) {
  const skin = o.skeleton ? 'bone' : (o.skin || 'toyYellow');
  const shirt = o.skeleton ? 'bone' : (o.shirt || 'primary'), pants = o.skeleton ? 'bone' : (o.pants || 'lavender');
  const per = o.speed || 0.42, kids = [];
  const sit = o.legs === 'sit';
  kids.push({ type: 'pill', w: 0.1, wUnit: 'U', h: 0.014, fill: 'dark', opacity: 0.16, x: 0, y: 0 });
  // legs (each a group pivoting at the hip)
  [-1, 1].forEach((side, i) => {
    const leg = { type: 'group', x: side * 0.019, y: sit ? -0.04 : -0.07, rot: sit ? -side * 0 : 0,
      children: [rectU({ w: 0.035, h: sit ? 0.035 : 0.07, fill: pants, anchor: 'top', radius: 0.004 }), rectU({ w: 0.038, h: 0.012, fill: pants, anchor: 'top', x: side * 0.002, y: sit ? 0.03 : 0.064, radius: 0.004 })] };
    if (o.legs === 'run') leg.loop = { fx: 'sway', period: per, amp: 5.5, phase: i * Math.PI };
    if (o.legs === 'dance') leg.loop = { fx: 'sway', period: per * 2, amp: 3, phase: i * Math.PI };
    kids.push(leg);
  });
  const hipY = sit ? -0.054 : -0.084;
  kids.push(rectU({ w: 0.08, h: 0.016, fill: pants, anchor: 'top', y: hipY, radius: 0.003 }));
  // torso + print
  const ty = hipY;
  kids.push({ type: 'poly', pts: [[-0.036, ty - 0.082], [0.036, ty - 0.082], [0.044, ty], [-0.044, ty]], radius: 0.007, fill: shirt });
  if (o.skeleton) [0.02, 0.035, 0.05].forEach(d => kids.push({ type: 'path', points: [[-0.024, ty - 0.082 + d], [0.024, ty - 0.082 + d]], stroke: 'ink', strokeW: 0.0035, smooth: false }));
  else if (o.print === 'heart') kids.push({ type: 'heart', r: 0.012, fill: o.printColor || 'bg', x: 0, y: ty - 0.045 });
  else if (o.print === 'stripe') kids.push(rectU({ w: 0.078, h: 0.012, fill: o.printColor || 'bg', y: ty - 0.045 }));
  else if (o.print === 'apron') kids.push({ type: 'poly', pts: [[-0.024, ty - 0.07], [0.024, ty - 0.07], [0.03, ty], [-0.03, ty]], radius: 0.005, fill: o.printColor || 'white' });
  // arms (group pivots at the shoulder; hand rides with it)
  const shoulderY = ty - 0.074;
  const armRot = { down: [12, -12], up: [165, -165], wave: [12, -150], hold: [140, -140], hips: [40, -40], swing: [10, -10], hug: [60, -60] }[o.arms || 'down'];
  [1, -1].forEach((side, i) => { // side 1 = figure's left (screen left)... x sign below
    const x = (i === 0 ? -1 : 1) * 0.041;
    const arm = { type: 'group', x, y: shoulderY, rot: armRot[i] + (o.armJitter ? (rand() - 0.5) * 10 : 0),
      children: [rectU({ w: 0.021, h: 0.062, fill: shirt, anchor: 'top', radius: 0.009 }), { type: 'circle', r: 0.0115, fill: skin, x: 0, y: 0.068 }] };
    if (o.arms === 'swing') arm.loop = { fx: 'sway', period: per, amp: 5, phase: i * Math.PI + Math.PI };
    if (o.arms === 'up') arm.loop = { fx: 'flap', period: per * 1.4, amp: 0.8 * (i ? -1 : 1) };
    if (o.arms === 'wave' && i === 1) arm.loop = { fx: 'sway', period: 0.5, amp: 4 };
    if (o.arms === 'hug') arm.loop = { fx: 'sway', period: 1.2, amp: 1.2, phase: i * Math.PI };
    if (o.hand && i === 1) arm.children.push(Object.assign({ x: 0, y: 0.07 }, o.hand));
    kids.push(arm);
  });
  // neck + head (group, so it can bob/tilt)
  kids.push(rectU({ w: 0.024, h: 0.01, fill: skin, anchor: 'bottom', y: ty - 0.08, radius: 0.002 }));
  const headKids = [
    rectU({ w: 0.03, h: 0.013, fill: skin, anchor: 'bottom', y: -0.026, radius: 0.004 }),
    rectU({ w: 0.064, h: 0.056, fill: skin, radius: 0.016 }),
    ...face(o.skeleton ? 'skull' : (o.face || 'smile'), { talk: o.talk, seed: o.seed }),
    ...hair(o.hair || 'none', o.hairColor || 'ink'),
  ];
  const head = { type: 'group', x: 0, y: ty - 0.116, rot: o.headTilt || 0, children: headKids };
  if (o.headBob) head.loop = { fx: 'sway', period: o.headBob, amp: 1.2 };
  kids.push(head);
  if (o.extra) kids.push(...o.extra);
  const g = { type: 'group', id: o.id, x: o.x, y: o.y, scale: o.s || 1, rot: o.rot || 0, children: kids };
  if (o.in) g.in = o.in; if (o.out) g.out = o.out; if (o.moves) g.moves = o.moves;
  if (o.loop) g.loop = o.loop;
  else if (o.legs === 'run') g.loop = { fx: 'float', period: per / 2, amp: 0.9 };
  else if (o.arms === 'up' || o.legs === 'dance') g.loop = { fx: 'sway', period: per * 2, amp: 1.5 };
  else g.loop = { fx: 'float', period: 2.4 + rand() * 1.5, amp: 0.25, phase: rand() * 6 };
  return g;
}

// periodic back-flips / jumps as explicit moves (engine moves are absolute keyframes)
export function flips(y0, dur, { every = 1.6, height = 0.12, H = 1920, start = 0.3 } = {}) {
  const moves = []; let k = 0;
  for (let t = start; t + 0.55 < dur; t += every) {
    k++;
    moves.push({ at: r4(t), dur: 0.27, y: r4(y0 - (height * 1080) / H), ease: 'outQuad' });
    moves.push({ at: r4(t + 0.27), dur: 0.27, y: r4(y0), ease: 'inQuad' });
    moves.push({ at: r4(t), dur: 0.54, rot: -360 * k, ease: 'inOutQuad' });
  }
  return moves;
}
export function hops(y0, dur, { every = 0.5, height = 0.03, H = 1920, start = 0 } = {}) {
  const moves = [];
  for (let t = start; t + every <= dur + 0.01; t += every) {
    moves.push({ at: r4(t), dur: every / 2, y: r4(y0 - (height * 1080) / H), ease: 'outQuad' });
    moves.push({ at: r4(t + every / 2), dur: every / 2, y: r4(y0), ease: 'inQuad' });
  }
  return moves;
}

// ---------- props ----------
export function sign(text, { w = 0.13, h = 0.06, color = 'cardboard', ink = 'ink', size = 0.022 } = {}) {
  return { type: 'group', y: -0.02, children: [
    rectU({ w: 0.008, h: 0.09, fill: 'wood', anchor: 'top', y: -0.01 }),
    rectU({ w, h, fill: color, anchor: 'bottom', y: 0, radius: 0.006, stroke: 'ink', strokeW: 0.002 }),
    { type: 'text', text, role: 'title', size, color: ink, x: 0, y: -h / 2, maxWidth: 0.5, weight: 800 },
  ] };
}
export function bubble(text, { w = 0.13, h = 0.065, fill = 'white', ink = 'ink', size = 0.026, tail = 'left' } = {}) {
  const tx = tail === 'left' ? -w * 0.25 : w * 0.25;
  return { type: 'group', children: [
    rectU({ w, h, fill, radius: 0.02 }),
    { type: 'poly', pts: [[tx - 0.012, h / 2 - 0.002], [tx + 0.012, h / 2 - 0.002], [tx - 0.006 * (tail === 'left' ? 2 : -2), h / 2 + 0.022]], fill },
    { type: 'text', text, role: 'title', size, color: ink, x: 0, y: 0.002, weight: 800 },
  ] };
}
export function tent({ x, y, color = 'lavender', s = 1 }) {
  return { type: 'group', x, y, scale: s, children: [
    { type: 'poly', pts: [[-0.13, 0], [0.13, 0], [0, -0.17]], radius: 0.006, fill: color },
    { type: 'poly', pts: [[-0.045, 0], [0.045, 0], [0, -0.1]], radius: 0.004, fill: 'dark', opacity: 0.55 },
    { type: 'path', points: [[0, -0.17], [0, -0.2]], stroke: 'wood', strokeW: 0.005, smooth: false },
    { type: 'poly', pts: [[0, -0.2], [0.04, -0.188], [0, -0.176]], fill: 'primary', loop: { fx: 'sway', period: 0.8, amp: 2 } },
  ] };
}
export function campfire({ x, y, s = 1 }) {
  return { type: 'group', x, y, scale: s, children: [
    rectU({ w: 0.07, h: 0.012, fill: 'wood', rot: 18, radius: 0.004, y: -0.006 }),
    rectU({ w: 0.07, h: 0.012, fill: 'wood', rot: -18, radius: 0.004, y: -0.006 }),
    { type: 'group', y: -0.012, loop: { fx: 'jelly', period: 0.35, amp: 3 }, children: [
      { type: 'poly', pts: [[-0.026, 0], [0.026, 0], [0.012, -0.03], [0, -0.06], [-0.012, -0.03]], radius: 0.006, fill: 'accent', loop: { fx: 'boil', amp: 1.2 } },
      { type: 'poly', pts: [[-0.013, 0], [0.013, 0], [0, -0.034]], radius: 0.004, fill: 'primaryDeep', loop: { fx: 'boil', amp: 1.5, seed: 3 } },
    ] },
  ] };
}
export function sleepingBag({ x, y, s = 1, color = 'mint', zzzStart = 0.2, dur = 6 }) {
  const kids = [
    { type: 'pill', w: 0.2, wUnit: 'U', h: 0.05, fill: color, x: 0, y: -0.025 },
    rectU({ w: 0.05, h: 0.045, fill: 'toyYellow', x: -0.095, y: -0.03, radius: 0.012, rot: -90 }),
    { type: 'group', x: -0.095, y: -0.03, rot: -90, children: face('sleep') },
  ];
  [0, 1, 2].forEach(i => kids.push({ type: 'text', text: 'z', role: 'title', size: 0.02 + i * 0.007, color: 'ink', weight: 800,
    x: -0.07 + i * 0.022, y: -0.08 - i * 0.04, loop: { fx: 'float', period: 1.4, amp: 2.5, phase: i * 1.2 } }));
  return { type: 'group', x, y, scale: s, children: kids };
}
export function cobweb() {
  return { type: 'group', children: [0, 1, 2, 3].map(i => ({ type: 'path', points: [[0, 0], [Math.cos(i * 0.4) * 0.06, -Math.sin(i * 0.4 + 0.2) * 0.06]], stroke: 'white', strokeW: 0.0018, smooth: false }))
    .concat([0.025, 0.045].map(rr => ({ type: 'path', points: [[rr, -0.004], [rr * 0.9, -rr * 0.45], [rr * 0.55, -rr * 0.85], [0.002, -rr]], stroke: 'white', strokeW: 0.0015 }))) };
}

// ---------- scenery ----------
export function building({ x, y, w = 0.4, h = 0.6, color = 'lavender', roof = 'blushDeep', win = 'bg', rows = 3, cols = 2, door = true }) {
  const kids = [{ type: 'bricks', w, wUnit: 'U', h, fill: color, anchor: 'bottom', x: 0, y: 0, bw: 0.06, bh: 0.03 }];
  kids.push({ type: 'bricks', w: w + 0.03, wUnit: 'U', h: 0.03, fill: roof, anchor: 'bottom', x: 0, y: -h + 0.002, bw: 0.06, bh: 0.03 });
  const gx = w / (cols + 1), gy = (h - 0.12) / (rows + 0.5);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    kids.push(rectU({ w: Math.min(0.07, gx * 0.6), h: Math.min(0.08, gy * 0.6), fill: win, x: -w / 2 + gx * (c + 1), y: -h + 0.08 + gy * (r + 0.5), radius: 0.008, stroke: roof, strokeW: 0.004 }));
  }
  if (door) kids.push(rectU({ w: 0.06, h: 0.1, fill: roof, anchor: 'bottom', x: 0, y: 0, radius: 0.012 }));
  return { type: 'group', x, y, children: kids };
}
export function cloud({ x, y, s = 1, loop = true }) {
  return { type: 'group', x, y, scale: s, loop: loop ? { fx: 'float', period: 5 + rand() * 3, amp: 0.8 } : undefined, children: [
    { type: 'bricks', w: 0.22, wUnit: 'U', h: 0.035, fill: 'white', anchor: 'bottom', x: 0, y: 0, bw: 0.055, bh: 0.035 },
    { type: 'bricks', w: 0.12, wUnit: 'U', h: 0.035, fill: 'white', anchor: 'bottom', x: -0.02, y: -0.035, bw: 0.055, bh: 0.035 },
  ] };
}
export function tree({ x, y, s = 1, leaf = 'mint' }) {
  return { type: 'group', x, y, scale: s, children: [
    rectU({ w: 0.025, h: 0.12, fill: 'wood', anchor: 'bottom', radius: 0.004 }),
    { type: 'circle', r: 0.055, fill: leaf, x: 0, y: -0.15, loop: { fx: 'sway', period: 3, amp: 0.4 } },
    { type: 'circle', r: 0.04, fill: leaf, x: -0.04, y: -0.12 }, { type: 'circle', r: 0.04, fill: leaf, x: 0.04, y: -0.12 },
  ] };
}
export function lamp({ x, y, s = 1 }) {
  return { type: 'group', x, y, scale: s, children: [
    rectU({ w: 0.012, h: 0.28, fill: 'ink', anchor: 'bottom', radius: 0.004 }),
    rectU({ w: 0.05, h: 0.012, fill: 'ink', anchor: 'bottom', y: -0.28, radius: 0.004 }),
    { type: 'circle', r: 0.018, fill: 'accent', x: 0, y: -0.27 },
  ] };
}
