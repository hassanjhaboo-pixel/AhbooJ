#!/usr/bin/env node
// AREA 47 · "5 CAR CRIMES": SEV judges five common car-care mistakes. 9:16 Reel, ~30s. Entertaining + informative.
// Each crime: case number, the crime slams in word by word, one plain-English reason, SEV roasts it (voiced, lip-synced),
// then a GUILTY stamp hits. Outro: "Or just let Area 47 handle it. Too clean." + booking card.
// Design follows references/anti-vibecode.md: no grain, no gradient washes, no eyebrow tags (the case counter carries data),
// slams/stamps/type-on instead of fades, condensed Big Shoulders display (trial face) + Outfit body, high-contrast text.
//   node make.mjs → story.json + cues.json + voices/ → node sound.mjs → build → render
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { voiceLines, gibberish } from '../../scripts/voice.mjs';
import { sevPuppet, sevPoint } from '../../kits/area47-sevrig.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 30;
const r4 = v => Math.round(v * 10000) / 10000;
const Y = px => r4(px / H);
const cut = at => ({ fx: 'cut', at: r4(at), dur: 0.001 });
const SH = { color: 'rgba(0,0,0,0.8)', blur: 0.02, y: 0.006 };
const cues = []; const cue = (t, kind, extra = {}) => cues.push(Object.assign({ t: r4(t), kind }, extra));

// ---------- copy: general car-care facts, SEV's voice ----------
const VOICE = { voice: 'am_onyx', speed: 1.12, pitch: 0.6, fx: 'deadpan' };
const INTRO = { id: 'intro', text: "Five car crimes. Be honest. You're guilty.", head: 'tilt', arm: 'shrug' };
const CRIMES = [
  { id: 'c1', title: 'Dish soap\non the paint', why: 'It strips the wax. Your paint loses its protection.', text: 'Dish soap on your paint? That strips the wax right off.', head: 'shake', arm: 'point' },
  { id: 'c2', title: 'The brush\ncar wash', why: 'Dirty bristles drag grit across the paint. Hello, swirl marks.', text: 'The brush car wash? Hello, swirl marks.', head: 'side' },
  { id: 'c3', title: 'One towel\nfor it all', why: 'Brake dust from the wheels ends up scratching the paint.', text: "Same towel for wheels and paint? That's brake dust. Basically sandpaper.", head: 'shake', arm: 'point' },
  { id: 'c4', title: 'Washing in\nthe hot sun', why: 'Soap dries before you rinse. The water spots stay.', text: 'Washing in the hot sun? Soap dries, spots stay.', head: 'side', arm: 'shrug' },
  { id: 'c5', title: 'Bird mess\nleft to sit', why: "It's acidic. Leave it and it can etch the clear coat.", text: 'Bird mess sitting for a week? That eats into your clear coat.', head: 'shake', arm: 'point' },
];
const OUTRO = { id: 'outro', text: 'Or just let Area 47 handle it. Too clean.', head: 'proud', arm: 'wave' };
const ALL = [INTRO, ...CRIMES, OUTRO];
// SEV speaks alien gibberish (same rhythm as the English line); the English runs as subtitles. The last words, "Too clean.", are in English.
const ALIEN = { voice: 'am_onyx', fx: 'alien', pitch: 4, speed: 1.08 };
const voiceOf = l => l.id === 'outro'
  ? Object.assign({ id: l.id, parts: [Object.assign({ text: gibberish('Or just let Area 47 handle it.') }, ALIEN), Object.assign({ text: 'Too clean.', gap: 0.22 }, VOICE)] })
  : Object.assign({ id: l.id, text: gibberish(l.text) }, ALIEN);
const V = await voiceLines(ALL.map(voiceOf), path.join(here, 'voices'));
if (Object.values(V).some(v => !v)) throw new Error('voice engine missing: bash ../../scripts/setup-tts.sh');

// ---------- timeline ----------
INTRO.at = 0.7; INTRO.dur = V.intro.dur;
let t = INTRO.at + INTRO.dur + 0.35;
CRIMES.forEach(c => {
  c.card = r4(t); c.at = r4(t + 0.45); c.dur = V[c.id].dur;
  c.stamp = r4(c.at + c.dur + 0.15); c.next = r4(c.stamp + 0.7); t = c.next;
});
OUTRO.at = r4(t + 0.1); OUTRO.dur = V.outro.dur;
const CARD = r4(OUTRO.at + OUTRO.dur - 0.85);          // "Too clean." lands on the card
const DUR = r4(OUTRO.at + OUTRO.dur + 2.8);
ALL.forEach(l => { l.env = V[l.id].env; });

// ---------- SEV (bottom right, judging) ----------
const SEV = { x: 0.62, y: 1.0488, scale: 0.95 };          // antenna tips at ~1000 px, belly at the frame edge
const els = [];
const L = x => r4(x);
const textL = (text, face, size, x, y, extra = {}) => Object.assign({ type: 'text', text, role: 'display', face, size, x, y, anchor: 'left', align: 'left', color: 'white' }, extra);

// big case number behind everything (outline, low key)
CRIMES.forEach((c, i) => els.push(textL(`0${i + 1}`, 'street', 0.62, 0.56, Y(600), { color: 'bg', outline: { color: 'cyanDeep', w: 0.012 }, opacity: 0.4, sfx: false,
  in: { fx: 'slide-left', at: c.card, dur: 0.35 }, out: cut(c.next) })));

// ---------- intro ----------
els.push(textL('5', 'street', 0.56, 0.06, Y(600), { color: 'boss', sfx: false, in: { fx: 'scale-down', at: 0.15, dur: 0.22 }, out: cut(INTRO.at + INTRO.dur + 0.35) }));
els.push(textL('CAR', 'street', 0.2, 0.37, Y(500), { sfx: false, in: { fx: 'scale-down', at: 0.35, dur: 0.2 }, out: cut(INTRO.at + INTRO.dur + 0.35) }));
els.push(textL('CRIMES', 'street', 0.2, 0.37, Y(690), { sfx: false, in: { fx: 'scale-down', at: 0.55, dur: 0.2 }, out: cut(INTRO.at + INTRO.dur + 0.35) }));
els.push(textL("Be honest. You're guilty.", 'plain', 0.05, 0.075, Y(860), { color: 'cyanSoft', role: 'body', sfx: false, in: { fx: 'type', at: INTRO.at + 0.9, dur: 0.6 }, out: cut(INTRO.at + INTRO.dur + 0.35) }));
cue(0.15, 'hit', { p: 0.9 }); cue(0.35, 'hit'); cue(0.55, 'hit', { p: 1.1 });

// ---------- crimes ----------
CRIMES.forEach((c, i) => {
  els.push(textL(`CASE 0${i + 1} OF 05`, 'hud', 0.034, 0.075, Y(330), { role: 'caption', color: 'boss', sfx: false, in: { fx: 'type', at: c.card, dur: 0.25 }, out: cut(c.next) }));
  els.push(textL(c.title, 'street', 0.16, 0.075, Y(385), { anchor: 'top-left', maxWidth: 0.95, split: 'word', stagger: 0.1, sfx: false, shadow: SH,
    in: { fx: 'scale-down', at: c.card + 0.05, dur: 0.2 }, out: cut(c.next) }));
  c.title.split(/\s+/).forEach((_, wi) => cue(c.card + 0.05 + wi * 0.1, 'hit', { p: 0.9 + wi * 0.06 }));
  els.push(textL(c.why, 'plain', 0.047, 0.075, Y(740), { anchor: 'top-left', role: 'body', color: 'cyanSoft', maxWidth: 0.84, sfx: false,
    in: { fx: 'type', at: c.at + 0.25, dur: Math.min(1.4, c.dur * 0.6) }, out: cut(c.next) }));
  // GUILTY stamp
  els.push({ type: 'group', x: 0.27, y: Y(935), rot: -8, sfx: false, in: { fx: 'scale-down', at: c.stamp, dur: 0.16, ease: 'outQuad' }, out: cut(c.next), children: [
    { type: 'rect', wUnit: 'U', w: 0.44, h: 0.13, radius: 0.014, fill: 'clear', stroke: 'boss', strokeW: 0.009 },
    { type: 'text', text: 'GUILTY', role: 'display', face: 'street', size: 0.115, color: 'boss' },
  ] });
  cue(c.stamp, 'stamp'); cue(c.next - 0.12, 'zip');
});

// ---------- translation subtitles (SEV's English, typed out under him) ----------
[INTRO, ...CRIMES].forEach(l => {
  const size = 0.038, est = l.text.length * size * 0.5, lines = Math.ceil(est / 0.84), w = r4(Math.min(0.9, est / lines + 0.07));
  els.push({ type: 'group', x: 0.5, y: Y(1560), sfx: false, in: { fx: 'cut', at: r4(l.at), dur: 0.001 }, out: cut(l.at + l.dur + 0.35), children: [
    { type: 'rect', wUnit: 'U', w, h: r4(lines * size * 1.25 + 0.034), radius: 0.01, fill: 'bg', opacity: 0.9 },
    { type: 'text', text: l.text, role: 'body', face: 'plainBold', size, color: 'white', maxWidth: 0.84, in: { fx: 'type', at: r4(l.at), dur: r4(l.dur * 0.7) } },
  ] });
});

// ---------- outro ----------
els.push(textL('Or just let', 'plain', 0.05, 0.075, Y(375), { role: 'body', color: 'cyanSoft', sfx: false, in: { fx: 'type', at: OUTRO.at, dur: 0.35 }, out: cut(CARD) }));
els.push(textL('AREA 47', 'street', 0.24, 0.075, Y(560), { color: 'primary', sfx: false, in: { fx: 'scale-down', at: OUTRO.at + 0.45, dur: 0.22 }, out: cut(CARD) }));
els.push(textL('HANDLE IT.', 'street', 0.17, 0.075, Y(740), { sfx: false, in: { fx: 'scale-down', at: OUTRO.at + 0.85, dur: 0.22 }, out: cut(CARD) }));
cue(OUTRO.at + 0.45, 'hit'); cue(OUTRO.at + 0.85, 'hit', { p: 1.1 });
// card
els.push(textL('TOO', 'street', 0.26, 0.075, Y(470), { sfx: false, in: { fx: 'scale-down', at: CARD, dur: 0.2 } }));
els.push(textL('CLEAN.', 'street', 0.26, 0.075, Y(700), { color: 'primary', sfx: false, in: { fx: 'scale-down', at: CARD + 0.25, dur: 0.2 } }));
els.push({ type: 'logo', w: 0.17, x: 0.82, y: Y(380), sfx: false, in: { fx: 'pop', at: CARD + 0.1, dur: 0.35 } });
els.push({ type: 'group', x: 0.5, y: Y(875), sfx: false, in: { fx: 'slide-left', at: CARD + 0.6, dur: 0.35 }, children: [
  { type: 'rect', wUnit: 'U', w: 0.85, h: 0.1, radius: 0.012, fill: 'primary' },
  { type: 'text', text: 'DM TO BOOK  @a47.detailing', role: 'headline', face: 'plainBold', size: 0.045, color: 'onPrimary' },
] });
els.push(textL('Cars · furniture · mobile · +1 (868) 329-5373', 'plain', 0.034, 0.075, Y(965), { role: 'body', sfx: false, in: { fx: 'type', at: CARD + 0.9, dur: 0.6 } }));
cue(CARD, 'hit'); cue(CARD + 0.25, 'hit', { p: 1.15 }); cue(CARD + 0.6, 'zip');
// grill sparkles on "too clean"
const grill = sevPoint(512, 362, SEV);
[[0.035, 0], [-0.04, 0.22]].forEach(([dx, o]) => els.push({ type: 'sparkle', r: 0.03, fill: 'white', x: r4(grill[0] + dx), y: grill[1], sfx: false,
  in: { fx: 'pop', at: r4(CARD + 0.3 + o), dur: 0.3 }, out: { fx: 'scale', at: r4(CARD + 1.1 + o), dur: 0.25 }, loop: { fx: 'spin', period: 2 } }));
cue(CARD + 0.3, 'ping', { p: 1.5 }); cue(CARD + 0.52, 'ping', { p: 1.8 });

// SEV goes on top of the background number but under the stamp layer order is fine (stamps sit left of him)
els.splice(CRIMES.length, 0, sevPuppet(Object.assign({}, SEV, { dur: DUR, lines: ALL.map(l => ({ at: l.at, dur: l.dur, env: l.env, head: l.head, arm: l.arm })),
  in: { fx: 'slide-up', at: 0.1, dur: 0.55, ease: 'outCubic' } })));
cue(0.1, 'zip'); cue(0.62, 'land');

// ---------- camera: punch on title words, jolt on every stamp ----------
const keys = [];
const punch = (at, z = 1.03, roll = 0) => keys.push({ at: r4(at), dur: 0.04, zoom: z, roll, ease: 'linear' }, { at: r4(at + 0.04), dur: 0.35, zoom: 1, roll: 0, ease: 'outCubic' });
punch(0.15, 1.05); CRIMES.forEach(c => { punch(c.card + 0.05); punch(c.stamp, 1.06, -1.2); }); punch(CARD, 1.05);

const scene = { id: 'crimes', dur: DUR, bg: 'bg', camera: { keys }, grade: { vignette: 0.25 }, elements: els };
fs.writeFileSync(path.join(here, 'story.json'), JSON.stringify({ title: 'AREA 47 · 5 Car Crimes', format: { w: W, h: H, fps: FPS }, bpm: 90, scenes: [scene], overlays: [] }));
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify({ duration: DUR, cues: cues.sort((a, b) => a.t - b.t), voices: ALL.map(l => ({ file: `voices/${V[l.id].file}`, at: l.at })) }, null, 1));
console.log(`story.json ${DUR}s · crimes at ${CRIMES.map(c => c.card).join(', ')} · card ${CARD}`);
