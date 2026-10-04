#!/usr/bin/env node
// Character voices for storyboards: offline TTS (Kokoro via sherpa-onnx, 53 voices) + character FX + lip-sync envelopes.
//
//   node scripts/voice.mjs --cast cast.json --out projects/x/voices      (CLI)
//   import { voiceLines } from '../../scripts/voice.mjs'                   (from a project generator)
//
// cast.json: { "lines": [ { "id": "gary", "voice": "am_fenrir", "parts": [ { "text": "I'm not angry.", "fx": "deadpan" },
//                                                                           { "text": "I'm HUNGRY!", "fx": "shout", "gap": 0.25 } ] } ] }
// A line is either { text, fx, pitch, speed } or { parts: [...] } (each part may override voice/fx/pitch/speed; gap = silence before it).
// Output per line: <out>/<id>.wav (44.1 kHz mono) + an entry in <out>/voices.json: { file, dur, fps, env[] } where env is the
// mouth-opening envelope (0..1 per video frame) — feed it to an element's loop: { fx: 'lipsync', env, at }.
// Mix the wav into the soundtrack with an element field  voice: "<path to wav>"  (scripts/audio.mjs places it at the element's in.at).
// Results are cached by content hash, so re-running a generator only synthesises lines that changed.
// Install the engine once with scripts/setup-tts.sh. Without it, lines fall back to null (callers keep the synthesized babble).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SR = 44100;
// Kokoro v1.0 speaker order in the sherpa-onnx multi-lang package. a = American, b = British; f/m = female/male.
export const VOICES = ['af_alloy', 'af_aoede', 'af_bella', 'af_heart', 'af_jessica', 'af_kore', 'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
  'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael', 'am_onyx', 'am_puck', 'am_santa',
  'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily', 'bm_daniel', 'bm_fable', 'bm_george', 'bm_lewis'];

// Character FX: ffmpeg filter chains layered after the pitch/speed change. Keep them readable, not realistic.
export const FX = {
  clean: [],
  deadpan: ['equalizer=f=180:t=q:w=1:g=2'],
  bright: ['equalizer=f=3000:t=q:w=1:g=3'],
  shout: ['volume=2.2', 'asoftclip=type=tanh', 'equalizer=f=2400:t=q:w=1.2:g=6', 'acompressor=threshold=-18dB:ratio=6:attack=2:release=60'],
  whisper: ['highpass=f=320', 'equalizer=f=5000:t=q:w=1:g=4', 'aecho=0.6:0.4:18:0.25'],
  ghost: ['vibrato=f=4.5:d=0.18', 'aecho=0.8:0.75:70|140:0.35|0.22', 'lowpass=f=3600'],
  old: ['vibrato=f=6:d=0.07', 'highpass=f=140'],
  megaphone: ['highpass=f=520', 'lowpass=f=3200', 'volume=1.8', 'asoftclip=type=tanh', 'aecho=0.8:0.6:45:0.3'],
  tv: ['highpass=f=280', 'lowpass=f=5200', 'acompressor=threshold=-20dB:ratio=4'],
};
// Sensible per-preset prosody so callers can just say fx: 'shout'.
const PRESET = { shout: { speed: 1.08, pitch: 1.5 }, whisper: { speed: 0.95 }, ghost: { speed: 0.85, pitch: -4 }, old: { speed: 0.9, pitch: 1 }, megaphone: { speed: 1.0 } };

function ttsPaths(dir) {
  dir = dir || process.env.BRAND_MOTION_TTS || path.join(os.homedir(), '.cache/brand-motion/tts');
  if (!fs.existsSync(dir)) return null;
  const binDir = fs.readdirSync(dir).find(d => d.startsWith('sherpa-onnx-') && fs.existsSync(path.join(dir, d, 'bin/sherpa-onnx-offline-tts')));
  const model = path.join(dir, 'kokoro-multi-lang-v1_0');
  if (!binDir || !fs.existsSync(path.join(model, 'model.onnx'))) return null;
  return { bin: path.join(dir, binDir, 'bin/sherpa-onnx-offline-tts'), model };
}

function synth(tts, text, sid, speed, out) {
  const m = tts.model;
  execFileSync(tts.bin, [`--kokoro-model=${m}/model.onnx`, `--kokoro-voices=${m}/voices.bin`, `--kokoro-tokens=${m}/tokens.txt`,
    `--kokoro-data-dir=${m}/espeak-ng-data`, `--kokoro-dict-dir=${m}/dict`, `--kokoro-lexicon=${m}/lexicon-us-en.txt`,
    `--kokoro-length-scale=${(1 / speed).toFixed(3)}`, '--num-threads=4', `--sid=${sid}`, `--output-filename=${out}`, text], { stdio: 'pipe' });
}

const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'pipe', maxBuffer: 1 << 28 });

function processPart(raw, out, { pitch = 0, fx = 'clean' }) {
  const chain = [];
  if (pitch) { const r = Math.pow(2, pitch / 12); chain.push(`asetrate=24000*${r.toFixed(5)}`, `aresample=${SR}`, `atempo=${(1 / r).toFixed(5)}`); }
  else chain.push(`aresample=${SR}`);
  chain.push(...(FX[fx] || []));
  // trim the model's leading/trailing silence so timing is exact
  chain.push('silenceremove=start_periods=1:start_threshold=-48dB', 'areverse', 'silenceremove=start_periods=1:start_threshold=-48dB', 'areverse');
  ff('-i', raw, '-af', chain.join(','), '-ac', '1', '-c:a', 'pcm_s16le', out);
}

function envelope(wav, fps = 30) {
  const buf = ff('-i', wav, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-');
  const x = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4));
  const win = Math.round(SR / fps), n = Math.ceil(x.length / win), env = [];
  let peak = 1e-6;
  const rms = [];
  for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = i * win; j < Math.min(x.length, (i + 1) * win); j++) { s += x[j] * x[j]; c++; } const v = Math.sqrt(s / Math.max(1, c)); rms.push(v); peak = Math.max(peak, v); }
  let prev = 0;
  rms.forEach((v, i) => {
    const db = 20 * Math.log10(v / peak + 1e-9);                    // relative to the line's loudest frame
    const gate = Math.max(0, Math.min(1, (db + 26) / 12));          // is anyone talking at all?
    let local = 1e-9; for (let j = Math.max(0, i - 4); j <= Math.min(rms.length - 1, i + 4); j++) local = Math.max(local, rms[j]);
    const syl = Math.max(0, Math.min(1, (v / local - 0.45) / 0.45)); // syllable nuclei open, consonants close
    let e = gate * (0.22 + 0.78 * syl);
    e = Math.max(e, prev * 0.3);
    prev = e; env.push(Math.round(e * 100) / 100);
  });
  return { dur: x.length / SR, env };
}

export async function voiceLines(lines, outDir, { tts: ttsDir, fps = 30, quiet = false } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(outDir, 'voices.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const tts = ttsPaths(ttsDir);
  const result = {};
  for (const line of lines) {
    const parts = line.parts || [line];
    const hash = crypto.createHash('sha1').update(JSON.stringify({ parts: parts.map(p => ({ text: p.text, voice: p.voice || line.voice, fx: p.fx, pitch: p.pitch, speed: p.speed, gap: p.gap })), fps, v: 2 })).digest('hex').slice(0, 12);
    const file = path.join(outDir, `${line.id}.wav`);
    if (manifest[line.id] && manifest[line.id].hash === hash && fs.existsSync(file)) {
      const { dur, env } = envelope(file, fps);                     // cheap; lets envelope tuning apply without re-synthesis
      result[line.id] = manifest[line.id] = Object.assign(manifest[line.id], { dur: Math.round(dur * 1000) / 1000, env });
      continue;
    }
    if (!tts) { if (!quiet) console.warn(`! voice engine not installed (bash scripts/setup-tts.sh) — "${line.id}" falls back to babble`); result[line.id] = null; continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-'));
    const pieces = [];
    parts.forEach((p, i) => {
      const voice = p.voice || line.voice || 'af_heart', sid = typeof voice === 'number' ? voice : VOICES.indexOf(voice);
      if (sid < 0) throw new Error(`unknown voice "${voice}" (see VOICES in scripts/voice.mjs)`);
      const fx = p.fx || line.fx || 'clean', pre = PRESET[fx] || {};
      const speed = p.speed || line.speed || pre.speed || 1, pitch = p.pitch != null ? p.pitch : line.pitch != null ? line.pitch : pre.pitch || 0;
      const raw = path.join(tmp, `p${i}.raw.wav`), proc = path.join(tmp, `p${i}.wav`);
      synth(tts, p.text, sid, speed, raw);
      processPart(raw, proc, { pitch, fx });
      const gap = p.gap != null ? p.gap : i ? 0.12 : 0;
      if (gap > 0) { const sil = path.join(tmp, `g${i}.wav`); ff('-f', 'lavfi', '-i', `anullsrc=r=${SR}:cl=mono`, '-t', String(gap), '-c:a', 'pcm_s16le', sil); pieces.push(sil); }
      pieces.push(proc);
    });
    const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, pieces.map(p => `file '${p}'`).join('\n'));
    ff('-f', 'concat', '-safe', '0', '-i', list, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7', '-ar', String(SR), '-ac', '1', '-c:a', 'pcm_s16le', file);
    fs.rmSync(tmp, { recursive: true, force: true });
    const { dur, env } = envelope(file, fps);
    result[line.id] = manifest[line.id] = { file: path.basename(file), hash, dur: Math.round(dur * 1000) / 1000, fps, env };
    if (!quiet) console.log(`voice ${line.id.padEnd(14)} ${dur.toFixed(2)}s  "${parts.map(p => p.text).join(' … ')}"`);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), opt = k => { const i = a.indexOf(`--${k}`); return i >= 0 ? a[i + 1] : undefined; };
  if (!opt('cast')) { console.error('usage: voice.mjs --cast cast.json --out <dir> [--tts <dir>]'); process.exit(1); }
  const cast = JSON.parse(fs.readFileSync(opt('cast'), 'utf8'));
  await voiceLines(cast.lines, opt('out') || path.join(path.dirname(opt('cast')), 'voices'), { tts: opt('tts') });
}
