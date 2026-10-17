# SEV: image-generator prompts for a fully animatable character

Goal: turn SEV into a **rigged 2D puppet**. His body parts go on separate layers with pivot points (neck, shoulders, elbows, wrists, hips,
knees) so I can move them on any beat, plus **frame sets** for things a rig can't fake: mouth shapes for lip sync, blinks, head turns,
walk and dance cycles, and hand poses.

## Rules for EVERY generation (paste at the end of each prompt)
> Same character as the reference image (SEV, AREA 47 mascot). Exact same proportions, colours, outfit and line weight. Flat 2D cartoon,
> thick black outlines, flat cel shading with a thin cyan rim light. **Solid flat magenta #FF00FF background** (no gradient, no shadow on
> the ground, no props). Orthographic, straight-on camera, no perspective, no motion blur. Plain unbranded white-and-cyan high-top sneakers
> with **no logos or swooshes**. No text, no watermark. High resolution.

Why magenta: SEV is cyan, black, white and silver, and magenta never appears on him, so I can key it out with perfectly clean edges
(white backgrounds eat his chain and sneaker highlights).

**Always attach** the turnaround sheet and the hero image as references. Generate in this order (1 → 8). Each sheet becomes the
reference for the next, so his design never drifts.

---

## 1 · Master pose: the base of the rig (most important)
> Full-body front view of SEV standing in a neutral A-pose: arms held slightly away from the body at about 30 degrees, palms facing
> inward, three fingers relaxed, feet shoulder-width apart, facing camera, neutral calm expression, mouth closed, durag tails hanging
> straight down, antennae straight up, towel removed, chain centred. Character centred and filling 85% of the frame height.
> [+ rules]

## 2 · Parts sheet: every body part separated (the actual rig)
> Character parts sheet ("exploded view") of SEV from the A-pose, each part drawn separately with space between them, no overlaps,
> all at the same scale, front view: 1 head without face features (blank face, eyes and mouth removed), 2 durag tails (separate),
> 3 left antenna, 4 right antenna, 5 neck, 6 torso in black hoodie with drawstrings and 47 patch (no arms, no chain), 7 iced Cuban link
> chain with UFO pendant (separate), 8 left upper arm (hoodie sleeve), 9 left forearm (sleeve), 10 left hand open, 11 right upper arm,
> 12 right forearm, 13 right hand open, 14 hoodie pocket area / waist, 15 left thigh (black joggers), 16 left shin, 17 left sneaker,
> 18 right thigh, 19 right shin, 20 right sneaker, 21 blue microfiber towel (separate). Each limb part drawn with rounded joint ends,
> so it can rotate at the joint without gaps. Laid out in a tidy grid. [+ rules]

> **Tip:** if the generator struggles with 21 parts in one image, split it into 3 sheets: *head parts* (1–5), *upper body* (6–14,
> 21) and *legs* (15–20).

## 3 · Mouth chart: lip sync (visemes)
> Lip-sync mouth chart for SEV: 10 separate mouth shapes on his cyan skin, front view, same size and position in each cell, 5×2 grid,
> each mouth drawn alone (no face around it): 1 closed relaxed (M/B/P), 2 slightly open (rest), 3 wide open "AH", 4 "EE" wide smile
> showing the iced silver grill, 5 "OH" round, 6 "OO" small pucker, 7 "F/V" top teeth on lower lip, 8 "L/TH" tongue tip visible,
> 9 confident smirk (one corner up, grill showing), 10 big laugh. Thick black outlines, flat colours. [+ rules]

## 4 · Eye chart: blinks and looks
> Eye chart for SEV: pairs of his large black almond alien eyes with angled brows, same size and spacing in every cell, 4×3 grid,
> eyes and eyebrows only (no face): 1 neutral, 2 half-lidded unbothered, 3 closed (blink), 4 half-closed (blink in-between),
> 5 looking left, 6 looking right, 7 looking up, 8 side-eye with one brow raised, 9 wink left, 10 wide shocked, 11 happy closed arcs
> (laughing), 12 angry squint. [+ rules]

## 5 · Head turnaround in 8 angles (smooth head turns)
> SEV head-and-shoulders turnaround in 8 angles, evenly spaced in one row, same size and eye level: front, 3/4 left, profile left,
> 3/4 back left, back, 3/4 back right, profile right, 3/4 right. Neutral expression, durag tails and antennae consistent with each
> angle. [+ rules]

## 6 · Hand pose library (gestures)
> Hand pose library for SEV's three-fingered cyan alien hand with black hoodie cuff, 4×3 grid, same scale, front view: 1 relaxed open,
> 2 fist, 3 pointing at viewer, 4 thumbs up, 5 peace sign, 6 holding a spray bottle, 7 holding a folded blue microfiber towel, 8 wave,
> 9 holding a car key fob, 10 "4" with fingers, 11 OK sign, 12 palm out "stop". Each hand drawn alone, wrist cut clean. [+ rules]

## 7 · Walk cycle (8 frames)
> Sprite sheet of SEV walking, side view facing right, 8 frames of a smooth walk cycle in one row, same scale and ground line in every
> frame: contact, down, passing, up, contact (other leg), down, passing, up. Confident swagger walk, slight bounce, arms swinging,
> durag tails trailing. [+ rules]

## 8 · Signature move cycles (6 frames each, one row per move)
> Animation sprite sheet of SEV, front view, same scale and ground line, 3 rows × 6 frames:
> Row 1: "two-step" dance groove (shoulders bouncing, knees bending on the beat).
> Row 2: polishing a car bonnet with the towel in circles (hand moves round, body leans in).
> Row 3: arms-crossed head nod "say less" (head dips, chin lifts back up, slight lean back).
> [+ rules]

---

## Bonus · turn stills into motion with image-to-video
If your tool does video (Higgsfield, Kling, Runway, Veo, Hailuo), feed it the hero image or any pose plus:
> SEV the alien mascot [attach image], keep the exact design and flat 2D cartoon style, plain flat magenta background, locked camera.
> Animate: [pick one] nods slowly with an unbothered smirk and his antennae bob / does a confident two-step dance / points at the camera
> and winks, grill sparkles / polishes a car bonnet with the blue towel. 4–5 seconds, smooth, looping, no camera movement.

Send me the clips: I can key the magenta out and drop SEV into any video as a moving layer.

---

## What I build from each one
| Sheet | What it unlocks |
|---|---|
| 1 Master pose + 2 Parts | A full puppet rig: the head nods and turns, arms wave and point, knees bend, durag tails and antennae swing on their own (secondary motion), all on the beat |
| 3 Mouths | **Real talking**: SEV says lines with a synthesized voice ("Too clean.", "Say less.", "Your car is next"), lip-synced automatically. The engine already has voice + lip-sync tools |
| 4 Eyes | Natural blinks, glances at the product, side-eye on the beat |
| 5 Head angles | Smooth head turns (looking at a car, then back at camera) |
| 6 Hands | Gestures swap on the rig's wrists: point, thumbs up, holding the spray bottle or keys |
| 7 Walk | He walks on and off screen, across a car, into the van |
| 8 Cycles | Loopable dance / polish / nod for Reels, stickers and Stories |

**Checklist before sending:** magenta background ✓ · no swooshes ✓ · same character in every image ✓ · nothing cropped (antennae, feet, hands) ✓
