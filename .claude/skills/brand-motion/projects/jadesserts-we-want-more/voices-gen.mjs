import { voiceLines } from '../../scripts/voice.mjs';
import { LINES } from './lines.mjs';
const v = await voiceLines(LINES, new URL('./voices', import.meta.url).pathname);
console.log(Object.entries(v).map(([k, x]) => `${k}:${x && x.dur}`).join(' '));
