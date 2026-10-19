#!/usr/bin/env node
// SEV v3 asset test (8s, 9:16, silent): walk cycle → front puppet with the new eye states → hand pose cutaway.
//   node demo-v3.mjs → demo-v3.json → build → render
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sevPuppet, sevWalk } from '../../kits/area47-sevrig.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const r4 = v => Math.round(v * 10000) / 10000, Y = px => r4(px / 1920);
const cut = at => ({ fx: 'cut', at: r4(at), dur: 0.001 });
const DUR = 8;
const els = [];
const { levels } = JSON.parse(fs.readFileSync(path.join(here, '../area47-topo-story/contours.json'), 'utf8'));
levels.forEach(lv => lv.lines.forEach(pts => els.push({ type: 'path', points: pts, smooth: true, stroke: lv.major ? 'cyanDeep' : 'panel', strokeW: lv.major ? 0.0026 : 0.0016, opacity: lv.major ? 0.5 : 0.9, sfx: false })));
const label = (text, at, end) => els.push({ type: 'text', text, role: 'display', face: 'street', size: 0.09, color: 'white', x: 0.5, y: Y(330), sfx: false, in: { fx: 'scale-down', at, dur: 0.2 }, out: cut(end) });

// 1 · walk in (side view, full body)
const walk = sevWalk({ x0: -0.3, x1: 0.5, y: 0.9, h: 0.85, at: 0.15, fps: 8 });
const T1 = walk.walkEnd;
walk.out = cut(T1);
els.push({ type: 'rect', w: 0.7, h: 0.012, fill: 'cyanDeep', x: 0.5, y: 0.905, opacity: 0.6, sfx: false, out: cut(T1) });   // floor line
els.push(walk);
label('WALK CYCLE', 0.2, T1);

// 2 · front puppet: eye states (blinks are automatic: half → closed → half)
const eyes = [[0, 'neutral'], [T1 + 0.6, 'look-left'], [T1 + 1.2, 'look-right'], [T1 + 1.8, 'side-eye'], [T1 + 2.5, 'squint'], [T1 + 3.1, 'wink'], [T1 + 3.6, 'happy'], [T1 + 4.3, 'wide'], [T1 + 5.0, 'neutral']];
els.push(sevPuppet({ x: 0.5, y: 1.0234, scale: 1.25, dur: DUR, lines: [], eyes, from: T1,
  extraMoves: [{ at: T1, dur: 0.07, sy: 1.05, sx: 0.96, ease: 'outQuad' }, { at: T1 + 0.07, dur: 0.3, sy: 1, sx: 1, ease: 'outBack' }] }));
label('NEW EYES', T1, T1 + 3.1);

// 3 · hand pose cutaway on the wink
const H = T1 + 3.1;
els.push({ type: 'image', src: '../../brand/assets/area47/sev/hands/hand-thumbs-up.png', w: 0.42, wUnit: 'U', x: 0.22, y: Y(1500), rot: -12, sfx: false,
  in: { fx: 'slide-up', at: H, dur: 0.35, ease: 'outBack' }, out: { fx: 'slide-down', at: H + 1.6, dur: 0.3 } });
els.push({ type: 'image', src: '../../brand/assets/area47/sev/hands/hand-spray.png', w: 0.36, wUnit: 'U', x: 0.8, y: Y(1480), rot: 10, sfx: false,
  in: { fx: 'slide-up', at: H + 0.25, dur: 0.35, ease: 'outBack' }, out: { fx: 'slide-down', at: H + 1.6, dur: 0.3 } });
label('HAND POSES', H, H + 1.9);
label('TOO CLEAN.', H + 2.0, DUR + 1);

fs.writeFileSync(path.join(here, 'demo-v3.json'), JSON.stringify({ title: 'SEV v3 asset test', format: { w: 1080, h: 1920, fps: 30 }, scenes: [{ id: 'v3', dur: DUR, bg: 'bg',
  camera: { keys: [{ at: T1, dur: 0.04, zoom: 1.05, ease: 'linear' }, { at: T1 + 0.04, dur: 0.35, zoom: 1, ease: 'outCubic' }] }, elements: els }], overlays: [] }));
console.log(`demo-v3.json · walk ends ${T1}s`);
