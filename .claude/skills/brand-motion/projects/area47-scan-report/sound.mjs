#!/usr/bin/env node
// AREA 47 · Scan Report soundtrack: dark minimal synth bed (100 bpm) + the A47 sonic identity on cues.json.
//   BEAM (audio logo: rise + E6→B6 ping) · DRAW (blueprint zip) · SCAN (sweep) · PING (callout lock-on, pitch by row)
//   HIT (sub thump on headers) · METER (rising tone, length by coverage) · BLOOP (SEV)
//   node sound.mjs → out/scan.wav (-14 LUFS). Royalty-free, synthesized.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { duration, cues } = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));
const SR = 44100, BEAT = 0.6, BAR = 2.4, DUR = duration + 0.8, N = Math.ceil(DUR * SR), TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N), SEND = new Float32Array(N);
let seed = 47; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function add(t0, dur, fn, g = 1, pan = 0, send = 0) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR));
  for (let i = 0; i < n; i++) { const t = i / SR, p = typeof pan === 'function' ? pan(t) : pan, v = fn(t) * g;
    L[s0 + i] += v * Math.cos((p + 1) * Math.PI / 4); R[s0 + i] += v * Math.sin((p + 1) * Math.PI / 4); SEND[s0 + i] += v * send; }
}
const lp = () => { let y = 0; return (x, a) => (y += a * (x - y)); };
const saw = ph => 2 * (ph - Math.floor(ph + 0.5));

// ---------- bed: Am – F – C – G, one chord per bar ----------
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const bars = Math.ceil(duration / BAR), endAt = duration - 4.8;   // the end card gets a lighter, open bed
for (let b = 0; b < bars; b++) {
  const t0 = b * BAR, ch = PROG[b % 4], intro = b === 0;
  ch.forEach((m, k) => [-0.07, 0.07].forEach((det, v) => { const f = hz(m + det), F = lp(); let ph = rnd();
    add(t0, BAR + 0.6, t => { ph += f / SR; const e = Math.min(1, t / 0.5) * (t < BAR ? 1 : Math.max(0, 1 - (t - BAR) / 0.6)); return F(saw(ph), 0.04) * e; }, 0.05, v ? 0.4 : -0.4, 0.6); }));
  if (intro) continue;
  const root = hz(ch[0] - 24);
  for (let i = 0; i < 8; i++) { const t = t0 + i * BEAT / 2; let ph = 0; if (t >= duration - 0.3) break;
    add(t, BEAT / 2, x => { ph += root * (i % 2 ? 2 : 1) / SR; return Math.sin(TAU * ph) * Math.exp(-x / 0.18) * Math.min(1, x / 0.004); }, 0.26); }
  for (let k = 0; k < 4; k++) { const t = t0 + k * BEAT; if (t >= duration - 0.3) break;
    add(t, 0.3, x => Math.sin(TAU * (48 * x + 60 * 0.04 * (1 - Math.exp(-x / 0.04)))) * Math.exp(-x / 0.16), t >= endAt ? 0.4 : 0.55);
    [0.5, 0.75].forEach((o, j) => { let hp = 0, prev = 0; add(t + o * BEAT, 0.05, x => { const n = rnd() * 2 - 1; hp = 0.85 * (hp + n - prev); prev = n; return hp * Math.exp(-x / 0.012); }, j ? 0.04 : 0.07, 0.3); });
    if (k % 2) add(t, 0.25, x => (rnd() * 2 - 1) * Math.exp(-x / 0.06), 0.12, -0.1, 0.6); }
}
// ---------- sonic identity ----------
const S = {
  beam: t0 => { const F = lp(); add(t0, 0.75, t => F(rnd() * 2 - 1, 0.02 + 0.5 * (t / 0.75) ** 2) * Math.sin(Math.PI * Math.min(1, t / 0.75)), 0.4, 0, 0.3);
    let ph = 0; add(t0, 0.75, t => { ph += 180 * Math.pow(6, t / 0.75) / SR; return Math.sin(TAU * ph) * (t / 0.75) * Math.exp(-Math.max(0, t - 0.6) * 20); }, 0.14);
    [[1318.5, 0.66], [1975.5, 0.8]].forEach(([f, at]) => add(t0 + at, 1.2, t => Math.sin(TAU * f * t) * Math.exp(-t / 0.45) * Math.min(1, t / 0.004), 0.14, 0, 0.5)); },
  draw: t0 => { let ph = 0; add(t0, 1.1, t => { ph += (300 + 900 * t) / SR; return Math.sin(TAU * ph) * 0.5 * Math.sin(Math.PI * t / 1.1); }, 0.08, t => -0.8 + 1.6 * t / 1.1, 0.3); },
  scan: t0 => { const F = lp(); add(t0, 0.9, t => F(rnd() * 2 - 1, 0.08) * Math.sin(Math.PI * t / 0.9), 0.35, t => -0.9 + 2 * t / 0.9, 0.2); },
  ping: (t0, p = 1) => add(t0, 0.5, t => (Math.sin(TAU * 1760 * p * t) + 0.3 * Math.sin(TAU * 3520 * p * t) * Math.exp(-t / 0.05)) * Math.exp(-t / 0.18) * Math.min(1, t / 0.003), 0.09, (p - 1.2) * 3, 0.4),
  hit: t0 => { add(t0, 0.5, t => Math.sin(TAU * (42 * t + 70 * 0.05 * (1 - Math.exp(-t / 0.05)))) * Math.exp(-t / 0.22), 0.6); add(t0, 0.03, t => (rnd() * 2 - 1) * Math.exp(-t / 0.006), 0.25); },
  meter: (t0, pct = 50) => { const d = 0.3 + pct / 140; let ph = 0; add(t0, d + 0.2, t => { ph += (440 + 880 * Math.min(1, t / d) * pct / 100) / SR; return (ph % 1 < 0.5 ? 0.4 : -0.4) * Math.min(1, t / 0.01) * (t < d ? 1 : Math.exp(-(t - d) / 0.06)); }, 0.06, 0, 0.3);
    if (pct === 100) [76, 79, 84, 88].forEach((m, i) => add(t0 + d + i * 0.06, 0.8, t => Math.sin(TAU * hz(m) * t) * Math.exp(-t / 0.3), 0.08, (i - 1.5) * 0.3, 0.6)); },
  bloop: t0 => { let ph = 0; add(t0, 0.25, t => { ph += 260 * Math.pow(3, Math.min(1, t / 0.12)) / SR; return Math.sin(TAU * ph) * Math.exp(-t / 0.09); }, 0.3, 0.3); },
};
cues.forEach(c => (S[c.kind] || (() => {}))(c.t, c.kind === 'meter' ? c.pct : c.p || 1));
// ---------- reverb (send) + master ----------
{ const combs = [1557, 1617, 1491, 1422].map(n => ({ b: new Float32Array(n), i: 0 })), aps = [225, 556].map(n => ({ b: new Float32Array(n), i: 0 }));
  for (let i = 0; i < N; i++) { let y = 0; combs.forEach(c => { const o = c.b[c.i]; c.b[c.i] = SEND[i] * 0.15 + o * 0.82; c.i = (c.i + 1) % c.b.length; y += o; });
    aps.forEach(a => { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = o - y * 0.5; }); L[i] += y * 0.45; R[i] += y * 0.42; } }
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { const e = Math.min(1, (N - i) / (SR * 0.8)); buf.writeInt16LE(Math.round(Math.tanh(L[i] * 1.2) * e * 30000), 44 + i * 4); buf.writeInt16LE(Math.round(Math.tanh(R[i] * 1.2) * e * 30000), 46 + i * 4); }
fs.mkdirSync(path.join(here, 'out'), { recursive: true });
const raw = path.join(here, 'out', 'scan.raw.wav'), wav = path.join(here, 'out', 'scan.wav');
fs.writeFileSync(raw, buf); execSync(`ffmpeg -y -loglevel error -i "${raw}" -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar ${SR} "${wav}"`); fs.unlinkSync(raw);
console.log(`out/scan.wav ${DUR.toFixed(1)}s · ${cues.length} cues`);
