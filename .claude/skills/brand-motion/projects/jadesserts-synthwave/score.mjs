#!/usr/bin/env node
// Synthwave score for "Jadesserts — SWEET.WAV" + its spectrum analysis.
// 120 bpm, A minor (Am–F–C–G), 16 bars = 32 s. Pure synthesis, deterministic, royalty-free by construction.
//   node score.mjs → out/synth.wav (loudness-normalised) + out/spectrum.json (per-frame bands, kick/snare envelopes)
// Arrangement (bars are 2 s): 1–2 boot (pad + filtered arp) · 3 kick+hats · 4 bass · 5–8 full groove · 9–11 lead ·
// 12 break (last 2 beats silent, riser) · 13–14 DROP (crash, everything) · 15–16 outro (drums out on 16, pad rings).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out'); fs.mkdirSync(OUT, { recursive: true });
const SR = 44100, BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4, BARS = 16, DUR = BARS * BAR + 1.2, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N), SEND = new Float32Array(N), DLY = new Float32Array(N);
const TAU = Math.PI * 2, hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const bar = b => (b - 1) * BAR;                       // bar numbers are 1-based like the arrangement notes

// ---------- building blocks ----------
function biquadLP(fc, q = 0.7) { // RBJ low-pass; fc may be a function of time
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, t) => { const f = Math.min(18000, typeof fc === 'function' ? fc(t) : fc), w = TAU * f / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
    const b0 = (1 - c) / 2, b1 = 1 - c, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    const y = (b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
const saw = ph => 2 * (ph - Math.floor(ph + 0.5));
const sq = (ph, pw = 0.5) => (ph % 1 < pw ? 1 : -1);
function put(t0, dur, fn, { g = 1, pan = 0, send = 0, delay = 0 } = {}) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR));
  const gl = g * Math.cos((pan + 1) * Math.PI / 4), gr = g * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) { const v = fn(i / SR, t0 + i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; SEND[s0 + i] += v * send * g; DLY[s0 + i] += v * delay * g; }
}
const adsr = (t, a, d, s, rel, len) => (t < a ? t / a : t < a + d ? 1 - (1 - s) * (t - a) / d : t < len ? s : Math.max(0, s * (1 - (t - len) / rel)));

// ---------- harmony ----------
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];  // Am F C G (MIDI)
const chordAt = b => PROG[(b - 1) % 4];
const events = { kick: [], snare: [], crash: [], hits: [] };

// pad: 5-voice detuned supersaw per chord tone, slow attack, low-passed
function pad(b, len = BAR, g = 0.09, open = 1800) {
  chordAt(b).forEach((m, k) => [-0.12, -0.05, 0, 0.05, 0.12].forEach((det, v) => {
    const f = hz(m + det) , lp = biquadLP(t => open * (0.7 + 0.3 * Math.sin(t * 0.7)));
    let ph = rnd();
    put(bar(b), len + 1.2, t => { ph += f / SR; return lp(saw(ph), t) * adsr(t, 0.6, 0.4, 0.8, 1.0, len); }, { g: g / 3, pan: (v - 2) * 0.35, send: 0.5 });
  }));
}
// arpeggio: 16ths over the chord, plucky square through a cutoff that opens over the intro
function arp(b, cutoff, g = 0.11) {
  const ch = chordAt(b), seq = [0, 1, 2, 3, 2, 1, 2, 0, 0, 1, 2, 3, 2, 1, 3, 2];
  seq.forEach((s, i) => {
    const m = (s === 3 ? ch[0] + 12 : ch[s]) + 12, f = hz(m), t0 = bar(b) + i * BEAT / 4, lp = biquadLP(cutoff(t0), 2.5);
    let ph = 0;
    put(t0, 0.3, t => { ph += f / SR; return lp(sq(ph, 0.3), t) * Math.exp(-t / 0.07) * Math.min(1, t / 0.002); }, { g, pan: i % 2 ? 0.3 : -0.3, delay: 0.35, send: 0.15 });
  });
}
// bass: 8th-note octave pulse, saw through a resonant LP, side-chained to the kick
function bass(b, g = 0.2) {
  const root = chordAt(b)[0] - 24;
  for (let i = 0; i < 8; i++) {
    const m = root + (i % 2 ? 12 : 0), f = hz(m), t0 = bar(b) + i * BEAT / 2, lp = biquadLP(t => 380 + 1400 * Math.exp(-t / 0.08), 1.6);
    let ph = 0, ph2 = 0.3;
    put(t0, BEAT / 2, (t) => { ph += f / SR; ph2 += f * 1.005 / SR; const duck = i % 2 ? 1 : Math.min(1, t / 0.09); return lp(saw(ph) + saw(ph2), t) * duck * adsr(t, 0.004, 0.1, 0.7, 0.03, BEAT / 2 - 0.03); }, { g });
  }
}
const kick = (t0, g = 0.9) => { events.kick.push(t0); put(t0, 0.45, t => Math.sin(TAU * (45 * t + 85 * 0.04 * (1 - Math.exp(-t / 0.04)))) * Math.exp(-t / 0.28) * Math.min(1, t / 0.001) + (t < 0.004 ? (rnd() * 2 - 1) * 0.4 : 0), { g }); };
const snare = (t0, g = 0.45) => { events.snare.push(t0); const lp = biquadLP(6500); put(t0, 0.32, t => (lp(rnd() * 2 - 1, t) * Math.exp(-t / 0.09) + Math.sin(TAU * 185 * t) * Math.exp(-t / 0.05) * 0.6) * (t < 0.26 ? 1 : 0), { g, send: 0.9 }); };
const hat = (t0, open = false, g = 0.12) => { let hp = 0, prev = 0; put(t0, open ? 0.3 : 0.06, t => { const x = rnd() * 2 - 1; hp = 0.85 * (hp + x - prev); prev = x; return hp * Math.exp(-t / (open ? 0.12 : 0.018)); }, { g, pan: open ? 0.25 : -0.2 }); };
const crash = (t0, g = 0.3) => { events.crash.push(t0); let hp = 0, prev = 0; put(t0, 2.6, t => { const x = rnd() * 2 - 1; hp = 0.7 * (hp + x - prev); prev = x; return hp * Math.exp(-t / 0.9); }, { g, send: 0.4 }); };
const riser = (t0, dur, g = 0.25) => { const lp = biquadLP(t => 300 + 9000 * Math.pow((t - t0) / dur, 2), 4); put(t0, dur, (t, abs) => lp(rnd() * 2 - 1, abs) * Math.pow(t / dur, 1.5), { g, send: 0.3 }); };
function lead(notes, g = 0.12) { // [bar, beat, midi, beats]
  notes.forEach(([b, bt, m, len]) => { const f = hz(m), t0 = bar(b) + bt * BEAT, d = len * BEAT, lp = biquadLP(3200, 1.2); let ph = 0, ph2 = 0;
    put(t0, d + 0.2, t => { const vib = 1 + 0.006 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.25); ph += f * vib / SR; ph2 += f * vib * 1.004 / SR; return lp(sq(ph, 0.42) * 0.6 + saw(ph2) * 0.5, t) * adsr(t, 0.01, 0.15, 0.7, 0.15, d); }, { g, delay: 0.45, send: 0.35 });
    events.hits.push(t0); });
}

// ---------- arrangement ----------
for (let b = 1; b <= 16; b++) {
  const full = b >= 5 && b !== 16, drop = b >= 13 && b <= 14;
  pad(b, BAR, b <= 2 ? 0.08 : b >= 15 ? 0.1 : 0.07, b <= 2 ? 900 + b * 500 : drop ? 3400 : 2200);
  if (b !== 12) arp(b, t0 => (b <= 4 ? 500 + ((t0) / bar(5)) * 3500 : drop ? 6500 : 4200), b <= 2 ? 0.08 : 0.1);
  else arp(b, () => 4200 - 0, 0.09);                                           // bar 12 keeps the arp but the break mutes its 2nd half below
  if (b >= 4 && b !== 16) bass(b, drop ? 0.24 : 0.2);
  for (let k = 0; k < 4; k++) {
    const t = bar(b) + k * BEAT;
    if (b === 12 && k >= 2) continue;                                          // the break
    if (b >= 3 && b <= 15) kick(t, drop ? 1 : 0.9);
    if (full && (k === 1 || k === 3)) snare(t, drop ? 0.55 : 0.45);
    if (b >= 3 && b <= 15) { hat(t + BEAT / 2, b >= 5); if (b >= 5) { hat(t + BEAT / 4, false, 0.07); hat(t + 3 * BEAT / 4, false, 0.07); } }
  }
}
riser(bar(12), BAR, 0.3);
crash(bar(5), 0.22); crash(bar(13), 0.35); crash(bar(15), 0.2);
// lead: a hooky line (bars 9–11, then doubled on the drop)
const H = [[0, 76, 1], [1, 74, 0.5], [1.5, 72, 0.5], [2, 69, 1.5], [3.5, 72, 0.5]];
const hook = (b, up = 0) => H.map(([bt, m, l]) => [b, bt, m + up, l]);
lead([...hook(9), [10, 0, 72, 1], [10, 1, 72, 0.5], [10, 1.5, 74, 0.5], [10, 2, 76, 2], ...hook(11), ...hook(13), [14, 0, 79, 1], [14, 1, 77, 0.5], [14, 1.5, 76, 0.5], [14, 2, 74, 1], [14, 3, 76, 1], ...hook(15)], 0.12);
// final chord swell + sparkle on the logo
[69, 72, 76, 81].forEach((m, i) => { const f = hz(m); put(bar(16) + i * 0.06, 3, t => Math.sin(TAU * f * t) * Math.exp(-t / 1.2) * Math.min(1, t / 0.01), { g: 0.08, send: 0.6, delay: 0.3 }); });

// mute everything except riser/reverb tails in the break (beats 3–4 of bar 12)
const b0 = Math.round((bar(12) + 2 * BEAT) * SR), b1 = Math.round(bar(13) * SR);
for (let i = b0; i < b1; i++) { const k = Math.max(0, 1 - (i - b0) / (SR * 0.06)); L[i] *= k; R[i] *= k; DLY[i] *= k; }

// ---------- effects: ping-pong dotted-8th delay + Schroeder reverb ----------
{ const dt = Math.round(BEAT * 0.75 * SR); let fbL = new Float32Array(dt), fbR = new Float32Array(dt);
  for (let i = 0; i < N; i++) { const j = i % dt, dl = fbL[j], dr = fbR[j]; L[i] += dl * 0.5; R[i] += dr * 0.5; fbL[j] = DLY[i] + dr * 0.38; fbR[j] = dl * 0.38; } }
{ const combs = [1557, 1617, 1491, 1422].map(n => ({ b: new Float32Array(n), i: 0, f: 0.82 })), aps = [225, 556].map(n => ({ b: new Float32Array(n), i: 0 }));
  for (let i = 0; i < N; i++) {
    let y = 0; combs.forEach(c => { const o = c.b[c.i]; c.b[c.i] = SEND[i] * 0.15 + o * c.f; c.i = (c.i + 1) % c.b.length; y += o; });
    aps.forEach(a => { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = o - y * 0.5; });
    L[i] += y * 0.55; R[i] += y * 0.5;
  } }
// master: gentle glue + soft clip + fades
for (let i = 0; i < N; i++) { const env = Math.min(1, i / (SR * 0.01), (N - i) / (SR * 1.0)); L[i] = Math.tanh(L[i] * 1.3) * env * 0.85; R[i] = Math.tanh(R[i] * 1.3) * env * 0.85; }

// ---------- write wav + loudness-normalise ----------
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4); buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4); }
const raw = path.join(OUT, 'synth.raw.wav'), wav = path.join(OUT, 'synth.wav');
fs.writeFileSync(raw, buf);
execSync(`ffmpeg -y -loglevel error -i "${raw}" -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar ${SR} -c:a pcm_s16le "${wav}"`); fs.unlinkSync(raw);

// ---------- spectrum: 32 log bands per video frame (what the equalizer shows IS the music) ----------
const FPS = 30, NF = Math.ceil(BARS * BAR * FPS) + 30, FFT = 2048, NB = 32, mono = new Float32Array(N);
for (let i = 0; i < N; i++) mono[i] = (L[i] + R[i]) / 2;
function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -TAU / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } } }
const edges = Array.from({ length: NB + 1 }, (_, i) => 40 * Math.pow(14000 / 40, i / NB));
const raw2 = [];
for (let f = 0; f < NF; f++) {
  const c = Math.round(f / FPS * SR), re = new Float64Array(FFT), im = new Float64Array(FFT);
  for (let i = 0; i < FFT; i++) { const s = c - FFT / 2 + i; re[i] = (s >= 0 && s < N ? mono[s] : 0) * (0.5 - 0.5 * Math.cos(TAU * i / (FFT - 1))); }
  fft(re, im);
  raw2.push(Array.from({ length: NB }, (_, b) => { const k0 = Math.max(1, Math.floor(edges[b] * FFT / SR)), k1 = Math.max(k0 + 1, Math.ceil(edges[b + 1] * FFT / SR)); let s = 0; for (let k = k0; k < k1; k++) s += Math.hypot(re[k], im[k]); return Math.log10(1 + s / (k1 - k0)); }));
}
// per-band floor/ceiling (20th/98th percentile) + a contrast curve, so bars swing between quiet and full instead of sitting high
const pct = (b, q) => { const v = raw2.map(r => r[b]).sort((x, y) => x - y); return v[Math.floor(v.length * q)] || 0; };
const lo = Array.from({ length: NB }, (_, b) => pct(b, 0.2)), hi = Array.from({ length: NB }, (_, b) => Math.max(lo[b] + 1e-3, pct(b, 0.985)));
const prev = new Array(NB).fill(0);
const bands = raw2.map(r => r.map((v, b) => { const x = Math.pow(Math.min(1, Math.max(0, (v - lo[b]) / (hi[b] - lo[b]))), 1.7); const y = Math.max(x, prev[b] * 0.72); prev[b] = y; return Math.round(y * 99); }));
const envOf = (times, decay) => Array.from({ length: NF }, (_, f) => { const t = f / FPS; let e = 0; times.forEach(k => { if (t >= k) e = Math.max(e, Math.exp(-(t - k) / decay)); }); return Math.round(e * 99); });
fs.writeFileSync(path.join(OUT, 'spectrum.json'), JSON.stringify({ fps: FPS, bpm: BPM, bars: BARS, bands, kick: envOf(events.kick, 0.12), snare: envOf(events.snare, 0.1), crash: envOf(events.crash, 0.6), lead: envOf(events.hits, 0.25) }));
console.log(`synth.wav ${DUR.toFixed(1)}s · ${events.kick.length} kicks · ${events.snare.length} snares · spectrum ${NF}×${NB}`);
