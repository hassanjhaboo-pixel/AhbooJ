#!/usr/bin/env node
// "Jadesserts — SWEET.WAV": a 32 s pixel-art synthwave piece, 9:16. Every pixel is drawn on a 180×320 grid and
// upscaled ×6 with hard edges; equalizers, the sun's slits, the grid's pulse and the letters all read the real
// spectrum of the score (score.mjs), so picture and sound are one thing.
//   node score.mjs && node make.mjs → out/sweetwav.html (live preview: click to play) → render with ../../scripts/render.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(fs.readFileSync(path.join(here, 'out/spectrum.json'), 'utf8'));
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(here, '../../brand/assets/jadesserts/logo.png')).toString('base64');

const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jadesserts SWEET.WAV</title>
<style>html,body{margin:0;background:#120814;height:100%;display:flex;align-items:center;justify-content:center}canvas{height:100vh;max-width:100vw;image-rendering:pixelated;cursor:pointer}</style>
</head><body><canvas id="c" width="1080" height="1920"></canvas>
<script>
const SPEC = ${JSON.stringify(spec)};
const LOGO_SRC = "${logo}";
const W = 180, H = 320, S = 6, FPS = 30, DUR = 32.8, BEAT = 0.5, BAR = 2;
const out = document.getElementById('c'), o = out.getContext('2d');
const lo = document.createElement('canvas'); lo.width = W; lo.height = H; const g = lo.getContext('2d');
const bl = document.createElement('canvas'); bl.width = 90; bl.height = 160; const bg = bl.getContext('2d');
const tint = document.createElement('canvas'); tint.width = W; tint.height = H; const tg = tint.getContext('2d');

// ---------- palette (Jadesserts brand → neon night) ----------
const C = { void: '#120814', night: '#1d0b22', plum: '#2e0f36', wine: '#4a1645', mag: '#7a1f5c', rose: '#b8325f', coral: '#f4636f', deep: '#dd4652',
  peach: '#ffab55', sun: '#ffd36b', cream: '#fef9f6', white: '#ffffff', blush: '#ffc7cf', pink: '#ffa3ae', lilac: '#c9b3ea', lav: '#a687d9', mint: '#7fd2a2', ink: '#4a2c33' };
const SKY = [C.void, C.night, C.plum, C.wine, C.mag, C.rose, C.coral, C.peach];
const SUNG = [C.sun, C.sun, C.peach, C.peach, C.coral, C.coral, C.deep, C.mag];

// ---------- helpers ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const eOut = t => 1 - Math.pow(1 - clamp(t), 3), eIn = t => Math.pow(clamp(t), 3), eBack = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const fr = t => Math.min(SPEC.bands.length - 1, Math.max(0, Math.floor(t * FPS)));
const band = (t, b) => SPEC.bands[fr(t)][b] / 99;
const env = (k, t) => SPEC[k][fr(t)] / 99;
const lowE = t => (band(t, 0) + band(t, 1) + band(t, 2) + band(t, 3)) / 4;
const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const pats = {};
function dpat(col, lvl) { // 4×4 ordered-dither pattern: lvl 0..16 pixels set
  const k = col + lvl; if (pats[k]) return pats[k];
  const c = document.createElement('canvas'); c.width = c.height = 4; const x = c.getContext('2d'); x.fillStyle = col;
  for (let i = 0; i < 16; i++) if (BAYER[i] < lvl) x.fillRect(i % 4, i >> 2, 1, 1);
  return (pats[k] = g.createPattern(c, 'repeat'));
}
const drect = (x, y, w, h, col, a) => { const lvl = Math.round(clamp(a) * 16); if (!lvl) return; g.fillStyle = lvl >= 16 ? col : dpat(col, lvl); g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function gradRow(y, w, cols, t, x0 = 0) { // one row of a dithered multi-stop gradient
  const p = clamp(t) * (cols.length - 1), i = Math.floor(p), f = p - i;
  rect(x0, y, w, 1, cols[i]); if (i + 1 < cols.length) drect(x0, y, w, 1, cols[i + 1], f);
}
function line(x0, y0, x1, y1, col, a = 1) { // pixel line (Bresenham-ish), dither alpha
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0;
  const lvl = Math.round(clamp(a) * 16); g.fillStyle = col;
  while (n++ < 600) { if (BAYER[((y0 & 3) << 2) | (x0 & 3)] < lvl) g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

// ---------- 5×7 pixel font ----------
const FONT = {A:'01110100011000111111100011000110001',B:'11110100011000111110100011000111110',C:'01110100011000010000100001000101110',D:'11110100011000110001100011000111110',E:'11111100001000011110100001000011111',F:'11111100001000011110100001000010000',G:'01110100011000010111100011000101111',H:'10001100011000111111100011000110001',I:'01110001000010000100001000010001110',J:'00111000100001000010000101001001100',K:'10001100101010011000101001001010001',L:'10000100001000010000100001000011111',M:'10001110111010110101100011000110001',N:'10001100011100110101100111000110001',O:'01110100011000110001100011000101110',P:'11110100011000111110100001000010000',Q:'01110100011000110001101011001001101',R:'11110100011000111110101001001010001',S:'01111100001000001110000010000111110',T:'11111001000010000100001000010000100',U:'10001100011000110001100011000101110',V:'10001100011000110001100010101000100',W:'10001100011000110101101011010101010',X:'10001100010101000100010101000110001',Y:'10001100010101000100001000010000100',Z:'11111000010001000100010001000011111',
'0':'01110100011001110101110011000101110','1':'00100011000010000100001000010001110','2':'01110100010000100010001000100011111','3':'11110000010000101110000010000111110','4':'00010001100101010010111110001000010','5':'11111100001111000001000011000101110','6':'00110010001000011110100011000101110','7':'11111000010001000100010000100001000','8':'01110100011000101110100011000101110','9':'01110100011000101111000010001001100',
' ':'00000000000000000000000000000000000','.':'00000000000000000000000000110001100','!':'00100001000010000100001000000000100',':':'00000011000110000000011000110000000','-':'00000000000000011111000000000000000','(':'00010001000100001000010000010000010',')':'01000001000001000010000100010001000','/':'00001000100001000100010000100010000','>':'01000001000001000001000100010001000','_':'00000000000000000000000000000011111','?':'01110100010000100010001000000000100',',':'00000000000000000000001100010001000',"'":'00100001000100000000000000000000000','%':'11001110010001000100010001001110011','[':'01110010000100001000010000100001110',']':'01110000100001000010000100001001110','#':'01010111110101001010111110101000000','*':'00000101010111001110101010000000000','~':'00000000000100010101000100000000000','h':'01010111111111111111011100010000000'};
function text(str, x, y, col, s = 1, o2 = {}) {
  const chars = [...str], cw = 6 * s, total = chars.length * cw - s;
  let cx = o2.align === 'center' ? Math.round(x - total / 2) : o2.align === 'right' ? Math.round(x - total) : x;
  chars.forEach((ch, i) => {
    const gl = FONT[ch] || FONT[ch.toUpperCase()] || FONT['?'];
    const sy = o2.stretch ? o2.stretch(i) : 1, dy = o2.dy ? o2.dy(i) : 0, cc = o2.colorAt ? o2.colorAt(i) : col;
    if (o2.reveal != null && i >= o2.reveal) return;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gl[r * 5 + c] === '1') {
      const py = y + dy - Math.round((7 - r) * s * sy), ph = Math.max(1, Math.round(s * sy));
      if (o2.shadow) rect(cx + c * s + s, py + s, s, ph, o2.shadow);
      rect(cx + c * s, py, s, ph, cc);
    }
    cx += cw;
  });
  return total;
}

// ---------- 16×16 sprites (the six Sweet Box items + friends) ----------
const SP = {
cupcake:['.......pp.......','......pPPp......','.......kk.......','....cccccccc....','...cccccccccc...','..cccbccccbccc..','..cccccccccccc..','...cccccccccc...','...BBBBBBBBBB...','...bBbBbBbBbB...','....bBbBbBbBb...','....BbBbBbBbB...','.....bBbBbBb....','.....BBBBBBB....'],
bread:['................','..NNNNNNNNNNNN..','.NnnnnnnnnnnnnN.','.NnynnNnnynnnnN.','.NnnnnnnnyNnnnN.','.NnNnnynnnnnnnN.','.NnnnnnnnnNynnN.','.NnnynnNnnnnnnN.','.NnnnnnnnnynnnN.','.NnNnnnnnnnnNnN.','.NNNNNNNNNNNNNN.'],
punch:['.........w......','........w.......','..rrrrrrwrrrr...','..rpppppwpprgg..','...ppppppppgGGg.','...pPpppppppgg..','...pppppPppp....','....pppppppp....','....pPpppppp....','....ppppppPp....','....pppppppp....','.....rrrrrr.....'],
tart:['................','.....tttttt.....','...tttPPPPttt...','..ttPPPpPPPPtt..','..tPPpwPPPPPPt..','..tPPPPPPPpPPt..','..tPPPPPPPPPPt..','..ttPPPPPPPPtt..','...tttttttttt...','....oooooooo....'],
cheese:['................','....tttttttt....','..ttoooooootttt.','.tttyyyoyyyytttt','.ttyyyyyyyyyyytt','.ttyyyyyyyyyyytt','.tttttttttttttt.','..tttttttttttt..','...tttttttttt...'],
chicken:['.......tt.......','......tooo......','.....tooott.....','....toootoot....','...tooottoooot..','..toootoooootot.','.toooooooooooott','.tttttttttttttt.'],
cherry:['.........G......','........GG......','.......G.G......','......G...G.....','.....G.....G....','....G.......G...','...pp......pp...','..pPPp....pPPp..','..pwPP....pwPP..','..pPPP....pPPP..','...PP......PP...'],
box:['......l..l......','.....lLl.lLl....','......LLLL......','..BBBBBBLLBBBBB.','..BBBBBBLLBBBBB.','..bbbbbbLLbbbbb.','..bbbbbbLLbbbbb.','..bbbppbLLbbbbb.','..bbpPPpLLbbbbb.','..bbbPpbLLbbbbb.','..bbbbbbLLbbbbb.','..bbbbbbLLbbbbb.','..BBBBBBLLBBBBB.'],
heart:['.pp.pp.','ppppppp','pwppppp','ppppppp','.ppppp.','..ppp..','...p...'],
};
const SPC = { k: C.ink, w: C.white, c: C.cream, p: C.coral, P: C.deep, b: C.blush, B: C.pink, y: '#ffcd3c', o: C.peach, n: '#b07a4a', N: '#6b3f2a', g: C.mint, G: '#3e9e6a', l: C.lilac, L: C.lav, r: '#d6eef8', t: '#e8c79a' };
function sprite(name, x, y, s = 1, o2 = {}) {
  const rows = SP[name], h = rows.length, w = rows[0].length;
  const ox = Math.round(x - (w * s) / 2), oy = Math.round(y - h * s); // anchor: bottom-centre
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '.') return; const col = o2.flash ? C.white : SPC[ch];
    if (o2.outline) rect(ox + c * s - 1, oy + r * s - 1, s + 2, s + 2, o2.outline);
    rect(ox + c * s, oy + r * s, s, s, col); }));
  if (o2.outline) rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') rect(ox + c * s, oy + r * s, s, s, o2.flash ? C.white : SPC[ch]); }));
}
const ITEMS = [['cupcake', 'VANILLA CUPCAKE'], ['bread', 'CHOC BANANA BREAD'], ['punch', 'FRUIT PUNCH LIMEADE'], ['tart', 'CHERRY JAM TART'], ['cheese', 'CHEESE PASTE PUFF'], ['chicken', 'CHICKEN PUFF PASTRY']];

// ---------- the pixel logo: real logo → 128 px wide, snapped to the brand palette, 1 px outline ----------
let LOGO = null;
function buildLogo(img) {
  const w = 128, h = Math.round(w * img.naturalHeight / img.naturalWidth), c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), P = [C.coral, C.deep, C.pink, C.blush, C.cream, C.ink, C.mint, '#3e9e6a', '#b07a4a'].map(hx => [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16)));
  const px = [];
  for (let i = 0; i < w * h; i++) { const a = d.data[i * 4 + 3]; if (a < 110) { px.push(-1); continue; } const r = d.data[i * 4], gg = d.data[i * 4 + 1], b = d.data[i * 4 + 2];
    let best = 0, bd = 1e9; P.forEach((p, k) => { const dd = (p[0] - r) ** 2 * 0.3 + (p[1] - gg) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (dd < bd) { bd = dd; best = k; } }); px.push(best); }
  const cv = document.createElement('canvas'); cv.width = w + 2; cv.height = h + 2; const y = cv.getContext('2d');
  const at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? -1 : px[j * w + i]);
  y.fillStyle = C.void; for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (at(i, j) < 0 && (at(i - 1, j) >= 0 || at(i + 1, j) >= 0 || at(i, j - 1) >= 0 || at(i, j + 1) >= 0)) y.fillRect(i + 1, j + 1, 1, 1);
  const hexes = [C.coral, C.deep, C.pink, C.blush, C.cream, C.ink, C.mint, '#3e9e6a', '#b07a4a'];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = px[j * w + i]; if (k >= 0) { y.fillStyle = hexes[k]; y.fillRect(i + 1, j + 1, 1, 1); } }
  LOGO = cv;
}
function drawLogo(cx, cy, sc = 1, a = 1) { if (!LOGO) return; const w = LOGO.width * sc, h = LOGO.height * sc; g.save(); g.globalAlpha = a; g.drawImage(LOGO, Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h)); g.restore(); }

// ---------- world layers ----------
const HZ = 196; // horizon row
function sky(t, hz = HZ, warm = 1) {
  for (let y = 0; y < hz; y++) gradRow(y, W, SKY, Math.pow(y / hz, 1.35) * warm);
  for (let i = 0; i < 70; i++) { // stars
    const sx = Math.floor(hash(i, 1) * W), sy = Math.floor(hash(i, 2) * hz * 0.7), tw = 0.5 + 0.5 * Math.sin(t * (2 + hash(i, 3) * 4) + i);
    if (tw > 0.35) rect(sx, sy, 1, 1, tw > 0.85 ? C.white : C.lilac);
    if (tw > 0.95 && i % 7 === 0) { rect(sx - 1, sy, 3, 1, C.pink); rect(sx, sy - 1, 1, 3, C.pink); }
  }
}
function sun(t, cx, cy, r, rise = 1) {
  const bass = lowE(t);
  for (let dy = -r; dy <= r; dy++) {
    const y = cy + dy; if (y >= HZ) break;
    const hw = Math.sqrt(r * r - dy * dy), k = (dy + r) / (2 * r);
    if (k > 0.45) { const per = 7, gap = Math.floor((k - 0.45) * 9 + bass * 2.5), ph = Math.floor((t * 14) % per); if ((dy + ph + 100) % per < gap) continue; } // the slits breathe with the bass
    gradRow(y, Math.round(hw * 2), SUNG, k, Math.round(cx - hw));
  }
  drect(cx - r - 6, HZ - 3, 2 * r + 12, 3, C.peach, 0.35 + 0.4 * bass);
}
const MTN = Array.from({ length: W }, (_, x) => 10 + 9 * Math.abs(Math.sin(x * 0.045 + 1)) + 6 * Math.abs(Math.sin(x * 0.11 + 3)) + 3 * hash(x, 9));
function mountains(t) {
  for (let x = 0; x < W; x++) { const h = Math.round(MTN[x]); rect(x, HZ - h, 1, h, C.plum); rect(x, HZ - h, 1, 1, C.rose); if (x % 3 === 0) drect(x, HZ - h + 1, 1, 2, C.mag, 0.5); }
}
function grid(t, speed = 1, glow = 0) {
  rect(0, HZ, W, H - HZ, C.void);
  const kick = env('kick', t), scroll = (t * 1.6 * speed) % 1;
  for (let i = 0; i < 18; i++) { // horizontal lines rushing toward us
    const z = (i + 1 - scroll), y = HZ + Math.round(Math.pow(z / 18, 2.2) * (H - HZ) * 1.02);
    if (y <= HZ || y >= H) continue;
    const a = clamp(0.25 + z / 14 + kick * 0.4 + glow);
    rect(0, y, W, 1, a > 0.8 ? C.pink : C.mag); if (a > 0.6) drect(0, y + 1, W, 1, C.rose, a - 0.5);
  }
  for (let i = -14; i <= 14; i++) { // verticals converge to the vanishing point
    const xb = W / 2 + i * 22, a = clamp(0.6 + kick * 0.4 + glow - Math.abs(i) * 0.02);
    line(W / 2 + i * 1.2, HZ, xb, H, Math.abs(i) < 3 ? C.pink : C.mag, a);
  }
  drect(0, HZ, W, 6, C.coral, 0.25 + kick * 0.35 + glow * 0.5); // horizon glow
}
// LED-meter equalizer skyline: n columns, segment colours climb mint→peach→coral→pink, peak caps fall with gravity
function eqCity(t, baseY, maxH, n = 16, x0 = 2, x1 = W - 2, rise = 1, mirrorTop = false) {
  const span = x1 - x0, cw = Math.floor(span / n), bw = cw - 2;
  const tops = [];
  for (let i = 0; i < n; i++) {
    const b = Math.min(31, Math.floor(i * 32 / n) + 1), v = band(t, b) * rise, hgt = Math.round(v * maxH), x = x0 + i * cw + 1;
    const segs = Math.floor(hgt / 3);
    for (let s = 0; s < segs; s++) { const k = s * 3 / maxH, col = k < 0.35 ? C.mint : k < 0.6 ? C.peach : k < 0.82 ? C.coral : C.pink;
      rect(x, baseY - (s + 1) * 3, bw, 2, col); if (mirrorTop) rect(x, (H - baseY) + s * 3, bw, 2, col); }
    let pk = 0; for (let k = 0; k < 24; k++) { const tt = t - k / FPS; if (tt < 0) break; pk = Math.max(pk, band(tt, b) * rise - 0.9 * (k / FPS) * (k / FPS) * 3); }
    const py = baseY - Math.round(pk * maxH) - 2; rect(x, py, bw, 1, C.white); if (mirrorTop) rect(x, H - py, bw, 1, C.white);
    tops.push([x + bw / 2, baseY - segs * 3]);
  }
  return tops;
}

// ---------- post: upscale, bloom, RGB split, scanlines, vignette ----------
let SCAN = null;
function post(t, split = 0, shake = 0) {
  o.imageSmoothingEnabled = false; o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.filter = 'none';
  const sx = shake ? Math.round((hash(fr(t), 1) - 0.5) * shake) * S : 0, sy = shake ? Math.round((hash(fr(t), 2) - 0.5) * shake) * S : 0;
  o.fillStyle = C.void; o.fillRect(0, 0, 1080, 1920);
  o.drawImage(lo, sx, sy, 1080, 1920);
  if (split > 0.02) { // chromatic split: magenta and cyan ghosts
    [['#ff2a6d', -1], ['#05d9e8', 1]].forEach(([col, d]) => { tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.drawImage(lo, 0, 0); tg.globalCompositeOperation = 'multiply'; tg.fillStyle = col; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(lo, 0, 0);
      o.globalCompositeOperation = 'screen'; o.globalAlpha = 0.55 * split; o.drawImage(tint, sx + d * Math.round(2 + split * 3) * S / 2, sy, 1080, 1920); });
    o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  }
  bg.clearRect(0, 0, 90, 160); bg.imageSmoothingEnabled = true; bg.filter = 'brightness(1.1) saturate(1.3)'; bg.drawImage(lo, 0, 0, 90, 160); bg.filter = 'none';
  o.imageSmoothingEnabled = true; o.globalCompositeOperation = 'lighter'; o.globalAlpha = 0.22; o.filter = 'blur(28px)'; o.drawImage(bl, sx, sy, 1080, 1920); o.filter = 'none';
  o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.imageSmoothingEnabled = false;
  if (!SCAN) { SCAN = document.createElement('canvas'); SCAN.width = 1080; SCAN.height = 1920; const x = SCAN.getContext('2d'); x.fillStyle = 'rgba(10,0,16,0.22)'; for (let y = 0; y < 1920; y += S) x.fillRect(0, y + S - 2, 1080, 2);
    const v = x.createRadialGradient(540, 960, 500, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(8,0,12,0.6)'); x.fillStyle = v; x.fillRect(0, 0, 1080, 1920); }
  o.drawImage(SCAN, 0, 0);
}

// ---------- the film ----------
function frame(t) {
  g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.clearRect(0, 0, W, H); rect(0, 0, W, H, C.void);
  const kick = env('kick', t), snare = env('snare', t), crash = env('crash', t), lead = env('lead', t);
  let split = snare * 0.5 + crash * 0.8, shake = 0;

  if (t < 4) { // ===== BOOT =====
    const on = clamp(t / 0.35);
    if (t < 0.35) { const hgt = Math.max(1, Math.round(eIn(on) * H)); rect(0, H / 2 - hgt / 2, W, hgt, on < 0.6 ? C.white : C.night); rect(W / 2 - 40 * (1 - on), H / 2, 80 * (1 - on), 1, C.white); }
    else {
      for (let y = 0; y < H; y++) if (y % 2 === 0) drect(0, y, W, 1, C.plum, 0.25);
      const L = ['JADESSERTS OS V1.0', '(C) JADE', '', '> LOADING SWEET BOX...', '', '> 6 ITEMS FOUND', '> ADDING LOVE............OK', '> TASTE TEST.............OK'];
      L.forEach((ln, i) => { const at = 0.45 + i * 0.28; if (t < at) return; text(ln, 8, 40 + i * 10, i < 2 ? C.pink : C.lilac, 1, { reveal: Math.floor((t - at) * 40) }); });
      const p = clamp((t - 1.4) / 1.9), bw = 120; text('[', 8, 140, C.lilac); rect(14, 133, Math.round(bw * p), 7, C.coral); drect(14, 133, Math.round(bw * p), 7, C.peach, 0.5); text(']', 14 + bw + 1, 140, C.lilac);
      text(Math.round(p * 100) + '%', 8 + bw + 14, 140, C.cream);
      ITEMS.forEach(([sp], i) => { if (p * 6 > i + 0.5) sprite(sp, 20 + i * 28, 182 - Math.round(4 * eOut((p * 6 - i - 0.5) * 3) * (1 - eOut((p * 6 - i - 0.5) * 2))), 1); });
      eqCity(t, 240, 40, 24, 8, W - 8, 1);
      if (t > 3.2 && Math.floor(t * 4) % 2 === 0) text('PRESS START h', W / 2, 286, C.cream, 1, { align: 'center' });
      if (Math.floor(t * 3) % 2 === 0) rect(8 + 6 * 26, 113, 5, 7, C.cream);
      if (t > 3.75) drect(0, 0, W, H, C.white, (t - 3.75) / 0.25); // dissolve into the world
    }
  } else if (t < 8) { // ===== RISE: the synth sunset =====
    const k = (t - 4) / 4;
    sky(t); sun(t, W / 2, Math.round(lerp(HZ + 40, HZ - 34, eOut(k * 1.3))), 36); mountains(t); grid(t, 0.6 + k * 0.6);
    if (t < 4.3) drect(0, 0, W, H, C.white, 1 - (t - 4) / 0.3);
    const tl = t - 5.2; if (tl > 0) { text('SWEET.WAV', W / 2, 60, C.cream, 3, { align: 'center', shadow: C.mag, dy: i => -Math.round(band(t, 3 + i * 3) * 6) }); text('A JADESSERTS TRANSMISSION', W / 2, 76, C.pink, 1, { align: 'center', reveal: Math.floor(tl * 30) }); }
    const mq = 'NOW PLAYING: THE SWEET BOX  h  6 TREATS  h  MADE BY JADE  h  '; const off = Math.floor(t * 30) % (mq.length * 6);
    rect(0, 296, W, 11, C.void); text(mq + mq, -off, 305, C.peach);
  } else if (t < 16) { // ===== EQUALIZER CITY: the six treats ride the bars =====
    const k = (t - 8) / 8;
    sky(t, HZ, 1); sun(t, W / 2, HZ - 34, 36); mountains(t); grid(t, 1.2);
    const tops = eqCity(t, HZ + 2, 104, 12, 2, W - 2, clamp((t - 8) / 0.6));
    ITEMS.forEach(([sp, name], i) => {
      const at = 8.5 + i * 1.25, lt = t - at; if (lt < 0) return;
      const col = [1, 3, 5, 7, 9, 11][i], [bx, by] = tops[col];
      const fall = lt < 0.35 ? -60 * Math.pow(1 - lt / 0.35, 2) : 0, bounce = Math.round(kick * 3);
      sprite(sp, bx, by - 1 + fall - bounce, 1, { outline: C.void, flash: lt < 0.06 });
      if (lt < 1.25) { const a = lt < 1.0 ? 1 : 1 - (lt - 1.0) / 0.25; rect(0, 30, W, 18, C.void); drect(0, 30, W, 18, C.mag, 0.4); if (a > 0.3) text(name, W / 2, 43, i % 2 ? C.mint : C.peach, 1, { align: 'center', reveal: Math.floor(lt * 40) }); text((i + 1) + '/6', W - 6, 26, C.lilac, 1, { align: 'right' }); }
    });
    if (t > 15.5) drect(0, 0, W, H, C.void, (t - 15.5) / 0.5);
    shake = kick > 0.8 && t > 8 ? 1 : 0;
  } else if (t < 22) { // ===== RADIAL: the cherry heart of the box =====
    rect(0, 0, W, H, C.night);
    const cx = W / 2, cy = 140, rot = t * 0.4;
    for (let r = 0; r < 9; r++) { // tunnel rings rushing outward on the beat
      const rr = ((r * 14 + (t * 40) % 14) + kick * 4), a = clamp(1 - rr / 130);
      for (let s = 0; s < 48; s++) { const an = s / 48 * Math.PI * 2 + r * 0.2; rect(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, 1, 1, r % 2 ? C.mag : C.wine); }
      if (a < 0) continue;
    }
    for (let i = 0; i < 64; i++) { // radial equalizer
      const an = i / 64 * Math.PI * 2 + rot, b = Math.abs(((i + 16) % 32) - 16) * 2 % 32, v = band(t, b), r0 = 34, r1 = r0 + 6 + v * 46;
      line(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0, cx + Math.cos(an) * r1, cy + Math.sin(an) * r1, v > 0.75 ? C.white : v > 0.5 ? C.pink : C.coral, 1);
    }
    const sc = 3 + Math.round(lead * 1);
    sprite('cherry', cx, cy + 18, sc, { outline: C.void });
    ITEMS.forEach(([sp], i) => { const an = i / 6 * Math.PI * 2 - t * 0.9; sprite(sp, cx + Math.cos(an) * 66, cy + Math.sin(an) * 66 + 8, 1, { outline: C.void }); });
    // "WORTH EVERY WAIT" — every letter is an equalizer band
    if (t > 18) { const a = clamp((t - 18) / 0.3);
      ['WORTH', 'EVERY', 'WAIT.'].forEach((wd, li) => text(wd, W / 2, 236 + li * 31, li === 2 ? C.coral : C.cream, 3, { align: 'center', shadow: C.mag, reveal: Math.floor((t - 18 - li * 0.35) * 14), stretch: i => 1 + band(t, 2 + (li * 5 + i) * 2 % 30) * 0.42 * a }));
    } else text('WHAT\\'S INSIDE?', W / 2, 250, C.lilac, 2, { align: 'center', reveal: Math.floor((t - 16) * 16) });
    split += lead * 0.4;
    if (t < 16.25) drect(0, 0, W, H, C.void, 1 - (t - 16) / 0.25);
  } else if (t < 24) { // ===== THE BREAK: freeze, glitch, riser =====
    const k = (t - 22) / 2;
    rect(0, 0, W, H, C.night);
    const cy = 140; for (let i = 0; i < 64; i++) { const an = i / 64 * Math.PI * 2 + t * 0.4, v = band(Math.min(t, 23), (i * 2) % 32), r1 = 40 + v * 40; line(W / 2 + Math.cos(an) * 34, cy + Math.sin(an) * 34, W / 2 + Math.cos(an) * r1, cy + Math.sin(an) * r1, C.mag, 0.8); }
    sprite('box', W / 2, cy + 20, 3, { outline: C.void, flash: k > 0.92 });
    text('LOADING NEXT BOX', W / 2, 238, C.cream, 1, { align: 'center' });
    const dots = Math.floor(t * 6) % 4; text('.'.repeat(dots), W / 2 + 50, 238, C.cream);
    rect(30, 250, 120, 6, C.plum); rect(30, 250, Math.round(120 * eIn(k)), 6, C.coral);
    if (t > 23) { // silence → glitch slices
      for (let s = 0; s < 10; s++) { const y = Math.floor(hash(Math.floor(t * 20), s) * H), h = 2 + Math.floor(hash(s, Math.floor(t * 20)) * 10), dx = Math.round((hash(s, 7 + Math.floor(t * 20)) - 0.5) * 30);
        g.drawImage(lo, 0, y, W, h, dx, y, W, h); }
      split = 0.6 + k; shake = 2;
    }
    if (t > 23.85) drect(0, 0, W, H, C.white, (t - 23.85) / 0.15);
  } else if (t < 28) { // ===== THE DROP: the logo lands =====
    const lt = t - 24;
    sky(t, HZ, 1.15); sun(t, W / 2, HZ - 34, 36 + Math.round(kick * 3)); mountains(t); grid(t, 2.4, 0.2);
    eqCity(t, 300, 70, 18, 0, W, 1);
    eqCity(t, 36, 26, 18, 0, W, 0.8);
    for (let i = 0; i < 46; i++) { // sun-burst confetti of pixel hearts and squares
      const a0 = hash(i, 5) * Math.PI * 2, sp = 40 + hash(i, 6) * 110, tt = (lt % 2) , d = sp * eOut(tt / 1.5);
      const x = W / 2 + Math.cos(a0) * d, y = HZ - 40 + Math.sin(a0) * d * 0.9 + 40 * tt * tt;
      if (i % 5 === 0) sprite('heart', x, y, 1); else rect(x, y, 2, 2, [C.pink, C.mint, C.peach, C.lilac, C.cream][i % 5]);
    }
    const land = eBack(lt / 0.35), sc = lerp(2.4, 1, clamp(lt / 0.35)), wob = kick * 0.04;
    drect(0, 96, W, 70, C.void, 0.55);
    drawLogo(W / 2, 130 - Math.round((1 - land) * 20), sc * (1 + wob), clamp(lt / 0.12));
    if (lt < 0.5) { const rr = eOut(lt / 0.5) * 120; for (let s = 0; s < 72; s++) { const an = s / 72 * Math.PI * 2; rect(W / 2 + Math.cos(an) * rr, 130 + Math.sin(an) * rr * 0.6, 2, 1, C.white); } }
    if (lt > 0.6) text('SWEET BOX', W / 2, 190, C.cream, 2, { align: 'center', shadow: C.mag, dy: i => -Math.round(band(t, 4 + i * 3) * 4) });
    if (lt > 1.2) text('IS COMING BACK', W / 2, 206, C.peach, 1, { align: 'center', reveal: Math.floor((lt - 1.2) * 30) });
    if (lt < 0.15) drect(0, 0, W, H, C.white, 1 - lt / 0.15);
    shake = kick > 0.7 ? 2 : 0; split += kick * 0.3;
  } else { // ===== END CARD =====
    const lt = t - 28;
    sky(t, HZ, 1); sun(t, W / 2, HZ - 34, 36); mountains(t); grid(t, 1.0);
    eqCity(t, 300, 40, 18, 0, W, Math.max(0.35, 1 - lt / 3));
    drect(0, 70, W, 150, C.void, 0.6);
    drawLogo(W / 2, 112 + Math.round(Math.sin(t * 2) * 1), 1, 1);
    text('THE SWEET BOX', W / 2, 168, C.cream, 2, { align: 'center', shadow: C.mag });
    text('IS COMING BACK. BE READY.', W / 2, 182, C.pink, 1, { align: 'center' });
    text('ORDER: (868) 715-4817', W / 2, 202, C.mint, 1, { align: 'center' });
    ITEMS.forEach(([sp], i) => sprite(sp, 28 + i * 25, 262 - Math.round(Math.abs(Math.sin(t * 4 + i)) * 3), 1, { outline: C.void }));
    if (Math.floor(t * 2.5) % 2 === 0) text('PRESS START h', W / 2, 284, C.cream, 1, { align: 'center' });
  }
  post(t, clamp(split), shake);
}

// ---------- player / render contract ----------
const img = new Image();
window.MG_ready = new Promise(res => { img.onload = () => { buildLogo(img); res(); }; img.onerror = res; img.src = LOGO_SRC; });
window.MG_duration = DUR; window.MG_fps = FPS; window.MG_size = [1080, 1920];
window.MG_seek = t => frame(Math.min(DUR - 1e-4, Math.max(0, t)));
if (!/render=1/.test(location.search)) {
  const audio = new Audio('synth.wav'); let t0 = null;
  out.onclick = () => { audio.currentTime = 0; audio.play().catch(() => {}); t0 = performance.now(); };
  window.MG_ready.then(() => { t0 = performance.now(); const loop = () => { const t = audio.paused ? ((performance.now() - t0) / 1000) % DUR : audio.currentTime; frame(t); requestAnimationFrame(loop); }; loop(); });
}
</script></body></html>`;
fs.writeFileSync(path.join(here, 'out/sweetwav.html'), page);
console.log('wrote out/sweetwav.html', (page.length / 1024).toFixed(0) + 'KB');
