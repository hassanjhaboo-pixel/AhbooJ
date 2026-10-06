import fs from 'node:fs';
import { voiceLines } from '../../scripts/voice.mjs';
import { LINES, say } from './lines.mjs';
const lines = LINES.map(l => ({ id: l.id, voice: l.voice, fx: l.fx, speed: l.speed, text: say(l) }));
const t0 = Date.now();
const v = await voiceLines(lines, 'voices', { quiet: true });
fs.writeFileSync('voices.log', 'DONE ' + Object.keys(v).length + ' ' + ((Date.now() - t0) / 1000).toFixed(0) + 's\n');
