// Timeline for "How was your box?" — schedules lines from real voice durations, plus interview staging + review cards.
import fs from 'node:fs';
import { LINES, CAST } from './lines.mjs';
const V = JSON.parse(fs.readFileSync('voices/voices.json', 'utf8'));
const L = Object.fromEntries(LINES.map(l => [l.id, l]));
const r3 = x => Math.round(x * 1000) / 1000;

let t = 0; const lines = [], at = {};
function say(id, gap = 0.3) {
  const v = V[id]; if (!v) throw new Error('missing voice ' + id); t += gap;
  const env = v.env, voiced = env.map(e => (e > 0.08 ? e : 0)), tot = voiced.reduce((a, b) => a + b, 0) || 1; let acc = 0;
  lines.push({ id, who: L[id].who, text: L[id].text, at: r3(t), dur: r3(v.dur), file: v.file, fps: v.fps, env: env.map(r3), rev: voiced.map(e => r3((acc += e) / tot)) });
  at[id] = { at: r3(t), end: r3(t + v.dur) }; t += v.dur; return at[id];
}
const ev = { bell: 0.25 }, interviews = [];
// the table
say('c_intro', 1.6); say('b_intro', 0.3); say('c_next1', 0.35);
// interviews: [villager, line script, review card]
const IV = [
  { who: 'mabel', script: [['m1', 0], ['c_aww', 0.35], ['m2', 0.35], ['b_five', 0.4], ['m3', 0.3]], stars: 5, quote: "Tasted like my mother's kitchen.", sign: '— Mabel' },
  { who: 'darnell', pre: 'c_next2', script: [['d1', 0], ['b_good', 1.6], ['d2', 0.2], ['b_thought', 0.35], ['c_pin', 0.3]], stars: 5, quote: 'GREAT. It was GREAT.', sign: '— Darnell', note: '(no pressure was applied)' },
  { who: 'kiki', pre: 'c_next3', script: [['k1', 0], ['c_mom', 0.35], ['k2', 0.35], ['b_respect', 0.5]], stars: 5, quote: 'Ate the whole box before dinner!', sign: '— Kiki, age 7' },
  { who: 'rosa', pre: 'c_next4', script: [['r1', 0], ['r2', 0.4], ['b_two', 0.4]], stars: 5, quote: 'Best Monday of my life.', sign: '— Ms. Rosa, teacher' },
  { who: 'joe', pre: 'c_next5', script: [['j1', 0], ['b_four', 1.2], ['j2', 0.55], ['b_fair', 0.6], ['c_compliment', 0.25]], stars: 4, crayon: true, quote: 'Box too small. Wanted more.', sign: '— Old Joe' },
];
let prevCard = null;
IV.forEach((iv, i) => {
  if (iv.pre) say(iv.pre, prevCard ? Math.max(0.2, prevCard + 1.5 - t) : 0.3);
  const step = r3(t + 0.15);                  // villager steps up from the queue
  t = step + 1.15;
  iv.script.forEach(([id, gap], k) => say(id, k === 0 ? 0.25 : gap));
  const s = iv.script.map(([id]) => at[id]), card = r3(t + 0.35);
  interviews.push({ who: iv.who, step, start: s[0].at, end: r3(t), card, exit: r3(card + 0.7), stars: iv.stars, crayon: !!iv.crayon, quote: iv.quote, sign: iv.sign, note: iv.note || null });
  prevCard = card; t = card + (iv.crayon ? 1.4 : 0.4);
});
// wrap
say('c_love', Math.max(0.3, prevCard + 2.0 - t)); say('b_next', 0.3);
ev.reveal = r3(at.b_next.at + 0.15);          // pull back: the line is now HUGE
ev.endcard = r3(ev.reveal + 3.0);
say('c_turn', ev.endcard + 0.7 - t);
const duration = r3(Math.max(t + 3.5, ev.endcard + 6.5));
// special beats
ev.goodZoom = [at.b_good.at - 0.9, at.b_good.end + 0.15].map(r3);   // tension: hard zoom on Bomb
ev.panic = [at.d2.at - 0.05, at.d2.end + 0.1].map(r3);
ev.pin = [r3(at.b_good.at - 0.2), r3(at.c_pin.end + 0.2)];
ev.fourZoom = [at.b_four.at - 0.8, at.b_four.end + 0.2].map(r3);
ev.boxSlide = r3(at.b_two.end - 0.2);
fs.writeFileSync('timeline.json', JSON.stringify({ duration, ev, at, lines, interviews, cast: CAST }));
console.log('duration', duration, 'lines', lines.length);
console.log(interviews.map(i => `${i.who} step=${i.step} card=${i.card}`).join('  '), ' reveal', ev.reveal, 'end', ev.endcard);
