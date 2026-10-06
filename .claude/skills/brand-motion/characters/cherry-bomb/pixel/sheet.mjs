// Render the Cherry & Bomb pixel sprite sheet for approval:  node sheet.mjs [out.png]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
let chromium; try { ({ chromium } = await import('playwright')); } catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); ({ chromium } = req('playwright')); }

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, 'sheet.png');
const lib = fs.readFileSync(path.join(here, 'sprites.mjs'), 'utf8').replace(/^export /gm, '');

const page = `<!doctype html><html><body style="margin:0;background:#f7efe6;font:700 15px/1.2 monospace;color:#4a2236">
<div id="root" style="padding:18px;width:1500px"></div>
<script>${lib}
const S = 4, root = document.getElementById('root');
function row(title, items) {
  const h = document.createElement('div'); h.textContent = title; h.style.margin = '14px 0 6px'; root.appendChild(h);
  const r = document.createElement('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px'; root.appendChild(r);
  items.forEach(([label, opts]) => {
    const spr = duo(opts), cv = toCanvas(spr), big = document.createElement('canvas');
    big.width = spr.w * S; big.height = (spr.h + 3) * S; const g = big.getContext('2d'); g.imageSmoothingEnabled = false;
    const sh = toCanvas(shadow(52));
    g.globalAlpha = opts.jump ? 0.5 : 1; g.drawImage(sh, (spr.ax - sh.width / 2) * S, (spr.ay - 3) * S, sh.width * S, sh.height * S); g.globalAlpha = 1;
    g.drawImage(cv, 0, opts.jump ? -6 * S : 0, spr.w * S, spr.h * S);
    const cell = document.createElement('div'); cell.style.cssText = 'background:#fff8f0;border:2px solid #e6d3c3;border-radius:8px;padding:4px;text-align:center';
    cell.appendChild(big); const t = document.createElement('div'); t.textContent = label; t.style.fontSize = '12px'; cell.appendChild(t); r.appendChild(cell);
  });
}
row('WALK CYCLE — 3/4 right (8 frames)', [0,1,2,3,4,5,6,7].map(f => ['frame ' + f, { view: 'side', walking: true, frame: f }]));
row('CHERRY — expressions (Bomb neutral)', [
  ['smile', { cherry: {} }], ['talk 1', { cherry: { mouth: 'talk1' } }], ['talk 2', { cherry: { mouth: 'talk2' } }], ['happy', { cherry: { eyes: 'happy', mouth: 'talk2' } }],
  ['shock', { cherry: { eyes: 'shock', mouth: 'shock' } }], ['annoyed', { cherry: { eyes: 'sly', brow: 'flat', mouth: 'flat' } }], ['to camera', { cherry: { turn: 1, look: 0 } }], ['blink', { cherry: { eyes: 'blink' } }]]);
row('BOMB — expressions (Cherry neutral)', [
  ['grin', { bomb: {} }], ['talk 1', { bomb: { mouth: 'talk1' } }], ['talk 2', { bomb: { mouth: 'talk2' } }], ['sly', { bomb: { eyes: 'sly', mouth: 'smirk' } }],
  ['shock "WHAT?!"', { bomb: { eyes: 'shock', mouth: 'shock' } }], ['tch', { bomb: { eyes: 'sly', mouth: 'grit', brow: 'angry' } }], ['to camera', { bomb: { turn: 1, look: 0, mouth: 'smirk' } }], ['sheepish', { bomb: { eyes: 'happy', mouth: 'grin', blush: true } }]]);
row('POSES', [
  ['front (turn-around)', { view: 'front', cherry: { turn: 1, look: 0 }, bomb: { turn: 1, look: 0 } }], ['front wave', { view: 'front', cherry: { turn: 1, look: 0, arms: 'wave', eyes: 'happy', mouth: 'talk2' }, bomb: { turn: 1, look: 0, arms: 'up' } }],
  ['back view', { view: 'back' }], ['back walk', { view: 'back', walking: true, frame: 2 }],
  ['jump!', { jump: true, cherry: { arms: 'up', eyes: 'happy', mouth: 'talk2' }, bomb: { arms: 'up', mouth: 'talk2' } }],
  ['flour-dusted', { dusty: true, cherry: { eyes: 'sly', brow: 'flat', mouth: 'flat' }, bomb: { eyes: 'happy', mouth: 'grin', blush: true } }],
  ['scissors', { bomb: { item: 'scissors', eyes: 'sly', mouth: 'smirk' }, cherry: { eyes: 'sly', brow: 'flat', mouth: 'flat' } }], ['flour sack', { bomb: { item: 'sack', mouth: 'talk2' } }],
  ['holding a box', { cherry: { item: 'box', eyes: 'happy' } }], ['walk + talk', { view: 'side', walking: true, frame: 3, cherry: { mouth: 'talk2' }, bomb: { turn: 0.6, look: 0 } }]]);
window.DONE = true;
</script></body></html>`;

const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1540, height: 900 } });
await p.setContent(page); await p.waitForFunction('window.DONE');
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.locator('#root').screenshot({ path: out }); await b.close();
console.log('sheet', out, errs.join('\n'));
