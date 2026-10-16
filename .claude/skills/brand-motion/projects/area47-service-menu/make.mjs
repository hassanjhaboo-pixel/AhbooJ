#!/usr/bin/env node
// AREA 47 · Service Menu as an arcade game. "SELECT YOUR MISSION": Basic Wash = Level 1, Deluxe Wash = Level 2,
// Full Detail = BOSS LEVEL, the extras = POWER-UPS, and the CTA is INSERT COIN → DM TO BOOK. SEV hosts.
// 9:16 Reel, 1080x1920, 100 bpm (beat 0.6s), 28.8s. Copy is word-for-word from the owner's service list.
//   node make.mjs → story.json + cues.json (absolute SFX cue times for chip.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sev } from '../../kits/area47-sev.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, B = 0.6;
const r4 = v => Math.round(v * 10000) / 10000;
const Y = px => r4(px / H), X = px => r4(px / W);
const SH = { color: 'rgba(0,0,0,0.55)', blur: 0.02, y: 0.004 };
const GLOW = { color: 'rgba(0,185,252,0.55)', blur: 0.04, y: 0 };
const cues = []; let T0 = 0;                       // T0 = absolute start of the scene being built
const cue = (t, kind, extra = {}) => cues.push(Object.assign({ t: r4(T0 + t), kind }, extra));
const pix = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'pixel', size: 0.034, color: 'primary', x, y }, extra);
const blink = (start, end, period = B) => { const m = []; for (let t = start, on = false; t < end; t += period / 2, on = !on) m.push({ at: r4(t), dur: 0.01, opacity: on ? 1 : 0.15 }); return m; };

// perspective grid floor (arcade/synthwave), behind the scene content
function floor(dur) {
  const vy = 0.8, els = [{ type: 'rect', w: 1, h: 0.22, hUnit: 'H', x: 0.5, y: 1, anchor: 'bottom', grad: ['clear', 'beam'] }];
  for (let i = -6; i <= 6; i++) els.push({ type: 'path', points: [[0.5 + i * 0.03, vy], [0.5 + i * 0.32, 1.02]], smooth: false, stroke: 'grid', strokeW: 0.0022, sfx: false });
  for (let k = 0; k < 6; k++) { // horizontal rungs scroll toward the viewer
    const y0 = vy + 0.004 + Math.pow(k / 6, 2) * 0.22, y1 = vy + 0.004 + Math.pow((k + 1) / 6, 2) * 0.22;
    els.push({ type: 'rect', w: 1, h: 0.0024, fill: 'grid', x: 0.5, y: r4(y0), moves: [{ at: 0, dur, y: r4(y1), ease: 'linear' }] });
  }
  els.push({ type: 'rect', w: 1, h: 0.003, fill: 'primary', x: 0.5, y: vy, shadow: GLOW });
  return els;
}
const bubble = (text, x, y, at, tailLeft = true) => ({ type: 'group', x, y, in: { fx: 'pop', at, dur: 0.35 }, sfx: false, children: [
  { type: 'poly', pts: tailLeft ? [[-0.07, 0.03], [-0.03, 0.03], [-0.1, 0.075]] : [[0.03, 0.03], [0.07, 0.03], [0.1, 0.075]], fill: 'white', radius: 0.004 },
  { type: 'rect', wUnit: 'U', w: r4(0.06 + text.length * 0.022), h: 0.08, radius: 0.034, fill: 'white' },
  { type: 'text', text, role: 'display', size: 0.04, color: 'bg', case: 'none' },
] });
const scenes = [];
const push = s => { scenes.push(s); T0 = r4(T0 + s.dur); };

// ===== 1 · TITLE: SELECT YOUR MISSION (4b) =====
{
  const dur = 4 * B;
  cue(0, 'coin');
  push({ id: 'title', dur, bg: 'bg', elements: [
    ...floor(dur),
    { type: 'image', src: 'assets/ufo.svg', w: 0.22, x: -0.2, y: Y(330), moves: [{ at: -0.2, dur: 1.6, x: 1.25, y: Y(280), ease: 'inOutQuad' }], loop: { fx: 'float', period: 1, amp: 0.4 }, sfx: false },
    pix('AREA 47 DETAILING PRESENTS', 0.5, Y(430), { size: 0.03, color: 'steel', in: { fx: 'type', at: -0.3, dur: 0.6 }, sfx: false }),
    { type: 'text', text: 'Select your', role: 'display', size: 0.1, maxWidth: 0.94, color: 'white', x: 0.5, y: Y(540), shadow: SH, in: { fx: 'pop', at: -0.25, dur: 0.4 } },
    { type: 'text', text: 'Mission', role: 'display', size: 0.2, color: 'primary', x: 0.5, y: Y(700), shadow: GLOW, split: 'char', stagger: 0.04, in: { fx: 'drop-near', at: 0.15, dur: 0.5 }, loop: { fx: 'wave', period: 1.2, amp: 0.35 } },
    pix('PRESS START', 0.5, Y(860), { size: 0.042, color: 'white', moves: blink(0.6, dur) }),
    sev({ x: 0.5, y: 0.83, h: 0.5, end: dur, art: [[0, 'face-hype'], [1.5, 'face-smirk']], in: { fx: 'slide-up', at: 0.35, dur: 0.5, ease: 'outBack' }, sfx: false }),
  ] });
  cue(0.4, 'bloop');
}

// ===== 2 · MISSION SELECT: three cards, cursor hops on the beat (4b) =====
{
  const dur = 4 * B;
  const cards = [['LVL 1', 'Basic\nwash', 'assets/side.jpg', 1], ['LVL 2', 'Deluxe\nwash', 'assets/front.jpg', 2], ['LVL 3', 'Full\ndetail', 'assets/lowsun.jpg', 3]];
  const els = [...floor(dur), pix('CHOOSE YOUR MISSION', 0.5, Y(300), { size: 0.04, color: 'white', in: { fx: 'type', at: 0, dur: 0.5 }, sfx: false })];
  cards.forEach(([lv, name, src, n], i) => {
    const x = r4(0.2 + i * 0.3);
    els.push({ type: 'group', x, y: Y(760), in: { fx: 'slide-up', at: 0.05 + i * 0.1, dur: 0.45, ease: 'outBack' }, sfx: false, children: [
      { type: 'rect', wUnit: 'U', w: 0.27, h: 0.6, radius: 0.016, fill: 'panel', stroke: n === 3 ? 'boss' : 'cyanDeep', strokeW: 0.004 },
      { type: 'image', src, w: 0.24, wUnit: 'U', h: 0.26, mask: 'rounded', radius: 0.01, fit: 'cover', y: -0.13 },
      { type: 'text', text: lv, role: 'caption', face: 'pixel', size: 0.03, color: n === 3 ? 'boss' : 'primary', y: 0.055 },
      { type: 'text', text: name, role: 'display', size: 0.046, color: 'white', y: 0.14 },
      ...Array.from({ length: n }, (_, k) => ({ type: 'image', src: 'assets/ufo.svg', w: 0.05, wUnit: 'U', x: r4((k - (n - 1) / 2) * 0.055), y: 0.245 })),
    ] });
    cue(0.05 + i * 0.1, 'blip', { p: 0.8 + i * 0.1 });
  });
  // cursor: bracket frame hops 1 → 2 → 3, back to 1, then SELECT
  const br = (sx, sy) => ({ type: 'group', x: r4(sx * 0.15), y: r4(sy * 0.315), children: [
    { type: 'rect', wUnit: 'U', w: 0.05, h: 0.008, fill: 'white', anchor: sx < 0 ? 'left' : 'right' },
    { type: 'rect', wUnit: 'U', w: 0.008, h: 0.05, fill: 'white', anchor: sy < 0 ? 'top' : 'bottom', x: r4(sx < 0 ? 0.004 : -0.004) },
  ] });
  const hops = [[B, 0.5], [2 * B, 0.8], [3 * B - 0.1, 0.2]];
  els.push({ type: 'group', x: 0.2, y: Y(760), in: { fx: 'pop', at: 0.45, dur: 0.25 }, sfx: false, loop: { fx: 'pulse', period: B, amp: 0.25 },
    moves: [...hops.map(([t, x]) => ({ at: t, dur: 0.12, x, ease: 'outCubic' })), { at: 3 * B + 0.2, dur: 0.08, scale: 1.15, ease: 'outQuad' }, { at: 3 * B + 0.28, dur: 0.2, scale: 1, ease: 'outBack' }],
    children: [br(-1, -1), br(1, -1), br(-1, 1), br(1, 1)] });
  hops.forEach(([t]) => cue(t, 'blip'));
  cue(3 * B + 0.2, 'select');
  els.push(sev({ x: 0.84, y: 1.0, h: 0.34, end: dur, art: [[0, 'face-side']], in: { fx: 'slide-up', at: 0.6, dur: 0.4 }, sfx: false }));
  els.push(bubble('Pick one.', 0.56, Y(1500), 0.9, false));
  push({ id: 'select', dur, bg: 'bg', transition: { type: 'wipe', dir: 'right', bands: ['primary', 'white'], bandW: 0.1, dur: 0.35 }, elements: els });
}

// ===== 3-5 · LEVELS =====
function level({ n, name, tag, items, stats, photo, quip, art, dur, boss = false, transition }) {
  const els = [...floor(dur)];
  if (boss) { // warning stripes band
    els.push({ type: 'group', x: 0.5, y: Y(250), in: { fx: 'grow', at: 0, dur: 0.3 }, sfx: false, children: [
      { type: 'rect', w: 1, h: 0.075, fill: 'boss' },
      ...Array.from({ length: 16 }, (_, k) => ({ type: 'rect', wUnit: 'U', w: 0.03, h: 0.1, fill: 'bg', x: r4(-0.6 + k * 0.08), rot: 30 })),
    ] });
    els.push(pix('WARNING: BOSS LEVEL', 0.5, Y(250), { size: 0.044, color: 'white', moves: blink(0.3, dur, B) }));
  } else els.push(pix(`LEVEL ${n}`, 0.5, Y(250), { size: 0.044, color: 'primary', in: { fx: 'type', at: 0, dur: 0.35 }, sfx: false }));
  els.push({ type: 'text', text: name, role: 'display', size: 0.104, maxWidth: 0.95, color: 'white', x: 0.5, y: Y(350), shadow: SH, split: 'char', stagger: 0.025, in: { fx: 'mask-up', at: 0.1, dur: 0.4 } });
  els.push({ type: 'text', text: tag, role: 'body', size: 0.042, color: 'steel', x: 0.5, y: Y(445), in: { fx: 'rise', at: 0.35, dur: 0.4 } });
  // mission photo in a HUD frame
  els.push({ type: 'image', src: photo, w: 0.86, h: 0.32, mask: 'rounded', radius: 0.02, fit: 'cover', x: 0.5, y: Y(675), stroke: boss ? 'boss' : 'primary', strokeW: 0.005,
    scale: 1, moves: [{ at: 0, dur, scale: 1.04, ease: 'linear' }], in: { fx: 'wipe', at: 0.2, dur: 0.45 }, sfx: false });
  els.push(sev({ x: 0.83, y: Y(905), h: 0.27, end: dur, art, in: { fx: 'slide-up', at: 0.9, dur: 0.4, ease: 'outBack' }, sfx: false }));
  els.push(bubble(quip, 0.5, Y(800), 1.3, false));
  cue(0.9, 'bloop');
  // loadout
  els.push(pix('LOADOUT', 0.07, Y(950), { align: 'left', anchor: 'left', size: 0.03, color: boss ? 'boss' : 'primary', in: { fx: 'fade', at: 0.6, dur: 0.2 }, sfx: false }));
  const step = items.length > 4 ? 64 : 84, t0 = 0.75, gap = Math.min(0.42, (dur - 2.6) / items.length);
  items.forEach((it, i) => {
    const y = Y(1010 + i * step), at = r4(t0 + i * gap);
    els.push(pix('+', 0.075, y, { size: 0.04, color: boss ? 'boss' : 'primary', in: { fx: 'pop', at, dur: 0.25 }, sfx: false }));
    els.push({ type: 'text', text: it, role: items.length > 4 ? 'body' : 'headline', size: items.length > 4 ? 0.038 : 0.042, color: 'white', align: 'left', anchor: 'left', x: 0.11, y, in: { fx: 'type', at, dur: 0.3 }, sfx: false });
    cue(at, 'blip', { p: 1 + i * 0.06 });
  });
  // stats: three 5-segment bars
  const sy = 1010 + items.length * step + (items.length > 4 ? 40 : 70), tS = r4(t0 + items.length * gap + 0.15);
  ['SHINE', 'INTERIOR', 'PROTECTION'].forEach((label, r) => {
    const y = Y(sy + r * 58);
    els.push(pix(label, 0.07, y, { align: 'left', anchor: 'left', size: 0.026, color: 'steel', in: { fx: 'fade', at: tS, dur: 0.2 }, sfx: false }));
    for (let k = 0; k < 5; k++) {
      const on = k < stats[r], at = r4(tS + 0.05 * k + r * 0.12);
      els.push({ type: 'rect', wUnit: 'U', w: 0.085, h: 0.03, radius: 0.004, x: r4(0.45 + k * 0.095), y, fill: on ? (boss ? 'boss' : 'primary') : 'panel', stroke: on ? null : 'slate', strokeW: 0.002,
        in: { fx: on ? 'pop' : 'fade', at, dur: 0.2 }, sfx: false, shadow: on ? GLOW : undefined });
      if (on) cue(at, 'tick', { p: 1 + k * 0.12 });
    }
    if (stats[r] === 5) { els.push(pix('MAX!', 0.95, y, { align: 'right', anchor: 'right', size: 0.03, color: 'gold', in: { fx: 'pop', at: r4(tS + 0.3 + r * 0.12), dur: 0.3 } })); }
  });
  if (stats.every(s => s === 5)) cue(tS + 0.55, 'levelup');
  push({ id: `level${n}`, dur, bg: 'bg', transition, elements: els });
}
level({ n: 1, name: 'Basic wash', tag: 'Perfect for a quick refresh', photo: 'assets/side.jpg', quip: 'Easy work.', art: [[0, 'face-smirk'], [2.6, 'face-wink']],
  items: ['Exterior wash', 'Tire cleaning and shine', 'Exterior window cleaning'], stats: [2, 0, 1], dur: 8 * B,
  transition: { type: 'iris', x: 0.2, y: Y(760), dur: 0.4 } });
level({ n: 2, name: 'Deluxe wash', tag: 'Extra care for your car', photo: 'assets/front.jpg', quip: 'Now we talking.', art: [[0, 'face-side'], [2.8, 'face-proud']],
  items: ['Wax-infused exterior wash', 'Tire cleaning and dressing', 'Interior and exterior window cleaning', 'Full interior vacuum and detailing'], stats: [3, 3, 2], dur: 8 * B,
  transition: { type: 'wipe', dir: 'right', bands: ['primary', 'white'], bandW: 0.1, dur: 0.35 } });
level({ n: 3, name: 'Full detail', tag: 'New car feel inside and out', photo: 'assets/lowsun.jpg', quip: 'Boss mode.', art: [[0, 'face-hype'], [1.6, 'face-flat'], [4.6, 'face-laugh']], boss: true,
  items: ['Full waxed exterior wash', 'Full interior vacuum and detailing', 'Upholstery shampoo', 'Steam cleaning and extraction', 'UV coating'], stats: [5, 5, 5], dur: 10 * B,
  transition: { type: 'flash', color: 'boss', dur: 0.3 } });

// ===== 6 · POWER-UPS (extras), 6b =====
{
  const dur = 6 * B;
  const ups = [['Ceramic Shine', 'sparkle'], ['Interior Deep Clean', 'scallop'], ['Upholstery Extraction', 'drop'], ['Engine Bay Cleaning', 'gear'], ['Steam Treatment', 'steam']];
  const icon = k => k === 'sparkle' ? [{ type: 'sparkle', r: 0.03, fill: 'white' }]
    : k === 'scallop' ? [{ type: 'scallop', r: 0.028, bumps: 10, depth: 0.12, fill: 'white' }]
    : k === 'drop' ? [{ type: 'poly', pts: [[0, -0.034], [0.022, 0.004], [0.016, 0.022], [0, 0.03], [-0.016, 0.022], [-0.022, 0.004]], radius: 0.01, fill: 'white' }]
    : k === 'gear' ? [{ type: 'star', r: 0.032, points: 8, inner: 0.72, round: 0.15, fill: 'white' }, { type: 'circle', r: 0.011, fill: 'primary' }]
    : [[-0.014, 0.018, 0.011], [0.004, -0.002, 0.014], [-0.006, -0.026, 0.009], [0.016, 0.022, 0.008]].map(([x, y, r]) => ({ type: 'circle', r, fill: 'white', x, y }));  // steam puffs
  const els = [...floor(dur),
    pix('POWER-UPS', 0.5, Y(260), { size: 0.044, color: 'gold', in: { fx: 'type', at: 0, dur: 0.35 }, sfx: false }),
    { type: 'text', text: 'Extra options', role: 'display', size: 0.095, maxWidth: 0.95, color: 'white', x: 0.5, y: Y(355), shadow: SH, in: { fx: 'mask-up', at: 0.1, dur: 0.4 } }];
  ups.forEach(([name, k], i) => {
    const at = r4(0.35 + i * 0.42);
    els.push({ type: 'group', x: 0.5, y: Y(520 + i * 165), in: { fx: i % 2 ? 'slide-left' : 'slide-right', at, dur: 0.4, ease: 'outBack' }, sfx: false, children: [
      { type: 'pill', wUnit: 'U', w: 0.84, h: 0.125, fill: 'panel', stroke: 'primary', strokeW: 0.004, shadow: GLOW },
      { type: 'circle', r: 0.05, fill: 'primary', x: -0.34 },
      ...icon(k).map(c => Object.assign(c, { x: r4(-0.34 + (c.x || 0)) })),
      { type: 'text', text: name, role: 'headline', size: 0.044, color: 'white', align: 'left', anchor: 'left', x: -0.26 },
      { type: 'text', text: '+1', role: 'caption', face: 'pixel', size: 0.034, color: 'gold', align: 'right', anchor: 'right', x: 0.37 },
    ] });
    cue(at + 0.15, 'powerup', { p: 1 + i * 0.08 });
  });
  push({ id: 'powerups', dur, bg: 'bg', transition: { type: 'wipe', dir: 'up', bands: ['gold', 'primary'], bandW: 0.08, dur: 0.35 }, elements: els });
}

// ===== 7 · PLAYER 2: YOUR CAR · INSERT COIN (8b) =====
{
  const dur = 8 * B;
  push({ id: 'end', dur, bg: 'bg', transition: { type: 'iris', x: 0.5, y: 0.5, dur: 0.4 }, elements: [
    ...floor(dur),
    { type: 'rays', r: 1.1, count: 22, fill: 'cyanDeep', opacity: 0.35, x: 0.5, y: Y(950), loop: { fx: 'spin', period: 24 } },
    pix('PLAYER 2: YOUR CAR', 0.5, Y(250), { size: 0.04, color: 'primary', in: { fx: 'type', at: 0, dur: 0.45 }, sfx: false }),
    { type: 'text', text: 'Ready?', role: 'display', size: 0.17, color: 'white', x: 0.5, y: Y(370), shadow: GLOW, in: { fx: 'pop', at: 0.15, dur: 0.4 } },
    sev({ x: 0.5, y: Y(1440), h: 0.82, end: dur, art: [[0, 'pose-point'], [2.4, 'face-wink', 0.72]], in: { fx: 'slide-up', at: 0.3, dur: 0.5, ease: 'outBack' }, sfx: false }),
    bubble('Too clean.', 0.73, Y(720), 2.5, true),
    { type: 'group', x: 0.5, y: Y(1470), in: { fx: 'pop', at: 1.2, dur: 0.4 }, sfx: false, loop: { fx: 'pulse', period: B * 2, amp: 0.3 }, children: [
      { type: 'pill', wUnit: 'U', w: 0.86, h: 0.11, fill: 'primary', shadow: GLOW },
      { type: 'text', text: 'INSERT COIN → DM @a47.detailing', role: 'headline', size: 0.04, color: 'onPrimary', case: 'none' },
    ] },
    pix('MOBILE · WE COME TO YOU · FURNITURE TOO', 0.5, Y(1560), { size: 0.026, color: 'white', in: { fx: 'fade', at: 1.5, dur: 0.3 } }),
    { type: 'text', text: 'or call +1 (868) 329-5373', role: 'body', size: 0.032, color: 'steel', x: 0.5, y: Y(1615), in: { fx: 'fade', at: 1.7, dur: 0.3 } },
  ] });
  cue(0.3, 'bloop'); cue(1.2, 'coin'); cue(2.5, 'blip', { p: 1.4 });
}

// ===== overlays: arcade HUD + CRT scanlines (absolute times, above everything) =====
const scoreAt = [[0, '000000'], [4.8, '000100'], [9.6, '000250'], [14.4, '000470'], [20.4, '004700'], [24.0, '047047']];
const total = T0;
const overlays = [
  { type: 'repeat', mode: 'line', count: 170, step: [0, 0.0105], x: 0.5, y: 0.5, child: { type: 'rect', w: 1, h: 0.0035, fill: 'scan' } },
  { type: 'logo', w: 0.07, x: 0.09, y: Y(120) },
  pix('SCORE', 0.15, Y(105), { align: 'left', anchor: 'left', size: 0.022, color: 'steel' }),
  ...scoreAt.map(([t, s], i) => pix(s, 0.15, Y(140), { align: 'left', anchor: 'left', size: 0.03, color: 'white', from: t, out: { fx: 'cut', at: i + 1 < scoreAt.length ? scoreAt[i + 1][0] : total, dur: 0.001 } })),
  pix('HI-SCORE', 0.93, Y(105), { align: 'right', anchor: 'right', size: 0.022, color: 'steel' }),
  pix('TOO CLEAN', 0.93, Y(140), { align: 'right', anchor: 'right', size: 0.03, color: 'gold' }),
];
const story = { title: 'AREA 47 · Service Menu (arcade)', format: { w: W, h: H, fps: 30 }, bpm: 100, scenes, overlays };
fs.writeFileSync(path.join(here, 'story.json'), JSON.stringify(story, null, 1));
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify({ duration: total, bpm: 100, cues }, null, 1));
console.log(`story.json ${scenes.length} scenes, ${total.toFixed(1)}s · cues.json ${cues.length} cues`);
