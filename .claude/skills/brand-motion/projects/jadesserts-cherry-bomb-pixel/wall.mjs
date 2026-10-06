// iPhone Live Photo wallpapers: 3 s moments, 1290x2796 (scales to every iPhone), ending on the key still.
//   node wall.mjs [stills t1,t2]   -> out/wall/<name>.html (+ renders MP4 + key PNG unless "stills")
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const strip = f => fs.readFileSync(f, 'utf8').replace(/^export /gm, '');
const sprites = strip('../../characters/cherry-bomb/pixel/sprites.mjs'), font = strip('../../engine/pixel/font.mjs'), film = fs.readFileSync('film.js', 'utf8');
const wm = 'data:image/png;base64,' + fs.readFileSync('../../brand/assets/jadesserts/logo-wordmark.png').toString('base64');
const D = 3.0, far = -100, never = 1e6;
const ev = { turn: far, zoomOut: [far, far + 1], hop: far, walk0: far, grab: far, boom: far, resume: far, lapse: [far, far + 1], items: far, freeze: [far, far + 0.1], scissors: [far, far + 1], toss: far,
  vign: [], birds: far, kind: far, jump: far, bakery: far, notify: far, menu: far, menuEnd: far, stop: never, whip: never, roadWalk: never, fade: never, black: never, end: never };
const TL = { duration: D, walk: 10, speed: [[0, 10], [D, 10]], ev, lines: [] };
const VARIANTS = [
  { name: 'rainy-day', kind: 'sad', n: 0, g: 0, seed: 404, x0: 300, ph0: 2 },
  { name: 'sunday-lunch', kind: 'lunch', n: 0, g: 0.85, seed: 77, x0: 900, ph0: 5 },
  { name: 'late-shift', kind: 'office', n: 0.62, g: 0, seed: 123, x0: 1500, ph0: 1 },
];
fs.mkdirSync('out/wall', { recursive: true });
const mode = process.argv[2];
for (const v of VARIANTS) {
  const WALL = Object.assign({ w: 1290, h: 2796, s: 10, vx: 49, lead: 17, land: 1.7 }, v);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cherry & Bomb wallpaper</title><style>html,body{margin:0;background:#000}canvas{display:block;max-height:100vh;margin:auto}</style></head><body><canvas id="c"></canvas><script>
const FMT = '9x16', WALL = ${JSON.stringify(WALL)}, TL = ${JSON.stringify(TL)}, WORDMARK = ${JSON.stringify(wm)};
TL.at = new Proxy({}, { get: () => ({ at: -100, end: -100 }) });
${sprites}
${font}
${film}
</script></body></html>`;
  const f = `out/wall/${v.name}.html`; fs.writeFileSync(f, html);
  const run = a => execFileSync('node', ['../../scripts/render.mjs', ...a], { stdio: 'inherit' });
  if (mode === 'stills') run([f, '--stills', process.argv[3] || '0,1.45,2.99', '--out', 'out/wall/st']);
  else { run([f, '--out', `out/wall/${v.name}.mp4`]); run([f, '--stills', String(D - 0.001), '--out', 'out/wall/key']); }
}
