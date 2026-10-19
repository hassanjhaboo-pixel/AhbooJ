#!/usr/bin/env node
// AREA 47 · SEV range test soundtrack (same recipe as SEV talks): SEV's voice lines (voices/*.wav from make.mjs) over a laid-back 90 bpm bed, ducked under
// speech, plus the A47 sonic identity (beam, materialise zip, landing thump, grill sparkle pings, end-card hit).
//   node sound.mjs → out/range.wav (-14 LUFS). Synthesized + offline TTS, royalty-free.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { duration, cues, voices } = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));
const SR = 44100, BEAT = 0.5, BAR = 2, DUR = duration + 0.6, N = Math.ceil(DUR * SR), TAU = Math.PI * 2;
let L = new Float32Array(N), R = new Float32Array(N); const SEND = new Float32Array(N);
let seed = 47; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function add(t0, dur, fn, g = 1, pan = 0, send = 0) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR));
  for (let i = 0; i < n; i++) { const t = i / SR, p = typeof pan === 'function' ? pan(t) : pan, v = fn(t) * g;
    L[s0 + i] += v * Math.cos((p + 1) * Math.PI / 4); R[s0 + i] += v * Math.sin((p + 1) * Math.PI / 4); SEND[s0 + i] += v * send; }
}
const lp = () => { let y = 0; return (x, a) => (y += a * (x - y)); };
const saw = ph => 2 * (ph - Math.floor(ph + 0.5));
const kick = (t, g = 0.6) => add(t, 0.35, x => Math.sin(TAU * (45 * x + 90 * 0.035 * (1 - Math.exp(-x / 0.035)))) * Math.exp(-x / 0.17), g);
const hat = (t, g = 0.05) => { let hp = 0, prev = 0; add(t, 0.05, x => { const n = rnd() * 2 - 1; hp = 0.85 * (hp + n - prev); prev = n; return hp * Math.exp(-x / 0.012); }, g, 0.3); };
const clap = (t, g = 0.14) => add(t, 0.22, x => (rnd() * 2 - 1) * (Math.exp(-x / 0.05) + 0.5 * Math.exp(-Math.abs(x - 0.012) / 0.004)), g, -0.1, 0.5);
const pad = (t0, dur, ch, g = 0.045) => ch.forEach(m => [-0.08, 0.08].forEach((det, v) => { const f = hz(m + det), F = lp(); let ph = rnd();
  add(t0, dur, t => { ph += f / SR; return F(saw(ph), 0.035) * Math.min(1, t / 0.25) * Math.min(1, (dur - t) / 0.5); }, g, v ? 0.45 : -0.45, 0.6); }));
const sub = (t0, m, len, g = 0.24) => { let ph = 0; const f = hz(m); add(t0, len, x => { ph += f / SR; return Math.sin(TAU * ph) * Math.exp(-x / 0.25) * Math.min(1, x / 0.004); }, g); };

// ---------- bed: 90 bpm, Am – F – C – G, kick + sub + hats; ducked under the voice ----------
const BPM = 90, BT = 60 / BPM, BR = 4 * BT;
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const bed = { L: new Float32Array(N), R: new Float32Array(N) };
{ const sL = L, sR = R; L = bed.L; R = bed.R;
  for (let b = 0; b * BR < duration; b++) pad(b * BR, BR + 0.4, PROG[b % 4], 0.035);
  for (let i = 0; i * BT < duration - 0.2; i++) { const t = i * BT; if (t < 1.0) continue; const ch = PROG[Math.floor(t / BR) % 4];
    if (i % 4 !== 3) kick(t, 0.5); sub(t, ch[0] - 24, BT * 0.9, 0.2); if (i % 2) clap(t, 0.1); hat(t + BT / 2, 0.045); hat(t + 3 * BT / 4, 0.025); }
  L = sL; R = sR; }
// voices
const readWav = f => { const b = fs.readFileSync(f); let o = 12; while (b.toString('ascii', o, o + 4) !== 'data') o += 8 + b.readUInt32LE(o + 4);
  const n = b.readUInt32LE(o + 4) / 2, out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = b.readInt16LE(o + 8 + i * 2) / 32768; return out; };
const voiceEnv = new Float32Array(N);
(voices || []).forEach(({ file, at }) => { const v = readWav(path.join(here, file)), s0 = Math.round(at * SR);
  for (let i = 0; i < v.length && s0 + i < N; i++) { L[s0 + i] += v[i] * 0.9; R[s0 + i] += v[i] * 0.9; SEND[s0 + i] += v[i] * 0.06; voiceEnv[s0 + i] = 1; } });
// duck: smooth gain on the bed while SEV talks
{ let g = 1; for (let i = 0; i < N; i++) { const target = voiceEnv[Math.min(N - 1, i + 2000)] ? 0.32 : 1; g += (target - g) * (target < g ? 0.0012 : 0.00015); L[i] += bed.L[i] * g; R[i] += bed.R[i] * g; } }
// ---------- sonic identity ----------
const S = {
  draw: t0 => { let ph = 0; add(t0, 0.6, t => { ph += (250 + 1400 * t) / SR; return Math.sin(TAU * ph) * 0.5 * Math.sin(Math.PI * t / 0.6); }, 0.08, t => -0.8 + 1.6 * t / 0.6, 0.3); },
  hit: (t0, p = 1) => { add(t0, 0.5, t => Math.sin(TAU * (40 * p * t + 80 * 0.05 * (1 - Math.exp(-t / 0.05)))) * Math.exp(-t / 0.2), 0.45);
    add(t0, 0.04, t => (rnd() * 2 - 1) * Math.exp(-t / 0.007), 0.3); add(t0, 0.25, t => Math.sin(TAU * hz(76) * p * t) * Math.exp(-t / 0.06), 0.05, 0, 0.4); },
  beam: t0 => { const F = lp(); add(t0, 0.75, t => F(rnd() * 2 - 1, 0.02 + 0.5 * (t / 0.75) ** 2) * Math.sin(Math.PI * Math.min(1, t / 0.75)), 0.4, 0, 0.3);
    let ph = 0; add(t0, 0.75, t => { ph += 180 * Math.pow(6, t / 0.75) / SR; return Math.sin(TAU * ph) * (t / 0.75) * Math.exp(-Math.max(0, t - 0.6) * 20); }, 0.14);
    [[1318.5, 0.66], [1975.5, 0.8]].forEach(([f, at]) => add(t0 + at, 1.2, t => Math.sin(TAU * f * t) * Math.exp(-t / 0.45) * Math.min(1, t / 0.004), 0.14, 0, 0.5)); },
  tick: t0 => add(t0, 0.05, t => Math.sin(TAU * 2400 * t) * Math.exp(-t / 0.01), 0.08),
  zip: t0 => { const F = lp(); add(t0, 0.3, t => F(rnd() * 2 - 1, 0.05 + 0.6 * t / 0.3) * Math.sin(Math.PI * t / 0.3), 0.3, t => -0.6 + 1.2 * t / 0.3, 0.2); },
  slam: t0 => { kick(t0, 0.7); add(t0, 1.4, t => (rnd() * 2 - 1) * Math.exp(-t / 0.35), 0.16, 0, 0.8);
    [[1318.5, 0.05], [1975.5, 0.19]].forEach(([f, at]) => add(t0 + at, 1.4, t => Math.sin(TAU * f * t) * Math.exp(-t / 0.5) * Math.min(1, t / 0.004), 0.13, 0, 0.6)); },
  stamp: t0 => { add(t0, 0.5, t => Math.sin(TAU * (38 * t + 110 * 0.03 * (1 - Math.exp(-t / 0.03)))) * Math.exp(-t / 0.16), 0.75);
    const F = lp(); add(t0, 0.18, t => F(rnd() * 2 - 1, 0.35) * Math.exp(-t / 0.035), 0.55, 0, 0.3); add(t0 + 0.012, 0.08, t => (rnd() * 2 - 1) * Math.exp(-t / 0.01), 0.25, 0.2); },
  step: t0 => { add(t0, 0.12, t => Math.sin(TAU * (70 * t + 40 * 0.02 * (1 - Math.exp(-t / 0.02)))) * Math.exp(-t / 0.05), 0.35); add(t0 + 0.01, 0.04, t => (rnd() * 2 - 1) * Math.exp(-t / 0.008), 0.12, 0.2); },
  scan: t0 => { const F = lp(); add(t0, 1.6, t => F(rnd() * 2 - 1, 0.06 + 0.1 * Math.sin(t * 9)) * Math.sin(Math.PI * t / 1.6), 0.3, t => Math.sin(t * 9) * 0.8, 0.2); },
  land: t0 => { kick(t0, 0.55); add(t0, 0.4, t => (rnd() * 2 - 1) * Math.exp(-t / 0.08), 0.12, 0, 0.5); },
  ping: (t0, p = 1) => add(t0, 0.5, t => (Math.sin(TAU * 1760 * p * t) + 0.3 * Math.sin(TAU * 3520 * p * t) * Math.exp(-t / 0.05)) * Math.exp(-t / 0.18) * Math.min(1, t / 0.003), 0.09, 0, 0.4),
};
cues.forEach(c => (S[c.kind] || (() => {}))(c.t, c.p || 1));
// ---------- reverb send + master ----------
{ const combs = [1557, 1617, 1491, 1422].map(n => ({ b: new Float32Array(n), i: 0 })), aps = [225, 556].map(n => ({ b: new Float32Array(n), i: 0 }));
  for (let i = 0; i < N; i++) { let y = 0; combs.forEach(c => { const o = c.b[c.i]; c.b[c.i] = SEND[i] * 0.15 + o * 0.82; c.i = (c.i + 1) % c.b.length; y += o; });
    aps.forEach(a => { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = o - y * 0.5; }); L[i] += y * 0.45; R[i] += y * 0.42; } }
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { const e = Math.min(1, (N - i) / (SR * 0.8)); buf.writeInt16LE(Math.round(Math.tanh(L[i] * 1.2) * e * 30000), 44 + i * 4); buf.writeInt16LE(Math.round(Math.tanh(R[i] * 1.2) * e * 30000), 46 + i * 4); }
fs.mkdirSync(path.join(here, 'out'), { recursive: true });
const raw = path.join(here, 'out', 'range.raw.wav'), wav = path.join(here, 'out', 'range.wav');
fs.writeFileSync(raw, buf); execSync(`ffmpeg -y -loglevel error -i "${raw}" -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar ${SR} "${wav}"`); fs.unlinkSync(raw);
console.log(`out/range.wav ${DUR.toFixed(1)}s · ${cues.length} cues`);
