// Print shotlist.html to a Letter PDF (+ PNG previews) with the same headless Chromium as render.mjs.
import path from 'node:path'; import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
let chromium; try { ({ chromium } = await import('playwright')); } catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); ({ chromium } = req('playwright')); }
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + path.join(here, 'shotlist.html')); await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: path.join(here, 'AREA47-shot-list.pdf'), format: 'Letter', preferCSSPageSize: true, printBackground: true });
await b.close(); console.log('AREA47-shot-list.pdf');
