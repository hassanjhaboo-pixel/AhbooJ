#!/usr/bin/env node
// SM Threads "Now Boarding". 9:16, 150 BPM (1 beat = 0.4s), 48 beats = 19.2s.
// Gemini plates live in /sm-threads/assets (repo root). Garment cut-outs in ./assets were keyed out of those plates.
// Motion idea: her pieces turn up in unexpected places on a beach trip. Signature device: a magenta stitched
// thread zips across the frame on every cut (from the needle and thread in her logo).
//
//   node make.mjs  -> storyboard.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const PLATES = '../../../../../sm-threads/assets/';
const PW = 1438, PH = 2576;                 // plate pixel size
const K = 1080 / PW;                        // plate px -> frame px
const OY = (1920 - PH * K) / 2;             // plate is slightly taller than 9:16, centred
const r4 = v => Math.round(v * 10000) / 10000;
const fx = px => r4(px / PW);               // plate x -> frame fraction
const fy = py => r4((py * K + OY) / 1920);  // plate y -> frame fraction
const uw = px => r4(px * K / 1080);         // plate px length -> U (short side)
const BOX = JSON.parse(fs.readFileSync(path.join(here, 'assets/cut-boxes.json'), 'utf8'));
const SIZE = { 'sand-purple': [615, 732], 'sand-red': [608, 582], 'sand-orange': [557, 762], 'peg-top': [475, 1257], 'peg-bottom': [369, 755], 'peg-skirt': [381, 1184] };

const plate = (file, extra = {}) => ({ type: 'image', src: PLATES + file, x: 0.5, y: 0.5, w: 1, h: r4(PH * K / 1080), fit: 'cover', ...extra });

// a cut-out placed exactly where it sits in its plate
function cutAt(name, extra = {}) {
  const [x0, y0, x1, y1] = BOX[name];
  return { type: 'image', src: `assets/${name}.png`, x: fx((x0 + x1) / 2), y: fy((y0 + y1) / 2), w: r4((x1 - x0) / PW), ...extra };
}

// the stitched thread: draws across at the end of a scene, erases at the start of the next
const THREAD = [[-0.08, 0.22], [0.3, 0.42], [0.62, 0.5], [1.08, 0.78]];
const threadIn = (sceneDur) => ({ type: 'path', points: THREAD, smooth: true, stroke: 'primary', strokeW: 0.009, cap: 'round', dash: [0.022, 0.014], screen: true,
  head: { r: 0.014, fill: 'cream' }, in: { fx: 'draw', at: r4(sceneDur - 0.32), dur: 0.3, ease: 'inCubic' }, sfx: 'whoosh' });
const threadOut = () => ({ type: 'path', points: THREAD, smooth: true, stroke: 'primary', strokeW: 0.009, cap: 'round', dash: [0.022, 0.014], screen: true,
  out: { fx: 'draw', at: 0, dur: 0.3, ease: 'outCubic' }, sfx: false });

// copy on a solid magenta block (no glass, no gradient)
const chip = (text, y, at, extra = {}) => ({ type: 'text', text, role: 'display', color: 'onPrimary', size: 0.12, y, x: 0.5,
  highlight: { fill: 'primary', pad: 0.22, radius: 0.004 }, in: { fx: 'pop', at, dur: 0.3, ease: 'outBack' }, ...extra });

// ---------------- Scene 1: cabin, screens flick through her pieces ----------------
const SCREENS = { // plate px [x0,y0,x1,y1], inner display area, far to near
  oh3: [1118, 650, 1226, 710], oh2: [854, 590, 998, 674], r5: [902, 854, 1022, 922], r4: [758, 910, 918, 1002],
  r3L: [610, 1002, 770, 1126], oh1: [284, 496, 572, 680], midR: [848, 1198, 1172, 1394], midL: [228, 1162, 520, 1346], front: [464, 1598, 988, 1916],
};
const PIECES = ['sand-purple', 'sand-red', 'sand-orange', 'peg-top'];
function screenContent(key, i) {
  const [x0, y0, x1, y1] = SCREENS[key];
  const cx = fx((x0 + x1) / 2), cy = fy((y0 + y1) / 2), bw = x1 - x0, bh = y1 - y0;
  const on = r4(0.15 + i * 0.2);                         // flick on, far to near, every half beat
  const changes = [on, 2.0, 2.4];                        // channel changes on the beat
  const els = [];
  const fit = (name) => { const [w, h] = SIZE[name]; const s = Math.min(bw * 0.82 / w, bh * 0.82 / h); return r4(w * s / PW); };
  changes.forEach((t, c) => {
    const until = changes[c + 1];
    const last = c === changes.length - 1;
    if (key === 'front' && last) {                       // the front screen turns into the flight screen we push into
      els.push({ type: 'rect', x: cx, y: cy, w: r4(bw * 0.96 / PW), h: uw(bh * 0.94), fill: 'primary', in: { fx: 'cut', at: t }, sfx: 'tick' });
      els.push({ type: 'text', text: 'TOBAGO', role: 'display', color: 'onPrimary', size: 0.075, x: cx, y: cy, in: { fx: 'cut', at: t }, sfx: false });
      return;
    }
    const name = PIECES[(i + c) % PIECES.length];
    els.push({ type: 'image', src: `assets/${name}.png`, x: cx, y: cy, w: fit(name), in: { fx: 'cut', at: t }, ...(until ? { out: { fx: 'cut', at: until } } : {}), sfx: c === 0 ? 'tick' : false });
  });
  return els;
}
const [fX0, fY0, fX1, fY1] = SCREENS.front;
const s1 = {
  id: 'boarding', dur: '8b', bg: 'dark',
  camera: { at: [0.5, 0.5], keys: [{ at: 0, dur: 2.6, zoom: 1.04, ease: 'linear' }, { at: 2.6, dur: 0.6, zoom: r4(PW / (fX1 - fX0) * 0.98), x: fx((fX0 + fX1) / 2), y: fy((fY0 + fY1) / 2), ease: 'inExpo' }] },
  elements: [
    plate('S1-cabin-empty.jpg'),
    ...Object.keys(SCREENS).flatMap((k, i) => screenContent(k, i)),
    chip('NOW BOARDING', 0.1, -0.2, { screen: true, out: { fx: 'cut', at: 2.6 } }),
    threadIn(3.2),
  ],
};

// ---------------- Scene 2: destination board (match cut from the front screen) ----------------
const s2 = {
  id: 'destination', dur: '3b', bg: 'primary',
  elements: [
    threadOut(),
    { type: 'text', text: 'DESTINATION', role: 'body', color: 'onPrimary', size: 0.045, x: 0.5, y: 0.4 },
    { type: 'cycler', items: ['MIAMI', 'LONDON', 'PARIS', 'TOBAGO'], every: '0.5b', at: 0, fx: 'cut', holdLast: true, role: 'display', color: 'onPrimary', size: 0.22, x: 0.5, y: 0.5, sfx: 'tick' },
    { type: 'text', text: 'ON TIME', role: 'body', color: 'primary', size: 0.04, x: 0.5, y: 0.61, highlight: { fill: 'onPrimary', pad: 0.35, radius: 0.004 }, in: { fx: 'pop', at: 0.85, dur: 0.25 } },
    threadIn(1.2),
  ],
};

// ---------------- Scene 3: peg rail, pieces swing onto the pegs on the beat ----------------
const hang = (name, at) => { const [x0, y0, x1] = BOX[name]; return { type: 'image', src: `assets/${name}.png`, anchor: 'top', x: fx((x0 + x1) / 2), y: fy(y0), w: r4((x1 - x0) / PW),
  in: { fx: 'swing', at, dur: 0.7 }, out: { fx: 'cut', at: 2.6 }, shadow: { color: 'rgba(90,60,30,0.28)', blur: 0.012, y: 0.012 }, sfx: 'plop' }; };
const s3 = {
  id: 'pegs', dur: '8b', bg: 'cream',
  elements: [
    plate('S3-pegs-empty.jpg'),
    hang('peg-top', 0.4), hang('peg-bottom', 1.2), hang('peg-skirt', 1.6),
    plate('S3-pegs-full.jpg', { in: { fx: 'cut', at: 2.6 }, sfx: false }),   // real contact shadows once everything has landed
    threadOut(),
    { type: 'text', text: 'SEWN IN TRINIDAD', role: 'display', color: 'primary', size: 0.13, x: 0.5, y: 0.905, maxWidth: 0.92, split: 'word', stagger: 0.4, in: { fx: 'pop', at: 0.4, dur: 0.3, ease: 'outBack' } },
    threadIn(3.2),
  ],
};

// ---------------- Scene 4: sand, tops drop in, names get written in the sand ----------------
const NAMES = { 'sand-purple': 'purple twist', 'sand-red': 'red viper', 'sand-orange': 'orange crush' }; // PLACEHOLDER names until she sends hers
const drop = (name, at) => cutAt(name, { in: { fx: 'drop-near', at, dur: 0.45 }, out: { fx: 'cut', at: 1.6 }, sfx: 'plop' });
const sandWrite = (name, i) => {
  const [x0, y0, x1, y1] = BOX[name]; const y = fy((y0 + y1) / 2); const at = r4(1.6 + i * 0.4);
  return [
    { type: 'text', text: NAMES[name], role: 'headline', case: 'lower', color: 'sandInk', size: 0.068, x: 0.6, anchor: 'left', align: 'left', y, opacity: 0.8, blend: 'multiply',
      shadow: { color: 'rgba(255,255,255,0.55)', blur: 0.002, y: 0.003 }, in: { fx: 'wipe', at, dur: 0.4 }, sfx: false },
    { type: 'path', points: [[0.585, y], [fx(x1) + 0.015, y]], stroke: 'sandInk', strokeW: 0.005, cap: 'round', opacity: 0.7, blend: 'multiply',
      head: { r: 0.009, fill: 'sandInk' }, in: { fx: 'draw', at: r4(at + 0.2), dur: 0.25 }, sfx: false },
  ];
};
const s4 = {
  id: 'sand', dur: '8b', bg: 'cream', camera: { zoom: [1, 1.04], ease: 'linear' },
  elements: [
    plate('S4-sand-empty.jpg'),
    drop('sand-purple', 0.2), drop('sand-red', 0.6), drop('sand-orange', 1.0),
    plate('S4-sand-tops.jpg', { in: { fx: 'cut', at: 1.6 }, sfx: false }),
    ...sandWrite('sand-purple', 0), ...sandWrite('sand-red', 1), ...sandWrite('sand-orange', 2),
    threadOut(),
    threadIn(3.2),
  ],
};

// ---------------- Scene 5: tagline card ----------------
const s5 = {
  id: 'standard', dur: '6b', bg: 'dark', camera: { zoom: [1.02, 1.08], ease: 'linear' },
  elements: [
    plate('S5-card.jpg'),
    threadOut(),
    chip('SEXY IS', 0.085, 0.2, { screen: true, size: 0.13 }),
    chip('THE STANDARD.', 0.165, 0.6, { screen: true, size: 0.13 }),
    threadIn(2.4),
  ],
};

// ---------------- Scene 6: tan line reveal (PLACEHOLDERS until S6 images arrive) ----------------
const s6 = {
  id: 'tanline', dur: '6b', bg: 'dark', camera: { zoom: [1, 1.06], ease: 'linear' },
  elements: [
    { type: 'image', src: '', label: 'S6-tan-reveal (strawberry tan mark)', placeholder: 'accent', x: 0.5, y: 0.5, w: 1, h: 1.7778 },
    { type: 'image', src: '', label: 'S6-tan-strap (strap covering it)', placeholder: 'primaryDeep', x: 0.5, y: 0.5, w: 1, h: 1.7778, out: { fx: 'slide-right', at: 0.8, dur: 0.45, ease: 'inOutCubic' }, sfx: 'whoosh' },
    threadOut(),
    chip('LEAVE WITH PROOF.', 0.86, 1.4, { screen: true, size: 0.11 }),
    threadIn(2.4),
  ],
};

// ---------------- Scene 7: hang tag end card ----------------
const tag = {
  type: 'group', x: 0.5, y: 0.12, in: { fx: 'swing', at: 0, dur: 0.9 }, loop: { fx: 'sway', period: '4b', amp: 0.35 }, sfx: 'whoosh',
  children: [
    { type: 'rect', w: 0.05, wUnit: 'U', h: 0.4, anchor: 'bottom', x: 0, y: -0.01, fill: 'primary' },
    { type: 'poly', pts: [[-0.2, -0.07], [0.2, -0.07], [0.31, 0.05], [0.31, 1.06], [-0.31, 1.06], [-0.31, 0.05]], radius: 0.03, fill: 'cream',
      shadow: { color: 'rgba(42,10,28,0.22)', blur: 0.03, y: 0.02 } },
    { type: 'circle', r: 0.03, fill: 'bg', x: 0, y: 0 },
    { type: 'ring', r: 0.03, fill: 'primaryDeep', strokeW: 0.008, x: 0, y: 0 },
    { type: 'image', src: '../../brand/assets/smthreads/logo.png', w: 0.48, x: 0, y: 0.27 },
    { type: 'rect', w: 0.44, wUnit: 'U', h: 0.004, fill: 'primary', x: 0, y: 0.5, opacity: 0.6 },
    { type: 'text', text: 'MADE IN TRINIDAD.', role: 'headline', color: 'ink', size: 0.075, x: 0, y: 0.6 },
    { type: 'text', text: 'MADE TO YOU.', role: 'headline', color: 'primary', size: 0.075, x: 0, y: 0.7 },
    { type: 'text', text: 'XS TO XXL. CUSTOM FIT.', role: 'body', color: 'ink', size: 0.03, x: 0, y: 0.84 },
    { type: 'text', text: '7 TO 14 DAYS', role: 'body', color: 'ink', size: 0.03, x: 0, y: 0.9, opacity: 0.75 },
  ],
};
const s7 = {
  id: 'endcard', dur: '9b', bg: 'bg',
  elements: [
    threadOut(),
    tag,
    chip('DM @SM.THREADS_', 0.9, 1.2, { size: 0.085, loop: { fx: 'pulse', period: '2b', amp: 0.4 } }),
  ],
};

const story = { title: 'SM Threads: Now Boarding', format: { w: 1080, h: 1920, fps: 30 }, bpm: 150, scenes: [s1, s2, s3, s4, s5, s6, s7] };
fs.writeFileSync(path.join(here, 'storyboard.json'), JSON.stringify(story, null, 1));
console.log('wrote storyboard.json');
