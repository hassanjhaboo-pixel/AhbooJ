# AREA 47 · "SEV TALKS" (first speaking spot)

A 14.8s 9:16 Reel/Story. SEV materialises in the UFO beam, talks to camera with lip-sync and word-by-word captions, then
signs off "Too clean." with a grill sparkle and the booking card. Framed waist-up, so the sneakers never show.

| Time | Line | Acting |
|---|---|---|
| 0–1.4s | (beam on) | UFO drops in, SEV materialises with a landing squash |
| 1.45s | "Yo. It's SEV." | Head tilt, arm swings out in a wave |
| 2.9s | "Straight outta Area 47." | Two nods |
| 5.2s | "Car dirty? Couch looking nasty?" | Head side-to-side, shrug |
| 7.9s | "Say less. We pull up to you." | Nod, arm points out |
| 10.2s | "Too clean." | Proud head pop, grill-smirk + sparkles |
| 10.7–14.8s | End card | Logo replaces the UFO, DM TO BOOK · @a47.detailing, cars · furniture · mobile · phone |

## The puppet (reusable for every future SEV video)
`rig.py` cuts the master A-pose (`src/master.png`, magenta keyed by `key.py`) into `assets/rig/`:
- `body.png`, `armL.png` / `armR.png` (pivot at the shoulder), `head-*.png` (pivot at the neck), `lids.png` (blink)
- 11 head variants: the original face + the 10 mouth-chart shapes blended into the face (closed, rest, ah, ee, oh, oo, fv, l, smirk, laugh)
- `rig.json`: every layer's box and pivot in master pixels

`make.mjs` voices the lines offline (Kokoro `am_onyx`, via `scripts/voice.mjs`), turns each line's loudness envelope into
mouth shapes frame by frame, keys head/arm moves to the lines, and writes `story.json` + `cues.json`.
`sound.mjs` mixes the voice over a 90 bpm bed that ducks under speech, plus the A47 sound cues.
The engine now accepts a custom pivot as `anchor: [fx, fy]`, which is what lets limbs rotate at the shoulder and neck.

```bash
python3 key.py src/master.png assets/master.png && python3 key.py src/mouths.png assets/mouths.png && python3 rig.py
node make.mjs && node sound.mjs     # needs: bash ../../scripts/setup-tts.sh (once)
node ../../scripts/build.mjs --brand ../../brand/area47.json --story story.json --out out/sev.html
node ../../scripts/render.mjs out/sev.html --audio out/sev.wav --blur 3
```
To give SEV new lines, edit `LINES` in make.mjs (text, caption words, highlighted words, arm + head acting) and re-run.

## v3 assets (walk, hands, head turn, eyes)
`cut_sheets.py` keys and cuts the four v3 sheets (`src/walk.png`, `hands.png`, `turn8.png`, `eyes.png`) into
`brand/assets/area47/sev/` with a manifest at `sev/v3.json`:
- `walk/walk-1..8.png`: side-view walk cycle (contact, down, passing, up ×2) on one shared canvas, shoe line and torso aligned
- `hands/hand-*.png`: open, fist, point, thumbs-up, peace, spray, towel, wave, keys, four, ok, stop
- `turn8/head-*.png`: 8-angle head turn (000 front, 045, 090 profile, 135, 180 back, 225, 270 profile, 315), shoulders aligned
- `eyes/eye-<state>-a|b.png`: 12 states × 2 eyes (a = viewer-left)

`fit_eyes.py` fits the eye chart onto the talking rig (`assets/rig/eyes-<state>.png`). In the kit:
- `sevPuppet({ …, eyes: [[t, 'look-left'], …] })` swaps eye states; blinks become half → closed → half automatically.
- `sevWalk({ x0, x1, y, h, at, fps })` plays the walk cycle (engine `seqLoop`) and glides at a stride-matched speed; returns `walkEnd`.
`demo-v3.mjs` is an 8s silent test of all of it.
