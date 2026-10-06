// "Meet Cherry & Bomb" v2 (pixel) — the approved script. Caption text == spoken text.
// TTS spells the brand "Jay Desserts"; captions show "Jadesserts". No pitch shifting (keeps voices human).
export const BOMB_VOICE = process.env.BOMB_VOICE || 'am_fenrir';
const C = (id, text, o = {}) => Object.assign({ id, who: 'cherry', voice: 'af_bella', fx: 'bright', speed: 1, text }, o);
const B = (id, text, o = {}) => Object.assign({ id, who: 'bomb', voice: BOMB_VOICE, fx: 'clean', speed: 1.04, text }, o);
export const LINES = [
  // 1 · the sign
  B('b_psst', 'Psst! Psst!', { fx: 'whisper' }),
  B('b_over', 'Over here!', { fx: 'whisper' }),
  C('c_wrong', "Bomb. We're facing the wrong way."),
  B('b_oops', 'Oh! Turn around, turn around!'),
  C('c_hi', "Hi! I'm Cherry."),
  B('b_hi', "And I'm Bomb! Welcome to Jadesserts!"),
  C('c_walk', 'Walk with us!'),
  // 2 · Jade's kitchen
  C('c_start', 'It all started with Jade… and a whole lot of flour.'),
  B('b_ooh', 'Ooh, flour!'),
  C('c_dont', "Bomb, don't—"),
  C('c_flour', '…So much flour.', { speed: 0.92 }),
  B('b_hehe', 'Heh heh.'),
  C('c_mmhm', 'Mm-hm.', { speed: 0.9 }),
  C('c_love', 'She fell in love with it. The breads, the pastries, the trial and error.'),
  B('b_nights', 'Late nights. Early mornings. More late nights.'),
  C('c_taste', 'Every box is her grit and her passion. And you can taste it.'),
  // 3 · what makes us different
  B('b_diff', 'So what makes us different?'),
  C('c_nothing', 'Honestly? Nothing.'),
  B('b_what', 'What?!', { speed: 1.1, gain: 1.5 }),
  C('c_corners', 'No corners cut. Real effort. Real love. In everything.'),
  B('b_corner', 'Not even one tiny corner?'),
  C('c_scissors', 'Put the scissors down.'),
  B('b_fine', 'Ugh. Fine.'),
  // 4 · who it's for
  C('c_workers', 'For the ones working hard and running on empty.'),
  B('b_lunch', 'The treat after Sunday lunch!'),
  C('c_exam', 'After that exam.'),
  B('b_sad', 'On a sad day…'),
  C('c_happy', '…and on a happy one.'),
  B('b_brighten', 'Brighten your day!'),
  C('c_someone', "Or brighten someone else's."),
  // 5 · who Jade is
  C('c_free', "Jade's all about being free. And being kind."),
  B('b_chaos', 'And a little bit chaotic.'),
  C('c_you', "That's you."),
  B('b_me', "That's me!", { speed: 1.08, gain: 1.4 }),
  C('c_uhhuh', 'Uh-huh.', { speed: 0.9 }),
  // 6 · the dream + the order
  B('b_dream', 'And one day? A whole bakery!'),
  C('c_more', 'More people. Higher standards. Even more love.'),
  C('c_whatsapp', 'So, WhatsApp Jade.'),
  B('b_order', 'Order! Pre-order! Gift a box! Tell her your feelings!'),
  C('c_maybe', 'Maybe start with the order, Bomb.'),
  // 7 · the stop
  C('c_shy', "Jade's a little shy right now…", { speed: 0.9 }),
  B('b_soon', "But she'll be with y'all soon.", { speed: 0.96 }),
  C('c_start2', 'This is just the start.', { speed: 0.92 }),
  B('b_journey', 'Come on the whole journey with us.', { speed: 0.96 }),
  // 8 · the road
  C('c_ready', 'Ready?', { speed: 0.9 }),
  B('b_ready', 'Ready.', { speed: 0.9 }),
];
// what the TTS actually reads
export const say = l => l.text.replace(/Jadesserts/g, 'Jay Desserts').replace(/[…—]/g, m => (m === '…' ? '...' : ',')).replace(/^\.\.\./, '');
