// node build.mjs [9x16|1x1 ...] -> out/survey-<fmt>.html
import fs from 'node:fs';
const strip = f => fs.readFileSync(f, 'utf8').replace(/^export /gm, '');
const libs = [strip('../../characters/cherry-bomb/pixel/sprites.mjs'), `const { villager, VILLAGERS, randomVillager, vToCanvas } = (() => {\n${strip('../../characters/villagers/pixel/villagers.mjs')}\nreturn { villager, VILLAGERS, randomVillager, vToCanvas };\n})();`, strip('../../engine/pixel/font.mjs')].join('\n');
const wm = 'data:image/png;base64,' + fs.readFileSync('../../brand/assets/jadesserts/logo-wordmark.png').toString('base64');
const tl = fs.readFileSync('timeline.json', 'utf8'), film = fs.readFileSync('survey.js', 'utf8');
fs.mkdirSync('out', { recursive: true });
for (const fmt of (process.argv.slice(2).length ? process.argv.slice(2) : ['9x16', '1x1'])) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>How was your box?</title><style>html,body{margin:0;background:#000}canvas{display:block;max-width:100vw;max-height:100vh;margin:auto}</style></head><body><canvas id="c"></canvas><script>
const FMT = ${JSON.stringify(fmt)}, TL = ${tl}, WORDMARK = ${JSON.stringify(wm)};
${libs}
${film}
if (!navigator.webdriver) { const t0 = performance.now(); (function loop(){ if (window.MG_ready) MG_seek(((performance.now() - t0) / 1000) % MG_duration); requestAnimationFrame(loop); })(); }
</script></body></html>`;
  fs.writeFileSync(`out/survey-${fmt}.html`, html); console.log('built out/survey-' + fmt + '.html');
}
