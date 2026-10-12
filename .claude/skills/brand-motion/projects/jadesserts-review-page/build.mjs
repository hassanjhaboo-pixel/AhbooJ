// node build.mjs -> review.html (self-contained page: sprites + font + logo inlined)
import fs from 'node:fs';
const strip = f => fs.readFileSync(f, 'utf8').replace(/^export /gm, '');
let html = fs.readFileSync('review.src.html', 'utf8');
html = html.replace('/*__SPRITES__*/', () => strip('../../characters/cherry-bomb/pixel/sprites.mjs'))
  .replace('/*__FONT__*/', () => strip('../../engine/pixel/font.mjs'))
  .replace('__WORDMARK__', 'data:image/png;base64,' + fs.readFileSync('wordmark-480.png').toString('base64'));
fs.writeFileSync('review.html', html);
console.log('built review.html', (html.length / 1024).toFixed(0) + 'KB');
