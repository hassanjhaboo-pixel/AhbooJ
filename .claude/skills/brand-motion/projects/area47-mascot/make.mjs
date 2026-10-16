#!/usr/bin/env node
// SEV (AREA 47's mascot): animated 4:5 intro + character sheet, built from the generated art via kits/area47-sev.mjs.
//   node make.mjs → intro.json, sheet.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sev } from '../../kits/area47-sev.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const r4 = v => Math.round(v * 10000) / 10000;
const hud = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'hud', size: 0.026, color: 'primary', x, y }, extra);

// ---------- intro (1080x1350, 6.6s): beamed down, then pose-to-pose on the beat ----------
{
  const H = 1350, Y = px => r4(px / H), B = 0.6;
  const els = [
    { type: 'dots', count: 60, seed: 9, fill: ['slate', 'cyanDeep'], r: 0.003, area: [0.02, 0.02, 0.98, 0.98], motion: 'drift', speed: 0.1, opacity: 0.8 },
    { type: 'repeat', mode: 'grid', count: 77, cols: 7, gap: [0.15, 0.15], x: 0.5, y: 0.62, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    { type: 'image', src: 'ufo.svg', w: 0.34, x: 0.5, y: Y(150), in: { fx: 'drop-soft', at: -0.2, dur: 0.5 }, loop: { fx: 'float', period: 2, amp: 0.5 },
      moves: [{ at: 1.7, dur: 0.6, x: 1.3, y: -0.1, scale: 0.6, ease: 'inCubic' }], sfx: 'whoosh' },
    { type: 'poly', pts: [[-0.08, 0], [0.08, 0], [0.42, 1.05], [-0.42, 1.05]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(190), blend: 'screen', opacity: 0,
      moves: [{ at: 0.2, dur: 0.2, opacity: 1 }, { at: 1.45, dur: 0.25, opacity: 0 }], loop: { fx: 'pulse', period: 0.5, amp: 0.3 }, sfx: false },
    { type: 'pill', wUnit: 'U', w: 0.8, h: 0.04, fill: 'cyanDeep', opacity: 0, x: 0.5, y: 1.0, moves: [{ at: 1.1, dur: 0.4, opacity: 0.6 }] },
    sev({ x: 0.5, y: 1.0, h: 0.86, end: 6.6, art: [[0, 'hero'], [3.0, 'pose-47', 0.8], [3.0 + 1.5 * B, 'pose-keys', 0.8], [3.0 + 3 * B, 'pose-point', 0.82], [5.7, 'face-wink', 0.74]],
      in: { fx: 'drop-soft', at: 0.35, dur: 0.95 }, sfx: 'plop', loop: { fx: 'float', period: 2.4, amp: 0.25 } }),
    hud('// NEW RECRUIT', 0.5, Y(95), { in: { fx: 'type', at: 1.6, dur: 0.6 }, sfx: false }),
    { type: 'text', text: 'Meet the', role: 'display', size: 0.075, color: 'white', x: 0.5, y: Y(160), in: { fx: 'mask-up', at: 1.8, dur: 0.45 } },
    { type: 'text', text: 'Head of security', role: 'display', size: 0.075, color: 'primary', x: 0.5, y: Y(240), in: { fx: 'mask-up', at: 2.0, dur: 0.45 } },
    { type: 'group', x: 0.5, y: Y(315), in: { fx: 'pop', at: 2.6, dur: 0.4 }, sfx: 'pop', children: [
      { type: 'rect', wUnit: 'U', w: 0.36, h: 0.05, fill: 'white' },
      { type: 'text', text: 'NAME: SEV', role: 'caption', face: 'hud', size: 0.028, color: 'bg' },
    ] },
    { type: 'group', x: 0.76, y: Y(470), in: { fx: 'pop', at: 5.75, dur: 0.4 }, sfx: 'pop', children: [
      { type: 'poly', pts: [[-0.06, 0.03], [-0.02, 0.03], [-0.09, 0.08]], fill: 'white', radius: 0.004 },
      { type: 'rect', wUnit: 'U', w: 0.3, h: 0.085, radius: 0.035, fill: 'white' },
      { type: 'text', text: 'Too clean.', role: 'display', size: 0.042, color: 'bg' },
    ] },
  ];
  const story = { title: 'SEV intro', format: { w: 1080, h: 1350, fps: 30 }, bpm: 100, scenes: [{ id: 'intro', dur: 6.6, bg: 'bg', grade: { vignette: 0.3, grain: 0.03 }, elements: els }] };
  fs.writeFileSync(path.join(here, 'intro.json'), JSON.stringify(story, null, 1));
}

// ---------- character sheet (1920x1080): hero + nine expressions ----------
{
  const W = 1920, H = 1080, X = px => r4(px / W), Y = px => r4(px / H);
  const faces = [['smirk', 'SMIRK'], ['wink', 'SAY LESS'], ['side', 'SIDE-EYE'], ['hype', 'AYY!'], ['chill', 'CHILL'], ['laugh', 'DEAD'], ['flat', 'UNIMPRESSED'], ['shocked', 'DIRTY CAR?!'], ['proud', 'TOO CLEAN']];
  const els = [
    { type: 'repeat', mode: 'grid', count: 160, cols: 16, gap: [0.11, 0.11], x: 0.5, y: 0.5, child: { type: 'circle', r: 0.002, fill: 'slate' } },
    { type: 'text', text: 'AREA 47 // CHARACTER SHEET // "TOO CLEAN."', role: 'caption', face: 'hud', size: 0.026, color: 'primary', align: 'left', anchor: 'left', x: 0.035, y: Y(60) },
    { type: 'text', text: 'Sev', role: 'display', size: 0.12, color: 'white', align: 'left', anchor: 'left', x: 0.035, y: Y(150) },
    { type: 'text', text: 'HEAD OF SECURITY', role: 'caption', face: 'hud', size: 0.03, color: 'primary', align: 'left', anchor: 'left', x: 0.035, y: Y(225) },
    sev({ x: X(330), y: Y(1060), h: 0.76, art: [[0, 'hero']], bump: 0 }),
  ];
  faces.forEach(([f, label], i) => {
    const c = i % 5, r = Math.floor(i / 5), cx = 760 + c * 255, by = 470 + r * 470;
    els.push(sev({ x: X(cx), y: Y(by), h: 0.33, art: [[0, `face-${f}`]], bump: 0 }));
    els.push({ type: 'text', text: label, role: 'caption', face: 'hud', size: 0.022, color: 'primary', x: X(cx), y: Y(by + 28) });
  });
  const story = { title: 'SEV character sheet', format: { w: W, h: H, fps: 30 }, bpm: 100, scenes: [{ id: 'sheet', dur: 2, bg: 'bg', elements: els }] };
  fs.writeFileSync(path.join(here, 'sheet.json'), JSON.stringify(story, null, 1));
}
console.log('wrote intro.json, sheet.json');
