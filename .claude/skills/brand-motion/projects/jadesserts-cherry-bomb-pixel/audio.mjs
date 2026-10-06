// Soundtrack for "Meet Cherry & Bomb" v2: cozy farm-game score (synthesised), SFX on every story beat, voices on top
// with ducking, mastered to -14 LUFS.   node audio.mjs  ->  out/mix.wav
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8')), EV = TL.ev, AT = TL.at;
const SR = 44100, N = Math.ceil((TL.duration + 0.2) * SR), TAU = Math.PI * 2;
const mus = [new Float32Array(N), new Float32Array(N)], fx = [new Float32Array(N), new Float32Array(N)], vox = new Float32Array(N);
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function add(buf, t0, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.round(t0 * SR); if (s0 >= N) return; const n = Math.min(N - Math.max(0, s0), Math.round(dur * SR));
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = Math.max(0, -s0); i < n; i++) { const v = fn(i / SR); buf[0][s0 + i] += v * gl; buf[1][s0 + i] += v * gr; }
}
const env = (a, d, t, len) => (t < a ? t / a : Math.exp(-(t - a) / d)) * (len ? clamp((len - t) / 0.02) : 1);
const nf = m => 440 * Math.pow(2, (m - 69) / 12);

// ------------------------------------------------------------------ instruments
function pluck(buf, t0, midi, gain, pan = 0, dur = 1.6) { // Karplus–Strong (warm nylon/harp)
  const f = nf(midi), p = Math.max(2, Math.round(SR / f)), ring = new Float32Array(p); for (let i = 0; i < p; i++) ring[i] = rnd() * 2 - 1;
  let idx = 0, prev = 0; const n = Math.round(dur * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = ring[idx], nxt = ring[(idx + 1) % p]; ring[idx] = 0.497 * (v + nxt) * 0.998 + 0.003 * prev; prev = v; out[i] = v; idx = (idx + 1) % p; }
  add(buf, t0, dur, t => out[Math.min(n - 1, Math.floor(t * SR))] * clamp((dur - t) / 0.1), gain, pan);
}
const tri = ph => 2 * Math.abs(2 * (ph - Math.floor(ph + 0.5))) - 1;
function bass(buf, t0, midi, dur, gain) { const f = nf(midi); add(buf, t0, dur, t => (tri(f * t) * 0.8 + Math.sin(TAU * f * t) * 0.4) * env(0.01, dur * 0.7, t, dur), gain); }
function lead(buf, t0, midi, dur, gain, pan = 0) { // soft square, 12.5% duty, gentle vibrato (chiptune ocarina)
  const f = nf(midi); add(buf, t0, dur + 0.15, t => { const vib = 1 + 0.004 * Math.sin(TAU * 5.5 * t) * clamp((t - 0.15) / 0.2); const ph = (f * vib * t) % 1; return ((ph < 0.25 ? 1 : -0.33) * 0.55 + Math.sin(TAU * f * vib * t) * 0.6) * env(0.015, 0.9, t, dur + 0.15) * clamp((dur + 0.15 - t) / 0.12); }, gain, pan); }
function bell(buf, t0, midi, gain, pan = 0) { const f = nf(midi); add(buf, t0, 1.6, t => (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 6) + 0.2 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 10)) * Math.exp(-t * 2.6), gain, pan); }
function pad(buf, t0, midis, dur, gain) { add(buf, t0, dur, t => { let v = 0; for (const m of midis) { const f = nf(m); v += Math.sin(TAU * f * t + Math.sin(TAU * 0.3 * t)) + 0.3 * Math.sin(TAU * f * 2.002 * t); } return v / midis.length * clamp(t / 1.2) * clamp((dur - t) / 1.2); }, gain); }
function shaker(buf, t0, gain) { let lp = 0; add(buf, t0, 0.09, t => { const n = rnd() * 2 - 1; lp += 0.6 * (n - lp); return (n - lp) * Math.exp(-t * 45); }, gain, 0.25); }
function kick(buf, t0, gain) { add(buf, t0, 0.25, t => Math.sin(TAU * (50 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14), gain); }
function noise(buf, t0, dur, gain, lpK = 0.2, envf = t => 1, pan = 0) { let lp = 0; add(buf, t0, dur, t => { lp += lpK * ((rnd() * 2 - 1) - lp); return lp * envf(t); }, gain, pan); }

// ------------------------------------------------------------------ score (F major, 104 bpm): I – vi – IV – V
const BPM = 104, BEAT = 60 / BPM, BAR = BEAT * 4;
const CH = [[53, [65, 69, 72]], [50, [62, 65, 69]], [46, [58, 62, 65]], [48, [60, 64, 67]]]; // F, Dm, Bb, C
const MEL = [[72, 1], [74, 0.5], [72, 0.5], [69, 1], [65, 1], [67, 1.5], [69, 0.5], [70, 1], [72, 1], [74, 1], [72, 0.5], [70, 0.5], [69, 2], [67, 1], [65, 1], [67, 1], [69, 3]];
const quiet = [[EV.boom - 0.05, EV.resume - 0.3], [EV.freeze[0], EV.freeze[1]]]; // music drops out
const isQuiet = t => quiet.some(([a, b]) => t >= a && t < b);
// intro: music box (sign scene)
for (let t = 0.4, i = 0; t < EV.walk0; t += BEAT / 2, i++) { const [, ch] = CH[Math.floor(t / BAR) % 4]; bell(mus, t, ch[i % 3] + 12, 0.05, (i % 3 - 1) * 0.3); }
// walk groove
const g0 = EV.walk0 - 0.2, g1 = EV.stop + 1.2;
for (let t = g0, b = 0; t < g1; t += BEAT, b++) {
  if (isQuiet(t)) continue; const bar = Math.floor(b / 4), [root, ch] = CH[bar % 4], k = clamp((t - g0) / 2) * clamp((g1 - t) / 2);
  if (b % 4 === 0) bass(mus, t, root - 12, BEAT * 1.8, 0.28 * k); if (b % 4 === 2) bass(mus, t, root - 5, BEAT * 1.2, 0.22 * k);
  pluck(mus, t, ch[0], 0.16 * k, -0.35); pluck(mus, t + BEAT / 2, ch[(b % 2) + 1], 0.13 * k, 0.35);
  shaker(mus, t, 0.05 * k); shaker(mus, t + BEAT / 2, 0.08 * k); if (b % 2 === 0) kick(mus, t, 0.22 * k);
}
// melody: plays in the gaps (between voiced lines) so it never fights the dialogue
{ let t = g0 + BAR * 2, i = 0; while (t < g1 - 1) { const [m, d] = MEL[i % MEL.length]; if (!isQuiet(t)) lead(mus, t, m, d * BEAT * 0.9, 0.07, 0.1); t += d * BEAT; i++; } }
// the stop: pad + slow piano-ish bells
pad(mus, EV.stop + 0.6, [65, 69, 72, 77], EV.whip - EV.stop + 1, 0.06);
for (let t = EV.stop + 1, i = 0; t < EV.whip + 0.4; t += BEAT, i++) { const [, ch] = CH[Math.floor(i / 4) % 4]; bell(mus, t, ch[i % 3] + 12, 0.045, (i % 2 ? 0.3 : -0.3)); }
// the road: swell
pad(mus, EV.whip, [65, 72, 77, 81], EV.black - EV.whip, 0.08);
for (let t = EV.whip + 0.3, i = 0; t < EV.fade + 0.6; t += BEAT / 2, i++) { const [root, ch] = CH[Math.floor(i / 8) % 4]; pluck(mus, t, ch[i % 3] + 12, 0.1 * clamp((EV.fade + 0.6 - t) / 1.2), (i % 2 ? 0.3 : -0.3)); if (i % 8 === 0) bass(mus, t, root - 12, BEAT * 3, 0.2); }
// end card jingle + gentle loop
[[72, 0], [76, 0.12], [79, 0.24], [84, 0.36]].forEach(([m, d]) => bell(mus, EV.end + 0.2 + d, m, 0.12));
for (let t = EV.end + 1, b = 0; t < TL.duration - 0.6; t += BEAT, b++) { const [root, ch] = CH[Math.floor(b / 4) % 4], k = clamp((TL.duration - 0.6 - t) / 1.5) * 0.8;
  pluck(mus, t, ch[b % 3], 0.13 * k, -0.2); if (b % 4 === 0) bass(mus, t, root - 12, BEAT * 3, 0.2 * k); shaker(mus, t + BEAT / 2, 0.05 * k); }

// ------------------------------------------------------------------ SFX
const pop = (t, g = 0.3, f = 700) => add(fx, t, 0.12, u => Math.sin(TAU * (f + 900 * Math.exp(-u * 40)) * u) * Math.exp(-u * 30), g);
const blip = (t, g = 0.18, f = 880) => add(fx, t, 0.09, u => (((f * u) % 1) < 0.5 ? 1 : -1) * Math.exp(-u * 35), g);
const whoosh = (t, g = 0.25, d = 0.45) => { let lp = 0; add(fx, t, d, u => { const k = 0.05 + 0.4 * Math.sin(Math.PI * u / d); lp += k * ((rnd() * 2 - 1) - lp); return lp * Math.sin(Math.PI * u / d); }, g); };
const boing = (t, g = 0.25) => add(fx, t, 0.4, u => Math.sin(TAU * (180 + 120 * Math.sin(u * 40) * Math.exp(-u * 6)) * u) * Math.exp(-u * 7), g);
const thud = (t, g = 0.35) => add(fx, t, 0.2, u => Math.sin(TAU * (70 + 60 * Math.exp(-u * 25)) * u) * Math.exp(-u * 18), g);
const chime = (t, g = 0.14, base = 84) => [0, 4, 7].forEach((s, i) => bell(fx, t + i * 0.06, base + s, g));
// sign wobble, turn, hop + land
boing(0.15, 0.18); whoosh(EV.turn - 0.1, 0.2, 0.3); pop(EV.turn + 0.1, 0.2);
add(fx, EV.hop, 0.3, u => Math.sin(TAU * (300 + 900 * u) * u) * Math.exp(-u * 8), 0.12); thud(EV.hop + 0.62, 0.4); noise(fx, EV.hop + 0.62, 0.3, 0.12, 0.1, u => Math.exp(-u * 12));
// footsteps: soft taps on each contact frame (same integration as the film)
{ const SP = TL.speed, sp = t => { if (t <= SP[0][0]) return SP[0][1]; for (let i = 1; i < SP.length; i++) if (t < SP[i][0]) { const [t0, v0] = SP[i - 1], [t1, v1] = SP[i], k = clamp((t - t0) / (t1 - t0)); return v0 + (v1 - v0) * k * k * (3 - 2 * k); } return SP[SP.length - 1][1]; };
  let ph = 0, last = 0; for (let t = 0; t < EV.stop + 2; t += 1 / 240) { ph += sp(t) / 13 * 8 / 240; const step = Math.floor(ph / 4); if (step !== last && sp(t) > 3 && !isQuiet(t)) { last = step; noise(fx, t, 0.06, 0.05, 0.35, u => Math.exp(-u * 60), step % 2 ? 0.15 : -0.15); } } }
// flour: grab, BOOM, crumble, shake-off
pop(EV.grab, 0.2, 500);
add(fx, EV.boom, 1.2, u => Math.sin(TAU * (45 + 70 * Math.exp(-u * 9)) * u) * Math.exp(-u * 3.2), 0.85);
noise(fx, EV.boom, 1.6, 0.55, 0.22, u => Math.exp(-u * 2.6)); noise(fx, EV.boom + 0.15, 2.4, 0.12, 0.6, u => Math.exp(-u * 1.2) * (0.5 + 0.5 * Math.sin(u * 60)));
noise(fx, EV.resume - 0.3, 0.5, 0.14, 0.5, u => Math.sin(Math.PI * u / 0.5) * (0.6 + 0.4 * Math.sin(u * 90)));
// time-lapse: tick-tock + a day/night sweep
for (let t = EV.lapse[0], i = 0; t < EV.lapse[1]; t += 0.5, i++) add(fx, t, 0.05, u => Math.sin(TAU * (i % 2 ? 1500 : 1900) * u) * Math.exp(-u * 90), 0.08);
whoosh(EV.lapse[0], 0.15, 1.2);
// item pickups
for (let i = 0; i < 6; i++) { const ta = EV.items + i * 0.42; blip(ta, 0.06, 660 + i * 60); chime(ta + 0.5, 0.06, 79 + (i % 3) * 2); }
// freeze: record scratch
add(fx, EV.freeze[0], 0.35, u => { const f = 600 * Math.sin(u * 30) + 200; return Math.sin(TAU * f * u) * (rnd() * 0.6 + 0.4) * Math.exp(-u * 6); }, 0.25);
// scissors: snip snip + toss
[0.15, 0.4].forEach(d => noise(fx, EV.scissors[0] + d, 0.05, 0.2, 0.9, u => Math.exp(-u * 70))); whoosh(EV.toss, 0.18, 0.35);
// vignettes: box plop + twinkle
EV.vign.forEach(ta => { thud(ta + 0.55, 0.16); chime(ta + 0.62, 0.045, 88); });
// birds flutter, jump boing, bakery, notification, menu blips
for (let i = 0; i < 10; i++) noise(fx, EV.birds + i * 0.05, 0.05, 0.08, 0.7, u => Math.exp(-u * 50), (i % 2 ? 0.4 : -0.2));
boing(EV.jump, 0.2); chime(EV.bakery + 0.4, 0.05, 76);
[0, 0.13].forEach((d, i) => bell(fx, EV.notify + d, i ? 88 : 83, 0.12));
{ const ln = TL.lines.find(l => l.id === 'b_order'); [0, 0.16, 0.36, 0.6].forEach(k => blip(ln.at + ln.dur * k, 0.08, 990)); }
// emotes (mirrors the film's list)
[[AT.c_dont.at + 0.1], [EV.boom + 1.2], [AT.c_mmhm.at], [AT.b_what.at + 0.05], [AT.c_nothing.end - 0.2], [AT.c_scissors.at], [AT.b_fine.at + 0.3], [EV.kind], [AT.c_you.at], [AT.c_uhhuh.at], [AT.b_dream.at + 0.4], [AT.c_maybe.at], [AT.c_shy.at + 0.4], [AT.b_journey.end - 0.2]].forEach(([t]) => pop(t, 0.1, 900));
// whip pan, end-card cursor
whoosh(EV.whip, 0.3, 0.55);
for (let t = EV.end + 1.2; t < TL.duration - 1; t += 1.0) blip(t, 0.05, 1320);

// ------------------------------------------------------------------ voices
for (const l of TL.lines) {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', 'voices/' + l.file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  const a = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4), s0 = Math.round(l.at * SR);
  for (let i = 0; i < a.length && s0 + i < N; i++) vox[s0 + i] += a[i] * 0.9 * (l.gain || 1);
}
// ducking: music follows the voice envelope down ~9 dB (smoothed)
let e = 0; const duck = new Float32Array(N);
for (let i = 0; i < N; i++) { const v = Math.abs(vox[i]); e = v > e ? e + (v - e) * 0.02 : e + (v - e) * 0.00012; duck[i] = 1 - 0.65 * clamp(e * 6); }
// mix
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) { const m = duck[i]; L[i] = mus[0][i] * m * 0.9 + fx[0][i] * 0.8 + vox[i]; R[i] = mus[1][i] * m * 0.9 + fx[1][i] * 0.8 + vox[i]; }
const pcm = Buffer.alloc(N * 8); for (let i = 0; i < N; i++) { pcm.writeFloatLE(L[i], i * 8); pcm.writeFloatLE(R[i], i * 8 + 4); }
fs.mkdirSync('out', { recursive: true }); fs.writeFileSync('out/mix.f32', pcm);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', 'out/mix.f32', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', String(SR), 'out/mix.wav']);
fs.unlinkSync('out/mix.f32');
console.log('mix out/mix.wav', TL.duration.toFixed(2) + 's');
