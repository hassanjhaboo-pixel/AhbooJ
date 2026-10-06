// "How was your box?" — Cherry & Bomb survey the villagers. Caption text == spoken text (TTS reads "Jay Desserts").
const C = (id, text, o = {}) => Object.assign({ id, who: 'cherry', voice: 'af_bella', fx: 'bright', speed: 1, text }, o);
const B = (id, text, o = {}) => Object.assign({ id, who: 'bomb', voice: 'am_fenrir', fx: 'clean', speed: 1.04, text }, o);
const V = (who, voice, speed) => (id, text, o = {}) => Object.assign({ id, who, voice, fx: 'clean', speed, text }, o);
const MABEL = V('mabel', 'bf_emma', 0.86), DARNELL = V('darnell', 'am_onyx', 0.98), KIKI = V('kiki', 'af_sky', 1.08), ROSA = V('rosa', 'af_sarah', 0.98), JOE = V('joe', 'bm_george', 0.88);
export const CAST = {
  cherry: { name: 'Cherry', plate: '#f4636f' }, bomb: { name: 'Bomb', plate: '#b52a3b' },
  mabel: { name: 'Mabel', plate: '#a687d9' }, darnell: { name: 'Darnell', plate: '#4a6fa5' }, kiki: { name: 'Kiki', plate: '#ff9a3c' },
  rosa: { name: 'Ms. Rosa', plate: '#3c9b6e' }, joe: { name: 'Old Joe', plate: '#8a6a4a' },
};
export const LINES = [
  // the table
  C('c_intro', 'Good morning! Jade wants to know how you liked your box.'),
  B('b_intro', 'Be honest. We can take it.'),
  C('c_next1', 'First up!'),
  // 1 · Mabel
  MABEL('m1', "Oh, sweetheart. That banana bread tasted like my mother's kitchen."),
  C('c_aww', "Aww, that's so sweet."),
  MABEL('m2', 'I cried a little. Then I ate the cupcake.'),
  B('b_five', 'So… five stars?'),
  MABEL('m3', 'Five stars, baby.'),
  // 2 · Darnell
  C('c_next2', 'Next! How was your box?'),
  DARNELL('d1', 'It was… good.'),
  B('b_good', 'Good?', { speed: 0.82 }),
  DARNELL('d2', 'Great! I meant great! It was so great!', { speed: 1.12 }),
  B('b_thought', "Mm-hm. That's what I thought."),
  C('c_pin', 'Bomb. Put the rolling pin down.'),
  // 3 · Kiki
  C('c_next3', 'Next! Oh, hi there!'),
  KIKI('k1', 'I ate the whole box before dinner!'),
  C('c_mom', 'Did your mom find out?'),
  KIKI('k2', 'She ate the tart.'),
  B('b_respect', 'Respect.'),
  // 4 · Ms. Rosa
  C('c_next4', 'Next!'),
  ROSA('r1', 'I graded forty papers with that limeade by my side.'),
  ROSA('r2', 'Best Monday of my life.'),
  B('b_two', 'Forty papers? You deserve two boxes.'),
  // 5 · Old Joe
  C('c_next5', 'Last one! How many stars?'),
  JOE('j1', 'Four.'),
  B('b_four', 'Four?', { speed: 0.85 }),
  JOE('j2', 'The box was too small. I wanted more.'),
  B('b_fair', '…Okay. That is fair.'),
  C('c_compliment', "That's actually a compliment!"),
  // wrap
  C('c_love', "Jade's going to love these."),
  B('b_next', 'Next!'),
  C('c_turn', 'Your turn! Tell Jade how your box was.'),
];
export const say = l => l.text.replace(/Jadesserts/g, 'Jay Desserts').replace(/[…—]/g, m => (m === '…' ? '...' : ',')).replace(/^\.\.\./, '');
