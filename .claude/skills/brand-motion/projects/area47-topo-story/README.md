# AREA 47 · "TOPO" Story (kinetic type + topographic lines)

A 10s 9:16 Instagram Story at 120 bpm (one beat = 0.5s). The type slams in on the beat over glowing contour lines of a made-up
terrain. The lines pulse with the kick, get "abducted" in toward the summit on ABDUCT, then drift slowly behind the end card.
Key content sits between y 250 and 1640 px, clear of the Story UI.

| Time | What happens |
|---|---|
| 0–0.5s | Contours draw themselves on, HUD frame types in (AREA 47 DETAILING · TOPO SCAN · SECTOR 868) |
| 0.5–2.5s | DIRT? DUST? MUD? STAINS?, one per beat in the same slot. Each word gets an echo stack, flipping solid ↔ hollow cyan. Camera punches on every slam |
| 2.5–4.5s | WE / **ABDUCT** (letters drop in, crash zoom) / IT ALL. The terrain is sucked in toward the summit with shock rings, then springs back. "[ TRACTOR BEAM ENGAGED ]" |
| 4.5–6.0s | CARS. (interior · exterior) · FURNITURE. (upholstery shampoo) · MOBILE. (we come to you) |
| 6.0–10s | White flash → logo, **TOO CLEAN.**, DM TO BOOK · @a47.detailing, CARS · FURNITURE · MOBILE, phone. Slow push-in and drift |

- `contours.py`: numpy marching squares on a smooth terrain field → `contours.json` (26 levels, every 4th one is a bold "major" line).
- `make.mjs`: storyboard + `cues.json`. `sound.mjs`: synthesized 120 bpm bed + the A47 sonic identity (beam riser, hits, flash slam, pings).

```bash
python3 contours.py && node make.mjs && node sound.mjs
node ../../scripts/build.mjs --brand ../../brand/area47.json --story story.json --out out/topo.html
node ../../scripts/render.mjs out/topo.html --audio out/topo.wav --blur 3
```
