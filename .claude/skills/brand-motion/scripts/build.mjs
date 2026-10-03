#!/usr/bin/env node
// Bundle brand.json + storyboard.json + engine into ONE self-contained HTML file.
// Local image paths (logo, product shots) are inlined as data URIs so the file works anywhere.
//
//   node scripts/build.mjs --brand brand/my-brand.json --story storyboards/pop-pulse.json --out out/pop-pulse.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
if (!args.brand || !args.story) {
  console.error('usage: build.mjs --brand <brand.json> --story <storyboard.json> [--out <file.html>] [--format 1080x1920]');
  process.exit(1);
}

const brandPath = path.resolve(args.brand), storyPath = path.resolve(args.story);
const brand = JSON.parse(fs.readFileSync(brandPath, 'utf8'));
const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
if (args.format) { const [w, h] = args.format.split('x').map(Number); story.format = Object.assign({}, story.format, { w, h }); }

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif' };
function inline(src, baseDir) {
  if (!src || /^(data:|https?:)/.test(src)) return src;
  const p = path.resolve(baseDir, src);
  if (!fs.existsSync(p)) { console.warn(`! asset not found, placeholder will render: ${src}`); return src; }
  return `data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}`;
}
const bdir = path.dirname(brandPath), sdir = path.dirname(storyPath);
if (brand.logo) { brand.logo.src = inline(brand.logo.src, bdir); brand.logo.srcOnDark = inline(brand.logo.srcOnDark, bdir); }
const walk = els => (els || []).forEach(el => { if (el.src) el.src = inline(el.src, sdir); if (el.head && el.head.src) el.head.src = inline(el.head.src, sdir); });
(story.scenes || []).forEach(s => walk(s.elements)); walk(story.overlays);

// Validate token references early — the #1 cause of off-brand output is a typo'd colour token.
const tokens = new Set(Object.keys(brand.palette || {}));
const looksLiteral = c => typeof c !== 'string' || /^(#|rgb|hsl|transparent)/.test(c);
const bad = new Set();
const checkColor = c => { (Array.isArray(c) ? c : [c]).forEach(v => { if (v && !looksLiteral(v) && !tokens.has(v)) bad.add(v); }); };
(story.scenes || []).forEach(s => { checkColor(s.bg); if (s.transition && typeof s.transition === 'object') { checkColor(s.transition.color); checkColor(s.transition.border); checkColor(s.transition.ring); checkColor(s.transition.bands); } (s.elements || []).forEach(el => ['fill', 'stroke', 'color', 'dotColor'].forEach(k => checkColor(el[k]))); });
if (bad.size) console.warn(`! unknown colour tokens (not in brand.palette): ${[...bad].join(', ')}`);

const fonts = (brand.type && brand.type.fontUrls) || [];
// Local font files (woff2/ttf/otf) are inlined as @font-face — works offline and behind strict proxies.
const FONT_MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const fontFaces = ((brand.type && brand.type.fontFiles) || []).map(f => {
  const p = path.resolve(bdir, f.src);
  if (!fs.existsSync(p)) { console.warn(`! font file not found: ${f.src}`); return ''; }
  const data = `data:${FONT_MIME[path.extname(p).toLowerCase()] || 'font/woff2'};base64,${fs.readFileSync(p).toString('base64')}`;
  return `@font-face{font-family:"${f.family}";src:url(${data});font-weight:${f.weight || 400};font-style:${f.style || 'normal'};font-display:block}`;
}).join('\n');
const tpl = fs.readFileSync(path.join(here, '..', 'engine', 'player.html'), 'utf8');
const engine = fs.readFileSync(path.join(here, '..', 'engine', 'motion.js'), 'utf8');
const safe = o => JSON.stringify(o).replace(/</g, '\\u003c');
const html = tpl
  .replace('{{TITLE}}', `${brand.name || 'Brand'} — ${story.title || 'motion'}`)
  .replace('{{FONT_LINKS}}', () => fonts.map(u => `<link rel="stylesheet" href="${u}">`).join('\n') + (fontFaces ? `\n<style>${fontFaces}</style>` : ''))
  .replace('{{ENGINE}}', () => engine)
  .replace('{{BRAND}}', () => safe(brand))
  .replace('{{STORY}}', () => safe(story));

const out = path.resolve(args.out || path.join('out', `${path.basename(storyPath, '.json')}.html`));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
const dur = (story.scenes || []).length;
console.log(`built ${out}  (${dur} scenes, ${story.format?.w || 1080}x${story.format?.h || 1920})`);
