// Playwright version of render.mjs (same page contract). node render-pw.js stills page.html outDir t1 t2 ... | video page.html out.mp4 [--fps 25] [--scale 1]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'), path = require('path');
const a = process.argv.slice(2), opt = n => { const i = a.indexOf(n); if (i < 0) return null; const v = a[i + 1]; a.splice(i, 2); return v; };
const FPS = +(opt('--fps') || 25), SCALE = +(opt('--scale') || 1), FROM = +(opt('--from') || 0), TO = opt('--to'); const [mode, page, out, ...ts] = a;
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); p.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8765}/` + page + `?t=0&scale=${mode === 'stills' ? 1 : SCALE}&mb=${process.env.MB || 1}`); await p.waitForFunction(() => window.ready !== undefined); await p.evaluate(() => window.ready);
  const grab = async t => Buffer.from(await p.evaluate(async t => { await renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, t), 'base64');
  if (mode === 'stills') { fs.mkdirSync(out, { recursive: true }); for (const t of ts.map(Number)) fs.writeFileSync(path.join(out, t.toFixed(2) + '.jpg'), await grab(t)); console.log('stills ->', out); }
  else { const total = TO ? +TO : await p.evaluate(() => window.TOTAL), n0 = Math.round(FROM * FPS), n = Math.round(total * FPS), t0 = Date.now();
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = n0; f < n; f++) { const buf = await grab(f / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 50 === 0) process.stdout.write(`\r${f}/${n}`); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(`\nSAVED ${out} ${((Date.now() - t0) / 60000).toFixed(1)} min`); }
  await b.close(); })();
