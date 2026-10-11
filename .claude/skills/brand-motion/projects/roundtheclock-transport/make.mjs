#!/usr/bin/env node
// Round The Clock Transport: "We Make Sure It Gets There". 34s @120bpm (68 beats), 9:16 and 1:1 from one definition.
// Copy is the owner's flyer, tidied for grammar only.
//
// Playbook blend:
//   Kinetic Type (Spotify): the clock hook, beat-cut pillar cards, parked "01 / 03" counter
//   Hero Constant (Starbucks-style): real van photos full-bleed with slow Ken Burns pushes
//   Line Journey (Fresco): a dashed road line the van drives along: the route map, the checklist road, the arrival
//   Pop Pulse (Red Bull): colour-band wipes that "drive" left to right, starburst offer, flash into the end card
// Signature transition: wipe to the right with gold + white bands (the van passing). Motif: the clock ring (hook → pillar 2 → end card).
//
//   node make.mjs  → storyboard-9x16.json, storyboard-1x1.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const A = n => `assets/${n}`;
const VAN = A('van-icon.svg');
const r4 = v => Math.round(v * 10000) / 10000;
const SHADOW = { color: 'rgba(0,0,0,0.55)', blur: 0.025, y: 0.006 };
const CARD_SHADOW = { color: 'rgba(12,15,18,0.28)', blur: 0.04, y: 0.018 };
const WIPE = (bands = ['primary', 'white']) => ({ type: 'wipe', dir: 'right', bands, bandW: 0.1, dur: 0.5 });

function make(fmt) {
  const W = 1080, H = fmt === '1x1' ? 1080 : 1920, U = 1080, tall = fmt !== '1x1';
  const X = v => r4(v / W), Y = v => r4(v / H), u = v => r4(v / U);
  const scenes = [];

  // ---------- reusable pieces ----------
  // Clock emblem (the brand motif). Group origin = clock centre; r in U.
  function clock({ x, y, r, ring = 'primary', ticks = 'white', quarter = 'primary', hourHand = 'white', minHand = 'primary', hub = 'primary', drawAt = 0, minuteMoves = null, minuteSpin = '2b', hourSpin = '16b', secHand = null, inFx = null, scale = 1, moves = null, id = null }) {
    const kids = [
      { type: 'ring', r, fill: ring, strokeW: r * 0.055, in: { fx: 'draw', at: drawAt, dur: 0.7 } },
      { type: 'repeat', mode: 'radial', count: 12, radius: r * 0.8, orient: true, stagger: 0.025, in: { at: drawAt + 0.15 },
        child: { type: 'rect', wUnit: 'U', w: r * 0.035, h: r * 0.1, radius: r * 0.02, fill: ticks, in: { fx: 'pop', at: 0, dur: 0.3 }, sfx: false } },
      { type: 'repeat', mode: 'radial', count: 4, radius: r * 0.8, orient: true, stagger: 0.04, in: { at: drawAt + 0.2 },
        child: { type: 'rect', wUnit: 'U', w: r * 0.065, h: r * 0.17, radius: r * 0.03, fill: quarter, in: { fx: 'pop', at: 0, dur: 0.35 }, sfx: false } },
      { type: 'rect', wUnit: 'U', w: r * 0.085, h: r * 0.5, radius: r * 0.04, fill: hourHand, anchor: 'bottom', rot: 300, in: { fx: 'grow-y', at: drawAt + 0.3, dur: 0.4 }, loop: hourSpin ? { fx: 'spin', period: hourSpin } : undefined },
      Object.assign({ type: 'rect', wUnit: 'U', w: r * 0.055, h: r * 0.72, radius: r * 0.03, fill: minHand, anchor: 'bottom', in: { fx: 'grow-y', at: drawAt + 0.35, dur: 0.4 } },
        minuteMoves ? { moves: minuteMoves } : { loop: { fx: 'spin', period: minuteSpin } }),
    ];
    if (secHand) kids.push({ type: 'rect', wUnit: 'U', w: r * 0.02, h: r * 0.78, fill: secHand, anchor: 'bottom', rot: 90, in: { fx: 'fade', at: drawAt + 0.4, dur: 0.3 }, loop: { fx: 'spin', period: '30b' } });
    kids.push({ type: 'circle', r: r * 0.09, fill: hub, in: { fx: 'pop', at: drawAt + 0.3, dur: 0.35 }, sfx: false });
    const g = { type: 'group', x, y, scale, children: kids };
    if (id) g.id = id;
    if (inFx) g.in = inFx;
    if (moves) g.moves = moves;
    return g;
  }
  // Full-bleed photo with a slow push (Ken Burns). Positions stay centred; only scale/x drift.
  const photo = (src, s0, s1, dur, extra = {}) => Object.assign({ type: 'image', src, x: 0.5, y: 0.5, w: 1, h: r4(H / U), fit: 'cover', scale: s0,
    moves: [{ at: 0, dur, scale: s1, ease: 'outQuad' }] }, extra);
  // Gradient scrim so type reads on photos. side: top | bottom.
  const scrim = (side, frac, strong = 'shade') => ({ type: 'rect', w: 1, h: frac, hUnit: 'H', x: 0.5, y: side === 'top' ? 0 : 1, anchor: side,
    grad: side === 'top' ? [strong, 'clear'] : ['clear', strong] });
  // Parked chapter counter ("01 / 03"): same slot in all three pillar scenes.
  const counter = (n, fill = 'glass', color = 'white') => ({ type: 'group', x: 0.5, y: tall ? Y(170) : Y(80), in: { fx: 'pop', at: 0.1, dur: 0.4 }, sfx: false,
    children: [
      { type: 'pill', wUnit: 'U', w: 0.22, h: 0.062, fill },
      { type: 'text', text: `0${n}  /  03`, role: 'caption', face: 'headline', weight: 700, size: 0.03, tracking: 0.12, color },
    ] });
  // A check badge: circle + tick made of two rounded bars (no glyph dependency).
  const check = (r, fill = 'primary', mark = 'bg') => [
    { type: 'circle', r, fill },
    { type: 'rect', wUnit: 'U', w: r * 0.26, h: r * 0.62, radius: r * 0.13, fill: mark, x: -r * 0.27, y: r * 0.12, rot: -45 },
    { type: 'rect', wUnit: 'U', w: r * 0.26, h: r * 1.15, radius: r * 0.13, fill: mark, x: r * 0.17, y: -r * 0.05, rot: 38 },
  ];

  // ===== 1 · HOOK: the clock ticks, "Need it moved?" · 4b (2s) =====
  const hookC = tall ? [540, 720, 0.3] : [540, 430, 0.25];
  scenes.push({
    id: 'hook', dur: '4b', bg: 'bg',
    camera: { zoom: [1.0, 1.06], ease: 'inOutQuad' },
    elements: [
      { type: 'dots', count: 26, seed: 3, fill: ['goldDeep', 'slate'], r: 0.006, area: [0.04, 0.04, 0.96, 0.96], motion: 'drift', speed: 0.18, opacity: 0.55 },
      { type: 'circle', r: hookC[2] * 1.32, fill: 'chapter3', x: 0.5, y: Y(hookC[1]), in: { fx: 'scale', at: -0.3, dur: 0.6 } },
      clock({ x: 0.5, y: Y(hookC[1]), r: hookC[2], drawAt: -0.35, minuteSpin: '2b', hourSpin: '24b', secHand: 'white' }),
      { type: 'text', text: 'Need it\nmoved?', role: 'display', size: tall ? 0.2 : 0.15, color: 'white', x: 0.5, y: tall ? Y(1360) : Y(860), split: 'word', stagger: 0.1, in: { fx: 'pop', at: -0.55, dur: 0.45 }, loop: { fx: 'wave', period: '2b', amp: 0.5 } },
    ],
  });

  // ===== 2 · BRAND: the real van, "Round the Clock / TRANSPORT" · 6b (3s) =====
  const bT = tall ? { script: 215, disp: 400, rule: 525, cap: 580, sSize: 0.13, dSize: 0.19 } : { script: 82, disp: 205, rule: 282, cap: 318, sSize: 0.085, dSize: 0.13 };
  scenes.push({
    id: 'brand', dur: '6b', bg: 'dark', transition: WIPE(),
    elements: [
      photo(A('van-front.jpg'), 1.2, 1.04, 3.2),
      scrim('top', tall ? 0.42 : 0.4, 'shadeMid'),
      { type: 'text', text: 'Round the Clock', role: 'headline', face: 'script', size: bT.sSize, color: 'primary', x: 0.5, y: Y(bT.script), shadow: SHADOW, in: { fx: 'mask-up', at: 0.3, dur: 0.6 } },
      { type: 'text', text: 'Transport', role: 'display', size: bT.dSize, tracking: 0.03, maxWidth: 0.92, color: 'white', x: 0.5, y: Y(bT.disp), shadow: SHADOW, split: 'char', stagger: 0.035, in: { fx: 'mask-up', at: 0.55, dur: 0.5 } },
      { type: 'rect', w: 0.26, h: 0.006, fill: 'primary', x: 0.5, y: Y(bT.rule), in: { fx: 'grow', at: 1.0, dur: 0.5 } },
      { type: 'text', text: 'Trusted  ·  On time  ·  Nationwide', role: 'caption', face: 'headline', weight: 700, size: tall ? 0.034 : 0.028, tracking: 0.04, color: 'white', x: 0.5, y: Y(bT.cap), shadow: SHADOW, in: { fx: 'rise', at: 1.15, dur: 0.5 } },
    ],
  });

  // ===== 3 · PILLAR 01: Trusted, reliable drivers (sunset photo) · 6b (3s) =====
  const p1 = tall ? { script: 1160, disp: 1420, rule: 1655, sSize: 0.11, dSize: 0.2 } : { script: 565, disp: 790, rule: 965, sSize: 0.085, dSize: 0.15 };
  scenes.push({
    id: 'trusted', dur: '6b', bg: 'dark', transition: 'cut',
    camera: { at: [0.5, 0.5], keys: [{ at: 0, dur: 0.35, zoom: 1.0, ease: 'outExpo' }], zoom: [1.08, 1.0] },
    elements: [
      photo(A('van-sunset.jpg'), 1.06, 1.16, 3.2, { x: 0.5 }),
      scrim('bottom', 0.6),
      scrim('top', 0.18, 'shadeMid'),
      counter(1),
      { type: 'text', text: 'Trusted &', role: 'headline', face: 'script', size: p1.sSize, color: 'primary', align: 'left', anchor: 'left', x: 0.08, y: Y(p1.script), shadow: SHADOW, in: { fx: 'mask-up', at: 0.15, dur: 0.55 } },
      { type: 'text', text: 'Reliable\ndrivers', role: 'display', size: p1.dSize, color: 'white', align: 'left', anchor: 'left', x: 0.08, y: Y(p1.disp), shadow: SHADOW, split: 'line', stagger: 0.12, in: { fx: 'mask-up', at: 0.35, dur: 0.55 } },
      { type: 'rect', w: 0.22, h: 0.006, fill: 'primary', anchor: 'left', x: 0.08, y: Y(p1.rule), in: { fx: 'grow', at: 0.8, dur: 0.5 } },
    ],
  });

  // ===== 4 · PILLAR 02: Always on time (the clock returns, hands race and land on 12) · 6b (3s) =====
  const p2 = tall ? { cx: 540, cy: 720, r: 0.3, script: 1140, disp: 1390, dSize: 0.24, sSize: 0.12, al: 'center', tx: 0.5 } : { cx: 300, cy: 560, r: 0.22, script: 380, disp: 600, dSize: 0.15, sSize: 0.1, al: 'center', tx: 0.76 };
  scenes.push({
    id: 'ontime', dur: '6b', bg: 'secondary', transition: WIPE(),
    elements: [
      { type: 'ring', r: p2.r * 1.15, fill: 'white', strokeW: 0.004, opacity: 0.5, x: X(p2.cx), y: Y(p2.cy), moves: [{ at: 0.9, dur: 1.4, scale: 1.9, opacity: 0, ease: 'outCubic' }] },
      { type: 'ring', r: p2.r * 1.15, fill: 'white', strokeW: 0.004, opacity: 0.5, x: X(p2.cx), y: Y(p2.cy), moves: [{ at: 1.5, dur: 1.4, scale: 1.9, opacity: 0, ease: 'outCubic' }] },
      { type: 'circle', r: p2.r * 1.15, fill: 'skyDeep', x: X(p2.cx), y: Y(p2.cy), in: { fx: 'scale', at: -0.1, dur: 0.5 } },
      clock({ x: X(p2.cx), y: Y(p2.cy), r: p2.r, ring: 'white', ticks: 'white', quarter: 'white', hourHand: 'bg', minHand: 'white', hub: 'bg', drawAt: 0.0, hourSpin: null,
        minuteMoves: [{ at: 0.3, dur: 1.2, rot: 1080, ease: 'outCubic' }], secHand: null }),
      { type: 'group', x: X(p2.cx + p2.r * U * 0.78), y: Y(p2.cy + p2.r * U * 0.72), in: { fx: 'pop', at: 1.5, dur: 0.45 }, loop: { fx: 'float', period: '4b', amp: 0.5 }, sfx: 'chime',
        children: [{ type: 'circle', r: 0.085, fill: 'white', shadow: CARD_SHADOW }, ...check(0.068, 'bg', 'white')] },
      counter(2, 'skyDeep'),
      { type: 'text', text: 'Always', role: 'headline', face: 'script', size: p2.sSize, color: 'white', x: p2.tx, y: Y(p2.script), in: { fx: 'mask-up', at: 0.25, dur: 0.55 } },
      { type: 'text', text: tall ? 'On time' : 'On\ntime', role: 'display', size: p2.dSize, color: 'white', x: p2.tx, y: Y(p2.disp), split: 'word', stagger: 0.12, in: { fx: 'pop', at: 0.5, dur: 0.45 } },
    ],
  });

  // ===== 5 · PILLAR 03: Nationwide (Trinidad route map, the van drives the route) · 8b (4s) =====
  // Outline of Trinidad (lon, lat), clockwise from the Chaguaramas peninsula. Simplified; reads as the island.
  const ISLAND = [[-61.67, 10.695], [-61.58, 10.72], [-61.50, 10.76], [-61.40, 10.79], [-61.20, 10.82], [-61.00, 10.84], [-60.92, 10.83], [-60.96, 10.70], [-61.01, 10.55], [-61.03, 10.40], [-61.00, 10.20],
    [-61.00, 10.12], [-61.15, 10.08], [-61.40, 10.05], [-61.60, 10.06], [-61.83, 10.05], [-61.92, 10.06], [-61.80, 10.13], [-61.65, 10.20], [-61.50, 10.25], [-61.47, 10.30],
    [-61.48, 10.40], [-61.48, 10.52], [-61.515, 10.635], [-61.56, 10.665], [-61.63, 10.672]];
  const CITIES = [['Point Fortin', -61.66, 10.17, 'below'], ['San Fernando', -61.44, 10.28, 'right'], ['Chaguanas', -61.41, 10.52, 'right'], ['Port of Spain', -61.51, 10.66, 'above'],
    ['Arima', -61.28, 10.64, 'below'], ['Sangre Grande', -61.13, 10.59, 'above'], ['Mayaro', -61.05, 10.29, 'below']];
  const M = tall ? { cx: 540, cy: 1130, w: 960 } : { cx: 680, cy: 665, w: 640 };
  const lon0 = -61.42, lat0 = 10.445, k = M.w / (1.0 * 0.985);
  const proj = (lon, lat) => [M.cx + (lon - lon0) * 0.985 * k, M.cy - (lat - lat0) * k];
  const islandPts = ISLAND.map(([lo, la]) => { const [px, py] = proj(lo, la); return [u(px - M.cx), u(py - M.cy)]; });
  const cityPx = CITIES.map(([n, lo, la, side]) => ({ n, side, p: proj(lo, la) }));
  // timing: the van reaches each city in proportion to the distance travelled
  const routeStart = 0.7, routeDur = 2.4;
  const seg = cityPx.map((c, i) => (i ? Math.hypot(c.p[0] - cityPx[i - 1].p[0], c.p[1] - cityPx[i - 1].p[1]) : 0));
  const total = seg.reduce((a, b) => a + b, 0); let acc = 0;
  const arrive = seg.map(s => { acc += s; return r4(routeStart + (acc / total) * routeDur); });
  const p3T = tall ? { disp: 360, script: 500, dSize: 0.2, sSize: 0.11, tx: 0.5, al: 'center', anc: 'center' } : { disp: 200, script: 300, dSize: 0.13, sSize: 0.08, tx: 0.06, al: 'left', anc: 'left' };
  const labelOff = { below: [0, 50], above: [0, -50], right: [26, 0], left: [-26, 0] };
  scenes.push({
    id: 'nationwide', dur: '8b', bg: 'chapter3', transition: WIPE(),
    camera: { zoom: [1.0, 1.04], ease: 'inOutQuad' },
    elements: [
      { type: 'dots', count: 40, seed: 12, fill: ['slate'], r: 0.004, area: [0.03, 0.03, 0.97, 0.97], motion: 'drift', speed: 0.12, opacity: 0.4 },
      { type: 'poly', pts: islandPts, radius: 0.012, fill: 'asphalt', stroke: 'slate', strokeW: 0.004, x: X(M.cx), y: Y(M.cy), in: { fx: 'pop-soft', at: 0.0, dur: 0.6 }, shadow: { color: 'rgba(0,0,0,0.35)', blur: 0.04, y: 0.015 } },
      { type: 'poly', pts: islandPts, radius: 0.012, stroke: 'primary', strokeW: 0.003, dash: [0.008, 0.008], opacity: 0.55, x: X(M.cx), y: Y(M.cy), in: { fx: 'fade', at: 0.3, dur: 0.6 } },
      // the route: a gold road the van drives along
      { type: 'path', points: cityPx.map(c => [X(c.p[0]), Y(c.p[1])]), smooth: true, stroke: 'primary', strokeW: 0.008, cap: 'round', in: { fx: 'draw', at: routeStart, dur: routeDur, ease: 'inOutQuad' } },
      ...cityPx.map((c, i) => ({ type: 'group', x: X(c.p[0]), y: Y(c.p[1]), in: { fx: 'pop', at: arrive[i] - 0.05, dur: 0.4 }, sfx: i % 2 ? 'pop' : 'tick',
        children: [
          { type: 'circle', r: 0.02, fill: 'primary', opacity: 0.3, loop: { fx: 'pulse', period: '2b', amp: 1.2, phase: i * 0.4 } },
          { type: 'circle', r: 0.011, fill: 'white', stroke: 'bg', strokeW: 0.004 },
          { type: 'text', text: c.n, role: 'caption', face: 'headline', weight: 700, size: tall ? 0.033 : 0.026, color: 'white',
            align: c.side === 'right' ? 'left' : c.side === 'left' ? 'right' : 'center', anchor: c.side === 'right' ? 'left' : c.side === 'left' ? 'right' : 'center',
            x: u(labelOff[c.side][0]), y: u(labelOff[c.side][1]) },
        ] })),
      { type: 'path', points: cityPx.map(c => [X(c.p[0]), Y(c.p[1])]), smooth: true, stroke: 'clear', strokeW: 0.001, head: { r: tall ? 0.055 : 0.05, src: VAN }, in: { fx: 'draw', at: routeStart, dur: routeDur, ease: 'inOutQuad' }, sfx: false },
      counter(3),
      { type: 'text', text: 'Nationwide', role: 'display', size: p3T.dSize, color: 'white', align: p3T.al, anchor: p3T.anc, x: p3T.tx, y: Y(p3T.disp), split: 'char', stagger: 0.03, in: { fx: 'mask-up', at: 0.15, dur: 0.5 } },
      { type: 'text', text: 'transport, end to end', role: 'headline', face: 'script', size: p3T.sSize, color: 'primary', align: p3T.al, anchor: p3T.anc, x: p3T.tx, y: Y(p3T.script), in: { fx: 'mask-up', at: 0.5, dur: 0.55 } },
    ],
  });

  // ===== 6 · WHY CHOOSE US? Card stack + checklist that builds item by item · 16b (8s) =====
  const ITEMS = [
    { text: 'Best for holiday shopping', card: 'shopping' },
    { text: 'Hauling large packages', card: A('van-rear.jpg') },
    { text: 'Enclosed transport', card: A('van-sidedoor.jpg') },
    { text: 'Best for fragile goods', card: 'fragile' },
  ];
  const slot = 2.0, first = 0.5;
  const LS = tall
    ? { head: 200, cardX: 540, cardY: 690, cardW: 0.66, cardH: 0.56, rows: [1125, 1240, 1355, 1470], rowX: 0.13, txtX: 0.19, txtSize: 0.06, chk: 0.034, road: 1690 }
    : { head: 110, cardX: 300, cardY: 600, cardW: 0.42, cardH: 0.46, rows: [380, 520, 660, 800], rowX: 0.585, txtX: 0.63, txtSize: 0.042, chk: 0.028, road: null };
  const cardW = LS.cardW, cardHU = LS.cardH;   // width (U == W here), height in U
  const tilts = [-3, 2.5, -2, 3];
  function illustration(kind) {
    const s = cardW; // scale illustrations with the card
    if (kind === 'shopping') return [
      { type: 'rect', wUnit: 'U', w: cardW, h: cardHU, radius: 0.035, fill: 'primary' },
      { type: 'rays', r: cardHU * 0.62, count: 16, fill: 'goldSoft', opacity: 0.55, loop: { fx: 'spin', period: '24b' } },
      // bag 1 (charcoal) + handle
      { type: 'ring', r: 0.07 * s, fill: 'bg', strokeW: 0.012 * s, x: -0.12 * s, y: -0.16 * s },
      { type: 'poly', pts: [[-0.27, -0.12], [0.03, -0.12], [0.05, 0.26], [-0.29, 0.26]].map(([x, y]) => [x * s, y * s]), radius: 0.012, fill: 'bg' },
      { type: 'text', text: 'RTC', role: 'caption', face: 'display', size: 0.07 * s, color: 'primary', x: -0.12 * s, y: 0.07 * s },
      // bag 2 (white) + handle
      { type: 'ring', r: 0.055 * s, fill: 'skyDeep', strokeW: 0.011 * s, x: 0.17 * s, y: -0.07 * s },
      { type: 'poly', pts: [[0.03, -0.03], [0.3, -0.03], [0.32, 0.27], [0.01, 0.27]].map(([x, y]) => [x * s, y * s]), radius: 0.012, fill: 'white' },
      { type: 'heart', r: 0.05 * s, fill: 'secondary', x: 0.165 * s, y: 0.12 * s },
      // gift box in front
      { type: 'rect', wUnit: 'U', w: 0.22 * s, h: 0.16 * s, radius: 0.01, fill: 'secondary', x: 0.0, y: 0.25 * s },
      { type: 'rect', wUnit: 'U', w: 0.04 * s, h: 0.16 * s, fill: 'white', x: 0.0, y: 0.25 * s },
      { type: 'rect', wUnit: 'U', w: 0.25 * s, h: 0.05 * s, radius: 0.006, fill: 'skyDeep', x: 0.0, y: 0.155 * s },
      { type: 'heart', r: 0.035 * s, fill: 'white', x: -0.03 * s, y: 0.115 * s, rot: -70 },
      { type: 'heart', r: 0.035 * s, fill: 'white', x: 0.03 * s, y: 0.115 * s, rot: 70 },
      { type: 'sparkle', r: 0.04 * s, fill: 'white', x: -0.3 * s, y: -0.25 * s, loop: { fx: 'pulse', period: '2b', amp: 1.5 } },
      { type: 'sparkle', r: 0.03 * s, fill: 'white', x: 0.32 * s, y: -0.24 * s, loop: { fx: 'pulse', period: '2b', amp: 1.5, phase: 0.5 } },
    ];
    // fragile: a parcel with a FRAGILE stamp and a wine glass
    return [
      { type: 'rect', wUnit: 'U', w: cardW, h: cardHU, radius: 0.035, fill: 'sky' },
      { type: 'rays', r: cardHU * 0.62, count: 16, fill: 'white', opacity: 0.25, loop: { fx: 'spin', period: '24b' } },
      { type: 'poly', pts: [[-0.3, -0.05], [0.18, -0.05], [0.3, -0.14], [-0.18, -0.14]].map(([x, y]) => [x * s, y * s + 0.06 * s]), radius: 0.008, fill: 'cardboardLight' },
      { type: 'poly', pts: [[0.18, -0.05], [0.3, -0.14], [0.3, 0.2], [0.18, 0.29]].map(([x, y]) => [x * s, y * s + 0.06 * s]), radius: 0.008, fill: 'cardboardDeep' },
      { type: 'poly', pts: [[-0.3, -0.05], [0.18, -0.05], [0.18, 0.29], [-0.3, 0.29]].map(([x, y]) => [x * s, y * s + 0.06 * s]), radius: 0.01, fill: 'cardboard' },
      { type: 'rect', wUnit: 'U', w: 0.06 * s, h: 0.34 * s, fill: 'cardboardLight', x: -0.06 * s, y: 0.18 * s, opacity: 0.8 },
      { type: 'group', x: -0.06 * s, y: 0.2 * s, rot: -8, in: { fx: 'pop', at: 0.35, dur: 0.4 }, sfx: false, children: [
        { type: 'rect', wUnit: 'U', w: 0.36 * s, h: 0.09 * s, radius: 0.008, fill: 'alert' },
        { type: 'text', text: 'FRAGILE', role: 'caption', face: 'display', size: 0.07 * s, tracking: 0.08, color: 'white' },
      ] },
      // wine glass standing on the box
      { type: 'group', x: 0.0, y: -0.2 * s, loop: { fx: 'sway', period: '2b', amp: 0.6 }, children: [
        { type: 'poly', pts: [[-0.07, -0.13], [0.07, -0.13], [0.06, -0.03], [0.0, 0.0], [-0.06, -0.03]].map(([x, y]) => [x * s, y * s]), radius: 0.02 * s, fill: 'white', stroke: 'bg', strokeW: 0.004 },
        { type: 'poly', pts: [[-0.055, -0.07], [0.055, -0.07], [0.05, -0.03], [0.0, -0.005], [-0.05, -0.03]].map(([x, y]) => [x * s, y * s]), radius: 0.015 * s, fill: 'wine' },
        { type: 'rect', wUnit: 'U', w: 0.012 * s, h: 0.08 * s, fill: 'bg', anchor: 'top', y: 0.0 },
        { type: 'rect', wUnit: 'U', w: 0.08 * s, h: 0.012 * s, radius: 0.004, fill: 'bg', y: 0.08 * s },
      ] },
    ];
  }
  const listEls = [
    { type: 'text', text: 'Why choose us?', role: 'display', size: tall ? 0.13 : 0.1, maxWidth: 0.94, color: 'bg', align: tall ? 'center' : 'left', anchor: tall ? 'center' : 'left', x: tall ? 0.5 : 0.06, y: Y(LS.head), split: 'word', stagger: 0.1, in: { fx: 'mask-up', at: -0.1, dur: 0.5 } },
    { type: 'rect', w: 0.16, h: 0.007, fill: 'primary', anchor: tall ? 'center' : 'left', x: tall ? 0.5 : 0.06, y: Y(LS.head + (tall ? 105 : 70)), in: { fx: 'grow', at: 0.3, dur: 0.5 } },
  ];
  if (LS.road) { // a little road along the bottom: the van keeps driving while the list builds (Line Journey continuity)
    listEls.push({ type: 'rect', w: 1, h: 0.004, fill: 'steel', x: 0.5, y: Y(LS.road + 70) });
    listEls.push({ type: 'path', points: [[-0.1, Y(LS.road)], [1.1, Y(LS.road)]], smooth: false, stroke: 'clear', strokeW: 0.001, head: { r: 0.085, src: VAN }, in: { fx: 'draw', at: 0, dur: 8, ease: 'linear' }, sfx: false });
  }
  const rowEls = []; // drawn above the cards so a card sliding in never covers the list
  ITEMS.forEach((it, i) => {
    const t = first + i * slot;
    const kids = typeof it.card === 'string' && it.card.startsWith('assets/')
      ? [{ type: 'image', src: it.card, w: cardW, h: cardHU, mask: 'rounded', radius: 0.035, fit: 'cover', stroke: 'white', strokeW: 0.012 }]
      : illustration(it.card);
    if (!it.card.startsWith('assets/')) kids.push({ type: 'rect', wUnit: 'U', w: cardW, h: cardHU, radius: 0.035, stroke: 'white', strokeW: 0.012 });
    listEls.push({ type: 'group', x: X(LS.cardX), y: Y(LS.cardY), rot: tilts[i], shadow: CARD_SHADOW,
      in: { fx: 'slide-left', at: t, dur: 0.6, ease: 'outBack' }, sfx: 'whoosh', sfxDur: 0.35,
      moves: i < 3 ? [{ at: t + slot, dur: 0.5, scale: 0.9, ease: 'inOutCubic' }] : [{ at: t + 0.6, dur: 3, scale: 1.04, ease: 'inOutQuad' }],
      out: i < 3 ? { fx: 'fade', at: t + slot + 0.35, dur: 0.25 } : undefined,
      children: kids });
    rowEls.push({ type: 'group', x: LS.rowX, y: Y(LS.rows[i]), in: { fx: 'pop', at: t + 0.3, dur: 0.4 }, sfx: 'pop', children: check(LS.chk) });
    rowEls.push({ type: 'text', text: it.text, role: 'headline', size: LS.txtSize, color: 'bg', align: 'left', anchor: 'left', x: LS.txtX, y: Y(LS.rows[i]), maxWidth: tall ? 0.76 : 0.34, lineHeight: 1.05,
      in: { fx: 'mask-up', at: t + 0.35, dur: 0.5 }, sfx: false,
      moves: i < 3 ? [{ at: t + slot, dur: 0.4, color: 'slate' }] : undefined });
  });
  scenes.push({ id: 'why', dur: '16b', bg: 'paper', transition: WIPE(['primary', 'secondary']), elements: listEls.concat(rowEls) });

  // ===== 7 · OFFER: Book with us now, seasonal specials & discounts · 6b (3s) =====
  const OF = tall ? { badgeY: 470, badgeR: 0.22, disp: 1020, dSize: 0.2, sub: 1290, subSize: 0.062 } : { badgeY: 250, badgeR: 0.14, disp: 560, dSize: 0.14, sub: 780, subSize: 0.048 };
  scenes.push({
    id: 'offer', dur: '6b', bg: 'primary', transition: 'cut',
    camera: { at: [0.5, 0.5], keys: [{ at: 0, dur: 0.3, zoom: 1.0, ease: 'outExpo' }], zoom: [1.1, 1.0] },
    elements: [
      { type: 'rays', r: tall ? 1.55 : 0.95, count: 22, fill: 'goldSoft', opacity: 0.45, x: 0.5, y: Y(OF.badgeY), loop: { fx: 'spin', period: '32b' } },
      { type: 'dots', count: 34, seed: 9, fill: ['bg', 'white', 'secondary'], r: 0.009, area: [0.02, -0.05, 0.98, 1.0], motion: 'fall', speed: 0.35, in: { at: 0.2, dur: 2.6 } },
      { type: 'group', x: 0.5, y: Y(OF.badgeY), in: { fx: 'spin-in', at: -0.15, dur: 0.6 }, loop: { fx: 'sway', period: '4b', amp: 0.8 },
        children: [
          { type: 'star', r: OF.badgeR, points: 18, inner: 0.84, round: 0.1, fill: 'bg', shadow: CARD_SHADOW },
          { type: 'ring', r: OF.badgeR * 0.74, fill: 'primary', strokeW: 0.004, dash: [0.01, 0.008] },
          { type: 'text', text: 'Seasonal', role: 'headline', face: 'script', size: OF.badgeR * 0.3, color: 'primary', y: -OF.badgeR * 0.26 },
          { type: 'text', text: 'Deals', role: 'display', size: OF.badgeR * 0.5, color: 'white', y: OF.badgeR * 0.14 },
        ] },
      { type: 'text', text: 'Book with\nus now', role: 'display', size: OF.dSize, color: 'onPrimary', x: 0.5, y: Y(OF.disp), split: 'line', stagger: 0.12, in: { fx: 'mask-up', at: 0.3, dur: 0.5 } },
      { type: 'text', text: 'to receive seasonal\nspecials and discounts', role: 'headline', size: OF.subSize, color: 'onPrimary', x: 0.5, y: Y(OF.sub), in: { fx: 'rise', at: 0.75, dur: 0.5 } },
    ],
  });

  // ===== 8 · PROMISE: "Your best choice this season." / We make sure it gets there. The van arrives. · 8b (4s) =====
  const TG = tall ? { q: 520, qSize: 0.1, disp: 900, dSize: 0.15, road: 1470, van: 0.5 } : { q: 165, qSize: 0.08, disp: 435, dSize: 0.12, road: 860, van: 0.36 };
  const vanW = tall ? 0.56 : 0.34;
  scenes.push({
    id: 'promise', dur: '8b', bg: 'bg', transition: WIPE(),
    elements: [
      { type: 'dots', count: 24, seed: 5, fill: ['goldDeep', 'slate'], r: 0.005, area: [0.04, 0.04, 0.96, 0.7], motion: 'drift', speed: 0.15, opacity: 0.5 },
      { type: 'text', text: '“Your best choice\nthis season.”', role: 'headline', face: 'script', size: TG.qSize, color: 'primary', x: 0.5, y: Y(TG.q), split: 'line', stagger: 0.15, in: { fx: 'mask-up', at: 0.1, dur: 0.6 } },
      { type: 'text', text: 'We make sure\nit gets there.', role: 'display', size: TG.dSize, maxWidth: 0.94, color: 'white', x: 0.5, y: Y(TG.disp), split: 'word', stagger: 0.09, in: { fx: 'pop', at: 1.5, dur: 0.45 } },
      // road: asphalt band, kerb lines, centre dashes streaming left (the van is moving)
      { type: 'rect', w: 1, h: tall ? 0.15 : 0.13, fill: 'asphalt', x: 0.5, y: Y(TG.road), in: { fx: 'grow', at: 0.0, dur: 0.6 } },
      { type: 'repeat', mode: 'line', count: 6, step: [0.2, 0], x: 0.5, y: Y(TG.road), stagger: 0.05, in: { at: 0.2 }, child: { type: 'rect', wUnit: 'U', w: 0.09, h: 0.012, radius: 0.006, fill: 'primary', in: { fx: 'grow', at: 0, dur: 0.3 } } },
      { type: 'group', x: X(-W * 0.4), y: Y(TG.road - (tall ? 20 : 15)), anchor: 'bottom',
        moves: [{ at: 0.2, dur: 1.4, x: TG.van, ease: 'outCubic' }, { at: 1.6, dur: 0.12, rot: 3, ease: 'outQuad' }, { at: 1.72, dur: 0.3, rot: 0, ease: 'outBack' }],
        loop: { fx: 'bob', period: 0.2, amp: 0.4 },
        children: [{ type: 'image', src: VAN, w: vanW, x: 0, y: -vanW * 0.27 }] },
      { type: 'sparkle', r: 0.03, fill: 'primary', x: TG.van + 0.24 * (tall ? 1 : 0.62), y: Y(TG.road - (tall ? 290 : 190)), in: { fx: 'pop', at: 1.75, dur: 0.4 }, loop: { fx: 'pulse', period: '2b', amp: 1.4 } },
      { type: 'sparkle', r: 0.02, fill: 'white', x: TG.van + 0.3 * (tall ? 1 : 0.62), y: Y(TG.road - (tall ? 220 : 140)), in: { fx: 'pop', at: 1.85, dur: 0.4 }, loop: { fx: 'pulse', period: '2b', amp: 1.4, phase: 0.5 } },
    ],
  });

  // ===== 9 · END CARD: clock emblem, wordmark, phone, email, CTA · 8b (4s) =====
  const EC = tall
    ? { clockY: 430, clockR: 0.13, word: 710, wSize: 0.12, script: 840, sSize: 0.11, phone: 1090, pSize: 0.095, mail: 1190, mSize: 0.036, pill: 1370, pillW: 0.6, pillH: 0.11 }
    : { clockY: 150, clockR: 0.085, word: 330, wSize: 0.105, script: 430, sSize: 0.085, phone: 590, pSize: 0.075, mail: 670, mSize: 0.03, pill: 820, pillW: 0.5, pillH: 0.095 };
  scenes.push({
    id: 'end', dur: '8b', bg: 'bg', transition: { type: 'flash', color: 'white', dur: 0.4 },
    elements: [
      { type: 'dots', count: 30, seed: 8, fill: ['goldDeep', 'slate', 'skyDeep'], r: 0.006, area: [0.03, 0.03, 0.97, 0.97], motion: 'drift', speed: 0.15, opacity: 0.6 },
      { type: 'blob', r: EC.clockR * 1.55, wobble: 0.08, speed: 0.6, seed: 4, fill: 'chapter3', x: 0.5, y: Y(EC.clockY), in: { fx: 'scale', at: 0.0, dur: 0.6 } },
      clock({ x: 0.5, y: Y(EC.clockY), r: EC.clockR, drawAt: 0.05, minuteSpin: '4b', hourSpin: '48b', secHand: 'white', inFx: { fx: 'pop-soft', at: 0, dur: 0.5 } }),
      { type: 'text', text: 'Round the Clock', role: 'display', size: EC.wSize, maxWidth: 0.94, color: 'primary', x: 0.5, y: Y(EC.word), split: 'word', stagger: 0.08, in: { fx: 'mask-up', at: 0.25, dur: 0.5 } },
      { type: 'text', text: 'Transport', role: 'headline', face: 'script', size: EC.sSize, color: 'white', x: 0.5, y: Y(EC.script), in: { fx: 'mask-up', at: 0.45, dur: 0.5 }, sfx: 'chime' },
      { type: 'rect', w: 0.5, h: 0.003, fill: 'slate', x: 0.5, y: Y((EC.script + EC.phone) / 2), in: { fx: 'grow', at: 0.6, dur: 0.5 } },
      { type: 'text', text: '+1 (868) 329-5373', role: 'headline', size: EC.pSize, color: 'white', x: 0.5, y: Y(EC.phone), in: { fx: 'rise', at: 0.75, dur: 0.5 } },
      { type: 'text', text: 'roundtheclocktransport@gmail.com', role: 'body', size: EC.mSize, color: 'steel', x: 0.5, y: Y(EC.mail), in: { fx: 'rise', at: 0.9, dur: 0.5 } },
      { type: 'group', x: 0.5, y: Y(EC.pill), in: { fx: 'pop', at: 1.15, dur: 0.5 }, loop: { fx: 'pulse', period: '2b', amp: 0.35 },
        children: [
          { type: 'pill', wUnit: 'U', w: EC.pillW, h: EC.pillH, fill: 'primary', shadow: { color: 'rgba(242,201,76,0.35)', blur: 0.05, y: 0 } },
          { type: 'text', text: 'Book with us now', role: 'title', size: EC.pillH * 0.4, color: 'onPrimary' },
        ] },
    ],
  });

  return { title: 'Round The Clock Transport · We make sure it gets there', format: { w: W, h: H, fps: 30 }, bpm: 120, scenes };
}

for (const fmt of ['9x16', '1x1']) {
  const out = path.join(here, `storyboard-${fmt}.json`);
  fs.writeFileSync(out, JSON.stringify(make(fmt), null, 1));
  console.log('wrote', out);
}
