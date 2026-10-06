#!/usr/bin/env node
// Cut a character "parts sheet" (separate pieces on a flat light background) into transparent PNGs.
//   node scripts/partcut.mjs sheet.png outDir [--thr 232] [--min 250]
// Each connected shape becomes part_NN.png (tight crop, background flood-filled to transparent from the
// crop border only, so enclosed whites — eye whites, shine — survive) + parts.json (boxes) + _overview.png (numbered).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
let chromium; try { ({ chromium } = await import('playwright')); } catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); ({ chromium } = req('playwright')); }
const [src, outDir] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? Number(process.argv[i + 1]) : d; };
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
const data = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const res = await p.evaluate(async ({ data, thr, minA }) => {
  const im = new Image(); im.src = data; await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, W, H).data, bgish = i => d[i * 4] > thr && d[i * 4 + 1] > thr && d[i * 4 + 2] > thr;
  // foreground mask, dilated by 2px so outlines with tiny gaps stay one piece
  const fg = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) fg[i] = bgish(i) ? 0 : 1;
  const dil = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { let on = 0; for (let dy = -2; dy <= 2 && !on; dy++) for (let dx = -2; dx <= 2; dx++) { const X = xx + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && fg[Y * W + X]) { on = 1; break; } } dil[y * W + xx] = on; }
  const lab = new Int32Array(W * H).fill(-1), boxes = [];
  for (let i = 0; i < W * H; i++) { if (!dil[i] || lab[i] >= 0) continue; const id = boxes.length, st = [i]; lab[i] = id; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
    while (st.length) { const k = st.pop(), kx = k % W, ky = (k / W) | 0; n++; if (kx < x0) x0 = kx; if (kx > x1) x1 = kx; if (ky < y0) y0 = ky; if (ky > y1) y1 = ky;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = kx + dx, Y = ky + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (dil[j] && lab[j] < 0) { lab[j] = id; st.push(j); } } }
    boxes.push({ id, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n }); }
  const keep = boxes.filter(bx => bx.n >= minA);
  const outs = keep.map((bx, k) => {
    const pad = 3, X0 = Math.max(0, bx.x - pad), Y0 = Math.max(0, bx.y - pad), w = Math.min(W - X0, bx.w + pad * 2), h = Math.min(H - Y0, bx.h + pad * 2);
    const cc = document.createElement('canvas'); cc.width = w; cc.height = h; const cx = cc.getContext('2d'); cx.drawImage(c, X0, Y0, w, h, 0, 0, w, h);
    const id2 = cx.getImageData(0, 0, w, h), q = id2.data, seen = new Uint8Array(w * h), st = [];
    const isBg = j => { const gx = X0 + (j % w), gy = Y0 + ((j / w) | 0), gi = gy * W + gx; return lab[gi] !== bx.id || bgish(gi); };
    for (let i = 0; i < w; i++) { st.push(i, (h - 1) * w + i); } for (let j = 0; j < h; j++) { st.push(j * w, j * w + w - 1); }
    while (st.length) { const j = st.pop(); if (seen[j] || !isBg(j)) continue; seen[j] = 1; q[j * 4 + 3] = 0; const jx = j % w, jy = (j / w) | 0; if (jx > 0) st.push(j - 1); if (jx < w - 1) st.push(j + 1); if (jy > 0) st.push(j - w); if (jy < h - 1) st.push(j + w); }
    // soften the outer anti-aliased fringe: near-white pixels touching transparency fade out
    for (let j = 0; j < w * h; j++) if (q[j * 4 + 3]) { const m = Math.min(q[j * 4], q[j * 4 + 1], q[j * 4 + 2]); const nb = [j - 1, j + 1, j - w, j + w].some(t => t >= 0 && t < w * h && q[t * 4 + 3] === 0); if (nb && m > 200) q[j * 4 + 3] = Math.round(255 * (255 - m) / 55); }
    cx.putImageData(id2, 0, 0);
    return { k, x: X0, y: Y0, w, h, png: cc.toDataURL('image/png') };
  });
  const ov = document.createElement('canvas'); ov.width = W; ov.height = H; const ox = ov.getContext('2d'); ox.drawImage(c, 0, 0); ox.font = 'bold 22px sans-serif';
  outs.forEach(o => { ox.strokeStyle = '#00a0ff'; ox.lineWidth = 2; ox.strokeRect(o.x, o.y, o.w, o.h); ox.fillStyle = '#0060ff'; ox.fillText(String(o.k), o.x + 2, o.y + 20); });
  return { outs, overview: ov.toDataURL('image/png') };
}, { data, thr: opt('thr', 232), minA: opt('min', 250) });
const meta = res.outs.map(o => { const f = `part_${String(o.k).padStart(2, '0')}.png`; fs.writeFileSync(path.join(outDir, f), Buffer.from(o.png.split(',')[1], 'base64')); return { file: f, x: o.x, y: o.y, w: o.w, h: o.h }; });
fs.writeFileSync(path.join(outDir, 'parts.json'), JSON.stringify(meta, null, 1));
fs.writeFileSync(path.join(outDir, '_overview.png'), Buffer.from(res.overview.split(',')[1], 'base64'));
console.log(`${meta.length} parts → ${outDir}`); await b.close();
