// Jadesserts print pack:  node make-print.mjs  ->  out/  (print-shop PNG/PDF with bleed + US Letter home-print sheets + previews)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, execFileSync } from 'node:child_process';
import { encodeQR, verifyQR } from '../../engine/qr.mjs';
const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); const { chromium } = req('playwright');

const WA = 'https://wa.me/18687154817?text=';
const LINKS = { order: WA + encodeURIComponent("Hi Jade! I'd like to order a Jadesserts box."), review: WA + encodeURIComponent("Hi Jade! I got my Jadesserts box. Here's how it was: ") };
const Q = {};
for (const [k, url] of Object.entries(LINKS)) { const q = encodeQR(url, k === 'review' ? 'Q' : 'M'); const back = verifyQR(q); if (back !== url) throw new Error('QR verify failed for ' + k);
  Q[k] = q.modules; console.log(`QR ${k}: version ${q.version}-${q.ecl}, ${q.size}x${q.size}, verified -> ${back}`); }

const strip = f => fs.readFileSync(f, 'utf8').replace(/^export /gm, '');
const wm = 'data:image/png;base64,' + fs.readFileSync('../jadesserts-review-page/wordmark-480.png').toString('base64');
const page = `<!doctype html><body><script>const WORDMARK=${JSON.stringify(wm)};\n${strip('../../characters/cherry-bomb/pixel/sprites.mjs')}\n${strip('../../engine/pixel/font.mjs')}\n${fs.readFileSync('design.js', 'utf8')}</script></body>`;
fs.mkdirSync('out/print-shop', { recursive: true }); fs.mkdirSync('out/home-print', { recursive: true }); fs.mkdirSync('out/preview', { recursive: true });
const b = await chromium.launch(), p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.setContent(page); const imgs = await p.evaluate(q => window.RENDER(q), Q);
if (errs.length) throw new Error(errs.join('\n'));
const SIZE = { 'business-front': [3.5, 2], 'business-back': [3.5, 2], 'loyalty-front': [3.5, 2], 'loyalty-back': [3.5, 2], insert: [4, 6], seal: [2, 2] };
for (const [k, d] of Object.entries(imgs)) fs.writeFileSync(`out/print-shop/${k}-with-bleed.png`, Buffer.from(d.split(',')[1], 'base64'));
const src = k => 'data:image/png;base64,' + fs.readFileSync(`out/print-shop/${k}-with-bleed.png`).toString('base64');
const BL = 0.125;
// one trimmed piece (crop the bleed) at (x, y) inches on a page
const piece = (k, x, y, round) => { const [w, h] = SIZE[k]; return `<div style="position:absolute;left:${x}in;top:${y}in;width:${w}in;height:${h}in;overflow:hidden;${round ? 'border-radius:50%;' : ''}"><img src="${src(k)}" style="position:absolute;left:-${BL}in;top:-${BL}in;width:${w + 2 * BL}in;height:${h + 2 * BL}in"></div>`; };
// crop marks around a grid of pieces
const marks = (xs, ys) => { let s = ''; const L = 0.22, gap = 0.06, line = (x, y, w, h) => `<div style="position:absolute;left:${x}in;top:${y}in;width:${w}in;height:${h}in;background:#000"></div>`;
  const minY = Math.min(...ys), maxY = Math.max(...ys), minX = Math.min(...xs), maxX = Math.max(...xs);
  xs.forEach(x => { s += line(x - 0.0035, minY - gap - L, 0.007, L) + line(x - 0.0035, maxY + gap, 0.007, L); });
  ys.forEach(y => { s += line(minX - gap - L, y - 0.0035, L, 0.007) + line(maxX + gap, y - 0.0035, L, 0.007); }); return s; };
const pdf = async (file, pages, w = 8.5, h = 11) => { const html = `<!doctype html><style>@page{size:${w}in ${h}in;margin:0}body{margin:0}.pg{position:relative;width:${w}in;height:${h}in;overflow:hidden;page-break-after:always}</style><body>${pages.map(pg => `<div class="pg">${pg}</div>`).join('')}</body>`;
  const pp = await b.newPage(); await pp.setContent(html); await pp.pdf({ path: file, width: w + 'in', height: h + 'in', printBackground: true }); await pp.close(); };
// card grids: 2 x 5 business-card size on Letter (fronts page, then backs page — same positions, so duplex lines up)
const cardGrid = k => { let s = ''; const x0 = 0.75, y0 = 0.5; for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) s += piece(k, x0 + c * 3.5, y0 + r * 2); return s + marks([0.75, 4.25, 7.75], [0.5, 2.5, 4.5, 6.5, 8.5, 10.5]); };
await pdf('out/home-print/business-cards-10-up.pdf', [cardGrid('business-front'), cardGrid('business-back')]);
await pdf('out/home-print/sweet-pass-loyalty-cards-10-up.pdf', [cardGrid('loyalty-front'), cardGrid('loyalty-back')]);
await pdf('out/home-print/box-inserts-2-up.pdf', [piece('insert', 0.25, 2.5) + piece('insert', 4.25, 2.5) + marks([0.25, 4.25, 8.25], [2.5, 8.5])]);
{ let s = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) s += piece('seal', 0.75 + c * 2.5, 0.75 + r * 2.5, true); await pdf('out/home-print/seal-stickers-12-up.pdf', [s]); }
// print-shop PDFs at full bleed size (one per piece)
const shop = async (name, keys) => { const [w, h] = SIZE[keys[0]]; await pdf(`out/print-shop/${name}.pdf`, keys.map(k => `<img src="${src(k)}" style="width:${w + 2 * BL}in;height:${h + 2 * BL}in;display:block">`), w + 2 * BL, h + 2 * BL); };
await shop('business-card', ['business-front', 'business-back']); await shop('sweet-pass-loyalty-card', ['loyalty-front', 'loyalty-back']); await shop('box-insert-4x6', ['insert']); await shop('seal-sticker-2in', ['seal']);
// trimmed previews
for (const k of Object.keys(SIZE)) { const [w, h] = SIZE[k]; execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `out/print-shop/${k}-with-bleed.png`, '-vf', `crop=${w * 300}:${h * 300}:${BL * 300}:${BL * 300}`, `out/preview/${k}.png`]); }
await b.close();
console.log('done', fs.readdirSync('out/print-shop').length, 'print-shop files,', fs.readdirSync('out/home-print').length, 'sheets');
