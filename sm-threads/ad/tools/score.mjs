#!/usr/bin/env node
// SM Threads soca score, pure synthesis (royalty-free by construction, deterministic).
// Groovy soca: four-on-the-floor kick, clap on 2 and 4, the iron (brake drum) on the off-beats, a shaker, a syncopated
// bass, a soft pad and a steelpan lead. Key of F (F - C - Dm - Bb). Also writes a per-frame envelope file so the
// picture can move with the music (kick, iron, energy).
//   node score.mjs --bpm 112 --beats 64 --out score.wav --env env.json [--fps 24] [--style boarding|island]
//   Sections (in beats) come from --intro (pad + pan only) and --drop (everything) / --outro (drums out, pad rings).
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const A = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') && a.push([v.slice(2), arr[i + 1]]), a), []));
const BPM = +(A.bpm || 112), BEATS = +(A.beats || 64), FPS = +(A.fps || 24), INTRO = +(A.intro || 8), OUTRO = +(A.outro || BEATS - 6), STYLE = A.style || 'boarding';
const SR = 48000, B = 60 / BPM, DUR = BEATS * B + 2.0, N = Math.ceil(DUR * SR), TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N), SEND = new Float32Array(N);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const KICK = [], IRON = [];   // hit times, for the picture
function put(t0, dur, fn, { g = 1, pan = 0, send = 0 } = {}) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR)), gl = g * Math.min(1, 1 - pan), gr = g * Math.min(1, 1 + pan);
  for (let i = 0; i < n; i++) { const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; SEND[s0 + i] += v * g * send; }
}
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d);
// ---- instruments ----
const kick = (t0, g = 0.9) => { KICK.push(t0); put(t0, 0.45, t => { const f = 48 + 110 * Math.exp(-t / 0.035); return Math.sin(TAU * (48 * t + 110 * 0.035 * (1 - Math.exp(-t / 0.035)))) * env(t, 0.002, 0.16) + (rnd() * 2 - 1) * env(t, 0.0005, 0.004) * 0.3; }, { g }); };
function noise() { let a = 0, b = 0; return { hp: x => { const y = x - a; a = x; return y; }, bp: (x, k) => (b += k * (x - b)) }; }
const clap = (t0, g = 0.32) => { const n = noise(); put(t0, 0.3, t => { const x = rnd() * 2 - 1, e = (t < 0.03 ? (Math.floor(t / 0.01) % 2 ? 0.6 : 1) : 1) * env(t, 0.001, 0.07); return n.bp(n.hp(x), 0.35) * e * 2.2; }, { g, send: 0.25 }); };
const iron = (t0, g = 0.11, pan = 0.25) => { IRON.push(t0); put(t0, 0.25, t => (Math.sin(TAU * 3150 * t) * 0.6 + Math.sin(TAU * 4320 * t) * 0.5 + Math.sin(TAU * 5800 * t) * 0.3) * env(t, 0.0008, 0.035), { g, pan }); };
const shaker = (t0, g = 0.05, pan = -0.3) => { const n = noise(); put(t0, 0.09, t => n.hp(n.hp(rnd() * 2 - 1)) * env(t, 0.006, 0.02), { g, pan }); };
const bass = (t0, m, dur, g = 0.34) => put(t0, dur + 0.05, t => { const f = hz(m); return (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)) * Math.min(1, t / 0.006) * Math.min(1, (dur + 0.05 - t) / 0.05) * Math.exp(-t / 0.9); }, { g });
const pan = (t0, m, g = 0.16, p = 0) => put(t0, 1.6, t => { const f = hz(m); return (Math.sin(TAU * f * t) + 0.42 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.25) + 0.22 * Math.sin(TAU * 2.98 * f * t) * Math.exp(-t / 0.12) + 0.08 * Math.sin(TAU * 4.16 * f * t) * Math.exp(-t / 0.06)) * env(t, 0.003, 0.55); }, { g, pan: p, send: 0.35 });
const pad = (t0, notes, dur, g = 0.045) => notes.forEach((m, k) => put(t0, dur + 1.0, t => { const f = hz(m); return (Math.sin(TAU * f * t) + Math.sin(TAU * f * 1.004 * t + 1) + 0.5 * Math.sin(TAU * f * 0.996 * t + 2)) / 2.5 * Math.min(1, t / 0.8) * Math.min(1, (dur + 1.0 - t) / 1.0); }, { g, pan: (k - 1.5) * 0.3, send: 0.5 }));
// ---- arrangement ----
const CH = [[53, 57, 60, 64], [48, 52, 55, 59], [50, 53, 57, 60], [46, 50, 53, 57]];   // Fmaj7 C(maj7) Dm7 Bbmaj7
const ROOT = [41, 36, 38, 34];
const MEL = STYLE === 'island'
  ? [[0, 72], [1, 69], [1.5, 72], [2.5, 74], [3, 72], [4, 76], [5, 74], [5.5, 72], [6.5, 69], [8, 77], [9, 76], [9.5, 74], [10.5, 72], [12, 74], [13, 72], [13.5, 69], [14.5, 67]]
  : [[0, 69], [1, 72], [2, 74], [3.5, 72], [4, 67], [5, 69], [6, 72], [8, 70], [9, 69], [10, 67], [11.5, 65], [12, 69], [14, 67]];
for (let bt = 0; bt < BEATS; bt += 4) {
  const bar = Math.floor(bt / 4), c = bar % 4, t = bt * B, groove = bt >= INTRO && bt < OUTRO, full = groove && bt >= INTRO + 8;
  pad(t, CH[c], 4 * B, bt >= OUTRO ? 0.055 : 0.045);
  if (groove) {
    for (let k = 0; k < 4; k++) { kick(t + k * B, 0.85); iron(t + (k + 0.5) * B, 0.1, 0.25); if (full) iron(t + (k + 0.75) * B, 0.05, 0.3); }
    clap(t + 1 * B); clap(t + 3 * B);
    for (let k = 0; k < 16; k++) shaker(t + k * B / 4, k % 2 ? 0.035 : 0.055);
    const r = ROOT[c]; [[0, 0.7], [1.5, 0.4], [2, 0.6], [3.5, 0.4]].forEach(([o, d]) => bass(t + o * B, r + (o === 3.5 ? 12 : 0), d * B * 1.6));
  }
  // steelpan: the motif every 4 bars, answered an octave down on the next phrase
  if (bt >= 4 && bt < BEATS - 2) MEL.forEach(([o, m]) => { const tb = bt % 16; if (o >= tb && o < tb + 4) pan(t + (o - tb) * B, m - (Math.floor(bt / 16) % 2 ? 0 : 0), bt >= INTRO ? 0.15 : 0.11, (m % 3 - 1) * 0.3); });
}
pan(BEATS * B - 2 * B, 77, 0.14, 0.2); pan(BEATS * B - 2 * B + 0.12, 81, 0.1, -0.2);   // a little sparkle on the button
// ---- reverb send (a few feedback delays), master ----
const taps = [[0.031, 0.5], [0.047, 0.45], [0.071, 0.4], [0.113, 0.33], [0.167, 0.27]].map(([d, g]) => [Math.round(d * SR), g]);
const rv = new Float32Array(N); for (let i = 0; i < N; i++) { let v = SEND[i]; for (const [d, g] of taps) if (i - d >= 0) v += rv[i - d] * g * 0.55; rv[i] = v * 0.6; }
let lpL = 0, lpR = 0; for (let i = 0; i < N; i++) { lpL += 0.25 * (rv[i] - lpL); lpR += 0.25 * (rv[(i + 211) % N] - lpR); L[i] += lpL * 0.22; R[i] += lpR * 0.22; }
let pk = 0; for (let i = 0; i < N; i++) { const t = i / SR, f = Math.min(1, t / 0.05) * Math.min(1, (DUR - t) / 1.6); L[i] = Math.tanh(L[i] * 1.1) * f; R[i] = Math.tanh(R[i] * 1.1) * f; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
const raw = Buffer.alloc(N * 4); for (let i = 0; i < N; i++) { raw.writeInt16LE(Math.round(L[i] / pk * 0.89 * 32767), i * 4); raw.writeInt16LE(Math.round(R[i] / pk * 0.89 * 32767), i * 4 + 2); }
const hdr = Buffer.alloc(44); hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + raw.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(raw.length, 40);
const tmp = (A.out || 'score.wav') + '.raw.wav'; fs.writeFileSync(tmp, Buffer.concat([hdr, raw]));
execSync(`ffmpeg -v error -y -i "${tmp}" -af loudnorm=I=-15:TP=-1.5:LRA=9 -ar 48000 "${A.out || 'score.wav'}"`); fs.unlinkSync(tmp);
// ---- envelopes for the picture ----
const F = Math.ceil(DUR * FPS), kk = new Array(F).fill(0), ir = new Array(F).fill(0), en = new Array(F).fill(0);
for (let f = 0; f < F; f++) { const t = f / FPS; for (const h of KICK) if (t >= h && t - h < 0.4) kk[f] = Math.max(kk[f], Math.exp(-(t - h) / 0.11)); for (const h of IRON) if (t >= h && t - h < 0.2) ir[f] = Math.max(ir[f], Math.exp(-(t - h) / 0.05));
  const s0 = Math.floor(t * SR), n = Math.floor(SR / FPS); let e = 0; for (let i = s0; i < Math.min(N, s0 + n); i++) e += L[i] * L[i]; en[f] = Math.sqrt(e / n) / pk; }
const r2 = a => a.map(v => Math.round(v * 100) / 100), emax = Math.max(...en);
if (A.env) fs.writeFileSync(A.env, JSON.stringify({ fps: FPS, bpm: BPM, kick: r2(kk), iron: r2(ir), energy: r2(en.map(v => v / emax)) }));
console.log(`score ${A.out}  ${BPM} bpm, ${BEATS} beats = ${(BEATS * B).toFixed(2)}s (+tail), kicks ${KICK.length}`);
