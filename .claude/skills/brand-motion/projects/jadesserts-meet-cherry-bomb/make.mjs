#!/usr/bin/env node
// "Meet Cherry & Bomb" — Jadesserts brand introduction (9:16 + 1:1), ~80 s.
// Logo (the cherries face away) → "psst!" → they turn, pop out of the logo → one continuous left-to-right walk past
// story stations while they bicker (sitcom laugh track) → the sincere invite → camera swings behind them at a junction
// → black → logo + CTA. Every timing comes from the real voice durations (lines.mjs → voices/).
//   node make.mjs → storyboard-9x16.json, storyboard-1x1.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { duo } from '../../characters/cherry-bomb/rig.mjs';
import { voiceLines } from '../../scripts/voice.mjs';
import { LINES } from './lines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PARTS = '../../characters/cherry-bomb/parts';
const WORDMARK = '../../brand/assets/jadesserts/logo-wordmark.png', LOGO = '../../brand/assets/jadesserts/logo.png';
const PHOTO = n => `../jadesserts-sweet-box/assets/products/${n}.png`;
const r4 = v => Math.round(v * 10000) / 10000;
const V = await voiceLines(LINES, path.join(here, 'voices'), { quiet: true });
const dur = id => (V[id] ? V[id].dur : 1.2);
const talk = (id, at) => (V[id] ? { env: V[id].env, fps: V[id].fps, at: r4(at) } : null);
const speaker = id => (id.startsWith('c_') ? 'cherry' : 'bomb');
const textOf = id => { const l = LINES.find(x => x.id === id); return l.text.replace('Jay Desserts', 'Jadesserts'); };
const voiceEl = (id, at, g = 1, pan = 0) => ({ type: 'rect', w: 0.001, h: 0.001, opacity: 0, voice: `voices/${id}.wav`, voiceGain: g, voicePan: pan, in: { fx: 'cut', at: r4(at), dur: 0.01 }, sfx: V[id] ? false : 'babble', sfxDur: dur(id) });
const sfx = (kind, at, extra = {}) => Object.assign({ type: 'rect', w: 0.001, h: 0.001, opacity: 0, in: { fx: 'cut', at: r4(at), dur: 0.01 }, sfx: kind }, extra);
const laugh = (at) => [0, 1, 2, 3, 4, 5].map(i => voiceEl(`laugh_${i}`, at + i * 0.05, 0.2, (i - 2.5) * 0.35));
const aww = (at) => [0, 1, 2, 3, 4].map(i => voiceEl(`aww_${i}`, at + i * 0.04, 0.22, (i - 2) * 0.4));

// ---------------- the script, as beats: line, gap before, poses, extras ----------------
// pose: { cherry: {...rig options}, bomb: {...} }; jump = hop toward the camera; laugh/aww = audience reaction after the line
const OPEN = [
  { id: 'b_psst', gap: 1.0 }, { id: 'b_over', gap: 0.2 }, { id: 'c_wrong', gap: 0.35 }, { id: 'b_oops', gap: 0.25, turn: true },
  { id: 'c_hi', gap: 0.5 }, { id: 'b_hi', gap: 0.15 }, { id: 'c_come', gap: 0.2, pop: true },
];
const WALK = [
  { id: 'c_start', gap: 0.7, st: 'kitchen' }, { id: 'b_flour', gap: 0.1, laugh: true, flour: true },
  { id: 'c_love', gap: 0.3, st: 'treats' }, { id: 'b_burnt', gap: 0.05, laugh: true, burnt: true },
  { id: 'c_trial', gap: 0.3, st: 'chalk' }, { id: 'b_nights', gap: 0.15, nights: true },
  { id: 'c_taste', gap: 0.35, st: 'box' },
  { id: 'b_diff', gap: 0.35, st: 'question' }, { id: 'c_nothing', gap: 0.25 }, { id: 'b_what', gap: 0.15, jump: true, laugh: true },
  { id: 'c_corners', gap: 0.3, st: 'corners' }, { id: 'b_scissors', gap: 0.2, scissors: true }, { id: 'c_put', gap: 0.1, laugh: true },
  { id: 'c_teacher', gap: 0.4, st: 'teacher' }, { id: 'b_student', gap: 0.1, st: 'student' }, { id: 'c_news', gap: 0.15, st: 'news' }, { id: 'b_breakfast', gap: 0.1, st: 'breakfast', jump: true },
  { id: 'c_brighten', gap: 0.35, st: 'sun' }, { id: 'b_someone', gap: 0.05 },
  { id: 'c_free', gap: 0.35, st: 'free' }, { id: 'b_chaos', gap: 0.15 }, { id: 'c_you', gap: 0.1 }, { id: 'b_me', gap: 0.1, jump: true, laugh: true },
  { id: 'b_dream', gap: 0.35, st: 'dream' }, { id: 'c_more', gap: 0.2 },
  { id: 'c_swipe', gap: 0.35, st: 'phone' }, { id: 'b_order', gap: 0.1, jump: true }, { id: 'c_maybe', gap: 0.15, laugh: true },
];
const STOP = [{ id: 'c_shy', gap: 0.6, aww: true }, { id: 'b_soon', gap: 0.15 }, { id: 'c_start2', gap: 0.5 }, { id: 'b_journey', gap: 0.25 }];
const JUNC = [{ id: 'c_ready', gap: 1.6 }, { id: 'b_ready', gap: 0.35 }];
function schedule(beats, t0 = 0) { let t = t0; beats.forEach(b => { t += b.gap; b.at = r4(t); b.end = r4(t + dur(b.id)); t = b.end + (b.laugh ? 0.85 : b.aww ? 1.0 : 0); }); return t; }

// default faces/poses per line (who talks gets the talk mouth; the other reacts)
const POSE = {
  b_psst: { bomb: { face: 'sly' } }, b_over: { bomb: { face: 'grin' } }, c_wrong: { cherry: { face: 'smile', look: 1 } }, b_oops: { bomb: { face: 'grin', armR: -150 } },
  c_hi: { cherry: { armL: 150, wave: false, armLoops: [{ fx: 'sway', period: 0.45, amp: 4 }] } }, b_hi: { bomb: { armR: -160, armL: 160, hand: ['open', 'open'] }, cherry: { face: 'happy' } },
  c_come: { cherry: { armR: -95, hand: ['open', 'point'] } },
  c_start: { cherry: { look: 0.5 } }, b_flour: { bomb: { face: 'shock' }, cherry: { face: 'closed' } },
  c_love: { cherry: { face: 'happy' } }, b_burnt: { bomb: { face: 'grin', armR: -110, hand: ['open', 'point'] }, cherry: { face: 'shock' } },
  c_trial: { cherry: { look: 1 } }, b_nights: { bomb: { face: 'sly' } }, c_taste: { cherry: { face: 'happy' } },
  b_diff: { bomb: { look: -1 } }, c_nothing: { cherry: { face: 'smile' }, bomb: { face: 'shock' } }, b_what: { bomb: { face: 'shock', armL: 150, armR: -150 }, cherry: { face: 'closed' } },
  c_corners: { cherry: { face: 'happy' } }, b_scissors: { bomb: { face: 'sly', armR: -95, hand: ['open', 'fist'], scissors: true } }, c_put: { cherry: { face: 'smile', look: 1 }, bomb: { face: 'shock', armR: 20 } },
  c_teacher: { cherry: {} }, b_student: { bomb: {} }, c_news: { cherry: { face: 'happy' } }, b_breakfast: { bomb: { armL: 150, armR: -150 }, cherry: { face: 'happy' } },
  c_brighten: { cherry: { face: 'happy' } }, b_someone: { bomb: { armR: -110, hand: ['open', 'point'] } },
  c_free: { cherry: { armL: 140, armR: -140 } }, b_chaos: { bomb: { face: 'sly' } }, c_you: { cherry: { look: 1, face: 'smile' } }, b_me: { bomb: { armL: 160, armR: -160 }, cherry: { face: 'closed' } },
  b_dream: { bomb: { armR: -120, hand: ['open', 'point'] }, cherry: { face: 'happy' } }, c_more: { cherry: { face: 'happy' } },
  c_swipe: { cherry: { armR: -150, hand: ['open', 'point'] } }, b_order: { bomb: { armL: 150, armR: -150 } }, c_maybe: { cherry: { face: 'smile', look: 1 }, bomb: { face: 'grin' } },
  c_shy: { cherry: { face: 'shy', armL: -30, armR: 30 }, bomb: { face: 'grin' } }, b_soon: { bomb: { face: 'grin' }, cherry: { face: 'smile' } },
  c_start2: { cherry: { face: 'happy' } }, b_journey: { bomb: { armR: -130 }, cherry: { face: 'happy' } },
};
const scissorsProp = { type: 'group', rot: 30, children: [
  { type: 'poly', pts: [[-0.004, -0.04], [0.004, -0.04], [0.008, 0.002], [-0.008, 0.002]], fill: 'white', stroke: 'ink', strokeW: 0.002, radius: 0.002, rot: 12 },
  { type: 'poly', pts: [[-0.004, -0.04], [0.004, -0.04], [0.008, 0.002], [-0.008, 0.002]], fill: 'white', stroke: 'ink', strokeW: 0.002, radius: 0.002, rot: -12 },
  { type: 'ring', r: 0.009, fill: 'accent', strokeW: 0.004, x: -0.008, y: 0.01 }, { type: 'ring', r: 0.009, fill: 'accent', strokeW: 0.004, x: 0.008, y: 0.01 } ] };

function make(fmt) {
  const tall = fmt === '9x16', W = 1080, H = tall ? 1920 : 1080, U = 1080;
  const X = px => r4(px / W), Y = py => r4(py / H), u = px => r4(px / U);
  const ROAD = tall ? 0.72 : 0.79, S = tall ? 1.22 : 0.92, CAP_Y = tall ? 0.885 : 0.935;
  const scenes = [];
  const T_OPEN = schedule(OPEN), T_WALK = schedule(WALK), T_STOP = schedule(STOP), T_JUNC = schedule(JUNC);

  // caption chip per line, coloured by speaker
  const caption = (b, endAt) => ({ type: 'group', screen: true, x: 0.5, y: CAP_Y, from: b.at, out: { fx: 'cut', at: r4(endAt), dur: 0.01 }, children: [
    { type: 'text', text: textOf(b.id), role: 'body', size: tall ? 0.044 : 0.04, weight: 800, color: speaker(b.id) === 'cherry' ? 'ink' : 'onPrimary', maxWidth: 0.9, highlight: { fill: speaker(b.id) === 'cherry' ? 'blush' : 'primaryDeep', pad: 0.4 }, in: { fx: 'type', at: b.at, dur: Math.min(0.45, textOf(b.id).length * 0.02) }, sfx: false },
  ] });
  const captions = beats => beats.map((b, i) => caption(b, beats[i + 1] ? beats[i + 1].at : b.end + 1.2));
  const voices = beats => beats.flatMap(b => [voiceEl(b.id, b.at), ...(b.laugh ? laugh(b.end + 0.05) : []), ...(b.aww ? aww(b.end + 0.1) : [])]);
  // one duo "pose block" per line: lip sync on whoever is speaking; blocks hand over with cuts, loops keep running
  const blocks = (beats, base = {}, endAt) => beats.map((b, i) => {
    const p = POSE[b.id] || {}, who = speaker(b.id), from = i === 0 ? 0 : b.at - 0.02, to = beats[i + 1] ? beats[i + 1].at - 0.02 : endAt;
    const c = Object.assign({}, base.cherry || {}, p.cherry || {}), bo = Object.assign({}, base.bomb || {}, p.bomb || {});
    (who === 'cherry' ? c : bo).talk = talk(b.id, b.at);
    if (bo.scissors) { bo.hand = ['open', 'fist']; }
    const d = duo({ parts: PARTS, cherry: c, bomb: bo, from: r4(from) });
    if (bo.scissors) d.children[3].children[2].children[1].children.push(Object.assign({}, scissorsProp, { x: 0.03, y: 0.05 }));
    d.out = { fx: 'cut', at: r4(to), dur: 0.01 };
    return d;
  });

  // ================= SCENE 1 — the logo: they face away, turn around, pop out =================
  const LX = 0.5, LOGO_Y = tall ? 0.36 : 0.36, WM_W = tall ? 0.78 : 0.62;
  const wmH = WM_W * U * 224 / 1244 / H;               // wordmark height (frame fraction)
  const duoTopY = r4(LOGO_Y - wmH * 0.42);              // where the logo's cherries normally sit
  const S_LOGO = tall ? 0.62 : 0.5;
  const turnAt = OPEN.find(b => b.turn).end + 0.1, popAt = OPEN.find(b => b.pop).end + 0.15, openDur = r4(popAt + 1.15);
  const land = ROAD;
  // the logo as a roadside billboard (same world spot in the walk, so it scrolls away behind them)
  const billboard = () => ({ type: 'group', x: LX, y: LOGO_Y, children: [
    ...[-1, 1].map(sd => ({ type: 'rect', wUnit: 'U', w: 0.022, h: r4((ROAD - LOGO_Y) * H / U - 0.095), fill: 'wood', stroke: 'ink', strokeW: 0.004, anchor: 'top', radius: 0.005, x: r4(sd * WM_W * 0.3) })),
    { type: 'rect', wUnit: 'U', w: r4(WM_W * 0.7), h: 0.018, fill: 'wood', stroke: 'ink', strokeW: 0.004, y: r4(wmH * H / U * 0.55), radius: 0.005 },
    { type: 'image', src: WORDMARK, w: WM_W, wUnit: 'U', shadow: { color: 'rgba(74,44,51,0.25)', blur: 0.02, y: 0.01 } },
  ] });
  const oEls = [
    ...world(0, openDur, LX, LX, true),
    billboard(),
    // back view (facing away) until they turn around
    duo({ parts: PARTS, x: LX, y: duoTopY, s: S_LOGO, back: true, cherry: { bodyLoop: { fx: 'none' } }, bomb: { bodyLoop: { fx: 'none' } },
      moves: [{ at: r4(turnAt), dur: 0.12, sx: 0, ease: 'inQuad' }], out: { fx: 'cut', at: r4(turnAt + 0.12), dur: 0.01 } }),
  ];
  // front view: lines on the logo, then the pop-out arc down to the road
  const frontMoves = [{ at: 0, dur: 0.01, sx: 0 }, { at: r4(turnAt + 0.12), dur: 0.16, sx: 1, ease: 'outBack' },
    { at: r4(popAt), dur: 0.35, y: r4(duoTopY - 0.12), scale: S * 0.85, ease: 'outQuad' }, { at: r4(popAt + 0.35), dur: 0.45, y: land, scale: S, ease: 'inQuad' }];
  const openFront = OPEN.filter(b => b.at >= turnAt - 0.3);
  const fb = blocks(openFront, {}, openDur + 1).map((d, i) => Object.assign(d, { from: i === 0 ? r4(turnAt + 0.11) : d.from }));
  oEls.push({ type: 'group', x: LX, y: duoTopY, scale: S_LOGO, moves: frontMoves, children: fb.map(d => Object.assign(d, { x: 0, y: 0 })) });
  // back-view talking lines get captions + voices; Bomb whispers from behind the logo
  oEls.push(...voices(OPEN), ...captions(OPEN), sfx('boing', popAt + 0.75), sfx('pop', turnAt + 0.12));
  scenes.push({ id: 'logo', dur: openDur, bg: 'chapter1',
    camera: { at: [LX, r4(LOGO_Y - wmH * 0.2)], zoom: [2.3, 2.3], keys: [{ at: 0.2, dur: Math.max(2.5, OPEN[2].at - 0.4), zoom: 1, x: LX, y: 0.5, ease: 'inOutCubic' }] },
    elements: oEls, grade: { vignette: 0.12, grain: 0.015 } });

  // ================= SCENE 2 — the walk (one continuous take) =================
  const walkDur = r4(T_WALK + 0.6), SPEED = 0.24;     // world frame-widths per second
  const fx0 = LX, fx1 = r4(LX + SPEED * walkDur), at2x = t => r4(LX + SPEED * t);
  const wEls = [...world(fx0, walkDur, fx0, fx1, false), billboard()];
  // story stations, placed where the camera will be when their line starts (a little ahead, so they slide in)
  WALK.forEach(b => { if (b.st) wEls.push(station(b.st, at2x(b.at) + 0.32, b.at + 0.4)); });
  // gags
  WALK.forEach(b => {
    if (b.flour) wEls.push({ type: 'dots', screen: true, count: 60, seed: 5, fill: ['white', 'bg'], r: 0.03, x: 0.5, y: r4(ROAD - 0.15), area: [0.1, ROAD - 0.45, 0.9, ROAD + 0.05], motion: 'burst', in: { at: b.at, dur: 0.6 }, out: { fx: 'fade', at: r4(b.at + 1.1), dur: 0.5 }, sfx: 'whoosh' });
    if (b.burnt) wEls.push({ type: 'group', screen: true, x: 0.7, y: r4(ROAD - 0.25), in: { fx: 'pop', at: b.at, dur: 0.3 }, out: { fx: 'fade', at: r4(b.end + 0.8), dur: 0.3 }, children: [
      { type: 'pill', w: 0.16, wUnit: 'U', h: 0.08, fill: 'ink', stroke: 'ink', strokeW: 0.004 }, ...[0, 1, 2].map(k => ({ type: 'circle', r: 0.018 + k * 0.006, fill: 'chapter2', opacity: 0.8, x: -0.03 + k * 0.03, y: -0.08 - k * 0.02, loop: { fx: 'float', period: 0.8 + k * 0.2, amp: 3 } }))] });
    if (b.nights) wEls.push({ type: 'rect', screen: true, wUnit: 'U', w: 3, h: 3, fill: 'dark', x: 0.5, y: 0.5, opacity: 0, moves: [0, 1, 2].flatMap(k => [{ at: r4(b.at + k * 0.62), dur: 0.12, opacity: k === 1 ? 0 : 0.55 }, { at: r4(b.at + k * 0.62 + 0.4), dur: 0.15, opacity: k === 1 ? 0.0 : 0.35 }]).concat([{ at: r4(b.end + 0.1), dur: 0.3, opacity: 0 }]), blend: 'multiply' });
  });
  // the duo: screen-centre walker; jumps hop toward the camera and settle back on the line
  const jumpMoves = [];
  WALK.forEach(b => { if (b.jump) jumpMoves.push({ at: r4(b.at), dur: 0.25, y: r4(ROAD + 0.06), scale: S * 1.18, ease: 'outQuad' }, { at: r4(b.at + 0.25), dur: 0.12, y: r4(ROAD + 0.03), ease: 'inQuad' }, { at: r4(b.end + 0.1), dur: 0.45, y: ROAD, scale: S, ease: 'inOutCubic' }); });
  const walkBase = { cherry: { walk: 0.42 }, bomb: { walk: 0.42 } };
  wEls.push({ type: 'group', screen: true, x: 0.5, y: ROAD, scale: S, loop: { fx: 'bob', period: 0.21, amp: 0.7 }, moves: jumpMoves, children: blocks(WALK, walkBase, walkDur + 1) });
  wEls.push(...voices(WALK), ...captions(WALK));
  WALK.forEach(b => { if (b.jump) wEls.push(sfx('boing', b.at)); });
  wEls.push({ type: 'text', screen: true, text: '(868) 715-4817', role: 'title', size: tall ? 0.05 : 0.045, color: 'ink', x: 0.5, y: tall ? 0.12 : 0.1, highlight: { fill: 'bg', pad: 0.35 }, in: { fx: 'pop', at: WALK.find(b => b.id === 'c_swipe').at, dur: 0.4 }, loop: { fx: 'beat', period: 0.5, amp: 0.5 } });
  scenes.push({ id: 'walk', dur: walkDur, bg: 'chapter1', transition: 'cut', camera: { focus: [[fx0, 0.5], [fx1, 0.5]], zoom: [1, 1], ease: 'linear' }, elements: wEls, grade: { vignette: 0.12, grain: 0.015 } });

  // ================= SCENE 3 — they stop, turn to us, the sincere part =================
  const stopDur = r4(T_STOP + 0.8);
  const sEls = [...world(fx1, stopDur, fx1, fx1 + 0.04, false),
    { type: 'circle', r: 0.9, fill: 'bg', opacity: 0.0, x: 0.5, y: 0.45, screen: true, moves: [{ at: 0.3, dur: 2, opacity: 0.35 }] },
    { type: 'group', screen: true, x: 0.5, y: ROAD, scale: S, moves: [{ at: 0.2, dur: 1.4, scale: S * 1.12, y: r4(ROAD + 0.03), ease: 'inOutCubic' }], children: blocks(STOP, {}, stopDur + 1) },
    ...voices(STOP), ...captions(STOP)];
  scenes.push({ id: 'stop', dur: stopDur, bg: 'chapter1', transition: 'cut', camera: { focus: [[fx1, 0.5], [fx1 + 0.04, 0.5]], zoom: [1, 1.05], ease: 'inOutQuad' }, elements: sEls, grade: { vignette: 0.2, grain: 0.015, tint: 'rgba(255,200,150,0.18)' } });

  // ================= SCENE 4 — behind them at the junction, looking down the long road =================
  const jDur = r4(T_JUNC + 3.2);
  scenes.push({ id: 'junction', dur: jDur, bg: 'chapter1', transition: { type: 'zoom', dur: 0.7 }, camera: { zoom: [1, 1.12], ease: 'inOutQuad' }, grade: { vignette: 0.3, grain: 0.02, tint: 'rgba(255,190,140,0.22)' },
    elements: [...junction(), duo({ parts: PARTS, x: 0.5, y: tall ? 0.86 : 0.92, s: S * 1.15, back: true, cherry: { bodyLoop: { fx: 'jelly', period: 1.8, amp: 0.3 } }, bomb: { bodyLoop: { fx: 'jelly', period: 1.9, amp: 0.3 } } }),
      ...voices(JUNC), ...captions(JUNC), sfx('shimmer', 0.3),
      { type: 'rect', screen: true, wUnit: 'U', w: 3, h: 3, fill: '#000000', x: 0.5, y: 0.5, in: { fx: 'fade', at: r4(jDur - 1.2), dur: 1.0 }, sfx: false }] });

  // ================= SCENE 5 — black, then the logo + CTA =================
  scenes.push({ id: 'black', dur: 0.9, bg: '#000000', transition: 'cut', elements: [] });
  scenes.push({ id: 'end', dur: 6.0, bg: 'bg', transition: { type: 'iris', x: 0.5, y: 0.4, ring: 'primary', dur: 0.6 }, grade: { vignette: 0.08, grain: 0.01 },
    elements: [
      { type: 'dots', count: 20, seed: 8, fill: ['primary', 'lavender', 'mint', 'accent'], r: 0.011, motion: 'drift', area: [0.05, 0.05, 0.95, 0.95], in: { at: 0 } },
      { type: 'blob', r: tall ? 0.42 : 0.33, fill: 'chapter1', x: 0.5, y: tall ? 0.34 : 0.33, wobble: 0.08, speed: 1.2, in: { fx: 'scale', at: 0.1, dur: 0.8 } },
      { type: 'logo', w: tall ? 0.74 : 0.56, x: 0.5, y: tall ? 0.32 : 0.3, in: { fx: 'pop-soft', at: 0.35, dur: 0.6 }, loop: { fx: 'jelly', period: 1, amp: 0.5 } },
      { type: 'text', text: 'Talk to Jade', role: 'headline', size: tall ? 0.07 : 0.06, bubble: 0.015, color: 'primary', x: 0.5, y: tall ? 0.53 : 0.56, in: { fx: 'rise', at: 1.0, dur: 0.5 } },
      { type: 'text', text: '(868) 715-4817', role: 'title', size: 0.06, color: 'ink', x: 0.5, y: tall ? 0.6 : 0.65, highlight: { fill: 'chapter2', pad: 0.38 }, in: { fx: 'pop', at: 1.3, dur: 0.45 }, loop: { fx: 'beat', period: 1, amp: 0.4 } },
      { type: 'text', text: 'Order · Pre-order · Gift a box', role: 'body', size: tall ? 0.036 : 0.032, color: 'ink', x: 0.5, y: tall ? 0.665 : 0.725, in: { fx: 'fade', at: 1.7, dur: 0.4 } },
      { type: 'text', text: 'Thanks for watching ♥', role: 'caption', size: tall ? 0.03 : 0.028, color: 'primaryDeep', x: 0.5, y: tall ? 0.71 : 0.775, in: { fx: 'fade', at: 2.3, dur: 0.5 } },
      duo({ parts: PARTS, x: 0.5, y: tall ? 0.95 : 0.985, s: tall ? 0.72 : 0.48, in: { fx: 'plop', at: 1.9, dur: 0.8 }, cherry: { face: 'happy', armL: 150, armLoops: [{ fx: 'sway', period: 0.45, amp: 4 }] }, bomb: { face: 'grin', armR: -150, wave: true } }),
    ] });
  return { title: `Jadesserts — Meet Cherry & Bomb (${fmt})`, format: { w: W, h: H, fps: 30 }, bpm: 120, scenes };

  // ---------------- the world: sky, sun, clouds, hills, trees, road, foreground flowers (with parallax) ----------------
  function world(t0, d, fxA, fxB, staticCam) {
    const span = 6, par = (pf, kids) => ({ type: 'group', x: r4((1 - pf) * fxA), y: 0.5, moves: [{ at: 0, dur: d, x: r4((1 - pf) * fxB), ease: 'linear' }], children: kids });
    const els = [];
    els.push(par(0, [{ type: 'rect', wUnit: 'U', w: 3, h: r4(H / U * 1.3), grad: ['chapter2', 'chapter1', 'bg'], y: r4(-0.1 * H / U), x: 0 },
      { type: 'circle', r: 0.08, fill: 'accent', stroke: 'ink', strokeW: 0.004, x: -0.3, y: r4((tall ? 0.1 : 0.12) * H / U - 0.5 * H / U), loop: { fx: 'pulse', period: 3 } },
      { type: 'rays', r: 0.32, count: 14, fill: 'white', opacity: 0.22, x: -0.3, y: r4((tall ? 0.1 : 0.12) * H / U - 0.5 * H / U), loop: { fx: 'spin', period: 30 } }]));
    const clouds = []; for (let i = 0; i < 40; i++) clouds.push({ type: 'scallop', r: 0.06 + (i % 3) * 0.02, bumps: 9, depth: 0.12, fill: 'white', stroke: 'ink', strokeW: 0.003, x: r4(-1 + i * 0.55 + (i % 4) * 0.07), y: r4((ROAD - 0.55 - (i % 3) * 0.06) * H / U - 0.5 * H / U), loop: { fx: 'float', period: 4 + (i % 3), amp: 0.6 } });
    els.push(par(0.12, clouds));
    const hills = []; for (let i = 0; i < 70; i++) hills.push({ type: 'semicircle', r: r4(0.28 + (i % 4) * 0.07), fill: ['chapter3', 'chapter2', 'mint', 'blush'][i % 4], stroke: 'ink', strokeW: 0.004, x: r4(-1.5 + i * 0.36), y: r4((ROAD - 0.07) * H / U - 0.5 * H / U) });
    els.push(par(0.35, hills));
    const trees = []; for (let i = 0; i < 90; i++) { const x = -1.5 + i * 0.41 + (i % 3) * 0.08; trees.push({ type: 'group', x: r4(x), y: r4((ROAD - 0.075) * H / U - 0.5 * H / U), children: i % 4 === 3 ? [
      { type: 'rect', wUnit: 'U', w: 0.012, h: 0.16, fill: 'ink', anchor: 'bottom', radius: 0.004 }, { type: 'circle', r: 0.022, fill: 'accent', stroke: 'ink', strokeW: 0.003, y: -0.16, loop: { fx: 'pulse', period: 2 } }]
      : [{ type: 'rect', wUnit: 'U', w: 0.022, h: 0.1, fill: 'wood', stroke: 'ink', strokeW: 0.003, anchor: 'bottom', radius: 0.004 }, { type: 'circle', r: r4(0.055 + (i % 2) * 0.015), fill: i % 3 ? 'mint' : 'chapter3', stroke: 'ink', strokeW: 0.004, y: -0.13, loop: { fx: 'sway', period: 3 + (i % 3), amp: 0.4 } }] }); }
    els.push(par(0.7, trees));
    // road (moves 1:1) — cream road, plum edges, pink dashes
    const roadY = r4(ROAD * H / U - 0.5 * H / U);
    els.push(par(1, [
      { type: 'rect', wUnit: 'U', w: 60, h: r4(H / U), fill: 'mint', anchor: 'top', x: 20, y: r4(roadY + 0.065) },
      { type: 'rect', wUnit: 'U', w: 60, h: 0.16, fill: 'bg', x: 20, y: r4(roadY - 0.015), stroke: 'ink', strokeW: 0.004 },
      { type: 'repeat', mode: 'line', count: 260, step: [0.16, 0], x: -2, y: r4(roadY - 0.018), child: { type: 'pill', w: 0.07, wUnit: 'U', h: 0.012, fill: 'blushDeep' } },
    ]));
    const flowers = []; for (let i = 0; i < 140; i++) flowers.push({ type: 'group', x: r4(-2 + i * 0.27 + (i % 5) * 0.03), y: r4(roadY + 0.12 + (i % 3) * 0.05), children: [
      { type: 'rect', wUnit: 'U', w: 0.006, h: 0.05, fill: 'chapter3', anchor: 'bottom' }, { type: 'scallop', r: 0.024, bumps: 6, depth: 0.25, fill: ['bg', 'accent', 'primary', 'lavender'][i % 4], stroke: 'ink', strokeW: 0.003, y: -0.05, loop: { fx: 'sway', period: 2 + (i % 3) * 0.3, amp: 1 } }, { type: 'circle', r: 0.008, fill: 'toyYellow', y: -0.05 }] });
    els.push(par(1.4, flowers));
    return els;
  }

  // ---------------- story stations (behind the road; pf = 1 world objects) ----------------
  function station(kind, wx, at) {
    const y = r4(ROAD - 0.075 * H / U * U / H), base = { type: 'group', x: r4(wx), y: r4(ROAD - 0.092 * U / H), in: { fx: 'pop', at: r4(Math.max(0, at - 1.0)), dur: 0.45 }, children: [] }, k = base.children;
    const sign = (txt, yy = -0.42, fill = 'primary', col = 'onPrimary', sz = 0.045) => k.push({ type: 'group', y: yy, children: [
      { type: 'rect', wUnit: 'U', w: 0.012, h: 0.25, fill: 'wood', stroke: 'ink', strokeW: 0.003, anchor: 'top' },
      { type: 'text', text: txt, role: 'title', size: sz, weight: 800, color: col, highlight: { fill, pad: 0.38 }, bubble: 0.01 } ] });
    switch (kind) {
      case 'kitchen': k.push({ type: 'rect', wUnit: 'U', w: 0.32, h: 0.26, fill: 'blush', stroke: 'ink', strokeW: 0.004, anchor: 'bottom', radius: 0.02 },
        { type: 'poly', pts: [[-0.2, -0.26], [0.2, -0.26], [0, -0.42]], fill: 'primary', stroke: 'ink', strokeW: 0.004, radius: 0.01 },
        { type: 'rect', wUnit: 'U', w: 0.12, h: 0.1, fill: 'toyYellow', stroke: 'ink', strokeW: 0.004, y: -0.15, radius: 0.01, loop: { fx: 'pulse', period: 1.4 } },
        { type: 'circle', r: 0.04, fill: 'bg', stroke: 'ink', strokeW: 0.003, x: 0.22, y: -0.5 }, { type: 'circle', r: 0.04, fill: 'chapter1', x: 0.24, y: -0.52 });
        sign('Jade\'s kitchen', -0.58, 'bg', 'ink', 0.045); break;
      case 'treats': ['banana-bread', 'vanilla-cupcake', 'chicken-puff', 'fruit-punch'].forEach((n, i) => k.push({ type: 'image', src: PHOTO(n), w: 0.12, wUnit: 'U', anchor: 'bottom', x: r4(-0.2 + i * 0.13), y: -0.04, in: { fx: 'pop', at: r4(at - 0.8 + i * 0.12), dur: 0.35 }, loop: { fx: 'float', period: 1.6 + i * 0.2, amp: 1.2 } }));
        k.push({ type: 'rect', wUnit: 'U', w: 0.6, h: 0.04, fill: 'wood', stroke: 'ink', strokeW: 0.004, radius: 0.01, y: -0.02 }); break;
      case 'chalk': k.push({ type: 'rect', wUnit: 'U', w: 0.36, h: 0.26, fill: 'dark', stroke: 'wood', strokeW: 0.012, y: -0.3, radius: 0.01 },
        ...['try #1  ✗', 'try #2  ✗', 'try #3  ✗', 'try #47 ♥'].map((s, i) => ({ type: 'text', text: s, role: 'body', size: 0.028, color: i === 3 ? 'blush' : 'onDark', x: 0, y: r4(-0.4 + i * 0.055), in: { fx: 'type', at: r4(at - 0.4 + i * 0.4), dur: 0.3 }, sfx: false })),
        { type: 'rect', wUnit: 'U', w: 0.01, h: 0.17, fill: 'wood', anchor: 'top', x: -0.12, y: -0.17 }, { type: 'rect', wUnit: 'U', w: 0.01, h: 0.17, fill: 'wood', anchor: 'top', x: 0.12, y: -0.17 }); break;
      case 'box': k.push({ type: 'rect', wUnit: 'U', w: 0.22, h: 0.04, fill: 'lavender', stroke: 'ink', strokeW: 0.004, radius: 0.01, y: -0.02 },
        { type: 'group', y: -0.04, scale: 1.6, children: [
          { type: 'rect', wUnit: 'U', w: 0.12, h: 0.09, fill: 'blush', stroke: 'ink', strokeW: 0.003, anchor: 'bottom', radius: 0.008 },
          { type: 'rect', wUnit: 'U', w: 0.13, h: 0.025, fill: 'primary', stroke: 'ink', strokeW: 0.003, y: -0.095, radius: 0.006 },
          { type: 'rect', wUnit: 'U', w: 0.016, h: 0.09, fill: 'lavender', anchor: 'bottom' },
          { type: 'heart', r: 0.018, fill: 'lavender', stroke: 'ink', strokeW: 0.002, y: -0.12 } ] },
        { type: 'repeat', mode: 'radial', count: 8, radius: 0.2, y: -0.15, child: { type: 'sparkle', r: 0.02, fill: 'toyYellow', loop: { fx: 'pulse', period: 0.6 } } }); break;
      case 'question': k.push({ type: 'text', text: '?', role: 'display', size: 0.3, color: 'lavender', bubble: 0.04, outline: { color: 'white', w: 0.06 }, y: -0.25, loop: { fx: 'sway', period: 1.2, amp: 2 } }); break;
      case 'corners': k.push({ type: 'rect', wUnit: 'U', w: 0.3, h: 0.22, fill: 'blush', stroke: 'ink', strokeW: 0.005, anchor: 'bottom', radius: 0.004 },
        ...[[-1, -1], [1, -1]].map(([sx]) => ({ type: 'circle', r: 0.016, fill: 'toyYellow', stroke: 'ink', strokeW: 0.003, x: r4(sx * 0.15), y: -0.22, loop: { fx: 'pulse', period: 0.8 } })));
        sign('NO CORNERS CUT', -0.45, 'primary', 'onPrimary', 0.032); break;
      case 'teacher': case 'student': case 'news': case 'breakfast': {
        const L = { teacher: ['TEACHERS', 'apple'], student: ['STUDENTS', 'book'], news: ['GOOD NEWS', 'star'], breakfast: ['BREAKFAST', 'cup'] }[kind];
        k.push({ type: 'circle', r: 0.13, fill: 'bg', stroke: 'ink', strokeW: 0.005, y: -0.3 });
        if (L[1] === 'apple') k.push({ type: 'circle', r: 0.06, fill: 'primary', stroke: 'ink', strokeW: 0.004, y: -0.29 }, { type: 'pill', w: 0.04, wUnit: 'U', h: 0.022, fill: 'mint', stroke: 'ink', strokeW: 0.003, x: 0.02, y: -0.36, rot: -20 });
        if (L[1] === 'book') k.push({ type: 'rect', wUnit: 'U', w: 0.12, h: 0.09, fill: 'lavender', stroke: 'ink', strokeW: 0.004, radius: 0.008, y: -0.3, rot: -8 }, { type: 'rect', wUnit: 'U', w: 0.012, h: 0.12, fill: 'accent', stroke: 'ink', strokeW: 0.003, x: 0.06, y: -0.32, rot: 30 });
        if (L[1] === 'star') k.push({ type: 'star', r: 0.07, points: 5, inner: 0.5, round: 0.15, fill: 'toyYellow', stroke: 'ink', strokeW: 0.004, y: -0.3, loop: { fx: 'spin', period: 6 } }, { type: 'text', text: 'A+', role: 'title', size: 0.04, color: 'ink', y: -0.3 });
        if (L[1] === 'cup') k.push({ type: 'image', src: PHOTO('vanilla-cupcake'), w: 0.1, wUnit: 'U', y: -0.3 });
        sign(L[0], -0.5, 'primaryDeep', 'onPrimary', 0.03); break; }
      case 'sun': k.push({ type: 'rays', r: 0.35, count: 16, fill: 'toyYellow', opacity: 0.5, y: -0.25, loop: { fx: 'spin', period: 10 } }, { type: 'circle', r: 0.11, fill: 'toyYellow', stroke: 'ink', strokeW: 0.004, y: -0.25 },
        ...[0, 1, 2, 3].map(i => ({ type: 'heart', r: 0.025, fill: 'primary', stroke: 'ink', strokeW: 0.002, x: r4(-0.25 + i * 0.16), y: -0.15, in: { fx: 'pop', at: r4(at + i * 0.2), dur: 0.3 }, loop: { fx: 'float', period: 1.5 + i * 0.2, amp: 2 } }))); break;
      case 'free': k.push(...[0, 1, 2, 3, 4].map(i => ({ type: 'group', x: r4(-0.25 + i * 0.12), y: r4(-0.25 - (i % 2) * 0.08), moves: [{ at: r4(at), dur: 4, y: r4(-0.6 - i * 0.05), ease: 'linear' }], children: [
          { type: 'path', points: [[0, 0.02], [0.005, 0.12]], stroke: 'ink', strokeW: 0.002 }, { type: 'circle', r: 0.04, fill: ['primary', 'lavender', 'mint', 'accent', 'blushDeep'][i], stroke: 'ink', strokeW: 0.003 }] })));
        sign('FREE · KIND', -0.35, 'mint', 'ink', 0.034); break;
      case 'dream': k.push({ type: 'group', y: -0.18, scale: 1.1, children: [
          { type: 'rect', wUnit: 'U', w: 0.42, h: 0.22, fill: 'primary', stroke: 'ink', strokeW: 0.005, anchor: 'bottom', radius: 0.01 },
          { type: 'rect', wUnit: 'U', w: 0.46, h: 0.05, fill: 'blush', stroke: 'ink', strokeW: 0.004, y: -0.22, radius: 0.01 },
          { type: 'image', src: WORDMARK, w: 0.34, wUnit: 'U', y: -0.27 },
          ...[-0.13, 0, 0.13].map(x => ({ type: 'rect', wUnit: 'U', w: 0.08, h: 0.08, fill: 'toyYellow', stroke: 'ink', strokeW: 0.003, x, y: -0.1, radius: 0.008 })),
          { type: 'repeat', mode: 'radial', count: 10, radius: 0.3, y: -0.15, child: { type: 'sparkle', r: 0.02, fill: 'white', loop: { fx: 'pulse', period: 0.7 } } } ] });
        sign('ONE DAY', -0.62, 'accent', 'ink', 0.03); break;
      case 'phone': k.push({ type: 'rect', wUnit: 'U', w: 0.2, h: 0.36, fill: 'dark', stroke: 'ink', strokeW: 0.006, y: -0.3, radius: 0.03 }, { type: 'rect', wUnit: 'U', w: 0.17, h: 0.3, fill: 'bg', y: -0.3, radius: 0.015 },
        ...['Order', 'Pre-order', 'Gift', '♥'].map((s, i) => ({ type: 'text', text: s, role: 'body', size: 0.026, weight: 800, color: i % 2 ? 'ink' : 'onPrimary', x: i % 2 ? 0.02 : -0.02, y: r4(-0.4 + i * 0.065), highlight: { fill: i % 2 ? 'chapter2' : 'primary', pad: 0.4 }, in: { fx: 'pop', at: r4(at + 0.3 + i * 0.35), dur: 0.3 } }))); break;
    }
    return base;
  }
  // ---------------- the junction: a long road to the horizon at sunrise, a signpost ----------------
  function junction() {
    const hz = tall ? 0.44 : 0.42;
    return [
      { type: 'rect', screen: false, wUnit: 'U', w: 3, h: 3, grad: ['chapter2', 'chapter1', 'accent'], x: 0.5, y: r4(hz - 1.5 * U / H * 0) - 0.0, anchor: 'bottom' },
      { type: 'circle', r: 0.16, fill: 'toyYellow', stroke: 'ink', strokeW: 0.004, x: 0.5, y: hz },
      { type: 'rays', r: 0.9, count: 18, fill: 'white', opacity: 0.22, x: 0.5, y: hz, loop: { fx: 'spin', period: 40 } },
      { type: 'rect', wUnit: 'U', w: 3, h: 2, fill: 'mint', anchor: 'top', x: 0.5, y: hz },
      ...[-0.42, -0.18, 0.2, 0.44].map((x, i) => ({ type: 'semicircle', r: 0.16 + i * 0.03, fill: i % 2 ? 'chapter3' : 'chapter2', stroke: 'ink', strokeW: 0.004, x: 0.5 + x, y: hz })),
      { type: 'poly', pts: [[-0.02, 0], [0.02, 0], [0.5, r4((1 - hz) * H / U)], [-0.5, r4((1 - hz) * H / U)]], fill: 'bg', stroke: 'ink', strokeW: 0.004, x: 0.5, y: hz },
      // cross street at the junction
      { type: 'poly', pts: [[-1.2, 0.02], [1.2, 0.02], [1.2, 0.07], [-1.2, 0.07]], fill: 'bg', stroke: 'ink', strokeW: 0.004, x: 0.5, y: r4(hz + (tall ? 0.18 : 0.2)) },
      ...[0, 1, 2, 3, 4, 5].map(i => { const f = Math.pow(i / 6, 1.6); return { type: 'pill', w: r4(0.008 + f * 0.03), wUnit: 'U', h: r4(0.006 + f * 0.04), fill: 'blushDeep', x: 0.5, y: r4(hz + 0.01 + f * (1 - hz) * 0.9) }; }),
      { type: 'group', x: tall ? 0.82 : 0.8, y: r4(hz + (tall ? 0.2 : 0.22)), children: [
        { type: 'rect', wUnit: 'U', w: 0.014, h: 0.32, fill: 'wood', stroke: 'ink', strokeW: 0.003, anchor: 'bottom' },
        ...[['THE JOURNEY →', 'primary', 'onPrimary'], ['FULL BAKERY →', 'accent', 'ink'], ['YOU ♥ →', 'lavender', 'onPrimary']].map(([t, f, c], i) => ({ type: 'text', text: t, role: 'body', size: 0.026, weight: 800, color: c, highlight: { fill: f, pad: 0.4, radius: 0.004 }, x: 0.06, y: r4(-0.29 + i * 0.07), rot: (i % 2 ? 3 : -3), in: { fx: 'swing', at: r4(0.6 + i * 0.3), dur: 0.9 } })) ] },
    ];
  }
}

for (const f of ['9x16', '1x1']) {
  const story = make(f);
  fs.writeFileSync(path.join(here, `storyboard-${f}.json`), JSON.stringify(story) + '\n');
  let t = 0; console.log(f, story.scenes.map(s => { const r = `${s.id}@${t.toFixed(1)}`; t += s.dur; return r; }).join(' '), `total ${t.toFixed(1)}s`);
}
