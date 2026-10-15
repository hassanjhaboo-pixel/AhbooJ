#!/usr/bin/env node
// AREA 47 Detailing: "Case File 047", a 6-slide motion carousel (Instagram feed, 1080x1350 each) on a Porsche Taycan Turbo GT.
// Concept: Area 47 runs a sci-fi "investigation" on the car. HUD brackets, targeting reticles, scan lines, a UFO.
// Continuity across the swipe: a dashed flight path runs along the bottom of slides 1-5. Each slide draws it left to right,
// with the UFO entering where the last slide left it. On slide 6 the path climbs to the top and the UFO parks there to beam the logo down.
//
//   ./prep.sh <uploads-dir>    (one-time: extracts the video clips into assets/<clip>/NNNN.jpg)
//   node make.mjs              → slide-1.json … slide-6.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const W = 1080, H = 1350, U = 1080, N = 6;
const r4 = v => Math.round(v * 10000) / 10000;
const Y = px => r4(px / H), X = px => r4(px / W);
const frames = dir => fs.readdirSync(path.join(here, 'assets', dir)).filter(f => f.endsWith('.jpg')).sort().map(f => `assets/${dir}/${f}`);
const UFO = 'assets/ufo.svg';
const SH = { color: 'rgba(0,0,0,0.6)', blur: 0.02, y: 0.004 };
const CARD_SH = { color: 'rgba(0,0,0,0.5)', blur: 0.035, y: 0.014 };
const FULL_H = r4(H / U); // full-bleed image height in U

// ---------- shared pieces ----------
const hud = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'hud', size: 0.026, color: 'primary', align: 'left', anchor: 'left', x, y, shadow: SH }, extra);
function frameHUD(n) {
  const m = 0.045, L = 0.07, t = 0.005, mx = m, my = r4(m * W / H);
  const corner = (x, y, sx, sy) => ({ type: 'group', x, y, children: [
    { type: 'rect', wUnit: 'U', w: L, h: t, fill: 'primary', anchor: sx > 0 ? 'left' : 'right', x: 0, y: 0 },
    { type: 'rect', wUnit: 'U', w: t, h: L, fill: 'primary', anchor: sy > 0 ? 'top' : 'bottom', x: sx > 0 ? t / 2 : -t / 2, y: 0 },
  ] });
  return [
    ...[corner(mx, my, 1, 1), corner(1 - mx, my, -1, 1), corner(mx, 1 - my, 1, -1), corner(1 - mx, 1 - my, -1, -1)].map(c => Object.assign(c, { in: { fx: 'fade', at: 0, dur: 0.3 }, sfx: false })),
    { type: 'logo', w: 0.085, x: 0.115, y: Y(118), shadow: SH },
    hud('AREA 47 DETAILING', 0.17, Y(106), { color: 'white', size: 0.024 }),
    hud('CASE FILE 047', 0.17, Y(136), { size: 0.02 }),
    hud(`0${n} / 0${N}`, 0.885, Y(118), { align: 'right', anchor: 'right', color: 'white', size: 0.026 }),
  ];
}
// bottom flight path: draws across in 1.3s and the UFO rides it, so a swipe feels like one continuous flight
function flightPath(at = 0.15) {
  const y = 0.958, pts = [[-0.04, y], [0.3, y - 0.008], [0.7, y + 0.006], [1.04, y]];
  return [
    { type: 'path', points: pts, stroke: 'primary', strokeW: 0.003, dash: [0.012, 0.01], opacity: 0.85, in: { fx: 'draw', at, dur: 1.3, ease: 'inOutQuad' }, sfx: false },
    { type: 'path', points: pts, stroke: 'clear', strokeW: 0.001, head: { r: 0.03, src: UFO }, in: { fx: 'draw', at, dur: 1.3, ease: 'inOutQuad' }, sfx: false },
  ];
}
const scrim = (side, frac, strong = 'shade') => ({ type: 'rect', w: 1, h: frac, hUnit: 'H', x: 0.5, y: side === 'top' ? 0 : 1, anchor: side, grad: side === 'top' ? [strong, 'clear'] : ['clear', strong] });
const scanLine = (at, dur = 1.1, y0 = 0.15, y1 = 0.9) => ({ type: 'group', x: 0.5, y: y0, opacity: 0, sfx: false,
  moves: [{ at, dur: 0.1, opacity: 1 }, { at, dur, y: y1, ease: 'inOutQuad' }, { at: at + dur - 0.15, dur: 0.15, opacity: 0 }],
  children: [
    { type: 'rect', w: 1, h: 0.08, anchor: 'bottom', grad: ['beamClear', 'beam'] },
    { type: 'rect', w: 1, h: 0.004, fill: 'cyanSoft' },
  ] });
// targeting reticle (group origin = centre); r in U
const reticle = (r, extra = {}) => Object.assign({ type: 'group', children: [
  { type: 'ring', r, fill: 'primary', strokeW: 0.004, dash: [0.02, 0.012], loop: { fx: 'spin', period: 6 } },
  { type: 'ring', r: r * 0.72, fill: 'cyanSoft', strokeW: 0.0025, opacity: 0.8 },
  ...[0, 90, 180, 270].map(a => ({ type: 'rect', wUnit: 'U', w: 0.004, h: r * 0.35, fill: 'primary', anchor: 'bottom', x: r4(Math.sin(a * Math.PI / 180) * r * 1.25), y: r4(-Math.cos(a * Math.PI / 180) * r * 1.25), rot: a })),
  { type: 'circle', r: 0.007, fill: 'primary' },
] }, extra);
const tag = (text, y, at) => ({ type: 'group', x: 0.07, y, in: { fx: 'wipe', at, dur: 0.45 }, sfx: 'tick', children: [
  { type: 'rect', wUnit: 'U', w: 0.006, h: 0.032, fill: 'primary', anchor: 'left', x: 0 },
  hud(text, 0.02, 0, { color: 'primary', size: 0.025 }),
] });
const grade = { vignette: 0.28, grain: 0.035 };
const story = (n, dur, elements, bg = 'bg') => ({ title: `AREA 47 · Case File 047 · slide ${n}`, format: { w: W, h: H, fps: 30 }, bpm: 100,
  scenes: [{ id: `slide${n}`, dur, bg, grade, elements: elements.concat(frameHUD(n)) }] });
const out = [];

// ===== 1 · COVER: the camera drops out of the sky onto the car, the UFO arrives, the car gets scanned =====
{
  const seq = frames('reveal'), dur = r4(seq.length / 30);
  out.push(story(1, dur, [
    { type: 'image', src: seq[0], seq, w: 1, h: FULL_H, fit: 'cover', x: 0.5, y: 0.5, scale: 1.06, moves: [{ at: 0, dur, scale: 1.0, ease: 'linear' }] },
    scrim('top', 0.32, 'shadeMid'),
    scrim('bottom', 0.4),
    // title over the sky (frame 0 = grid thumbnail)
    ...[
      hud('// INCOMING TRANSMISSION', 0.07, Y(330), { in: { fx: 'type', at: -0.2, dur: 0.8 }, sfx: false }),
      { type: 'text', text: 'Close\nencounter', role: 'display', size: 0.2, color: 'white', align: 'left', anchor: 'left', x: 0.07, y: Y(530), shadow: SH, split: 'line', stagger: 0.1, in: { fx: 'mask-up', at: -0.3, dur: 0.6 } },
      { type: 'text', text: 'OF THE CLEAN KIND', role: 'caption', face: 'hud', size: 0.042, color: 'primary', align: 'left', anchor: 'left', x: 0.07, y: Y(735), shadow: SH, in: { fx: 'wipe', at: 0.4, dur: 0.6 } },
    ].map(e => Object.assign(e, { moves: [{ at: 3.0, dur: 0.5, y: r4(e.y - 0.06), ease: 'inCubic' }], out: { fx: 'fade', at: 3.05, dur: 0.4 } })),
    // the UFO drops in as the camera lands, beam on
    { type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.46, 1.0], [-0.46, 1.0]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(250), blend: 'screen', opacity: 0, sfx: false,
      moves: [{ at: 3.75, dur: 0.35, opacity: 1, ease: 'outQuad' }], loop: { fx: 'pulse', period: 1.2, amp: 0.25 } },
    { type: 'image', src: UFO, w: 0.3, x: 0.5, y: Y(200), in: { fx: 'drop-soft', at: 3.25, dur: 0.6 }, loop: { fx: 'float', period: 2.4, amp: 0.6 }, sfx: 'whoosh' },
    scanLine(4.6, 1.2, 0.25, 0.86),
    tag('SPECIMEN ACQUIRED', Y(1040), 5.3),
    { type: 'text', text: 'Taycan Turbo GT', role: 'display', size: 0.125, color: 'white', align: 'left', anchor: 'left', x: 0.07, y: Y(1130), shadow: SH, in: { fx: 'mask-up', at: 5.45, dur: 0.5 } },
    hud('SWIPE  ›››', 0.93, Y(1215), { align: 'right', anchor: 'right', color: 'white', size: 0.026, in: { fx: 'fade', at: 5.9, dur: 0.4 }, loop: { fx: 'pulse', period: 1, amp: 0.4 } }),
    ...flightPath(5.6),
  ]));
}

// ===== 2 · EVIDENCE 01: mirror finish (the sky reflected in the bonnet) =====
{
  const dur = 6;
  out.push(story(2, dur, [
    { type: 'image', src: 'assets/hood.jpg', w: 1, h: FULL_H, fit: 'cover', x: 0.5, y: 0.42, scale: 1.12, moves: [{ at: 0, dur, scale: 1.2, ease: 'linear' }] },
    // light sweep across the paint
    { type: 'rect', wUnit: 'U', w: 0.22, h: 2.2, x: -0.3, y: 0.5, rot: 18, grad: ['clear', 'glassLight', 'clear'], blend: 'screen', opacity: 0.9, sfx: false,
      moves: [{ at: 0.8, dur: 1.4, x: 1.3, ease: 'inOutCubic' }] },
    { type: 'sparkle', r: 0.06, fill: 'white', x: 0.72, y: 0.07, in: { fx: 'pop', at: 1.6, dur: 0.4 }, loop: { fx: 'pulse', period: 1.4, amp: 1.5 } },
    { type: 'sparkle', r: 0.03, fill: 'white', x: 0.8, y: 0.15, in: { fx: 'pop', at: 1.8, dur: 0.4 }, loop: { fx: 'pulse', period: 1.4, amp: 1.5, phase: 0.6 } },
    scrim('bottom', 0.42),
    scrim('top', 0.16, 'shadeMid'),
    tag('EVIDENCE 01 // PAINT', Y(880), 0.3),
    { type: 'text', text: 'Mirror\nfinish', role: 'display', size: 0.16, color: 'white', align: 'left', anchor: 'left', x: 0.07, y: Y(1062), shadow: SH, split: 'line', stagger: 0.1, in: { fx: 'mask-up', at: 0.45, dur: 0.55 } },
    { type: 'text', text: 'Yes, those clouds are in the paint.', role: 'body', size: 0.036, color: 'steel', align: 'left', anchor: 'left', x: 0.07, y: Y(1250), shadow: SH, in: { fx: 'rise', at: 1.1, dur: 0.5 } },
    ...flightPath(0.15),
  ]));
}

// ===== 3 · EVIDENCE 02: wheels. A reticle tracks the gold wheel as the camera pans =====
{
  const seq = frames('wheel'), dur = r4(seq.length / 30);
  out.push(story(3, dur, [
    { type: 'image', src: seq[0], seq, w: 1, h: FULL_H, fit: 'cover', x: 0.5, y: 0.5 },
    reticle(0.21, { x: 0.53, y: 0.36, in: { fx: 'pop', at: 0.25, dur: 0.45 }, sfx: 'pop',
      moves: [{ at: 2.0, dur: 2.2, x: 0.1, y: 0.4, ease: 'inOutQuad' }], out: { fx: 'fade', at: 3.6, dur: 0.4 } }),
    hud('RIM // DE-DUSTED', 0.58, Y(770), { color: 'white', in: { fx: 'type', at: 0.7, dur: 0.6 }, out: { fx: 'fade', at: 2.0, dur: 0.3 }, sfx: false }),
    hud('TYRE // CLEANED + DRESSED', 0.58, Y(810), { in: { fx: 'type', at: 1.0, dur: 0.7 }, out: { fx: 'fade', at: 2.0, dur: 0.3 }, sfx: false }),
    scrim('bottom', 0.45),
    scrim('top', 0.16, 'shadeMid'),
    tag('EVIDENCE 02 // WHEELS', Y(880), 0.3),
    { type: 'text', text: 'Gold\nstandard', role: 'display', size: 0.16, color: 'white', align: 'left', anchor: 'left', x: 0.07, y: Y(1062), shadow: SH, split: 'line', stagger: 0.1, in: { fx: 'mask-up', at: 0.45, dur: 0.55 } },
    { type: 'text', text: 'Wheels, tyres, arches. Nothing left behind.', role: 'body', size: 0.036, color: 'steel', align: 'left', anchor: 'left', x: 0.07, y: Y(1250), shadow: SH, in: { fx: 'rise', at: 1.1, dur: 0.5 } },
    ...flightPath(0.15),
  ]));
}

// ===== 4 · EVIDENCE 03: the Turbo GT badge, reticle locks on =====
{
  const seq = frames('badge'), dur = 5.2;
  out.push(story(4, dur, [
    { type: 'image', src: seq[0], seq, w: 1, h: FULL_H, fit: 'cover', x: 0.5, y: 0.5, moves: [{ at: 3.4, dur: 1.8, scale: 1.06, ease: 'outQuad' }] },
    reticle(0.14, { x: 0.36, y: 0.45, in: { fx: 'pop', at: 0.3, dur: 0.45 }, sfx: 'pop', moves: [{ at: 0.6, dur: 2.8, x: 0.7, y: 0.4, ease: 'inOutQuad' }] }),
    hud('BADGE // LOCKED', 0.58, Y(335), { color: 'white', in: { fx: 'type', at: 3.3, dur: 0.5 }, sfx: false }),
    scrim('bottom', 0.45),
    scrim('top', 0.16, 'shadeMid'),
    tag('EVIDENCE 03 // DETAILS', Y(880), 0.3),
    { type: 'text', text: 'Every\nedge.', role: 'display', size: 0.16, color: 'white', align: 'left', anchor: 'left', x: 0.07, y: Y(1062), shadow: SH, split: 'line', stagger: 0.1, in: { fx: 'mask-up', at: 0.45, dur: 0.55 } },
    { type: 'text', text: 'Badges, trims and the gaps you never see.', role: 'body', size: 0.036, color: 'steel', align: 'left', anchor: 'left', x: 0.07, y: Y(1250), shadow: SH, in: { fx: 'rise', at: 1.1, dur: 0.5 } },
    ...flightPath(0.15),
  ]));
}

// ===== 5 · EVIDENCE BOARD: four photos land as exhibits, CASE CLOSED stamp =====
{
  const dur = 6.4;
  const ex = [
    { src: 'assets/lowsun.jpg', x: 0.285, y: Y(560), rot: -5, label: 'EXHIBIT A // STANCE' },
    { src: 'assets/side.jpg', x: 0.715, y: Y(575), rot: 4, label: 'EXHIBIT B // PROFILE' },
    { src: 'assets/mirror.jpg', x: 0.29, y: Y(1015), rot: 3, label: 'EXHIBIT C // GLOSS' },
    { src: 'assets/front.jpg', x: 0.71, y: Y(1030), rot: -4, label: 'EXHIBIT D // FRONT' },
  ];
  const cw = 0.33, ch = 0.33; // card image size: w frac of W, h in U
  out.push(story(5, dur, [
    { type: 'repeat', mode: 'grid', count: 140, cols: 10, gap: [0.1, 0.1], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.0022, fill: 'slate' } },
    hud('// CASE FILE 047', 0.07, Y(200), { in: { fx: 'type', at: 0.1, dur: 0.5 }, sfx: false }),
    { type: 'text', text: 'The evidence', role: 'display', size: 0.1, color: 'white', align: 'left', anchor: 'left', x: 0.07, y: Y(262), in: { fx: 'mask-up', at: 0.2, dur: 0.5 } },
    ...ex.map((e, i) => ({ type: 'group', x: e.x, y: e.y, rot: e.rot, shadow: CARD_SH, in: { fx: 'drop-near', at: 0.55 + i * 0.32, dur: 0.6 }, sfx: 'plop',
      children: [
        { type: 'rect', wUnit: 'U', w: cw + 0.03, h: ch + 0.085, fill: 'white', radius: 0.006, y: 0.025 },
        { type: 'image', src: e.src, w: cw, h: ch, mask: 'rounded', radius: 0.004, fit: 'cover', y: 0 },
        { type: 'text', text: e.label, role: 'caption', face: 'hud', size: 0.017, color: 'bg', y: r4(ch / 2 + 0.035) },
      ] })),
    // the stamp
    { type: 'group', x: 0.5, y: 0.56, rot: -11, in: { fx: 'scale-down', at: 2.45, dur: 0.3 }, sfx: 'plop', children: [
      { type: 'rect', wUnit: 'U', w: 0.74, h: 0.2, radius: 0.012, fill: 'glass', stroke: 'primary', strokeW: 0.012 },
      { type: 'text', text: 'Case closed', role: 'display', size: 0.13, color: 'primary', y: -0.012 },
      { type: 'text', text: 'DETAILED BY AREA 47', role: 'caption', face: 'hud', size: 0.022, color: 'white', y: 0.066 },
    ] },
    ...flightPath(0.15),
  ], 'panel'));
}

// ===== 6 · CTA: the UFO flies up from the path, beams the logo down. Services + booking =====
{
  const dur = 7;
  const chips = ['BASIC WASH', 'DELUXE WASH', 'FULL DETAIL'];
  out.push(story(6, dur, [
    { type: 'dots', count: 50, seed: 4, fill: ['slate', 'cyanDeep'], r: 0.003, area: [0.03, 0.03, 0.97, 0.97], motion: 'drift', speed: 0.1, opacity: 0.7 },
    { type: 'path', points: [[-0.04, 0.958], [0.25, 0.9], [0.18, 0.45], [0.5, 0.155]], stroke: 'primary', strokeW: 0.003, dash: [0.012, 0.01], opacity: 0.5, in: { fx: 'draw', at: 0.1, dur: 1.4, ease: 'inOutQuad' }, out: { fx: 'draw', at: 1.6, dur: 0.6 }, sfx: false },
    { type: 'path', points: [[-0.04, 0.958], [0.25, 0.9], [0.18, 0.45], [0.5, 0.155]], stroke: 'clear', strokeW: 0.001, head: { r: 0.03, src: UFO }, in: { fx: 'draw', at: 0.1, dur: 1.4, ease: 'inOutQuad' }, out: { fx: 'fade', at: 1.45, dur: 0.1 }, sfx: false },
    // parked UFO (takes over from the rider, grows to hero size) + beam
    { type: 'poly', pts: [[-0.07, 0], [0.07, 0], [0.3, 0.42], [-0.3, 0.42]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(250), blend: 'screen', opacity: 0, sfx: false,
      moves: [{ at: 1.7, dur: 0.3, opacity: 1 }], loop: { fx: 'pulse', period: 1.2, amp: 0.25 } },
    { type: 'image', src: UFO, w: 0.065, x: 0.5, y: Y(210), from: 1.5, moves: [{ at: 1.5, dur: 0.4, scale: 3.6, ease: 'outBack' }], loop: { fx: 'float', period: 2.4, amp: 0.4 }, sfx: false },
    { type: 'logo', w: 0.27, x: 0.5, y: Y(520), in: { fx: 'iris', at: 1.95, dur: 0.6 }, loop: { fx: 'float', period: 3, amp: 0.4 } },
    { type: 'text', text: 'Your car\nis next.', role: 'display', size: 0.14, color: 'white', x: 0.5, y: Y(810), split: 'line', stagger: 0.1, in: { fx: 'mask-up', at: 2.5, dur: 0.5 } },
    ...chips.map((c, i) => ({ type: 'group', x: r4(0.5 + (i - 1) * 0.3), y: Y(980), in: { fx: 'pop', at: 3.1 + i * 0.12, dur: 0.4 }, sfx: 'pop', children: [
      { type: 'pill', wUnit: 'U', w: 0.27, h: 0.06, fill: 'panel', stroke: 'primary', strokeW: 0.003 },
      { type: 'text', text: c, role: 'caption', face: 'hud', size: 0.022, color: 'white' },
    ] })),
    { type: 'text', text: '+ CERAMIC SHINE · ENGINE BAY · STEAM · UPHOLSTERY', role: 'caption', face: 'hud', size: 0.02, color: 'steel', x: 0.5, y: Y(1050), in: { fx: 'fade', at: 3.6, dur: 0.4 } },
    { type: 'text', text: 'MOBILE: WE COME TO YOU · FURNITURE TOO', role: 'caption', face: 'hud', size: 0.02, color: 'primary', x: 0.5, y: Y(1095), in: { fx: 'fade', at: 3.8, dur: 0.4 } },
    { type: 'group', x: 0.5, y: Y(1180), in: { fx: 'pop', at: 4.1, dur: 0.45 }, loop: { fx: 'pulse', period: 1.6, amp: 0.3 }, children: [
      { type: 'pill', wUnit: 'U', w: 0.62, h: 0.085, fill: 'primary', shadow: { color: 'rgba(0,185,252,0.45)', blur: 0.05, y: 0 } },
      { type: 'text', text: 'DM TO BOOK  ·  @a47.detailing', role: 'title', size: 0.032, color: 'onPrimary', case: 'none' },
    ] },
    { type: 'text', text: 'or call +1 (868) 329-5373', role: 'body', size: 0.028, color: 'steel', x: 0.5, y: Y(1250), in: { fx: 'fade', at: 4.4, dur: 0.4 } },
  ]));
}

out.forEach((s, i) => fs.writeFileSync(path.join(here, `slide-${i + 1}.json`), JSON.stringify(s, null, 1)));
console.log(`wrote ${out.length} slides`);
