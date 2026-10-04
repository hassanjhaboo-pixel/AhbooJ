#!/usr/bin/env node
// Jadesserts "We Want More" — ~48s mockumentary teaser (9:16). Customers in their homes rave about each item of
// Jade's first Sweet Box → hope turns to demand → "WE WANT MORE" riot trashes the living room → a pillow knocks the
// doc camera to the floor, the lens cracks → Jade leans in: "Soon." → signal dies → logo.
//   node make.mjs  → voices/ (cached), storyboard-9x16.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as F from '../../kits/minifig.mjs';
import * as T from '../../kits/toytown.mjs';
import { voiceLines } from '../../scripts/voice.mjs';
import { LINES } from './lines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const LOGO = '../../brand/assets/jadesserts/logo.png';
const PHOTO = n => `../jadesserts-sweet-box/assets/products/${n}.png`;
const r4 = v => Math.round(v * 10000) / 10000;
const V = await voiceLines(LINES, path.join(here, 'voices'), { quiet: true });
const vdur = id => (V[id] ? V[id].dur : 1.5);
const partsOf = id => { const l = LINES.find(x => x.id === id); return l.parts ? l.parts.map(p => p.text) : [l.text]; };
function partTimes(id) { // the (n-1) longest pauses split a line into its parts
  const n = partsOf(id).length, v = V[id];
  if (!v) return Array.from({ length: n }, (_, i) => [i * 1.2, (i + 1) * 1.2 - 0.1]);
  const env = v.env, fps = v.fps, quiet = env.map(e => e < 0.06);
  const a = quiet.findIndex(q => !q), b = env.length - 1 - [...quiet].reverse().findIndex(q => !q), gaps = [];
  for (let i = a; i <= b; i++) if (quiet[i]) { let j = i; while (j <= b && quiet[j]) j++; gaps.push([i, j]); i = j; }
  const cuts = gaps.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, n - 1).sort((x, y) => x[0] - y[0]);
  const out = []; let s = a;
  cuts.forEach(([g0, g1]) => { out.push([s / fps, g0 / fps]); s = g1; });
  out.push([s / fps, (b + 1) / fps]);
  while (out.length < n) out.push([out[out.length - 1][1], out[out.length - 1][1] + 0.4]);
  return out;
}
const talk = (id, at) => (V[id] ? { env: V[id].env, fps: V[id].fps, at: r4(at) } : null);
const voiceEl = (id, at, extra = {}) => Object.assign({ type: 'rect', w: 0.001, h: 0.001, opacity: 0, voice: `voices/${id}.wav`, in: { fx: 'cut', at: r4(at), dur: 0.01 }, sfx: V[id] ? false : 'babble', sfxDur: vdur(id) }, extra);
const sfxAt = (kind, at, extra = {}) => Object.assign({ type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: r4(at), dur: 0.01 }, sfx: kind }, extra);
const P = { plastic: 0.6, edge: true };
const part = o => Object.assign({}, P, o);

// ---------------- the six Sweet Box items as toy props (U at figure scale 1, origin = in the hand) ----------------
const ITEMS = {
  bread: () => ({ type: 'group', children: [
    part({ type: 'rect', wUnit: 'U', w: 0.075, h: 0.036, fill: 'wood', radius: 0.012 }),
    part({ type: 'rect', wUnit: 'U', w: 0.072, h: 0.014, fill: 'ink', radius: 0.007, y: -0.014, edge: false }),
    ...[-0.022, 0, 0.022].map(x => part({ type: 'circle', r: 0.007, fill: 'toyYellow', x, y: -0.02, edge: false })),
    { type: 'path', points: [[-0.03, -0.006], [-0.015, 0.002], [0, -0.006], [0.015, 0.002], [0.03, -0.006]], stroke: 'ink', strokeW: 0.0035 } ] }),
  punch: () => ({ type: 'group', children: [
    part({ type: 'rect', wUnit: 'U', w: 0.004, h: 0.05, fill: 'white', x: 0.012, y: -0.045, rot: 12, edge: false }),
    part({ type: 'poly', pts: [[-0.022, -0.05], [0.022, -0.05], [0.016, 0.02], [-0.016, 0.02]], radius: 0.004, fill: 'glass', plastic: 0.9 }),
    { type: 'poly', pts: [[-0.02, -0.032], [0.02, -0.032], [0.016, 0.018], [-0.016, 0.018]], radius: 0.003, fill: 'primary', opacity: 0.85 },
    part({ type: 'circle', r: 0.012, fill: 'mint', x: -0.02, y: -0.05 }), { type: 'circle', r: 0.007, fill: 'chapter3', x: -0.02, y: -0.05 } ] }),
  tart: () => ({ type: 'group', children: [
    part({ type: 'scallop', r: 0.032, bumps: 12, depth: 0.12, fill: 'cardboard' }),
    part({ type: 'circle', r: 0.022, fill: 'primaryDeep', plastic: 0.9 }),
    part({ type: 'circle', r: 0.008, fill: 'primary', x: 0.004, y: -0.004 }),
    { type: 'path', points: [[0.004, -0.01], [0.012, -0.03]], stroke: 'chapter3', strokeW: 0.003 } ] }),
  cheese: () => ({ type: 'group', children: [
    part({ type: 'poly', pts: [[-0.035, 0.012], [0.035, 0.012], [0.03, -0.02], [-0.03, -0.02]], radius: 0.014, fill: 'cardboard' }),
    part({ type: 'poly', pts: [[-0.03, -0.004], [0.03, -0.004], [0.022, 0.016], [0.01, 0.006], [0, 0.02], [-0.012, 0.006], [-0.024, 0.016]], radius: 0.004, fill: 'accent', edge: false }),
    ...[-0.015, 0.005, 0.02].map(x => ({ type: 'path', points: [[x, -0.016], [x + 0.006, -0.008]], stroke: 'wood', strokeW: 0.002 })) ] }),
  chicken: () => ({ type: 'group', children: [
    part({ type: 'poly', pts: [[-0.04, 0.016], [0.04, 0.016], [0, -0.034]], radius: 0.01, fill: 'cardboard' }),
    ...[0, 1, 2].map(i => ({ type: 'path', points: [[-0.022 + i * 0.006, 0.006 - i * 0.012], [0.022 - i * 0.006, 0.006 - i * 0.012]], stroke: 'wood', strokeW: 0.0025, smooth: false })) ] }),
  cupcake: () => ({ type: 'group', children: [
    part({ type: 'poly', pts: [[-0.026, -0.008], [0.026, -0.008], [0.019, 0.026], [-0.019, 0.026]], radius: 0.003, fill: 'blush' }),
    ...[-0.012, 0, 0.012].map(x => ({ type: 'path', points: [[x * 1.2, -0.006], [x, 0.024]], stroke: 'blushDeep', strokeW: 0.002, smooth: false })),
    part({ type: 'scallop', r: 0.03, bumps: 9, depth: 0.16, fill: 'bg', y: -0.022 }),
    part({ type: 'circle', r: 0.008, fill: 'primary', y: -0.052 }) ] }),
};
const CARDS = { bread: ['Chocolate banana bread', 'banana-bread'], punch: ['Fruit punch limeade', 'fruit-punch'], tart: ['Cherry jam tart', null],
  cheese: ['Cheese paste puff', null], chicken: ['Chicken puff pastry', 'chicken-puff'], cupcake: ['Vanilla cupcake', 'vanilla-cupcake'] };

// ---------------- the cast (each lives in their own home) ----------------
const CAST = {
  denise: { name: 'Denise', tag: 'Sweet Box customer #1', look: { torso: 'lavender', print: 'stripe', printColor: 'bg', legs: 'ink', hair: 'bob', hairColor: 'wood', glasses: true }, home: { wall: 'chapter1', sofa: 'secondary', pic: 'primary' } },
  marcus: { name: 'Marcus', tag: 'Sweet Box customer #2', look: { torso: 'secondary', print: 'hoodie', printColor: 'white', legs: 'dark', hair: 'cap', hairColor: 'primaryDeep' }, home: { wall: 'chapter3', sofa: 'wood', pic: 'accent' } },
  pearl: { name: 'Miss Pearl', tag: 'Sweet Box customer #3', look: { torso: 'mint', print: 'stripe', printColor: 'white', legs: 'lavender', hair: 'bun', hairColor: 'bone', glasses: true }, home: { wall: 'chapter4', sofa: 'blushDeep', pic: 'lavender' } },
  tyler: { name: 'Tyler', tag: 'Customer #4 (age 9)', look: { torso: 'accent', print: 'number', printText: '9', printColor: 'white', legs: 'secondary', hair: 'spiky', hairColor: 'ink' }, home: { wall: 'chapter2', sofa: 'mint', pic: 'toyYellow' }, scale: 0.86 },
  dev: { name: 'Dev', tag: 'Sweet Box customer #5', look: { torso: 'primary', print: 'jacket', printColor: 'white', legs: 'ink', hair: 'curly', hairColor: 'ink' }, home: { wall: 'blush', sofa: 'lavender', pic: 'mint' } },
};
const JADE = { torso: 'primary', print: 'apron', printColor: 'white', legs: 'ink', hair: 'ponytail', hairColor: 'ink', face: 'sly' };

function make() {
  const W = 1080, H = 1920, U = 1080, tall = true;
  const X = px => r4(px / W), Y = py => r4(py / H);
  F.seed(17); T.seed(23);
  const scenes = [];
  const CAP_Y = 0.865, LT_Y = 0.735;

  // ---------- HUD ----------
  const rec = (o = {}) => Object.assign({ type: 'group', screen: true, x: 0.065, y: 0.05, children: [
    { type: 'circle', r: 0.011, fill: 'primaryDeep', x: 0.008, loop: { fx: 'blink', period: 0.9 } },
    { type: 'text', text: 'REC', role: 'caption', size: 0.026, weight: 800, tracking: 0.12, color: 'white', anchor: 'left', align: 'left', x: 0.035, highlight: { fill: 'rgba(40,20,30,0.5)', pad: 0.4 } },
  ] }, o);
  const battery = (low = false) => ({ type: 'group', screen: true, x: 0.9, y: 0.05, children: [
    { type: 'rect', wUnit: 'U', w: 0.07, h: 0.032, fill: 'rgba(40,20,30,0.5)', radius: 0.006, stroke: 'white', strokeW: 0.003 },
    { type: 'rect', wUnit: 'U', w: low ? 0.012 : 0.05, h: 0.02, fill: low ? 'primaryDeep' : 'white', anchor: 'left', x: -0.029, radius: 0.003, loop: low ? { fx: 'blink', period: 0.5 } : undefined },
  ] });
  const lowerThird = (name, tag) => ({ type: 'group', screen: true, x: 0.06, y: LT_Y, in: { fx: 'slide-right', at: 0.08, dur: 0.4 }, children: [
    { type: 'text', text: name, role: 'headline', size: 0.066, bubble: 0.02, color: 'onPrimary', anchor: 'left', align: 'left', highlight: { fill: 'primaryDeep', pad: 0.28 } },
    { type: 'text', text: tag, role: 'body', size: 0.031, color: 'ink', anchor: 'left', align: 'left', x: 0.012, y: 0.078, highlight: { fill: 'bg', pad: 0.35 } } ] });
  const caption = (text, a, b, typeDur) => ({ type: 'text', screen: true, text, role: 'body', size: 0.05, weight: 800, color: 'ink', x: 0.5, y: CAP_Y, maxWidth: 0.9, highlight: { fill: 'bg', pad: 0.35 }, sfx: false,
    in: { fx: 'type', at: r4(a), dur: r4(typeDur) }, out: b != null ? { fx: 'cut', at: r4(b), dur: 0.01 } : undefined });
  // polaroid of the item being praised (real photo where we have one, the toy prop otherwise)
  const polaroid = (key, at) => { const [label, photo] = CARDS[key];
    return { type: 'group', screen: true, x: 0.77, y: 0.5, rot: 7, in: { fx: 'pop', at: r4(at), dur: 0.4 }, sfx: false, loop: { fx: 'float', period: 2.4, amp: 0.4 }, children: [
      { type: 'rect', wUnit: 'U', w: 0.34, h: 0.4, fill: 'white', radius: 0.01, shadow: { color: 'rgba(74,44,51,0.3)', blur: 0.02, y: 0.012 } },
      { type: 'rect', wUnit: 'U', w: 0.3, h: 0.27, fill: 'chapter1', y: -0.045 },
      photo ? { type: 'image', src: PHOTO(photo), w: 0.26, wUnit: 'U', h: 0.23, fit: 'cover', y: -0.045 } : Object.assign(ITEMS[key](), { y: -0.045, scale: 3.6 }),
      { type: 'text', text: label, role: 'body', size: 0.026, weight: 800, color: 'ink', y: 0.155, maxWidth: 0.3 } ] }; };

  // ---------- a home: blurred living room behind a chest-up talking head ----------
  const home = (h, extraBg = []) => [
    { type: 'group', x: 0, y: 0, blur: 0.0035, children: [
      { type: 'bricks', w: 1.4, wUnit: 'U', h: 2.0, fill: h.wall, anchor: 'top', x: 0.5, y: -0.05, bw: 0.15, bh: 0.075, studs: false, plastic: 0.45 },
      Object.assign(T.windowPane({ w: 0.36, h: 0.42, frame: 'white' }), { x: 0.8, y: 0.3 }),
      ...[0.6, 1.0].map(x => part({ type: 'rect', wUnit: 'U', w: 0.08, h: 0.5, fill: 'blush', x, y: 0.31, radius: 0.03 })),
      { type: 'group', x: 0.22, y: 0.24, rot: -3, children: [part({ type: 'rect', wUnit: 'U', w: 0.24, h: 0.2, fill: 'wood', radius: 0.01 }), { type: 'rect', wUnit: 'U', w: 0.2, h: 0.16, fill: 'bg' }, part({ type: 'heart', r: 0.05, fill: h.pic })] },
      T.lamp({ x: 0.07, y: 0.88, s: 2.4 }),
      ...extraBg,
      part({ type: 'rect', wUnit: 'U', w: 1.3, h: 0.36, fill: h.sofa, x: 0.5, y: 0.82, radius: 0.08 }),
      part({ type: 'rect', wUnit: 'U', w: 1.3, h: 0.22, fill: h.sofa, x: 0.5, y: 0.66, radius: 0.06 }),
    ] },
    { type: 'circle', r: 0.55, fill: 'white', opacity: 0.16, x: 0.45, y: 0.42 },
  ];
  const s0 = 5.4, headY = 0.43, feetY = s => r4(headY + (0.193 * s * U) / H);

  // ---------- talking head (one or more shots; the voice runs across cuts) ----------
  function talkingHead(id, who, line, shots, o = {}) {
    const C = CAST[who], pt = partTimes(line), texts = partsOf(line), vd = vdur(line), lead = o.lead ?? 0.12, tail = o.tail ?? 0.16;
    shots.forEach((shot, k) => {
      const t0 = k === 0 ? -lead : pt[shot.from][0] - 0.05, t1 = k < shots.length - 1 ? pt[shots[k + 1].from][0] - 0.05 : vd + (shot.tail ?? tail);
      const dur = r4(t1 - t0), vAt = -t0, s = s0 * (C.scale || 1) * (shot.scale || 1);
      const els = [...home(C.home)];
      els.push(F.minifig(Object.assign({ legs: 'ink' }, C.look, { x: shot.x ?? 0.45, y: r4(feetY(s0 * (shot.scale || 1)) + (shot.dy || 0)), s, talk: talk(line, vAt), seed: k + 3, step: 12 }, shot.fig || {})));
      els.push(...(shot.extra || []));
      if (k === 0) els.push(voiceEl(line, vAt, { sfx: V[line] ? false : 'babble' }));
      els.push(rec(), battery());
      if (o.lowerThird && k === 0) els.push(lowerThird(C.name, C.tag));
      if (o.item && k === 0) els.push(polaroid(o.item, Math.max(0.15, vAt + pt[0][1] * 0.6)));
      pt.forEach(([a, b], i) => {
        if (b <= t0 + 0.05 || a >= t1) return;
        const nxt = pt[i + 1] ? pt[i + 1][0] - t0 : null;
        els.push(caption(texts[i], Math.max(0, a - t0), nxt != null && nxt < dur ? nxt : null, a >= t0 ? Math.min(0.4, texts[i].length * 0.022) : 0.001));
      });
      scenes.push({ id: `${id}${shots.length > 1 ? String.fromCharCode(97 + k) : ''}`, dur, bg: 'bg', transition: shot.transition || o.transition || 'cut',
        camera: shot.camera || { zoom: [1, 1.035], ease: 'linear', handheld: 0.7 }, bgTo: shot.bgTo, grade: shot.grade || o.grade || { vignette: 0.28, grain: 0.035, tint: 'rgba(255,200,150,0.25)' }, elements: els });
    });
  }
  const punch = (zoom = 1.45, y = 0.43) => ({ at: [0.45, y], keys: [{ at: 0, dur: 0.14, zoom, ease: 'outExpo' }], zoom: [1, 1], handheld: 0.5 });
  const hold = (item) => ({ arms: [-26, 26], armSy: 0.78, extra: [Object.assign(ITEMS[item](), { y: -0.118, scale: 0.85, loop: { fx: 'float', period: 1.6, amp: 0.4 } })] });

  // ================= COLD OPEN =================
  scenes.push({ id: 'open', dur: 2.3, bg: 'bg', camera: { zoom: [1.08, 1.0], ease: 'outCubic', handheld: 0.6 }, grade: { vignette: 0.3, grain: 0.04, tint: 'rgba(255,200,150,0.25)' },
    elements: [...home(CAST.denise.home),
      F.minifig(Object.assign({}, CAST.denise.look, { x: 0.45, y: 0.9, s: 2.6, legPose: 'sit', face: 'dreamy', arms: [-26, 26], armSy: 0.8, extra: [Object.assign(F.sweetBox({ s: 1, logo: '../../brand/assets/jadesserts/logo-cherry.png' }), { y: -0.085 })] })),
      ...[0, 1, 2, 3].map(i => ({ type: 'circle', r: 0.006, fill: 'wood', x: r4(0.38 + i * 0.05), y: r4(0.905 + (i % 2) * 0.006) })),
      rec(), battery(),
      { type: 'text', screen: true, text: 'Three days after\nJadesserts’ first Sweet Box sale.', role: 'headline', size: 0.052, bubble: 0.012, color: 'ink', x: 0.5, y: 0.2, maxWidth: 0.86, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'type', at: 0.1, dur: 0.8 }, sfx: 'tick' },
    ] });

  // ================= ACT 1 — the box, item by item =================
  talkingHead('denise1', 'denise', 'denise1', [
    { from: 0, fig: Object.assign({ face: 'dreamy' }, hold('bread')) },
    { from: 2, fig: Object.assign({ face: 'worried', eyes: 'closed' }, hold('bread')), camera: punch(1.3) },
  ], { lowerThird: true, item: 'bread' });
  talkingHead('marcus1', 'marcus', 'marcus1', [{ from: 0, x: 0.5, fig: Object.assign({ face: 'happy' }, hold('punch')) }], { lowerThird: true, item: 'punch' });
  talkingHead('pearl1', 'pearl', 'pearl1', [{ from: 0, x: 0.42, fig: Object.assign({ face: 'dreamy' }, hold('tart')) }], { lowerThird: true, item: 'tart', transition: { type: 'push', dir: 'left', dur: 0.25 } });
  talkingHead('tyler1', 'tyler', 'tyler1', [
    { from: 0, fig: Object.assign({ face: 'grin' }, hold('cheese')) },
    { from: 1, fig: { face: 'happy', arms: 'cheer', hand: Object.assign(ITEMS.cheese(), { y: 0.02 }), moves: F.hops(feetY(s0), 1.6, { H, every: 0.3, height: 0.03 }) }, camera: { zoom: [1.1, 1.14], handheld: 1.2 } },
  ], { lowerThird: true, item: 'cheese', transition: { type: 'push', dir: 'left', dur: 0.25 } });
  talkingHead('dev1', 'dev', 'dev1', [{ from: 0, x: 0.47, fig: Object.assign({ face: 'smile', headTilt: -5 }, hold('chicken')) }, { from: 1, fig: Object.assign({ face: 'dreamy' }, hold('chicken')), camera: punch(1.25) }], { lowerThird: true, item: 'chicken', transition: { type: 'push', dir: 'left', dur: 0.25 } });
  talkingHead('denise2', 'denise', 'denise2', [{ from: 0, x: 0.43, fig: Object.assign({ face: 'sly', look: 0.7 }, hold('cupcake')) }, { from: 1, fig: Object.assign({ face: 'sly', eyes: 'half', look: -0.6 }, hold('cupcake')), camera: punch(1.3) }], { item: 'cupcake' });

  // ================= ACT 2 — hoping → demanding =================
  const tense = { vignette: 0.38, grain: 0.05 };
  talkingHead('marcus2', 'marcus', 'marcus2', [{ from: 0, x: 0.5, fig: { face: 'worried', arms: [-20, 20], armSy: 0.85, look: 0.2 } }], { grade: tense, transition: { type: 'flash', color: 'white', dur: 0.2 } });
  talkingHead('pearl2', 'pearl', 'pearl2', [{ from: 0, x: 0.42, fig: { face: 'deadpan', eyes: 'half', arms: [9, -60], hand: F.phone(), headTilt: 8 } }], { grade: tense });
  talkingHead('tyler2', 'tyler', 'tyler2', [{ from: 0, fig: { face: 'shock', arms: 'cheer', moves: F.hops(feetY(s0), 1.6, { H, every: 0.25, height: 0.02 }) }, camera: { zoom: [1.05, 1.12], handheld: 1.3 } }], { grade: tense });
  talkingHead('dev2', 'dev', 'dev2', [
    { from: 0, x: 0.47, fig: { face: 'deadpan', arms: [-20, 20], armSy: 0.85 } },
    { from: 1, fig: { face: 'furious', arms: 'fist', vein: true, sweat: true }, camera: { at: [0.47, 0.43], keys: [{ at: 0, dur: 0.12, zoom: 1.6, ease: 'outExpo' }], zoom: [1, 1], shake: 0.8 },
      extra: [sfxAt('impact', 0.02)], bgTo: [{ at: 0, dur: 0.1, bg: 'primary' }] },
  ], { grade: tense });
  talkingHead('denise3', 'denise', 'denise3', [{ from: 0, x: 0.45, fig: { face: 'furious', arms: 'fist', vein: true, glasses: false, headTilt: 6 }, camera: { at: [0.45, 0.43], keys: [{ at: 0, dur: 0.14, zoom: 1.35 }], zoom: [1, 1], shake: 0.7 } }], { grade: { vignette: 0.45, grain: 0.06, tint: 'rgba(240,80,90,0.25)' }, lead: 0.15 });

  // ================= ACT 3 — the rally =================
  talkingHead('marcus3', 'marcus', 'marcus3', [
    { from: 0, x: 0.5, fig: { face: 'deadpan', arms: [9, -9] } },
    { from: 1, x: 0.5, dy: -0.05, fig: { face: 'furious', arms: [9, -165], vein: true, armLoops: [null, { fx: 'flap', period: 0.3, amp: 0.6 }] }, camera: { at: [0.5, 0.4], keys: [{ at: 0, dur: 0.12, zoom: 1.4 }], zoom: [1, 1], shake: 1.0 }, extra: [sfxAt('scratch', 0)] },
  ], { grade: { vignette: 0.45, grain: 0.06, tint: 'rgba(240,80,90,0.3)' }, tail: 0.15 });

  // ---- the riot: Denise's living room, wide. Chant on every beat-pair, crowd pumps fists on the chant ----
  const chantEvery = 0.95, riotA = 3.4, riotB = 2.5;
  const room = (fy = 0.5) => { // wide living room (frame coords), riot-ready props built per scene
    return [
      { type: 'group', x: 0, y: 0, blur: 0.0018, children: [
        { type: 'bricks', w: 1.6, wUnit: 'U', h: 1.5, fill: 'chapter1', anchor: 'top', x: 0.5, y: -0.05, bw: 0.1, bh: 0.05, studs: false, plastic: 0.45 },
        Object.assign(T.windowPane({ w: 0.26, h: 0.3, frame: 'white' }), { x: 0.78, y: 0.3 }),
        T.lamp({ x: 0.93, y: 0.66, s: 1.8 }) ] },
      { type: 'baseplate', w: 1.4, wUnit: 'U', h: 0.7, fill: 'wood', x: 0.5, y: 0.64, anchor: 'top', pitch: 0.05 },
    ];
  };
  const chantTimes = d => { const t = []; for (let x = 0.05; x < d - 0.3; x += chantEvery) t.push(r4(x)); return t; };
  const crowd = (d, startPump = 0) => {
    const out = [], ct = chantTimes(d);
    const people = [
      [null, 0.08, 0.74, 1.3], [null, 0.33, 0.73, 1.25], [null, 0.6, 0.72, 1.25], [null, 0.9, 0.74, 1.3], ['tyler', 0.5, 0.76, 1.5],
      ['marcus', 0.14, 0.97, 2.15], ['denise', 0.4, 1.0, 2.2], ['dev', 0.66, 0.98, 2.15], ['pearl', 0.9, 1.0, 2.05],
    ];
    people.forEach(([who, x, y, s], i) => {
      const look = who ? CAST[who].look : { torso: F.pick(['accent', 'mint', 'blushDeep', 'secondary']), legs: F.pick(['ink', 'dark', 'lavender']), hair: F.pick(['cap', 'bob', 'beanie', 'long']), hairColor: F.pick(['ink', 'wood', 'accent']) };
      const pumps = [];
      ct.forEach(t => { if (t < startPump) return; pumps.push({ at: r4(t + i * 0.02), dur: 0.16, y: r4(y - 0.03 * s / 1.5), ease: 'outQuad' }, { at: r4(t + 0.16 + i * 0.02), dur: 0.3, y: r4(y), ease: 'outBounce' }); });
      out.push(F.minifig(Object.assign({}, look, { x, y, s: s * (who === 'tyler' ? 0.86 : 1), face: i % 3 === 0 ? 'furious' : i % 3 === 1 ? 'angry' : 'shock', vein: i % 3 === 0,
        arms: [9, -165], armLoops: [{ fx: 'sway', period: chantEvery, amp: 3, phase: i }, { fx: 'flap', period: chantEvery / 2, amp: 0.7, phase: i * 0.3 }], moves: pumps, blur: y < 0.75 ? 0.0012 : undefined, shadow: true })));
    });
    return out;
  };
  const arc = (x0, y0, x1, y1, at, dur, peak, spin = 540) => [ // thrown object: up-and-over arc + spin
    { at: r4(at), dur: r4(dur), x: x1, ease: 'linear' },
    { at: r4(at), dur: r4(dur / 2), y: r4(Math.min(y0, y1) - peak), ease: 'outQuad' },
    { at: r4(at + dur / 2), dur: r4(dur / 2), y: y1, ease: 'inQuad' },
    { at: r4(at), dur: r4(dur), rot: spin, ease: 'linear' },
  ];
  const pillow = (fill, x0, y0, x1, y1, at, dur, peak = 0.2) => part({ type: 'rect', wUnit: 'U', w: 0.13, h: 0.09, fill, radius: 0.035, x: x0, y: y0, moves: arc(x0, y0, x1, y1, at, dur, peak) });
  const feathers = (x, y, at, n = 14, seed = 3) => ({ type: 'dots', count: n, seed, fill: ['white', 'bg'], r: 0.007, x, y, area: [x - 0.2, y - 0.25, x + 0.2, y + 0.05], motion: 'burst', in: { at: r4(at), dur: 1.2 } });
  const chantVoices = (d, gain = 0.45, startAt = 0) => chantTimes(d).filter(t => t >= startAt).flatMap((t, k) => [0, 1, 2, 3, 4, 5].map(i => voiceEl(`chant_${i}`, r4(t + i * 0.018), { voiceGain: gain, voicePan: (i - 2.5) * 0.3 })));
  const chantCaption = d => chantTimes(d).map((t, k) => ({ type: 'text', screen: true, text: 'WE WANT MORE!', role: 'display', size: 0.1, bubble: 0.03, color: 'primary', outline: { color: 'white', w: 0.07 }, x: 0.5, y: 0.17 + (k % 2) * 0.012, rot: k % 2 ? 3 : -3,
    in: { fx: 'pop', at: t, dur: 0.22 }, out: { fx: 'cut', at: r4(t + chantEvery - 0.05), dur: 0.01 }, sfx: false }));

  // RIOT A — chant starts, the room starts to go
  scenes.push({ id: 'riotA', dur: riotA, bg: 'chapter1', transition: 'cut', camera: { zoom: [1.0, 1.06], ease: 'linear', handheld: 1.4, shake: 0.15 }, grade: { vignette: 0.4, grain: 0.05, tint: 'rgba(240,80,90,0.2)' },
    elements: [...room(),
      // sofa gets flipped by Dev
      part({ type: 'group', x: 0.62, y: 0.7, children: [part({ type: 'rect', wUnit: 'U', w: 0.5, h: 0.14, fill: 'secondary', radius: 0.04, anchor: 'bottom' }), part({ type: 'rect', wUnit: 'U', w: 0.5, h: 0.12, fill: 'secondary', radius: 0.04, anchor: 'bottom', y: -0.12 })],
        moves: [{ at: 1.5, dur: 0.12, rot: -6, ease: 'outQuad' }, { at: 1.62, dur: 0.45, rot: 95, y: 0.68, ease: 'outBounce' }] }),
      // picture frame swings, then drops
      { type: 'group', x: 0.25, y: 0.28, children: [part({ type: 'rect', wUnit: 'U', w: 0.2, h: 0.16, fill: 'wood', radius: 0.01, anchor: 'top' }), { type: 'rect', wUnit: 'U', w: 0.16, h: 0.12, fill: 'bg', anchor: 'top', y: 0.02 }, part({ type: 'heart', r: 0.035, fill: 'primary', y: 0.08 })],
        loop: { fx: 'sway', period: 0.4, amp: 3 }, moves: [{ at: 2.4, dur: 0.5, y: 0.66, rot: 25, ease: 'inQuad' }] },
      ...crowd(riotA),
      pillow('blush', 0.3, 0.72, 0.85, 0.5, 0.9, 0.8, 0.25), pillow('mint', 0.7, 0.72, 0.15, 0.55, 1.4, 0.9, 0.3), pillow('accent', 0.45, 0.75, 0.7, 0.35, 2.2, 0.7, 0.2),
      feathers(0.8, 0.5, 1.7, 16, 4), feathers(0.2, 0.55, 2.3, 14, 7),
      ...[0, 1, 2].map(k => Object.assign(F.sweetBox({ s: 1.4 }), { x: 0.3 + k * 0.2, y: 0.72, moves: arc(0.3 + k * 0.2, 0.72, 0.15 + k * 0.33, 0.7, 2.6 + k * 0.2, 0.8, 0.35, 360 + k * 180) })),
      ...chantVoices(riotA), ...chantCaption(riotA), sfxAt('rumble', 0.3, { sfxDur: 3.4 }), sfxAt('impact', 1.95),
      rec(), battery(),
    ] });

  // RIOT B — lamp topples, the pillow comes for the camera
  const hitAt = 1.75;
  scenes.push({ id: 'riotB', dur: riotB, bg: 'chapter1', transition: 'cut', camera: { at: [0.5, 0.5], keys: [{ at: 0, dur: 0.01, zoom: 1.12 }, { at: 0.5, dur: 1.2, zoom: 1.2, ease: 'linear' }], handheld: 1.8, shake: 0.45 }, grade: { vignette: 0.45, grain: 0.06, tint: 'rgba(240,80,90,0.25)' },
    elements: [...room(),
      { type: 'group', x: 0.12, y: 0.7, children: [T.lamp({ x: 0, y: 0, s: 2.2 })], moves: [{ at: 0.4, dur: 0.5, rot: -88, ease: 'outBounce' }] },
      ...crowd(riotB),
      pillow('lavender', 0.85, 0.7, 0.25, 0.45, 0.2, 0.7, 0.25), feathers(0.3, 0.5, 0.85, 18, 9),
      ...chantVoices(riotB, 0.5), ...chantCaption(riotB).slice(0, 2),
      // the pillow that ends it: thrown straight at the lens
      part({ type: 'rect', screen: true, wUnit: 'U', w: 0.13, h: 0.09, fill: 'primary', radius: 0.035, x: 0.62, y: 0.62, scale: 0.6, in: { fx: 'cut', at: r4(hitAt - 0.45), dur: 0.01 }, sfx: 'whoosh',
        moves: [{ at: r4(hitAt - 0.45), dur: 0.45, x: 0.5, y: 0.48, scale: 14, rot: 30, ease: 'inQuad' }] }),
      { type: 'rect', screen: true, wUnit: 'U', w: 3, h: 3, fill: 'white', x: 0.5, y: 0.5, in: { fx: 'cut', at: hitAt, dur: 0.01 }, out: { fx: 'fade', at: r4(hitAt + 0.05), dur: 0.2 }, sfx: 'impact' },
      rec(), battery(),
    ] });

  // FALL — the camera tumbles (roll + drop), motion-blurred by the renderer
  const fallDur = 0.9;
  scenes.push({ id: 'fall', dur: fallDur, bg: 'chapter1', transition: 'cut',
    camera: { at: [0.5, 0.5], zoom: [1.15, 1.15], keys: [{ at: 0, dur: 0.7, roll: -160, y: 0.15, zoom: 1.5, ease: 'inQuad' }, { at: 0.7, dur: 0.2, roll: -95, y: 0.3, zoom: 1.6, ease: 'outBack' }], shake: 0.6 },
    grade: { vignette: 0.5, grain: 0.08 },
    elements: [...room(), ...crowd(fallDur), sfxAt('boing', 0.72), rec(), battery(true)] });

  // FLOOR — the world sideways from the floor, lens cracked; chaos continues; Jade leans in: "Soon."
  const floorDur = 4.0, jadeAt = 1.5, soonAt = r4(jadeAt + 0.75);
  const crackC = [0.64, 0.36];
  const crack = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + (i % 3) * 0.2, len = 0.25 + ((i * 37) % 10) / 18, pts = [crackC];
    for (let k = 1; k <= 4; k++) { const f = (len * k) / 4, j = ((i * 13 + k * 7) % 9 - 4) * 0.012; pts.push([r4(crackC[0] + Math.cos(a) * f * 0.56 + j), r4(crackC[1] + Math.sin(a) * f + j)]); }
    crack.push({ type: 'path', screen: true, points: pts, smooth: false, stroke: 'white', strokeW: 0.0035, opacity: 0.9, in: { fx: 'draw', at: 0, dur: 0.12 } });
    crack.push({ type: 'path', screen: true, points: pts.map(([x, y]) => [x + 0.002, y + 0.002]), smooth: false, stroke: 'ink', strokeW: 0.002, opacity: 0.5, in: { fx: 'draw', at: 0, dur: 0.12 } });
  }
  [0.05, 0.1].forEach(rr => crack.push({ type: 'path', screen: true, points: Array.from({ length: 9 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return [r4(crackC[0] + Math.cos(a) * rr * 0.56 * (1 + (k % 2) * 0.2)), r4(crackC[1] + Math.sin(a) * rr)]; }), smooth: false, stroke: 'white', strokeW: 0.0025, opacity: 0.8, in: { fx: 'draw', at: 0.05, dur: 0.15 } }));
  const stompers = [];
  [[0.2, 'marcus', 0], [0.42, 'denise', 0.15], [0.66, 'dev', 0.3], [0.86, null, 0.45]].forEach(([x, who, ph], i) => {
    const look = who ? CAST[who].look : { torso: 'accent', legs: 'lavender' };
    const y = 0.86, stomps = [];
    for (let t = ph; t < jadeAt - 0.2; t += 0.42) stomps.push({ at: r4(t), dur: 0.18, y: r4(y - 0.05), ease: 'outQuad' }, { at: r4(t + 0.18), dur: 0.14, y, ease: 'inQuad' });
    stomps.push({ at: r4(jadeAt - 0.3 + i * 0.05), dur: 0.4, x: i < 2 ? -0.3 : 1.3, ease: 'inCubic' }); // they scatter as Jade arrives
    stompers.push(F.minifig(Object.assign({}, look, { x, y, s: 3.4, arms: [9, -165], face: 'furious', moves: stomps, blur: 0.0025 })));
  });
  scenes.push({ id: 'floor', dur: floorDur, bg: 'chapter1', transition: 'cut',
    camera: { at: [0.5, 0.62], zoom: [1.05, 1.05], keys: [{ at: 0, dur: 0.01, roll: -95 }, { at: 0.05, dur: 0.6, roll: -84, ease: 'outBack' }], handheld: 0.2 },
    grade: { vignette: 0.6, grain: 0.09, tint: 'rgba(60,30,50,0.35)' },
    elements: [
      ...room(),
      { type: 'baseplate', w: 1.6, wUnit: 'U', h: 0.6, fill: 'wood', x: 0.5, y: 0.9, anchor: 'top', pitch: 0.09 },
      ...stompers,
      pillow('mint', 0.3, 0.3, 0.55, 0.88, 0.2, 0.6, 0.05), feathers(0.5, 0.6, 0.4, 20, 11),
      Object.assign(F.sweetBox({ s: 3 }), { x: 0.75, y: 0.4, moves: arc(0.75, 0.4, 0.62, 0.9, 0.7, 0.5, 0.05, 200) }),
      // Jade leans into the fallen camera — a cameo, then a whispered promise
      Object.assign(F.minifig(Object.assign({}, JADE, { s: 6.4, talk: talk('jade', soonAt), arms: [9, -9], step: 12, shadow: false })), { screen: true, x: 1.5, y: 1.15, rot: -14, in: { fx: 'cut', at: jadeAt, dur: 0.01 },
        moves: [{ at: r4(jadeAt + 0.02), dur: 0.55, x: 0.56, rot: -9, ease: 'outBack' }, { at: r4(soonAt + 0.55), dur: 0.25, rot: -4, ease: 'outCubic' }] }),
      voiceEl('jade', soonAt),
      ...crack, sfxAt('scratch', 0.02),
      ...chantVoices(jadeAt - 0.2, 0.18),
      rec({ loop: { fx: 'shake', amp: 1.5 } }), battery(true),
      { type: 'text', screen: true, text: '“Soon.”', role: 'headline', size: 0.07, bubble: 0.015, color: 'ink', x: 0.5, y: CAP_Y, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'type', at: r4(soonAt + 0.05), dur: 0.2 }, sfx: false },
      // signal dies: black, then the classic CRT-off line
      { type: 'rect', screen: true, wUnit: 'U', w: 3, h: 3, fill: '#000000', x: 0.5, y: 0.5, in: { fx: 'cut', at: r4(floorDur - 0.35), dur: 0.01 }, sfx: false },
      { type: 'rect', screen: true, wUnit: 'U', w: 1.1, h: 0.008, fill: 'white', x: 0.5, y: 0.5, in: { fx: 'cut', at: r4(floorDur - 0.35), dur: 0.01 }, moves: [{ at: r4(floorDur - 0.35), dur: 0.25, sx: 0, ease: 'inExpo' }], sfx: 'shutter' },
    ] });

  // BLACK beat, then the logo
  scenes.push({ id: 'black', dur: 0.6, bg: '#000000', transition: 'cut', elements: [] });
  scenes.push({ id: 'logo', dur: 3.2, bg: 'bg', transition: { type: 'iris', x: 0.5, y: 0.45, ring: 'primary', dur: 0.5 }, grade: { vignette: 0.1, grain: 0.02 },
    elements: [
      { type: 'dots', count: 22, seed: 12, fill: ['primary', 'lavender', 'mint', 'accent', 'chapter1'], r: 0.012, motion: 'drift', area: [0.05, 0.05, 0.95, 0.95], in: { at: 0 } },
      { type: 'blob', r: 0.44, fill: 'chapter1', x: 0.5, y: 0.47, wobble: 0.08, speed: 1.3, in: { fx: 'scale', at: 0.1, dur: 0.8 } },
      { type: 'repeat', mode: 'radial', count: 12, radius: 0.36, x: 0.5, y: 0.47, stagger: 0.04, fills: ['primary', 'secondary', 'accent', 'mint', 'blushDeep'], seed: 4, vary: { rot: 30, scale: 0.5 },
        child: { type: 'heart', r: 0.028, fill: 'primary', in: { fx: 'pop', at: 0.5, dur: 0.4 }, loop: { fx: 'float', period: 1.8 } } },
      { type: 'logo', w: 0.78, x: 0.5, y: 0.47, in: { fx: 'pop-soft', at: 0.35, dur: 0.6 }, loop: { fx: 'jelly', period: 1, amp: 0.5 } },
      { type: 'segbar', w: 0.42, h: 0.014, segments: 6, gap: 0.012, fill: ['primary', 'secondary', 'accent', 'mint', 'blushDeep', 'lavender'], x: 0.5, y: 0.62, in: { at: 0.9, dur: 0.6 } },
    ] });

  return { title: 'Jadesserts — We Want More (9x16)', format: { w: W, h: H, fps: 30 }, bpm: 120, scenes };
}

const story = make();
fs.writeFileSync(path.join(here, 'storyboard-9x16.json'), JSON.stringify(story) + '\n');
let t = 0; console.log(story.scenes.map(s => { const r = `${s.id}@${t.toFixed(1)}`; t += s.dur; return r; }).join(' '), `\ntotal ${t.toFixed(1)}s`);
