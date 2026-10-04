// The cast's spoken lines (offline TTS via scripts/voice.mjs). Edit a line and re-run make.mjs — only changed lines re-synthesise.
export const LINES = [
  { id: 'brenda', voice: 'af_bella', fx: 'bright', parts: [{ text: 'Day nine.' }, { text: 'I brought a tent.', gap: 0.25 }, { text: 'And a backup tent.', gap: 0.2 }, { text: 'Zero regrets!', gap: 0.3, speed: 1.05 }] },
  { id: 'gary', voice: 'am_michael', parts: [{ text: "I'm not angry.", fx: 'deadpan' }, { text: "I'm HUNGRY!", fx: 'shout', gap: 0.45 }] },
  { id: 'chad', voice: 'am_puck', fx: 'whisper', pitch: -1, parts: [{ text: 'Everyone thinks I’m here for one box.' }, { text: 'I’m here for ALL the boxes.', gap: 0.35 }] },
  { id: 'steve', voice: 'am_onyx', fx: 'ghost', parts: [{ text: "I've been here since nineteen ninety-eight." }, { text: 'Totally worth it.', gap: 0.3, speed: 1.15 }] },
  { id: 'baker', voice: 'bm_george', fx: 'megaphone', text: 'Good morning, Bricktown! Doors open in...' },
  ...['three', 'two', 'one'].flatMap((n, k) => ['am_michael', 'af_bella', 'am_puck', 'bf_emma', 'am_fenrir'].map((v, i) => ({ id: `chant_${n}_${i}`, voice: v, fx: 'shout', pitch: (i % 3) - 1, text: `${n[0].toUpperCase() + n.slice(1)}!` }))),
  { id: 'open', voice: 'bm_george', fx: 'megaphone', text: "We're OPEN!" },
  { id: 'finally', voice: 'am_onyx', fx: 'ghost', text: 'Finally.' },
  { id: 'narrator', voice: 'af_heart', parts: [{ text: 'Jay Desserts.', speed: 0.95 }, { text: 'Worth every wait.', gap: 0.35, speed: 0.95 }] },
];
