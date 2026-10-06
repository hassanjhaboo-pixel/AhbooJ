import fs from 'node:fs';
import { duo } from '../rig.mjs';
const T = (o) => duo(Object.assign({ parts: '../parts', s: 1.05 }, o));
const els = [
  T({ x: 0.27, y: 0.45 }),
  T({ x: 0.75, y: 0.45, cherry: { face: 'closed', armL: 150, armR: -150 }, bomb: { face: 'sly', armR: -100, hand: ['fist', 'point'], look: -0.6 } }),
  T({ x: 0.27, y: 0.95, cherry: { face: 'shy', armL: -40, armR: 40, look: 0.5 }, bomb: { face: 'grin', armR: -150, wave: true, acc: ['sunglasses'] } }),
  T({ x: 0.75, y: 0.95, cherry: { face: 'shock', armL: 120, armR: -120, acc: ['headphones'] }, bomb: { face: 'shock', armL: 130, armR: -130, acc: ['cap'] } }),
];
fs.writeFileSync(new URL('./sheet.json', import.meta.url), JSON.stringify({ title: 'cb', format: { w: 1080, h: 1080, fps: 30 }, bpm: 120, scenes: [{ id: 's', dur: 2, bg: 'chapter1', elements: els }] }));
