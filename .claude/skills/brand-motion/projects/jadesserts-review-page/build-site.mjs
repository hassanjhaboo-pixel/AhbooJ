// Website build: node build-site.mjs [https://your-domain]  -> site/index.html + site/card-preview.png + jadesserts-review-site.zip
// (review.html stays the Claude artifact build; this one is a complete document for any static host)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
execFileSync('node', ['build.mjs']);
const url = (process.argv[2] || '').replace(/\/$/, '');
const body = fs.readFileSync('review.html', 'utf8');
const desc = 'Rate your Jadesserts box with Cherry & Bomb, then send your review card to Jade on WhatsApp.';
const og = [`<meta property="og:title" content="How Was Your Box? · Jadesserts">`, `<meta property="og:description" content="${desc}">`, `<meta name="description" content="${desc}">`, `<meta name="theme-color" content="#f4636f">`,
  ...(url ? [`<meta property="og:url" content="${url}/">`, `<meta property="og:image" content="${url}/card-preview.png">`, `<meta name="twitter:card" content="summary_large_image">`] : [])].join('\n');
const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${og}\n<link rel="icon" href="card-preview.png">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
fs.mkdirSync('site', { recursive: true });
fs.writeFileSync('site/index.html', html);
fs.copyFileSync('example-card.png', 'site/card-preview.png');
try { fs.unlinkSync('jadesserts-review-site.zip'); } catch {}
execFileSync('zip', ['-qr', '../jadesserts-review-site.zip', '.'], { cwd: 'site' });
console.log('site/index.html', (html.length / 1024).toFixed(0) + 'KB', url ? 'with link previews for ' + url : '(no domain yet: run again with your URL for WhatsApp link previews)');
