#!/usr/bin/env node
// AREA 47 mascot: animated 4:5 intro ("beamed down") + a character sheet with four expressions.
//   node make.mjs → intro.json, sheet.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mascot } from '../../kits/area47-mascot.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = '../../brand/assets/area47/mascot', logo = '../../brand/assets/area47/logo-circle.png';
const r4 = v => Math.round(v * 10000) / 10000;
const B = 0.6; // beat at 100 bpm
const hud = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'hud', size: 0.026, color: 'primary', x, y }, extra);

// ---------- intro (1080x1350, 6.6s) ----------
{
  const H = 1350, Y = px => r4(px / H);
  const story = { title: 'AREA 47 mascot intro', format: { w: 1080, h: 1350, fps: 30 }, bpm: 100, scenes: [{ id: 'intro', dur: 6.6, bg: 'bg',
    grade: { vignette: 0.3, grain: 0.03 },
    elements: [
      { type: 'dots', count: 60, seed: 9, fill: ['slate', 'cyanDeep'], r: 0.003, area: [0.02, 0.02, 0.98, 0.98], motion: 'drift', speed: 0.1, opacity: 0.8 },
      { type: 'repeat', mode: 'grid', count: 77, cols: 7, gap: [0.15, 0.15], x: 0.5, y: 0.62, child: { type: 'circle', r: 0.002, fill: 'slate' } },
      // UFO + beam
      { type: 'image', src: 'ufo.svg', w: 0.34, x: 0.5, y: Y(150), in: { fx: 'drop-soft', at: -0.2, dur: 0.5 }, loop: { fx: 'float', period: 2, amp: 0.5 },
        moves: [{ at: 1.7, dur: 0.6, x: 1.3, y: -0.1, scale: 0.6, ease: 'inCubic' }], sfx: 'whoosh' },
      { type: 'poly', pts: [[-0.08, 0], [0.08, 0], [0.42, 1.05], [-0.42, 1.05]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(190), blend: 'screen', opacity: 0,
        moves: [{ at: 0.2, dur: 0.2, opacity: 1 }, { at: 1.45, dur: 0.25, opacity: 0 }], loop: { fx: 'pulse', period: 0.5, amp: 0.3 }, sfx: false },
      // ground glow where he lands
      { type: 'pill', wUnit: 'U', w: 0.8, h: 0.04, fill: 'cyanDeep', opacity: 0, x: 0.5, y: 1.0, moves: [{ at: 1.1, dur: 0.4, opacity: 0.6 }] },
      mascot({ x: 0.22, y: 0.585, w: 0.56, base, logo, end: 6.6,
        faces: [[0, 'hype', 'ayy'], [1.3, 'cool', 'smirk'], [2.55, 'closed', 'smirk'], [2.67, 'cool', 'smirk'], [3.9, 'side', 'smirk'], [4.7, 'wink', 'grin'], [5.7, 'cool', 'smirk']],
        nods: [1.8, 1.8 + B, 1.8 + 2 * B, 1.8 + 3 * B, 4.7, 4.7 + B], in: { fx: 'drop-soft', at: 0.35, dur: 0.95 }, sfx: 'plop',
        loop: { fx: 'float', period: 2.4, amp: 0.25 } }),
      // title
      hud('// NEW RECRUIT', 0.5, Y(95), { in: { fx: 'type', at: 2.0, dur: 0.6 }, sfx: false }),
      { type: 'text', text: 'Meet the', role: 'display', size: 0.07, color: 'white', x: 0.5, y: Y(155), in: { fx: 'mask-up', at: 2.2, dur: 0.45 } },
      { type: 'text', text: 'Head of security', role: 'display', size: 0.07, color: 'primary', x: 0.5, y: Y(232), in: { fx: 'mask-up', at: 2.4, dur: 0.45 } },
      { type: 'group', x: 0.5, y: Y(300), in: { fx: 'pop', at: 3.2, dur: 0.4 }, sfx: 'pop', children: [
        { type: 'rect', wUnit: 'U', w: 0.46, h: 0.05, fill: 'white' },
        { type: 'text', text: 'NAME: CLASSIFIED', role: 'caption', face: 'hud', size: 0.026, color: 'bg' },
      ] },
      // grill sparkle on the wink
      { type: 'sparkle', r: 0.04, fill: 'white', x: 0.535, y: 0.562, in: { fx: 'pop', at: 4.75, dur: 0.3 }, out: { fx: 'fade', at: 5.4, dur: 0.3 }, sfx: 'twinkle' },
    ] }] };
  fs.writeFileSync(path.join(here, 'intro.json'), JSON.stringify(story, null, 1));
}

// ---------- character sheet (1920x1080) ----------
{
  const W = 1920, H = 1080, X = px => r4(px / W), Y = px => r4(px / H);
  const looks = [['cool', 'smirk', 'UNBOTHERED'], ['wink', 'grin', 'SAY LESS'], ['side', 'smirk', 'SIDE-EYE'], ['hype', 'ayy', 'AYY!']];
  const els = [
    { type: 'repeat', mode: 'grid', count: 160, cols: 16, gap: [0.11, 0.11], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    { type: 'text', text: 'AREA 47 // CHARACTER SHEET', role: 'caption', face: 'hud', size: 0.03, color: 'primary', align: 'left', anchor: 'left', x: 0.04, y: Y(70) },
    { type: 'text', text: 'Head of security', role: 'display', size: 0.075, color: 'white', align: 'left', anchor: 'left', x: 0.04, y: Y(140) },
  ];
  looks.forEach(([e, m, label], i) => {
    const cx = 240 + i * 480, w = 0.36; // U
    els.push(mascot({ x: X(cx - (w * 1080) / 2), y: Y(470), w, base, logo, faces: [[0, e, m]], sparkle: false }));
    els.push({ type: 'text', text: label, role: 'caption', face: 'hud', size: 0.03, color: 'primary', x: X(cx), y: Y(905) });
  });
  const story = { title: 'AREA 47 mascot sheet', format: { w: W, h: H, fps: 30 }, bpm: 100, scenes: [{ id: 'sheet', dur: 2, bg: 'bg', elements: els }] };
  fs.writeFileSync(path.join(here, 'sheet.json'), JSON.stringify(story, null, 1));
}
console.log('wrote intro.json, sheet.json');
