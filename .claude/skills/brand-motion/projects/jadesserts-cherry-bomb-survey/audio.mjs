// Soundtrack: cozy café waltz (synth), tension stings, SFX on every beat, voices on top with ducking. -> out/mix.wav
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8')), EV = TL.ev, AT = TL.at, IVS = TL.interviews;
const SR = 44100, N = Math.ceil((TL.duration + 0.2) * SR), TAU = Math.PI * 2;
const mus = [new Float32Array(N), new Float32Array(N)], fx = [new Float32Array(N), new Float32Array(N)], vox = new Float32Array(N);
let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function add(buf, t0, dur, fn, gain = 1, pan = 0) { const s0 = Math.round(t0 * SR); if (s0 >= N) return; const n = Math.min(N - Math.max(0, s0), Math.round(dur * SR)), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = Math.max(0, -s0); i < n; i++) { const v = fn(i / SR); buf[0][s0 + i] += v * gl; buf[1][s0 + i] += v * gr; } }
const nf = m => 440 * Math.pow(2, (m - 69) / 12);
function pluck(buf, t0, midi, gain, pan = 0, dur = 1.6) { const p = Math.max(2, Math.round(SR / nf(midi))), ring = new Float32Array(p); for (let i = 0; i < p; i++) ring[i] = rnd() * 2 - 1; let idx = 0; const n = Math.round(dur * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = ring[idx]; ring[idx] = 0.497 * (v + ring[(idx + 1) % p]); out[i] = v; idx = (idx + 1) % p; } add(buf, t0, dur, t => out[Math.min(n - 1, Math.floor(t * SR))] * clamp((dur - t) / 0.1), gain, pan); }
function bell(buf, t0, midi, gain, pan = 0) { const f = nf(midi); add(buf, t0, 1.6, t => (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 6)) * Math.exp(-t * 2.6), gain, pan); }
function bass(buf, t0, midi, dur, gain) { const f = nf(midi); add(buf, t0, dur, t => (Math.sin(TAU * f * t) * 0.8 + Math.sin(TAU * 2 * f * t) * 0.15) * (t < 0.01 ? t / 0.01 : Math.exp(-t * 1.8)) * clamp((dur - t) / 0.03), gain); }
function accordion(buf, t0, midis, dur, gain) { add(buf, t0, dur, t => { let v = 0; for (const m of midis) { const f = nf(m); v += ((f * t) % 1 < 0.5 ? 0.5 : -0.5) * 0.4 + Math.sin(TAU * f * 1.003 * t) * 0.6; } return v / midis.length * clamp(t / 0.04) * clamp((dur - t) / 0.06) * (1 + 0.08 * Math.sin(TAU * 5 * t)); }, gain); }
function noise(buf, t0, dur, gain, k = 0.3, env = () => 1, pan = 0) { let lp = 0; add(buf, t0, dur, t => { lp += k * ((rnd() * 2 - 1) - lp); return lp * env(t); }, gain, pan); }
// ---- café waltz in G (3/4, 132 bpm): G – Em – C – D
const BPM = 132, BEAT = 60 / BPM, BAR = BEAT * 3, CH = [[43, [67, 71, 74]], [40, [64, 67, 71]], [36, [60, 64, 67]], [38, [62, 66, 69]]];
const MEL = [74, 76, 74, 71, 72, 74, 79, 78, 76, 74, 72, 71, 69, 71, 72, 74];
const tense = [[EV.goodZoom[0] - 0.1, EV.panic[1] + 0.2], [EV.fourZoom[0] - 0.1, EV.fourZoom[1] + 0.2]], quiet = t => tense.some(([a, b]) => t >= a && t < b);
const m0 = 0.2, m1 = EV.reveal;
for (let t = m0, b = 0; t < m1; t += BEAT, b++) { if (quiet(t)) continue; const [root, ch] = CH[Math.floor(b / 3) % 4], k = clamp((t - m0) / 1.5) * clamp((m1 - t) / 1);
  if (b % 3 === 0) bass(mus, t, root, BEAT * 1.4, 0.3 * k); else { pluck(mus, t, ch[b % 3] , 0.12 * k, b % 3 === 1 ? -0.3 : 0.3); pluck(mus, t + 0.01, ch[(b + 1) % 3], 0.08 * k, 0); }
  if (b % 6 === 0) accordion(mus, t, ch, BAR * 1.9, 0.035 * k);
  if (b % 3 === 0 && Math.floor(b / 12) % 2 === 1) bell(mus, t, MEL[(b / 3) % MEL.length], 0.05 * k, 0.2); }
// tension: low drone + heartbeat, then a "phew" resolve
for (const [a, b] of tense) { add(mus, a, b - a, t => (Math.sin(TAU * 55 * t) + 0.5 * Math.sin(TAU * 58.3 * t)) * clamp(t / 0.6) * clamp((b - a - t) / 0.2), 0.16);
  for (let t = a + 0.2; t < b; t += 0.62) { add(fx, t, 0.15, u => Math.sin(TAU * 55 * u) * Math.exp(-u * 25), 0.5); add(fx, t + 0.18, 0.15, u => Math.sin(TAU * 50 * u) * Math.exp(-u * 25), 0.35); } }
// the reveal: comedic sting (descending "wah-wah") then the end jingle + loop
[[67, 0], [66, 0.32], [65, 0.64], [64, 0.96]].forEach(([m, d], i) => add(mus, EV.reveal + 0.3 + d, i === 3 ? 1.1 : 0.32, t => { const f = nf(m - 12) * (i === 3 ? 1 + 0.02 * Math.sin(TAU * 6 * t) : 1); return ((f * t) % 1 < 0.5 ? 0.6 : -0.6) * clamp(t / 0.02) * Math.exp(-t * (i === 3 ? 1.2 : 2)); }, 0.12));
[[79, 0], [83, 0.12], [86, 0.24], [91, 0.36]].forEach(([m, d]) => bell(mus, EV.endcard + 0.2 + d, m, 0.11));
for (let t = EV.endcard + 1, b = 0; t < TL.duration - 0.5; t += BEAT, b++) { const [root, ch] = CH[Math.floor(b / 3) % 4], k = clamp((TL.duration - 0.5 - t) / 1.5) * 0.8; if (b % 3 === 0) bass(mus, t, root, BEAT * 1.3, 0.24 * k); else pluck(mus, t, ch[b % 3], 0.1 * k, 0); }
// ---- SFX
const pop = (t, g = 0.12, f = 900) => add(fx, t, 0.12, u => Math.sin(TAU * (f + 900 * Math.exp(-u * 40)) * u) * Math.exp(-u * 30), g);
const thud = (t, g = 0.4) => add(fx, t, 0.25, u => Math.sin(TAU * (65 + 70 * Math.exp(-u * 25)) * u) * Math.exp(-u * 16), g);
const whoosh = (t, g = 0.2, d = 0.45) => { let lp = 0; add(fx, t, d, u => { lp += (0.05 + 0.4 * Math.sin(Math.PI * u / d)) * ((rnd() * 2 - 1) - lp); return lp * Math.sin(Math.PI * u / d); }, g); };
// shop bell
[0, 0.09, 0.2].forEach((d, i) => bell(fx, EV.bell + d, 93 - i * 2, 0.08));
// footsteps when a villager steps up / leaves
IVS.forEach(iv => { for (let k = 0; k < 6; k++) noise(fx, iv.step + k * 0.15, 0.05, 0.05, 0.4, u => Math.exp(-u * 60), k % 2 ? 0.2 : -0.2); for (let k = 0; k < 8; k++) noise(fx, iv.exit + k * 0.18, 0.05, 0.04, 0.4, u => Math.exp(-u * 60), 0.3); });
// review cards: stars, stamp, flight, mailbox
IVS.forEach(iv => { const c = iv.card; pop(c, 0.1, 600);
  for (let s = 0; s < iv.stars; s++) bell(fx, c + 0.3 + s * 0.16, 84 + [0, 2, 4, 7, 9][s], 0.07);
  if (iv.crayon) { add(fx, c + 1.9, 0.9, u => Math.sin(TAU * (1800 + 400 * Math.sin(u * 40)) * u) * (0.3 + 0.7 * Math.abs(Math.sin(u * 22))) * Math.exp(-u * 1.5), 0.05); }
  const stT = c + 1.35 + (iv.crayon ? 1.6 : 0); thud(stT, 0.45); noise(fx, stT, 0.12, 0.15, 0.6, u => Math.exp(-u * 40));
  const fly = c + 1.9 + (iv.crayon ? 1.9 : 0); whoosh(fly, 0.18, 0.5); [0, 0.1].forEach((d, i) => bell(fx, fly + 0.55 + d, i ? 88 : 84, 0.08)); });
// emotes, rolling pin, box slide, eye twitch
[AT.c_aww.at, AT.m3.at, AT.d1.end + 0.25, AT.b_good.at, AT.c_pin.at, AT.k1.at + 0.2, AT.k2.end - 0.3, EV.boxSlide + 0.4, AT.j1.end + 0.2, AT.b_fair.at, AT.c_compliment.end - 0.2, AT.c_love.at, EV.reveal + 0.5].forEach(t => pop(t, 0.08));
add(fx, EV.pin[0] + 0.15, 0.3, u => Math.sin(TAU * (300 - 200 * u) * u) * Math.exp(-u * 10), 0.12); thud(EV.pin[1] + 0.5, 0.3); add(fx, EV.pin[1] + 0.55, 0.4, u => Math.sin(TAU * 900 * u) * Math.exp(-u * 18) * Math.sin(TAU * 7 * u), 0.08);
noise(fx, EV.boxSlide, 0.4, 0.12, 0.15, u => Math.sin(Math.PI * u / 0.4));
for (let t = EV.fourZoom[0] + 0.1; t < AT.b_four.at; t += 0.33) add(fx, t, 0.04, u => Math.sin(TAU * 2400 * u) * Math.exp(-u * 120), 0.06);
whoosh(EV.goodZoom[0], 0.2, 0.25); whoosh(EV.panic[0], 0.15, 0.2); whoosh(EV.fourZoom[0], 0.18, 0.3); whoosh(EV.reveal, 0.22, 1.0);
// ---- voices
for (const l of TL.lines) { const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', 'voices/' + l.file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  const a = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4), s0 = Math.round(l.at * SR); for (let i = 0; i < a.length && s0 + i < N; i++) vox[s0 + i] += a[i] * 0.9; }
let e = 0; const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) { const v = Math.abs(vox[i]); e = v > e ? e + (v - e) * 0.02 : e + (v - e) * 0.00012; const d = 1 - 0.6 * clamp(e * 6); L[i] = mus[0][i] * d * 0.9 + fx[0][i] * 0.8 + vox[i]; R[i] = mus[1][i] * d * 0.9 + fx[1][i] * 0.8 + vox[i]; }
const pcm = Buffer.alloc(N * 8); for (let i = 0; i < N; i++) { pcm.writeFloatLE(L[i], i * 8); pcm.writeFloatLE(R[i], i * 8 + 4); }
fs.mkdirSync('out', { recursive: true }); fs.writeFileSync('out/mix.f32', pcm);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', 'out/mix.f32', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', String(SR), 'out/mix.wav']); fs.unlinkSync('out/mix.f32');
console.log('mix out/mix.wav');
