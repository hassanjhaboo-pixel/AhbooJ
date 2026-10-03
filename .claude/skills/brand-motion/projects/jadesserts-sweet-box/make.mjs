#!/usr/bin/env node
// Generates the two Jadesserts "Sweet Box" storyboards (1:1 and 9:16) from one layout definition.
// 20 seconds @120bpm = 40 beats.  Blend of two playbooks:
//   Red Bull / Pop Pulse : dot-expand hook, colour-band wipes, match-cut hero across a colour change, flash into end card
//   IKEA / Diorama Build : cord-pull open + 4-segment bar bookend, objects DROP into the box one per beat, same stage new colour
//
//   node make.mjs     -> storyboard-1x1.json, storyboard-9x16.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const LOGO = '../../brand/assets/jadesserts/logo-wordmark.svg';
const CHERRY = '../../brand/assets/jadesserts/logo-cherry.svg';
const P = n => `assets/products/${n}.png`;
// natural aspect (h / w) of each cutout, used to place items by their bottom edge
const ASPECT = { 'fruit-punch': 912 / 509, 'vanilla-cupcake': 732 / 589, 'chicken-puff': 545 / 626, 'banana-bread': 622 / 832 };
const BAR = ['primary', 'secondary', 'accent', 'mint'];
const r4 = v => Math.round(v * 10000) / 10000;

function make(fmt) {
  const W = 1080, H = fmt === '1x1' ? 1080 : 1920, U = 1080, K = H / 1080;
  const X = v => r4(v / W), Y = v => r4(v / H), S = v => r4(v / U); // px → fraction of W / H / U
  const yc = dy => Y(H / 2 + dy);                                   // y from centre offset
  const tall = fmt !== '1x1';

  // ---- per-format layout (px) ----
  const L = tall
    ? { head: 520, hearts: 650, yB: 1265, label: 1462, kick: -310, logo: -40, bar: 170, tag: 300, cordLen: 330, price: 1410 }
    : { head: 160, hearts: 268, yB: 790, label: 925, kick: -240, logo: -25, bar: 150, tag: 262, cordLen: 250, price: 925 };

  // ---------- reusable pieces ----------
  const cord = (extra = {}) => ([
    { type: 'rect', w: 0.006, h: S(L.cordLen + 120), anchor: 'top', fill: 'ink', x: 0.86, y: Y(-120), ...extra.cord },
    { type: 'image', src: CHERRY, w: 0.095, wUnit: 'U', anchor: 'top', x: 0.86, y: Y(L.cordLen - 8), shadow: { color: 'rgba(74,44,51,0.18)', blur: 0.02, y: 0.01 }, ...extra.cherry },
  ]);
  const confettiDots = (at, y0, y1, seed) => ({ type: 'dots', count: 11, seed, fill: ['bg', 'secondary', 'accent', 'mint'], r: 0.013, area: [0.06, y0, 0.94, y1], motion: 'scatter', spread: 0.5, in: { at } });

  // The sweet box (z-order: floor, lid, back wall, items, front wall, wordmark). `drops` = {time per item} or null for settled
  function sweetBox({ lidFill, drops, boxIn, floatItems }) {
    const yB = L.yB, els = [];
    const rise = boxIn ? { in: boxIn } : {};
    els.push({ type: 'rect', w: 1.3, h: Y(H - (yB - 44)), hUnit: 'H', fill: 'dark', opacity: 0.07, x: 0.5, y: 1, anchor: 'bottom' });
    els.push({ type: 'rect', w: 0.6, h: S(190), anchor: 'bottom', x: 0.5, y: Y(yB - 262), fill: lidFill, radius: 0.035, rot: -2, ...rise });
    els.push({ type: 'rect', w: 0.70, h: S(310), anchor: 'bottom', x: 0.5, y: Y(yB - 12), fill: 'blushDeep', radius: 0.035, ...rise });
    const items = [
      { key: 'fruit-punch', w: 0.17, x: 322, bottom: 62 },
      { key: 'vanilla-cupcake', w: 0.19, x: 800, bottom: 60 },
      { key: 'chicken-puff', w: 0.30, x: 508, bottom: 30 },
      { key: 'banana-bread', w: 0.31, x: 668, bottom: 38 },
    ];
    items.forEach((it, i) => {
      const wpx = it.w * U, hpx = wpx * ASPECT[it.key];
      const el = {
        type: 'image', src: P(it.key), w: it.w, wUnit: 'U', anchor: 'bottom', x: X(it.x), y: Y(yB - it.bottom),
        shadow: { color: 'rgba(74,44,51,0.16)', blur: 0.02, y: 0.012 },
      };
      if (drops) el.in = { fx: 'drop-near', at: drops[i], dur: 0.9 };
      if (floatItems) el.loop = { fx: 'float', period: '2b', amp: 0.55, phase: i * 1.3 };
      void hpx;
      els.push(el);
    });
    els.push({ type: 'rect', w: 0.73, h: S(150), anchor: 'bottom', x: 0.5, y: Y(yB), fill: 'bg', stroke: 'blush', strokeW: 0.006, radius: 0.035, shadow: { color: 'rgba(74,44,51,0.2)', blur: 0.035, y: 0.02 }, ...rise });
    els.push({ type: 'image', src: LOGO, w: 0.33, anchor: 'center', x: 0.5, y: Y(yB - 76), ...rise });
    els.push({ type: 'heart', r: 0.02, fill: 'primary', x: 0.5 - 0.25, y: Y(yB - 76), ...rise });
    els.push({ type: 'heart', r: 0.02, fill: 'primary', x: 0.5 + 0.25, y: Y(yB - 76), ...rise });
    return els;
  }

  const beat = 0.5; // 120 bpm
  const dropAt = [2, 5, 8, 11].map(b => b * beat);          // seconds, scene-local
  const hearts4 = ['primary', 'lavender', 'accent', 'mint'];

  const scenes = [];

  // ===== S1 · HOOK (Red Bull dot-expand) · 4b =====
  scenes.push({
    id: 'hook', dur: '4b', bg: 'primary',
    elements: [
      confettiDots(0.9, Y(60) , Y(260), 3),
      { ...confettiDots(1.0, Y(H - 260), Y(H - 60), 9) },
      { type: 'sparkle', r: 0.045, fill: 'bg', x: 0.16, y: yc(-330 * K), in: { fx: 'pop', at: 0.9, dur: 0.5 }, loop: { fx: 'pulse', period: '2b', amp: 1.4 } },
      { type: 'heart', r: 0.04, fill: 'blush', x: 0.86, y: yc(300 * K), rot: 14, in: { fx: 'pop', at: 1.05, dur: 0.5 }, loop: { fx: 'float', period: '2b' } },
      { type: 'text', text: 'Sweet tooth?', role: 'display', size: 0.17, bubble: 0.03, color: 'onPrimary', x: 0.5, y: 0.5, maxWidth: 0.84, dotColor: 'onPrimary', in: { fx: 'dot-expand', at: 0.1, dur: 0.9 }, loop: { fx: 'beat', period: '1b', amp: 0.6 } },
    ],
  });

  // ===== S2 · REVEAL (IKEA cord-pull → logo + 4-segment bar) · 6b =====
  const tug = (y0) => [{ at: 0.62, dur: 0.18, y: Y(y0 + 46), ease: 'outQuad' }, { at: 0.8, dur: 0.5, y: Y(y0), ease: 'outBack' }];
  scenes.push({
    id: 'reveal', dur: '6b', bg: 'bg',
    transition: { type: 'wipe', dir: 'up', bands: ['secondary', 'accent'], bandW: 0.12, dur: 0.45 },
    elements: [
      confettiDots(0.6, Y(70), Y(210), 5),
      { type: 'sparkle', r: 0.04, fill: 'secondary', x: 0.14, y: yc(-300 * K), in: { fx: 'pop', at: 0.7, dur: 0.5 }, loop: { fx: 'pulse', period: '2b', amp: 1.2 } },
      ...cord({
        cord: { in: { fx: 'drop-soft', at: 0.0, dur: 0.55 }, moves: tug(-120) },
        cherry: { in: { fx: 'drop-soft', at: 0.0, dur: 0.55 }, moves: tug(L.cordLen - 8) },
      }),
      { type: 'text', text: 'Presenting', role: 'title', color: 'primary', bubble: 0.02, x: 0.5, y: yc(L.kick), in: { fx: 'rise', at: 0.55, dur: 0.5 } },
      { type: 'logo', w: 0.64, x: 0.5, y: yc(L.logo), in: { fx: 'pop-soft', at: 0.8, dur: 0.7 } },
      { type: 'segbar', w: 0.5, h: 0.016, segments: 4, gap: 0.012, fill: BAR, radius: 0.008, anchor: 'left', x: 0.25, y: yc(L.bar), in: { at: 1.35, dur: 0.9 } },
      { type: 'text', text: 'A little box of sweet surprises', role: 'body', size: 0.042, color: 'ink', maxWidth: 0.9, x: 0.5, y: yc(L.tag), highlight: { fill: 'chapter1', pad: 0.4 }, in: { fx: 'rise', at: 1.8, dur: 0.5 } },
    ],
  });

  // ===== S3 · THE BOX BUILD (IKEA objects drop in, one per 1.5s) · 14b =====
  const labels = ['Fruit Punch Limeade', 'Vanilla Cupcake', 'Chicken Puff Pastry', 'Choco-Chip Banana Bread'];
  scenes.push({
    id: 'box', dur: '14b', bg: 'chapter2',
    transition: { type: 'wipe', dir: 'left', bands: ['primary', 'blush'], bandW: 0.12, dur: 0.45 },
    elements: [
      ...hearts4.map((c, i) => ({ type: 'heart', r: 0.026, fill: c, x: X(540 + (i - 1.5) * 84), y: Y(L.hearts), in: { fx: 'pop', at: dropAt[i] + 0.35, dur: 0.45 } })),
      { type: 'sparkle', r: 0.035, fill: 'bg', x: 0.13, y: Y(L.head + 130 * K), in: { fx: 'pop', at: 1.0, dur: 0.5 }, loop: { fx: 'pulse', period: '2b', amp: 1.3 } },
      { type: 'sparkle', r: 0.03, fill: 'accent', x: 0.89, y: Y(L.head + 210 * K), in: { fx: 'pop', at: 1.2, dur: 0.5 }, loop: { fx: 'pulse', period: '2b', amp: 1.3, phase: 2 } },
      ...sweetBox({ lidFill: 'primary', drops: dropAt, boxIn: { fx: 'drop-soft', at: 0.3, dur: 0.7 } }),
      { type: 'text', text: "What's inside?", role: 'headline', color: 'ink', x: 0.5, y: Y(L.head), in: { fx: 'mask-up', at: 0.45, dur: 0.6 } },
      { type: 'cycler', items: labels, at: dropAt[0] + 0.4, every: '3b', role: 'title', size: 0.054, color: 'ink', x: 0.5, y: Y(L.label), maxWidth: 0.9, highlight: { fill: 'bg', pad: 0.34 }, fx: 'pop', fxDur: 0.3, holdLast: true },
    ],
  });

  // ===== S4 · HERO (Red Bull match-cut: same box, new colour; hearts burst; price pop) · 6b =====
  const heartBurst = [
    { c: 'bg', r: 0.032, x: 150, y: -10, rot: -14, at: 0.5 }, { c: 'blush', r: 0.04, x: 930, y: -30, rot: 12, at: 0.62 },
    { c: 'secondary', r: 0.026, x: 105, y: 170, rot: 10, at: 0.74 }, { c: 'bg', r: 0.026, x: 975, y: 175, rot: -10, at: 0.86 },
    { c: 'accent', r: 0.024, x: 215, y: -135, rot: 18, at: 0.98 }, { c: 'blush', r: 0.022, x: 870, y: -150, rot: -16, at: 1.1 },
  ];
  scenes.push({
    id: 'hero', dur: '6b', bg: 'primary',
    transition: 'cut',
    camera: { zoom: [1, 1.035], ease: 'linear' },
    elements: [
      { type: 'text', text: 'Sweet surprises', role: 'display', size: 0.105, bubble: 0.03, color: 'onPrimary', x: 0.5, y: Y(L.head + (tall ? 10 : 55)), maxWidth: 0.9, split: 'word', stagger: 0.14, in: { fx: 'pop', at: 0.2, dur: 0.45 } },
      ...heartBurst.map(h => ({ type: 'heart', r: h.r, fill: h.c, rot: h.rot, x: X(h.x), y: Y(L.yB - 330 + h.y), in: { fx: 'pop', at: h.at, dur: 0.5 }, loop: { fx: 'float', period: '2b', phase: h.at * 4 } })),
      ...sweetBox({ lidFill: 'secondary', drops: null, floatItems: true }),
      { type: 'text', text: '$50', role: 'display', size: 0.115, bubble: 0.02, color: 'onAccent', x: 0.5, y: Y(L.price), rot: -5, highlight: { fill: 'accent', pad: 0.3 }, shadow: { color: 'rgba(74,44,51,0.2)', blur: 0.03, y: 0.015 }, in: { fx: 'pop', at: 1.5, dur: 0.5 }, loop: { fx: 'pulse', period: '1b', amp: 0.7 } },
    ],
  });

  // ===== S5 · END CARD (Red Bull flash → clean cream; IKEA bar + cord bookend) · 10b =====
  scenes.push({
    id: 'end', dur: '10b', bg: 'bg',
    transition: { type: 'flash', color: 'bg', dur: 0.4 },
    elements: [
      confettiDots(0.9, Y(60), Y(200), 12),
      ...cord({ cord: { in: { fx: 'drop-soft', at: 0.3, dur: 0.6 } }, cherry: { in: { fx: 'drop-soft', at: 0.3, dur: 0.6 }, loop: { fx: 'sway', period: '4b', amp: 0.5 } } }),
      { type: 'logo', w: tall ? 0.74 : 0.64, x: 0.5, y: yc(-60 * (tall ? 1.8 : 1)), in: { fx: 'pop-soft', at: 0.35, dur: 0.7 } },
      { type: 'segbar', w: 0.5, h: 0.016, segments: 4, gap: 0.012, fill: BAR, radius: 0.008, anchor: 'left', x: 0.25, y: yc(tall ? 150 : 100), in: { at: 0.9, dur: 0.9 } },
      { type: 'text', text: 'Order your sweet box', role: 'headline', size: 0.06, color: 'ink', x: 0.5, y: yc((tall ? 285 : 215)), maxWidth: 0.94, in: { fx: 'rise', at: 1.5, dur: 0.55 } },
      { type: 'text', text: '(868) 715-4817', role: 'title', size: 0.06, color: 'ink', x: 0.5, y: yc((tall ? 440 : 340)), highlight: { fill: 'chapter2', pad: 0.38 }, in: { fx: 'pop', at: 2.1, dur: 0.5 } },
      { type: 'heart', r: 0.026, fill: 'primary', x: 0.15, y: yc((tall ? 440 : 340)), rot: -12, in: { fx: 'pop', at: 2.3, dur: 0.45 }, loop: { fx: 'pulse', period: '1b', amp: 1.1 } },
      { type: 'heart', r: 0.026, fill: 'primary', x: 0.85, y: yc((tall ? 440 : 340)), rot: 12, in: { fx: 'pop', at: 2.3, dur: 0.45 }, loop: { fx: 'pulse', period: '1b', amp: 1.1, phase: 1 } },
    ],
  });

  return {
    title: `Jadesserts Sweet Box — 20s (${fmt})`,
    format: { w: W, h: H, fps: 30 },
    bpm: 120,
    scenes,
  };
}

for (const f of ['1x1', '9x16']) {
  const out = path.join(here, `storyboard-${f}.json`);
  fs.writeFileSync(out, JSON.stringify(make(f), null, 2) + '\n');
  console.log('wrote', path.relative(process.cwd(), out));
}
