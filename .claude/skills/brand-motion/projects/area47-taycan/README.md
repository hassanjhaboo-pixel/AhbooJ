# AREA 47 Detailing: "Case File 047" (motion carousel)

A 6-slide Instagram feed carousel (1080×1350, 4:5) on a Porsche Taycan Turbo GT, built from the owner's photos and phone clips.
**Concept:** AREA 47 (an Area 51 nod, 🛸 in the bio) runs a sci-fi investigation on the car: HUD brackets, targeting reticles,
scan lines and a UFO. Brand colours come from the logo: #00B9FC cyan, black and white.

| # | Slide | Media | Motion |
|---|---|---|---|
| 1 | **Close encounter** (cover) | sky → car clip | Title over the clouds (the grid thumbnail). The camera drops to the car, a UFO drops in with a tractor beam, a scan line sweeps the car, then SPECIMEN ACQUIRED / TAYCAN TURBO GT and SWIPE |
| 2 | Evidence 01 · **Mirror finish** | bonnet + crest photo | Slow push, a light sweep across the paint, sparkles on the sun glare. "Yes, those clouds are in the paint." |
| 3 | Evidence 02 · **Gold standard** | wheel pan clip | A reticle locks on the gold wheel and tracks it as the camera pans. RIM // DE-DUSTED, TYRE // CLEANED + DRESSED |
| 4 | Evidence 03 · **Every edge.** | Turbo GT badge clip | The reticle tracks the badge to BADGE // LOCKED |
| 5 | **The evidence** | 4 photos | Exhibits A–D drop in as polaroids, then a CASE CLOSED · DETAILED BY AREA 47 stamp slams down |
| 6 | **Your car is next.** | logo | The UFO flies up the path, parks and beams the logo down. Basic / Deluxe / Full Detail, extras, "Mobile: we come to you · furniture too", DM @a47.detailing, call +1 (868) 329-5373 |

**Swipe continuity:** a dashed flight path runs along the bottom of slides 1–5. Each slide draws it left to right with the UFO riding it,
entering where the previous slide left it. On slide 6 the path climbs to the top and the UFO parks there.

Service names come from his pinned service list (Basic Wash, Deluxe Wash, Full Detail; Ceramic Shine, Engine Bay, Steam, Upholstery).
No licence plates appear (the reveal clip is cut before the plate shows). The Porsche badges appear only as the car's own parts, never as our branding.
Key text stays inside the 3:4 profile-grid crop.

## Engine addition
`image` elements can now play **video clips** as frame sequences (`seq`, `seqFps`, `seqAt`, `seqRate`; see `references/engine-api.md`).

## Rebuild
```bash
./prep.sh <reveal.mp4> <wheel.mp4> <badge.mp4>   # frame sequences (git-ignored)
node make.mjs                                     # slide-1.json … slide-6.json
for i in 1 2 3 4 5 6; do
  node ../../scripts/build.mjs --brand ../../brand/area47.json --story slide-$i.json --out out/slide-$i.html
  node ../../scripts/render.mjs out/slide-$i.html --blur 3
done
```
Posting: upload slides 1–6 in order as one carousel post. The slides are silent, so add music in Instagram (it plays across the whole carousel).
