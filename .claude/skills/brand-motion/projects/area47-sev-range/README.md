# AREA 47 · "SEV: RANGE TEST" (rig showreel)

30s 9:16 reel showing everything the SEV rig does, one numbered section each:

| # | Section | What's driving it |
|---|---|---|
| 01 | Teleports | UFO beam + materialise (blur-in, horizontal squash) and landing bounce |
| 02 | Talks | Alien gibberish voice (`gibberish()` + `fx: 'alien'`), lip-synced mouths, subtitle "translated from alien", wave + head tilt |
| 03 | Expressions | Eye chart states (look left/right/up, side-eye, squint, wide, happy) with acted mouths (`mouths:` keys) |
| 04 | Gestures | Arm swings at the shoulder (point, shrug, other-arm point) + nod, side-to-side, head shake |
| 05 | Props | Hand-pose sheet pop-ins: thumbs up, spray, towel, keys, peace, OK |
| 06 | 360 | 8-angle head turn looped twice (`seqLoop`), lands on front |
| 07 | Walks | Side-view walk cycle across the frame with footsteps |
| 08 | Poses | v2 sticker poses (point, keys, 47, wink) with squash bumps |
| end | Too clean. | Spoken in English, happy eyes, grill sparkles, booking card |

```bash
node make.mjs && node sound.mjs
node ../../scripts/build.mjs --brand ../../brand/area47.json --story story.json --out out/range.html
node ../../scripts/render.mjs out/range.html --audio out/range.wav --blur 3
```
