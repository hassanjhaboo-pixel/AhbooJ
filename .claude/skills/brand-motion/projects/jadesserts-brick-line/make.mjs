#!/usr/bin/env node
// Jadesserts "The Line" — 30s brick-world commercial (9:16 + 1:1), built on kits/brickworld.mjs.
// Story: fly over Bricktown → the impossibly long line → documentary cutaways with people in it →
// the line ends at the Jadesserts bakery → "Worth every wait."
//   node make.mjs   → storyboard-9x16.json, storyboard-1x1.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as K from '../../kits/brickworld.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));

const LOGO = '../../brand/assets/jadesserts/logo.png';
const CHERRY = '../../brand/assets/jadesserts/logo-cherry.png';
const PROD = n => `../jadesserts-sweet-box/assets/products/${n}.png`;
const r4 = v => Math.round(v * 10000) / 10000;

const SHIRTS = ['primary', 'secondary', 'mint', 'accent', 'blushDeep', 'lavender', 'chapter4', 'primaryDeep'];
const PANTS = ['lavender', 'ink', 'blushDeep', 'secondary', 'mint', 'wood'];
const HAIRS = ['cap', 'bob', 'bun', 'spiky', 'beanie', 'ponytail', 'none'];
const HAIRC = ['ink', 'wood', 'accent', 'primaryDeep', 'lavender', 'cardboard'];

function make(fmt) {
  const tall = fmt === '9x16', W = 1080, H = tall ? 1920 : 1080, U = 1080;
  const X = px => r4(px / W), Y = py => r4(py / H), u = px => r4(px / U);
  const G = tall ? 1430 : 840;                 // ground line (feet), px
  const FS = tall ? 1.3 : 1.1;                 // figure scale
  const FY = r4((G - (tall ? 0.24 : 0.25) * H) / H); // camera focus y so the ground sits low in frame
  const beat = 0.5;
  K.seed(fmt === '9x16' ? 7 : 7);              // same cast in both formats

  // ---------------- the world (built once, culled per shot) ----------------
  const far = [], mid = [], ground = [], back = [], front = [], fx = [];
  // far: sun + brick clouds
  far.push({ px: 4200, el: { type: 'group', x: 0, y: 0, children: [] } });
  const farKids = [];
  farKids.push({ type: 'rays', r: 0.5, count: 16, fill: 'white', opacity: 0.35, x: u(2900), y: u(G - (tall ? 1180 : 700)), loop: { fx: 'spin', period: 30 } });
  farKids.push({ type: 'scallop', r: 0.14, bumps: 14, depth: 0.08, fill: 'accent', x: u(2900), y: u(G - (tall ? 1180 : 700)), loop: { fx: 'pulse', period: 3 } });
  for (let x = -600; x < 8000; x += 520 + K.rand() * 380) farKids.push(K.cloud({ x: u(x), y: u(G - (tall ? 900 + K.rand() * 450 : 520 + K.rand() * 200)), s: 0.8 + K.rand() * 0.9 }));
  // mid: skyline
  const midKids = [];
  const bCols = ['secondary', 'chapter4', 'blushDeep', 'chapter3', 'lavender', 'blush'];
  for (let x = -700, i = 0; x < 8200; i++) {
    const w = 0.3 + K.rand() * 0.18, h = tall ? 0.55 + K.rand() * 0.4 : 0.32 + K.rand() * 0.22;
    midKids.push(K.building({ x: u(x + (w * U) / 2), y: u(G - 40), w, h, color: bCols[i % bCols.length], roof: bCols[(i + 2) % bCols.length], rows: Math.max(2, Math.round(h / 0.17)), cols: w > 0.38 ? 3 : 2, door: false }));
    x += w * U + 30 + K.rand() * 90;
  }
  // ground: sidewalk + baseplate + trees/lamps behind the queue
  const groundKids = [
    { type: 'rect', w: 9.5, wUnit: 'U', h: 3, fill: 'mint', anchor: 'top', x: u(3500), y: u(G + 52) },
    { type: 'bricks', w: 9.5, wUnit: 'U', h: 0.09, fill: 'mint', anchor: 'top', x: u(3500), y: u(G + 52), bw: 0.06, bh: 0.03 },
    { type: 'bricks', w: 9.5, wUnit: 'U', h: 0.085, fill: 'bg', anchor: 'top', x: u(3500), y: u(G - 34), bw: 0.12, bh: 0.0425 },
  ];
  for (let x = 200; x < 5300; x += 640) groundKids.push((x / 640) % 2 < 1 ? K.tree({ x: u(x), y: u(G - 30), s: tall ? 1.6 : 1.3 }) : K.lamp({ x: u(x), y: u(G - 30), s: tall ? 1.5 : 1.25 }));

  const fgKids = [];
  for (let x = -200; x < 9000; x += 560 + K.rand() * 240) {
    const fy = G + (tall ? 230 : 150);
    fgKids.push({ type: 'group', x: u(x), y: u(fy), children: [
      { type: 'bricks', w: 0.3, wUnit: 'U', h: 0.07, fill: K.pick(['blushDeep', 'secondary', 'chapter4']), anchor: 'top', x: 0, y: 0, bw: 0.075, bh: 0.035 },
      ...[-0.1, -0.03, 0.04, 0.11].map((fx, i) => ({ type: 'group', x: fx, y: -0.005, children: [
        { type: 'rect', w: 0.006, wUnit: 'U', h: 0.05, fill: 'chapter3', anchor: 'bottom', x: 0, y: 0 },
        { type: 'scallop', r: 0.02, bumps: 6, depth: 0.25, fill: ['bg', 'accent', 'primary', 'lavender'][i % 4], x: 0, y: -0.055, loop: { fx: 'sway', period: 2 + i * 0.3, amp: 1.2 } },
        { type: 'circle', r: 0.007, fill: 'toyYellow', x: 0, y: -0.055 } ] })),
    ] });
  }

  // ---------------- the bakery ----------------
  const BX = 6020, wallH = tall ? 0.78 : 0.6, doorX = BX;
  const bakery = { type: 'group', x: X(BX), y: Y(G - 34), children: [
    { type: 'bricks', w: 1.06, wUnit: 'U', h: wallH, fill: 'primary', anchor: 'bottom', x: 0, y: 0, bw: 0.07, bh: 0.035 },
    { type: 'bricks', w: 1.12, wUnit: 'U', h: 0.04, fill: 'primaryDeep', anchor: 'bottom', x: 0, y: -wallH, bw: 0.07, bh: 0.04 },
    // rooftop sign with the real logo
    { type: 'group', x: 0, y: -wallH - 0.2, loop: { fx: 'float', period: 3, amp: 0.4 }, children: [
      { type: 'rect', w: 0.86, wUnit: 'U', h: 0.33, fill: 'bg', radius: 0.05, stroke: 'primaryDeep', strokeW: 0.008, shadow: { color: 'rgba(74,44,51,0.25)', blur: 0.02, y: 0.01 } },
      { type: 'image', src: LOGO, w: 0.74, x: 0, y: 0 },
      ...[-0.4, 0.4].map(x => ({ type: 'rect', w: 0.012, wUnit: 'U', h: 0.06, fill: 'ink', anchor: 'top', x, y: 0.165 })),
    ] },
    // awning
    ...Array.from({ length: 9 }, (_, i) => ({ type: 'rect', w: 0.122, wUnit: 'U', h: 0.1, fill: i % 2 ? 'blush' : 'bg', anchor: 'top', x: -0.488 + i * 0.122, y: -wallH * 0.62 })),
    ...Array.from({ length: 9 }, (_, i) => ({ type: 'circle', r: 0.061, fill: i % 2 ? 'blush' : 'bg', x: -0.488 + i * 0.122, y: -wallH * 0.62 + 0.1 })),
    // windows with the real products
    ...[-0.33, 0.33].map((wx, j) => ({ type: 'group', x: wx, y: -0.2, children: [
      { type: 'rect', w: 0.28, wUnit: 'U', h: 0.24, fill: 'glass', radius: 0.02, stroke: 'bg', strokeW: 0.012 },
      { type: 'rect', w: 0.26, wUnit: 'U', h: 0.012, fill: 'wood', y: 0.07 },
      { type: 'image', src: PROD(j ? 'chicken-puff' : 'vanilla-cupcake'), w: j ? 0.11 : 0.08, wUnit: 'U', anchor: 'bottom', x: -0.06, y: 0.065 },
      { type: 'image', src: PROD(j ? 'fruit-punch' : 'banana-bread'), w: j ? 0.05 : 0.1, wUnit: 'U', anchor: 'bottom', x: 0.065, y: 0.065 },
    ] })),
    // door frame + interior glow; the door itself is added per shot (it opens in the reveal)
    { type: 'rect', w: 0.2, wUnit: 'U', h: 0.32, fill: 'bg', anchor: 'bottom', x: 0, y: 0, radius: 0.04 },
    { type: 'rect', w: 0.17, wUnit: 'U', h: 0.3, fill: 'accent', anchor: 'bottom', x: 0, y: 0, radius: 0.035 },
    { type: 'heart', r: 0.03, fill: 'primary', x: 0.0, y: -0.37, loop: { fx: 'pulse', period: 1, amp: 1.5 } },
  ] };
  const door = (openAt) => ({ type: 'group', x: X(BX - 0.085 * U), y: Y(G - 34), children: [
    { type: 'rect', w: 0.17, wUnit: 'U', h: 0.3, fill: 'lavender', anchor: 'bottom-left', x: 0, y: 0, radius: 0.035, out: openAt != null ? { fx: 'grow', at: openAt, dur: 0.35, ease: 'inCubic' } : null },
    { type: 'circle', r: 0.035, fill: 'glass', x: 0.085, y: -0.2, out: openAt != null ? { fx: 'fade', at: openAt, dur: 0.15 } : null },
    { type: 'heart', r: 0.018, fill: 'primary', x: 0.085, y: -0.11, out: openAt != null ? { fx: 'fade', at: openAt, dur: 0.15 } : null },
  ] });

  // ---------------- the queue ----------------
  // front-row slots every 118px from the back of the line (x≈380) to the door
  const slots = []; for (let x = 380; x <= 5800; x += 150) slots.push(x);
  const used = new Set();
  const take = (...idx) => idx.forEach(i => used.add(i));
  const feet = G + 26, backFeet = G - 6;
  const fig = (o) => K.figure(Object.assign({
    s: FS, shirt: K.pick(SHIRTS), pants: K.pick(PANTS), hair: K.pick(HAIRS), hairColor: K.pick(HAIRC), seed: Math.floor(K.rand() * 99),
  }, o));
  const at = (px, py, extra = {}) => Object.assign({ x: X(px), y: Y(py) }, extra);
  // set pieces (index → builder). Each returns { px, els[] }
  const pieces = [];
  const piece = (i, build) => { take(i); pieces.push({ px: slots[i], els: build(slots[i]) }); };

  piece(0, x => [fig(at(x, feet, { arms: 'up', face: 'grin', shirt: 'mint', extra: [Object.assign(K.sign('END OF\nLINE', { w: 0.15, h: 0.075, size: 0.02 }), { x: 0, y: -0.33 })] }))]);
  take(3); piece(2, x => [ // Brenda, camping
    K.tent({ x: X(x - 30), y: Y(backFeet - 4), s: FS * 1.05, color: 'secondary' }),
    K.campfire({ x: X(x + 112), y: Y(feet), s: FS * 1.2 }),
    fig(at(x + 40, feet, { id: 'brenda', legs: 'sit', arms: 'hold', hair: 'bob', hairColor: 'accent', shirt: 'mint', print: 'heart', face: 'smile',
      hand: { type: 'group', rot: -40, children: [{ type: 'rect', w: 0.004, wUnit: 'U', h: 0.09, fill: 'wood', anchor: 'bottom', x: 0, y: 0 }, { type: 'circle', r: 0.01, fill: 'white', x: 0, y: -0.09 }] } })),
  ]);
  piece(5, x => [fig(at(x, feet, { legs: 'run', arms: 'swing', hair: 'beanie', hairColor: 'primary', shirt: 'accent', face: 'grin', speed: 0.36 }))]);
  take(7); piece(6, x => [
    fig(at(x, feet, { legs: 'dance', arms: 'up', face: 'grin', shirt: 'lavender', hair: 'ponytail', hairColor: 'wood' })),
    fig(at(x + 150, feet, { legs: 'dance', arms: 'up', face: 'o', shirt: 'primary', hair: 'spiky', hairColor: 'ink', speed: 0.38 })),
    ...[0, 1, 2].map(k => ({ type: 'text', text: k % 2 ? '♫' : '♪', role: 'title', size: 0.045, color: 'primaryDeep', x: X(x + 60 + k * 40), y: Y(feet - 0.36 * FS * U), loop: { fx: 'float', period: 0.8 + k * 0.2, amp: 3 } })),
  ]);
  piece(9, x => [ // heart balloon
    { type: 'group', x: X(x + 30), y: Y(feet - 0.17 * FS * U), loop: { fx: 'sway', period: 2.2, amp: 1.5 }, children: [
      { type: 'path', points: [[0, 0], [0.01, -0.12], [0.02, -0.24]], stroke: 'ink', strokeW: 0.002 },
      { type: 'heart', r: 0.045 * FS, fill: 'primary', x: 0.02, y: -0.28, loop: { fx: 'float', period: 1.8 } } ] },
    fig(at(x, feet, { arms: 'wave', face: 'smile', shirt: 'chapter4', hair: 'bun', hairColor: 'primaryDeep' })),
  ]);
  const midBody = 0.13 * FS * U; // flip around the middle of the body, not the feet
  take(11); piece(10, x => [{ type: 'group', id: 'flipper', x: X(x + 50), y: Y(feet - midBody), children: [
    Object.assign(fig({ arms: 'up', face: 'grin', shirt: 'secondary', hair: 'cap', hairColor: 'accent', loop: { fx: 'none' } }), { x: 0, y: u(midBody) }) ] }]);
  piece(13, x => [fig(at(x, feet, { arms: 'hold', face: 'flat', headTilt: 10, shirt: 'blushDeep', hand: { type: 'rect', w: 0.03, wUnit: 'U', h: 0.045, fill: 'ink', radius: 0.005, x: 0.012, y: -0.01 } }))]);
  take(15); piece(14, x => [ // Gary, furious
    fig(at(x + 50, feet, { id: 'gary', arms: 'up', face: 'angry', hair: 'cap', hairColor: 'primaryDeep', shirt: 'secondary', loop: { fx: 'shake', amp: 0.7 } })),
    Object.assign(K.bubble('#@%!', { w: 0.12, h: 0.06, size: 0.03, ink: 'primaryDeep' }), { x: X(x + 150), y: Y(feet - 0.4 * FS * U), scale: FS, loop: { fx: 'beat', period: 0.5, amp: 1.2 } }),
  ]);
  take(18); piece(17, x => [K.sleepingBag({ x: X(x + 60), y: Y(feet), s: FS * 1.1, color: 'lavender', dur: 30 })]);
  piece(19, x => [fig(at(x, feet, { arms: 'up', face: 'flat', shirt: 'mint', hair: 'bob', hairColor: 'ink', extra: [Object.assign(K.sign('DAY 12', { w: 0.12, h: 0.06 }), { x: 0, y: -0.33 })] }))]);
  piece(20, x => [ // granny knitting a very long scarf
    fig(at(x, feet, { arms: 'hug', face: 'smile', hair: 'bun', hairColor: 'bone', shirt: 'lavender', print: 'stripe', printColor: 'bg' })),
    { type: 'path', points: [[X(x - 10), Y(feet - 0.11 * FS * U)], [X(x - 40), Y(feet - 0.02 * FS * U)], [X(x - 140), Y(feet + 10)], [X(x - 330), Y(feet + 18)]], stroke: 'primary', strokeW: 0.012, dash: [0.012, 0.004] },
  ]);
  take(23); piece(22, x => [
    fig(at(x, feet, { arms: 'hug', face: 'grin', shirt: 'primary', hair: 'bob', hairColor: 'wood' })),
    fig(at(x + 100, feet, { arms: 'hug', face: 'grin', shirt: 'accent', hair: 'cap', hairColor: 'ink' })),
    { type: 'heart', r: 0.035 * FS, fill: 'primary', x: X(x + 50), y: Y(feet - 0.36 * FS * U), loop: { fx: 'pulse', period: 0.6, amp: 3 } },
  ]);
  piece(24, x => [fig(at(x, feet, { arms: 'hold', face: 'flat', shirt: 'chapter3', hair: 'none', hand: { type: 'rect', w: 0.075, wUnit: 'U', h: 0.055, fill: 'bg', radius: 0.004, stroke: 'ink', strokeW: 0.002, x: 0.03, y: -0.02 } }))]);
  take(27); piece(26, x => [ // Steve, waiting since 1998
    fig(at(x + 40, feet, { id: 'steve', skeleton: true, arms: 'up', loop: { fx: 'boil', amp: 1.2 }, extra: [Object.assign(K.sign('WORTH IT', { w: 0.13, h: 0.06 }), { x: 0, y: -0.33 }), Object.assign(K.cobweb(), { x: 0.03, y: -0.17 })] })),
  ]);
  piece(28, x => [ // kid on shoulders
    fig(at(x, feet, { arms: 'up', face: 'smile', shirt: 'primaryDeep', hair: 'spiky', hairColor: 'wood' })),
    K.figure({ x: X(x), y: Y(feet - 0.205 * FS * U), s: FS * 0.7, arms: 'wave', face: 'grin', shirt: 'accent', pants: 'mint', hair: 'cap', hairColor: 'primary', loop: { fx: 'sway', period: 0.8, amp: 2 } }),
  ]);
  take(30); piece(29, x => [
    fig(at(x, feet, { legs: 'dance', arms: 'up', face: 'grin', shirt: 'mint', hair: 'bun', hairColor: 'lavender' })),
    fig(at(x + 150, feet, { legs: 'run', arms: 'swing', face: 'grin', shirt: 'primary', hair: 'beanie', hairColor: 'secondary', speed: 0.34 })),
  ]);
  // the front of the line: hoppers (they jump harder when the door opens)
  const hoppers = [];
  for (let i = 31; i < slots.length; i++) { take(i); hoppers.push(slots[i]); }
  // everyone else: idle / chatting / phones
  const idle = [];
  slots.forEach((x, i) => { if (!used.has(i)) idle.push(x); });
  const backRow = []; for (let x = 450; x < 5400; x += 300 + K.rand() * 160) backRow.push(x);

  // build cast element lists (one source of truth so every shot shows the same people)
  const castIdle = idle.map(x => ({ px: x, el: fig(at(x, feet, { arms: K.pick(['down', 'down', 'hips', 'wave', 'hold']), face: K.pick(['smile', 'flat', 'smile', 'o', 'grin']), headTilt: (K.rand() - 0.5) * 14,
    hand: K.rand() < 0.3 ? { type: 'rect', w: 0.03, wUnit: 'U', h: 0.045, fill: 'ink', radius: 0.005, x: 0.012, y: -0.01 } : undefined })) }));
  const castBack = backRow.map(x => ({ px: x, el: fig(at(x, backFeet, { s: FS * 0.82, arms: K.pick(['down', 'hips', 'up', 'down']), face: K.pick(['smile', 'flat', 'grin']), legs: K.rand() < 0.12 ? 'dance' : 'stand' })) }));
  const castHop = hoppers.map(x => ({ px: x, el: fig(at(x, feet, { arms: 'up', face: 'grin', loop: { fx: 'none' } })) }));

  // ---------------- shots ----------------
  const scenes = [];
  const world = ({ fx0, fx1, z0 = 1, z1 = 1, dur, ease = 'linear', fy0 = FY, fy1 = FY, doorOpen = null, reveal = null }) => {
    const span = (W / 2) / Math.min(z0, z1) + 420, lo = Math.min(fx0, fx1) * W - span, hi = Math.max(fx0, fx1) * W + span;
    const vis = px => px > lo && px < hi;
    const par = (pf) => ({ type: 'group', x: r4((1 - pf) * fx0), y: 0, moves: [{ at: 0, dur, x: r4((1 - pf) * fx1), ease }] });
    const els = [];
    els.push(Object.assign(par(0.15), { children: farKids }));
    els.push(Object.assign(par(0.5), { children: midKids }));
    els.push({ type: 'group', x: 0, y: 0, children: groundKids.filter(k => k.type !== 'group' || vis(k.x * U)) });
    const fgPar = par(1.35);
    if (vis(BX)) { els.push(bakery); els.push(door(doorOpen)); }
    castBack.filter(c => vis(c.px)).forEach(c => els.push(c.el));
    pieces.filter(p => vis(p.px)).forEach(p => p.els.forEach(e => {
      const c = Object.assign({}, e);
      if (c.id === 'flipper') { c.moves = K.flips(Y(feet - midBody), dur, { H, height: 0.17, every: 1.3, start: 0.25 }); }
      els.push(c);
    }));
    castIdle.filter(c => vis(c.px)).forEach(c => els.push(c.el));
    castHop.filter(c => vis(c.px)).forEach((c, i) => { const e = Object.assign({}, c.el); e.moves = K.hops(Y(feet), dur, { H, every: reveal != null ? 0.4 : 0.55, height: reveal != null ? 0.05 : 0.025, start: i * 0.07 }); els.push(e); });
    els.push(Object.assign(fgPar, { children: fgKids }));
    return els;
  };

  // S1 · the fly-over: wide over Bricktown (bakery in view) → swoop to the back of the line
  const zWide = tall ? 0.34 : 0.28, fyWide = r4((G - (tall ? 0.2 : 0.2) * H / zWide) / H);
  scenes.push({ id: 'flyover', dur: '10b', bg: 'chapter1',
    camera: { focus: [[4.6, fyWide], [0.5, FY]], zoom: [zWide, 1], ease: 'inOutCubic' },
    elements: world({ fx0: 4.6, fx1: 0.5, z0: zWide, z1: 1, dur: 5, ease: 'inOutCubic' }) });

  // tracking shots + cutaway interviews
  const track = (id, fx0, fx1, beats, extra = {}) => scenes.push(Object.assign({ id, dur: `${beats}b`, bg: 'chapter1', transition: 'cut',
    camera: Object.assign({ focus: [[fx0, FY], [fx1, extra.fy1 != null ? extra.fy1 : FY]], zoom: [1, extra.z1 || 1], ease: extra.ease || 'linear' }, extra.camera || {}),
    elements: world({ fx0, fx1, z0: 1, z1: extra.z1 || 1, dur: beats * beat, ease: extra.ease || 'linear', doorOpen: extra.doorOpen, reveal: extra.reveal }).concat(extra.add || []) }));

  const interview = (id, { bg, wall, who, name, tag, quote, quoteAt = 0.45, pitch = 1, extra = [], bgTo }) => {
    const s = tall ? 4.3 : 3.2, feetY = tall ? 1880 : 1130;
    const subY = tall ? 0.885 : 0.9, ltY = tall ? 0.75 : 0.72;
    const els = [
      { type: 'bricks', w: 1.3, wUnit: 'U', h: H / U + 0.2, fill: wall, anchor: 'top', x: 0.5, y: -0.05, bw: 0.14, bh: 0.07, studs: false, opacity: 0.55 },
      { type: 'repeat', mode: 'grid', count: 6, cols: 2, gap: [0.7, 0.45], x: 0.5, y: 0.45, seed: 4, vary: { pos: 0.3, scale: 0.6 }, child: { type: 'blob', r: 0.13, fill: 'bg', opacity: 0.35, wobble: 0.1, loop: { fx: 'float', period: 4 } } },
      Object.assign(who, { x: 0.5, y: Y(feetY), scale: s, in: { fx: 'pop-soft', at: -0.3, dur: 0.4 } }),
      ...extra,
      { type: 'group', x: 0.07, y: tall ? 0.06 : 0.075, in: { fx: 'fade', at: 0, dur: 0.2 }, children: [
        { type: 'text', text: 'LIVE FROM THE LINE', role: 'caption', size: 0.03, weight: 800, tracking: 0.08, color: 'ink', anchor: 'left', align: 'left', x: 0.035, y: 0, highlight: { fill: 'bg', pad: 0.45 } },
        { type: 'circle', r: 0.011, fill: 'primaryDeep', x: 0.008, y: 0, loop: { fx: 'blink', period: 1.0 } } ] },
      { type: 'group', x: 0.06, y: ltY, in: { fx: 'slide-right', at: 0.1, dur: 0.45 }, children: [
        { type: 'text', text: name, role: 'headline', size: 0.06, bubble: 0.02, color: 'onPrimary', anchor: 'left', align: 'left', x: 0, y: 0, highlight: { fill: 'primary', pad: 0.3 } },
        { type: 'text', text: tag, role: 'body', size: 0.034, color: 'ink', anchor: 'left', align: 'left', x: 0.01, y: 0.075, highlight: { fill: 'bg', pad: 0.35 } },
      ] },
      { type: 'text', text: quote, role: 'body', size: tall ? 0.046 : 0.042, color: 'ink', x: 0.5, y: subY, maxWidth: 0.92, highlight: { fill: 'bg', pad: 0.4 },
        in: { fx: 'type', at: quoteAt, dur: Math.min(1.2, quote.length * 0.035) }, sfx: 'babble', sfxDur: Math.min(1.6, quote.length * 0.05), sfxPitch: pitch },
    ];
    scenes.push({ id, dur: '5b', bg, transition: 'cut', bgTo, camera: { zoom: [1.0, 1.06], ease: 'linear' }, elements: els });
  };

  track('track1', 0.5, 1.9, 8);
  interview('brenda', { bg: 'chapter3', wall: 'mint', name: 'Brenda', tag: 'Day 3 in line', quote: 'Brought a tent. Zero regrets.',
    who: K.figure({ arms: 'hold', hair: 'bob', hairColor: 'accent', shirt: 'mint', print: 'heart', talk: true, seed: 3,
      hand: { type: 'group', rot: -40, children: [{ type: 'rect', w: 0.004, wUnit: 'U', h: 0.09, fill: 'wood', anchor: 'bottom' }, { type: 'circle', r: 0.01, fill: 'white', x: 0, y: -0.09 }] } }) });
  track('track2', 1.9, 3.3, 8);
  interview('gary', { bg: 'chapter2', wall: 'secondary', name: 'Gary', tag: 'Totally calm', quote: "I'm not angry. I'm HUNGRY.", pitch: 0.8,
    bgTo: [{ at: 1.55, dur: 0.15, bg: 'primary' }],
    who: K.figure({ arms: 'up', face: 'angry', talk: true, seed: 7, hair: 'cap', hairColor: 'primaryDeep', shirt: 'secondary', loop: { fx: 'shake', amp: 0.5 } }),
    extra: [Object.assign(K.bubble('#@%!', { w: 0.14, h: 0.07, size: 0.034, ink: 'primaryDeep' }), { x: 0.78, y: tall ? 0.36 : 0.22, scale: 1.8, in: { fx: 'pop', at: 1.55, dur: 0.3 }, loop: { fx: 'beat', period: 0.4, amp: 1.5 } })] });
  track('track3', 3.3, 4.4, 6);
  interview('steve', { bg: 'chapter4', wall: 'cardboard', name: 'Steve', tag: 'In line since 1998', quote: '. . . still worth it.', quoteAt: 0.7, pitch: 0.6,
    who: K.figure({ skeleton: true, arms: 'up', talk: true, seed: 11, loop: { fx: 'boil', amp: 1.2 }, extra: [Object.assign(K.cobweb(), { x: 0.03, y: -0.17 })] }),
    extra: [{ type: 'text', text: '', role: 'caption', x: 0.5, y: 0.5, in: { fx: 'cut', at: 0.2, dur: 0.01 }, sfx: 'rattle' }] });

  // the reveal: arrive at the bakery, door opens, a happy customer walks out with a sweet box, crowd erupts
  const openAt = 1.3;
  const customer = K.figure({ x: X(BX + 10), y: Y(feet), s: FS, arms: 'up', face: 'grin', shirt: 'primary', hair: 'bun', hairColor: 'wood',
    in: { fx: 'fade', at: openAt + 0.15, dur: 0.2 }, moves: [{ at: openAt + 0.2, dur: 1.1, x: X(BX + 330), ease: 'outCubic' }],
    extra: [{ type: 'group', x: 0, y: -0.33, children: [
      { type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.06, -0.05], [-0.06, -0.05]], radius: 0.006, fill: 'blush' },
      { type: 'poly', pts: [[-0.065, -0.05], [0.065, -0.05], [0.075, -0.065], [-0.055, -0.065]], radius: 0.004, fill: 'blushDeep' },
      { type: 'rect', w: 0.012, wUnit: 'U', h: 0.05, fill: 'lavender', anchor: 'bottom', x: 0, y: 0 },
      { type: 'heart', r: 0.012, fill: 'lavender', x: -0.008, y: -0.072, rot: -80 }, { type: 'heart', r: 0.012, fill: 'lavender', x: 0.008, y: -0.072, rot: 80 },
    ] }] });
  track('reveal', 4.4, 5.55, 6, { z1: tall ? 0.82 : 0.66, fy1: tall ? FY - 0.03 : FY - 0.16, ease: 'inOutCubic', doorOpen: openAt, reveal: true, add: [
    customer,
    { type: 'dots', count: 40, seed: 31, fill: ['primary', 'lavender', 'mint', 'accent', 'bg'], r: 0.012, x: X(BX), y: Y(G - 0.3 * U), area: [X(BX - 700), Y(G - 1.0 * U), X(BX + 700), Y(G + 40)], motion: 'burst', in: { at: openAt + 0.25, dur: 1.0 }, sfx: 'cheer' },
    { type: 'repeat', mode: 'radial', count: 10, radius: 0.55, x: X(BX), y: Y(G - 34 - (wallH + 0.2) * U), stagger: 0.04, fills: ['bg', 'blush', 'lavender', 'accent', 'mint'], seed: 2, vary: { rot: 30, scale: 0.6 },
      child: { type: 'heart', r: 0.035, fill: 'bg', in: { fx: 'pop', at: openAt + 0.4, dur: 0.4 }, loop: { fx: 'float', period: 1.6 } } },
  ] });

  // END CARD — same design system as the sweet-box spots
  scenes.push({ id: 'end', dur: '8b', bg: 'bg', transition: { type: 'wipe', dir: 'up', bands: ['secondary', 'accent'], bandW: 0.12, dur: 0.45 },
    elements: [
      { type: 'dots', count: 18, seed: 12, fill: ['primary', 'lavender', 'mint', 'accent'], r: 0.012, motion: 'drift', area: [0.05, 0.04, 0.95, 0.96], in: { at: 0 } },
      { type: 'blob', r: tall ? 0.42 : 0.34, fill: 'chapter1', x: 0.5, y: tall ? 0.42 : 0.4, wobble: 0.08, speed: 1.4, in: { fx: 'scale', at: 0.05, dur: 0.8 } },
      { type: 'group', x: tall ? 0.86 : 0.9, y: Y(-120), in: { fx: 'swing', at: 0.15, dur: 1.4 }, loop: { fx: 'sway', period: '4b', amp: 0.6 }, children: [
        { type: 'rect', w: 0.006, h: ((tall ? 330 : 90) + 120) / U, fill: 'ink', anchor: 'top', x: 0, y: 0 },
        { type: 'image', src: CHERRY, w: tall ? 0.095 : 0.075, wUnit: 'U', anchor: 'top', x: 0, y: ((tall ? 330 : 90) + 112) / U },
      ] },
      { type: 'text', text: 'Worth every\nwait.', role: 'display', size: tall ? 0.14 : 0.1, maxWidth: tall ? 0.84 : 0.7, bubble: 0.035, color: 'primary', outline: { color: 'white', w: 0.06 }, x: 0.5, y: tall ? 0.25 : 0.22, split: 'word', stagger: 0.12, in: { fx: 'pop', at: 0.2, dur: 0.45 }, loop: { fx: 'wave', period: '2b', amp: 0.6 } },
      { type: 'logo', w: tall ? 0.7 : 0.56, x: 0.5, y: tall ? 0.47 : 0.48, in: { fx: 'pop-soft', at: 0.8, dur: 0.6 }, loop: { fx: 'jelly', period: '2b', amp: 0.5 } },
      { type: 'text', text: 'Order your sweet box', role: 'headline', size: tall ? 0.065 : 0.055, bubble: 0.015, color: 'ink', x: 0.5, y: tall ? 0.6 : 0.65, maxWidth: 0.94, in: { fx: 'rise', at: 1.2, dur: 0.5 } },
      { type: 'text', text: '(868) 715-4817', role: 'title', size: 0.055, color: 'ink', x: 0.5, y: tall ? 0.665 : 0.745, highlight: { fill: 'chapter2', pad: 0.38 }, in: { fx: 'pop', at: 1.5, dur: 0.45 }, loop: { fx: 'beat', period: '2b', amp: 0.5 } },
      // payoff gag: Steve finally got his box
      K.figure({ x: tall ? 0.18 : 0.09, y: tall ? 0.96 : 1.0, s: tall ? 1.35 : 0.8, skeleton: true, arms: 'hold', in: { fx: 'plop', at: 1.8, dur: 0.8 }, loop: { fx: 'jelly', period: '1b', amp: 1 },
        extra: [{ type: 'group', x: 0, y: -0.1, children: [
          { type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.06, -0.05], [-0.06, -0.05]], radius: 0.006, fill: 'blush' },
          { type: 'rect', w: 0.012, wUnit: 'U', h: 0.05, fill: 'lavender', anchor: 'bottom', x: 0, y: 0 } ] }] }),
      { type: 'text', text: 'Steve finally got his.', role: 'caption', size: tall ? 0.032 : 0.028, color: 'ink', anchor: 'left', align: 'left', x: tall ? 0.3 : 0.22, y: tall ? 0.9 : 0.92, highlight: { fill: 'chapter1', pad: 0.35 }, in: { fx: 'rise', at: 2.4, dur: 0.4 } },
    ] });

  // screen-space captions (not affected by the camera)
  const overlays = [
    { type: 'text', text: 'Meanwhile, in Bricktown…', role: 'headline', size: tall ? 0.06 : 0.05, maxWidth: 0.96, bubble: 0.015, color: 'ink', x: 0.5, y: tall ? 0.1 : 0.09, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'pop', at: 0.25, dur: 0.4 }, out: { fx: 'fade', at: 2.3, dur: 0.25 } },
    { type: 'text', text: '…there’s a line.', role: 'headline', size: tall ? 0.06 : 0.05, bubble: 0.015, color: 'ink', x: 0.5, y: tall ? 0.1 : 0.09, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'pop', at: 2.6, dur: 0.4 }, out: { fx: 'fade', at: 4.75, dur: 0.2 } },
    { type: 'cycler', items: ['Est. wait: 2 hours', 'Est. wait: 2 days', 'Est. wait: 2 years'], at: 11.9, every: 1.2, fx: 'pop', fxDur: 0.3, holdLast: false, role: 'title', size: tall ? 0.045 : 0.04, color: 'ink', x: 0.5, y: tall ? 0.1 : 0.08, highlight: { fill: 'bg', pad: 0.35 } },
    { type: 'text', text: 'Est. wait: ∞', role: 'title', size: tall ? 0.045 : 0.04, color: 'primaryDeep', x: 0.5, y: tall ? 0.1 : 0.08, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'pop', at: 18.2, dur: 0.3 }, out: { fx: 'fade', at: 20.8, dur: 0.2 }, loop: { fx: 'beat', period: 0.5, amp: 0.8 } },
  ];

  return { title: `Jadesserts — The Line (${fmt})`, format: { w: W, h: H, fps: 30 }, bpm: 120, scenes, overlays };
}

for (const f of ['9x16', '1x1']) {
  const out = path.join(here, `storyboard-${f}.json`);
  fs.writeFileSync(out, JSON.stringify(make(f)) + '\n');
  console.log('wrote', path.relative(process.cwd(), out), (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
}
