#!/usr/bin/env node
// Generate a soundtrack for a storyboard: a beat-synced music bed + sound effects placed exactly on the
// timeline's own events (pops, drops, wipes, logo). Pure synthesis, no samples, no network, deterministic.
//
//   node scripts/audio.mjs --story storyboards/x.json --out out/x.wav [--bed musicbox|pulse|none] [--key C] [--sfx on|off]
//   node scripts/render.mjs out/x.html --audio out/x.wav
//
// Beds:  musicbox = plucked bell arpeggio + soft bass + shaker (cute / bakery / kids / gifting)
//        pulse    = four-on-the-floor kick, claps, bass (energetic / drinks / sport)
// Every sound is royalty-free by construction (synthesised here).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
if (!args.story) { console.error('usage: audio.mjs --story <storyboard.json> [--out x.wav] [--bed musicbox|pulse|none] [--key C] [--sfx on|off] [--bed-gain 0.45] [--lufs -14] [--sfx-gain 0.6]'); process.exit(1); }

const story = JSON.parse(fs.readFileSync(args.story, 'utf8'));
const sandbox = { console }; vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'engine', 'motion.js'), 'utf8'), sandbox);
const TL = sandbox.MG.normalize(story, m => console.warn('[timeline] ' + m));

const SR = 44100, DUR = TL.duration + 0.05, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const bpm = story.bpm || 120, beat = 60 / bpm;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function add(t0, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) { const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
}
const TAU = Math.PI * 2;
const sine = f => t => Math.sin(TAU * f * t);
// band-pass filtered noise (Chamberlin state-variable filter) with a frequency sweep
function noiseSweep(f0, f1, dur, q = 0.6) {
  let low = 0, band = 0;
  return t => { const fc = f0 * Math.pow(f1 / f0, Math.min(1, t / dur)); const f = 2 * Math.sin((Math.PI * fc) / SR); const x = rnd() * 2 - 1; low += f * band; const high = x - low - q * band; band += f * high; return band * 0.6; };
}

// ---------- sound effects ----------
const SFX = {
  pop: (t0, p = 1, pan = 0, g = 1) => add(t0, 0.14, t => { const f = 520 * p * (1 + 1.1 * (1 - Math.exp(-t / 0.02))); return Math.sin(TAU * f * t) * Math.exp(-t / 0.045) * (t < 0.002 ? t / 0.002 : 1); }, 0.5 * g, pan),
  plop: (t0, pan = 0, g = 1) => {
    add(t0, 0.4, t => { const f = 170 + 150 * Math.exp(-t / 0.05) + 9 * Math.sin(TAU * 17 * t); return Math.sin(TAU * f * t) * Math.exp(-t / 0.16); }, 0.42 * g, pan);
    add(t0, 0.16, t => Math.sin(TAU * (75 - 30 * t) * t) * Math.exp(-t / 0.06), 0.55 * g, pan);
  },
  bloop: (t0, g = 1) => add(t0, 0.32, t => { const f = 300 * Math.pow(3.2, Math.min(1, t / 0.16)); return Math.sin(TAU * f * t) * Math.min(1, t / 0.008) * Math.exp(-t / 0.12); }, 0.45 * g),
  whoosh: (t0, dur = 0.45, g = 1, pan = 0) => { const ns = noiseSweep(350, 3200, dur); add(t0, dur + 0.1, t => ns(t) * Math.sin(Math.PI * Math.min(1, t / dur)), 0.55 * g, pan); },
  tick: (t0, g = 1, pan = 0) => add(t0, 0.05, t => Math.sin(TAU * 1900 * t) * Math.exp(-t / 0.012), 0.22 * g, pan),
  twinkle: (t0, g = 1, pan = 0) => { [2637, 3951].forEach((f, i) => add(t0 + i * 0.035, 0.35, t => Math.sin(TAU * f * t) * Math.exp(-t / 0.11), 0.12 * g, pan)); },
  chime: (t0, g = 1) => { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => add(t0 + i * 0.07, 1.4, t => (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t / 0.15)) * Math.exp(-t / 0.55), 0.16 * g, (i - 1.5) * 0.25)); },
  shimmer: (t0, g = 1) => { const ns = noiseSweep(4000, 9000, 0.5, 0.4); add(t0, 0.55, t => ns(t) * Math.sin(Math.PI * Math.min(1, t / 0.5)), 0.25 * g); SFX.twinkle(t0 + 0.05, 0.8 * g); },
};

// ---------- music beds ----------
const KEYS = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const root = KEYS[args.key || 'C'] ?? 0;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
// I – V – vi – IV in the chosen major key (MIDI triads)
const PROG = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
function bell(t0, midi, g = 1, pan = 0, decay = 0.55) {
  const f = hz(midi);
  add(t0, decay * 4, t => (Math.sin(TAU * f * t) + 0.28 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.2) + 0.1 * Math.sin(TAU * 3.01 * f * t) * Math.exp(-t / 0.08)) * Math.min(1, t / 0.003) * Math.exp(-t / decay), 0.17 * g, pan);
}
function bed(kind) {
  const bars = Math.ceil(TL.duration / (beat * 4));
  for (let b = 0; b < bars; b++) {
    const ch = PROG[b % 4], base = 60 + root, t0 = b * beat * 4;
    if (kind === 'musicbox') {
      const pattern = [0, 1, 2, 3, 2, 1, 2, 0]; // arpeggio up/down in eighths
      const tones = [ch[0], ch[1], ch[2], ch[0] + 12];
      pattern.forEach((pi, i) => { const tt = t0 + i * beat / 2; if (tt < TL.duration - 0.6) bell(tt, base + 12 + tones[pi], i % 2 ? 0.75 : 1, (i % 2 ? 0.25 : -0.25)); });
      [0, 2].forEach(k => { const tt = t0 + k * beat; if (tt < TL.duration - 0.6) add(tt, beat * 1.8, t => Math.sin(TAU * hz(base - 24 + ch[0]) * t) * Math.min(1, t / 0.02) * Math.exp(-t / 0.5), 0.22); });
      for (let k = 0; k < 4; k++) { const tt = t0 + (k + 0.5) * beat; const ns = noiseSweep(6000, 7000, 0.06, 0.8); if (tt < TL.duration - 0.6) add(tt, 0.07, t => ns(t) * Math.exp(-t / 0.02), 0.09, 0.3); }
    } else if (kind === 'pulse') {
      for (let k = 0; k < 4; k++) {
        const tt = t0 + k * beat; if (tt >= TL.duration - 0.4) break;
        add(tt, 0.25, t => Math.sin(TAU * (50 + 90 * Math.exp(-t / 0.03)) * t) * Math.exp(-t / 0.12), 0.5);
        if (k % 2) { const ns = noiseSweep(1200, 2500, 0.1, 0.5); add(tt, 0.15, t => ns(t) * Math.exp(-t / 0.05), 0.35); }
        [0, 0.5].forEach(o => add(tt + o * beat, beat * 0.45, t => Math.sign(Math.sin(TAU * hz(base - 24 + ch[0]) * t)) * 0.4 * Math.exp(-t / 0.15), 0.18));
      }
    }
  }
  // closing chord on the final bar so the music lands with the logo
  const endT = Math.max(0, TL.duration - 1.6);
  [0, 4, 7, 12].forEach((iv, i) => bell(endT + i * 0.05, 72 + root + iv, 0.9, (i - 1.5) * 0.2, 0.9));
}

// ---------- events from the timeline ----------
const events = [];
const ev = (kind, t, extra = {}) => { if (t >= 0 && t < TL.duration) events.push(Object.assign({ kind, t }, extra)); };
TL.scenes.forEach((sc, si) => {
  const tr = sc.transition;
  if (si > 0 && tr) {
    if (['wipe', 'push', 'cover', 'zoom', 'shrink'].includes(tr.type)) ev('whoosh', sc.start, { dur: Math.max(0.3, tr.dur) });
    else if (tr.type === 'iris') ev('whoosh', sc.start, { dur: Math.max(0.3, tr.dur), g: 0.6 });
    else if (tr.type === 'flash') ev('shimmer', sc.start);
    else if (tr.type === 'fade') ev('whoosh', sc.start, { dur: 0.5, g: 0.4 });
  }
  const visit = (el, depth) => {
    if (el.children) { if (el.in) visitIn(el, sc.start, depth); el.children.forEach(c => visit(c, depth + 1)); return; }
    if (el.in) visitIn(el, sc.start, depth);
  };
  sc.elements.forEach(el => visit(el, 0));
});
function visitIn(el, s0, depth) {
  const fx = el.in.fx, t = s0 + el.in.at, d = el.in.dur || 0.5, pan = el.x != null && depth === 0 ? (el.x - 0.5) * 1.2 : 0;
  if (el.sfx === false) return;
  if (el.sfx) { ev(el.sfx, t + (el.sfxAt || 0), { pan }); return; } // explicit override
  if (el.type === 'logo') return ev('chime', t + d * 0.25);
  if (['drop', 'drop-near'].includes(fx)) return ev('plop', t + d * 0.36, { pan });
  if (fx === 'plop') return ev('plop', t + d * 0.42, { pan });
  if (fx === 'drop-soft') return ev('pop', t + d * 0.5, { p: 0.8, pan });
  if (fx === 'dot-expand') return ev('bloop', t + d * 0.3);
  if (['pop', 'pop-soft', 'scale', 'spin-in', 'zoom-in', 'swing'].includes(fx)) return ev(el.type === 'sparkle' || el.type === 'star' ? 'twinkle' : 'pop', t + d * 0.15, { pan, p: el.type === 'heart' ? 1.25 : el.type === 'text' ? 0.9 : 1 });
  if (el.type === 'text' && ['mask-up', 'rise', 'cut', 'slide-left', 'slide-right'].includes(fx) && ['display', 'headline', 'title'].includes(el.role)) return ev('tick', t, { pan });
}
// thin out: same kind within 70ms collapses into one (keeps staggered confetti from machine-gunning)
events.sort((a, b) => a.t - b.t);
const kept = []; const last = {};
events.forEach(e => { if (last[e.kind] != null && e.t - last[e.kind] < 0.07) return; last[e.kind] = e.t; kept.push(e); });

const bedKind = args.bed || 'musicbox';
if (bedKind !== 'none') bed(bedKind);
// mix: lower the bed while SFX play, then add SFX on top
const bedGain = Number(args['bed-gain'] || 0.45), sfxGain = Number(args['sfx-gain'] || 0.6);
for (let i = 0; i < N; i++) { L[i] *= bedGain; R[i] *= bedGain; }
let popCount = 0;
if (args.sfx !== 'off') kept.forEach(e => {
  const g = (e.g || 1) * sfxGain / 0.6;
  if (e.kind === 'pop') SFX.pop(e.t, (e.p || 1) * (1 + 0.06 * ((popCount++ % 5) - 2)), e.pan || 0, g);
  else if (e.kind === 'plop') SFX.plop(e.t, e.pan || 0, g);
  else if (e.kind === 'whoosh') SFX.whoosh(e.t, e.dur || 0.45, g, e.pan || 0);
  else if (SFX[e.kind]) SFX[e.kind](e.t, g);
});
// fades + soft limiter
const fin = Math.round(0.02 * SR), fout = Math.round(0.6 * SR);
for (let i = 0; i < N; i++) {
  const env = Math.min(1, i / fin, (N - i) / fout);
  L[i] = Math.tanh(L[i] * 1.2) * env * 0.9; R[i] = Math.tanh(R[i] * 1.2) * env * 0.9;
}
// write 16-bit stereo WAV
const out = args.out || args.story.replace(/\.json$/, '.wav');
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4); buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
// Loudness-normalise for social platforms (≈ -14 LUFS integrated, -1.5 dBTP) when ffmpeg is available.
const lufs = Number(args.lufs || -14), tmp = out.replace(/\.wav$/, '') + '.raw.wav';
fs.writeFileSync(tmp, buf);
try {
  execSync(`ffmpeg -y -loglevel error -i "${tmp}" -af loudnorm=I=${lufs}:TP=-1.5:LRA=11 -ar ${SR} -c:a pcm_s16le "${out}"`);
  fs.unlinkSync(tmp);
} catch { fs.renameSync(tmp, out); console.warn('! ffmpeg loudnorm unavailable — wrote un-normalised audio'); }
const counts = kept.reduce((a, e) => ((a[e.kind] = (a[e.kind] || 0) + 1), a), {});
console.log(`audio ${out}  ${TL.duration.toFixed(2)}s, bed=${bedKind} @${bpm}bpm key ${args.key || 'C'}, sfx: ${Object.entries(counts).map(([k, v]) => `${k}×${v}`).join(' ') || 'none'}`);
