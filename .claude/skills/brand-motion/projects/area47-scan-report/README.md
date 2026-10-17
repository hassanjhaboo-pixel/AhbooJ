# AREA 47 · "A47 SCAN REPORT" (services, on brand)

A 28.2s 9:16 Reel (100 bpm). The UFO scans a glowing blueprint car, and each package lights up the parts of the car it covers,
with HUD callouts and a coverage meter. The car never moves, so the eye compares packages directly. Copy is word-for-word from the
owner's service list (labels slightly shortened for the HUD chips, e.g. "Interior + exterior windows").

| Time | Scene | What lights up |
|---|---|---|
| 0–2.4s | Scan report | The UFO drops in, the beam turns on, the blueprint draws itself and the first scan sweep runs. "What does your car need?" |
| 2.4–7.2s | Package 01 · Basic Wash | Body, tires, exterior windows · 3 callouts · coverage 35% |
| 7.2–12.6s | Package 02 · Deluxe Wash | Body + wax sparkles, tires, both sides of the windows, interior · 4 callouts · 70% |
| 12.6–19.2s | Package 03 · Full Detail | Everything: seats (upholstery), steam rising from the cabin, a UV coating glow around the whole car · 5 callouts · **100%** (gold) |
| 19.2–23.4s | Extra options | Ceramic Shine (body), Interior Deep Clean, Upholstery Extraction (seats), Engine Bay Cleaning (engine), Steam Treatment |
| 23.4–28.2s | Scan complete | SEV under the beam points at camera, winks "Too clean.", DM TO BOOK @a47.detailing, mobile + furniture, phone |

Sound (`sound.mjs`): a dark minimal synth bed (Am–F–C–G) plus the A47 sonic identity on `cues.json`: beam + ping audio logo, blueprint zip,
scan sweeps, callout pings, a coverage meter tone (fanfare at 100%), and a pop for SEV.

```bash
node make.mjs && node sound.mjs
node ../../scripts/build.mjs --brand ../../brand/area47.json --story story.json --out out/scan.html
node ../../scripts/render.mjs out/scan.html --audio out/scan.wav --blur 3
```
