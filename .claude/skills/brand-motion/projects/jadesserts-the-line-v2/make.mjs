#!/usr/bin/env node
// Jadesserts "The Line" v2 — ~50s brick-world commercial with voiced reality-TV confessionals (9:16 + 1:1).
// Fly over Bricktown → the impossible line → confessionals (Brenda, Gary, Chad, Steve) → the baker's countdown →
// doors open, stampede → Steve finally gets his box → "Worth every wait."
//
//   node make.mjs        → voices/ (cached TTS), storyboard-9x16.json, storyboard-1x1.json
// Kits: kits/minifig.mjs (figures), kits/toytown.mjs (scenery), kits/brickworld.mjs (tent, campfire, cobweb...).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as F from '../../kits/minifig.mjs';
import * as T from '../../kits/toytown.mjs';
import * as K from '../../kits/brickworld.mjs';
import { voiceLines } from '../../scripts/voice.mjs';
import { LINES } from './lines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const LOGO = '../../brand/assets/jadesserts/logo.png';
const CHERRY = '../../brand/assets/jadesserts/logo-cherry.png';
const PROD = n => `../jadesserts-sweet-box/assets/products/${n}.png`;
const r4 = v => Math.round(v * 10000) / 10000;

// ---------- voices ----------
const V = await voiceLines(LINES, path.join(here, 'voices'), { quiet: true });
const vfile = id => `voices/${id}.wav`;
const vdur = id => (V[id] ? V[id].dur : 1.6);
const partsOf = id => { const l = LINES.find(x => x.id === id); return l.parts ? l.parts.map(p => p.text) : [l.text]; };
// split a voice line into its spoken parts: the (n-1) longest pauses are the part boundaries
function partTimes(id) {
  const n = partsOf(id).length, v = V[id];
  if (!v) return Array.from({ length: n }, (_, i) => [i * 1.6, (i + 1) * 1.6 - 0.1]);
  const env = v.env, fps = v.fps, quiet = env.map(e => e < 0.06);
  let a = quiet.findIndex(q => !q), b = env.length - 1 - [...quiet].reverse().findIndex(q => !q);
  const gaps = [];
  for (let i = a; i <= b; i++) if (quiet[i]) { let j = i; while (j <= b && quiet[j]) j++; gaps.push([i, j]); i = j; }
  const cuts = gaps.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, n - 1).sort((x, y) => x[0] - y[0]);
  const out = []; let s = a;
  cuts.forEach(([g0, g1]) => { out.push([s / fps, g0 / fps]); s = g1; });
  out.push([s / fps, (b + 1) / fps]);
  while (out.length < n) out.push([out[out.length - 1][1], out[out.length - 1][1] + 0.5]);
  return out;
}
const talk = (id, at) => (V[id] ? { env: V[id].env, fps: V[id].fps, at: r4(at) } : null);
const voiceEl = (id, at, extra = {}) => Object.assign({ type: 'rect', w: 0.001, h: 0.001, opacity: 0, voice: vfile(id), in: { fx: 'cut', at: r4(at), dur: 0.01 }, sfx: V[id] ? false : 'babble', sfxDur: vdur(id) }, extra);

const SHIRTS = ['primary', 'secondary', 'mint', 'accent', 'blushDeep', 'lavender', 'chapter4', 'primaryDeep', 'white', 'toyYellow'];
const PANTS = ['ink', 'lavender', 'blushDeep', 'secondary', 'wood', 'dark', 'primaryDeep'];
const HAIRS = ['cap', 'bob', 'bun', 'spiky', 'beanie', 'ponytail', 'curly', 'long', 'mohawk', 'none'];
const HAIRC = ['ink', 'wood', 'accent', 'primaryDeep', 'lavender', 'cardboard', 'toyYellow'];
const PRINTS = ['heart', 'stripe', 'tie', 'hoodie', 'jacket', 'none', 'none'];

function make(fmt) {
  const tall = fmt === '9x16', W = 1080, H = tall ? 1920 : 1080, U = 1080;
  const X = px => r4(px / W), Y = py => r4(py / H), u = px => r4(px / U);
  const G = tall ? 1460 : 840;                        // sidewalk top (px, world)
  const FS = tall ? 1.3 : 1.08;                       // queue figure scale
  const feet = G + 46, backFeet = G + 6;
  const FY = tall ? r4((G - 470) / H) : r4((G - 250) / H);
  F.seed(7); T.seed(11); K.seed(5);

  // ================= THE WORLD =================
  const sky = [T.sky({ x: u(3500), y: u(G + 20), w: 22, h: 9 }), T.sun({ x: u(4700), y: u(G - (tall ? 1500 : 820)), r: 0.13 })];
  const far = [];
  for (let x = -1500; x < 10000; x += 600 + T.rand() * 400) far.push(T.cloud({ x: u(x), y: u(G - (tall ? 1000 + T.rand() * 500 : 560 + T.rand() * 220)), s: 0.8 + T.rand() * 0.9 }));
  for (let x = -1800, i = 0; x < 10000; i++) { // distant pale skyline
    const w = 0.22 + T.rand() * 0.2, h = tall ? 0.7 + T.rand() * 0.5 : 0.4 + T.rand() * 0.25;
    far.push({ type: 'bricks', w, wUnit: 'U', h, fill: i % 2 ? 'chapter2' : 'chapter1', anchor: 'bottom', x: u(x), y: u(G - 60), bw: 0.08, bh: 0.04, opacity: 0.85 });
    x += w * U + 20;
  }
  const mid = [];
  const bCols = ['secondary', 'chapter4', 'blushDeep', 'chapter3', 'lavender', 'blush', 'mint'];
  for (let x = -1400, i = 0; x < 10000; i++) {
    const w = 0.3 + T.rand() * 0.2, h = tall ? 0.6 + T.rand() * 0.42 : 0.34 + T.rand() * 0.22;
    if (Math.abs(x + (w * U) / 2 - 5900) > 700) mid.push(T.building({ x: u(x + (w * U) / 2), y: u(G - 30), w, h, color: bCols[i % bCols.length], roof: bCols[(i + 3) % bCols.length], rows: Math.max(2, Math.round(h / 0.17)), cols: w > 0.4 ? 3 : 2, door: false }));
    x += w * U + 40 + T.rand() * 80;
  }
  mid.push(T.bunting({ points: [[u(4900), u(G - (tall ? 760 : 520))], [u(5450), u(G - (tall ? 700 : 480))]] }));
  const ground = [T.street({ x: u(3800), y: u(G), w: 14, road: 'secondary', walk: 'bg' })];
  for (let x = 300; x < 5200; x += 700) ground.push((x / 700) % 2 < 1 ? T.tree({ x: u(x), y: u(G + 4), s: tall ? 1.7 : 1.35, leaf: (x / 700) % 3 < 1 ? 'mint' : 'chapter3' }) : T.lamp({ x: u(x), y: u(G + 4), s: tall ? 1.6 : 1.3 }));
  const front = [];
  for (let x = -400; x < 10000; x += 620 + T.rand() * 260) front.push(T.planter({ x: u(x), y: u(G + (tall ? 330 : 230)), w: 0.32, box: T.pick(['blushDeep', 'lavender', 'chapter4']), s: 1.25 }));

  // ================= THE BAKERY =================
  const BX = 5900, wallH = tall ? 0.82 : 0.6;
  const bakery = { type: 'group', x: X(BX), y: Y(G), children: [
    { type: 'bricks', w: 1.08, wUnit: 'U', h: wallH, fill: 'primary', anchor: 'bottom', bw: 0.07, bh: 0.035, plastic: 0.6 },
    ...[-1, 1].map(s => ({ type: 'bricks', w: 0.05, wUnit: 'U', h: wallH, fill: 'blush', anchor: 'bottom', x: s * 0.515, bw: 0.05, bh: 0.035, studs: false, plastic: 0.5 })),
    { type: 'bricks', w: 1.14, wUnit: 'U', h: 0.045, fill: 'primaryDeep', anchor: 'bottom', y: -wallH, bw: 0.07, bh: 0.045, plastic: 0.6 },
    { type: 'bricks', w: 1.08, wUnit: 'U', h: 0.035, fill: 'primaryDeep', anchor: 'bottom', y: 0, bw: 0.07, bh: 0.035, studs: false, plastic: 0.6 },
    // marquee sign with the real logo and chasing bulbs
    { type: 'group', y: -wallH - 0.22, loop: { fx: 'float', period: 3, amp: 0.35 }, children: [
      ...[-0.38, 0.38].map(x => ({ type: 'rect', wUnit: 'U', w: 0.014, h: 0.08, fill: 'ink', anchor: 'top', x, y: 0.16 })),
      { type: 'rect', wUnit: 'U', w: 0.9, h: 0.34, fill: 'bg', radius: 0.05, plastic: 0.5, edge: true, shadow: { color: 'rgba(74,44,51,0.25)', blur: 0.02, y: 0.01 } },
      { type: 'image', src: LOGO, w: 0.74, wUnit: 'U', x: 0, y: 0 },
      ...Array.from({ length: 14 }, (_, i) => { const tt = i / 14, top = i < 7; return { type: 'circle', r: 0.011, fill: 'accent', x: r4(-0.4 + (i % 7) * 0.133), y: top ? -0.17 : 0.17, loop: { fx: 'blink', period: 0.6, phase: (i % 2) * 0.3 } }; }),
    ] },
    // scalloped awning
    ...Array.from({ length: 9 }, (_, i) => ({ type: 'rect', wUnit: 'U', w: 0.122, h: 0.1, fill: i % 2 ? 'blush' : 'bg', anchor: 'top', x: r4(-0.488 + i * 0.122), y: r4(-wallH * 0.64), plastic: 0.4 })),
    ...Array.from({ length: 9 }, (_, i) => ({ type: 'circle', r: 0.061, fill: i % 2 ? 'blush' : 'bg', x: r4(-0.488 + i * 0.122), y: r4(-wallH * 0.64 + 0.1), plastic: 0.4 })),
    // windows with real products
    ...[-0.34, 0.34].map((wx, j) => ({ type: 'group', x: wx, y: -0.21, children: [
      Object.assign(T.windowPane({ w: 0.27, h: 0.24, frame: 'white', mull: false }), {}),
      { type: 'rect', wUnit: 'U', w: 0.25, h: 0.014, fill: 'wood', y: 0.07, plastic: 0.5 },
      { type: 'image', src: PROD(j ? 'chicken-puff' : 'vanilla-cupcake'), w: j ? 0.11 : 0.08, wUnit: 'U', anchor: 'bottom', x: -0.06, y: 0.065 },
      { type: 'image', src: PROD(j ? 'fruit-punch' : 'banana-bread'), w: j ? 0.05 : 0.1, wUnit: 'U', anchor: 'bottom', x: 0.065, y: 0.065 },
      T.planter({ x: 0, y: 0.13, w: 0.26, box: 'primaryDeep', s: 1 }),
    ] })),
    // door frame + warm interior
    { type: 'rect', wUnit: 'U', w: 0.21, h: 0.34, fill: 'white', anchor: 'bottom', radius: 0.04, plastic: 0.5, edge: true },
    { type: 'rect', wUnit: 'U', w: 0.175, h: 0.315, fill: 'accent', anchor: 'bottom', radius: 0.035, grad: ['toyYellow', 'accent'] },
  ] };
  // clock above the door (minute hand turns during the countdown)
  const clock = (minuteMoves) => ({ type: 'group', x: X(BX), y: Y(G - 0.42 * U), children: [
    { type: 'circle', r: 0.045, fill: 'bg', plastic: 0.5, edge: true }, { type: 'ring', r: 0.045, fill: 'ink', strokeW: 0.006 },
    ...Array.from({ length: 12 }, (_, i) => ({ type: 'circle', r: 0.004, fill: 'ink', x: r4(Math.cos(i * Math.PI / 6) * 0.034), y: r4(Math.sin(i * Math.PI / 6) * 0.034) })),
    { type: 'rect', wUnit: 'U', w: 0.006, h: 0.024, fill: 'ink', anchor: 'bottom', rot: -90, radius: 0.003 },
    { type: 'rect', wUnit: 'U', w: 0.005, h: 0.034, fill: 'primaryDeep', anchor: 'bottom', rot: -18, radius: 0.003, moves: minuteMoves },
    { type: 'circle', r: 0.006, fill: 'ink' },
  ] });
  const doorEl = ({ openAt = null, sign = 'CLOSED', flipAt = null }) => ({ type: 'group', x: X(BX - 0.0875 * U), y: Y(G), children: [
    { type: 'group', moves: openAt != null ? [{ at: openAt, dur: 0.3, sx: 0.1, ease: 'outBack' }] : undefined, children: [
      { type: 'rect', wUnit: 'U', w: 0.175, h: 0.315, fill: 'lavender', anchor: 'bottom-left', radius: 0.035, plastic: 0.6, edge: true },
      Object.assign(T.windowPane({ w: 0.09, h: 0.1, frame: 'white', mull: false }), { x: 0.0875, y: -0.22 }),
      { type: 'heart', r: 0.018, fill: 'primary', x: 0.0875, y: -0.1, plastic: 0.6 },
      { type: 'circle', r: 0.008, fill: 'toyYellow', x: 0.155, y: -0.15, plastic: 0.7 },
      // hanging sign flips CLOSED → OPEN
      { type: 'group', x: 0.0875, y: -0.165, sx: 1, moves: flipAt != null ? [{ at: flipAt, dur: 0.12, sx: 0, ease: 'inQuad' }, { at: flipAt + 0.12, dur: 0.15, sx: 1, ease: 'outBack' }] : undefined, children: [
        { type: 'rect', wUnit: 'U', w: 0.1, h: 0.034, fill: 'white', radius: 0.008, plastic: 0.4, edge: true },
        { type: 'text', text: sign, role: 'title', size: 0.018, weight: 800, color: 'primaryDeep', out: flipAt != null ? { fx: 'cut', at: flipAt + 0.12, dur: 0.01 } : undefined },
        ...(flipAt != null ? [{ type: 'text', text: 'OPEN', role: 'title', size: 0.02, weight: 800, color: 'chapter3', in: { fx: 'cut', at: flipAt + 0.12, dur: 0.01 } }, { type: 'text', text: 'OPEN', role: 'title', size: 0.02, weight: 800, color: 'ink', opacity: 0.8, in: { fx: 'cut', at: flipAt + 0.12, dur: 0.01 } }] : []),
      ] },
    ] },
  ] });

  // ================= THE QUEUE =================
  const slots = []; for (let x = 420; x <= 5500; x += 175) slots.push(x);
  const used = new Set(), take = (...i) => i.forEach(k => used.add(k));
  const pieces = [];
  const piece = (i, build) => { take(i); pieces.push({ px: slots[i], els: build(slots[i]) }); };
  const at = (px, py, o = {}) => Object.assign({ x: X(px), y: Y(py) }, o);
  const fig = o => F.minifig(Object.assign({ s: FS, torso: F.pick(SHIRTS), legs: F.pick(PANTS), hair: F.pick(HAIRS), hairColor: F.pick(HAIRC), print: F.pick(PRINTS), seed: Math.floor(F.rand() * 97) }, o));
  const sgn = (txt, w = 0.16) => Object.assign(F.sign(txt, { w, h: 0.075, size: 0.021 }), { x: 0, y: -0.255 });
  const midBody = 0.12 * FS * U;

  piece(0, x => [fig(at(x, feet, { arms: 'up', face: 'grin', torso: 'mint', hair: 'cap', hairColor: 'accent', extra: [sgn('END OF\nTHE LINE')] }))]);
  take(1, 3); piece(2, x => [ // Brenda's campsite
    Object.assign(K.tent({ x: X(x - 60), y: Y(backFeet), s: FS * 1.15, color: 'secondary' }), {}),
    K.campfire({ x: X(x + 150), y: Y(feet - 4), s: FS * 1.3 }),
    { type: 'circle', r: 0.16, fill: 'accent', opacity: 0.18, x: X(x + 150), y: Y(feet - 40), loop: { fx: 'pulse', period: 0.3, amp: 2 } },
    fig(at(x + 40, feet, { id: 'brenda', legPose: 'sit', arms: [9, -50], hair: 'bob', hairColor: 'accent', torso: 'mint', print: 'heart', printColor: 'white', legs: 'lavender', face: 'happy',
      hand: { type: 'group', rot: -35, children: [{ type: 'rect', wUnit: 'U', w: 0.004, h: 0.1, fill: 'wood', anchor: 'bottom' }, { type: 'circle', r: 0.011, fill: 'white', y: -0.1, plastic: 0.5, edge: true }] } })),
  ]);
  piece(4, x => [fig(at(x, feet, { view: 'side', legPose: 'run', run: 0.42, torso: 'accent', hair: 'beanie', hairColor: 'primary', face: 'grin', loop: { fx: 'bob', period: 0.21, amp: 0.8 } }))]);
  take(6); piece(5, x => [
    fig(at(x, feet, { legPose: 'march', arms: 'cheer', face: 'happy', torso: 'lavender', hair: 'ponytail', hairColor: 'wood', moves: F.hops(Y(feet), 8, { H, every: 0.5, height: 0.02 }) })),
    fig(at(x + 175, feet, { legPose: 'march', arms: 'cheer', face: 'grin', torso: 'primary', hair: 'spiky', hairColor: 'ink', moves: F.hops(Y(feet), 8, { H, every: 0.5, height: 0.02, start: 0.25 }) })),
    ...[0, 1, 2].map(k => ({ type: 'text', text: k % 2 ? '♫' : '♪', role: 'title', size: 0.045, color: 'primaryDeep', x: X(x + 60 + k * 50), y: Y(feet - 0.36 * FS * U), loop: { fx: 'float', period: 0.8 + k * 0.2, amp: 3 } })),
  ]);
  piece(7, x => [
    { type: 'group', x: X(x + 40), y: Y(feet - 0.16 * FS * U), loop: { fx: 'sway', period: 2.2, amp: 1.5 }, children: [
      { type: 'path', points: [[0, 0], [0.01, -0.12], [0.02, -0.24]], stroke: 'ink', strokeW: 0.002 },
      { type: 'heart', r: 0.045 * FS, fill: 'primary', x: 0.02, y: -0.28, plastic: 0.8, edge: true, loop: { fx: 'float', period: 1.8 } } ] },
    fig(at(x, feet, { arms: 'wave', face: 'smile', torso: 'chapter4', hair: 'bun', hairColor: 'primaryDeep' })),
  ]);
  take(9); piece(8, x => [{ type: 'group', id: 'flipper', x: X(x + 60), y: Y(feet - midBody), children: [
    Object.assign(fig({ arms: 'up', face: 'happy', torso: 'secondary', hair: 'cap', hairColor: 'accent', loop: { fx: 'none' }, shadow: false }), { x: 0, y: u(midBody) }) ] }]);
  piece(10, x => [fig(at(x, feet, { arms: [9, -40], face: 'deadpan', headTilt: 8, torso: 'blushDeep', hand: F.phone() }))]);
  take(12); piece(11, x => [ // Gary, steaming
    fig(at(x + 60, feet, { id: 'gary', arms: 'fist', face: 'angry', vein: true, hair: 'cap', hairColor: 'primaryDeep', torso: 'secondary', print: 'tie', printColor: 'primaryDeep', legs: 'ink', moves: F.hops(Y(feet), 8, { H, every: 0.3, height: 0.008 }) })),
    ...[0, 1, 2].map(k => ({ type: 'circle', r: 0.018 + k * 0.006, fill: 'white', opacity: 0.85, x: X(x + 60 + (k - 1) * 30), y: Y(feet - 0.34 * FS * U - k * 30), loop: { fx: 'float', period: 0.7 + k * 0.15, amp: 4, phase: k }, plastic: 0.3 })),
  ]);
  take(14); piece(13, x => [K.sleepingBag({ x: X(x + 70), y: Y(feet), s: FS * 1.15, color: 'lavender' })]);
  piece(15, x => [fig(at(x, feet, { arms: 'up', face: 'deadpan', torso: 'mint', hair: 'long', hairColor: 'ink', extra: [sgn('DAY 12', 0.13)] }))]);
  piece(16, x => [
    fig(at(x, feet, { arms: [-28, 28], armLoops: [{ fx: 'sway', period: 0.25, amp: 1.2 }, { fx: 'sway', period: 0.25, amp: 1.2, phase: 1 }], face: 'dreamy', hair: 'bun', hairColor: 'bone', glasses: true, torso: 'lavender', print: 'stripe', printColor: 'bg' })),
    { type: 'path', points: [[X(x - 10), Y(feet - 0.1 * FS * U)], [X(x - 50), Y(feet - 0.01 * FS * U)], [X(x - 160), Y(feet + 12)], [X(x - 380), Y(feet + 20)]], stroke: 'primary', strokeW: 0.013, dash: [0.012, 0.004] },
  ]);
  piece(18, x => [fig(at(x, feet, { id: 'chad', arms: 'hold', armLoops: [{ fx: 'sway', period: 0.2, amp: 0.9 }, { fx: 'sway', period: 0.2, amp: 0.9, phase: 1.5 }], face: 'sly', torso: 'ink', print: 'jacket', printColor: 'white', hair: 'spiky', hairColor: 'accent', lookMoves: F.glances(8, { every: 1.1 }) }))]);
  take(20); piece(19, x => [
    fig(at(x, feet, { arms: [-40, 9], face: 'happy', torso: 'primary', hair: 'bob', hairColor: 'wood' })),
    fig(at(x + 150, feet, { arms: [9, 40], face: 'happy', torso: 'accent', hair: 'cap', hairColor: 'ink' })),
    { type: 'heart', r: 0.035 * FS, fill: 'primary', x: X(x + 75), y: Y(feet - 0.36 * FS * U), plastic: 0.8, loop: { fx: 'pulse', period: 0.6, amp: 3 } },
  ]);
  piece(21, x => [
    fig(at(x, feet, { arms: 'up', face: 'smile', torso: 'primaryDeep', hair: 'spiky', hairColor: 'wood' })),
    F.minifig({ x: X(x), y: Y(feet - 0.205 * FS * U), s: FS * 0.68, arms: 'wave', face: 'grin', torso: 'accent', legs: 'mint', hair: 'cap', hairColor: 'primary', shadow: false, loop: { fx: 'sway', period: 0.8, amp: 2 } }),
  ]);
  take(23); piece(22, x => [ // Steve, since 1998
    fig(at(x + 60, feet, { id: 'steve', skeleton: true, arms: 'up', loop: { fx: 'boil', amp: 1 }, extra: [sgn("SINCE '98", 0.15), Object.assign(K.cobweb(), { x: 0.04, y: -0.2 })] })),
  ]);
  const hoppers = []; for (let i = 24; i < slots.length; i++) { take(i); hoppers.push(slots[i]); }
  const idle = slots.filter((_, i) => !used.has(i));
  const backRow = []; for (let x = 500; x < 5300; x += 290 + F.rand() * 170) backRow.push(x);
  const castIdle = idle.map(x => ({ px: x, el: fig(at(x, feet, { arms: F.pick(['down', 'down', 'hips', 'wave', 'shrug']), face: F.pick(['smile', 'deadpan', 'smile', 'shock', 'grin', 'worried']), headTilt: (F.rand() - 0.5) * 12, hand: F.rand() < 0.3 ? F.phone() : undefined, lookMoves: F.rand() < 0.5 ? F.glances(8, { every: 1.3 + F.rand(), start: F.rand() }) : undefined })) }));
  const castBack = backRow.map(x => ({ px: x, el: fig(at(x, backFeet, { s: FS * 0.8, arms: F.pick(['down', 'hips', 'up', 'down', 'wave']), face: F.pick(['smile', 'deadpan', 'grin']), shadow: false })) }));
  const castHop = hoppers.map((x, i) => ({ px: x, i, el: fig(at(x, feet, { arms: F.pick(['cheer', 'up', 'reach']), face: F.pick(['grin', 'happy', 'shock']), loop: { fx: 'none' } })) }));

  // layer → parallax group (camera.focus moves fx; a layer offset of (1-pf)*fx makes it move at pf of the camera speed)
  const par = (pf, fx0, fx1, dur, ease, kids, blur) => ({ type: 'group', x: r4((1 - pf) * fx0), y: 0, moves: [{ at: 0, dur, x: r4((1 - pf) * fx1), ease }], children: kids, blur });
  function world({ fx0, fx1, z0 = 1, z1 = 1, dur, ease = 'linear', mode = 'line', doorOpen = null, flipAt = null, minute = null, extra = [] }) {
    const span = (W / 2) / Math.min(z0, z1) + 500, lo = Math.min(fx0, fx1) * W - span, hi = Math.max(fx0, fx1) * W + span;
    const vis = px => px > lo && px < hi;
    const visEl = e => e.x == null || vis(e.x * U);
    const els = [];
    els.push(par(0.08, fx0, fx1, dur, ease, sky));
    els.push(par(0.25, fx0, fx1, dur, ease, far, 0.006));
    els.push(par(0.55, fx0, fx1, dur, ease, mid, 0.0022));
    els.push({ type: 'group', x: 0, y: 0, children: ground.filter(visEl) });
    if (vis(BX)) { els.push(bakery, clock(minute), doorEl({ openAt: doorOpen, flipAt })); }
    if (mode !== 'empty') {
      els.push({ type: 'group', x: 0, y: 0, blur: 0.0012, children: castBack.filter(c => vis(c.px)).map(c => Object.assign({}, c.el, { x: r4(c.el.x * W / U), y: r4(c.el.y * H / U) })) });
      if (mode === 'line') {
        pieces.filter(p => vis(p.px)).forEach(p => p.els.forEach(e => {
          const c = Object.assign({}, e);
          if (c.id === 'flipper') c.moves = F.flips(Y(feet - midBody), dur, { H, height: 0.16, every: 1.25, start: 0.2 });
          els.push(c);
        }));
        castIdle.filter(c => vis(c.px)).forEach(c => els.push(c.el));
      }
      castHop.filter(c => vis(c.px)).forEach(c => { const e = Object.assign({}, c.el); e.moves = F.hops(Y(feet), dur, { H, every: mode === 'ready' ? 0.3 : 0.5, height: mode === 'ready' ? 0.035 : 0.02, start: c.i * 0.06 }); els.push(e); });
    }
    els.push(...extra);
    els.push(par(1.35, fx0, fx1, dur, ease, front, 0.007));
    return els;
  }

  // ================= HUD pieces (screen space) =================
  const CAP_Y = tall ? 0.865 : 0.885, LT_Y = tall ? 0.73 : 0.7;
  const rec = (label = 'CONFESSIONAL') => ({ type: 'group', screen: true, x: 0.065, y: tall ? 0.055 : 0.07, children: [
    { type: 'circle', r: 0.012, fill: 'primaryDeep', x: 0.008, loop: { fx: 'blink', period: 0.9 } },
    { type: 'text', text: `REC  ·  ${label}`, role: 'caption', size: 0.027, weight: 800, tracking: 0.1, color: 'white', anchor: 'left', align: 'left', x: 0.04, y: 0, highlight: { fill: 'rgba(40,20,30,0.55)', pad: 0.45 } },
  ] });
  const stamp = text => ({ type: 'text', screen: true, text, role: 'caption', size: 0.027, weight: 800, tracking: 0.06, color: 'white', anchor: 'right', align: 'right', x: 0.935, y: tall ? 0.055 : 0.07, highlight: { fill: 'rgba(40,20,30,0.55)', pad: 0.45 } });
  const lowerThird = (name, tag, chip = 'primary') => ({ type: 'group', screen: true, x: 0.06, y: LT_Y, in: { fx: 'slide-right', at: 0.12, dur: 0.45 }, children: [
    { type: 'text', text: name, role: 'headline', size: 0.068, bubble: 0.02, color: 'onPrimary', anchor: 'left', align: 'left', highlight: { fill: chip, pad: 0.28 } },
    { type: 'text', text: tag, role: 'body', size: 0.032, color: 'ink', anchor: 'left', align: 'left', x: 0.012, y: 0.08, highlight: { fill: 'bg', pad: 0.35 } },
  ] });
  const caption = (text, a, b, typeDur) => ({ type: 'text', screen: true, text, role: 'body', size: tall ? 0.05 : 0.044, weight: 800, color: 'ink', x: 0.5, y: CAP_Y, maxWidth: 0.9, highlight: { fill: 'bg', pad: 0.35 }, sfx: false,
    in: { fx: 'type', at: r4(a), dur: r4(typeDur) }, out: b != null ? { fx: 'cut', at: r4(b), dur: 0.01 } : undefined });

  // ================= CONFESSIONAL BUILDER =================
  // shots: [{ from: partIndex, who(opts)→figure, camera, set, extra, bgTo, sfx }] — the voice runs across the cuts.
  function confessional({ id, line, shots, set, grade, lead = 0.35, tail = 0.5, name, tag, chip, stampText }) {
    const pt = partTimes(line), texts = partsOf(line), vd = vdur(line);
    const s = tall ? 6.2 : 4.6, headY = tall ? 0.42 : 0.44, feetY = r4(headY + (0.193 * s * U) / H);
    shots.forEach((shot, k) => {
      const t0 = k === 0 ? -lead : pt[shot.from][0] - 0.05;
      const t1 = k < shots.length - 1 ? pt[shots[k + 1].from][0] - 0.05 : vd + (shot.tail != null ? shot.tail : tail);
      const dur = r4(t1 - t0), vAt = -t0;
      const els = [...set(shot)];
      const figure = shot.who({ x: 0.5, y: feetY, s: s * (shot.scale || 1), talk: talk(line, vAt), step: 12 });
      els.push(figure, ...(shot.extra || []));
      if (k === 0) els.push(voiceEl(line, vAt, { sfx: V[line] ? 'shutter' : 'babble', sfxAt: -vAt + 0.02 }));
      els.push(rec(), stamp(stampText));
      if (k === 0) els.push(lowerThird(name, tag, chip));
      pt.forEach(([a, b], i) => {
        if (b <= t0 + 0.05 || a >= t1) return;
        const nxt = pt[i + 1] ? pt[i + 1][0] - t0 : null;
        els.push(caption(texts[i], Math.max(0, a - t0), nxt != null && nxt < dur ? nxt : null, a >= t0 ? Math.min(0.5, texts[i].length * 0.025) : 0.001));
      });
      scenes.push({ id: `${id}${shots.length > 1 ? String.fromCharCode(97 + k) : ''}`, dur, bg: shot.bg || 'bg', transition: 'cut', bgTo: shot.bgTo, camera: shot.camera || { zoom: [1, 1.04], ease: 'linear', handheld: 0.6 }, grade, elements: els });
    });
  }
  // booth set: blurred brick wall in the character's colour, a framed poster, string lights, a pool of light
  const booth = ({ wall, light = 'white', poster = true, props = [] }) => () => [
    { type: 'group', blur: 0.004, children: [
      { type: 'bricks', w: 1.6, wUnit: 'U', h: H / U + 0.4, fill: wall, anchor: 'top', x: 0.5, y: -0.1, bw: 0.15, bh: 0.075, studs: false, plastic: 0.5 },
      ...(poster ? [{ type: 'group', x: tall ? 0.8 : 0.84, y: tall ? 0.24 : 0.25, rot: 4, children: [
        { type: 'rect', wUnit: 'U', w: 0.3, h: 0.2, fill: 'white', radius: 0.01, plastic: 0.4, edge: true }, { type: 'rect', wUnit: 'U', w: 0.27, h: 0.17, fill: 'bg', radius: 0.006 },
        { type: 'image', src: LOGO, w: 0.24, wUnit: 'U' }] }] : []),
      T.bunting({ points: [[0.05, tall ? 0.07 : 0.08], [0.95, tall ? 0.05 : 0.06]].map(([x, y]) => [x - 0.5, y]), every: 0.09 }),
      ...props,
    ] },
    { type: 'circle', r: 0.55, fill: light, opacity: 0.22, x: 0.5, y: 0.45 },
  ];

  // ================= SCENES =================
  const scenes = [];
  const beat = 0.5;
  // S1 — fly over Bricktown to the back of the line
  const zW = tall ? 0.45 : 0.36, fyW = r4((G - 0.3 * H / zW) / H);
  scenes.push({ id: 'flyover', dur: 4.2, bg: 'chapter1', camera: { focus: [[4.9, fyW], [0.55, FY]], zoom: [zW, 1], ease: 'inOutCubic' },
    elements: world({ fx0: 4.9, fx1: 0.55, z0: zW, z1: 1, dur: 4.2, ease: 'inOutCubic' }).concat([
      { type: 'text', screen: true, text: 'BRICKTOWN · 6:52 AM', role: 'caption', size: 0.032, weight: 800, tracking: 0.12, color: 'white', x: 0.5, y: tall ? 0.1 : 0.09, highlight: { fill: 'rgba(40,20,30,0.55)', pad: 0.5 }, in: { fx: 'type', at: 0.2, dur: 0.5 }, out: { fx: 'fade', at: 2.1, dur: 0.2 }, sfx: 'tick' },
      { type: 'text', screen: true, text: 'Day 9 of The Line.', role: 'headline', size: tall ? 0.066 : 0.056, bubble: 0.015, color: 'ink', x: 0.5, y: tall ? 0.11 : 0.1, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'pop', at: 2.4, dur: 0.4 } },
    ]), grade: { vignette: 0.18, grain: 0.025 } });
  const track = (id, fx0, fx1, dur, o = {}) => scenes.push({ id, dur, bg: 'chapter1', transition: 'cut', camera: { focus: [[fx0, FY], [fx1, FY]], zoom: [1, o.z1 || 1], ease: o.ease || 'linear', shake: o.shake },
    grade: { vignette: 0.18, grain: 0.025 }, elements: world(Object.assign({ fx0, fx1, dur, ease: o.ease || 'linear' }, o)).concat(o.add || []) });
  track('line1', 0.55, 1.75, 3.4, { add: [{ type: 'text', screen: true, text: 'Day 9 of The Line.', role: 'headline', size: tall ? 0.066 : 0.056, bubble: 0.015, color: 'ink', x: 0.5, y: tall ? 0.11 : 0.1, highlight: { fill: 'bg', pad: 0.35 }, out: { fx: 'fade', at: 1.2, dur: 0.2 } }] });

  // Brenda — two angles; the punchline gets the close-up
  const brendaFig = (face, arms) => o => F.minifig(Object.assign({ hair: 'bob', hairColor: 'accent', torso: 'mint', print: 'heart', printColor: 'white', legs: 'lavender', face, arms, seed: 3,
    hand: { type: 'group', rot: -30, children: [{ type: 'rect', wUnit: 'U', w: 0.004, h: 0.1, fill: 'wood', anchor: 'bottom' }, { type: 'circle', r: 0.011, fill: 'white', y: -0.1, plastic: 0.5, edge: true }] } }, o));
  confessional({ id: 'brenda', line: 'brenda', name: 'Brenda', tag: 'Day 9 · brought two tents', chip: 'primaryDeep', stampText: 'DAY 9  07:14',
    grade: { vignette: 0.32, grain: 0.04, tint: 'rgba(255,190,120,0.35)' },
    set: booth({ wall: 'mint', light: 'toyYellow', props: [Object.assign(K.tent({ x: 0.16, y: tall ? 0.62 : 0.75, s: 2.4, color: 'secondary' }), {}), K.campfire({ x: 0.82, y: tall ? 0.66 : 0.8, s: 2.6 })] }),
    shots: [
      { from: 0, who: brendaFig('grin', [9, -40]) },
      { from: 3, who: o => brendaFig('happy', 'cheer')(Object.assign(o, { s: o.s * 1.22, y: r4(o.y + (tall ? 0.09 : 0.13)) })), camera: { zoom: [1.02, 1.06], handheld: 0.9 },
        extra: [{ type: 'repeat', screen: true, mode: 'radial', count: 8, radius: 0.36, x: 0.5, y: 0.42, fills: ['accent', 'bg', 'primary', 'lavender'], child: { type: 'sparkle', screen: true, r: 0.03, fill: 'bg', in: { fx: 'pop', at: 0.05, dur: 0.3 }, loop: { fx: 'pulse', period: 0.5 } }, stagger: 0.03 }] },
    ] });

  // the line keeps going; est. wait counter climbs
  track('line2', 1.75, 2.95, 3.0, { add: [
    { type: 'cycler', screen: true, items: ['Est. wait: 2 hours', 'Est. wait: 2 days', 'Est. wait: 2 years'], at: 0.1, every: 0.95, fx: 'pop', fxDur: 0.25, holdLast: true, role: 'title', size: tall ? 0.048 : 0.042, color: 'ink', x: 0.5, y: tall ? 0.1 : 0.09, highlight: { fill: 'bg', pad: 0.35 } },
  ] });

  // Gary — deadpan, then a crash zoom on "HUNGRY"
  const garyFig = (face, arms, extra = {}) => o => F.minifig(Object.assign({ hair: 'cap', hairColor: 'primaryDeep', torso: 'secondary', print: 'tie', printColor: 'primaryDeep', legs: 'ink', face, arms, seed: 7 }, extra, o));
  confessional({ id: 'gary', line: 'gary', name: 'Gary', tag: 'Totally calm. Very calm.', chip: 'dark', stampText: 'DAY 9  07:31',
    grade: { vignette: 0.3, grain: 0.04 },
    set: booth({ wall: 'secondary' }),
    shots: [
      { from: 0, who: garyFig('deadpan', 'hips') },
      { from: 1, who: garyFig('furious', 'fist', { vein: true, sweat: true }), bg: 'primary', tail: 0.6,
        camera: { at: [0.5, tall ? 0.42 : 0.44], keys: [{ at: 0, dur: 0.16, zoom: 1.6, ease: 'outExpo' }], zoom: [1.0, 1.0], shake: 0.9 },
        bgTo: [{ at: 0, dur: 0.1, bg: 'primary' }],
        extra: [{ type: 'rays', screen: true, r: 1.2, count: 22, fill: 'primaryDeep', opacity: 0.25, x: 0.5, y: 0.42, in: { fx: 'scale', at: 0, dur: 0.2 }, loop: { fx: 'spin', period: 4 }, sfx: 'impact' }] },
    ] });

  track('line3', 2.95, 3.85, 2.5, { add: [
    { type: 'text', screen: true, text: 'Est. wait: ∞', role: 'title', size: tall ? 0.048 : 0.042, color: 'primaryDeep', x: 0.5, y: tall ? 0.1 : 0.09, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'pop', at: 0.1, dur: 0.3 }, loop: { fx: 'beat', period: 0.5, amp: 0.8 } },
  ] });

  // Chad — the schemer. Purple light, then the "dun dun DUN"
  const chadFig = (face, arms, extra = {}) => o => F.minifig(Object.assign({ face, arms, torso: 'ink', print: 'jacket', printColor: 'white', hair: 'spiky', hairColor: 'accent', legs: 'ink', seed: 9,
    armLoops: [{ fx: 'sway', period: 0.2, amp: 0.7 }, { fx: 'sway', period: 0.2, amp: 0.7, phase: 1.5 }] }, extra, o));
  confessional({ id: 'chad', line: 'chad', name: 'Chad', tag: 'Has a plan', chip: 'lavender', stampText: 'DAY 9  07:48',
    grade: { vignette: 0.55, grain: 0.05, tint: 'rgba(90,40,140,0.55)' },
    set: booth({ wall: 'lavender', light: 'secondary', poster: true }),
    shots: [
      { from: 0, who: chadFig('sly', 'hold', { look: 0.6 }) },
      { from: 1, who: chadFig('sly', 'hold', { eyes: 'half', headTilt: -6 }), bg: 'lavender', tail: 1.2,
        camera: { at: [0.5, tall ? 0.43 : 0.45], keys: [{ at: 0, dur: 0.12, zoom: 1.35, ease: 'outExpo' }, { at: 0.2, dur: 3, zoom: 1.5, ease: 'linear' }], handheld: 0.4 },
        bgTo: [{ at: 0, dur: 0.05, bg: 'dark' }],
        extra: [{ type: 'rect', screen: true, wUnit: 'U', w: 3, h: 3, fill: 'white', x: 0.5, y: 0.5, opacity: 0.9, in: { fx: 'cut', at: 0, dur: 0.01 }, out: { fx: 'fade', at: 0.02, dur: 0.18 }, sfx: false },
          { type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: 1.55, dur: 0.01 }, sfx: 'sting' }] },
    ] });

  // Steve — waiting since 1998
  confessional({ id: 'steve', line: 'steve', name: 'Steve', tag: "In line since '98", chip: 'wood', stampText: 'DAY 9,000-ish', lead: 0.55,
    grade: { vignette: 0.5, grain: 0.07, tint: 'rgba(200,160,90,0.5)' },
    set: booth({ wall: 'cardboard', light: 'bg', poster: false, props: [
      { type: 'group', x: 0.8, y: tall ? 0.24 : 0.25, rot: -3, children: [{ type: 'rect', wUnit: 'U', w: 0.22, h: 0.26, fill: 'white', radius: 0.008, plastic: 0.3, edge: true }, { type: 'rect', wUnit: 'U', w: 0.22, h: 0.06, fill: 'primary', y: -0.1, radius: 0.008 },
        { type: 'text', text: '1998', role: 'display', size: 0.075, color: 'ink', y: 0.02 }] },
      Object.assign(K.cobweb(), { x: 0.02, y: 0.02, scale: 3 }), Object.assign(K.cobweb(), { x: 0.98, y: tall ? 0.6 : 0.7, scale: 3, rot: 180 }),
    ] }),
    shots: [{ from: 0, who: o => F.minifig(Object.assign({ skeleton: true, arms: [9, -9], loop: { fx: 'boil', amp: 0.8 }, extra: [Object.assign(K.cobweb(), { x: 0.035, y: -0.2 })] }, o)),
      camera: { zoom: [1, 1.12], ease: 'linear', handheld: 0.3 },
      extra: [{ type: 'dots', screen: true, count: 26, seed: 9, fill: ['bg', 'white'], r: 0.005, motion: 'drift', area: [0.05, 0.05, 0.95, 0.8], in: { at: 0 } },
        { type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: 0.15, dur: 0.01 }, sfx: 'rattle' }] }] });

  // ================= COUNTDOWN =================
  const fxB = r4((BX - (tall ? 60 : 0)) / W), zC = tall ? 0.85 : 0.62, fyC = r4((feet - (tall ? 0.22 : 0.28) * H / (tall ? 0.85 : 0.62)) / H);
  const bakerAt = r4(0.3), bakerDur = vdur('baker');
  const chantAt = [0, 1, 2].map(k => r4(bakerAt + bakerDur + 0.25 + k * 0.62));
  const cdDur = r4(chantAt[2] + 0.62);
  const baker = (o = {}) => F.minifig(Object.assign({ x: X(BX + 150), y: Y(feet - 6), s: FS * 1.05, torso: 'white', print: 'apron', printColor: 'blush', legs: 'ink', hair: 'chef', mustache: true, face: 'grin', seed: 2 }, o));
  const crowdReady = () => {
    const out = [];
    [-640, -500, -360, -220].forEach((dx, i) => out.push(F.minifig({ x: X(BX + dx), y: Y(feet), s: FS, face: ['furious', 'happy', 'sly', 'grin'][i], vein: i === 0,
      torso: ['secondary', 'mint', 'ink', 'accent'][i], print: ['tie', 'heart', 'jacket', 'hoodie'][i], printColor: ['primaryDeep', 'white', 'white', 'bg'][i], hair: ['cap', 'bob', 'spiky', 'beanie'][i], hairColor: ['primaryDeep', 'accent', 'accent', 'primary'][i],
      legs: 'ink', arms: 'reach', look: 0.8, moves: F.hops(Y(feet), cdDur, { H, every: 0.32, height: 0.012, start: i * 0.08 }) })));
    return out;
  };
  // subtle countdown: a small brick-number bug in the corner, ticking — present, not shouting
  const tile = (n, t) => ({ type: 'group', screen: true, x: 0.86, y: tall ? 0.115 : 0.13, scale: tall ? 0.34 : 0.28, in: { fx: 'pop-soft', at: t, dur: 0.25 }, out: { fx: 'fade', at: r4(t + 0.56), dur: 0.06 }, sfx: 'tick', children: [F.numberTile(n, { fill: ['toyYellow', 'accent', 'primary'][3 - n], size: 0.3 })] });
  scenes.push({ id: 'countdown', dur: cdDur, bg: 'chapter1', transition: 'cut',
    camera: { focus: [[fxB - 0.12, fyC], [fxB, fyC]], zoom: [zC * 0.94, zC], ease: 'outCubic' }, grade: { vignette: 0.2, grain: 0.025 },
    elements: world({ fx0: fxB - 0.12, fx1: fxB, z0: zC, z1: zC, dur: cdDur, ease: 'outCubic', mode: 'ready', minute: [{ at: 0, dur: 0.01, rot: -24 }, ...[0, 1, 2].map(k => ({ at: chantAt[k], dur: 0.1, rot: -12 + k * 6, ease: 'outBack' })), { at: r4(cdDur - 0.08), dur: 0.08, rot: 0 }] }).concat([
      ...crowdReady(),
      baker({ arms: [9, -150], hand: F.megaphone(), talk: talk('baker', bakerAt), face: 'grin' }),
      voiceEl('baker', bakerAt),
      ...chantAt.flatMap((t, k) => [0, 1, 2, 3, 4].map(i => voiceEl(`chant_${['three', 'two', 'one'][k]}_${i}`, r4(t + i * 0.015), { voiceGain: 0.32, voicePan: (i - 2) * 0.35 }))),
      ...chantAt.map((t, k) => tile(3 - k, t)),
      { type: 'text', screen: true, text: 'opens in', role: 'caption', size: tall ? 0.024 : 0.022, weight: 700, color: 'ink', x: 0.86, y: tall ? 0.06 : 0.065, opacity: 0.85, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'fade', at: r4(chantAt[0] - 0.1), dur: 0.25 }, sfx: false },
    ]) });

  // ================= DOORS OPEN — STAMPEDE =================
  const rushDur = 4.3, openAt = 0.85, doorX = BX - 0.0, runners = [];
  F.seed(41);
  for (let i = 0; i < 42; i++) {
    const lane = i % 4, t0 = r4(openAt + 0.05 + i * 0.045 + F.rand() * 0.05), d = r4(1.05 + F.rand() * 0.45 - (lane === 3 ? 0.2 : 0));
    const startX = BX - 1100 - F.rand() * 500, y0 = [backFeet + 14, feet - 18, feet + 4, feet + (tall ? 150 : 110)][lane];
    const s = [0.85, 1, 1.05, 1.35][lane] * FS, back = lane === 0;
    runners.push(F.minifig({ x: X(startX), y: Y(y0), s, view: 'side', legPose: 'run', run: 0.24, torso: F.pick(SHIRTS), legs: F.pick(PANTS), hair: F.pick(HAIRS), hairColor: F.pick(HAIRC), face: F.pick(['grin', 'furious', 'happy', 'shock']),
      in: { fx: 'cut', at: t0, dur: 0.01 }, sfx: i === 0 ? 'rumble' : false, sfxDur: 2.2,
      moves: [{ at: t0, dur: d, x: X(doorX), ease: 'inQuad' }, { at: r4(t0 + d - 0.1), dur: 0.14, scale: s * 0.55, opacity: 0, ease: 'inQuad' }]}));
    if (i % 5 === 0) runners.push(F.dust({ x: X(BX - 500 - F.rand() * 500), y: Y(feet), at: r4(t0 + d * 0.5), s: 1.4 + F.rand(), fill: 'white', seedN: i + 3 }));
  }
  runners.sort((p, q) => (p.y || 0) - (q.y || 0));   // far lanes first
  // flying hats
  ['cap', 'beanie', 'chef'].forEach((h, k) => runners.push({ type: 'group', x: X(BX - 420 - k * 160), y: Y(feet - 0.28 * U), in: { fx: 'cut', at: r4(openAt + 0.5 + k * 0.2), dur: 0.01 },
    moves: [{ at: r4(openAt + 0.5 + k * 0.2), dur: 1.1, y: Y(feet - 0.75 * U), rot: 540 + k * 90, ease: 'outCubic' }], children: [{ type: 'group', scale: FS, children: F.hair(h, ['primary', 'accent', 'white'][k]) }] }));
  const steveRush = { type: 'group', x: X(BX - 820), y: Y(feet), children: [
    F.minifig({ skeleton: true, s: FS, arms: 'up', step: 12, loop: { fx: 'none' }, in: { fx: 'cut', at: 0, dur: 0.01 },
      moves: [...Array.from({ length: 8 }, (_, k) => ({ at: r4(openAt + 0.3 + k * 0.12), dur: 0.06, sx: k % 2 ? 1 : -1, ease: 'linear' })), { at: r4(openAt + 1.4), dur: 0.25, rot: 90, ease: 'inQuad' }] }),
  ] };
  scenes.push({ id: 'rush', dur: rushDur, bg: 'chapter1', transition: 'cut',
    camera: { focus: [[fxB - 0.15, fyC], [fxB - 0.15, fyC]], zoom: [zC * 0.92, zC * 0.92], shake: 0.35 }, grade: { vignette: 0.2, grain: 0.025 },
    elements: world({ fx0: fxB - 0.15, fx1: fxB - 0.15, z0: zC * 0.92, z1: zC * 0.92, dur: rushDur, mode: 'empty', doorOpen: openAt, flipAt: 0.25 }).concat([
      baker({ arms: [9, -150], hand: F.megaphone(), talk: talk('open', 0.05), face: 'grin', moves: [{ at: r4(openAt - 0.05), dur: 0.35, x: X(BX + 520), rot: 25, ease: 'outCubic' }] }),
      voiceEl('open', 0.05),
      { type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: openAt, dur: 0.01 }, sfx: 'bell' },
      steveRush, ...runners,
      ...Array.from({ length: 7 }, (_, i) => ({ type: 'pill', screen: true, w: 0.25 + (i % 3) * 0.1, h: 0.008, fill: 'white', opacity: 0.8, x: -0.2, y: r4(0.45 + i * (tall ? 0.05 : 0.06)),
        in: { fx: 'cut', at: r4(openAt + 0.1 + i * 0.09), dur: 0.01 }, moves: [{ at: r4(openAt + 0.1 + i * 0.09), dur: 0.45, x: 1.3, ease: 'inQuad' }] })),
      { type: 'text', screen: true, text: 'WE’RE OPEN!', role: 'display', size: tall ? 0.11 : 0.09, bubble: 0.03, color: 'primary', outline: { color: 'white', w: 0.06 }, x: 0.5, y: tall ? 0.16 : 0.15, rot: -4, in: { fx: 'pop', at: 0.1, dur: 0.35 }, out: { fx: 'scale', at: 1.6, dur: 0.2 }, loop: { fx: 'shake', amp: 0.6 } },
      { type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: r4(openAt + 0.25), dur: 0.01 }, sfx: 'cheer' },
      { type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: r4(openAt + 1.7), dur: 0.01 }, sfx: 'boing' },
    ]) });

  // ================= STEVE FINALLY GETS HIS BOX =================
  const finDur = 3.4, giveAt = 0.55;
  const zF = tall ? 1.1 : 0.9, fxF = r4((BX - 230) / W), fyF = r4((feet - (tall ? 0.3 : 0.32) * H / (tall ? 1.1 : 0.9)) / H);
  const box = F.sweetBox({ s: FS * 1.1, logo: CHERRY });
  scenes.push({ id: 'finally', dur: finDur, bg: 'chapter1', transition: { type: 'wipe', dir: 'left', bands: ['primary', 'bg'], bandW: 0.1, dur: 0.4 },
    camera: { focus: [[fxF, fyF], [fxF + 0.02, fyF]], zoom: [zF, zF * 1.06], ease: 'linear' }, grade: { vignette: 0.25, grain: 0.03 },
    elements: world({ fx0: fxF, fx1: fxF + 0.02, z0: zF, z1: zF, dur: finDur, mode: 'empty', doorOpen: -1, flipAt: null }).concat([
      baker({ x: X(BX + 40), arms: [9, -60], face: 'happy' }),
      F.minifig({ x: X(BX - 420), y: Y(feet), s: FS, skeleton: true, arms: [-20, 20], armSy: 0.85, talk: talk('finally', 1.25), loop: { fx: 'jelly', period: 0.5, amp: 0.6 } }),
      Object.assign({}, box, { x: X(BX - 30), y: Y(feet - 0.13 * FS * U), moves: [{ at: giveAt, dur: 0.55, x: X(BX - 420), y: Y(feet - 0.1 * FS * U), ease: 'inOutCubic' }], sfx: false }),
      voiceEl('finally', 1.25),
      { type: 'repeat', mode: 'radial', count: 10, radius: 0.32, x: X(BX - 420), y: Y(feet - 0.25 * FS * U), stagger: 0.04, fills: ['primary', 'bg', 'lavender', 'accent', 'mint'], seed: 2, vary: { rot: 30, scale: 0.6 },
        child: { type: 'heart', r: 0.035, fill: 'bg', plastic: 0.7, in: { fx: 'pop', at: 2.15, dur: 0.4 }, loop: { fx: 'float', period: 1.6 } } },
      { type: 'dots', count: 40, seed: 31, fill: ['primary', 'lavender', 'mint', 'accent', 'bg'], r: 0.012, x: X(BX - 420), y: Y(feet - 0.3 * U), area: [X(BX - 1100), Y(G - 0.9 * U), X(BX + 300), Y(G + 60)], motion: 'burst', in: { at: 2.15, dur: 1.0 }, sfx: 'chime' },
      { type: 'text', screen: true, text: '“Finally.”', role: 'headline', size: tall ? 0.07 : 0.06, bubble: 0.015, color: 'ink', x: 0.5, y: CAP_Y, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'type', at: 1.3, dur: 0.3 }, sfx: false },
    ]) });

  // ================= END CARD =================
  const endDur = 5.2;
  const happy = (x, y, s, o) => F.minifig(Object.assign({ x, y, s, arms: [-20, 20], armSy: 0.85, face: 'happy', step: 12, loop: { fx: 'jelly', period: 0.5, amp: 0.8 }, extra: [Object.assign(F.sweetBox({ s: 0.75, logo: CHERRY }), { x: 0, y: -0.1 })] }, o));
  scenes.push({ id: 'end', dur: endDur, bg: 'bg', transition: { type: 'wipe', dir: 'up', bands: ['secondary', 'accent'], bandW: 0.12, dur: 0.45 }, grade: { vignette: 0.12, grain: 0.02 },
    elements: [
      { type: 'dots', count: 18, seed: 12, fill: ['primary', 'lavender', 'mint', 'accent'], r: 0.012, motion: 'drift', area: [0.05, 0.04, 0.95, 0.96], in: { at: 0 } },
      { type: 'blob', r: tall ? 0.42 : 0.34, fill: 'chapter1', x: 0.5, y: tall ? 0.4 : 0.38, wobble: 0.08, speed: 1.4, in: { fx: 'scale', at: 0.05, dur: 0.8 } },
      { type: 'group', x: tall ? 0.86 : 0.9, y: Y(-120), in: { fx: 'swing', at: 0.15, dur: 1.4 }, loop: { fx: 'sway', period: '4b', amp: 0.6 }, children: [
        { type: 'rect', w: 0.006, h: ((tall ? 330 : 90) + 120) / U, fill: 'ink', anchor: 'top', x: 0, y: 0 },
        { type: 'image', src: CHERRY, w: tall ? 0.095 : 0.075, wUnit: 'U', anchor: 'top', x: 0, y: ((tall ? 330 : 90) + 112) / U } ] },
      { type: 'text', text: 'Worth every\nwait.', role: 'display', size: tall ? 0.14 : 0.1, maxWidth: tall ? 0.84 : 0.7, bubble: 0.035, color: 'primary', outline: { color: 'white', w: 0.06 }, x: 0.5, y: tall ? 0.22 : 0.2, split: 'word', stagger: 0.12, in: { fx: 'pop', at: 0.2, dur: 0.45 }, loop: { fx: 'wave', period: '2b', amp: 0.6 } },
      { type: 'logo', w: tall ? 0.66 : 0.5, x: 0.5, y: tall ? 0.43 : 0.44, in: { fx: 'pop-soft', at: 0.7, dur: 0.6 }, loop: { fx: 'jelly', period: '2b', amp: 0.5 } },
      { type: 'text', text: 'Order your sweet box', role: 'headline', size: tall ? 0.062 : 0.052, bubble: 0.015, color: 'ink', x: 0.5, y: tall ? 0.56 : 0.6, maxWidth: 0.94, in: { fx: 'rise', at: 1.1, dur: 0.5 } },
      { type: 'text', text: '(868) 715-4817', role: 'title', size: 0.055, color: 'ink', x: 0.5, y: tall ? 0.625 : 0.69, highlight: { fill: 'chapter2', pad: 0.38 }, in: { fx: 'pop', at: 1.4, dur: 0.45 }, loop: { fx: 'beat', period: '2b', amp: 0.5 } },
      { type: 'baseplate', w: 1.2, wUnit: 'U', h: 0.2, fill: 'chapter3', x: 0.5, y: tall ? 0.93 : 0.95, anchor: 'top', pitch: 0.04 },
      happy(0.2, tall ? 0.94 : 0.965, tall ? 1.25 : 0.82, { skeleton: true, in: { fx: 'plop', at: 1.7, dur: 0.8 } }),
      happy(0.5, tall ? 0.94 : 0.965, tall ? 1.25 : 0.82, { hair: 'bob', hairColor: 'accent', torso: 'mint', print: 'heart', printColor: 'white', legs: 'lavender', in: { fx: 'plop', at: 1.85, dur: 0.8 } }),
      happy(0.8, tall ? 0.94 : 0.965, tall ? 1.25 : 0.82, { hair: 'cap', hairColor: 'primaryDeep', torso: 'secondary', print: 'tie', printColor: 'primaryDeep', legs: 'ink', face: 'dreamy', in: { fx: 'plop', at: 2.0, dur: 0.8 } }),
      voiceEl('narrator', 0.75, { voiceGain: 0.95 }),
    ] });

  return { title: `Jadesserts — The Line v2 (${fmt})`, format: { w: W, h: H, fps: 30 }, bpm: 120, scenes };
}

for (const f of ['9x16', '1x1']) {
  const story = make(f);
  const out = path.join(here, `storyboard-${f}.json`);
  fs.writeFileSync(out, JSON.stringify(story) + '\n');
  const dur = story.scenes.reduce((a, s) => a + (typeof s.dur === 'number' ? s.dur : 0), 0);
  console.log('wrote', path.relative(process.cwd(), out), (fs.statSync(out).size / 1024).toFixed(0) + 'KB', `${dur.toFixed(1)}s`, story.scenes.map(s => `${s.id}:${s.dur}`).join(' '));
}
