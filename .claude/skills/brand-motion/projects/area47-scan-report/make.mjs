#!/usr/bin/env node
// AREA 47 · "A47 SCAN REPORT": the service list as a UFO scan of a blueprint car. 9:16 Reel, 100 bpm, ~31s.
// The car never moves (hero constant). Each package lights up the zones it covers with HUD callouts, and a coverage meter climbs.
// Basic → Deluxe → Full Detail, then the extras attach to their zones, and SEV signs off "Too clean."
// Copy is word-for-word from the owner's service list.
//   node make.mjs → story.json + cues.json (absolute sound cues for sound.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sev } from '../../kits/area47-sev.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, U = 1080, B = 0.6;
const r4 = v => Math.round(v * 10000) / 10000;
const X = px => r4(px / W), Y = px => r4(px / H), u = px => r4(px / U);
const PX = ([x, y]) => [X(x), Y(y)];
const GLOW = { color: 'rgba(0,185,252,0.6)', blur: 0.03, y: 0 };
const SH = { color: 'rgba(0,0,0,0.6)', blur: 0.02, y: 0.004 };
const cues = []; let T0 = 0;
const cue = (t, kind, extra = {}) => cues.push(Object.assign({ t: r4(T0 + t), kind }, extra));
const hud = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'hud', size: 0.026, color: 'primary', x, y }, extra);

// ---------- the blueprint car (pixel space, side view facing right) ----------
const arc = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; });
const UPPER = [[112, 1000], [98, 930], [118, 852], [150, 832], [290, 816], [395, 742], [470, 723], [610, 721], [690, 736], [790, 812], [930, 840], [978, 880], [985, 958], [975, 1000]];
const LOWER = [[975, 1000], [878, 1000], ...arc(790, 1000, 88, 0, 180), [380, 1000], ...arc(290, 1000, 88, 0, 180), [112, 1000]];
const SIL = [...UPPER, ...LOWER.slice(1)];
const WIN_R = [[318, 816], [405, 751], [500, 743], [502, 816]], WIN_F = [[522, 743], [610, 741], [682, 753], [760, 816], [522, 816]];
const CABIN = [[305, 822], [772, 822], [760, 932], [312, 932]], ENGINE = [[800, 832], [958, 852], [972, 934], [820, 934]];
const SEAT_R = [[358, 832], [432, 832], [444, 926], [348, 926]], SEAT_F = [[556, 832], [630, 832], [642, 926], [546, 926]];
const WHEELS = [[290, 1000], [790, 1000]];
const polyAt = (pts, extra) => Object.assign({ type: 'poly', x: 0, y: 0, pts: pts.map(([x, y]) => [u(x), u(y)]) }, extra);
const pathOf = (pts, extra) => Object.assign({ type: 'path', points: pts.map(PX), smooth: false, cap: 'round' }, extra);

// base blueprint (draws on in scene 1, static afterwards)
function blueprint(drawAt = null) {
  const draw = (d = 1.0, o = 0) => (drawAt == null ? undefined : { fx: 'draw', at: drawAt + o, dur: d, ease: 'inOutCubic' });
  const fade = o => (drawAt == null ? undefined : { fx: 'fade', at: drawAt + o, dur: 0.4 });
  const els = [
    { type: 'pill', wUnit: 'U', w: 0.9, h: 0.03, fill: 'cyanDeep', opacity: 0.35, x: 0.5, y: Y(1072), in: fade(0.6) },
    pathOf([[60, 1062], [1020, 1062]], { stroke: 'slate', strokeW: 0.002, dash: [0.01, 0.008], in: draw(0.6), sfx: false }),
    polyAt(CABIN, { stroke: 'slate', strokeW: 0.0018, dash: [0.008, 0.006], in: fade(0.9) }),
    polyAt(ENGINE, { stroke: 'slate', strokeW: 0.0018, dash: [0.008, 0.006], in: fade(0.9) }),
    polyAt(SEAT_R, { stroke: 'slate', strokeW: 0.0022, radius: 0.012, in: fade(1.0) }),
    polyAt(SEAT_F, { stroke: 'slate', strokeW: 0.0022, radius: 0.012, in: fade(1.0) }),
    { type: 'ring', r: u(20), fill: 'slate', strokeW: 0.003, x: X(706), y: Y(852), in: fade(1.0) },
    pathOf(UPPER, { smooth: true, stroke: 'primary', strokeW: 0.0045, in: draw(1.1), sfx: false }),
    pathOf(LOWER, { stroke: 'primary', strokeW: 0.0045, in: draw(1.1), sfx: false }),
    polyAt(WIN_R, { stroke: 'primary', strokeW: 0.003, radius: 0.006, in: fade(0.7) }),
    polyAt(WIN_F, { stroke: 'primary', strokeW: 0.003, radius: 0.006, in: fade(0.7) }),
    pathOf([[512, 818], [515, 962]], { stroke: 'primary', strokeW: 0.0025, in: draw(0.4, 0.8), sfx: false }),
    pathOf([[790, 812], [930, 840]], { stroke: 'cyanDeep', strokeW: 0.0025, in: draw(0.4, 0.8), sfx: false }),
    ...WHEELS.flatMap(([x, y]) => [
      { type: 'ring', r: u(70), fill: 'primary', strokeW: u(20), opacity: 0.35, x: X(x), y: Y(y), in: fade(0.8) },
      { type: 'ring', r: u(70), fill: 'primary', strokeW: 0.004, x: X(x), y: Y(y), in: draw(0.8, 0.4) },
      { type: 'ring', r: u(34), fill: 'primary', strokeW: 0.003, x: X(x), y: Y(y), in: draw(0.6, 0.6) },
      { type: 'circle', r: u(7), fill: 'primary', x: X(x), y: Y(y), in: fade(1.0) },
      { type: 'ring', r: u(92), fill: 'cyanDeep', strokeW: 0.002, dash: [0.012, 0.016], x: X(x), y: Y(y), in: fade(1.1), loop: { fx: 'spin', period: 6 } },
    ]),
  ];
  return els;
}
// zone highlights
const Z = {
  body: (at, extra = {}) => polyAt(SIL, Object.assign({ fill: 'beam', opacity: 0, moves: [{ at, dur: 0.4, opacity: 0.55 }] }, extra)),
  tires: at => WHEELS.map(([x, y]) => ({ type: 'ring', r: u(70), fill: 'primary', strokeW: u(20), opacity: 0, x: X(x), y: Y(y), shadow: GLOW, moves: [{ at, dur: 0.3, opacity: 1 }] })),
  winExt: at => [WIN_R, WIN_F].map(w => polyAt(w, { fill: 'cyanSoft', opacity: 0, radius: 0.006, moves: [{ at, dur: 0.3, opacity: 0.55 }] })),
  winBoth: at => [WIN_R, WIN_F].map(w => polyAt(w, { fill: 'white', opacity: 0, radius: 0.006, shadow: GLOW, moves: [{ at, dur: 0.3, opacity: 0.8 }] })),
  interior: at => [polyAt(CABIN, { fill: 'primary', opacity: 0, moves: [{ at, dur: 0.4, opacity: 0.35 }] }), { type: 'ring', r: u(20), fill: 'white', strokeW: 0.004, opacity: 0, x: X(706), y: Y(852), moves: [{ at, dur: 0.3, opacity: 1 }] }],
  seats: at => [SEAT_R, SEAT_F].map(s => polyAt(s, { fill: 'white', opacity: 0, radius: 0.012, shadow: GLOW, moves: [{ at, dur: 0.3, opacity: 0.9 }] })),
  engine: at => [polyAt(ENGINE, { fill: 'primary', opacity: 0, moves: [{ at, dur: 0.3, opacity: 0.5 }] })],
  wax: at => [0, 1, 2].map(i => ({ type: 'sparkle', r: 0.02 + i * 0.006, fill: 'white', x: X([420, 640, 880][i]), y: Y([770, 735, 850][i]), in: { fx: 'pop', at: at + i * 0.12, dur: 0.3 }, loop: { fx: 'pulse', period: 1.2, amp: 1.4, phase: i * 0.4 }, sfx: false })),
  uv: at => [pathOf(SIL.concat([SIL[0]]), { smooth: false, stroke: 'cyanSoft', strokeW: 0.012, opacity: 0.0, shadow: GLOW, moves: [{ at, dur: 0.4, opacity: 0.55 }], loop: { fx: 'pulse', period: 1.2, amp: 0.15 } })],
  steam: at => [{ type: 'dots', count: 26, seed: 7, fill: ['white', 'cyanSoft'], r: 0.007, area: [X(340), Y(700), X(660), Y(900)], motion: 'drift', speed: 0.35, opacity: 0.8, from: at, in: { at, dur: 0.6 } }],
};
// scan beam sweeping the car left → right
const sweep = (at, dur = 0.9) => ({ type: 'group', x: X(60), y: Y(890), sfx: false, opacity: 0, moves: [{ at, dur: 0.08, opacity: 1 }, { at, dur, x: X(1020), ease: 'inOutQuad' }, { at: at + dur - 0.1, dur: 0.1, opacity: 0 }],
  children: [{ type: 'rect', wUnit: 'U', w: 0.1, h: 0.42, fill: 'beam', blend: 'screen' }, { type: 'rect', wUnit: 'U', w: 0.006, h: 0.42, fill: 'cyanSoft', shadow: GLOW }] });
// callout: dot on the zone, leader line, label chip
function callout(anchor, label, side, ly, at) {
  const lx = side === 'L' ? 70 : 1010, kneeX = side === 'L' ? 70 + 40 : 1010 - 40;
  const tw = Math.min(0.84, 0.05 + label.length * 0.0185);
  return [
    { type: 'circle', r: u(9), fill: 'white', x: X(anchor[0]), y: Y(anchor[1]), shadow: GLOW, in: { fx: 'pop', at, dur: 0.25 }, sfx: false },
    pathOf([anchor, [anchor[0], ly], [kneeX, ly]], { stroke: 'cyanSoft', strokeW: 0.0022, in: { fx: 'draw', at: at + 0.05, dur: 0.3 }, sfx: false }),
    { type: 'group', x: X(side === 'L' ? lx : lx), y: Y(ly), in: { fx: 'wipe', at: at + 0.25, dur: 0.3 }, sfx: false, children: [
      { type: 'pill', wUnit: 'U', w: tw, h: 0.056, fill: 'panel', stroke: 'primary', strokeW: 0.0025, anchor: side === 'L' ? 'left' : 'right', x: 0 },
      { type: 'text', text: label, role: 'caption', face: 'hud', size: 0.024, color: 'white', align: side === 'L' ? 'left' : 'right', anchor: side === 'L' ? 'left' : 'right', x: r4(side === 'L' ? 0.025 : -0.025) },
    ] },
  ];
}
function header(tag, name, sub, at = 0) {
  return [
    hud(tag, 0.5, Y(250), { size: 0.026, in: { fx: 'type', at, dur: 0.35 }, sfx: false }),
    { type: 'text', text: name, role: 'display', size: 0.11, maxWidth: 0.94, color: 'white', x: 0.5, y: Y(340), shadow: SH, in: { fx: 'mask-up', at: at + 0.1, dur: 0.45 } },
    { type: 'text', text: sub, role: 'body', size: 0.04, color: 'steel', x: 0.5, y: Y(432), in: { fx: 'rise', at: at + 0.35, dur: 0.4 } },
  ];
}
function coverage(pct, at, prev = 0) {
  const w = 0.7, y = Y(1560);
  return [
    hud('COVERAGE', 0.15, Y(1515), { align: 'left', anchor: 'left', size: 0.022, color: 'steel' }),
    hud(`${pct}%`, 0.85, Y(1515), { align: 'right', anchor: 'right', size: 0.03, color: pct === 100 ? 'gold' : 'white', in: { fx: 'pop', at: at + 0.5, dur: 0.3 }, sfx: false }),
    { type: 'rect', w, h: 0.022, radius: 0.011, fill: 'panel', stroke: 'slate', strokeW: 0.002, x: 0.5, y },
    { type: 'rect', w: r4(w * prev / 100), h: 0.022, radius: 0.011, fill: 'primary', anchor: 'left', x: r4(0.5 - w / 2), y, opacity: prev ? 1 : 0 },
    { type: 'rect', w: r4(w * pct / 100), h: 0.022, radius: 0.011, fill: pct === 100 ? 'gold' : 'primary', anchor: 'left', x: r4(0.5 - w / 2), y, shadow: GLOW, in: { fx: 'grow', at, dur: 0.7 } },
  ];
}
const ufoParked = (extra = {}) => Object.assign({ type: 'image', src: 'assets/ufo.svg', w: 0.15, x: 0.5, y: Y(505), loop: { fx: 'float', period: 2.4, amp: 0.4 } }, extra);
const scenes = [];
const push = s => { scenes.push(s); T0 = r4(T0 + s.dur); };
const grade = { vignette: 0.3, grain: 0.03 };

// ===== 1 · INCOMING: UFO arrives, beam on, the blueprint draws (4b) =====
{
  const dur = 4 * B;
  push({ id: 'scan', dur, bg: 'bg', grade, elements: [
    { type: 'repeat', mode: 'grid', count: 96, cols: 8, gap: [0.12, 0.12], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    { type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.48, 0.5], [-0.48, 0.5]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(530), blend: 'screen', opacity: 0, moves: [{ at: 0.45, dur: 0.3, opacity: 1 }], loop: { fx: 'pulse', period: 1.2, amp: 0.2 }, sfx: false },
    ufoParked({ in: { fx: 'drop-soft', at: -0.2, dur: 0.55 } }),
    ...blueprint(0.5),
    hud('// AREA 47 DETAILING', 0.5, Y(250), { size: 0.026, in: { fx: 'type', at: -0.2, dur: 0.5 }, sfx: false }),
    { type: 'text', text: 'Scan report', role: 'display', size: 0.11, maxWidth: 0.94, color: 'white', x: 0.5, y: Y(350), shadow: SH, in: { fx: 'mask-up', at: -0.1, dur: 0.45 } },
    { type: 'text', text: 'What does your car need?', role: 'body', size: 0.042, color: 'steel', x: 0.5, y: Y(440), in: { fx: 'rise', at: 0.3, dur: 0.4 } },
    sweep(1.4, 0.9),
    hud('SCANNING...', 0.5, Y(1515), { size: 0.03, color: 'white', in: { fx: 'type', at: 0.8, dur: 0.5 }, loop: { fx: 'pulse', period: B, amp: 0.3 }, sfx: false }),
  ] });
  cue(0, 'beam'); cue(0.6, 'draw'); cue(1.4, 'scan');
}

// ===== 2-4 · PACKAGES =====
function pack({ tag, name, sub, zones, callouts, pct, prev, dur, transition }) {
  const els = [{ type: 'repeat', mode: 'grid', count: 96, cols: 8, gap: [0.12, 0.12], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    ufoParked(), ...blueprint(null), sweep(0.25, 0.9), ...header(tag, name, sub)];
  zones.forEach(([fn, at]) => els.push(...[].concat(Z[fn](at))));
  const chips = [];
  callouts.forEach(([anchor, label, side, ly, at]) => { const c = callout(anchor, label, side, ly, at); els.push(c[0], c[1]); chips.push(c[2]); cue(at, 'ping', { p: 1 + ly / 4000 }); });
  els.push(...chips);
  els.push(...coverage(pct, 0.6 + callouts.length * 0.45, prev));
  els.push(sweep(r4(dur - 2.1), 1.4)); cue(dur - 2.1, 'scan');   // verify pass keeps the hold alive
  cue(0.25, 'scan'); cue(0.1, 'hit'); cue(0.6 + callouts.length * 0.45, 'meter', { pct });
  push({ id: name, dur, bg: 'bg', grade, transition, elements: els });
}
const A = { body: [650, 905], tires: [790, 1000], tiresR: [290, 1000], winF: [640, 780], winR: [450, 785], interior: [600, 880], seats: [395, 880], engine: [890, 885], roof: [540, 722] };
const cs = (list, t0 = 0.6, gap = 0.45) => list.map(([a, l, s, y], i) => [a, l, s, y, r4(t0 + i * gap)]);
pack({ tag: 'PACKAGE 01', name: 'Basic wash', sub: 'Perfect for a quick refresh', pct: 35, prev: 0, dur: 8 * B,
  zones: [['body', 0.45], ['tires', 0.75], ['winExt', 1.05]],
  callouts: cs([[A.body, 'EXTERIOR WASH', 'R', 1180], [A.tiresR, 'TIRE CLEANING AND SHINE', 'L', 1260], [A.winF, 'EXTERIOR WINDOW CLEANING', 'R', 640]]),
  transition: { type: 'wipe', dir: 'right', bands: ['primary', 'white'], bandW: 0.1, dur: 0.35 } });
pack({ tag: 'PACKAGE 02', name: 'Deluxe wash', sub: 'Extra care for your car', pct: 70, prev: 35, dur: 9 * B,
  zones: [['body', 0.3], ['wax', 0.6], ['tires', 0.9], ['winBoth', 1.2], ['interior', 1.5]],
  callouts: cs([[A.roof, 'WAX-INFUSED EXTERIOR WASH', 'L', 640], [A.tires, 'TIRE CLEANING AND DRESSING', 'R', 1180], [A.winR, 'INTERIOR + EXTERIOR WINDOWS', 'L', 1260], [A.interior, 'FULL INTERIOR VACUUM + DETAIL', 'R', 1340]]),
  transition: { type: 'wipe', dir: 'right', bands: ['primary', 'white'], bandW: 0.1, dur: 0.35 } });
pack({ tag: 'PACKAGE 03 // FULL CLEARANCE', name: 'Full detail', sub: 'New car feel inside and out', pct: 100, prev: 70, dur: 11 * B,
  zones: [['body', 0.3], ['wax', 0.5], ['tires', 0.6], ['winBoth', 0.7], ['interior', 0.8], ['seats', 1.3], ['steam', 1.75], ['uv', 2.2]],
  callouts: cs([[A.body, 'FULL WAXED EXTERIOR WASH', 'R', 640], [A.interior, 'FULL INTERIOR VACUUM + DETAIL', 'L', 1180], [A.seats, 'UPHOLSTERY SHAMPOO', 'R', 1260], [[500, 840], 'STEAM CLEANING + EXTRACTION', 'L', 1340], [A.roof, 'UV COATING', 'L', 570]], 0.6, 0.42),
  transition: { type: 'flash', color: 'white', dur: 0.3 } });

// ===== 5 · EXTRAS attach to their zones (7b) =====
{
  const dur = 7 * B, ex = [[A.body, 'CERAMIC SHINE', 'R', 640], [A.interior, 'INTERIOR DEEP CLEAN', 'L', 1180], [A.seats, 'UPHOLSTERY EXTRACTION', 'R', 1260], [A.engine, 'ENGINE BAY CLEANING', 'R', 1340], [[470, 850], 'STEAM TREATMENT', 'L', 570]];
  const els = [{ type: 'repeat', mode: 'grid', count: 96, cols: 8, gap: [0.12, 0.12], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    ufoParked(), ...blueprint(null), ...header('ADD-ONS', 'Extra options', 'Ask about these add-ons'),
    ...Z.engine(0.5), ...Z.seats(0.9), ...Z.wax(0.3), sweep(2.2, 1.4)];
  const chips = [];
  cs(ex, 0.4, 0.38).forEach(([a, l, s, y, at]) => { const c = callout(a, l, s, y, at); els.push(c[0], c[1]); chips.push(c[2]); cue(at, 'ping', { p: 1.2 }); });
  els.push(...chips);
  push({ id: 'extras', dur, bg: 'bg', grade, transition: { type: 'wipe', dir: 'up', bands: ['primary', 'white'], bandW: 0.1, dur: 0.35 }, elements: els });
  cue(0.1, 'hit'); cue(2.2, 'scan');
}

// ===== 6 · SEV signs off (8b) =====
{
  const dur = 8 * B;
  push({ id: 'end', dur, bg: 'bg', grade, transition: { type: 'iris', x: 0.5, y: Y(890), dur: 0.4 }, elements: [
    { type: 'repeat', mode: 'grid', count: 96, cols: 8, gap: [0.12, 0.12], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    { type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.46, 0.75], [-0.46, 0.75]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(560), blend: 'screen', loop: { fx: 'pulse', period: 1.2, amp: 0.2 } },
    ufoParked({ y: Y(520) }),
    hud('// SCAN COMPLETE', 0.5, Y(250), { size: 0.026, in: { fx: 'type', at: 0, dur: 0.4 }, sfx: false }),
    { type: 'text', text: 'Pick your package', role: 'display', size: 0.09, maxWidth: 0.94, color: 'white', x: 0.5, y: Y(340), shadow: SH, in: { fx: 'mask-up', at: 0.1, dur: 0.45 } },
    sev({ x: 0.5, y: Y(1380), h: 0.74, end: dur, art: [[0, 'pose-point'], [2.2, 'face-wink', 0.66]], in: { fx: 'slide-up', at: 0.35, dur: 0.6, ease: 'outBack' }, sfx: false }),
    { type: 'group', x: 0.74, y: Y(760), in: { fx: 'pop', at: 2.3, dur: 0.35 }, sfx: false, children: [
      { type: 'poly', pts: [[-0.06, 0.03], [-0.02, 0.03], [-0.09, 0.075]], fill: 'white', radius: 0.004 },
      { type: 'rect', wUnit: 'U', w: 0.3, h: 0.085, radius: 0.035, fill: 'white' },
      { type: 'text', text: 'Too clean.', role: 'display', size: 0.042, color: 'bg', case: 'none' },
    ] },
    { type: 'group', x: 0.5, y: Y(1440), in: { fx: 'pop', at: 1.2, dur: 0.4 }, sfx: false, loop: { fx: 'pulse', period: 2 * B, amp: 0.3 }, children: [
      { type: 'pill', wUnit: 'U', w: 0.78, h: 0.105, fill: 'primary', shadow: GLOW },
      { type: 'text', text: 'DM TO BOOK · @a47.detailing', role: 'headline', size: 0.04, color: 'onPrimary', case: 'none' },
    ] },
    hud('MOBILE: WE COME TO YOU · FURNITURE TOO', 0.5, Y(1530), { size: 0.022, color: 'white', in: { fx: 'fade', at: 1.5, dur: 0.3 } }),
    { type: 'text', text: 'or call +1 (868) 329-5373', role: 'body', size: 0.032, color: 'steel', x: 0.5, y: Y(1585), in: { fx: 'fade', at: 1.7, dur: 0.3 } },
  ] });
  cue(0, 'beam'); cue(0.4, 'bloop'); cue(1.2, 'hit'); cue(2.3, 'ping', { p: 1.5 });
}

const overlays = [{ type: 'logo', w: 0.07, x: 0.09, y: Y(120) }, hud('AREA 47', 0.15, Y(108), { align: 'left', anchor: 'left', size: 0.022, color: 'white' }), hud('SCAN REPORT', 0.15, Y(138), { align: 'left', anchor: 'left', size: 0.018 })];
fs.writeFileSync(path.join(here, 'story.json'), JSON.stringify({ title: 'AREA 47 · Scan Report', format: { w: W, h: H, fps: 30 }, bpm: 100, scenes, overlays }, null, 1));
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify({ duration: T0, bpm: 100, cues }, null, 1));
console.log(`story.json ${scenes.length} scenes ${T0.toFixed(1)}s · ${cues.length} cues`);
