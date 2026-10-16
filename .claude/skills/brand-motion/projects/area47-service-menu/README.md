# AREA 47 · Service Menu as an arcade game ("SELECT YOUR MISSION")

A 28.8s 9:16 Reel (100 bpm) that turns the owner's service list into an arcade mission-select game, hosted by SEV.
Copy is word-for-word from the list. The photos are his own Taycan job, not the flyer's stock images.

| Time | Scene | What happens |
|---|---|---|
| 0–2.4s | Title | UFO flyby, SELECT YOUR MISSION, blinking PRESS START, SEV pops up hyped ("AYY") |
| 2.4–4.8s | Mission select | Three cards (LVL 1/2/3, UFO difficulty pips, LVL 3 in boss red); the cursor hops on the beat and SELECTs. SEV: "Pick one." |
| 4.8–9.6s | LEVEL 1 · Basic Wash | "Perfect for a quick refresh", loadout types in, stat bars SHINE 2 / INTERIOR 0 / PROTECTION 1. SEV: "Easy work." |
| 9.6–14.4s | LEVEL 2 · Deluxe Wash | "Extra care for your car", 4 items, bars 3/3/2. SEV: "Now we talking." |
| 14.4–20.4s | BOSS LEVEL · Full Detail | Red flash, warning stripes, minor-key music, 5 items, all bars MAX! with a level-up fanfare. SEV: "Boss mode." |
| 20.4–24s | POWER-UPS · Extra options | Ceramic Shine, Interior Deep Clean, Upholstery Extraction, Engine Bay Cleaning, Steam Treatment slide in as +1 pickups |
| 24–28.8s | PLAYER 2: YOUR CAR | READY?, SEV points at camera and winks "Too clean.", INSERT COIN → DM @a47.detailing, mobile + furniture line, phone |

The always-on HUD shows the logo, a SCORE that climbs per scene (ending on 047047), HI-SCORE: TOO CLEAN, CRT scanlines and a scrolling perspective grid floor.
The stat bars are a playful comparison drawn from what each package includes.

Sound: `chip.mjs`, an original chiptune (pulse lead, triangle bass, noise drums) that turns minor for the boss, with arcade
SFX (coin, blips, select, power-ups, level-up) placed on `cues.json`, which `make.mjs` writes at the exact animation times.

```bash
node make.mjs && node chip.mjs
node ../../scripts/build.mjs --brand ../../brand/area47.json --story story.json --out out/menu.html
node ../../scripts/render.mjs out/menu.html --audio out/menu.wav --blur 3
```
