#!/usr/bin/env node
// AREA 47 sonic identity: synthesized, royalty-free, placed on each slide's own events.
//   BEAM  (the audio logo): rising filtered-noise shimmer + glide, ending in a two-note ping (E6 → B6). On the UFO/beam moments.
//   HIT   : sub-bass thump + bright click when a headline lands.
//   ZIP   : UFO flying the dashed path (sine glide with wobble), panned left → right with the swipe.
//   BLOOP : SEV popping in.   SLAM: the CASE CLOSED stamp.   TICK: HUD tags typing on.
//   node sound.mjs → out/slide-N.wav (loudness -16 LUFS so Instagram music can sit on top)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const SR = 44100, TAU = Math.PI * 2;
let seed = 47; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function render(n) {
  const story = JSON.parse(fs.readFileSync(path.join(here, `slide-${n}.json`), 'utf8'));
  const sc = story.scenes[0], DUR = sc.dur + 0.3, N = Math.ceil(DUR * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const add = (t0, dur, fn, g = 1, pan = 0) => {
    const s0 = Math.max(0, Math.round(t0 * SR)), len = Math.min(N - s0, Math.round(dur * SR));
    for (let i = 0; i < len; i++) { const t = i / SR, p = typeof pan === 'function' ? pan(t) : pan, v = fn(t) * g;
      L[s0 + i] += v * Math.cos((p + 1) * Math.PI / 4); R[s0 + i] += v * Math.sin((p + 1) * Math.PI / 4); }
  };
  const lp = () => { let y = 0; return (x, a) => (y += a * (x - y)); };
  const S = {
    beam: t0 => {
      const f = lp(); add(t0, 0.75, t => f(rnd() * 2 - 1, 0.02 + 0.5 * (t / 0.75) ** 2) * Math.sin(Math.PI * Math.min(1, t / 0.75)) * 0.9, 0.5);
      let ph = 0; add(t0, 0.75, t => { ph += (180 * Math.pow(6, t / 0.75)) / SR; return Math.sin(TAU * ph) * (t / 0.75) * Math.exp(-Math.max(0, t - 0.6) * 20); }, 0.18);
      [[1318.5, 0.66], [1975.5, 0.8]].forEach(([fq, at]) => add(t0 + at, 1.2, t => (Math.sin(TAU * fq * t) + 0.3 * Math.sin(TAU * fq * 2.01 * t) * Math.exp(-t / 0.1)) * Math.exp(-t / 0.45) * Math.min(1, t / 0.004), 0.16));
    },
    hit: t0 => {
      add(t0, 0.5, t => Math.sin(TAU * (42 * t + 70 * 0.05 * (1 - Math.exp(-t / 0.05)))) * Math.exp(-t / 0.22) * Math.min(1, t / 0.002), 0.75);
      add(t0, 0.03, t => (rnd() * 2 - 1) * Math.exp(-t / 0.006), 0.35);
    },
    zip: (t0, dur) => { let ph = 0; add(t0, dur, t => { const k = t / dur; ph += (520 + 380 * k + 40 * Math.sin(TAU * 9 * t)) / SR; return Math.sin(TAU * ph) * Math.sin(Math.PI * k) ** 0.6; }, 0.07, t => -0.9 + 1.8 * (t / dur)); },
    bloop: t0 => { let ph = 0; add(t0, 0.25, t => { ph += (260 * Math.pow(3, Math.min(1, t / 0.12))) / SR; return Math.sin(TAU * ph) * Math.exp(-t / 0.09) * Math.min(1, t / 0.005); }, 0.35, 0.5); },
    slam: t0 => { S.hit(t0); const f = lp(); add(t0, 0.35, t => f(rnd() * 2 - 1, 0.25) * Math.exp(-t / 0.08), 0.6); },
    tick: (t0, pan = -0.4) => add(t0, 0.04, t => Math.sin(TAU * 2600 * t) * Math.exp(-t / 0.008), 0.12, pan),
  };
  const at = el => (el.in && typeof el.in.at === 'number' ? el.in.at : 0);
  const isSev = el => el.type === 'group' && (el.children || []).some(c => String(c.src || '').includes('/sev/'));
  sc.elements.forEach(el => {
    if (el.type === 'text' && el.role === 'display' && el.in) S.hit(at(el) + 0.12);
    else if (el.type === 'path' && el.head && el.in) S.zip(at(el), el.in.dur || 1.3);
    else if (el.type === 'poly' && el.blend === 'screen' && el.moves) S.beam(el.moves[0].at - 0.35);
    else if (isSev(el) && el.in) S.bloop(at(el) + 0.3);
    else if (el.type === 'group' && (el.children || []).some(c => c.text === 'Case closed')) S.slam(at(el));
    else if (el.type === 'group' && el.sfx === 'tick' && el.in) S.tick(at(el));
    else if (el.type === 'logo' && el.in && n === 6) S.beam(at(el) - 0.2);
  });
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.tanh(L[i]) * 30000), 44 + i * 4); buf.writeInt16LE(Math.round(Math.tanh(R[i]) * 30000), 46 + i * 4); }
  fs.mkdirSync(path.join(here, 'out'), { recursive: true });
  const raw = path.join(here, 'out', `slide-${n}.raw.wav`), wav = path.join(here, 'out', `slide-${n}.wav`);
  fs.writeFileSync(raw, buf);
  execSync(`ffmpeg -y -loglevel error -i "${raw}" -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar ${SR} "${wav}"`); fs.unlinkSync(raw);
  console.log(`out/slide-${n}.wav ${sc.dur}s`);
}
for (let n = 1; n <= 6; n++) render(n);
