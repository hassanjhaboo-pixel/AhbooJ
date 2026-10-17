// SEV puppet v3: the talking rig cut from the master A-pose (projects/area47-sev-talk/rig.py).
// Body + arms (pivot at the shoulder) + head (pivot at the neck) with 11 face variants lip-synced from a voice envelope, and blinks.
//
//   import { sevPuppet } from '../../kits/area47-sevrig.mjs';
//   sevPuppet({ x: 0.6, y: 1.05, scale: 0.95, dur, lines: [{ at, dur, env, head: 'nod', arm: 'point' }], rigSrc: '../area47-sev-talk/assets/rig' })
// x, y   = where the master point `origin` (default [512, 1100], belly height) lands, in frame fractions. Keep y so the
//          sneakers stay below the frame edge.
// scale  = frame px per master px (master is 1024x1536).
// lines  = voice lines: at/dur in scene seconds, env = voices.json envelope; acting per line:
//          head: tilt | nod | side | shake | proud      arm: wave | shrug | point (viewer-left arm) | pointR
// rest   = mouth between lines ('closed'); endMouth = mouth after the last line ('smirk').
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const r4 = v => Math.round(v * 10000) / 10000;
const cut = at => ({ fx: 'cut', at: r4(at), dur: 0.001 });

export function sevPuppet({ x = 0.5, y = 1, scale = 1.25, origin = [512, 1100], lines = [], dur, fps = 30, U = 1080,
  rigSrc = '../area47-sev-talk/assets/rig', rest = 'closed', endMouth = 'smirk', blinkEvery = 2.6, extraMoves = [], ...extra }) {
  const RIG = JSON.parse(fs.readFileSync(path.join(here, '..', 'projects', 'area47-sev-talk', 'assets', 'rig', 'rig.json'), 'utf8'));
  const B = RIG.boxes, P = RIG.pivots, k = scale / U;
  const off = (px, py, o = origin) => [r4((px - o[0]) * k), r4((py - o[1]) * k)];
  const img = (name, box, more = {}) => Object.assign({ type: 'image', src: `${rigSrc}/${name}.png`, w: r4(box.w * k), wUnit: 'U', h: r4(box.h * k) }, more);
  const pivotImg = (name, box, piv, more) => { const [px, py] = off(piv[0], piv[1]);
    return img(name, box, Object.assign({ anchor: [r4((piv[0] - box.x) / box.w), r4((piv[1] - box.y) / box.h)], x: px, y: py }, more)); };

  // mouths: envelope → shape, held 2 frames; variety in the mid shapes
  const MID = ['ee', 'l', 'rest', 'fv', 'ee', 'oo'], OPEN = ['oh', 'ah', 'ee', 'ah'];
  const frames = Math.ceil(dur * fps), m = new Array(frames).fill('orig');
  const last = lines.length ? lines[lines.length - 1] : null;
  lines.forEach((l, li) => {
    const f0 = Math.round(l.at * fps); let hold = 0, cur = 'closed';
    l.env.forEach((v, i) => {
      if (f0 + i >= frames) return;
      if (hold > 0) { hold--; m[f0 + i] = cur; return; }
      const h = (i * 7 + li * 3) % 6;
      cur = v < 0.07 ? 'closed' : v < 0.22 ? 'rest' : v < 0.48 ? MID[h] : v < 0.72 ? OPEN[h % 4] : 'ah';
      m[f0 + i] = cur; hold = 1;
    });
    const nextAt = li + 1 < lines.length ? lines[li + 1].at : dur;
    for (let f = f0 + l.env.length; f < Math.round(nextAt * fps) && f < frames; f++) m[f] = l === last ? endMouth : (l.after || rest);
  });
  const runs = []; m.forEach((s, f) => { if (runs.length && runs[runs.length - 1].s === s) runs[runs.length - 1].n++; else runs.push({ s, f, n: 1 }); });
  const NECK = P.head, hb = B.head, hx = r4((hb.x + hb.w / 2 - NECK[0]) * k), hy = r4((hb.y + hb.h / 2 - NECK[1]) * k);
  const headKids = runs.map(({ s, f, n }) => img(`head-${s}`, hb, { x: hx, y: hy, from: r4(f / fps), out: cut((f + n) / fps) }));
  for (let b = 0.9; b < dur - 0.3; b += blinkEvery + ((b * 7) % 1) * 0.8) headKids.push(img('lids', hb, { x: hx, y: hy, from: r4(b), out: cut(b + 0.1) }));

  // acting
  const head = [], armL = [], armR = [];
  const key = (arr, at, d, rot, ease = 'inOutCubic') => arr.push({ at: r4(Math.max(0, at)), dur: r4(d), rot, ease });
  lines.forEach(l => {
    const a = l.at, d = l.dur;
    if (l.head === 'tilt') { key(head, a - 0.1, 0.3, -6); key(head, a + d - 0.2, 0.4, 0); }
    if (l.head === 'nod') for (let i = 0; i < 2; i++) { key(head, a + i * d / 2, 0.14, 5, 'outQuad'); key(head, a + i * d / 2 + 0.14, 0.3, 0, 'outBack'); }
    if (l.head === 'side') { key(head, a, 0.3, 7); key(head, a + d * 0.55, 0.3, -6); key(head, a + d - 0.1, 0.35, 0); }
    if (l.head === 'shake') { for (let i = 0; i < 4; i++) key(head, a + d * 0.5 + i * 0.13, 0.13, i % 2 ? -5 : 5); key(head, a + d * 0.5 + 0.52, 0.25, 0); }
    if (l.head === 'proud') { key(head, a - 0.1, 0.25, -4); key(head, a + 0.35, 0.18, 4, 'outQuad'); key(head, a + 0.53, 0.4, -3, 'outBack'); }
    if (l.arm === 'wave') { key(armL, a - 0.15, 0.3, 24, 'outBack');
      for (let i = 0; i < 3; i++) { key(armL, a + 0.15 + i * 0.22, 0.11, 30); key(armL, a + 0.26 + i * 0.22, 0.11, 20); }
      key(armL, a + d + 0.05, 0.4, 0); }
    if (l.arm === 'shrug') { key(armL, a + d * 0.45, 0.25, 14, 'outBack'); key(armR, a + d * 0.45, 0.25, -14, 'outBack'); key(armL, a + d + 0.1, 0.4, 0); key(armR, a + d + 0.1, 0.4, 0); }
    if (l.arm === 'point') { key(armL, a + 0.1, 0.25, 19, 'outBack'); key(armL, a + d + 0.2, 0.45, 0); }
    if (l.arm === 'pointR') { key(armR, a + d * 0.45, 0.25, -26, 'outBack'); key(armR, a + d + 0.25, 0.45, 0); }
  });
  const idle = { fx: 'sway', period: 2.4, amp: 0.25 };
  return Object.assign({
    type: 'group', x, y, sfx: false,
    moves: [...lines.flatMap(l => [{ at: r4(l.at), dur: 0.08, sy: 1.015, ease: 'outQuad' }, { at: r4(l.at + 0.08), dur: 0.3, sy: 1, ease: 'outBack' }]), ...extraMoves],
    children: [
      img('body', B.body, { x: off(B.body.x + B.body.w / 2, 0)[0], y: off(0, B.body.y + B.body.h / 2)[1] }),
      pivotImg('armL', B.armL, P.armL, { moves: armL, loop: Object.assign({ phase: 0 }, idle) }),
      pivotImg('armR', B.armR, P.armR, { moves: armR, loop: Object.assign({ phase: 1.6 }, idle) }),
      { type: 'group', x: off(NECK[0], NECK[1])[0], y: off(NECK[0], NECK[1])[1], moves: head, loop: { fx: 'sway', period: 3.1, amp: 0.35 }, children: headKids },
    ],
  }, extra);
}
// frame position of a master pixel for a puppet placed with the same x/y/scale/origin (for props: sparkles on the grill, etc.)
export const sevPoint = (px, py, { x = 0.5, y = 1, scale = 1.25, origin = [512, 1100], W = 1080, H = 1920 } = {}) =>
  [r4(x + (px - origin[0]) * scale / W), r4(y + (py - origin[1]) * scale / H)];
