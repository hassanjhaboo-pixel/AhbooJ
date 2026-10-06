// Assemble the self-contained film page per format:  node build.mjs [9x16|1x1 ...]
import fs from 'node:fs';
const strip = f => fs.readFileSync(f, 'utf8').replace(/^export /gm, '');
const sprites = strip('../../characters/cherry-bomb/pixel/sprites.mjs'), font = strip('../../engine/pixel/font.mjs');
const wm = 'data:image/png;base64,' + fs.readFileSync('../../brand/assets/jadesserts/logo-wordmark.png').toString('base64');
const tl = fs.readFileSync('timeline.json', 'utf8'), film = fs.readFileSync('film.js', 'utf8');
fs.mkdirSync('out', { recursive: true });
for (const fmt of (process.argv.slice(2).length ? process.argv.slice(2) : ['9x16', '1x1'])) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Meet Cherry & Bomb</title>
<style>html,body{margin:0;background:#000}canvas{display:block;max-width:100vw;max-height:100vh;margin:auto;image-rendering:pixelated}</style></head>
<body><canvas id="c"></canvas><script>
const FMT = ${JSON.stringify(fmt)}, TL = ${tl}, WORDMARK = ${JSON.stringify(wm)};
${sprites}
${font}
${film}
// live preview: play when opened directly (the renderer drives MG_seek itself)
if (!navigator.webdriver) { const t0 = performance.now(); (function loop(){ if (window.MG_ready) MG_seek(((performance.now() - t0) / 1000) % MG_duration); requestAnimationFrame(loop); })(); }
</script></body></html>`;
  fs.writeFileSync(`out/film-${fmt}.html`, html);
  console.log('built out/film-' + fmt + '.html', (html.length / 1024).toFixed(0) + 'KB');
}
