// Cherry & Bomb — cut-out puppet rig built from the user's parts sheet (parts/*.png).
// Two living cherries joined by one stem. Cherry (left) is sweet and shy; Bomb (right) is a chaotic troublemaker.
//
//   import { duo } from '../../characters/cherry-bomb/rig.mjs'
//   duo({ x: 0.5, y: 0.8, s: 3, parts: '<path from the storyboard to characters/cherry-bomb/parts>',
//         cherry: { face: 'happy', talk: { env, at }, armL: 20, armR: -140, hand: ['open', 'open'] },
//         bomb:   { face: 'grin', look: -0.5, armR: -160, hand: ['open', 'point'] } })
//
// Units: U (short side) at s = 1 → each body is 0.2 U wide. Origin = between the feet. Faces: cherry → happy | smile |
// closed | shy | shock | talk ; bomb → grin | sly | angry | shock | talk. Limbs pivot at their joint balls.
const r4 = v => Math.round(v * 10000) / 10000;
const K = 0.2 / 198;                       // sheet px → U  (a body is ~198 px on the sheet)
const P = { cherry_body: [198, 191], bomb_body: [198, 197], stem: [263, 220], cherry_eye_l: [93, 96], cherry_eye_r: [93, 96], bomb_eye_l: [78, 104], bomb_eye_r: [78, 104],
  cherry_closed_l: [97, 47], cherry_closed_r: [97, 47], bomb_sly_l: [92, 64], bomb_sly_r: [92, 64], cherry_brow_l: [75, 39], cherry_brow_r: [75, 39], bomb_brow_l: [68, 44], bomb_brow_r: [68, 44],
  arm_a: [93, 121], arm_b: [88, 123], arm_c: [92, 120], arm_d: [83, 120], hand_open_l: [108, 104], hand_open_r: [118, 112], hand_fist_l: [85, 83], hand_fist_r: [85, 83], hand_point: [108, 94],
  shin_a: [59, 107], shin_b: [58, 104], shin_c: [58, 107], shin_d: [56, 107], foot_a: [97, 82], foot_b: [92, 82], foot_c: [95, 82], foot_d: [100, 82],
  cap: [227, 159], sunglasses: [240, 95], headphones: [224, 182], bomb_prop: [133, 140] };
const D = 0.2, LEG = 0.075;               // body diameter, visible leg length (U at s = 1)

let DIR = 'parts';
const img = (name, sc = 1, o = {}) => Object.assign({ type: 'image', src: `${DIR}/${name}.png`, w: r4(P[name][0] * K * sc), wUnit: 'U', h: r4(P[name][1] * K * sc), hUnit: 'U' }, o);
// a piece whose pivot (fx, fy as fractions of the piece) sits at the group origin
const pivot = (name, sc, fx, fy, o = {}) => img(name, sc, Object.assign({ x: r4((0.5 - fx) * P[name][0] * K * sc), y: r4((0.5 - fy) * P[name][1] * K * sc) }, o));

function arm(side, which, rot, hand, armLoop) {
  // which: 'cherry' uses arm_a / arm_b, 'bomb' uses arm_c / arm_d. Arms hang outward; ball (joint) at the top inner corner.
  const name = which === 'cherry' ? (side < 0 ? 'arm_a' : 'arm_b') : (side < 0 ? 'arm_c' : 'arm_d');
  const sc = 0.62, [pw, ph] = P[name], ball = side < 0 ? [0.72, 0.2] : [0.3, 0.2], tip = side < 0 ? [0.22, 0.86] : [0.78, 0.86];
  const hx = (tip[0] - ball[0]) * pw * K * sc, hy = (tip[1] - ball[1]) * ph * K * sc;
  const hName = hand === 'fist' ? (side < 0 ? 'hand_fist_l' : 'hand_fist_r') : hand === 'point' ? 'hand_point' : (side < 0 ? 'hand_open_l' : 'hand_open_r');
  const hs = 0.5;
  return { type: 'group', x: r4(side * D * 0.46), y: r4(D * 0.05), rot: rot || 0, loop: armLoop, children: [
    pivot(name, sc, ball[0], ball[1]),
    Object.assign(img(hName, hs, { x: r4(hx), y: r4(hy), rot: hand === 'point' ? (side < 0 ? 200 : -20) : side * -10 }), hand === 'point' && side < 0 ? { sx: -1 } : {}),
  ] };
}
function leg(side, which, rot, legLoop) {
  const shin = which === 'cherry' ? (side < 0 ? 'shin_a' : 'shin_b') : (side < 0 ? 'shin_c' : 'shin_d');
  const foot = which === 'cherry' ? (side < 0 ? 'foot_a' : 'foot_b') : (side < 0 ? 'foot_c' : 'foot_d');
  const sc = 0.72, [sw, sh] = P[shin];
  return { type: 'group', x: r4(side * D * 0.17), y: r4(-LEG), rot: rot || 0, loop: legLoop, children: [
    pivot(shin, sc, 0.5, 0.12),
    img(foot, 0.55, { anchor: 'top', x: r4(side * 0.008), y: r4((0.82 - 0.12) * sh * K * sc) }),
  ] };
}
function mouth(kind, which, talk) {
  const ink = 'ink', y = which === 'cherry' ? D * 0.2 : D * 0.21, x = which === 'cherry' ? 0 : D * 0.06;
  if (talk) return { type: 'group', x: r4(x), y: r4(y), loop: Object.assign({ fx: 'lipsync', min: 0.12 }, talk), children: [
    { type: 'poly', pts: which === 'cherry' ? [[-0.016, -0.009], [0.016, -0.009], [0.011, 0.012], [-0.011, 0.012]] : [[-0.026, -0.01], [0.026, -0.01], [0.016, 0.016], [-0.016, 0.016]], radius: 0.007, fill: ink },
    { type: 'circle', r: which === 'cherry' ? 0.0065 : 0.009, fill: 'blushDeep', y: 0.006 },
    ...(which === 'bomb' ? [{ type: 'rect', wUnit: 'U', w: 0.034, h: 0.006, fill: 'white', y: -0.007, radius: 0.002 }] : []) ] };
  switch (kind) {
    case 'grin': return { type: 'group', x: r4(x), y: r4(y), rot: -6, children: [
      { type: 'poly', pts: [[-0.03, -0.008], [0.03, -0.012], [0.022, 0.012], [-0.02, 0.012]], radius: 0.008, fill: 'white', stroke: ink, strokeW: 0.0035 },
      ...[-0.012, 0, 0.012].map(xx => ({ type: 'path', points: [[xx, -0.009], [xx, 0.011]], stroke: ink, strokeW: 0.002, smooth: false })) ] };
    case 'shock': return { type: 'group', x: r4(x), y: r4(y + 0.004), children: [{ type: 'pill', w: 0.022, wUnit: 'U', h: 0.03, fill: ink }, { type: 'circle', r: 0.007, fill: 'blushDeep', y: 0.007 }] };
    case 'flat': return { type: 'path', x: 0, y: 0, points: [[r4(x - 0.012), r4(y)], [r4(x + 0.012), r4(y + 0.002)]], stroke: ink, strokeW: 0.0035, smooth: false };
    case 'smirk': return { type: 'path', points: [[r4(x - 0.016), r4(y + 0.002)], [r4(x + 0.004), r4(y + 0.004)], [r4(x + 0.02), r4(y - 0.006)]], stroke: ink, strokeW: 0.004 };
    default: return { type: 'path', points: [[r4(x - 0.014), r4(y - 0.002)], [r4(x), r4(y + 0.008)], [r4(x + 0.014), r4(y - 0.002)]], stroke: ink, strokeW: 0.004 };
  }
}
function face(which, o) {
  const f = o.face || (which === 'cherry' ? 'happy' : 'grin'), lk = (o.look || 0) * D * 0.08, kids = [];
  const eyeY = -D * 0.02, ex = which === 'cherry' ? D * 0.2 : D * 0.21, ecx = which === 'cherry' ? 0 : D * 0.05;
  const blink = (ph) => ({ fx: 'blink', period: 3 + ph, phase: ph });
  if (which === 'cherry') {
    const closed = f === 'closed' || f === 'shy';
    [-1, 1].forEach((sd, i) => kids.push(closed ? img(sd < 0 ? 'cherry_closed_l' : 'cherry_closed_r', 0.42, { x: r4(sd * ex + lk), y: r4(eyeY + 0.005) })
      : { type: 'group', x: r4(sd * ex + lk), y: r4(eyeY), loop: blink(i * 0.07), children: [img(sd < 0 ? 'cherry_eye_l' : 'cherry_eye_r', f === 'shock' ? 0.5 : 0.42)] }));
    [-1, 1].forEach(sd => kids.push(img(sd < 0 ? 'cherry_brow_l' : 'cherry_brow_r', 0.32, { x: r4(sd * ex + lk), y: r4(eyeY - D * (f === 'shock' ? 0.26 : 0.2)), rot: f === 'shy' ? sd * 10 : 0 })));
    [-1, 1].forEach(sd => kids.push({ type: 'circle', r: 0.014, fill: 'blushDeep', opacity: f === 'shy' ? 0.85 : 0.5, x: r4(sd * D * 0.3 + lk), y: r4(D * 0.12) }));
  } else {
    const sly = f === 'sly';
    [-1, 1].forEach((sd, i) => kids.push(sly ? img(sd < 0 ? 'bomb_sly_l' : 'bomb_sly_r', 0.4, { x: r4(ecx + sd * ex + lk), y: r4(eyeY) })
      : { type: 'group', x: r4(ecx + sd * ex + lk), y: r4(eyeY - 0.004), loop: blink(0.6 + i * 0.05), children: [img(sd < 0 ? 'bomb_eye_l' : 'bomb_eye_r', f === 'shock' ? 0.5 : 0.42)] }));
    if (sly) [-1, 1].forEach(sd => kids.push(img(sd < 0 ? 'bomb_brow_l' : 'bomb_brow_r', 0.34, { x: r4(ecx + sd * ex + lk), y: r4(eyeY - D * 0.24), rot: f === 'shock' ? -sd * 25 : 0 })));
  }
  kids.push(mouth(o.talk ? 'talk' : which === 'cherry' ? ({ shock: 'shock', shy: 'flat', closed: 'smile' }[f] || 'smile') : ({ shock: 'shock', sly: 'smirk', angry: 'grin' }[f] || 'grin'), which, o.talk));
  return kids;
}
function character(which, o = {}) {
  const sideLegsLoop = o.walk ? i => ({ fx: 'sway', period: o.walk, amp: 4, phase: i ? Math.PI : 0 }) : () => undefined;
  const armLoop = (i) => (o.armLoops || [])[i] || (o.wave && i === 1 ? { fx: 'sway', period: 0.45, amp: 4 } : o.walk ? { fx: 'sway', period: o.walk, amp: 3, phase: i ? 0 : Math.PI } : { fx: 'sway', period: 2.6 + i * 0.3, amp: 0.6 });
  const hands = o.hand || ['open', 'open'];
  const body = { type: 'group', y: r4(-LEG - D * 0.42), rot: o.lean || 0, loop: o.bodyLoop || { fx: 'jelly', period: 1.4 + (which === 'bomb' ? 0.17 : 0), amp: 0.5 }, moves: o.bodyMoves, children: [
    arm(-1, which, o.armL != null ? o.armL : 18, hands[0], armLoop(0)),
    arm(1, which, o.armR != null ? o.armR : -18, hands[1], armLoop(1)),
    img(which === 'cherry' ? 'cherry_body' : 'bomb_body', 1, o.back ? { sx: -1 } : {}),
    ...(o.back ? [] : face(which, o)),
    ...(o.acc || []).map(a => ({ cap: img('cap', 0.62, { x: 0.01, y: r4(-D * 0.47), rot: -12 }), sunglasses: img('sunglasses', 0.5, { x: r4(which === 'bomb' ? D * 0.06 : 0), y: r4(-D * 0.04) }), headphones: img('headphones', 0.95, { y: r4(-D * 0.12) }) }[a])),
  ] };
  return { type: 'group', x: o.dx || 0, y: 0, moves: o.moves, loop: o.loop, children: [leg(-1, which, o.legL, sideLegsLoop(0)), leg(1, which, o.legR, sideLegsLoop(1)), body] };
}
export function duo(o = {}) {
  if (o.parts) DIR = o.parts;
  const sep = D * 0.47, bk = !!o.back, cs = bk ? 1 : -1;   // seen from behind, Cherry is on the right
  const kids = [
    { type: 'pill', w: 0.44, wUnit: 'U', h: 0.028, fill: 'ink', opacity: 0.16, y: 0.002 },
    // the shared stem: its two tips sit on the tops of the bodies
    // stem: stretched to span both bodies, squashed to the art's proportions (about one body tall), tips on the body tops
    img('stem', 1.3, { h: r4(220 * K * 0.85), sx: bk ? -1 : 1, x: r4(cs * sep - cs * (0.5 - 0.06) * 263 * K * 1.3), y: r4(-LEG - D * 0.42 - D * 0.44 + (0.5 - 0.9) * 220 * K * 0.85), loop: { fx: 'sway', period: 2.4, amp: 0.25 } }),
    character('cherry', Object.assign({ dx: cs * sep, back: bk }, o.cherry || {})),
    character('bomb', Object.assign({ dx: -cs * sep, back: bk }, o.bomb || {})),
  ];
  return Object.assign({ type: 'group', x: o.x, y: o.y, scale: o.s || 1, step: o.step, from: o.from, screen: o.screen, sx: o.sx, children: kids }, o.in ? { in: o.in } : {}, o.moves ? { moves: o.moves } : {}, o.loop ? { loop: o.loop } : {}, o.out ? { out: o.out } : {}, o.sfx ? { sfx: o.sfx } : {});
}
export const BODY = D;
