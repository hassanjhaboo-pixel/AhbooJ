#!/usr/bin/env node
// Round The Clock Transport, v2 "Departure board". Same song, same beat grid and same copy as make.mjs, new design direction:
//   split-flap departure board tiles (gold on black), a shipping waybill with a barcode, a manifest checklist on kraft,
//   a rubber stamp offer on paper. One type system: Big Shoulders (display) + IBM Plex Mono (data, body). No serif italics,
//   no eyebrow badges (the only tag is the 01 / 02 / 03 route tracker, which carries the step).
// Signature transition: a wipe down with one gold band (a flap falling). Motif: the flap tiles (hook, on time, nationwide,
// promise, end card).
//
//   node make-board.mjs  → storyboard-board-9x16.json   (brand: ../../brand/roundtheclock-board.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const W = 1080, H = 1920, U = 1080;
const r4 = v => Math.round(v * 10000) / 10000;
const X = v => r4(v / W), Y = v => r4(v / H), u = v => r4(v / U);
const A = n => `assets/${n}`;
const VAN = A('van-icon-board.svg');
const SONG = { bpm: 103, D0: 1.345, total: 35.406 };
const BEAT = 60 / SONG.bpm, BAR = 4 * BEAT, bars = n => r4(n * BAR);
const F2 = 2 / 30;  // one flap = 2 frames
const SHADOW = { color: 'rgba(0,0,0,0.6)', blur: 0.02, y: 0.006 };
const CARD_SHADOW = { color: 'rgba(8,9,10,0.35)', blur: 0.035, y: 0.016 };
const FLAPWIPE = { type: 'wipe', dir: 'up', bands: ['primary'], bandW: 0.05, dur: 0.36 };

// seeded rng
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const GLYPHS = 'ABCDEFGHJKLMNOPRSTUVWXYZ0123456789';
const rglyph = () => GLYPHS[Math.floor(rnd() * GLYPHS.length)];

// ---------- split-flap row ----------
// A row of tiles centred on (x, y) (frame px). Each tile spins `spins` random glyphs (2 frames each) then lands on its letter.
// Letters land left to right, `settle` seconds apart. `cells` pads the row with blank tiles (board columns).
function flap(text, o) {
  const { x, y, cw, ch, gap = 8, at = 0, settle = 0.035, spins = 7, color = 'primary', tile = 'tile', align = 'center', cells = null, tileIn = null, id = null } = o;
  const chars = [...text];
  const n = cells || chars.length;
  const total = n * cw + (n - 1) * gap;
  const x0 = align === 'left' ? 0 : -total / 2;
  const size = o.size || ch * 0.98 / U;
  const kids = [];
  for (let i = 0; i < n; i++) {
    const cx = u(x0 + i * (cw + gap) + cw / 2);
    const c = chars[i] || ' ';
    kids.push({ type: 'rect', wUnit: 'U', w: u(cw), h: u(ch), radius: 0.006, fill: tile, x: cx, y: 0 });
    kids.push({ type: 'rect', wUnit: 'U', w: u(cw), h: u(ch / 2), radius: 0.006, fill: 'tileTop', x: cx, y: u(-ch / 4) });
    if (c !== ' ') {
      const items = [];
      for (let k = 0; k < spins; k++) items.push(rglyph());
      items.push(c);
      kids.push({ type: 'cycler', items, every: F2, at: r4(at + i * settle), fx: 'cut', role: 'display', size, color, x: cx, y: u(ch * 0.03), sfx: false });
    }
    kids.push({ type: 'rect', wUnit: 'U', w: u(cw), h: u(3), fill: 'hinge', x: cx, y: 0 });
  }
  const g = { type: 'group', x: X(align === 'left' ? x : x), y: Y(y), children: kids };
  if (tileIn) g.in = tileIn;
  if (id) g.id = id;
  if (o.moves) g.moves = o.moves;
  if (o.loop) g.loop = o.loop;
  return g;
}
const flapEnd = (text, at, settle = 0.035, spins = 7) => r4(at + (text.length - 1) * settle + (spins + 1) * F2);

// A tile whose letter changes on a schedule (clock digits). steps: [[time, char], ...]; each change shows 2 random flaps first.
function clockTile(cx, cy, cw, ch, steps, color = 'primary') {
  const kids = [
    { type: 'rect', wUnit: 'U', w: u(cw), h: u(ch), radius: 0.008, fill: 'tile' },
    { type: 'rect', wUnit: 'U', w: u(cw), h: u(ch / 2), radius: 0.008, fill: 'tileTop', y: u(-ch / 4) },
  ];
  const size = ch * 0.98 / U;
  steps.forEach(([t, c], i) => {
    const next = steps[i + 1] ? steps[i + 1][0] : null;
    const items = i === 0 ? [c] : [rglyph(), rglyph(), c];
    const start = i === 0 ? t : t - 2 * F2;
    items.forEach((ch2, k) => {
      const tin = r4(start + k * F2), last = k === items.length - 1;
      const tout = last ? (next != null ? r4(next - 2 * F2) : null) : r4(tin + F2);
      const el = { type: 'text', text: ch2, role: 'display', size, color, y: u(ch * 0.03), in: { fx: 'cut', at: tin, dur: 0.01 }, sfx: false };
      if (tout != null) el.out = { fx: 'cut', at: tout, dur: 0.0001 };
      kids.push(el);
    });
  });
  kids.push({ type: 'rect', wUnit: 'U', w: u(cw), h: u(4), fill: 'hinge' });
  return { type: 'group', x: X(cx), y: Y(cy), children: kids };
}

// barcode: group of bars, total width wPx, height hPx
function barcode(wPx, hPx, fill = 'bg', s = 3) {
  const saved = seed; seed = s * 977 + 13;
  const bars = []; let x = 0;
  while (x < wPx) { const bw = [3, 3, 5, 7, 9][Math.floor(rnd() * 5)]; if (x + bw > wPx) break; bars.push([x, bw]); x += bw + [3, 4, 6][Math.floor(rnd() * 3)]; }
  seed = saved;
  return bars.map(([bx, bw]) => ({ type: 'rect', wUnit: 'U', w: u(bw), h: u(hPx), fill, x: u(bx + bw / 2 - x / 2), y: 0 }));
}
// tick made of two bars (no glyph dependency)
const tick = (r, fill) => [
  { type: 'rect', wUnit: 'U', w: r * 0.28, h: r * 0.62, radius: r * 0.12, fill, x: -r * 0.27, y: r * 0.12, rot: -45 },
  { type: 'rect', wUnit: 'U', w: r * 0.28, h: r * 1.2, radius: r * 0.12, fill, x: r * 0.18, y: -r * 0.06, rot: 38 },
];
const photo = (src, s0, s1, dur, extra = {}) => Object.assign({ type: 'image', src, x: 0.5, y: 0.5, w: 1, h: r4(H / U), fit: 'cover', scale: s0,
  moves: [{ at: 0, dur, scale: s1, ease: 'outQuad' }] }, extra);
const scrim = (side, frac, strong = 'shade') => ({ type: 'rect', w: 1, h: frac, hUnit: 'H', x: 0.5, y: side === 'top' ? 0 : 1, anchor: side,
  grad: side === 'top' ? [strong, 'clear'] : ['clear', strong] });
// mono line
const mono = (text, x, y, size, color, extra = {}) => Object.assign({ type: 'text', text, role: 'headline', size, color, x: X(x), y: Y(y) }, extra);

// Route tracker, parked in the same slot on the three pillar scenes: 01 / 02 / 03 stops on a dashed road, the van drives to stop n.
function tracker(n, onPhoto) {
  const S = 0.3, stops = [-S, 0, S];
  const kids = [
    { type: 'repeat', mode: 'line', count: 21, step: [0.03, 0], child: { type: 'rect', wUnit: 'U', w: 0.016, h: 0.005, radius: 0.002, fill: onPhoto ? 'ink' : 'slate' } },
    { type: 'rect', wUnit: 'U', w: 2 * S, h: 0.007, radius: 0.003, fill: 'primary', anchor: 'left', x: -S, sx: Math.max(0, (n - 2) / 2) || 0.0001,
      moves: [{ at: 0.05, dur: 0.6, sx: Math.max(0.0001, (n - 1) / 2), ease: 'inOutCubic' }] },
  ];
  stops.forEach((sx, i) => {
    const done = i < n;
    kids.push({ type: 'circle', r: 0.017, fill: i < n - 1 ? 'primary' : 'bg', stroke: done ? 'primary' : 'slate', strokeW: 0.005, x: sx,
      moves: i === n - 1 ? [{ at: 0.55, dur: 0.15, fill: 'primary' }] : undefined });
    kids.push({ type: 'text', text: `0${i + 1}`, role: 'headline', size: 0.03, color: i === n - 1 ? 'primary' : (onPhoto ? 'ink' : 'slate'), x: sx, y: 0.05, shadow: onPhoto ? SHADOW : undefined });
  });
  const from = n === 1 ? -S - 0.14 : stops[n - 2], to = stops[n - 1];
  kids.push({ type: 'image', src: VAN, wUnit: 'U', w: 0.1, x: from, y: -0.034, moves: [{ at: 0.05, dur: 0.6, x: to, ease: 'inOutCubic' }], sfx: false });
  return { type: 'group', x: 0.5, y: Y(190), children: kids };
}

const scenes = [];

// ===== 1 · HOOK (0 to 3.68s): the board flips to NEED IT MOVED?, then 24/7 lands on the 2.52s hit =====
{
  const r1 = flap('NEED IT', { x: 540, y: 820, cw: 118, ch: 164, at: -0.3, settle: 0.035 });
  const r2 = flap('MOVED?', { x: 540, y: 1004, cw: 118, ch: 164, at: -0.08, settle: 0.035 });
  const hit = 2.52, spins = 24;
  const r3 = flap('24/7', { x: 540, y: 1300, cw: 150, ch: 210, at: hit - (spins + 1) * F2 - 3 * 0.05, settle: 0.05, spins, color: 'bg', tile: 'primary',
    tileIn: { fx: 'grow-y', at: 0.55, dur: 0.25, ease: 'outBack' },
    moves: [{ at: hit - 0.02, dur: 0.07, scale: 1.1, ease: 'outQuad' }, { at: hit + 0.05, dur: 0.4, scale: 1, ease: 'outBack' }] });
  // flap tiles on the 24/7 row are gold with black hinge; recolour their top halves
  r3.children.forEach(k => { if (k.fill === 'tileTop') k.fill = 'primary'; if (k.fill === 'hinge') k.fill = 'goldDeep'; });
  scenes.push({
    id: 'hook', dur: r4(SONG.D0 + BAR), bg: 'bg',
    camera: { zoom: [1.0, 1.05], ease: 'inOutQuad', keys: [{ at: hit - 0.02, dur: 0.06, zoom: 1.08, ease: 'outQuad' }, { at: hit + 0.04, dur: 0.5, zoom: 1.05, ease: 'outCubic' }] },
    elements: [
      { type: 'rect', wUnit: 'U', w: u(960), h: u(560), radius: 0.014, fill: 'board', x: 0.5, y: Y(912) },
      mono('DEPARTURES', 92, 590, 0.03, 'slate', { align: 'left', anchor: 'left' }),
      mono('ANY TIME', 988, 590, 0.03, 'slate', { align: 'right', anchor: 'right' }),
      r1, r2, r3,
      { type: 'circle', r: 0.012, fill: 'primary', x: X(806), y: Y(590), loop: { fx: 'pulse', period: '1b', amp: 1.4 } },
    ],
  });
}

// ===== 2 · BRAND (3.68 to 8.34s): the real van, a waybill label slaps on, TRANSPORT stamps on the 5.13s hit =====
{
  const hit = 5.13 - 3.675;
  const LW = 900;
  const label = { type: 'group', x: 0.5, y: Y(470), rot: -2, in: { fx: 'zoom-in', at: 0.12, dur: 0.32, ease: 'outBack' }, sfx: 'plop',
    children: [
      { type: 'rect', wUnit: 'U', w: u(LW), h: u(560), radius: 0.01, fill: 'paper', shadow: CARD_SHADOW },
      { type: 'rect', wUnit: 'U', w: u(LW), h: u(112), radius: 0.01, fill: 'bg', y: u(-224) },
      { type: 'rect', wUnit: 'U', w: u(LW), h: u(40), fill: 'bg', y: u(-188) },
      { type: 'text', text: 'Round the Clock', role: 'display', size: 0.085, color: 'primary', y: u(-222) },
      { type: 'text', text: 'Transport', role: 'display', size: 0.185, color: 'bg', y: u(-52), in: { fx: 'zoom-in', at: hit - 0.04, dur: 0.16, ease: 'outQuad' }, sfx: 'pop' },
      { type: 'rect', wUnit: 'U', w: u(LW - 80), h: u(4), fill: 'bg', y: u(68) },
      { type: 'text', text: 'TRUSTED · ON TIME · NATIONWIDE', role: 'headline', size: 0.031, color: 'bg', y: u(112), in: { fx: 'type', at: bars(1) - 0.1, dur: 0.6 } },
      { type: 'group', x: u(-150), y: u(208), in: { fx: 'wipe', at: bars(1) + 0.5, dur: 0.5 }, children: barcode(520, 70, 'bg', 3) },
      { type: 'text', text: 'TT 24/7', role: 'headline', size: 0.034, color: 'bg', align: 'right', anchor: 'right', x: u(400), y: u(208), in: { fx: 'type', at: bars(1) + 0.7, dur: 0.4 } },
    ] };
  scenes.push({
    id: 'brand', dur: bars(2), bg: 'dark', transition: FLAPWIPE,
    camera: { zoom: [1.0, 1.06], ease: 'inQuad', keys: [{ at: hit - 0.02, dur: 0.05, zoom: 1.03, ease: 'outQuad' }, { at: hit + 0.03, dur: 0.4, zoom: 1.0, ease: 'outCubic' }] },
    elements: [
      photo(A('van-front.jpg'), 1.18, 1.04, 4.8, { y: Y(1010) }),
      scrim('bottom', 0.2, 'shadeMid'),
      label,
    ],
  });
}

// ===== 3 · 01 TRUSTED (8.34s, THE DROP): sunset photo, punch-in =====
scenes.push({
  id: 'trusted', dur: bars(1), bg: 'dark', transition: { type: 'flash', color: 'white', dur: 0.3 },
  camera: { at: [0.5, 0.5], keys: [{ at: 0, dur: 0.35, zoom: 1.0, ease: 'outExpo' }], zoom: [1.08, 1.0] },
  elements: [
    photo(A('van-sunset.jpg'), 1.06, 1.16, 2.5),
    scrim('bottom', 0.55),
    scrim('top', 0.2, 'shadeMid'),
    tracker(1, true),
    mono('TRUSTED &', 86, 1290, 0.05, 'primary', { align: 'left', anchor: 'left', shadow: SHADOW, in: { fx: 'type', at: 0.05, dur: 0.35 } }),
    { type: 'text', text: 'Reliable\ndrivers', role: 'display', size: 0.22, color: 'ink', align: 'left', anchor: 'left', x: X(80), y: Y(1530), shadow: SHADOW, split: 'line', stagger: 0.1, in: { fx: 'mask-up', at: 0.18, dur: 0.42 } },
    { type: 'rect', wUnit: 'U', w: 0.24, h: 0.009, fill: 'primary', anchor: 'left', x: X(86), y: Y(1760), in: { fx: 'grow', at: BEAT, dur: 0.4 } },
  ],
});

// ===== 4 · 02 ON TIME: a flap clock rolls 09:58 → 09:59 → 10:00 on the beats, ON TIME lands =====
{
  const cw = 168, ch = 250, g = 14, cy = 820;
  const xs = [-2, -1, 0, 1, 2].map(i => 540 + i * (cw + g));
  const b1 = r4(BEAT), b2 = r4(2 * BEAT);
  const ot = flap('ON TIME', { x: 540, y: 1400, cw: 118, ch: 164, at: b2 - 0.25, settle: 0.03, spins: 5 });
  scenes.push({
    id: 'ontime', dur: bars(1), bg: 'bg', transition: FLAPWIPE,
    elements: [
      tracker(2, false),
      clockTile(xs[0], cy, cw, ch, [[0, '0'], [b2, '1']], 'ink'),
      clockTile(xs[1], cy, cw, ch, [[0, '9'], [b2, '0']], 'ink'),
      { type: 'group', x: X(xs[2]), y: Y(cy), children: [
        { type: 'circle', r: 0.016, fill: 'primary', y: -0.045, loop: { fx: 'pulse', period: '1b', amp: 1.3 } },
        { type: 'circle', r: 0.016, fill: 'primary', y: 0.045, loop: { fx: 'pulse', period: '1b', amp: 1.3 } }] },
      clockTile(xs[3], cy, cw, ch, [[0, '5'], [b2, '0']], 'ink'),
      clockTile(xs[4], cy, cw, ch, [[0, '8'], [b1, '9'], [b2, '0']], 'ink'),
      { type: 'rect', wUnit: 'U', w: u(5 * cw + 4 * g + 20), h: u(ch + 20), radius: 0.014, fill: 'clear', stroke: 'primary', strokeW: 0.006, x: 0.5, y: Y(cy),
        opacity: 0, moves: [{ at: b2, dur: 0.06, opacity: 1 }, { at: b2 + 0.06, dur: 0.5, scale: 1.06, opacity: 0, ease: 'outCubic' }] },
      mono('ALWAYS', 540, 1210, 0.05, 'ink', { in: { fx: 'type', at: 0.1, dur: 0.3 } }),
      ot,
      { type: 'group', x: X(950), y: Y(cy - ch / 2 - 10), in: { fx: 'pop', at: flapEnd('ON TIME', b2 - 0.25, 0.03, 5), dur: 0.35 }, sfx: 'chime',
        children: [{ type: 'circle', r: 0.05, fill: 'primary' }, ...tick(0.05, 'bg')] },
    ],
  });
}

// ===== 5 · 03 NATIONWIDE: the departure board lists the route, row by row =====
{
  const towns = ['POINT FORTIN', 'SAN FERNANDO', 'CHAGUANAS', 'PORT OF SPAIN', 'ARIMA', 'SANGRE GRANDE', 'MAYARO'];
  const row0 = 760, rh = 148, t0 = 0.5, dt = 0.42;
  const els = [
    tracker(3, false),
    { type: 'text', text: 'Nationwide', role: 'display', size: 0.2, color: 'ink', x: 0.5, y: Y(400), split: 'char', stagger: 0.025, in: { fx: 'mask-up', at: 0.1, dur: 0.4 } },
    mono('Transport, end to end.', 540, 530, 0.04, 'primary', { in: { fx: 'type', at: 0.4, dur: 0.5 } }),
    mono('DESTINATION', 90, 630, 0.026, 'slate', { align: 'left', anchor: 'left' }),
    mono('STATUS', 990, 630, 0.026, 'slate', { align: 'right', anchor: 'right' }),
  ];
  towns.forEach((t, i) => {
    const y = row0 + i * rh, at = r4(t0 + i * dt);
    els.push(flap(t, { x: 90, y, cw: 52, ch: 100, gap: 4, at, settle: 0.025, spins: 5, cells: 13, align: 'left', color: 'ink' }));
    const land = flapEnd(t, at, 0.025, 5);
    els.push(mono('ON TIME', 990, y, 0.03, 'primary', { align: 'right', anchor: 'right', in: { fx: 'cut', at: land, dur: 0.01 }, sfx: i % 2 ? 'tick' : 'pop' }));
  });
  scenes.push({ id: 'nationwide', dur: bars(2), bg: 'bg', transition: 'cut', camera: { zoom: [1.0, 1.03], ease: 'inOutQuad' }, elements: els });
}

// ===== 6 · WHY CHOOSE US? A manifest on kraft: a card per item, checklist ticks typed in =====
{
  const slot = 2.5 * BEAT, first = BEAT;
  const CW = 760, CH = 520, CY = 660;
  const card = (i, kids) => ({ type: 'group', x: 0.5, y: Y(CY), rot: [-3, 2.5, -2, 3][i], in: { fx: 'drop-near', at: r4(first + i * slot - 0.2), dur: 0.45 }, sfx: 'plop', children: kids });
  const box = (x, y, w, h, extra = []) => [
    { type: 'rect', wUnit: 'U', w: u(w), h: u(h), radius: 0.006, fill: 'kraft', x: u(x), y: u(y), edge: 0.25 },
    { type: 'rect', wUnit: 'U', w: u(w), h: u(18), fill: 'kraftLight', x: u(x), y: u(y - h / 2 + 30) },
    ...extra,
  ];
  const holiday = card(0, [
    { type: 'rect', wUnit: 'U', w: u(CW), h: u(CH), radius: 0.012, fill: 'primary', shadow: CARD_SHADOW },
    ...box(-120, 60, 300, 250, [
      { type: 'rect', wUnit: 'U', w: u(40), h: u(250), fill: 'stamp', x: u(-120), y: u(60) },
      { type: 'rect', wUnit: 'U', w: u(300), h: u(40), fill: 'stamp', x: u(-120), y: u(60) }]),
    ...box(170, 110, 220, 150, [{ type: 'rect', wUnit: 'U', w: u(220), h: u(30), fill: 'bg', x: u(170), y: u(110) }]),
    ...box(150, -60, 170, 150, [{ type: 'rect', wUnit: 'U', w: u(30), h: u(150), fill: 'bg', x: u(150), y: u(-60) }]),
    { type: 'text', text: 'HOLIDAY', role: 'display', size: 0.07, color: 'bg', x: u(-120), y: u(-170) },
  ]);
  const photoCard = (i, src) => card(i, [
    { type: 'rect', wUnit: 'U', w: u(CW + 28), h: u(CH + 28), radius: 0.012, fill: 'paper', shadow: CARD_SHADOW },
    { type: 'image', src, wUnit: 'U', w: u(CW), h: u(CH), fit: 'cover', mask: 'rounded', radius: 0.008 },
  ]);
  const fragile = card(3, [
    { type: 'rect', wUnit: 'U', w: u(CW), h: u(CH), radius: 0.012, fill: 'paper', shadow: CARD_SHADOW },
    ...box(0, 40, 420, 330),
    { type: 'group', x: 0, y: u(60), rot: -8, in: { fx: 'zoom-in', at: r4(first + 3 * slot + 0.3), dur: 0.16 }, sfx: 'pop', children: [
      { type: 'rect', wUnit: 'U', w: u(320), h: u(96), radius: 0.008, fill: 'clear', stroke: 'stamp', strokeW: 0.008 },
      { type: 'text', text: 'FRAGILE', role: 'display', size: 0.075, color: 'stamp' }] },
    { type: 'text', text: '↑↑  THIS WAY UP', role: 'headline', size: 0.026, color: 'bg', y: u(-80) },
  ]);
  const items = ['Best for holiday shopping', 'Hauling large packages', 'Enclosed transport', 'Best for fragile goods'];
  const rows = [1060, 1180, 1300, 1420];
  const els = [
    { type: 'text', text: 'Why choose us?', role: 'display', size: 0.125, maxWidth: 0.92, color: 'bg', align: 'left', anchor: 'left', x: X(86), y: Y(200), in: { fx: 'mask-up', at: 0.0, dur: 0.4 } },
    holiday, photoCard(1, A('van-rear.jpg')), photoCard(2, A('van-sidedoor.jpg')), fragile,
  ];
  items.forEach((t, i) => {
    const at = r4(first + i * slot), y = rows[i];
    els.push({ type: 'rect', wUnit: 'U', w: u(56), h: u(56), radius: 0.004, fill: 'clear', stroke: 'bg', strokeW: 0.005, x: X(118), y: Y(y), in: { fx: 'pop', at: 0.2 + i * 0.06, dur: 0.3 }, sfx: false });
    els.push({ type: 'group', x: X(122), y: Y(y - 4), in: { fx: 'zoom-in', at, dur: 0.14 }, sfx: 'tick', children: tick(0.05, 'bg') });
    els.push(mono(t, 178, y, 0.042, 'bg', { align: 'left', anchor: 'left', in: { fx: 'type', at: r4(at + 0.06), dur: 0.5 } }));
    els.push({ type: 'repeat', mode: 'line', count: 28, step: [0.03, 0], x: 0.5, y: Y(y + 52), child: { type: 'rect', wUnit: 'U', w: 0.012, h: 0.003, fill: 'kraftDeep' } });
  });
  els.push({ type: 'group', x: 0.5, y: Y(1590), children: barcode(800, 90, 'bg', 9) });
  els.push(mono('RTC 0247 7365 TT', 540, 1680, 0.028, 'bg'));
  els.push({ type: 'repeat', mode: 'line', count: 34, step: [0.034, 0], x: 0.5, y: Y(1800), child: { type: 'rect', wUnit: 'U', w: 0.018, h: 0.006, fill: 'bg' } });
  els.push({ type: 'image', src: VAN, wUnit: 'U', w: 0.13, x: -0.1, y: Y(1762), moves: [{ at: 0, dur: bars(3), x: 1.1, ease: 'linear' }], sfx: false });
  scenes.push({ id: 'why', dur: bars(3), bg: 'kraft', transition: FLAPWIPE, elements: els });
}

// ===== 7 · OFFER (24.65s): a rubber stamp slams on paper =====
scenes.push({
  id: 'offer', dur: bars(1), bg: 'paper', transition: 'cut',
  camera: { keys: [{ at: 0.1, dur: 0.05, zoom: 1.04, ease: 'outQuad' }, { at: 0.15, dur: 0.4, zoom: 1.0, ease: 'outCubic' }] },
  elements: [
    { type: 'group', x: 0.5, y: Y(640), rot: -7, in: { fx: 'zoom-in', at: 0.0, dur: 0.14, ease: 'outQuad' }, sfx: 'plop', children: [
      { type: 'rect', wUnit: 'U', w: u(780), h: u(420), radius: 0.02, fill: 'clear', stroke: 'stamp', strokeW: 0.012 },
      { type: 'rect', wUnit: 'U', w: u(730), h: u(370), radius: 0.014, fill: 'clear', stroke: 'stamp', strokeW: 0.005 },
      { type: 'text', text: 'Seasonal\ndeals', role: 'display', size: 0.17, color: 'stamp', lineHeight: 0.88 },
    ] },
    { type: 'text', text: 'Book with\nus now', role: 'display', size: 0.2, color: 'bg', x: 0.5, y: Y(1200), split: 'line', stagger: 0.12, in: { fx: 'mask-up', at: r4(BEAT), dur: 0.4 } },
    mono('to receive seasonal\nspecials and discounts', 540, 1480, 0.04, 'bg', { in: { fx: 'type', at: r4(2 * BEAT), dur: 0.6 } }),
  ],
});

// ===== 8 · PROMISE: the van drives in, the status flips IN TRANSIT → DELIVERED on beat 4 of bar 2 =====
{
  const land = r4(BAR + 3 * BEAT);
  const cw = 80, ch = 116, g = 6;
  const s1 = flap('IN TRANSIT', { x: 540, y: 640, cw, ch, gap: g, at: 0.25, settle: 0.03, spins: 5, color: 'ink', moves: [{ at: land - 0.2, dur: 0.01, opacity: 0 }] });
  const s2 = flap('DELIVERED', { x: 540, y: 640, cw, ch, gap: g, at: land - 0.32, settle: 0.02, spins: 4, cells: 10, color: 'primary', tileIn: { fx: 'cut', at: land - 0.2, dur: 0.01 } });
  scenes.push({
    id: 'promise', dur: bars(2), bg: 'bg', transition: FLAPWIPE,
    elements: [
      mono('"Your best choice this season."', 540, 430, 0.04, 'primary', { in: { fx: 'type', at: 0.1, dur: 0.9 } }),
      mono('STATUS', 540, 540, 0.026, 'slate'),
      s1, s2,
      { type: 'text', text: 'We make sure\nit gets there.', role: 'display', size: 0.14, maxWidth: 0.94, color: 'ink', x: 0.5, y: Y(1030), split: 'line', stagger: 0.15, in: { fx: 'mask-up', at: r4(BAR - 0.1), dur: 0.45 } },
      { type: 'repeat', mode: 'line', count: 34, step: [0.034, 0], x: 0.5, y: Y(1560), child: { type: 'rect', wUnit: 'U', w: 0.018, h: 0.007, fill: 'primary' } },
      { type: 'rect', w: 1, h: 0.012, fill: 'board', x: 0.5, y: Y(1585) },
      { type: 'image', src: VAN, wUnit: 'U', w: 0.36, x: -0.25, y: Y(1440), moves: [{ at: 0.2, dur: land - 0.2, x: 0.5, ease: 'outCubic' }], loop: { fx: 'bob', period: 0.3, amp: 0.4 }, sfx: false },
      { type: 'group', x: X(830), y: Y(1300), in: { fx: 'pop', at: land, dur: 0.35 }, sfx: 'chime', children: [{ type: 'circle', r: 0.045, fill: 'primary' }, ...tick(0.045, 'bg')] },
    ],
  });
}

// ===== 9 · END CARD (31.64s to the end): ROUND THE CLOCK on the board, phone, handle, button, a live clock =====
{
  const dur = r4(SONG.total - (SONG.D0 + bars(13)));
  const ig = { type: 'group', x: X(318), y: Y(1196), in: { fx: 'pop', at: 0.7, dur: 0.3 }, sfx: false, children: [
    { type: 'rect', wUnit: 'U', w: 0.046, h: 0.046, radius: 0.013, fill: 'clear', stroke: 'ink', strokeW: 0.005 },
    { type: 'ring', r: 0.011, fill: 'ink', strokeW: 0.005 },
    { type: 'circle', r: 0.0035, fill: 'ink', x: 0.0125, y: -0.0125 }] };
  const sec = [];
  for (let i = 0; i < 7; i++) sec.push([r4(i * BEAT), String(i)]);
  scenes.push({
    id: 'end', dur, bg: 'bg', transition: { type: 'flash', color: 'white', dur: 0.35 },
    elements: [
      clockTile(540 - 2 * 76, 300, 68, 96, [[0, '1']], 'slate'),
      clockTile(540 - 76, 300, 68, 96, [[0, '0']], 'slate'),
      mono(':', 540, 300, 0.05, 'slate'),
      clockTile(540 + 76, 300, 68, 96, [[0, '0']], 'slate'),
      clockTile(540 + 2 * 76, 300, 68, 96, sec, 'slate'),
      flap('ROUND THE', { x: 540, y: 560, cw: 92, ch: 128, at: -0.05, settle: 0.03, spins: 5 }),
      flap('CLOCK', { x: 540, y: 700, cw: 92, ch: 128, at: 0.15, settle: 0.03, spins: 5 }),
      mono('TRANSPORT', 540, 830, 0.05, 'ink', { tracking: 0.3, in: { fx: 'type', at: 0.4, dur: 0.4 } }),
      { type: 'rect', wUnit: 'U', w: 0.62, h: 0.004, fill: 'board', x: 0.5, y: Y(920) },
      { type: 'text', text: '+1 (868) 329-5373', role: 'display', size: 0.115, maxWidth: 0.94, color: 'ink', x: 0.5, y: Y(1060), in: { fx: 'mask-up', at: 0.45, dur: 0.4 } },
      ig,
      mono('@a47.detailing', 368, 1196, 0.04, 'ink', { align: 'left', anchor: 'left', in: { fx: 'type', at: 0.75, dur: 0.5 } }),
      { type: 'group', x: 0.5, y: Y(1390), in: { fx: 'pop', at: 1.0, dur: 0.4 }, sfx: 'pop',
        moves: [1, 2, 3, 4].map(k => [{ at: r4(1.2 + k * 2 * BEAT - 2 * BEAT), dur: 0.08, y: Y(1398), ease: 'outQuad' }, { at: r4(1.28 + k * 2 * BEAT - 2 * BEAT), dur: 0.18, y: Y(1390), ease: 'outBack' }]).flat(),
        children: [
          { type: 'rect', wUnit: 'U', w: u(600), h: u(124), radius: 0.012, fill: 'goldDeep', y: u(10) },
          { type: 'rect', wUnit: 'U', w: u(600), h: u(124), radius: 0.012, fill: 'primary' },
          { type: 'text', text: 'BOOK WITH US NOW', role: 'display', size: 0.07, color: 'bg', y: u(4) }] },
      { type: 'repeat', mode: 'line', count: 34, step: [0.034, 0], x: 0.5, y: Y(1700), child: { type: 'rect', wUnit: 'U', w: 0.018, h: 0.006, fill: 'board' } },
      { type: 'image', src: VAN, wUnit: 'U', w: 0.12, x: -0.1, y: Y(1664), moves: [{ at: 0.3, dur: dur, x: 1.1, ease: 'linear' }], sfx: false },
    ],
  });
}

const story = { title: 'Round The Clock Transport · Departure board · 9x16', format: { w: W, h: H, fps: 30 }, bpm: SONG.bpm, duration: SONG.total, scenes };
fs.writeFileSync(path.join(here, 'storyboard-board-9x16.json'), JSON.stringify(story, null, 1));
console.log('storyboard-board-9x16.json', scenes.map(s => `${s.id}:${s.dur}`).join(' '));
