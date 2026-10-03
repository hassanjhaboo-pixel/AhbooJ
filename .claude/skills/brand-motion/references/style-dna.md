# Style DNA: the four reference spots, decoded

Source videos (vertical/horizontal social motion ads):
1. Red Bull motion graphic ad: https://youtu.be/yP6t1k5OGNI (15s), → **Pop Pulse**
2. IKEA, "Together" (allkustom): https://youtu.be/XU3jwFbg79w (60s), → **Diorama Build**
3. Fresco brand launch promo (Buff Motion): https://youtu.be/EfCkoqafS8k (45s), → **Line Journey**
4. Spotify motion graphics ad: https://youtu.be/eH8t7ZQQaNg (12s), → **Kinetic Type**

> These breakdowns come from a scene-by-scene analysis of each video (timestamps, backgrounds, elements, motion, audio). Exact easing and frame counts are reconstructed from standard motion-design practice for each look. Treat the numbers as starting points, not measurements. If the user can provide the source files, re-check timings against them.

---

## The shared grammar (true for all four)

| Principle | What it looks like in the references | Rule for you |
|---|---|---|
| **Flat colour stages** | Every scene is a single solid background: blue, white, teal (RB); tan, green, red, purple, blue (IKEA); cream, green, pink, orange (Fresco); charcoal → dark green (Spotify). | One solid bg role per scene. No gradients, no photos as full backgrounds. |
| **Colour = chapter** | The bg colour changes when the idea changes. | Change the bg role on idea changes; keep it when the idea continues (same stage, new objects). |
| **One idea, one hero** | Each scene has one message: "NEED ENERGY?", the can, the range, the wings, the logo. | One headline + one hero visual per scene. |
| **Centered, symmetrical framing** | Heroes sit dead centre; text centered above/below. | Default `x: 0.5`. Off-centre only for deliberate pairs (left/right) or line paths. |
| **Bookends** | IKEA: segmented bar at open and close. Fresco: cream bg + line at open, cream bg + logo at close. Spotify: logo top → logo centre. RB: white-ish product scene → white end card. | The opening motif returns in the end card. |
| **Beat-locked** | All four cut on the music; Spotify changes a word every second (on the beat). | Set `bpm`; place entrances/cuts on `"Nb"` beats. |
| **Short type** | 1–4 words per card. Bold sans (RB, Spotify), friendly rounded sans (Fresco), wordmark only (IKEA). | ≤ `voice.maxWordsPerCard` words. Display weight for hooks, headline weight for support. |
| **Logo end card on calm bg** | RB: logo top-centre on white + name in red. Fresco: logo in brand red on cream + line + URL. IKEA: logo + "TOGETHER" + bar on yellow. Spotify: logo alone on green, then frame closes. | End on `bg` (or brand colour), logo ≈ 45–60% frame width, one line under, hold ≥ 2s. |
| **Continuity device** | RB: can stays centred across 4 scenes. Fresco: one line threads the whole film. IKEA: the hand + the bar. Spotify: logo parked at top. | Pick ONE device and carry it through every cut. |

---

## 1 · Pop Pulse (Red Bull): 15s, punchy

**Feel:** energetic, graphic, toy-like. Saturated primary + white. Product is the star; a mascot motif (wings) gives it character.

| # | Time | BG | What happens | Motion detail | Carry-over |
|---|---|---|---|---|---|
| 1 | 0:00–0:02 | primary (saturated blue) | Single white dot appears centre → expands into **"NEED ENERGY?"** | Dot pops (overshoot), swells, text bursts out of it (`dot-expand`), tiny beat pulse | Centre point → product lands there next |
| 2 | 0:02–0:04 | white with scattered blue dots + curved lines | Can **flies up from bottom** to centre, tilted ~45° | `fly` with overshoot; dots scatter-pop; curves draw on | Can position = anchor for next 3 scenes |
| 3 | 0:04–0:07 | primary | Can holds centre, straightens; **2 variants** appear either side, stand vertically | Variants drop/pop on consecutive beats; hero rotates to 0° | Hero never moves (match cut) |
| 4 | 0:07–0:09 | teal (variant colour) | Sugar-free variant centred; **cartoon wings** sprout from the sides and flap | Wings `pop` then `flap` loop on the beat | Wings persist |
| 5 | 0:09–0:12 | primary (via white+blue **wipe**) | Hero + flapping wings; logo icon + sun above; VO tagline; slight **handheld shake** | Colour-band wipe; camera shake ~0.3; slow zoom | Tagline → end card |
| 6 | 0:12–0:15 | white (fade) | Logo top-centre, brand name in red bold underneath | Calm `pop-soft`/fade; centred lockup | — |

**Signature moves:** dot-expand hook · tilted product fly-in · match-cut hero across colour changes · colour-band wipe (white leading band + brand colour) · mascot loop · camera shake on the claim.
**Spacing:** hero ≈ 30% frame width (vertical), centred at y≈0.52; headline top third (y≈0.12–0.15); nothing touches edges except decorative arcs.

---

## 2 · Diorama Build (IKEA "Together"): 60s, balanced

**Feel:** playful, tactile, soft-3D/clay. A **hand** is the agent that makes things happen. Each use-case is a room on a flat colour stage; objects **drop in from above** and settle.

| # | Time | BG | What happens | Motion detail | Carry-over |
|---|---|---|---|---|---|
| 1 | 0:00–0:06 | yellow | Green 3D hand reaches in, **pulls a lamp cord** → blue logo appears; **blue segmented bar (4 parts)** grows left→right under it | Hand slides in, tug (down-then-back with overshoot), logo cuts on, bar segments grow in sequence | Bar = bookend |
| 2 | 0:06–0:09 | tan | Lamp, sofa, table, stool **drop from above**; headphones + bowl drop onto them | Biggest → smallest, one per beat, bounce settle | Same stage layout repeats |
| 3 | 0:09–0:11 | muted green | New furniture set, same staging | **Hard cut**, objects already settling | — |
| 4 | 0:11–0:13 | dark red | Wardrobe, media console, cabinet | Hard cut | — |
| 5 | 0:13–0:14 | dark purple | Home office; hand enters bottom-right, points to centre | Hand slide-in | Hand returns |
| 6 | 0:14–0:18 | deep blue | Finger **slides a toggle** → round mirror appears, clock pops | Knob moves on track; state change pops | Room → tablet screen |
| 7 | 0:18–0:21 | deep blue | Two characters hold a tablet showing the previous room | Frame-in-frame | — |
| 8–11 | 0:21–0:46 | light grey interiors | Characters move boxes, assemble, open drawers, walk through rooms | Tracking camera, character animation | — |
| 12 | 0:46–0:49 | green | Top-down coffee mug, hand lifts it, steam | Close-up insert | — |
| 13 | 0:49–0:51 | deep blue | Characters on sofa; **thin white border** frames the scene | Frame appears | Frame → shrink |
| 14 | 0:51–1:00 | yellow | Blue frame **shrinks into a small rectangle**; hand pushes it down, revealing logo + **"TOGETHER"**; bar segments reappear | `shrink` transition, hand push, bar reprise | Bookend closes |

**Signature moves:** hand-as-cursor · objects drop with bounce · hard cuts between colour rooms with identical staging (rhythm by repetition) · toggle/slider interaction · segmented bar bookend · frame shrinks to reveal end card.
**Spacing:** ground plane in the lower third (darker tint of bg); objects sit on it; headline top (y≈0.18); logo centre with bar under it at ~0.12 frame height gap.
**Note:** the template uses flat shapes/placeholders. For the clay-3D look, supply rendered object PNGs (transparent) as `image` src. Motion and timing stay the same.

---

## 3 · Line Journey (Fresco by Buff Motion): 45s, balanced/calm

**Feel:** warm, friendly, editorial. A cream canvas, **one continuous line with a heart at its tip** that threads through the whole film. A geometric system of circles, semicircles and pills. Real food footage inside **circular masks**.

| # | Time | BG | What happens | Motion detail | Carry-over |
|---|---|---|---|---|---|
| 1 | 0:00–0:02 | cream | Thin line enters from left, forms a loop; small **red heart pops at its tip**; text fades in beside | Path draw-on with tip marker; text rise/fade | Line tip → next copy |
| 2 | 0:02–0:05 | cream | Line extends right; **food + location-pin icons** pop along it with more text | Continued draw; icon pops | Line |
| 3–4 | 0:05–0:12 | vibrant green | Big **cream circle** centre holds text; **dark-green semicircles + small white circles** animate around it, layering | Scale-in disc; orbiting/overlapping semicircles | Circle language |
| 5 | 0:12–0:14 | soft pink | **Grid of cream circles, one highlighted red**; the line returns and **weaves through the grid** | Staggered grid pop; accent last; travelling line | Line returns |
| 6–7 | 0:14–0:21 | pink | Cooking footage **in circular frames**; red circles ring the frame, matching the food | Iris-in mask; slow push; accent dots | Circle mask |
| 8 | 0:21–0:24 | warm orange | **Two bean/pill shapes connected by a thin line**; text between; shapes pulse | Pop + pulse loop; line draw | "Connection" idea |
| 9 | 0:24–0:26 | orange | Abstract cream + dark-grey shapes; semicircle holds text | Overlapping shape moves | — |
| 10 | 0:26–0:29 | green | **Split frame**: footage right half, green circles left | Layout split | — |
| 11 | 0:29–0:31 | light green | Cream/white circles fall like **confetti**; text centre | `dots: fall` | Celebration |
| 12 | 0:31–0:33 | green frame | Pasta toss footage, bold text overlay, green shape frame | Footage + type | — |
| 13 | 0:33–0:37 | cream | **Two pink circles with text move together and merge → logo** | Moves to centre, merge, logo pop | Merge = logo |
| 14 | 0:37–0:45 | cream | Logo in dark red, one line + URL beneath | Long hold | — |

**Signature moves:** continuous line with tip marker · iris transitions from a circle · chapter colour per idea · accent used ONCE per scene (the red heart, the red grid dot) · footage in circle masks · two shapes merge into logo · confetti celebration beat.
**Spacing:** generous negative space; text centred or set beside the line tip; big disc ≈ 70% of frame width; grid gutters ≈ 30% of disc diameter.

---

## 4 · Kinetic Type (Spotify): 12s, punchy, beat-cut

**Feel:** confident, minimal, music-native. Pure type and logo. **The beat is the transition.**

| # | Time | BG | What happens | Motion detail | Carry-over |
|---|---|---|---|---|---|
| 1 | 0:00–0:04 | charcoal | White text appears **sequentially, centred**, monochrome | Hard-cut-on lines, on the beat | Centre stack |
| 2 | 0:04–0:05 | dark green (**sharp cut**) | Bright green circular logo appears **upper centre** | Pop-in | Logo stays parked |
| 3–4 | 0:05–0:09 | dark green | White word in centre **changes every second** (content categories → "anytime") | Same position, hard swap per beat | Same slot |
| 5 | 0:09–0:10 | dark green | Price **$9.99** | Punch in | — |
| 6 | 0:10–0:12 | dark green → black | Price clears, **logo alone centre**; frame **shrinks**, revealing a black border → cut to black | Shrink-to-border close | End |

**Signature moves:** monochrome type opener · hard cut into the brand colour · parked logo · one-slot word cycler on the beat · price punch (use an accent chip) · frame shrink to black.
**Spacing:** single centred column; logo at y≈0.25; cycler at y≈0.5; nothing else on screen. Size the cycler so the **longest** word fits `maxWidth`.

---

## Choosing / mixing quickly

- **Have one hero product?** Pop Pulse.
- **Have an offer and a beat?** Kinetic Type.
- **Have a story about people/place/service?** Line Journey.
- **Have many products or use-cases?** Diorama Build.
- **Mix:** Kinetic Type hook (2–4s) → Pop Pulse product (4–6s) → Line Journey end card is a strong 12–15s formula. Use one signature transition throughout (`brand.motion.signatureTransition`).
