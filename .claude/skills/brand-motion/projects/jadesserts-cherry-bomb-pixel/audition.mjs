// Bomb voice audition: the same two lines in four Kokoro voices -> audition/bomb-audition.wav
import { execFileSync } from 'node:child_process';
import { voiceLines } from '../../scripts/voice.mjs';
const V = ['am_fenrir', 'am_puck', 'am_michael', 'am_echo'], T = ["And I'm Bomb! Welcome to Jay Desserts!", 'Order! Pre-order! Gift a box! Tell her your feelings!'];
const lines = V.flatMap(v => T.map((t, i) => ({ id: `${v}_${i}`, voice: v, fx: 'clean', speed: 1.04, text: t })));
const out = await voiceLines(lines, 'audition', { quiet: true });
const files = lines.map(l => 'audition/' + out[l.id].file);
const args = files.flatMap(f => ['-i', f]);
const parts = files.map((_, i) => `[${i}]apad=pad_dur=${i % 2 ? 1.2 : 0.5}[a${i}]`).join(';');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args, '-filter_complex', `${parts};${files.map((_, i) => `[a${i}]`).join('')}concat=n=${files.length}:v=0:a=1`, 'audition/bomb-audition.wav']);
console.log('order:', V.join(', '));
