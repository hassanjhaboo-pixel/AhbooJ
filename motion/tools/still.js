const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const [page, t, out, extra] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8765}/${page}?t=${t}${extra || ''}`); await p.waitForFunction(() => window.ready !== undefined); await p.evaluate(() => window.ready);
  fs.writeFileSync(out, Buffer.from(await p.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]), 'base64')); await b.close(); })();
