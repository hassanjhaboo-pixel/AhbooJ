#!/usr/bin/env node
// Render a built HTML motion file to MP4 (frame-exact) and/or stills, using headless Chromium + ffmpeg.
//
//   node scripts/render.mjs out/pop-pulse.html                       -> out/pop-pulse.mp4
//   node scripts/render.mjs out/pop-pulse.html --audio track.wav      -> muxed with audio (see scripts/audio.mjs)
//   node scripts/render.mjs out/pop-pulse.html --blur 4               -> motion blur: 4 sub-frames per frame (180° shutter)
//   node scripts/render.mjs out/pop-pulse.html --stills 0.5,2,4.2     -> PNG stills at those seconds (no video)
//   node scripts/render.mjs out/pop-pulse.html --sheet 12             -> contact sheet of 12 evenly-spaced frames (QA)
//   node scripts/render.mjs out/pop-pulse.html --qa                   -> motion-energy report: flags dead air & blank frames
//   node scripts/render.mjs out/pop-pulse.html --gif                  -> also writes a 540px-wide GIF preview
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const file = argv.find(a => !a.startsWith('--') && /\.html?$/.test(a));
const opt = k => { const i = argv.indexOf(`--${k}`); return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
if (!file) { console.error('usage: render.mjs <file.html> [--out x.mp4] [--audio a.wav] [--blur 4] [--stills 1,2.5] [--sheet 12] [--qa] [--gif] [--fps 30]'); process.exit(1); }

// Resolve playwright from the project or from the global install.
let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js'));
  ({ chromium } = req('playwright'));
}

const launch = { args: ['--disable-web-security', '--font-render-hinting=none'] };
// Headless Chromium ignores HTTPS_PROXY by default; pass it through so web fonts load in proxied environments.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxy) launch.proxy = { server: proxy, bypass: process.env.NO_PROXY || process.env.no_proxy || '' };
const browser = await chromium.launch(launch);
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') { if (!/ERR_TUNNEL|Failed to load resource/.test(m.text())) console.warn('[page]', m.text()); } });
await page.goto(pathToFileURL(path.resolve(file)).href + '?render=1');
await page.waitForFunction(() => window.MG_ready !== undefined);
await page.evaluate(() => window.MG_ready);
const { duration, fps: storyFps, size } = await page.evaluate(() => ({ duration: window.MG_duration, fps: window.MG_fps, size: window.MG_size }));
const fps = Number(opt('fps')) || storyFps;
const blur = Math.max(1, Number(opt('blur')) || 1), shutter = Number(opt('shutter')) || 0.5;
await page.setViewportSize({ width: size[0], height: size[1] });

// Sub-frame accumulation = motion blur (running average, sample times centred on t so timing stays in sync).
const grab = async t => {
  const b64 = await page.evaluate(({ t, n, shutter, fps, dur }) => {
    const c = document.getElementById('c');
    if (n <= 1) { window.MG_seek(t); return c.toDataURL('image/png').split(',')[1]; }
    let acc = window.__acc;
    if (!acc) { acc = window.__acc = document.createElement('canvas'); acc.width = c.width; acc.height = c.height; }
    const a = acc.getContext('2d');
    for (let i = 0; i < n; i++) {
      const st = Math.min(dur - 1e-4, Math.max(0, t + ((i + 0.5) / n - 0.5) * (shutter / fps)));
      window.MG_seek(st); a.globalAlpha = 1 / (i + 1); a.drawImage(c, 0, 0);
    }
    a.globalAlpha = 1;
    return acc.toDataURL('image/png').split(',')[1];
  }, { t, n: blur, shutter, fps, dur: duration });
  return Buffer.from(b64, 'base64');
};
const base = file.replace(/\.html?$/, '');

if (opt('stills')) {
  for (const s of String(opt('stills')).split(',').map(Number)) {
    const out = `${base}@${s.toFixed(2)}s.png`;
    fs.writeFileSync(out, await grab(s)); console.log('still', out);
  }
  await browser.close(); process.exit(0);
}

if (opt('sheet')) {
  const n = Number(opt('sheet')) || 12, dir = `${base}_sheet`;
  fs.mkdirSync(dir, { recursive: true });
  const times = Array.from({ length: n }, (_, i) => (duration * (i + 0.5)) / n);
  for (let i = 0; i < n; i++) fs.writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}.png`), await grab(times[i]));
  const cols = Math.min(n, size[0] > size[1] ? 3 : 6), tw = size[0] > size[1] ? 480 : 270;
  execSync(`ffmpeg -y -loglevel error -framerate 1 -i "${dir}/%02d.png" -vf "scale=${tw}:-1,drawtext=text='%{n}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=${cols}x${Math.ceil(n / cols)}:padding=6:color=0x222222" -frames:v 1 "${base}_sheet.png"`);
  console.log(`sheet ${base}_sheet.png  (frames at ${times.map(t => t.toFixed(1)).join(', ')}s)`);
  await browser.close(); process.exit(0);
}

if (opt('qa')) {
  // Motion energy = mean absolute pixel change between samples (0–255) on a downscaled copy.
  // "Dead air" = a stretch ≥ 0.8s where almost nothing moves. Viewers read that as a frozen slideshow.
  const step = 0.1;
  const series = await page.evaluate(({ dur, step }) => {
    const c = document.getElementById('c'), sw = 160, sh = Math.round((c.height / c.width) * 160);
    const small = document.createElement('canvas'); small.width = sw; small.height = sh;
    const s = small.getContext('2d', { willReadFrequently: true });
    const out = []; let prev = null;
    for (let t = 0; t < dur; t += step) {
      window.MG_seek(t); s.drawImage(c, 0, 0, sw, sh);
      const d = s.getImageData(0, 0, sw, sh).data;
      let diff = 0, mean = 0, sq = 0;
      for (let i = 0; i < d.length; i += 4) { const l = (d[i] * 2 + d[i + 1] * 5 + d[i + 2]) / 8; mean += l; sq += l * l; if (prev) diff += Math.abs(l - prev[i / 4]); }
      const n = d.length / 4; mean /= n;
      const lum = new Float32Array(n); for (let i = 0; i < d.length; i += 4) lum[i / 4] = (d[i] * 2 + d[i + 1] * 5 + d[i + 2]) / 8;
      out.push({ t, e: prev ? diff / n : 0, std: Math.sqrt(Math.max(0, sq / n - mean * mean)) }); prev = lum;
    }
    return out;
  }, { dur: duration, step });
  const thr = Number(opt('qa-thr')) || 0.12, minRun = 0.8;
  console.log(`QA motion energy (${step}s steps, threshold ${thr}):`);
  for (let i = 0; i < series.length; i += 5) {
    const b = series.slice(i, i + 5), m = b.reduce((a, x) => a + x.e, 0) / b.length;
    console.log(`${b[0].t.toFixed(1).padStart(5)}s ${m.toFixed(2).padStart(6)} ${'#'.repeat(Math.min(60, Math.round(m * 4)))}`);
  }
  const runs = []; let start = null;
  series.forEach((x, i) => { const still = i > 0 && x.e < thr; if (still && start == null) start = x.t - step; if ((!still || i === series.length - 1) && start != null) { const end = still ? x.t : x.t - step; if (end - start >= minRun) runs.push([start, end]); start = null; } });
  const blank = series.filter(x => x.std < 1.5).map(x => x.t);
  if (runs.length) console.log(`\n! dead air (≥${minRun}s with ~no motion): ${runs.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)}s`).join(', ')}`);
  else console.log('\n✓ no dead air');
  if (blank.length) console.log(`! blank/flat frames at: ${blank.slice(0, 12).map(t => t.toFixed(1)).join(', ')}s${blank.length > 12 ? ' …' : ''}`);
  else console.log('✓ no blank frames');
  await browser.close(); process.exit(0);
}

const out = opt('out') && opt('out') !== true ? opt('out') : `${base}.mp4`;
const audio = opt('audio');
const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
if (audio && audio !== true) ffArgs.push('-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
ffArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
const total = Math.round(duration * fps);
for (let f = 0; f < total; f++) {
  const buf = await grab(f / fps);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % fps === 0) process.stdout.write(`\rframe ${f}/${total}`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
console.log(`\nrendered ${out}  (${duration.toFixed(2)}s @ ${fps}fps, ${size[0]}x${size[1]}${blur > 1 ? `, motion blur ×${blur}` : ''}${audio && audio !== true ? ', with audio' : ''})`);
if (opt('gif')) {
  const gif = out.replace(/\.mp4$/, '.gif');
  execSync(`ffmpeg -y -loglevel error -i "${out}" -vf "fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" "${gif}"`);
  console.log('gif', gif);
}
await browser.close();
