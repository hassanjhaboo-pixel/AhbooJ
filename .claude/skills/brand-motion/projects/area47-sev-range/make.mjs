#!/usr/bin/env node
// AREA 47 · "SEV: RANGE TEST": a 30s 9:16 showreel of everything the SEV rig can do.
//   01 teleports (materialises in the UFO beam)   02 talks (alien gibberish, lip-synced, subtitled)
//   03 expressions (12-state eye chart + acted mouths)   04 gestures (arm swings at the shoulder, head nods/shakes)
//   05 props (hand-pose sheet)   06 360 (8-angle head turn)   07 walks (side-view cycle)   08 poses (v2 sticker art)
//   finale: "Too clean." in English + booking card.
// Built to references/anti-vibecode.md: flat stage, no grain, slams and cuts, Big Shoulders + Outfit.
//   node make.mjs → story.json + cues.json + voices/ → node sound.mjs → build → render
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { voiceLines, gibberish } from '../../scripts/voice.mjs';
import { sevPuppet, sevWalk, sevPoint } from '../../kits/area47-sevrig.mjs';
import { sev } from '../../kits/area47-sev.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const r4 = v => Math.round(v * 10000) / 10000, Y = px => r4(px / 1920);
const cut = at => ({ fx: 'cut', at: r4(at), dur: 0.001 });
const cues = []; const cue = (t, kind, extra = {}) => cues.push(Object.assign({ t: r4(t), kind }, extra));
const els = [];
const SEV = { x: 0.5, y: 1.0234, scale: 1.25 };                 // waist-up framing, head top ~630 px

// ---------- voice ----------
const ALIEN = { voice: 'am_onyx', fx: 'alien', pitch: 4, speed: 1.08 };
const ENG = { voice: 'am_onyx', fx: 'deadpan', pitch: 0.6, speed: 1.05 };
const HELLO = "Yo. It's SEV. Welcome to Area 47.";
const V = await voiceLines([Object.assign({ id: 'hello', text: gibberish(HELLO) }, ALIEN), Object.assign({ id: 'clean', text: 'Too clean.' }, ENG)], path.join(here, 'voices'));
if (!V.hello || !V.clean) throw new Error('voice engine missing: bash ../../scripts/setup-tts.sh');

// ---------- section times ----------
const S = { teleport: 0, talk: 2.6, eyes: 6.4, gest: 10, props: 13.4, turn: 16.4, walk: 19.4, poses: 23.2, end: 26.4 };
const DUR = 30.4;
const label = (n, text, at, end) => {
  els.push({ type: 'text', text: `0${n}`, role: 'caption', face: 'hud', size: 0.042, color: 'primary', x: 0.5, y: Y(245), sfx: false, in: { fx: 'type', at, dur: 0.15 }, out: cut(end) });
  els.push({ type: 'text', text, role: 'display', face: 'street', size: 0.13, color: 'white', x: 0.5, y: Y(345), sfx: false, in: { fx: 'scale-down', at, dur: 0.2 }, out: cut(end) });
  cue(at, 'hit', { p: 0.9 + n * 0.03 });
};

// background: dim topo lines, slow drift
const { levels } = JSON.parse(fs.readFileSync(path.join(here, '../area47-topo-story/contours.json'), 'utf8'));
levels.forEach((lv, li) => lv.lines.forEach(pts => els.push({ type: 'path', points: pts, smooth: true, stroke: lv.major ? 'cyanDeep' : 'panel', strokeW: lv.major ? 0.0026 : 0.0016,
  opacity: lv.major ? 0.45 : 0.85, sfx: false, in: { fx: 'draw', at: r4(li * 0.01), dur: 0.8 }, moves: [{ at: 0, dur: DUR, scale: 1.08, rot: 2, ease: 'linear' }] })));

// ---------- 01 TELEPORT ----------
const ufo = (at, end) => {
  els.push({ type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.5, 1.2], [-0.5, 1.2]], grad: ['beam', 'beamClear'], x: 0.5, y: Y(470), blend: 'screen', sfx: false,
    in: { fx: 'grow-y', at: at + 0.15, dur: 0.25 }, out: cut(end), loop: { fx: 'pulse', period: 1.2, amp: 0.2 } });
  els.push({ type: 'image', src: '../area47-scan-report/assets/ufo.svg', w: 0.17, x: 0.5, y: Y(455), sfx: false, in: { fx: 'drop-soft', at, dur: 0.4 }, out: { fx: 'slide-up', at: end - 0.3, dur: 0.3, ease: 'inExpo' }, loop: { fx: 'float', period: 2.4, amp: 0.4 } });
};
ufo(0, S.talk + 0.3);
label(1, 'TELEPORTS', 0.1, S.talk);
cue(0.1, 'beam'); cue(0.55, 'zip'); cue(1.15, 'land');

// ---------- puppet A: sections 01–05 ----------
const hello = { at: S.talk + 0.35, dur: V.hello.dur, env: V.hello.env, head: 'tilt', arm: 'wave' };
const actA = [hello,
  { at: S.gest + 0.25, dur: 0.9, head: 'nod', arm: 'point' },
  { at: S.gest + 1.35, dur: 0.95, head: 'side', arm: 'shrug' },
  { at: S.gest + 2.45, dur: 0.75, head: 'shake', arm: 'pointR' }];
const eyesA = [[0, 'neutral'], [S.eyes + 0.2, 'look-left'], [S.eyes + 0.65, 'look-right'], [S.eyes + 1.1, 'look-up'], [S.eyes + 1.55, 'side-eye'], [S.eyes + 2.05, 'squint'],
  [S.eyes + 2.5, 'wide'], [S.eyes + 2.95, 'happy'], [S.eyes + 3.4, 'neutral'], [S.props + 0.2, 'happy'], [S.props + 1.6, 'wink'], [S.props + 2.1, 'neutral']];
const mouthsA = [[0, 'closed'], [hello.at, null], [hello.at + hello.dur, 'closed'], [S.eyes + 1.55, 'smirk'], [S.eyes + 2.05, 'closed'], [S.eyes + 2.5, 'oh'], [S.eyes + 2.95, 'laugh'],
  [S.eyes + 3.4, 'closed'], [S.gest, 'smirk'], [S.gest + 2.45, 'closed'], [S.props + 0.2, 'ee'], [S.props + 1.6, 'smirk']];
els.push(sevPuppet(Object.assign({}, SEV, { dur: DUR, lines: actA, eyes: eyesA, mouths: mouthsA, out: cut(S.turn),
  in: { fx: 'blur-in', at: 0.55, dur: 0.6 }, sx: 0.12, sy: 1.12,
  extraMoves: [{ at: 0.55, dur: 0.6, sx: 1, sy: 1, ease: 'outBack' },
    { at: S.eyes + 2.5, dur: 0.06, sy: 1.04, ease: 'outQuad' }, { at: S.eyes + 2.56, dur: 0.3, sy: 1, ease: 'outBack' }] })));

// ---------- 02 TALKS ----------
label(2, 'TALKS', S.talk, S.eyes);
els.push({ type: 'group', x: 0.5, y: Y(1560), sfx: false, in: { fx: 'cut', at: hello.at, dur: 0.001 }, out: cut(hello.at + hello.dur + 0.4), children: [
  { type: 'rect', wUnit: 'U', w: 0.8, h: 0.075, radius: 0.01, fill: 'bg', opacity: 0.9 },
  { type: 'text', text: HELLO, role: 'body', face: 'plainBold', size: 0.04, color: 'white', in: { fx: 'type', at: hello.at, dur: hello.dur * 0.7 } }] });
els.push({ type: 'text', text: 'Translated from alien', role: 'body', face: 'plain', size: 0.03, color: 'cyanSoft', x: 0.5, y: Y(1630), sfx: false, in: { fx: 'type', at: hello.at + 0.2, dur: 0.4 }, out: cut(hello.at + hello.dur + 0.4) });

// ---------- 03 EXPRESSIONS ----------
label(3, 'EXPRESSIONS', S.eyes, S.gest);
cue(S.eyes + 2.5, 'ping', { p: 1.3 }); cue(S.eyes + 2.95, 'ping', { p: 1.6 });

// ---------- 04 GESTURES ----------
label(4, 'GESTURES', S.gest, S.props);
actA.slice(1).forEach(a => cue(a.at, 'zip'));

// ---------- 05 PROPS (hand-pose sheet) ----------
label(5, 'PROPS', S.props, S.turn);
const hand = (name, x, y, rot, at, end, w = 0.36) => els.push({ type: 'image', src: `../../brand/assets/area47/sev/hands/hand-${name}.png`, w, wUnit: 'U', x, y: Y(y), rot, sfx: false,
  in: { fx: 'pop', at, dur: 0.3 }, out: cut(end) });
const P = S.props;
hand('thumbs-up', 0.2, 1330, -12, P + 0.2, P + 0.9); hand('spray', 0.8, 1310, 10, P + 0.45, P + 1.2);
hand('towel', 0.2, 1330, -8, P + 0.9, P + 1.6); hand('keys', 0.8, 1310, 8, P + 1.2, P + 2.0);
hand('peace', 0.2, 1330, -10, P + 1.6, S.turn); hand('ok', 0.8, 1310, 10, P + 2.0, S.turn);
[0.2, 0.45, 0.9, 1.2, 1.6, 2.0].forEach((o, i) => cue(P + o, 'ping', { p: 1 + i * 0.08 }));

// ---------- 06 360 (head turn) ----------
label(6, '360', S.turn, S.walk);
const T8 = JSON.parse(fs.readFileSync(path.join(here, '../../brand/assets/area47/sev/v3.json'), 'utf8')).turn8;
const order = ['000-front', '045', '090-profile', '135', '180-back', '225', '270-profile', '315'];
const tw = T8['head-000-front'].w / T8['head-000-front'].h, th = 0.82;
const spinAt = S.turn + 0.3, spinFps = 9, spinEnd = r4(spinAt + 16 / spinFps);
els.push({ type: 'image', src: `../../brand/assets/area47/sev/turn8/head-${order[0]}.png`, seq: order.map(o => `../../brand/assets/area47/sev/turn8/head-${o}.png`), seqLoop: true, seqFps: spinFps, seqAt: spinAt,
  w: r4(th * tw), wUnit: 'U', h: th, anchor: 'bottom', x: 0.5, y: Y(1500), from: S.turn, out: cut(spinEnd), sfx: false, in: { fx: 'pop-soft', at: S.turn, dur: 0.3 } });
els.push({ type: 'image', src: `../../brand/assets/area47/sev/turn8/head-000-front.png`, w: r4(th * tw), wUnit: 'U', h: th, anchor: 'bottom', x: 0.5, y: Y(1500), from: spinEnd, out: cut(S.walk), sfx: false,
  moves: [{ at: spinEnd, dur: 0.07, scale: 1.06, ease: 'outQuad' }, { at: spinEnd + 0.07, dur: 0.3, scale: 1, ease: 'outBack' }] });
cue(spinAt, 'scan'); cue(spinEnd, 'hit', { p: 1.1 });

// ---------- 07 WALKS ----------
label(7, 'WALKS', S.walk, S.poses);
const walk = sevWalk({ x0: 1.25, x1: -0.2, y: Y(1640), h: 0.85, at: S.walk + 0.05, fps: 7 });
walk.from = S.walk; walk.out = cut(S.poses);
els.push({ type: 'rect', w: 1, h: 0.01, fill: 'cyanDeep', x: 0.5, y: Y(1650), opacity: 0.6, sfx: false, from: S.walk, out: cut(S.poses) }, walk);
for (let t = S.walk + 0.1; t < Math.min(walk.walkEnd, S.poses); t += 0.5) cue(t, 'step');

// ---------- 08 POSES (v2 sticker art, waist-up) ----------
label(8, 'POSES', S.poses, S.end);
els.push(sev({ x: 0.5, y: 1.0, h: 0.98, end: S.end, art: [[S.poses + 0.1, 'pose-point'], [S.poses + 0.9, 'pose-keys'], [S.poses + 1.7, 'pose-47'], [S.poses + 2.5, 'face-wink', 0.8]],
  from: S.poses, out: cut(S.end), sfx: false }));
[0.1, 0.9, 1.7, 2.5].forEach(o => cue(S.poses + o, 'land'));

// ---------- finale ----------
const clean = { at: S.end + 0.6, dur: V.clean.dur, env: V.clean.env, head: 'proud' };
ufo(S.end, DUR + 1);
els.push(sevPuppet(Object.assign({}, SEV, { dur: DUR, lines: [clean], eyes: [[0, 'neutral'], [clean.at + clean.dur + 0.1, 'happy']], from: S.end,
  extraMoves: [{ at: S.end, dur: 0.07, sy: 1.05, sx: 0.96, ease: 'outQuad' }, { at: S.end + 0.07, dur: 0.3, sy: 1, sx: 1, ease: 'outBack' }] })));
els.push({ type: 'text', text: 'TOO CLEAN.', role: 'display', face: 'street', size: 0.15, color: 'primary', x: 0.5, y: Y(330), sfx: false, in: { fx: 'scale-down', at: clean.at, dur: 0.2 } });
const grill = sevPoint(512, 362, SEV);
[[0.035, 0], [-0.04, 0.22]].forEach(([dx, o]) => els.push({ type: 'sparkle', r: 0.03, fill: 'white', x: r4(grill[0] + dx), y: grill[1], sfx: false,
  in: { fx: 'pop', at: r4(clean.at + clean.dur + 0.1 + o), dur: 0.3 }, out: { fx: 'scale', at: r4(clean.at + clean.dur + 0.9 + o), dur: 0.25 }, loop: { fx: 'spin', period: 2 } }));
els.push({ type: 'group', x: 0.5, y: Y(1545), sfx: false, in: { fx: 'slide-left', at: clean.at + 0.9, dur: 0.35 }, children: [
  { type: 'rect', wUnit: 'U', w: 0.85, h: 0.1, radius: 0.012, fill: 'primary' },
  { type: 'text', text: 'DM TO BOOK  @a47.detailing', role: 'headline', face: 'plainBold', size: 0.045, color: 'onPrimary' }] });
els.push({ type: 'group', x: 0.5, y: Y(1640), sfx: false, in: { fx: 'cut', at: clean.at + 1.2, dur: 0.001 }, children: [
  { type: 'rect', wUnit: 'U', w: 0.78, h: 0.06, radius: 0.01, fill: 'bg', opacity: 0.9 },
  { type: 'text', text: 'Cars · furniture · mobile · +1 (868) 329-5373', role: 'body', face: 'plain', size: 0.032, color: 'white', in: { fx: 'type', at: clean.at + 1.2, dur: 0.6 } }] });
cue(S.end, 'beam'); cue(clean.at, 'hit'); cue(clean.at + clean.dur + 0.1, 'ping', { p: 1.5 }); cue(clean.at + clean.dur + 0.32, 'ping', { p: 1.8 }); cue(clean.at + 0.9, 'zip');

// camera: punch on every section change
const keys = [];
Object.values(S).forEach(t => { if (t > 0) keys.push({ at: t, dur: 0.04, zoom: 1.05, ease: 'linear' }, { at: r4(t + 0.04), dur: 0.35, zoom: 1, ease: 'outCubic' }); });
fs.writeFileSync(path.join(here, 'story.json'), JSON.stringify({ title: 'AREA 47 · SEV range test', format: { w: 1080, h: 1920, fps: 30 }, bpm: 90,
  scenes: [{ id: 'range', dur: DUR, bg: 'bg', camera: { keys }, grade: { vignette: 0.25 }, elements: els }], overlays: [] }));
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify({ duration: DUR, cues: cues.sort((a, b) => a.t - b.t),
  voices: [{ file: `voices/${V.hello.file}`, at: hello.at }, { file: `voices/${V.clean.file}`, at: clean.at }] }, null, 1));
console.log(`story.json ${DUR}s · hello ${hello.dur}s · walk ends ${walk.walkEnd}`);
