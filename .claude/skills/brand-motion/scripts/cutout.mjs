#!/usr/bin/env node
// Prepare a product photo for the video engine: remove a plain / white / fake-checkerboard background,
// crop to the subject, downscale, and write a transparent PNG. Uses the same headless Chromium as render.mjs.
//
//   node scripts/cutout.mjs in.jpg out.png                       # auto: strip light neutral bg connected to the border, trim, 900px
//   node scripts/cutout.mjs in.png out.png --bg none --crop 640,100,1280,2320   # already transparent: just frame it
//   node scripts/cutout.mjs in.png out.png --bg dark             # strip near-black bg instead
//
// Options
//   --bg auto|light|dark|none   auto = light (default). none = keep existing alpha untouched.
//   --tol 16        max colour spread (max-min of R,G,B) still counted as "neutral background"
//   --light 185     min brightness for light bg (use --dark-max 40 for --bg dark)
//   --crop x,y,w,h  crop to this source-pixel rectangle BEFORE keying (framing only)
//   --trim          crop to the opaque bounding box afterwards (default on unless --crop given with --bg none)
//   --pad 6         transparent padding (px) kept around the subject after trimming
//   --max 900       longest side of the output in px
//
// NOTE: this tool frames and keys images. It does not remove watermarks. If a stock image carries a
// watermark it will still be visible in the video; replace it with the licensed/clean file before publishing.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const argv = process.argv.slice(2);
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['--trim'].includes(argv[i - 1])));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const [inFile, outFile] = pos;
if (!inFile || !outFile) { console.error('usage: cutout.mjs <in> <out.png> [--bg auto|light|dark|none] [--crop x,y,w,h] [--trim] [--pad 6] [--max 900] [--tol 16] [--light 185]'); process.exit(1); }

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js'))('playwright')); }

const ext = path.extname(inFile).toLowerCase();
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'image/png';
const dataUrl = `data:${mime};base64,${fs.readFileSync(inFile).toString('base64')}`;
const o = {
  bg: opt('bg', 'auto'), tol: Number(opt('tol', 16)), light: Number(opt('light', 185)), darkMax: Number(opt('dark-max', 40)),
  crop: opt('crop', null), pad: Number(opt('pad', 6)), max: Number(opt('max', 900)),
  trim: argv.includes('--trim') || !(opt('crop', null) && opt('bg', 'auto') === 'none'),
};

const browser = await chromium.launch({ args: ['--disable-web-security'], proxy: undefined });
const page = await browser.newPage();
const result = await page.evaluate(async ({ dataUrl, o }) => {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (o.crop) [sx, sy, sw, sh] = String(o.crop).split(',').map(Number);
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const id = ctx.getImageData(0, 0, sw, sh), d = id.data, N = sw * sh;

  if (o.bg !== 'none') {
    const dark = o.bg === 'dark';
    const isBg = i => {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
      if (a < 10) return true;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return dark ? mx <= o.darkMax : (mx - mn <= o.tol && mn >= o.light);
    };
    const bg = new Uint8Array(N), stack = [];
    const seed = i => { if (!bg[i] && isBg(i)) { bg[i] = 1; stack.push(i); } };
    for (let x = 0; x < sw; x++) { seed(x); seed((sh - 1) * sw + x); }
    for (let y = 0; y < sh; y++) { seed(y * sw); seed(y * sw + sw - 1); }
    while (stack.length) {
      const i = stack.pop(), x = i % sw, y = (i / sw) | 0;
      if (x > 0) seed(i - 1); if (x < sw - 1) seed(i + 1); if (y > 0) seed(i - sw); if (y < sh - 1) seed(i + sw);
    }
    // erode foreground by 1px (kills the pale halo), then soften the edge with a 3x3 box blur on alpha
    const fg = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (bg[i]) continue;
      const x = i % sw, y = (i / sw) | 0;
      const edge = (x > 0 && bg[i - 1]) || (x < sw - 1 && bg[i + 1]) || (y > 0 && bg[i - sw]) || (y < sh - 1 && bg[i + sw]);
      fg[i] = edge ? 0 : 1;
    }
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = y * sw + x; if (bg[i]) { d[i * 4 + 3] = 0; continue; }
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < sw && yy >= 0 && yy < sh) { s += fg[yy * sw + xx]; n++; } }
      d[i * 4 + 3] = Math.round(255 * (s / n) * (d[i * 4 + 3] / 255));
    }
    ctx.putImageData(id, 0, 0);
  }

  let bx0 = 0, by0 = 0, bx1 = sw, by1 = sh;
  if (o.trim) {
    bx0 = sw; by0 = sh; bx1 = 0; by1 = 0;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (d[(y * sw + x) * 4 + 3] > 12) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    bx1++; by1++;
  }
  const w = bx1 - bx0, h = by1 - by0, scale = Math.min(1, o.max / Math.max(w, h));
  const ow = Math.round(w * scale) + o.pad * 2, oh = Math.round(h * scale) + o.pad * 2;
  const out = document.createElement('canvas'); out.width = ow; out.height = oh;
  const octx = out.getContext('2d'); octx.imageSmoothingQuality = 'high';
  octx.drawImage(c, bx0, by0, w, h, o.pad, o.pad, Math.round(w * scale), Math.round(h * scale));
  return { png: out.toDataURL('image/png').split(',')[1], w: ow, h: oh, src: [img.naturalWidth, img.naturalHeight] };
}, { dataUrl, o });
await browser.close();
fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, Buffer.from(result.png, 'base64'));
console.log(`cutout ${outFile}  ${result.src.join('x')} → ${result.w}x${result.h}`);
