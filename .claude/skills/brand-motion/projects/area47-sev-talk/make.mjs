#!/usr/bin/env node
// AREA 47 · "SEV TALKS": the mascot's first speaking spot. 9:16 Reel/Story, ~15s.
// SEV is a 2D puppet cut from the master A-pose (rig.py): body, arms swinging at the shoulders, head nodding at the neck,
// 10 mouth shapes lip-synced to an offline TTS voice, blinks. Waist-up framing (no sneakers in shot).
//   python3 key.py … && python3 rig.py (once) → node make.mjs → story.json + cues.json + voices/*.wav → node sound.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { voiceLines } from '../../scripts/voice.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, U = 1080, FPS = 30;
const r4 = v => Math.round(v * 10000) / 10000;
const Y = px => r4(px / H);
const GLOW = { color: 'rgba(0,185,252,0.7)', blur: 0.035, y: 0 };
const SH = { color: 'rgba(0,0,0,0.75)', blur: 0.03, y: 0.006 };
const cut = at => ({ fx: 'cut', at: r4(at), dur: 0.001 });
const hud = (text, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'caption', face: 'hud', size: 0.024, color: 'primary', x, y }, extra);
const cues = []; const cue = (t, kind, extra = {}) => cues.push(Object.assign({ t: r4(t), kind }, extra));

// ---------- the script (copy stays inside the owner's services: cars, furniture, mobile) ----------
const VOICE = { voice: 'am_onyx', speed: 1.0, pitch: 0.6, fx: 'deadpan' };
const LINES = [
  { id: 'yo', text: "Yo. It's SEV.", cap: ["YO.", "IT'S", "SEV."], hi: [2], arm: 'wave', head: 'tilt' },
  { id: 'from', text: 'Straight outta Area 47.', cap: ['STRAIGHT', 'OUTTA', 'AREA', '47.'], hi: [2, 3], head: 'nod' },
  { id: 'dirty', text: 'Car dirty? Couch looking nasty?', cap: ['CAR', 'DIRTY?', 'COUCH', 'LOOKING', 'NASTY?'], hi: [1, 4], arm: 'shrug', head: 'side' },
  { id: 'say', text: 'Say less. We pull up to you.', cap: ['SAY', 'LESS.', 'WE', 'PULL', 'UP', 'TO', 'YOU.'], hi: [1, 6], arm: 'point', head: 'nod' },
  { id: 'clean', text: 'Too clean.', cap: ['TOO', 'CLEAN.'], hi: [1], head: 'proud', big: true },
];
const V = await voiceLines(LINES.map(l => Object.assign({ id: l.id, text: l.text }, VOICE)), path.join(here, 'voices'));
if (Object.values(V).some(v => !v)) throw new Error('voice engine missing: bash ../../scripts/setup-tts.sh');

// ---------- timeline ----------
let t = 1.45; const GAP = 0.32;
LINES.forEach(l => { l.at = r4(t); l.dur = V[l.id].dur; l.end = r4(t + l.dur); t = l.end + GAP; });
const END = LINES.at(-1).end, CARD = r4(END + 0.5), DUR = r4(CARD + 3.2);

// ---------- rig geometry ----------
const RIG = JSON.parse(fs.readFileSync(path.join(here, 'assets/rig/rig.json'), 'utf8'));
const B = RIG.boxes, P = RIG.pivots;
const SCALE = 1.25, k = SCALE / U;                                   // master px → U
const ORIGIN = [512, 1100];                                          // master point placed at the group origin
const top = 590;                                                     // frame px of master y=0
const GX = 0.5, GY = Y(top + ORIGIN[1] * SCALE);
const off = (x, y, o = ORIGIN) => [r4((x - o[0]) * k), r4((y - o[1]) * k)];
const img = (name, box, extra = {}) => Object.assign({ type: 'image', src: `assets/rig/${name}.png`, w: r4(box.w * k), wUnit: 'U', h: r4(box.h * k) }, extra);
const pivotImg = (name, box, piv, o, extra = {}) => { const [x, y] = off(piv[0], piv[1], o);
  return img(name, box, Object.assign({ anchor: [r4((piv[0] - box.x) / box.w), r4((piv[1] - box.y) / box.h)], x, y }, extra)); };

// ---------- mouths from the voice envelope ----------
// env 0..1 per frame → mouth shape, held ≥ 2 frames so it reads instead of flickering; some variety in the mid shapes.
const MID = ['ee', 'l', 'rest', 'fv', 'ee', 'oo'], OPEN = ['oh', 'ah', 'ee', 'ah'];
function mouthTrack() {
  const frames = Math.ceil(DUR * FPS), m = new Array(frames).fill('orig');
  LINES.forEach((l, li) => {
    const env = V[l.id].env, f0 = Math.round(l.at * FPS);
    let hold = 0, cur = 'closed';
    env.forEach((v, i) => {
      if (hold > 0) { hold--; m[f0 + i] = cur; return; }
      const h = (i * 7 + li * 3) % 6;
      cur = v < 0.07 ? 'closed' : v < 0.22 ? 'rest' : v < 0.48 ? MID[h] : v < 0.72 ? OPEN[h % 4] : 'ah';
      m[f0 + i] = cur; hold = 1;
    });
    const after = li === LINES.length - 1 ? 'smirk' : 'closed';
    for (let f = f0 + env.length; f < Math.round((l.end + GAP * 0.6) * FPS) && f < frames; f++) m[f] = after;
  });
  for (let f = Math.round((END + 0.15) * FPS); f < frames; f++) m[f] = 'smirk';
  const runs = []; m.forEach((s, f) => { if (runs.length && runs.at(-1).s === s) runs.at(-1).n++; else runs.push({ s, f, n: 1 }); });
  return runs;
}
const runs = mouthTrack();
const NECK = P.head, hb = B.head;
const headKids = runs.map(({ s, f, n }) => img(`head-${s}`, hb, { x: r4((hb.x + hb.w / 2 - NECK[0]) * k), y: r4((hb.y + hb.h / 2 - NECK[1]) * k),
  from: r4(f / FPS), out: cut((f + n) / FPS) }));
// blinks
const blinks = [0.9, 3.3, 5.6, 8.1, 10.4, 12.6, 14.9].filter(b => b < DUR - 0.3);
blinks.forEach(b => headKids.push(img('lids', hb, { x: r4((hb.x + hb.w / 2 - NECK[0]) * k), y: r4((hb.y + hb.h / 2 - NECK[1]) * k), from: b, out: cut(b + 0.1) })));

// ---------- acting: head + arms keyed to the lines ----------
const headMoves = [], armL = [], armR = [];
const key = (arr, at, dur, rot, ease = 'inOutCubic') => arr.push({ at: r4(at), dur: r4(dur), rot, ease });
LINES.forEach(l => {
  const a = l.at, d = l.dur;
  if (l.head === 'tilt') { key(headMoves, a - 0.1, 0.3, -6); key(headMoves, a + d - 0.2, 0.4, 0); }
  if (l.head === 'nod') for (let i = 0; i < 2; i++) { key(headMoves, a + i * d / 2, 0.14, 5, 'outQuad'); key(headMoves, a + i * d / 2 + 0.14, 0.3, 0, 'outBack'); }
  if (l.head === 'side') { key(headMoves, a, 0.3, 7); key(headMoves, a + d * 0.55, 0.3, -6); key(headMoves, a + d - 0.1, 0.35, 0); }
  if (l.head === 'proud') { key(headMoves, a - 0.1, 0.25, -4); key(headMoves, a + 0.35, 0.18, 4, 'outQuad'); key(headMoves, a + 0.53, 0.4, -3, 'outBack'); }
  if (l.arm === 'wave') {                                            // SEV's right arm (viewer's left) swings out and waggles
    key(armL, a - 0.15, 0.3, 24, 'outBack');
    for (let i = 0; i < 3; i++) { key(armL, a + 0.15 + i * 0.22, 0.11, 30); key(armL, a + 0.26 + i * 0.22, 0.11, 20); }
    key(armL, a + d + 0.05, 0.4, 0);
  }
  if (l.arm === 'shrug') { key(armL, a + d * 0.45, 0.25, 14, 'outBack'); key(armR, a + d * 0.45, 0.25, -14, 'outBack'); key(armL, a + d + 0.1, 0.4, 0); key(armR, a + d + 0.1, 0.4, 0); }
  if (l.arm === 'point') { key(armR, a + d * 0.45, 0.25, -26, 'outBack'); key(armR, a + d + 0.25, 0.45, 0); }
});
key(armL, END + 0.1, 0.3, 8, 'outBack'); key(armR, END + 0.1, 0.3, -8, 'outBack');   // "too clean" stance
const idle = { fx: 'sway', period: 2.4, amp: 0.25 };

// ---------- SEV puppet ----------
const sevGroup = {
  type: 'group', x: GX, y: GY, sfx: false,
  in: { fx: 'blur-in', at: 0.35, dur: 0.6 }, sx: 0.12, sy: 1.12,              // materialises in the beam (no full-body slide, so no sneakers)
  moves: [{ at: 0.35, dur: 0.6, sx: 1, sy: 1, ease: 'outBack' }, { at: 1.08, dur: 0.07, sy: 0.94, sx: 1.04, ease: 'outQuad' }, { at: 1.15, dur: 0.35, sy: 1, sx: 1, ease: 'outBack' },
    // tiny bounce on every line start + the "too clean" pop
    ...LINES.flatMap(l => [{ at: l.at, dur: 0.08, sy: 1.015, ease: 'outQuad' }, { at: r4(l.at + 0.08), dur: 0.3, sy: 1, ease: 'outBack' }])],
  children: [
    img('body', B.body, { x: off(B.body.x + B.body.w / 2, 0)[0], y: off(0, B.body.y + B.body.h / 2)[1] }),
    pivotImg('armL', B.armL, P.armL, ORIGIN, { moves: armL, loop: Object.assign({ phase: 0 }, idle) }),
    pivotImg('armR', B.armR, P.armR, ORIGIN, { moves: armR, loop: Object.assign({ phase: 1.6 }, idle) }),
    { type: 'group', x: off(NECK[0], NECK[1])[0], y: off(NECK[0], NECK[1])[1], moves: headMoves, loop: { fx: 'sway', period: 3.1, amp: 0.35 }, children: headKids },
  ],
};

// ---------- background: topo lines, grid dots, the UFO beam ----------
const els = [];
const { levels } = JSON.parse(fs.readFileSync(path.join(here, '../area47-topo-story/contours.json'), 'utf8'));
levels.forEach((lv, li) => lv.lines.forEach(pts => els.push({ type: 'path', points: pts, smooth: true, stroke: lv.major ? 'cyanDeep' : 'panel', strokeW: lv.major ? 0.0026 : 0.0016,
  opacity: lv.major ? 0.55 : 0.9, sfx: false, in: { fx: 'draw', at: r4(li * 0.012), dur: 0.9 }, moves: [{ at: 0, dur: DUR, scale: 1.08, rot: 2, ease: 'linear' }] })));
els.push({ type: 'poly', pts: [[-0.07, 0], [0.07, 0], [0.62, 1.55], [-0.62, 1.55]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(540), blend: 'screen', sfx: false,
  in: { fx: 'fade', at: 0.1, dur: 0.25 }, loop: { fx: 'pulse', period: 1.2, amp: 0.25 } });
els.push({ type: 'dots', count: 30, seed: 47, fill: ['cyanSoft', 'white'], r: 0.005, area: [0.2, Y(360), 0.8, Y(1500)], motion: 'drift', speed: 0.5, opacity: 0.6, sfx: false, in: { at: 0.2, dur: 0.5 } });
els.push({ type: 'image', src: '../area47-scan-report/assets/ufo.svg', w: 0.17, x: 0.5, y: Y(520), sfx: false, in: { fx: 'drop-soft', at: 0, dur: 0.45 }, out: { fx: 'slide-up', at: CARD - 0.1, dur: 0.4, ease: 'inExpo' }, loop: { fx: 'float', period: 2.4, amp: 0.4 } });
cue(0, 'beam');
els.push(sevGroup);
cue(0.35, 'zip'); cue(1.08, 'land');

// ---------- captions: word-by-word, timed across each line ----------
LINES.forEach((l, li) => {
  const words = l.cap, chars = words.map(w => w.length + 2), tot = chars.reduce((a, b) => a + b, 0);
  let acc = 0; const size = l.big ? 0.12 : 0.085;
  const rows = []; let row = [], wsum = 0;
  words.forEach((w, i) => { const ww = (w.length * 0.68 + 0.3) * size; if (wsum + ww > 0.9 && row.length) { rows.push(row); row = []; wsum = 0; } row.push(i); wsum += ww; });
  rows.push(row);
  rows.forEach((r, ri) => {
    const widths = r.map(i => (words[i].length * 0.68 + 0.3) * size), rowW = widths.reduce((a, b) => a + b, 0);
    let x = 0.5 - rowW / 2 * U / W;
    r.forEach((i, j) => {
      const at = l.at + l.dur * (chars.slice(0, i).reduce((a, b) => a + b, 0) / tot) * 0.92;
      const hi = l.hi.includes(i);
      els.push({ type: 'text', text: words[i], role: 'display', size, color: hi ? 'primary' : 'white', shadow: hi ? GLOW : SH,
        x: r4(x + widths[j] / 2 * U / W), y: r4(Y(l.big ? 380 : 330) + ri * size * 1.05 * U / H), sfx: false,
        in: { fx: 'pop-soft', at: r4(at), dur: 0.22 }, out: li === LINES.length - 1 ? null : cut(l.end + GAP * 0.8) });
      x += widths[j] * U / W;
    });
  });
});
els.push(hud('// INCOMING TRANSMISSION', 0.5, Y(262), { size: 0.022, in: { fx: 'type', at: 0.2, dur: 0.6 }, loop: { fx: 'pulse', period: 1.2, amp: 0.4 }, sfx: false, out: cut(CARD) }));
// "too clean" grill sparkle
[[0.535, 0.0], [0.47, 0.25]].forEach(([dx, o]) => els.push({ type: 'sparkle', r: 0.035, fill: 'white', x: r4(dx), y: Y(top + 360 * SCALE), sfx: false,
  in: { fx: 'pop', at: r4(END + 0.12 + o), dur: 0.3 }, out: { fx: 'scale', at: r4(END + 0.9 + o), dur: 0.25 }, loop: { fx: 'spin', period: 2 } }));
cue(END + 0.12, 'ping', { p: 1.5 }); cue(END + 0.37, 'ping', { p: 1.8 });

// ---------- end card (SEV stays on screen) ----------
els.push({ type: 'logo', w: 0.13, x: 0.5, y: Y(520), sfx: false, in: { fx: 'pop', at: r4(CARD + 0.15), dur: 0.4 }, loop: { fx: 'float', period: 2.4, amp: 0.4 } });
els.push({ type: 'group', x: 0.5, y: Y(1460), sfx: false, in: { fx: 'pop', at: r4(CARD + 0.2), dur: 0.4 }, loop: { fx: 'pulse', period: 1.2, amp: 0.35 }, children: [
  { type: 'pill', wUnit: 'U', w: 0.8, h: 0.105, fill: 'primary', shadow: GLOW },
  { type: 'text', text: 'DM TO BOOK · @a47.detailing', role: 'headline', size: 0.042, color: 'onPrimary', case: 'none' },
] });
els.push({ type: 'group', x: 0.5, y: Y(1572), sfx: false, in: { fx: 'rise', at: r4(CARD + 0.45), dur: 0.4 }, children: [
  { type: 'pill', wUnit: 'U', w: 0.74, h: 0.07, fill: 'bg', opacity: 0.85, stroke: 'cyanDeep', strokeW: 0.002 },
  { type: 'text', text: 'CARS · FURNITURE · MOBILE · +1 (868) 329-5373', role: 'caption', face: 'hud', size: 0.022, color: 'white' },
] });
cue(CARD, 'hit'); cue(CARD + 0.2, 'ping', { p: 1.2 });

const voices = LINES.map(l => ({ file: `voices/${V[l.id].file}`, at: l.at }));
const scene = { id: 'sev', dur: DUR, bg: 'bg', grade: { vignette: 0.4, grain: 0.03 }, elements: els };
fs.writeFileSync(path.join(here, 'story.json'), JSON.stringify({ title: 'AREA 47 · SEV talks', format: { w: W, h: H, fps: FPS }, bpm: 100, scenes: [scene], overlays: [] }));
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify({ duration: DUR, cues: cues.sort((a, b) => a.t - b.t), voices }, null, 1));
console.log(`story.json ${DUR}s · ${runs.length} mouth swaps · lines at ${LINES.map(l => l.at + '+' + l.dur).join(', ')}`);
