// SEV v2: AREA 47's mascot, built from the owner-approved generated art (brand/assets/area47/sev/*.png, cut out by
// projects/area47-mascot/cut-art.py). Pose-to-pose "sticker" animation: each art swap lands with a small squash bump.
//
//   import { sev } from '../../kits/area47-sev.mjs';
//   sev({ x: 0.85, y: 1.02, h: 0.34, art: [[0, 'face-side'], [3.7, 'face-wink']], in: { fx: 'slide-up', at: 2, dur: 0.6 } })
// x, y = BOTTOM-CENTRE of the figure (frame fractions); h = figure height in U (short side), the same for every art piece so swaps
// line up. Art names: hero, face-{smirk,wink,side,hype,chill,laugh,flat,shocked,proud}, pose-{point,keys,47}, turn-{front,34,side,back}.
// (turn-* and full-body poses show sneakers with a third-party logo: crop or regenerate before using them in ads.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const ASPECT = JSON.parse(fs.readFileSync(path.join(here, '..', 'brand', 'assets', 'area47', 'sev', 'manifest.json'), 'utf8'));
const r4 = v => Math.round(v * 10000) / 10000;

export function sev({ x, y, h = 0.34, art = [[0, 'face-smirk']], base = '../../brand/assets/area47/sev', end = 99, bump = 0.07, moves = [], ...rest }) {
  const keys = art.slice().sort((a, b) => a[0] - b[0]);
  const kids = keys.map(([t, name, hh], i) => {
    if (!(name in ASPECT)) throw new Error(`sev: unknown art "${name}"`);
    const H = hh || h, t1 = i + 1 < keys.length ? keys[i + 1][0] : end;
    return { type: 'image', src: `${base}/${name}.png`, w: r4(H * ASPECT[name]), wUnit: 'U', h: H, anchor: 'bottom', x: 0, y: 0,
      from: t, out: { fx: 'cut', at: t1, dur: 0.001 } };
  });
  const bumps = [];
  if (bump) keys.forEach(([t]) => { if (t > 0) bumps.push({ at: t, dur: 0.07, scale: 1 + bump, ease: 'outQuad' }, { at: t + 0.07, dur: 0.28, scale: 1, ease: 'outBack' }); });
  return Object.assign({ type: 'group', x, y, children: kids, moves: moves.concat(bumps) }, rest);
}
