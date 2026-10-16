#!/usr/bin/env node
// Original chiptune score + arcade SFX for the AREA 47 service menu. 100 bpm, 12 bars (28.8s). Pure synthesis, royalty-free.
// Bars (2.4s): 1 title (arps + coin) · 2 select (bass in) · 3-6 levels 1-2 (full groove + lead) · 7-8.5 BOSS (minor, 16th arps,
// snare rolls) · 9.5-10 power-ups (major lift, rising arps) · 11-12 end card (hook, final chord).
// SFX come from cues.json (written by make.mjs at the exact animation times).
//   node chip.mjs → out/menu.wav (-14 LUFS)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { duration, cues } = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));
const SR = 44100, BPM = 100, BEAT = 60 / BPM, BAR = 4 * BEAT, DUR = duration + 0.6, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N), TAU = Math.PI * 2;
let seed = 47; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function add(t0, dur, fn, g = 1, pan = 0) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(dur * SR));
  const gl = g * Math.cos((pan + 1) * Math.PI / 4), gr = g * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) { const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
}
const env = (t, a, d, len, rel = 0.03) => (t < a ? t / a : t < len ? Math.exp(-(t - a) / d) : Math.exp(-(len - a) / d) * Math.max(0, 1 - (t - len) / rel));
const pulse = (f, duty) => { let ph = 0; return () => { ph = (ph + f / SR) % 1; return ph < duty ? 0.6 : -0.6; }; };
const tri = f => { let ph = 0; return () => { ph = (ph + f / SR) % 1; return 4 * Math.abs(ph - 0.5) - 1; }; };
const note = (t0, m, len, { duty = 0.25, g = 0.12, pan = 0, vib = 0, d = 0.35 } = {}) => {
  const f = hz(m); let ph = 0;
  add(t0, len + 0.05, t => { const fv = f * (1 + vib * Math.sin(TAU * 6 * t) * Math.min(1, t / 0.15)); ph = (ph + fv / SR) % 1; return (ph < duty ? 0.6 : -0.6) * env(t, 0.004, d, len); }, g, pan);
};
const bassNote = (t0, m, len, g = 0.22) => { const o = tri(hz(m)); add(t0, len + 0.03, t => o() * env(t, 0.003, 1.5, len, 0.02), g); };
const kick = (t0, g = 0.5) => add(t0, 0.18, t => Math.sin(TAU * (55 * t + 160 * 0.03 * (1 - Math.exp(-t / 0.03)))) * Math.exp(-t / 0.09), g);
const hat = (t0, g = 0.06, len = 0.03) => { let lf = 1; add(t0, len, t => { lf = (lf * 75 + 74) % 65537; return ((lf & 1) ? 1 : -1) * Math.exp(-t / (len / 3)); }, g, 0.3); };
const snare = (t0, g = 0.2) => add(t0, 0.16, t => ((rnd() * 2 - 1) * 0.8 + Math.sin(TAU * 190 * t) * 0.5) * Math.exp(-t / 0.05), g, -0.1);

// ---------- harmony ----------
const C = [60, 64, 67], G = [55, 59, 62], Am = [57, 60, 64], F = [53, 57, 60], E = [56, 59, 64], Dm = [62, 65, 69];
const MAJ = [C, G, Am, F], BOSS = [Am, F, E, Am];
const bossFrom = 14.4, bossTo = 20.4, upFrom = 20.4, endFrom = 24.0;
const chordAt = t => (t >= bossFrom && t < bossTo ? BOSS : MAJ)[Math.floor(t / BAR) % 4];

// ---------- arrangement ----------
const bars = Math.ceil(duration / BAR);
for (let b = 0; b < bars; b++) {
  const t0 = b * BAR, ch = chordAt(t0 + 0.01), boss = t0 >= bossFrom - 0.01 && t0 < bossTo, end = t0 >= endFrom - 0.01;
  // arpeggio (16ths in the boss, 8ths otherwise), square 12.5%
  const step = boss ? BEAT / 4 : BEAT / 2, n = Math.round(BAR / step), pat = [0, 1, 2, 1, 0, 2, 1, 2];
  for (let i = 0; i < n; i++) { const t = t0 + i * step; if (t >= duration - 0.3) break; const m = ch[pat[i % 8]] + (boss ? 12 : 12) + (t >= upFrom && t < endFrom ? Math.floor(i / 4) * 2 : 0);
    note(t, m, step * 0.8, { duty: 0.125, g: b === 0 ? 0.12 : 0.045, pan: i % 2 ? 0.35 : -0.35, d: 0.08 }); }
  if (b === 0) continue;                                         // bar 1: arps only (title + coin)
  // bass: root/octave bounce in 8ths
  for (let i = 0; i < 8; i++) { const t = t0 + i * BEAT / 2; if (t >= duration - 0.3) break; bassNote(t, ch[0] - 24 + (i % 2 ? 12 : 0), BEAT / 2 * 0.9, boss ? 0.26 : 0.22); }
  // drums
  for (let k = 0; k < 4; k++) {
    const t = t0 + k * BEAT; if (t >= duration - 0.3) break;
    if (b >= 2) { kick(t, boss ? 0.55 : 0.48); if (k % 2) snare(t, boss ? 0.24 : 0.2); }
    hat(t + BEAT / 2); if (b >= 2) { hat(t + BEAT / 4, 0.035); hat(t + 3 * BEAT / 4, 0.035); }
    if (boss && k === 3) [0.25, 0.5, 0.75].forEach(o => snare(t + o * BEAT, 0.12));   // boss snare roll
  }
}
// lead melody (pulse 25% with vibrato): levels 1-2 hook, boss riff, end hook
const HOOK = [[0, 72, 1], [1, 76, 0.5], [1.5, 79, 0.5], [2, 81, 1], [3, 79, 0.5], [3.5, 76, 0.5], [4, 74, 1], [5, 71, 0.5], [5.5, 74, 0.5], [6, 76, 2]];
const RIFF = [[0, 69, 0.5], [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 75, 0.25], [1.75, 76, 0.25], [2, 72, 1], [3, 71, 1], [4, 69, 0.5], [4.5, 72, 0.5], [5, 77, 1], [6, 76, 1], [7, 68, 1]];
const lead = (start, mel, reps, g = 0.1) => { for (let r = 0; r < reps; r++) mel.forEach(([bt, m, l]) => { const t = start + (r * 8 + bt) * BEAT; if (t < duration - 0.4) note(t, m, l * BEAT * 0.9, { duty: 0.25, g, vib: 0.006, d: 0.6 }); }); };
lead(4.8, HOOK, 2); lead(bossFrom, RIFF, 2, 0.11); lead(endFrom, HOOK, 1, 0.11);
// final chord
[60, 64, 67, 72].forEach((m, i) => note(duration - 1.2 + i * 0.03, m + 12, 1.0, { duty: 0.25, g: 0.06, d: 0.5, pan: (i - 1.5) * 0.3 }));

// ---------- arcade SFX on the animation cues ----------
const SFX = {
  coin: t => { note(t, 83, 0.07, { duty: 0.5, g: 0.16, d: 1 }); note(t + 0.07, 88, 0.35, { duty: 0.5, g: 0.16, d: 0.2 }); },
  blip: (t, p = 1) => { const f = 880 * p; let ph = 0; add(t, 0.06, x => { ph = (ph + f * (1 + x * 4) / SR) % 1; return (ph < 0.5 ? 0.5 : -0.5) * Math.exp(-x / 0.025); }, 0.12); },
  tick: (t, p = 1) => note(t, 84 + Math.round((p - 1) * 10), 0.03, { duty: 0.5, g: 0.06, d: 0.02 }),
  select: t => { note(t, 76, 0.06, { duty: 0.5, g: 0.14, d: 1 }); note(t + 0.06, 88, 0.18, { duty: 0.5, g: 0.14, d: 0.1 }); },
  bloop: t => { let ph = 0; add(t, 0.22, x => { ph = (ph + 300 * Math.pow(3, Math.min(1, x / 0.12)) / SR) % 1; return Math.sin(TAU * ph) * Math.exp(-x / 0.08); }, 0.22); },
  powerup: (t, p = 1) => [0, 4, 7, 12, 16, 19].forEach((iv, i) => note(t + i * 0.035, 72 + iv + Math.round((p - 1) * 12), 0.05, { duty: 0.25, g: 0.08, d: 0.05 })),
  levelup: t => [72, 76, 79, 84, 88].forEach((m, i) => note(t + i * 0.07, m, i === 4 ? 0.4 : 0.07, { duty: 0.5, g: 0.1, d: i === 4 ? 0.25 : 1 })),
};
cues.forEach(c => (SFX[c.kind] || (() => {}))(c.t, c.p || 1));

// ---------- write + loudness ----------
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { const e = Math.min(1, (N - i) / (SR * 0.5)); buf.writeInt16LE(Math.round(Math.tanh(L[i] * 1.2) * e * 30000), 44 + i * 4); buf.writeInt16LE(Math.round(Math.tanh(R[i] * 1.2) * e * 30000), 46 + i * 4); }
fs.mkdirSync(path.join(here, 'out'), { recursive: true });
const raw = path.join(here, 'out', 'menu.raw.wav'), wav = path.join(here, 'out', 'menu.wav');
fs.writeFileSync(raw, buf); execSync(`ffmpeg -y -loglevel error -i "${raw}" -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar ${SR} "${wav}"`); fs.unlinkSync(raw);
console.log(`out/menu.wav ${DUR.toFixed(1)}s · ${cues.length} SFX cues`);
