// "Meet Cherry & Bomb" — the script. Cherry = sweet, calm angel (af_bella). Bomb = chaotic little devil (am_puck).
// Order = order of appearance. Brand name is spelled "Jay Desserts" so the voices pronounce it right.
const C = (id, text, o = {}) => Object.assign({ id, voice: 'af_bella', fx: 'bright', pitch: 1, text }, o);
const B = (id, text, o = {}) => Object.assign({ id, voice: 'am_puck', pitch: 1, text }, o);
export const LINES = [
  // ---- open: the logo ----
  B('b_psst', 'Psst! Psst!', { fx: 'whisper' }),
  B('b_over', 'Over here!', { fx: 'whisper' }),
  C('c_wrong', "Bomb. We're facing the wrong way."),
  B('b_oops', 'Oh! Hehe. Turn around, turn around!'),
  C('c_hi', "Hi! I'm Cherry!"),
  B('b_hi', "And I'm Bomb! Welcome to Jay Desserts!", { fx: 'shout', pitch: 1 }),
  C('c_come', 'Come on, walk with us!'),
  // ---- the walk: the story ----
  C('c_start', 'It all started with Jade, and a whole lot of flour.'),
  B('b_flour', 'SO much flour.'),
  C('c_love', 'She fell in love with baking. The breads, the pastries...'),
  B('b_burnt', 'The burnt ones!'),
  C('c_trial', 'The trial and error, Bomb. She loved the grind.'),
  B('b_nights', 'Late nights. Early mornings. More late nights.'),
  C('c_taste', 'Every box is her grit and her passion. And you can taste it.'),
  B('b_diff', 'So what makes us different?'),
  C('c_nothing', 'Honestly? Nothing.'),
  B('b_what', 'WHAT?!', { fx: 'shout' }),
  C('c_corners', 'No corners cut. Real effort. Real love. In everything.'),
  B('b_scissors', 'Not even one tiny corner?'),
  C('c_put', 'Put the scissors down.'),
  C('c_teacher', "It's for the stressed teacher after a long day."),
  B('b_student', 'The student who just finished homework!'),
  C('c_news', 'The good news. The good reports.'),
  B('b_breakfast', 'The good breakfast!', { fx: 'shout' }),
  C('c_brighten', 'Brighten your day...'),
  B('b_someone', "...or someone else's!"),
  C('c_free', "Jade's all about being free. And being kind."),
  B('b_chaos', 'And a little bit chaotic.'),
  C('c_you', "That's you."),
  B('b_me', "That's ME!", { fx: 'shout' }),
  B('b_dream', 'And one day? A whole bakery!'),
  C('c_more', 'More people. Higher standards. Even more love.'),
  C('c_swipe', 'So swipe up, and talk to Jade.'),
  B('b_order', 'Order! Pre-order! Gift a box! Tell her your feelings!'),
  C('c_maybe', 'Maybe start with the order, Bomb.'),
  // ---- the sincere bit ----
  C('c_shy', "Jade's a little shy right now...", { speed: 0.92 }),
  B('b_soon', "But she'll be with y'all soon.", { speed: 0.95 }),
  C('c_start2', 'This is just the start.', { speed: 0.92 }),
  B('b_journey', 'Come on the whole journey with us.', { speed: 0.95 }),
  C('c_ready', 'Ready?', { speed: 0.9 }),
  B('b_ready', 'Ready.', { speed: 0.9 }),
  // ---- sitcom audience (a crowd = several voices layered) ----
  ...['af_sarah', 'am_adam', 'bf_emma', 'am_michael', 'af_nicole', 'bm_lewis'].map((v, i) => ({ id: `laugh_${i}`, voice: v, pitch: (i % 3) - 1, text: ['Ha ha ha ha!', 'Hahaha ha!', 'Ha ha ha!'][i % 3], speed: 1.15 })),
  ...['af_sarah', 'am_adam', 'bf_emma', 'af_heart', 'bm_lewis'].map((v, i) => ({ id: `aww_${i}`, voice: v, pitch: (i % 3) - 1, text: 'Awwww.', speed: 0.85 })),
];
