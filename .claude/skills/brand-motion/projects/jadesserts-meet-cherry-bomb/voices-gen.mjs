import { voiceLines } from '../../scripts/voice.mjs';
import { LINES } from './lines.mjs';
const v = await voiceLines(LINES, new URL('./voices', import.meta.url).pathname, { quiet: true });
console.log('DONE', Object.values(v).reduce((a, x) => a + (x ? x.dur : 0), 0).toFixed(1), 's total');
