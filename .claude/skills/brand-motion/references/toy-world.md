# Toy worlds, characters & voices

Everything needed for character-driven spots (mascots, brick worlds, mockumentaries) in a realistic-but-cartoon miniature look.
Reference builds: `projects/jadesserts-the-line-v2/make.mjs` (hand-tuned) and `templates/mockumentary/` (brief-driven, any brand).

## The look (why it reads as "real toys")
1. **Moulded plastic** on every part: `plastic` shading + `edge` outline (kits set this by default).
2. **Miniature-photography depth of field**: blur far layers and the foreground (`blur` on layer groups: sky 0, far 0.006, mid 0.002, back row 0.0012, foreground planters 0.007). Keep the subject plane sharp.
3. **Studded ground** (`baseplate`), brick courses with shadowed lips, glass with diagonal reflections.
4. **Stop-motion timing**: figures animate on twos (`step: 12`), camera moves stay smooth. Limbs only rotate at the hip and shoulder; legs swing together in front view, alternate in side view.
5. **Grade**: light vignette + grain everywhere; stronger tint per mood in confessionals.

## kits/minifig.mjs
```js
F.minifig({
  x, y, s,                       // feet position (frame fractions top-level, U inside groups), scale (1 ≈ 0.23 U tall)
  view: 'front' | 'side',        // side = profile facing right (sx: -1 faces left)
  torso, legs, hips, sleeves, skin, // palette roles
  print: 'heart|stripe|apron|tie|hoodie|jacket|number|logo', printColor, printText, printSrc,
  hair: 'cap|bob|bun|ponytail|long|spiky|curly|mohawk|beanie|chef|helmet|none', hairColor, hairAlt,
  face: 'smile|grin|happy|angry|furious|shock|sly|worried|deadpan|sleep|dreamy', eyes, mouth, look: -1..1 (head turn),
  glasses, mustache, sweat, vein, blush: false, skeleton: true,
  arms: 'down|up|wave|cheer|point|hips|reach|hold|shrug|fist' | [leftDeg, rightDeg], armSy, armLoops: [loopL, loopR],
  legPose: 'stand|sit|walk|run|march', run: 0.34,   // cycle period (s)
  hand: element, handL: element,                    // props ride the hands
  talk: { env, fps, at },                           // lip-sync (from voice.mjs)
  lookMoves: F.glances(dur), headMoves, headTilt, headLoop,
  in, out, moves, loop, step: 12 | false, shadow: false, extra: [elements], sfx, sfxDur
})
```
Helpers: `F.hops(y0, dur, {every, height, H})`, `F.flips(...)` (wrap the figure in a group at mid-body), `F.glances(dur)`, props `F.sweetBox()`, `F.megaphone()`, `F.phone()`, `F.sign(text)`, `F.numberTile(n)`, `F.dust({...})`, `F.hair(kind)` (flying hats). `F.EXPRESSIONS` lists the faces.
**Render a character sheet first** (all faces/poses on one still) before building scenes — fixing a face there costs one still, not a re-render.

## kits/toytown.mjs
`T.sky`, `T.sun`, `T.cloud`, `T.building({w,h,color,trim,roof,rows,cols})`, `T.windowPane`, `T.tree` (stacked plates), `T.lamp`, `T.planter`, `T.street` (baseplate road + kerb + sidewalk), `T.bunting({points})`.
Older blocky pieces (tent, campfire, sleeping bag, cobweb, speech bubble) stay in `kits/brickworld.mjs`.

## Worlds & camera
- Build the world once in world pixels; each shot includes only what its camera sees (`vis()` culling) and sets `camera.focus` + `zoom`.
- Parallax: put a layer in a group with `x: (1 - factor) * focusX` moving to `(1 - factor) * focusX1` over the shot.
- Children of a group are in **U units**, top-level elements in frame fractions — convert (`y * H / U`) when moving a top-level element into a group, and always give layer groups `x: 0, y: 0`.

## Voices (scripts/voice.mjs)
Offline neural TTS (Kokoro v1.0 via sherpa-onnx, 28 English voices, free, no API key). Install once: `bash scripts/setup-tts.sh`.
```js
import { voiceLines } from '../../scripts/voice.mjs';
const V = await voiceLines([{ id: 'gary', voice: 'am_michael', parts: [{ text: "I'm not angry.", fx: 'deadpan' }, { text: "I'm HUNGRY!", fx: 'shout', gap: 0.45 }] }], 'voices');
// V.gary = { file, dur, fps, env }   → minifig talk: { env, fps, at }   → element voice: 'voices/gary.wav'
```
- Voices: `af_heart, af_bella, af_nicole, af_sarah, af_sky…` (American female), `am_michael, am_puck, am_onyx, am_fenrir, am_adam…` (American male), `bf_emma, bf_isabella, bf_lily, bf_alice` / `bm_george, bm_lewis, bm_daniel, bm_fable` (British). Full list: `VOICES` in the script.
- Character FX: `clean, bright, deadpan, shout, whisper, ghost (skeletons, spooky), old, megaphone, tv`, plus `pitch` (semitones) and `speed`.
- Results are cached by content hash; envelopes are recomputed cheaply, so tuning lip-sync never re-synthesises.
- Without the engine installed, lines return `null` and generators fall back to synthesized babble.
- audio.mjs mixes voices where elements carry `voice`, and **ducks the music bed under dialogue** (`--duck 0.6`, `--voice-gain 1`).
- Captions: always burn in every spoken line (feeds autoplay muted). Split a line into `parts`; generators type each part as it's spoken.

## Reality-TV confessional (pattern)
Set (blurred brick wall in the character's colour, brand poster, string lights, pool of light) · figure at chest-up (`s` ≈ 6 in 9:16) · `handheld` camera · HUD `REC · CONFESSIONAL` + day stamp + name/tag lower third · grade by mood · shutter click on the cut-in · cut to a tighter angle on the punchline (`cheer` sparkles, `rage` crash zoom + rays + impact, `scheme` white flash + purple + sting, `zoom`).
