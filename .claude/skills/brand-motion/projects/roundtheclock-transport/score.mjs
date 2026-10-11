#!/usr/bin/env node
// Score for "Round The Clock Transport": a soca / calypso groove with a steelpan lead and the "iron" (brake-drum) rhythm.
// 120 bpm, C major (C–Am | F–G), 17 bars = 34 s. Pure synthesis, deterministic, royalty-free by construction.
//   node score.mjs → out/score.wav (loudness-normalised to -14 LUFS)
// Arrangement follows the storyboard (bars are 2 s):
//   1 hook: clock tick-tock, pad swell, pan pickup + riser · 2 drop: crash, groove + steelpan hook (the van appears)
//   2–11 groove, melody A B A' B' · 12 (22–23 s) break: drums out, riser · 23 s DROP on the offer: crash, full band
//   16 end card: groove · 17 drums out, final rolled C-major chord on pan rings under the logo
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out'); fs.mkdirSync(OUT, { recursive: true });
const SR = 44100, BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4, BARS = 17, DUR = BARS * BAR + 0.05, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N), SEND = new Float32Array(N), DLY = new Float32Array(N);
const TAU = Math.PI * 2, hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 13; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const bar = b => (b - 1) * BAR;
const BREAK = [22.0, 23.0], DROP = 23.0, END = 32.0;
const inBreak = t => t >= BREAK[0] && t < BREAK[1];

function biquadLP(fc, q = 0.7) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, t) => { const f = Math.min(18000, typeof fc === 'function' ? fc(t) : fc), w = TAU * f / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
    const b0 = (1 - c) / 2, b1 = 1 - c, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    const y = (b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
const saw = ph => 2 * (ph - Math.floor(ph + 0.5));
function put(t0, dur, fn, { g = 1, pan = 0, send = 0, delay = 0 } = {}) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR));
  const gl = g * Math.cos((pan + 1) * Math.PI / 4), gr = g * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) { const v = fn(i / SR, t0 + i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; SEND[s0 + i] += v * send * g; DLY[s0 + i] += v * delay * g; }
}
const adsr = (t, a, d, s, rel, len) => (t < a ? t / a : t < a + d ? 1 - (1 - s) * (t - a) / d : t < len ? s : Math.max(0, s * (1 - (t - len) / rel)));

// ---------- harmony: two chords per bar ----------
const C = [60, 64, 67], Am = [57, 60, 64], F = [53, 57, 60], G = [55, 59, 62];
const PROG = [[C, Am], [F, G]];
const chordAt = t => { const b = Math.floor(t / BAR), half = (t % BAR) >= BAR / 2 ? 1 : 0; return PROG[b % 2][half]; };

// ---------- instruments ----------
// Steelpan: struck metal note. Partials tuned near 1·2·3 (how pans are tuned), fast bright transient, slight pitch settle.
function pan1(t0, m, len, vel = 1, panPos = 0) {
  const f = hz(m), d = Math.min(1.6, 0.5 + len * 0.6);
  put(t0, d + 0.4, t => {
    const bend = 1 + 0.005 * Math.exp(-t / 0.025), ff = f * bend, env = Math.min(1, t / 0.0015);
    const body = Math.sin(TAU * ff * t) * Math.exp(-t / (0.55 * d))
      + 0.42 * Math.sin(TAU * 2.0 * ff * t + 0.3) * Math.exp(-t / 0.22)
      + 0.16 * Math.sin(TAU * 2.99 * ff * t) * Math.exp(-t / 0.09)
      + 0.1 * Math.sin(TAU * 4.2 * ff * t) * Math.exp(-t / 0.018);
    const rel = t > len + 0.25 ? Math.max(0, 1 - (t - len - 0.25) / 0.3) : 1;
    return body * env * rel;
  }, { g: 0.16 * vel, pan: panPos, send: 0.35, delay: 0.18 });
}
// long notes are rolled (rapid re-strikes), like a tenor-pan player
function pan(t0, m, len, vel = 1, panPos = 0.1) {
  if (len < BEAT * 0.9) return pan1(t0, m, len, vel, panPos);
  pan1(t0, m, 0.12, vel, panPos);
  for (let t = 0.085, k = 0; t < len - 0.05; t += 0.085, k++) pan1(t0 + t, m, 0.1, vel * (k % 2 ? 0.42 : 0.52), panPos);
}
// iron (brake drum): the metallic heartbeat of soca
const iron = (t0, g = 0.1) => put(t0, 0.09, t => ([1870, 2710, 3980, 5310].reduce((a, f, i) => a + Math.sin(TAU * f * t) / (i + 1), 0) * Math.exp(-t / 0.028) + (t < 0.002 ? (rnd() * 2 - 1) : 0)), { g, pan: 0.35 });
const kick = (t0, g = 0.85) => put(t0, 0.42, t => Math.sin(TAU * (48 * t + 90 * 0.035 * (1 - Math.exp(-t / 0.035)))) * Math.exp(-t / 0.24) * Math.min(1, t / 0.001) + (t < 0.003 ? (rnd() * 2 - 1) * 0.35 : 0), { g });
const clap = (t0, g = 0.32) => { const lp = biquadLP(3800); put(t0, 0.28, t => { const burst = t < 0.03 ? (Math.floor(t / 0.009) % 2 ? 0.5 : 1) : 1; return lp(rnd() * 2 - 1, t) * burst * Math.exp(-t / (t < 0.03 ? 0.02 : 0.07)); }, { g, send: 0.5, pan: -0.1 }); };
const hat = (t0, g = 0.07) => { let hp = 0, prev = 0; put(t0, 0.05, t => { const x = rnd() * 2 - 1; hp = 0.85 * (hp + x - prev); prev = x; return hp * Math.exp(-t / 0.014); }, { g, pan: -0.3 }); };
const shaker = (t0, g = 0.045) => { let hp = 0, prev = 0; put(t0, 0.08, t => { const x = rnd() * 2 - 1; hp = 0.9 * (hp + x - prev); prev = x; return hp * Math.sin(Math.PI * Math.min(1, t / 0.07)); }, { g, pan: 0.45 }); };
const crash = (t0, g = 0.26) => { let hp = 0, prev = 0; put(t0, 2.4, t => { const x = rnd() * 2 - 1; hp = 0.7 * (hp + x - prev); prev = x; return hp * Math.exp(-t / 0.8); }, { g, send: 0.4 }); };
const riser = (t0, dur, g = 0.22) => { const lp = biquadLP(t => 300 + 8000 * Math.pow(Math.max(0, t - t0) / dur, 2), 3.5); put(t0, dur, (t, abs) => lp(rnd() * 2 - 1, abs) * Math.pow(t / dur, 1.6), { g, send: 0.3 }); };
const tick = (t0, hi = true) => put(t0, 0.05, t => Math.sin(TAU * (hi ? 3100 : 2300) * t) * Math.exp(-t / 0.01) + (t < 0.0015 ? rnd() - 0.5 : 0), { g: 0.34, pan: hi ? 0.15 : -0.15 });
// bass: calypso bounce (root, fifth on the "and", root, fifth, octave pickup), round sine-saw with a little growl
function bassNote(t0, m, len, g = 0.24) { const f = hz(m), lp = biquadLP(t => 260 + 900 * Math.exp(-t / 0.06), 1.2); let ph = 0;
  put(t0, len + 0.05, t => { ph += f / SR; return (Math.sin(TAU * ph) * 0.8 + lp(saw(ph), t) * 0.35) * adsr(t, 0.004, 0.08, 0.75, 0.04, len); }, { g }); }
// comping: offbeat pan chords ("strum") under the melody
function comp(t0, ch, g = 0.5) { ch.forEach((m, i) => pan1(t0 + i * 0.012, m, 0.15, g * 0.55, -0.35 + i * 0.1)); }
// pad: warm chord bed (soft saws through a low-pass)
function pad(t0, len, ch, g = 0.05) { ch.forEach((m, k) => [-0.08, 0, 0.08].forEach((det, v) => { const f = hz(m - 12 + det), lp = biquadLP(1200); let ph = rnd();
  put(t0, len + 0.8, t => { ph += f / SR; return lp(saw(ph), t) * adsr(t, 0.35, 0.3, 0.8, 0.7, len); }, { g: g / 3, pan: (v - 1) * 0.4, send: 0.5 }); })); }

// ---------- melody (steelpan) ----------
const PHRASES = [
  [[0, 76, 0.5], [0.5, 79, 0.5], [1, 84, 1], [2, 81, 0.5], [2.5, 79, 0.5], [3, 76, 1]],
  [[0, 77, 0.5], [0.5, 81, 0.5], [1, 86, 1], [2, 83, 0.5], [2.5, 79, 0.5], [3, 84, 1]],
  [[0, 76, 0.5], [0.5, 79, 0.5], [1, 84, 0.5], [1.5, 83, 0.5], [2, 81, 1], [3, 79, 0.5], [3.5, 76, 0.5]],
  [[0, 77, 0.5], [0.5, 76, 0.5], [1, 74, 1], [2, 71, 0.5], [2.5, 74, 0.5], [3, 72, 1]],
];

// ---------- arrangement ----------
// bar 1: the clock. Tick-tock 8ths, pad swell, pan pickup, riser into the drop.
for (let i = 0; i < 8; i++) tick(i * BEAT / 2, i % 2 === 0);
pad(0, BAR, C, 0.1);
riser(BEAT * 2, BEAT * 2, 0.34);
for (let i = 0; i < 4; i++) bassNote(i * BEAT, 36, BEAT * 0.3, 0.16);           // a heartbeat under the clock
[[3, 72], [3.25, 74], [3.5, 76], [3.75, 79]].forEach(([b, m]) => pan1(b * BEAT, m, 0.2, 0.75));
crash(bar(2), 0.24); crash(DROP, 0.32); crash(bar(16), 0.2);
riser(BREAK[0], BREAK[1] - BREAK[0] + 0.02, 0.42);
[0, 0.5].forEach(o => [60, 64, 67].forEach((m, i) => pan1(BREAK[0] + o + i * 0.012, m + 12, 0.3, 0.6)));   // two pan stabs hold the break

for (let b = 2; b <= BARS; b++) {
  const t0 = bar(b), last = t0 >= END;
  for (let k = 0; k < 4; k++) {
    const t = t0 + k * BEAT;
    if (last || inBreak(t)) continue;
    kick(t, t >= DROP && t < END ? 0.92 : 0.85);
    if (k % 2) clap(t);
    hat(t + BEAT / 2, 0.08);
    [0, 0.5, 0.75].forEach((o, j) => iron(t + o * BEAT, j ? 0.06 : 0.1));      // ting . ting-ting
    shaker(t + BEAT * 0.25); shaker(t + BEAT * 0.75);
  }
  if (!last) {
    // bass + comping, per half bar
    [0, 1].forEach(h => {
      const th = t0 + h * BAR / 2, ch = chordAt(th + 0.01), root = ch[0] - 24, fifth = root + 7;
      if (inBreak(th)) return;
      bassNote(th, root, BEAT * 0.7); bassNote(th + BEAT * 0.75, fifth, BEAT * 0.22); bassNote(th + BEAT * 1.5, root + 12, BEAT * 0.4, 0.18);
      comp(th + BEAT * 0.5, ch); comp(th + BEAT * 1.5, ch, 0.4);
    });
    pad(t0, BAR, chordAt(t0 + 0.01), 0.035);
    // melody, octave up after the drop for lift
    const up = t0 >= DROP - BAR / 2 ? 12 : 0;
    PHRASES[(b - 2) % 4].forEach(([bt, m, len]) => { const t = t0 + bt * BEAT; if (!inBreak(t)) pan(t, m + up, len * BEAT, 1, 0.12); });
  }
}
// bar 17 (end card hold): drums out, final kick + rolled C major chord rings under the logo
kick(END, 0.9);
[60, 64, 67, 72, 76].forEach((m, i) => pan(END + i * 0.05, m + 12, BAR - 0.4, 0.8 - i * 0.06, (i - 2) * 0.2));
pad(END, BAR - 0.6, C, 0.05);

// ---------- effects: dotted-8th ping-pong delay + Schroeder reverb ----------
{ const dt = Math.round(BEAT * 0.75 * SR); const fbL = new Float32Array(dt), fbR = new Float32Array(dt);
  for (let i = 0; i < N; i++) { const j = i % dt, dl = fbL[j], dr = fbR[j]; L[i] += dl * 0.45; R[i] += dr * 0.45; fbL[j] = DLY[i] + dr * 0.32; fbR[j] = dl * 0.32; } }
{ const combs = [1557, 1617, 1491, 1422].map(n => ({ b: new Float32Array(n), i: 0, f: 0.8 })), aps = [225, 556].map(n => ({ b: new Float32Array(n), i: 0 }));
  for (let i = 0; i < N; i++) {
    let y = 0; combs.forEach(c => { const o = c.b[c.i]; c.b[c.i] = SEND[i] * 0.15 + o * c.f; c.i = (c.i + 1) % c.b.length; y += o; });
    aps.forEach(a => { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = o - y * 0.5; });
    L[i] += y * 0.5; R[i] += y * 0.46;
  } }
for (let i = 0; i < N; i++) { const env = Math.min(1, i / (SR * 0.01), (N - i) / (SR * 0.8)); L[i] = Math.tanh(L[i] * 1.25) * env * 0.85; R[i] = Math.tanh(R[i] * 1.25) * env * 0.85; }

// ---------- write + loudness-normalise ----------
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4); buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4); }
const raw = path.join(OUT, 'score.raw.wav'), wav = path.join(OUT, 'score.wav');
fs.writeFileSync(raw, buf);
execSync(`ffmpeg -y -loglevel error -i "${raw}" -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar ${SR} -c:a pcm_s16le "${wav}"`); fs.unlinkSync(raw);
console.log(`score.wav ${DUR.toFixed(1)}s`);
