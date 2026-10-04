// "We Want More" — the cast's lines. Edit and re-run make.mjs; only changed lines re-synthesise.
export const LINES = [
  // act 1 — sincere praise, one box item each
  { id: 'denise1', voice: 'af_sarah', parts: [{ text: 'The chocolate banana bread?' }, { text: 'I cried.', gap: 0.3 }, { text: 'Twice.', gap: 0.35 }] },
  { id: 'marcus1', voice: 'am_adam', parts: [{ text: 'Fruit punch limeade.' }, { text: "I didn't know a drink could hug you.", gap: 0.3 }] },
  { id: 'pearl1', voice: 'bf_isabella', fx: 'old', parts: [{ text: 'That cherry jam tart...' }, { text: "my late husband would've proposed again.", gap: 0.25 }] },
  { id: 'tyler1', voice: 'af_sky', fx: 'bright', pitch: 3, parts: [{ text: 'Cheese paste puff!' }, { text: 'Cheese! Paste! PUFF!', gap: 0.2, speed: 1.1 }] },
  { id: 'dev1', voice: 'am_liam', parts: [{ text: 'The chicken puff pastry.' }, { text: 'Flaky. Golden. Life-changing.', gap: 0.3 }] },
  { id: 'denise2', voice: 'af_sarah', parts: [{ text: 'And the vanilla cupcake?' }, { text: 'I hid it from my own kids.', gap: 0.3 }] },
  // act 2 — hoping → demanding
  { id: 'marcus2', voice: 'am_adam', text: 'So... is Jade doing another sale?' },
  { id: 'pearl2', voice: 'bf_isabella', fx: 'old', text: 'I check her page every hour.' },
  { id: 'tyler2', voice: 'af_sky', fx: 'bright', pitch: 3, text: "When's the next one?!" },
  { id: 'dev2', voice: 'am_liam', parts: [{ text: "I'm not saying I need it.", fx: 'deadpan' }, { text: 'I NEED it.', fx: 'shout', gap: 0.35 }] },
  { id: 'denise3', voice: 'af_sarah', fx: 'shout', text: 'She HAS to do another one!' },
  // act 3 — the rally
  { id: 'marcus3', voice: 'am_adam', parts: [{ text: 'You know what?' }, { text: 'We want MORE!', fx: 'shout', gap: 0.25 }] },
  ...['am_michael', 'af_bella', 'am_puck', 'bf_emma', 'am_fenrir', 'af_nicole'].map((v, i) => ({ id: `chant_${i}`, voice: v, fx: 'shout', pitch: (i % 3) - 1, text: 'We want more!' })),
  // the cameo
  { id: 'jade', voice: 'af_heart', fx: 'whisper', text: 'Soon.' },
];
