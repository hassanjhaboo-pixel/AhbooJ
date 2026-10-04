#!/usr/bin/env node
// Jadesserts "Sweet Box Drop" v2 — 20s @120bpm (40 beats), 1:1 and 9:16 from one definition.
// Playbook blend:
//   Crumbl / Lineup Reveal   : product-first collage hook, one product per 2s on a constant stage, names, counter
//   Starbucks / Hero Constant: the plate never moves while the world (background colour) morphs around it
//   IKEA / Diorama Build     : objects land with physics (now real squash & stretch), cord-pull bookend, 4-segment bar
//   Red Bull / Pop Pulse     : colour-band wipes, hero on the brand colour, radial heart burst, flash into end card
//
//   node make-v2.mjs  → storyboard-v2-1x1.json, storyboard-v2-9x16.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const WORDMARK = '../../brand/assets/jadesserts/logo-wordmark.png';
const CHERRY = '../../brand/assets/jadesserts/logo-cherry.png';
const P = n => `assets/products/${n}.png`;
const ASPECT = { 'fruit-punch': 912 / 509, 'vanilla-cupcake': 732 / 589, 'chicken-puff': 545 / 626, 'banana-bread': 622 / 832 };
const NAMES = ['Chicken Puff Pastry', 'Vanilla Cupcake', 'Fruit Punch Limeade', 'Choco-Chip Banana Bread'];
const ORDER = ['chicken-puff', 'vanilla-cupcake', 'fruit-punch', 'banana-bread'];
const PASTEL = ['primary', 'lavender', 'mint', 'accent'];
const r4 = v => Math.round(v * 10000) / 10000;

function make(fmt) {
  const W = 1080, H = fmt === '1x1' ? 1080 : 1920, U = 1080, tall = fmt !== '1x1', K = H / 1080;
  const X = v => r4(v / W), Y = v => r4(v / H);
  const xc = dx => r4(0.5 + dx / W), yc = dy => r4(0.5 + dy / H);
  const L = tall
    ? { boxY: 1300, boxS: 1.3, head: 380, hearts: 470, plateY: 960, plateR: 0.37, name: 1480, prod: 0.44, cordLen: 330, heroHead: 380, priceX: 0.8, priceY: 860, sticker: 0.2, hook: 0.15 }
    : { boxY: 880, boxS: 1.1, head: 112, hearts: 192, plateY: 552, plateR: 0.3, name: 930, prod: 0.36, cordLen: 250, heroHead: 140, priceX: 0.83, priceY: 430, sticker: 0.16, hook: 0.12 };

  // ---------- the illustrated 3/4 sweet box (group, U units, origin = front-bottom centre) ----------
  function sweetBox({ lid = true, items = 'none', openAt = null, boxIn = null, itemsAt = 0 }) {
    const kids = [];
    kids.push({ type: 'pill', w: 0.6, wUnit: 'U', h: 0.05, fill: 'dark', opacity: 0.13, x: 0.06, y: 0.012 });               // floor shadow
    kids.push({ type: 'poly', pts: [[0.25, 0], [0.36, -0.07], [0.36, -0.29], [0.25, -0.22]], fill: 'blushDeep', radius: 0.008 }); // side
    kids.push({ type: 'poly', pts: [[-0.25, -0.22], [0.25, -0.22], [0.36, -0.29], [-0.14, -0.29]], fill: 'primaryDeep', radius: 0.008 }); // opening
    if (items !== 'none') {
      const spots = [ // key, w(U), x, bottom y
        ['fruit-punch', 0.13, -0.16, -0.13], ['vanilla-cupcake', 0.15, 0.21, -0.12],
        ['chicken-puff', 0.22, -0.03, -0.09], ['banana-bread', 0.22, 0.13, -0.08],
      ];
      spots.forEach(([k, w, x, y], i) => {
        const it = { type: 'image', src: P(k), w, wUnit: 'U', anchor: 'bottom', x, y, shadow: { color: 'rgba(74,44,51,0.18)', blur: 0.015, y: 0.008 } };
        if (items === 'pop') it.in = { fx: 'pop', at: itemsAt + i * 0.09, dur: 0.45 };
        if (items === 'jelly') it.loop = { fx: 'jelly', period: '2b', amp: 1, phase: i * 1.1 };
        kids.push(it);
      });
    }
    kids.push({ type: 'poly', pts: [[-0.25, 0], [0.25, 0], [0.25, -0.22], [-0.25, -0.22]], fill: 'blush', radius: 0.012 });   // front
    kids.push({ type: 'rect', w: 0.05, wUnit: 'U', h: 0.22, fill: 'lavender', anchor: 'bottom', x: 0, y: 0 });                 // ribbon band
    kids.push({ type: 'image', src: WORDMARK, w: 0.17, x: -0.135, y: -0.11 });
    kids.push({ type: 'heart', r: 0.022, fill: 'primary', x: 0.15, y: -0.115, rot: 8 });
    if (lid) {
      const o = [0.055, -0.255]; // lid origin (centre of the lid top) so it can fly off around itself
      const rel = pts => pts.map(([x, y]) => [r4(x - o[0]), r4(y - o[1])]);
      const lidEl = {
        type: 'group', x: o[0], y: o[1],
        children: [
          { type: 'poly', pts: rel([[0.26, -0.18], [0.375, -0.255], [0.375, -0.3], [0.26, -0.225]]), fill: 'primaryDeep', radius: 0.006 },
          { type: 'poly', pts: rel([[-0.26, -0.18], [0.26, -0.18], [0.26, -0.225], [-0.26, -0.225]]), fill: 'blushDeep', radius: 0.006 },
          { type: 'poly', pts: rel([[-0.26, -0.225], [0.26, -0.225], [0.375, -0.3], [-0.145, -0.3]]), fill: 'blush', radius: 0.01 },
          { type: 'poly', pts: rel([[-0.02, -0.225], [0.03, -0.225], [0.145, -0.3], [0.095, -0.3]]), fill: 'lavender' },
          { type: 'heart', r: 0.042, fill: 'lavender', x: -0.045, y: -0.015, rot: -80 },
          { type: 'heart', r: 0.042, fill: 'lavender', x: 0.045, y: -0.015, rot: 80 },
          { type: 'circle', r: 0.017, fill: 'secondary', x: 0, y: -0.012 },
        ],
      };
      if (openAt != null) {
        lidEl.moves = [{ at: openAt - 0.45, dur: 0.15, rot: -6, ease: 'inOutQuad' }, { at: openAt - 0.3, dur: 0.15, rot: 6, ease: 'inOutQuad' }, { at: openAt - 0.15, dur: 0.15, rot: 0, ease: 'inOutQuad' },
          { at: openAt, dur: 0.55, x: o[0] + 0.16, y: o[1] - 0.42, rot: -32, ease: 'outCubic' }];
        lidEl.out = { fx: 'fade', at: openAt + 0.3, dur: 0.3 };
      }
      kids.push(lidEl);
    }
    const g = { type: 'group', id: 'box', x: r4(0.5 - (0.055 * U * L.boxS) / W), y: Y(L.boxY), scale: L.boxS, children: kids };
    if (boxIn) g.in = boxIn;
    return g;
  }

  const scenes = [];

  // ===== A · HOOK — product-first collage (Crumbl) · 4b =====
  const spots = tall
    ? [[-270, -560, -12], [270, -540, 10], [-270, 560, 8], [270, 575, -8]]
    : [[-320, -320, -12], [320, -325, 10], [-320, 322, 8], [320, 318, -8]];
  scenes.push({
    id: 'hook', dur: '4b', bg: 'primary',
    elements: [
      { type: 'rays', r: tall ? 1.0 : 0.8, count: 20, fill: 'white', opacity: 0.12, x: 0.5, y: 0.5, loop: { fx: 'spin', period: '32b' } },
      ...ORDER.map((k, i) => ({
        type: 'group', x: xc(spots[i][0]), y: yc(spots[i][1]), rot: spots[i][2],
        in: { fx: 'pop', at: -0.4 + i * 0.07, dur: 0.45 }, loop: { fx: 'boil', amp: 0.8, seed: i },
        children: [
          { type: 'scallop', r: L.sticker, bumps: 16, depth: 0.08, fill: 'bg', shadow: { color: 'rgba(74,44,51,0.22)', blur: 0.02, y: 0.012 } },
          { type: 'image', src: P(k), w: (L.sticker * 1.35) / Math.max(1, ASPECT[k] * 0.85), wUnit: 'U', x: 0, y: 0 },
        ],
      })),
      { type: 'text', text: 'Sweet box\ndrop!', role: 'display', size: L.hook, maxWidth: 0.96, bubble: 0.035, color: 'onPrimary', outline: { color: 'primaryDeep', w: 0.05 }, x: 0.5, y: 0.5, split: 'word', stagger: 0.1, in: { fx: 'pop', at: -0.38, dur: 0.45 }, loop: { fx: 'wave', period: '2b', amp: 0.9 } },
    ],
  });

  // ===== B · THE BOX — squash-land, wiggle, lid flies off, items pop up, logo (IKEA + physics) · 6b =====
  const open = 1.55;
  scenes.push({
    id: 'box', dur: '6b', bg: 'bg',
    transition: { type: 'wipe', dir: 'up', bands: ['secondary', 'accent'], bandW: 0.12, dur: 0.45 },
    camera: { zoom: [1, 1.04], ease: 'inOutQuad' },
    elements: [
      { type: 'rays', r: tall ? 0.95 : 0.75, count: 18, fill: 'chapter1', x: 0.5, y: Y(L.boxY - 200 * L.boxS), in: { fx: 'scale', at: open, dur: 0.6 }, loop: { fx: 'spin', period: '24b' } },
      { type: 'dots', count: 26, seed: 21, fill: ['primary', 'lavender', 'mint', 'accent'], r: 0.012, x: 0.5, y: Y(L.boxY - 260 * L.boxS), area: [0.04, Y(L.boxY - 900 * L.boxS * (tall ? 0.8 : 0.62)), 0.96, Y(L.boxY - 60)], motion: 'burst', in: { at: open + 0.05, dur: 0.9 } },
      sweetBox({ lid: true, items: 'pop', itemsAt: open + 0.15, openAt: open, boxIn: { fx: 'plop', at: 0.05, dur: 0.9 } }),
      { type: 'text', text: 'Presenting', role: 'title', color: 'primary', bubble: 0.02, x: 0.5, y: Y(tall ? 300 : 95), in: { fx: 'rise', at: 0.25, dur: 0.45 } },
      { type: 'logo', w: tall ? 0.66 : 0.5, x: 0.5, y: Y(tall ? 470 : 248), in: { fx: 'pop-soft', at: 0.35, dur: 0.6 }, loop: { fx: 'float', period: '4b', amp: 0.6 } },
    ],
  });

  // ===== C · THE LINEUP — constant plate, morphing world, one item per 2s (Crumbl + Starbucks) · 16b =====
  const slot = 2.0;
  const lineup = [];
  lineup.push({ type: 'rays', r: L.plateR * 2.2, count: 22, fill: 'white', opacity: 0.35, x: 0.5, y: Y(L.plateY), loop: { fx: 'spin', period: '40b' } });
  lineup.push({ type: 'repeat', mode: 'radial', count: 16, radius: L.plateR + 0.075, orient: true, x: 0.5, y: Y(L.plateY), stagger: 0.03, fills: ['primary', 'lavender', 'mint', 'accent'], seed: 5, vary: { rot: 25 },
    child: { type: 'pill', w: 0.034, wUnit: 'U', h: 0.012, fill: 'primary', in: { fx: 'pop', at: 0.15, dur: 0.35 }, loop: { fx: 'float', period: '3b' } } });
  lineup.push({ type: 'scallop', id: 'plate', r: L.plateR, bumps: 22, depth: 0.05, fill: 'bg', x: 0.5, y: Y(L.plateY), shadow: { color: 'rgba(74,44,51,0.16)', blur: 0.03, y: 0.015 }, in: { fx: 'pop-soft', at: -0.05, dur: 0.5 } });
  lineup.push({ type: 'scallop', r: L.plateR * 0.88, bumps: 22, depth: 0.05, stroke: 'blushDeep', strokeW: 0.005, dash: [0.012, 0.01], x: 0.5, y: Y(L.plateY), in: { fx: 'draw', at: 0.1, dur: 0.6 } });
  ORDER.forEach((k, i) => {
    const w = L.prod / Math.max(1, ASPECT[k] * 0.78), t0 = i * slot, dir = i % 2 ? -1 : 1;
    lineup.push({ type: 'image', src: P(k), w, wUnit: 'U', x: r4(0.5 - dir * 0.02), y: Y(L.plateY + 10), shadow: { color: 'rgba(74,44,51,0.22)', blur: 0.03, y: 0.02 },
      in: { fx: 'spin-in', at: t0 + 0.02, dur: 0.55 }, out: i < 3 ? { fx: 'scale', at: t0 + slot - 0.22, dur: 0.22 } : null,
      moves: [{ at: t0 + 0.3, dur: slot - 0.4, x: r4(0.5 + dir * 0.02), y: Y(L.plateY - 10), ease: 'linear' }], loop: { fx: 'boil', amp: 0.5, seed: i } });
    lineup.push({ type: 'heart', r: 0.024, fill: PASTEL[i], x: X(540 + (i - 1.5) * 76), y: Y(L.hearts), in: { fx: 'pop', at: t0 + 0.3, dur: 0.4 } });
  });
  lineup.push({ type: 'text', text: "What's inside?", role: 'headline', size: 0.075, bubble: 0.02, color: 'ink', x: 0.5, y: Y(L.head), in: { fx: 'mask-up', at: 0, dur: 0.45 } });
  lineup.push({ type: 'cycler', items: NAMES, every: slot, at: 0.25, role: 'display', size: tall ? 0.072 : 0.06, bubble: 0.025, color: 'ink', x: 0.5, y: Y(L.name), maxWidth: 0.94, fx: 'mask-up', fxDur: 0.4, holdLast: true, loop: { fx: 'wave', period: '2b', amp: 0.5 } });
  scenes.push({
    id: 'lineup', dur: '16b', bg: 'chapter1',
    transition: { type: 'iris', x: 0.5, y: Y(L.plateY), ring: 'primary', dur: 0.5 },
    bgTo: [{ at: slot - 0.25, dur: 0.5, bg: 'chapter2' }, { at: 2 * slot - 0.25, dur: 0.5, bg: 'chapter3' }, { at: 3 * slot - 0.25, dur: 0.5, bg: 'chapter4' }],
    elements: lineup,
  });

  // ===== D · HERO — full box on coral, radial heart burst, $50 sticker (Red Bull) · 6b =====
  scenes.push({
    id: 'hero', dur: '6b', bg: 'primary',
    transition: { type: 'wipe', dir: 'left', bands: ['bg', 'blush'], bandW: 0.12, dur: 0.45 },
    elements: [
      { type: 'rays', r: tall ? 0.95 : 0.78, count: 20, fill: 'white', opacity: 0.13, x: 0.5, y: Y(L.boxY - 200 * L.boxS), loop: { fx: 'spin', period: '32b' } },
      { type: 'repeat', mode: 'radial', count: 10, radius: tall ? 0.42 : 0.38, x: 0.5, y: Y(L.boxY - 190 * L.boxS), stagger: 0.04, fills: ['bg', 'blush', 'lavender', 'accent', 'mint'], seed: 3, vary: { rot: 30, scale: 0.6, pos: 0.05 },
        child: { type: 'heart', r: 0.03, fill: 'bg', in: { fx: 'pop', at: 0.55, dur: 0.45 }, loop: { fx: 'float', period: '2b' } } },
      sweetBox({ lid: false, items: 'jelly', boxIn: { fx: 'plop', at: 0.0, dur: 0.85 } }),
      { type: 'text', text: 'A little box of\nsweet surprises', role: 'display', size: tall ? 0.1 : 0.085, bubble: 0.03, color: 'onPrimary', outline: { color: 'primaryDeep', w: 0.045 }, x: 0.5, y: Y(L.heroHead), maxWidth: 0.94, split: 'word', stagger: 0.07, in: { fx: 'pop', at: 0.3, dur: 0.4 }, loop: { fx: 'wave', period: '2b', amp: 0.5 } },
      { type: 'group', x: L.priceX, y: Y(L.priceY), rot: -12, in: { fx: 'swing', at: 1.2, dur: 0.9 }, loop: { fx: 'beat', period: '1b', amp: 0.7 },
        children: [
          { type: 'scallop', r: 0.105, bumps: 14, depth: 0.09, fill: 'accent', shadow: { color: 'rgba(74,44,51,0.25)', blur: 0.02, y: 0.012 } },
          { type: 'scallop', r: 0.088, bumps: 14, depth: 0.09, stroke: 'bg', strokeW: 0.004, dash: [0.01, 0.008] },
          { type: 'text', text: '$50', role: 'display', size: 0.075, bubble: 0.02, color: 'onAccent', x: 0, y: 0.004 },
        ] },
    ],
  });

  // ===== E · END CARD — living loops, never frozen · 8b =====
  const cordX = 0.86, cy = L.cordLen;
  scenes.push({
    id: 'end', dur: '8b', bg: 'bg',
    transition: { type: 'flash', color: 'bg', dur: 0.4 },
    elements: [
      { type: 'dots', count: 18, seed: 12, fill: ['primary', 'lavender', 'mint', 'accent'], r: 0.012, motion: 'drift', area: [0.05, 0.04, 0.95, 0.96], in: { at: 0 } },
      { type: 'blob', r: tall ? 0.42 : 0.36, fill: 'chapter1', x: 0.5, y: yc(tall ? -20 : -10), wobble: 0.08, speed: 1.4, in: { fx: 'scale', at: 0.05, dur: 0.8 } },
      { type: 'group', x: cordX, y: Y(-120), in: { fx: 'swing', at: 0.15, dur: 1.4 }, loop: { fx: 'sway', period: '4b', amp: 0.6 },
        children: [
          { type: 'rect', w: 0.006, h: (cy + 120) / U, fill: 'ink', anchor: 'top', x: 0, y: 0 },
          { type: 'image', src: CHERRY, w: 0.095, wUnit: 'U', anchor: 'top', x: 0, y: (cy + 112) / U },
        ] },
      { type: 'logo', w: tall ? 0.72 : 0.62, x: 0.5, y: yc(tall ? -150 : -110), in: { fx: 'pop-soft', at: 0.25, dur: 0.7 }, loop: { fx: 'jelly', period: '2b', amp: 0.5 } },
      { type: 'segbar', w: 0.5, h: 0.016, segments: 4, gap: 0.012, fill: ['primary', 'secondary', 'accent', 'mint'], radius: 0.008, anchor: 'left', x: 0.25, y: yc(tall ? 50 : 45), in: { at: 0.7, dur: 0.9 } },
      { type: 'text', text: 'Order your sweet box', role: 'headline', size: tall ? 0.075 : 0.062, bubble: 0.015, color: 'ink', x: 0.5, y: yc(tall ? 200 : 150), maxWidth: 0.94, in: { fx: 'rise', at: 1.0, dur: 0.5 }, loop: { fx: 'wave', period: '4b', amp: 0.35 } },
      { type: 'text', text: '(868) 715-4817', role: 'title', size: 0.06, color: 'ink', x: 0.5, y: yc(tall ? 350 : 275), highlight: { fill: 'chapter2', pad: 0.38 }, in: { fx: 'pop', at: 1.4, dur: 0.45 }, loop: { fx: 'beat', period: '2b', amp: 0.5 } },
      { type: 'heart', r: 0.026, fill: 'primary', x: 0.14, y: yc(tall ? 350 : 275), rot: -12, in: { fx: 'pop', at: 1.6, dur: 0.4 }, loop: { fx: 'pulse', period: '1b', amp: 1.2 } },
      { type: 'heart', r: 0.026, fill: 'primary', x: 0.86, y: yc(tall ? 350 : 275), rot: 12, in: { fx: 'pop', at: 1.6, dur: 0.4 }, loop: { fx: 'pulse', period: '1b', amp: 1.2, phase: 1.5 } },
    ],
  });

  return { title: `Jadesserts Sweet Box Drop v2 — 20s (${fmt})`, format: { w: W, h: H, fps: 30 }, bpm: 120, scenes };
}

for (const f of ['1x1', '9x16']) {
  const out = path.join(here, `storyboard-v2-${f}.json`);
  fs.writeFileSync(out, JSON.stringify(make(f), null, 2) + '\n');
  console.log('wrote', path.relative(process.cwd(), out));
}
