// Minifig kit v2 — toy-accurate brick figures with moulded-plastic shading, expressive printed faces,
// lip sync, stop-motion ("on twos") timing and a side-view run cycle. Brand-agnostic: colours are palette roles.
// Needs these roles in the brand file (alias them if your brand lacks them):
//   toyYellow (skin), bone (skeleton), ink (print/outlines), white, blushDeep (tongue), plus whatever shirt/hair roles you pass.
//
// Coordinates are short-side units (U) inside groups. Origin = between the feet. Standing height ≈ 0.23 U at s = 1.
// Figures are original "brick people" built from primitives — no trademarked artwork.
//
//   import * as F from './minifig.mjs'
//   F.minifig({ x: 0.5, y: 0.9, s: 3, torso: 'mint', legs: 'ink', hair: 'bob', hairColor: 'wood', face: 'grin' })
//   F.minifig({ ..., talk: { env: voices.brenda.env, at: 0.4 } })          // lip-synced to a voice line
//   F.minifig({ ..., view: 'side', legs: 'run', run: 0.32 })                 // running to the right (sx: -1 to face left)

const Q = 0.058;                      // one "stud-height" module in U; the whole figure is built on it
const q = v => Math.round(v * Q * 100000) / 100000;
const r4 = v => Math.round(v * 10000) / 10000;
let SEED = 1;
export function seed(n) { SEED = n || 1; }
export function rand() { SEED = (SEED * 16807) % 2147483647; return SEED / 2147483647; }
export const pick = arr => arr[Math.floor(rand() * arr.length)];

const P = { plastic: 0.65, edge: true };                         // default material for moulded parts
const rect = o => Object.assign({ type: 'rect', wUnit: 'U' }, o);
const part = o => Object.assign({}, P, o);

// ---------------- faces ----------------
// Each expression = brows (left/right rotation, vertical shift), eyes, mouth.
export const EXPRESSIONS = {
  smile:   { brows: [0, 0, 0], eyes: 'open', mouth: 'smile' },
  grin:    { brows: [-6, 6, -0.03], eyes: 'open', mouth: 'grin' },
  happy:   { brows: [-8, 8, -0.05], eyes: 'happy', mouth: 'grin' },
  angry:   { brows: [24, -24, 0.06], eyes: 'open', mouth: 'grit' },
  furious: { brows: [30, -30, 0.08], eyes: 'small', mouth: 'shout' },
  shock:   { brows: [-12, 12, -0.1], eyes: 'wide', mouth: 'o' },
  sly:     { brows: [16, -4, 0.02], eyes: 'half', mouth: 'smirk' },
  worried: { brows: [-22, 22, -0.02], eyes: 'open', mouth: 'frown' },
  deadpan: { brows: [0, 0, 0.03], eyes: 'half', mouth: 'flat' },
  sleep:   { brows: [0, 0, 0.04], eyes: 'closed', mouth: 'o' },
  dreamy:  { brows: [-10, 10, -0.04], eyes: 'happy', mouth: 'smile' },
};

function eyes(kind, skin, ink, blinkSeed) {
  const els = [];
  [-1, 1].forEach(side => {
    const x = q(side * 0.2), y = q(-0.05), kids = [];
    if (kind === 'happy') kids.push({ type: 'path', points: [[q(-0.09), q(0.04)], [0, q(-0.05)], [q(0.09), q(0.04)]], stroke: ink, strokeW: q(0.055) });
    else if (kind === 'closed') kids.push({ type: 'path', points: [[q(-0.09), q(-0.01)], [0, q(0.04)], [q(0.09), q(-0.01)]], stroke: ink, strokeW: q(0.05) });
    else {
      const big = kind === 'wide' ? 1.35 : kind === 'small' ? 0.75 : 1;
      kids.push({ type: 'pill', w: q(0.15 * big), wUnit: 'U', h: q(0.22 * big), fill: ink });
      kids.push({ type: 'circle', r: q(0.035 * big), fill: 'white', x: q(0.03 * big), y: q(-0.05 * big) });
      if (kind === 'half') kids.push(rect({ w: q(0.24), h: q(0.14), fill: skin, y: q(-0.07) }), { type: 'path', points: [[q(-0.1), q(0)], [q(0.1), q(0)]], stroke: ink, strokeW: q(0.04), smooth: false });
    }
    const g = { type: 'group', x, y, children: kids };
    if (['open', 'wide', 'small', 'half'].includes(kind) && blinkSeed != null) g.loop = { fx: 'blink', period: 2.6 + ((blinkSeed * 7) % 10) / 5, phase: (blinkSeed % 5) * 0.37 };
    els.push(g);
  });
  return els;
}

function mouth(kind, ink, talk) {
  const y = q(0.24);
  if (talk) { // lip-synced: an open mouth whose height follows the voice envelope (a thin line when closed)
    return [{ type: 'group', x: 0, y, loop: Object.assign({ fx: 'lipsync', min: 0.14 }, talk), children: [
      { type: 'poly', pts: [[q(-0.25), q(-0.1)], [q(0.25), q(-0.1)], [q(0.18), q(0.13)], [q(-0.18), q(0.13)]], radius: q(0.09), fill: ink },
      rect({ w: q(0.34), h: q(0.05), fill: 'white', y: q(-0.07), radius: q(0.02) }),
      { type: 'circle', r: q(0.075), fill: 'blushDeep', x: 0, y: q(0.07) },
    ] }];
  }
  switch (kind) {
    case 'grin': return [
      { type: 'poly', pts: [[q(-0.28), q(0.12)], [q(0.28), q(0.12)], [q(0.17), q(0.38)], [q(-0.17), q(0.38)]], radius: q(0.11), fill: ink },
      rect({ w: q(0.42), h: q(0.07), fill: 'white', y: q(0.15), radius: q(0.02) }),
      { type: 'circle', r: q(0.075), fill: 'blushDeep', x: 0, y: q(0.32) }];
    case 'shout': return [{ type: 'poly', pts: [[q(-0.22), q(0.1)], [q(0.22), q(0.1)], [q(0.2), q(0.42)], [q(-0.2), q(0.42)]], radius: q(0.12), fill: ink },
      rect({ w: q(0.34), h: q(0.06), fill: 'white', y: q(0.13), radius: q(0.02) }), { type: 'circle', r: q(0.08), fill: 'blushDeep', x: 0, y: q(0.36) }];
    case 'grit': return [rect({ w: q(0.46), h: q(0.17), fill: 'white', y, radius: q(0.05), stroke: ink, strokeW: q(0.035) }),
      ...[-0.11, 0, 0.11].map(x => ({ type: 'path', points: [[q(x), q(0.16)], [q(x), q(0.32)]], stroke: ink, strokeW: q(0.025), smooth: false })),
      { type: 'path', points: [[q(-0.22), y], [q(0.22), y]], stroke: ink, strokeW: q(0.025), smooth: false }];
    case 'o': return [{ type: 'pill', w: q(0.17), wUnit: 'U', h: q(0.22), fill: ink, x: 0, y }];
    case 'frown': return [{ type: 'path', points: [[q(-0.2), q(0.32)], [0, q(0.2)], [q(0.2), q(0.32)]], stroke: ink, strokeW: q(0.055) }];
    case 'smirk': return [{ type: 'path', points: [[q(-0.2), q(0.27)], [q(0.04), q(0.27)], [q(0.22), q(0.15)]], stroke: ink, strokeW: q(0.055) }];
    case 'flat': return [{ type: 'path', points: [[q(-0.18), y], [q(0.18), y]], stroke: ink, strokeW: q(0.05), smooth: false }];
    default: return [{ type: 'path', points: [[q(-0.24), q(0.15)], [0, q(0.31)], [q(0.24), q(0.15)]], stroke: ink, strokeW: q(0.055) }];
  }
}

export function face(o = {}) {
  const ink = o.ink || 'ink', skin = o.skin || 'toyYellow';
  if (o.skeleton) {
    return [
      ...[-1, 1].map(s => ({ type: 'pill', w: q(0.3), wUnit: 'U', h: q(0.34), fill: ink, x: q(s * 0.21), y: q(-0.06) })),
      ...[-1, 1].map(s => ({ type: 'circle', r: q(0.05), fill: 'white', x: q(s * 0.2), y: q(-0.08), loop: { fx: 'pulse', period: 1.3, amp: 3 } })),
      { type: 'poly', pts: [[q(-0.06), q(0.14)], [q(0.06), q(0.14)], [0, q(0.04)]], fill: ink },
      ...(o.talk ? mouth('talk', ink, o.talk) : [rect({ w: q(0.5), h: q(0.14), fill: ink, y: q(0.3), radius: q(0.04) }),
        ...[-0.15, -0.05, 0.05, 0.15].map(x => rect({ w: q(0.07), h: q(0.1), fill: 'bone', x: q(x), y: q(0.3), radius: q(0.015) }))]),
    ];
  }
  const ex = EXPRESSIONS[o.face || 'smile'] || EXPRESSIONS.smile;
  const els = [];
  if (o.blush !== false) [-1, 1].forEach(s => els.push({ type: 'circle', r: q(0.09), fill: o.blushColor || 'blushDeep', opacity: 0.35, x: q(s * 0.33), y: q(0.13) }));
  [-1, 1].forEach((s, i) => els.push({ type: 'pill', w: q(0.27), wUnit: 'U', h: q(0.06), fill: ink, x: q(s * 0.21), y: q(-0.31 + ex.brows[2]), rot: ex.brows[i] }));
  els.push(...eyes(o.eyes || ex.eyes, skin, ink, o.blink === false ? null : (o.seed || 1)));
  els.push(...mouth(o.mouth || ex.mouth, ink, o.talk));
  if (o.mustache) els.push({ type: 'poly', pts: [[q(-0.3), q(0.12)], [0, q(0.06)], [q(0.3), q(0.12)], [q(0.18), q(0.2)], [0, q(0.14)], [q(-0.18), q(0.2)]], radius: q(0.04), fill: o.mustache === true ? 'ink' : o.mustache });
  if (o.glasses) [-1, 1].forEach(s => els.push({ type: 'ring', r: q(0.15), fill: o.glasses === true ? 'ink' : o.glasses, strokeW: q(0.04), x: q(s * 0.21), y: q(-0.05) }));
  if (o.sweat) els.push({ type: 'poly', pts: [[q(0.45), q(-0.3)], [q(0.52), q(-0.12)], [q(0.38), q(-0.12)]], radius: q(0.05), fill: 'glass', loop: { fx: 'float', period: 0.6, amp: 1 } });
  if (o.vein) els.push({ type: 'group', x: q(0.32), y: q(-0.36), loop: { fx: 'beat', period: 0.4, amp: 3 }, children: [0, 90, 180, 270].map(a => ({ type: 'path', points: [[0, 0], [q(0.09), q(0.02)]], stroke: 'primaryDeep', strokeW: q(0.05), rot: a, smooth: false })) });
  return els;
}

// ---------------- hair & headwear (head-local; head centre = 0,0; top ≈ -0.49 Q) ----------------
export function hair(kind, color = 'ink', alt = 'white') {
  const c = color;
  const dome = [[q(-0.58), q(-0.14)], [q(-0.56), q(-0.48)], [q(-0.34), q(-0.72)], [q(0.34), q(-0.72)], [q(0.56), q(-0.48)], [q(0.58), q(-0.14)]];
  const bob = [[q(-0.62), q(0.36)], [q(-0.64), q(-0.4)], [q(-0.4), q(-0.7)], [q(0.4), q(-0.7)], [q(0.64), q(-0.4)], [q(0.62), q(0.36)], [q(0.44), q(0.36)], [q(0.46), q(-0.22)], [q(0.1), q(-0.36)], [q(-0.3), q(-0.2)], [q(-0.46), q(-0.18)], [q(-0.44), q(0.36)]];
  switch (kind) {
    case 'cap': return [part({ type: 'poly', pts: dome, radius: q(0.14), fill: c }), part({ type: 'pill', w: q(1.3), wUnit: 'U', h: q(0.18), fill: c, x: q(0.06), y: q(-0.16) }), { type: 'circle', r: q(0.07), fill: alt, x: 0, y: q(-0.7) }];
    case 'bob': return [part({ type: 'poly', pts: bob, radius: q(0.12), fill: c })];
    case 'bun': return [part({ type: 'circle', r: q(0.28), fill: c, x: 0, y: q(-0.82) }), part({ type: 'poly', pts: bob, radius: q(0.12), fill: c })];
    case 'ponytail': return [part({ type: 'pill', w: q(0.3), wUnit: 'U', h: q(0.8), fill: c, x: q(0.62), y: q(0.05), rot: 14 }), part({ type: 'poly', pts: bob, radius: q(0.12), fill: c })];
    case 'long': return [part({ type: 'poly', pts: bob.map(([x, y]) => [x, y > 0 ? q(0.95) : y]), radius: q(0.12), fill: c })];
    case 'spiky': return [part({ type: 'poly', pts: [[q(-0.58), q(-0.2)], [q(-0.62), q(-0.66)], [q(-0.36), q(-0.56)], [q(-0.22), q(-0.92)], [q(-0.02), q(-0.62)], [q(0.18), q(-0.94)], [q(0.3), q(-0.6)], [q(0.62), q(-0.76)], [q(0.58), q(-0.2)], [q(0.2), q(-0.32)], [q(-0.2), q(-0.32)]], radius: q(0.05), fill: c })];
    case 'curly': return [...[[-0.46, -0.3], [-0.3, -0.58], [0, -0.68], [0.3, -0.58], [0.46, -0.3], [-0.52, 0.02], [0.52, 0.02], [-0.16, -0.44], [0.16, -0.44]].map(([x, y]) => part({ type: 'circle', r: q(0.24), fill: c, x: q(x), y: q(y) }))];
    case 'mohawk': return [part({ type: 'poly', pts: [[q(-0.12), q(-0.4)], [q(-0.16), q(-1.0)], [q(0), q(-0.86)], [q(0.12), q(-1.04)], [q(0.16), q(-0.4)]], radius: q(0.05), fill: c })];
    case 'beanie': return [part({ type: 'poly', pts: dome.map(([x, y]) => [x * 1.04, y * 1.08]), radius: q(0.16), fill: c }), part({ type: 'circle', r: q(0.15), fill: alt, x: 0, y: q(-0.84) }), part({ type: 'rect', wUnit: 'U', w: q(1.24), h: q(0.22), fill: alt, y: q(-0.2), radius: q(0.08) })];
    case 'chef': return [part({ type: 'rect', wUnit: 'U', w: q(1.12), h: q(0.34), fill: 'white', y: q(-0.36), radius: q(0.06) }), part({ type: 'scallop', r: q(0.62), bumps: 7, depth: 0.14, fill: 'white', x: 0, y: q(-0.98) })];
    case 'helmet': return [part({ type: 'poly', pts: dome.map(([x, y]) => [x * 1.06, y * 1.04 + q(0.02)]), radius: q(0.2), fill: c }), rect({ w: q(1.1), h: q(0.06), fill: 'ink', opacity: 0.25, y: q(-0.16) })];
    default: return [];
  }
}

// ---------------- props ----------------
export const hand = (prop, dx = 0, dy = 0) => Object.assign({}, prop, { x: (prop.x || 0) + dx, y: (prop.y || 0) + dy });
export function sweetBox({ s = 1, box = 'blush', lid = 'blushDeep', ribbon = 'lavender', logo = null } = {}) {
  return { type: 'group', scale: s, children: [
    part({ type: 'poly', pts: [[-0.06, 0], [0.06, 0], [0.06, -0.052], [-0.06, -0.052]], radius: 0.006, fill: box }),
    part({ type: 'poly', pts: [[-0.066, -0.05], [0.066, -0.05], [0.07, -0.068], [-0.07, -0.068]], radius: 0.004, fill: lid }),
    part({ type: 'rect', wUnit: 'U', w: 0.013, h: 0.068, fill: ribbon, anchor: 'bottom', x: 0, y: 0 }),
    part({ type: 'heart', r: 0.013, fill: ribbon, x: -0.01, y: -0.078, rot: -80 }), part({ type: 'heart', r: 0.013, fill: ribbon, x: 0.01, y: -0.078, rot: 80 }),
    ...(logo ? [{ type: 'image', src: logo, w: 0.03, wUnit: 'U', x: 0.034, y: -0.026 }] : []),
  ] };
}
export function megaphone(color = 'accent') {
  return { type: 'group', rot: -90, children: [part({ type: 'poly', pts: [[0, -0.008], [0.05, -0.022], [0.05, 0.022], [0, 0.008]], radius: 0.003, fill: color }), part({ type: 'rect', wUnit: 'U', w: 0.016, h: 0.02, fill: 'ink', x: -0.004, y: 0.014 })] };
}
export function phone() { return part({ type: 'rect', wUnit: 'U', w: 0.026, h: 0.042, fill: 'ink', radius: 0.005, y: -0.012 }); }
export function sign(text, { w = 0.15, h = 0.075, color = 'cardboard', ink = 'ink', size = 0.022 } = {}) {
  return { type: 'group', children: [
    part({ type: 'rect', wUnit: 'U', w: 0.008, h: 0.1, fill: 'wood', anchor: 'top', y: -0.01 }),
    part({ type: 'rect', wUnit: 'U', w, h, fill: color, anchor: 'bottom', y: 0, radius: 0.006 }),
    { type: 'text', text, role: 'title', size, color: ink, x: 0, y: -h / 2, maxWidth: 0.6, weight: 800 },
  ] };
}
export function numberTile(n, { fill = 'toyYellow', ink = 'ink', size = 0.3 } = {}) {
  return { type: 'group', children: [
    part({ type: 'bricks', w: size, wUnit: 'U', h: size * 0.86, fill, bw: size / 2, bh: size * 0.43, anchor: 'center', plastic: 0.7 }),
    { type: 'text', text: String(n), role: 'display', size: size * 0.72, color: ink, bubble: 0.03, x: 0, y: size * 0.02, weight: 800 },
  ] };
}
// a puff of dust (brick-built: chunky grey circles) that billows out and fades
export function dust({ x = 0, y = 0, at = 0, dur = 0.7, s = 1, fill = 'white', count = 7, seedN = 3 } = {}) {
  seed(seedN);
  return { type: 'group', x, y, scale: s, children: Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI - Math.PI, rr = 0.05 + rand() * 0.06;
    return part({ type: 'circle', r: 0.03 + rand() * 0.035, fill, opacity: 0.92, x: 0, y: 0, edge: false, plastic: 0.4,
      in: { fx: 'pop', at: r4(at + i * 0.02), dur: 0.2 }, moves: [{ at: r4(at), dur, x: r4(Math.cos(a) * rr * 2.2), y: r4(Math.sin(a) * rr * 1.4 - 0.02), scale: 1.6, ease: 'outCubic' }],
      out: { fx: 'fade', at: r4(at + dur * 0.7), dur: r4(dur * 0.5) } });
  }) };
}

// ---------------- the figure ----------------
const ARM_POSES = { down: [9, -9], up: [158, -158], wave: [9, -145], cheer: [150, -150], point: [9, -95], hips: [32, -32], reach: [-30, 30], hold: [-24, 24], shrug: [60, -60], fist: [9, -160] };

export function minifig(o = {}) {
  const side = o.view === 'side';
  const skin = o.skeleton ? 'bone' : (o.skin || 'toyYellow');
  const torso = o.skeleton ? 'bone' : (o.torso || 'primary');
  const legs = o.skeleton ? 'bone' : (o.legs || 'ink'), hips = o.hips || legs;
  const sleeve = o.skeleton ? 'bone' : (o.sleeves || torso);
  const step = o.step === false ? undefined : (o.step || 12);
  const run = o.run || 0.34;                                  // run/walk cycle period (s)
  const moving = o.legPose === 'run' || o.legPose === 'walk';
  const kids = [];
  if (o.shadow !== false) kids.push({ type: 'pill', w: q(side ? 1.6 : 2.1), wUnit: 'U', h: q(0.3), fill: 'ink', opacity: 0.2, x: 0, y: q(0.02) });

  // --- legs (pivot at the hip pin) ---
  const sit = o.legPose === 'sit';
  const legPts = side ? [[q(-0.38), 0], [q(0.36), 0], [q(0.36), q(0.92)], [q(0.62), q(0.96)], [q(0.62), q(1.2)], [q(-0.38), q(1.2)]]
    : [[q(-0.37), 0], [q(0.37), 0], [q(0.39), q(1.2)], [q(-0.39), q(1.2)]];
  const legsOrder = side ? [1, 0] : [0, 1];                  // side view: far leg first
  legsOrder.forEach(i => {
    const sgn = i ? 1 : -1, kidsL = [part({ type: 'poly', pts: sit ? legPts.map(([x, y]) => [x, y * 0.45]) : legPts, radius: q(0.07), fill: legs })];
    if (!side && !sit) kidsL.push(rect({ w: q(0.74), h: q(0.2), fill: 'ink', opacity: 0.16, y: q(1.1) }));
    if (side && i === 1) kidsL.push({ type: 'poly', pts: legPts, fill: 'ink', opacity: 0.18 });
    const leg = { type: 'group', x: side ? 0 : q(sgn * 0.39), y: q(sit ? -0.6 : -1.2), children: kidsL };
    if (sit) leg.rot = 0;
    if (side && moving) leg.loop = { fx: 'sway', period: run, amp: o.legPose === 'run' ? 7.5 : 4.5, phase: i ? Math.PI : 0 };
    if (!side && o.legPose === 'march') leg.loop = { fx: 'sway', period: run, amp: 1.5, phase: i ? Math.PI : 0 };
    kids.push(leg);
  });
  const lift = sit ? q(0.6) : 0;                             // sitting drops the upper body
  kids.push(part({ type: 'rect', wUnit: 'U', w: q(side ? 0.86 : 1.58), h: q(0.36), fill: hips, y: r4(q(-1.34) + lift), radius: q(0.06) }));
  kids.push(rect({ w: q(side ? 0.8 : 1.5), h: q(0.035), fill: 'ink', opacity: 0.3, y: r4(q(-1.17) + lift) }));
  if (!side && !sit) kids.push(rect({ w: q(0.05), h: q(0.5), fill: 'ink', opacity: 0.35, anchor: 'top', y: q(-1.16) }));

  // --- far arm (side view, behind the torso) ---
  const armPose = Array.isArray(o.arms) ? o.arms : ARM_POSES[o.arms || 'down'] || ARM_POSES.down;
  const arm = (i, behind) => {
    const sgn = i ? 1 : -1;
    const children = [
      part({ type: 'poly', pts: [[q(-0.25), q(-0.08)], [q(0.25), q(-0.08)], [q(0.2), q(1.0)], [q(-0.2), q(1.0)]], radius: q(0.12), fill: sleeve }),
      part({ type: 'rect', wUnit: 'U', w: q(0.24), h: q(0.16), fill: skin, y: q(1.05), radius: q(0.03) }),
      part({ type: 'circle', r: q(0.22), fill: skin, x: 0, y: q(1.25) }),
      { type: 'circle', r: q(0.085), fill: 'ink', opacity: 0.5, x: 0, y: q(1.27) },
      rect({ w: q(0.09), h: q(0.16), fill: skin, x: 0, y: q(1.4) }),                  // the C-hand's opening
    ];
    if (behind) children.push({ type: 'poly', pts: [[q(-0.25), q(-0.08)], [q(0.25), q(-0.08)], [q(0.2), q(1.0)], [q(-0.2), q(1.0)]], radius: q(0.12), fill: 'ink', opacity: 0.18 });
    const prop = i ? o.hand : o.handL;
    if (prop) children.push(Object.assign({}, prop, { x: (prop.x || 0), y: (prop.y || 0) + q(1.3) }));
    const g = { type: 'group', x: side ? 0 : q(sgn * 0.66), y: r4(q(-2.6) + lift), rot: side ? (moving ? 0 : 6) : armPose[i], children };
    if (o.armSy) g.sy = o.armSy;
    const L = (o.armLoops || [])[i];
    if (L) g.loop = L;
    else if (side && moving) g.loop = { fx: 'sway', period: run, amp: o.legPose === 'run' ? 8 : 4, phase: i ? 0 : Math.PI };
    else if (o.arms === 'cheer' || o.arms === 'up') g.loop = { fx: 'flap', period: 0.5, amp: 0.7 * (i ? -1 : 1), phase: i * 0.4 };
    else if (o.arms === 'wave' && i === 1) g.loop = { fx: 'sway', period: 0.45, amp: 4 };
    return g;
  };
  if (side) kids.push(arm(0, true));

  // --- torso + print ---
  const tY = lift;
  const torsoPts = side ? [[q(-0.43), q(-1.5)], [q(0.43), q(-1.5)], [q(0.37), q(-2.8)], [q(-0.37), q(-2.8)]]
    : [[q(-0.8), q(-1.5)], [q(0.8), q(-1.5)], [q(0.6), q(-2.8)], [q(-0.6), q(-2.8)]];
  kids.push(part({ type: 'poly', pts: torsoPts.map(([x, y]) => [x, r4(y + tY)]), radius: q(0.09), fill: torso }));
  if (!side) kids.push(...printOn(o, tY));

  // --- arms ---
  if (side) kids.push(arm(1, false)); else { kids.push(arm(0)); kids.push(arm(1)); }

  // --- neck + head ---
  kids.push(part({ type: 'rect', wUnit: 'U', w: q(0.5), h: q(0.16), fill: skin, anchor: 'bottom', y: r4(q(-2.78) + tY), radius: q(0.03) }));
  const look = o.look || 0;
  const faceKids = side ? sideFace(o) : face(Object.assign({}, o, { skin }));
  const head = { type: 'group', x: 0, y: r4(q(-3.33) + tY), rot: o.headTilt || 0, children: [
    part({ type: 'rect', wUnit: 'U', w: q(0.62), h: q(0.2), fill: skin, anchor: 'bottom', y: q(-0.46), radius: q(0.06) }),   // stud
    part({ type: 'rect', wUnit: 'U', w: q(1.04), h: q(0.98), fill: skin, radius: q(0.3) }),
    { type: 'group', x: q(look * 0.16), y: 0, moves: o.lookMoves, children: faceKids },
    ...(o.hair && o.hair !== 'none' ? [{ type: 'group', x: side ? q(-0.06) : 0, children: hair(o.hair, o.hairColor || 'ink', o.hairAlt) }] : []),
  ] };
  if (o.headLoop) head.loop = o.headLoop;
  else if (o.headBob) head.loop = { fx: 'sway', period: o.headBob, amp: 1.4 };
  if (o.headMoves) head.moves = o.headMoves;
  kids.push(head);
  if (o.extra) kids.push(...o.extra);

  const g = { type: 'group', id: o.id, x: o.x, y: o.y, scale: o.s || 1, rot: o.rot || 0, step, children: kids };
  if (o.sx) g.sx = o.sx;
  ['in', 'out', 'moves', 'from', 'blur', 'sfx', 'sfxDur', 'sfxAt', 'sfxPitch'].forEach(k => { if (o[k] != null) g[k] = o[k]; });
  if (o.loop) g.loop = o.loop;
  else if (side && moving) g.loop = { fx: 'bob', period: run / 2, amp: o.legPose === 'run' ? 1.2 : 0.6 };
  else g.loop = { fx: 'float', period: 2.4 + rand() * 1.4, amp: 0.18, phase: rand() * 6 };     // breathing
  return g;
}

function sideFace(o) {
  const ink = 'ink', ex = EXPRESSIONS[o.face || 'smile'] || EXPRESSIONS.smile;
  if (o.skeleton) return [{ type: 'pill', w: q(0.26), wUnit: 'U', h: q(0.32), fill: ink, x: q(0.24), y: q(-0.06) }, rect({ w: q(0.26), h: q(0.12), fill: ink, x: q(0.36), y: q(0.3), radius: q(0.03) })];
  return [
    { type: 'pill', w: q(0.27), wUnit: 'U', h: q(0.06), fill: ink, x: q(0.27), y: q(-0.31 + ex.brows[2]), rot: ex.brows[1] },
    { type: 'group', x: q(0.27), y: q(-0.05), loop: { fx: 'blink', period: 3.1, phase: 0.6 }, children: [{ type: 'pill', w: q(0.14), wUnit: 'U', h: q(0.21), fill: ink }, { type: 'circle', r: q(0.033), fill: 'white', x: q(0.03), y: q(-0.05) }] },
    ex.mouth === 'grin' || ex.mouth === 'shout' || o.mouth === 'grin'
      ? { type: 'poly', pts: [[q(0.12), q(0.14)], [q(0.5), q(0.14)], [q(0.5), q(0.36)], [q(0.26), q(0.34)]], radius: q(0.07), fill: ink }
      : { type: 'path', points: [[q(0.2), q(0.2)], [q(0.36), q(0.27)], [q(0.5), q(0.2)]], stroke: ink, strokeW: q(0.05) },
    { type: 'circle', r: q(0.08), fill: 'blushDeep', opacity: 0.35, x: q(0.2), y: q(0.12) },
  ];
}

function printOn(o, tY) {
  const c = o.printColor || 'white', y = v => r4(q(v) + tY), out = [];
  if (o.skeleton) { [-2.45, -2.2, -1.95].forEach(v => out.push({ type: 'path', points: [[q(-0.42), y(v)], [q(0.42), y(v)]], stroke: 'ink', strokeW: q(0.07), smooth: false })); out.push(rect({ w: q(0.08), h: q(0.9), fill: 'ink', y: y(-2.05) })); return out; }
  switch (o.print) {
    case 'heart': out.push(part({ type: 'heart', r: q(0.26), fill: c, x: 0, y: y(-2.1), edge: false })); break;
    case 'stripe': out.push(rect({ w: q(1.44), h: q(0.24), fill: c, y: y(-2.05) })); break;
    case 'apron': out.push(part({ type: 'poly', pts: [[q(-0.46), y(-2.6)], [q(0.46), y(-2.6)], [q(0.6), y(-1.5)], [q(-0.6), y(-1.5)]], radius: q(0.06), fill: c, edge: false })); break;
    case 'tie': out.push({ type: 'poly', pts: [[q(-0.09), y(-2.78)], [q(0.09), y(-2.78)], [q(0.15), y(-1.85)], [0, y(-1.7)], [q(-0.15), y(-1.85)]], radius: q(0.02), fill: c }); break;
    case 'hoodie': out.push(rect({ w: q(0.9), h: q(0.36), fill: 'ink', opacity: 0.18, y: y(-1.75), radius: q(0.06) }), ...[-1, 1].map(s => ({ type: 'path', points: [[q(s * 0.12), y(-2.75)], [q(s * 0.14), y(-2.3)]], stroke: c, strokeW: q(0.04), smooth: false }))); break;
    case 'jacket': out.push(rect({ w: q(0.05), h: q(1.3), fill: 'ink', opacity: 0.35, y: y(-2.15) }), ...[-1, 1].map(s => ({ type: 'poly', pts: [[q(s * 0.05), y(-2.78)], [q(s * 0.42), y(-2.7)], [q(s * 0.22), y(-2.25)]], fill: c }))); break;
    case 'number': out.push({ type: 'text', text: String(o.printText || '7'), role: 'display', size: q(0.7), color: c, x: 0, y: y(-2.1) }); break;
    case 'logo': if (o.printSrc) out.push({ type: 'image', src: o.printSrc, w: q(0.8), wUnit: 'U', x: 0, y: y(-2.15) }); break;
    default: break;
  }
  return out;
}

// ---------------- motion helpers (explicit keyframes; engine moves are absolute) ----------------
// stop-motion hops in place (excitement, impatience)
export function hops(y0, dur, { every = 0.5, height = 0.025, H = 1920, start = 0 } = {}) {
  const m = [];
  for (let t = start; t + every <= dur + 0.01; t += every) {
    m.push({ at: r4(t), dur: r4(every * 0.45), y: r4(y0 - (height * 1080) / H), ease: 'outQuad' });
    m.push({ at: r4(t + every * 0.45), dur: r4(every * 0.4), y: r4(y0), ease: 'inQuad' });
  }
  return m;
}
// back-flip loops around the figure's middle (wrap the figure in a group placed at mid-body)
export function flips(y0, dur, { every = 1.4, height = 0.14, H = 1920, start = 0.3 } = {}) {
  const m = []; let k = 0;
  for (let t = start; t + 0.6 < dur; t += every) {
    k++;
    m.push({ at: r4(t), dur: 0.28, y: r4(y0 - (height * 1080) / H), ease: 'outQuad' }, { at: r4(t + 0.28), dur: 0.28, y: r4(y0), ease: 'inQuad' }, { at: r4(t), dur: 0.56, rot: -360 * k, ease: 'inOutQuad' });
  }
  return m;
}
// head turns: the printed face slides across the cylinder head (cheap, very "toy")
export function glances(dur, { every = 1.7, start = 0.4, amt = 0.16 } = {}) {
  const m = []; let s = 1;
  for (let t = start; t < dur - 0.3; t += every) { m.push({ at: r4(t), dur: 0.12, x: q(s * amt), ease: 'outCubic' }); s = s === 1 ? -1 : s === -1 ? 0 : 1; }
  return m;
}
export const Qunit = Q;
