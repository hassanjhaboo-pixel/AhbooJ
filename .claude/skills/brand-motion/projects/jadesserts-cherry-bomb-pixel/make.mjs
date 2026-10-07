// Timeline for "Meet Cherry & Bomb" v2 (pixel). Reads voices/voices.json, schedules every line from real durations,
// derives caption reveal curves from each line's speech envelope, and writes timeline.json (shared by 9:16 and 1:1).
import fs from 'node:fs';
import { LINES } from './lines.mjs';

const V = JSON.parse(fs.readFileSync('voices/voices.json', 'utf8'));
const L = Object.fromEntries(LINES.map(l => [l.id, l]));
const r3 = x => Math.round(x * 1000) / 1000;

// [id, gap before (s), scene]. A gap may be negative to overlap (a cut-off / interruption).
const BEATS = [
  ['b_psst', 0.7, 'sign'], ['b_over', 0.25], ['c_wrong', 0.45], ['b_oops', 0.3], ['c_hi', 0.75], ['b_hi', 0.25], ['c_walk', 0.3],
  ['c_start', 1.9, 'kitchen'], ['b_ooh', 0.35], ['c_dont', 0.12], ['c_flour', 1.75], ['b_hehe', 0.3], ['c_mmhm', 0.15],
  ['c_love', 1.1], ['b_nights', 0.35], ['c_taste', 0.55], ['b_box', 0.45], ['c_these', 0.35], ['c_soon', 0.3],
  ['b_diff', 1.6, 'different'], ['c_nothing', 0.35], ['b_what', 0.2], ['c_corners', 1.15], ['b_corner', 0.55], ['c_scissors', 0.25], ['b_fine', 0.3],
  ['c_workers', 1.3, 'who'], ['b_lunch', 1.2], ['c_exam', 1.2], ['b_sad', 1.2], ['c_happy', 0.5], ['b_brighten', 0.9], ['c_someone', 0.3],
  ['c_free', 1.2, 'jade'], ['b_chaos', 0.3], ['c_you', 0.4], ['b_me', 0.15], ['c_uhhuh', 0.45],
  ['b_dream', 1.4, 'dream'], ['c_more', 0.4], ['c_whatsapp', 0.7], ['b_order', 0.3], ['c_maybe', 0.35],
  ['c_shy', 2.6, 'stop'], ['b_soon', 0.55], ['c_start2', 0.75], ['b_journey', 0.45],
  ['c_ready', 3.2, 'road'], ['b_ready', 0.45],
];

let t = 0; const lines = [], at = {};
for (const [id, gap] of BEATS) {
  const v = V[id]; if (!v) throw new Error('missing voice ' + id);
  t += gap; const dur = v.dur;
  // speech envelope -> caption reveal curve: cumulative voiced energy, 0..1 per voice frame
  const env = v.env, voiced = env.map(e => (e > 0.08 ? e : 0)), tot = voiced.reduce((a, b) => a + b, 0) || 1;
  let acc = 0; const rev = voiced.map(e => r3((acc += e) / tot));
  lines.push({ id, who: L[id].who, text: L[id].text, at: r3(t), dur: r3(dur), file: v.file, gain: L[id].gain || 1, fps: v.fps, env: env.map(r3), rev });
  at[id] = { at: r3(t), end: r3(t + dur) };
  t += dur;
}
const E = id => at[id].end, A = id => at[id].at;

// ---- story events (seconds) ----
const ev = {
  turn: r3(E('b_oops') - 0.35),           // spin from back view to front
  zoomOut: [r3(A('c_hi') - 0.2), r3(E('c_walk') + 0.1)],
  hop: r3(E('c_walk') + 0.25),            // hop off the sign onto the road
  walk0: r3(E('c_walk') + 1.0),           // start walking
  grab: r3(A('b_ooh') - 0.1),             // Bomb picks the sack off the crate
  boom: r3(E('c_dont') - 0.08),           // flour bomb (cuts Cherry off)
  resume: r3(E('c_mmhm') + 0.35),         // shake off and walk on
  lapse: [r3(A('c_love') - 0.2), r3(E('b_nights') + 0.7)],
  items: r3(A('c_taste') + 0.25),         // first item pickup (6, 0.42s apart)
  wave: r3(A('c_these') + 0.2), soon: r3(A('c_soon') + 0.5),  // hotbar shimmer + 'coming soon' toast
  freeze: [r3(A('b_what') + 0.08), r3(E('b_what') + 0.55)],
  scissors: [r3(A('b_corner') - 0.25), r3(A('b_fine') + 0.35)],
  toss: r3(A('b_fine') + 0.35),
  vign: ['c_workers', 'b_lunch', 'c_exam', 'b_sad', 'c_happy'].map(id => r3(A(id))),
  birds: r3(A('c_free') + 0.3), kind: r3(A('c_free') + 1.4),
  jump: r3(A('b_me')),
  bakery: r3(A('b_dream')),
  notify: r3(A('c_whatsapp') + 0.25),
  menu: r3(A('b_order')), menuEnd: r3(E('c_maybe') + 0.6),
  stop: r3(A('c_shy') - 1.9),             // decelerate to a stop
  whip: r3(E('b_journey') + 1.1),         // swing round behind them
  roadWalk: r3(E('b_ready') + 0.25),
  fade: r3(E('b_ready') + 2.2),
};
ev.black = r3(ev.fade + 1.3);
ev.end = r3(ev.black + 0.9);
const duration = r3(ev.end + 7.5);

// ---- walking speed keys (art px / s) — the film integrates these for camera + walk cycle ----
const WALK = 22;
const speed = [[0, 0], [ev.walk0, 0], [ev.walk0 + 0.7, WALK], [ev.boom - 0.15, WALK], [ev.boom + 0.15, 0], [ev.resume, 0], [ev.resume + 0.6, WALK],
  [ev.vign[0] - 1.5, WALK], [ev.vign[0] - 0.5, WALK * 1.5], [at.c_happy.end, WALK * 1.5], [at.c_happy.end + 1, WALK],
  [ev.stop, WALK], [ev.stop + 1.6, 0]];

fs.writeFileSync('timeline.json', JSON.stringify({ duration, walk: WALK, speed, ev, at, lines }));
console.log('duration', duration, 's  lines', lines.length);
console.log(Object.entries(ev).map(([k, v]) => k + '=' + (Array.isArray(v) ? v.join('/') : v)).join('  '));
