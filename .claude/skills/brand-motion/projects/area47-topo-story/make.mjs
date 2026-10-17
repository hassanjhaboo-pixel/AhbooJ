#!/usr/bin/env node
// AREA 47 · "TOPO" Instagram Story: kinetic typography over topographic contour lines. 9:16, 10s, 120 bpm (beat = 0.5s).
//   0.0–2.5  DIRT? DUST? MUD? STAINS? slam one per beat into the same slot (echo stacks, solid ↔ hollow), contours pulse on the beat
//   2.5–4.5  WE / ABDUCT / IT ALL. The terrain gets sucked in toward the summit, then springs back
//   4.5–6.0  CARS. FURNITURE. MOBILE. (what he cleans + we come to you)
//   6.0–10   flash → logo, TOO CLEAN., DM TO BOOK @a47.detailing, phone. Calm hold with the lines drifting
// Key content stays between y 250 and 1640 px (Story UI covers the top and bottom bands).
//   python3 contours.py (once) → node make.mjs → story.json + cues.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, U = 1080, B = 0.5, DUR = 10;
const r4 = v => Math.round(v * 10000) / 10000;
const X = px => r4(px / W), Y = px => r4(px / H), u = px => r4(px / U);
const GLOW = { color: 'rgba(0,185,252,0.7)', blur: 0.035, y: 0 };
const SH = { color: 'rgba(0,0,0,0.7)', blur: 0.03, y: 0.006 };
const cues = []; const cue = (t, kind, extra = {}) => cues.push(Object.assign({ t: r4(t), kind }, extra));
const cut = at => ({ fx: 'cut', at, dur: 0.001 });
const hud = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'hud', size: 0.024, color: 'primary', x, y }, extra);
const els = [];

// ---------- topographic lines ----------
// Paths scale/rotate about the frame centre. Layer A (0–6s) draws on, pulses on the beat, gets "abducted" at 3.0.
// Layer B (6–10s) replaces it under the flash and drifts slowly for the calm end card.
const { levels } = JSON.parse(fs.readFileSync(path.join(here, 'contours.json'), 'utf8'));
const SUCK = [{ at: 2.9, dur: 0.45, scale: 0.8, rot: -4, ease: 'inCubic' }, { at: 3.35, dur: 0.9, scale: 1, rot: 0, ease: 'outBack' }];
const DRIFT = [{ at: 6.0, dur: 4.0, scale: 1.07, rot: 3, ease: 'linear' }];
levels.forEach((lv, li) => lv.lines.forEach(pts => {
  const style = lv.major ? { stroke: 'primary', strokeW: 0.0032, opacity: 0.6 } : { stroke: 'cyanDeep', strokeW: 0.0016, opacity: 0.5 };
  const at = r4(li * 0.01);   // all lines finish drawing at 0.5s, so the beat pulse starts on the beat
  els.push(Object.assign({ type: 'path', points: pts, smooth: true, cap: 'round', sfx: false,
    in: { fx: 'draw', at, dur: r4(0.5 - at), ease: 'outCubic' }, out: cut(6.0), moves: SUCK,
    loop: { fx: 'beat', period: B, amp: lv.major ? 0.35 : 0.2 } }, style));
  els.push(Object.assign({ type: 'path', points: pts, smooth: true, cap: 'round', sfx: false, from: 6.0, moves: DRIFT }, style,
    { opacity: style.opacity * 0.8 }));
}));
// elevation tags riding the major lines (their positions follow the same scale moves as the paths)
const follow = (x, y, moves) => moves.map(m => ({ at: m.at, dur: m.dur, ease: m.ease, x: r4(0.5 + (x - 0.5) * m.scale), y: r4(0.5 + (y - 0.5) * m.scale * W / W) }));
const tags = [];
levels.forEach((lv, li) => { if (!lv.major) return; lv.lines.forEach(pts => pts.forEach(([x, y], i) => {
  if (i % 5 || x < 0.08 || x > 0.8 || (x > 0.3 && x < 0.62)) return;
  if (!((y > 0.19 && y < 0.25) || (y > 0.85 && y < 0.89))) return;
  if (tags.some(t => Math.hypot((t.x - x) * W, (t.y - y) * H) < 260)) return;
  tags.push({ x, y, elev: 47 + li * 12 });
})); });
tags.slice(0, 5).forEach((t, i) => {
  const tag = (moves, extra) => ({ type: 'group', x: t.x, y: t.y, sfx: false, moves: follow(t.x, t.y, moves), children: [
    { type: 'circle', r: u(5), fill: 'cyanSoft', x: 0, y: 0 },
    { type: 'pill', wUnit: 'U', w: 0.13, h: 0.036, fill: 'bg', stroke: 'cyanDeep', strokeW: 0.0018, anchor: 'left', x: u(14), y: 0 },
    { type: 'text', text: `${String(t.elev).padStart(3, '0')} M`, role: 'caption', face: 'hud', size: 0.018, color: 'cyanSoft', anchor: 'left', align: 'left', x: u(28), y: 0 },
  ], ...extra });
  els.push(tag(SUCK.map(m => ({ ...m })), { in: { fx: 'pop', at: r4(0.6 + i * 0.12), dur: 0.3 }, out: cut(6.0) }));
  els.push(tag(DRIFT, { from: 6.0 }));
});
// summit marker + shock rings for the abduction
els.push({ type: 'ring', r: 0.05, fill: 'cyanSoft', strokeW: 0.004, x: X(600), y: Y(860), opacity: 0, sfx: false,
  moves: [{ at: 2.9, dur: 0.05, opacity: 0.9 }, { at: 2.95, dur: 0.6, scale: 9, opacity: 0, ease: 'outCubic' }], out: cut(4) });
els.push({ type: 'ring', r: 0.05, fill: 'primary', strokeW: 0.008, x: X(600), y: Y(860), opacity: 0, sfx: false,
  moves: [{ at: 3.35, dur: 0.05, opacity: 0.8 }, { at: 3.4, dur: 0.8, scale: 12, opacity: 0, ease: 'outCubic' }], out: cut(4.5) });

// ---------- HUD frame (screen-locked, outside the camera) ----------
const corner = (x, y, sx, sy) => ({ type: 'path', points: [[x, y + sy * 0.03], [x, y], [x + sx * 0.055, y]], stroke: 'primary', strokeW: 0.003, cap: 'square', screen: true, sfx: false,
  in: { fx: 'draw', at: 0.1, dur: 0.4 } });
els.push(corner(0.06, Y(270), 1, 1), corner(0.94, Y(270), -1, 1), corner(0.06, Y(1630), 1, -1), corner(0.94, Y(1630), -1, -1));
els.push(hud('// AREA 47 DETAILING', 0.1, Y(310), { align: 'left', anchor: 'left', screen: true, in: { fx: 'type', at: 0, dur: 0.45 }, sfx: false, out: cut(6.0) }));
els.push(hud('TOPO SCAN', 0.9, Y(310), { align: 'right', anchor: 'right', color: 'steel', screen: true, in: { fx: 'type', at: 0.2, dur: 0.3 }, sfx: false, out: cut(6.0),
  loop: { fx: 'pulse', period: B, amp: 0.4 } }));
els.push(hud('SECTOR 868', 0.1, Y(1590), { align: 'left', anchor: 'left', color: 'steel', size: 0.02, screen: true, in: { fx: 'type', at: 0.3, dur: 0.3 }, sfx: false }));
els.push(hud('GRID 47', 0.9, Y(1590), { align: 'right', anchor: 'right', color: 'steel', size: 0.02, screen: true, in: { fx: 'type', at: 0.4, dur: 0.3 }, sfx: false }));

// ---------- kinetic type ----------
// fitted size for one line of Inter Display Black caps (~0.7em per glyph, measured on the contact sheet)
const fit = (text, max = 0.2, w = 0.88) => r4(Math.min(max, w / (text.length * 0.7)));
const SOLID = { color: 'white', shadow: SH };
const HOLLOW = { color: 'bg', outline: { color: 'primary', w: 0.035 } };
// one word slammed into the centre slot with an echo stack above and below, visible [at, until)
function slam(text, at, until, hollow, y = 0.5, max = 0.2) {
  const size = fit(text, max), lh = size * 0.92 * U / H;
  const main = hollow ? HOLLOW : SOLID, echo = hollow ? SOLID : HOLLOW;
  [-2, -1, 1, 2].forEach(k => els.push(Object.assign({ type: 'text', text, role: 'display', size, x: 0.5, y: r4(y + k * lh), sfx: false,
    opacity: Math.abs(k) === 1 ? 0.32 : 0.12, in: { fx: k < 0 ? 'sink' : 'rise', at: r4(at + 0.03 * Math.abs(k)), dur: 0.22 }, out: cut(until) }, echo, { shadow: undefined })));
  els.push(Object.assign({ type: 'text', text, role: 'display', size, x: 0.5, y, sfx: false, in: { fx: 'scale-down', at, dur: 0.22 }, out: cut(until) }, main));
  cue(at, 'hit', { p: hollow ? 1.12 : 1 });
}
const WORDS = ['DIRT?', 'DUST?', 'MUD?', 'STAINS?'];
WORDS.forEach((w, i) => slam(w, 0.5 + i * B, 0.5 + (i + 1) * B, i % 2 === 1));

// WE / ABDUCT / IT ALL.
els.push({ type: 'text', text: 'WE', role: 'display', size: 0.11, color: 'white', x: 0.5, y: Y(700), shadow: SH, sfx: false,
  in: { fx: 'mask-up', at: 2.5, dur: 0.3 }, out: { fx: 'mask-down', at: 4.4, dur: 0.15 } });
els.push({ type: 'text', text: 'ABDUCT', role: 'display', size: fit('ABDUCT', 0.26, 0.94), color: 'primary', x: 0.5, y: Y(905), shadow: GLOW, split: 'char', stagger: 0.045, sfx: false,
  in: { fx: 'drop-near', at: 3.0, dur: 0.45 }, out: { fx: 'slide-up', at: 4.35, dur: 0.25, ease: 'inExpo' }, loop: { fx: 'shake', amp: 0.25 } });
els.push({ type: 'text', text: 'IT ALL.', role: 'display', size: 0.13, color: 'bg', outline: { color: 'white', w: 0.04 }, x: 0.5, y: Y(1115), split: 'word', stagger: 0.12, sfx: false,
  in: { fx: 'mask-up', at: 3.5, dur: 0.3 }, out: { fx: 'mask-down', at: 4.4, dur: 0.15 } });
els.push(hud('[ TRACTOR BEAM ENGAGED ]', 0.5, Y(1240), { size: 0.022, color: 'cyanSoft', in: { fx: 'type', at: 3.6, dur: 0.4 }, out: cut(4.5), loop: { fx: 'pulse', period: B, amp: 0.5 }, sfx: false }));
cue(2.5, 'tick'); cue(2.3, 'beam'); cue(3.5, 'hit', { p: 0.9 }); cue(3.75, 'hit', { p: 1.05 }); cue(4.35, 'zip');

// CARS. FURNITURE. MOBILE.
[['CARS.', 'INTERIOR · EXTERIOR'], ['FURNITURE.', 'UPHOLSTERY SHAMPOO'], ['MOBILE.', 'WE COME TO YOU']].forEach(([w, sub], i) => {
  const at = 4.5 + i * B;
  slam(w, at, at + B, i === 1, 0.47, 0.19);
  els.push(hud(sub, 0.5, Y(1235), { size: 0.026, color: 'white', in: { fx: 'type', at: r4(at + 0.05), dur: 0.2 }, out: cut(r4(at + B)), sfx: false }));
});

// ---------- end card ----------
els.push({ type: 'rect', w: 1, h: 1.8, fill: 'white', x: 0.5, y: 0.5, screen: true, sfx: false, from: 6.0, in: { fx: 'cut', at: 6.0, dur: 0.001 },
  moves: [{ at: 6.0, dur: 0.35, opacity: 0, ease: 'outCubic' }], out: cut(6.4) });
cue(6.0, 'slam');
const E0 = 6.05;
els.push({ type: 'ring', r: 0.2, fill: 'cyanDeep', strokeW: 0.003, dash: [0.014, 0.02], x: 0.5, y: Y(620), sfx: false, in: { fx: 'draw', at: E0 + 0.1, dur: 0.6 }, loop: { fx: 'spin', period: 12 } });
els.push({ type: 'ring', r: 0.17, fill: 'primary', strokeW: 0.004, x: 0.5, y: Y(620), sfx: false, shadow: GLOW, in: { fx: 'draw', at: E0, dur: 0.5 }, loop: { fx: 'pulse', period: 4 * B, amp: 0.3 } });
els.push({ type: 'logo', w: 0.3, x: 0.5, y: Y(620), sfx: false, in: { fx: 'pop', at: E0 + 0.1, dur: 0.45 } });
cue(E0 + 0.1, 'ping', { p: 1.0 });
els.push(hud('// AREA 47 DETAILING', 0.5, Y(880), { size: 0.026, in: { fx: 'type', at: E0 + 0.35, dur: 0.4 }, sfx: false }));
els.push({ type: 'text', text: 'TOO', role: 'display', size: 0.2, color: 'white', x: 0.5, y: Y(1015), shadow: SH, split: 'char', stagger: 0.05, sfx: false, in: { fx: 'mask-up', at: E0 + 0.45, dur: 0.4 } });
els.push({ type: 'text', text: 'CLEAN.', role: 'display', size: fit('CLEAN.', 0.2, 0.9), color: 'primary', x: 0.5, y: Y(1210), shadow: GLOW, split: 'char', stagger: 0.05, sfx: false, in: { fx: 'mask-up', at: E0 + 0.7, dur: 0.4 } });
cue(E0 + 0.45, 'hit', { p: 0.95 }); cue(E0 + 0.7, 'hit', { p: 1.1 });
els.push({ type: 'group', x: 0.5, y: Y(1395), sfx: false, in: { fx: 'pop', at: E0 + 1.4, dur: 0.4 }, loop: { fx: 'pulse', period: 2 * B, amp: 0.35 }, children: [
  { type: 'pill', wUnit: 'U', w: 0.8, h: 0.105, fill: 'primary', shadow: GLOW },
  { type: 'text', text: 'DM TO BOOK · @a47.detailing', role: 'headline', size: 0.042, color: 'onPrimary', case: 'none' },
] });
cue(E0 + 1.4, 'ping', { p: 1.5 });
els.push(hud('CARS · FURNITURE · MOBILE', 0.5, Y(1500), { size: 0.024, color: 'white', in: { fx: 'type', at: E0 + 1.7, dur: 0.45 }, sfx: false }));
els.push({ type: 'text', text: 'or call +1 (868) 329-5373', role: 'body', size: 0.034, color: 'steel', x: 0.5, y: Y(1556), sfx: false, in: { fx: 'fade', at: E0 + 2.0, dur: 0.4 } });

// ---------- camera: punch-in on every slam, crash on ABDUCT, slow push on the end card ----------
const keys = [];
const punch = (at, z = 1.05) => keys.push({ at, dur: 0.04, zoom: z, ease: 'linear' }, { at: r4(at + 0.04), dur: 0.38, zoom: 1, ease: 'outCubic' });
[0.5, 1.0, 1.5, 2.0, 3.5, 4.5, 5.0, 5.5].forEach(t => punch(t));
punch(3.0, 1.1);
keys.push({ at: 6.0, dur: 4.0, zoom: 1.04, ease: 'inOutQuad' });

const scene = { id: 'topo', dur: DUR, bg: 'bg', camera: { keys }, grade: { vignette: 0.38, grain: 0.035 }, elements: els };
fs.writeFileSync(path.join(here, 'story.json'), JSON.stringify({ title: 'AREA 47 · Topo Story', format: { w: W, h: H, fps: 30 }, bpm: 120, scenes: [scene], overlays: [] }));
cue(0, 'draw');
cues.sort((a, b) => a.t - b.t);
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify({ duration: DUR, bpm: 120, cues }, null, 1));
console.log(`story.json ${els.length} elements ${DUR}s · ${cues.length} cues · ${tags.length} elevation tags`);
