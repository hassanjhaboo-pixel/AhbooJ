// villager approval sheet: node sheet.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
let chromium; try { ({ chromium } = await import('playwright')); } catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); ({ chromium } = req('playwright')); }
const here = path.dirname(fileURLToPath(import.meta.url)), lib = fs.readFileSync(path.join(here, 'villagers.mjs'), 'utf8').replace(/^export /gm, '');
const html = `<body style="margin:0;background:#f7efe6;font:700 13px monospace;color:#4a2236"><div id="r" style="padding:12px;width:1500px;display:flex;flex-wrap:wrap;gap:8px"></div><script>${lib}
const S = 5, r = document.getElementById('r');
const cell = (label, d, o) => { const s = villager(d, o), c = vToCanvas(s), b = document.createElement('canvas'); b.width = s.w * S; b.height = s.h * S; const g = b.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, b.width, b.height);
  const e = document.createElement('div'); e.style.cssText = 'background:#fff8f0;border:2px solid #e6d3c3;border-radius:8px;text-align:center'; e.appendChild(b); const t = document.createElement('div'); t.textContent = label; e.appendChild(t); r.appendChild(e); };
for (const k in VILLAGERS) cell(k, VILLAGERS[k], {});
cell('mabel talk', VILLAGERS.mabel, { mouth: 'talk2', eyes: 'happy', tear: true }); cell('darnell nervous', VILLAGERS.darnell, { eyes: 'nervous', mouth: 'wobble', sweat: true });
cell('darnell shock', VILLAGERS.darnell, { eyes: 'shock', mouth: 'o', arms: 'up', sweat: true }); cell('kiki cheer', VILLAGERS.kiki, { eyes: 'happy', mouth: 'talk2', arms: 'up' });
cell('rosa talk', VILLAGERS.rosa, { mouth: 'talk1' }); cell('joe grump talk', VILLAGERS.joe, { mouth: 'talk1' }); cell('joe smile', VILLAGERS.joe, { eyes: 'happy', mouth: 'smile' });
for (let i = 1; i <= 6; i++) cell('rand ' + i, randomVillager(i * 7), {});
window.DONE = 1;</script></body>`;
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1530, height: 900 } }); await p.setContent(html); await p.waitForFunction('window.DONE'); await p.locator('#r').screenshot({ path: path.join(here, 'sheet.png') }); await b.close(); console.log('ok');
