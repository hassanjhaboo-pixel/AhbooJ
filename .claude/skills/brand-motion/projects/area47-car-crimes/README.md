# AREA 47 · "5 CAR CRIMES" (entertaining + informative)

A 33s 9:16 Reel. SEV judges five common car-care mistakes. Each case: the counter, the crime slams in word by word,
one plain reason why it's bad (types on), SEV roasts it (voiced + lip-synced), then a GUILTY stamp hits with a camera jolt.
Outro: "Or just let Area 47 handle it. Too clean." with grill sparkles and the booking card.

SEV speaks alien gibberish (`gibberish()` + `fx: 'alien'` in scripts/voice.mjs: made-up syllables with the same rhythm and
punctuation as the English line, pitched up with tremolo, vibrato, phaser and chorus). His English runs as typed subtitles under
him. Only the last words, "Too clean.", are spoken in English.

| Case | Crime | Why (on screen) |
|---|---|---|
| 01 | Dish soap on the paint | It strips the wax. Your paint loses its protection. |
| 02 | The brush car wash | Dirty bristles drag grit across the paint. Hello, swirl marks. |
| 03 | One towel for it all | Brake dust from the wheels ends up scratching the paint. |
| 04 | Washing in the hot sun | Soap dries before you rinse. The water spots stay. |
| 05 | Bird mess left to sit | It's acidic. Leave it and it can etch the clear coat. |

First video built to `references/anti-vibecode.md`: no grain or gradient washes, the only tag above a title is the case
counter (it carries data), slams/stamps/type-on instead of fades, high-contrast text. Display type is the trial face
Big Shoulders (`face: 'street'`), body is Outfit (`plain`/`plainBold`), both opt-in in brand/area47.json.
SEV comes from the reusable puppet kit `kits/area47-sevrig.mjs`.

```bash
node make.mjs && node sound.mjs
node ../../scripts/build.mjs --brand ../../brand/area47.json --story story.json --out out/crimes.html
node ../../scripts/render.mjs out/crimes.html --audio out/crimes.wav --blur 3
```
