# Research notes: what shaped engine v2

## 1. Measured critique of the v1 Jadesserts video (why v2 exists)
Measured with frame-difference motion energy on the delivered MP4 (`render.mjs --qa` now does this automatically).

| Problem | Evidence | Fix in v2 |
|---|---|---|
| Slideshow rhythm: motion only spikes at transitions | 22% of frames fully frozen (130/599). Static gaps at 4.5s, 7.0s, 8.5s, 10.0s, 11.5s | Secondary motion everywhere (`boil`, `jelly`, `wave`, spinning `rays`, drift); 0% frozen frames in v2 |
| Frozen end card | 17.6–19.9s ≈ no motion | Living end card: morphing `blob`, drifting confetti, swinging cherry, jelly logo, beating CTA |
| Blank first frames (thumbnail) | 0.0–0.4s = flat pink before the dot appears | Hook elements start at negative times; frame 0 shows all four products + headline |
| Silent | No audio stream | `audio.mjs`: music-box bed + 40+ synced SFX, -14 LUFS |
| Box read as flat UI cards | Rectangles, no perspective, lid = a block | Illustrated 3/4 gift box from `group` + `poly` with ribbon, bow, lid that wiggles and flies off |
| Mechanical drops | `outBounce` only, no deformation | `plop`: gravity fall + squash & stretch; anticipation wiggle before the lid opens |
| Products small and repetitive | Same row in the same box for 7s | Crumbl-style lineup: one product per 2s, big, on a stitched scallop plate, background morphing per item |
| Strobing on fast moves | Single-sample frames | `--blur 3` sub-frame motion blur |
| Typography not on-brand | Baloo 2 / Quicksand blocked here, DejaVu fallback | Still a fallback (environment limit). `bubble` + `outline` stroke make it rounder. Supply font files via `type.fontFiles` to fix exactly |

## 2. MotionGfx (voxell-tech/motiongfx, MIT/Apache-2.0): ideas adopted
Rust, backend-agnostic motion-graphics framework (inspired by Motion Canvas and Manim).
- **Relative / chained timing** (actions start from current values; tracks compose with `chain`, `all`, `any`, `flow(delay)`). Adopted as time expressions: `"@id.end+0.5b"`, named `cues`, `repeat.stagger` (≈ `flow`).
- **Conflict reporting** (`Sequence` reports overlapping clips on the same field). Adopted as build-time lint: overlapping `moves` on the same property, elements entering after the scene ends, unresolved references.
- **Two-way playback / seek without re-simulating.** Already true (every frame is a pure function of t). Kept, and exposed `MG.normalize()` so other tools read the same timeline.
- **Path tracing with a visible range (`t_start..t_end`).** Already covered by `path` `trail` + `out: draw`.
- **Easing library (easings.net set).** Ours covers the same families. `circ`/`sine`/`quint` are in the backlog.
- Assets: the repo only has its own demo `hero.webp` / `example.webp`. Nothing brand-usable.

## 3. Graphite (GraphiteEditor/Graphite, Apache-2.0): ideas adopted
Procedural, node-based vector/raster editor. Animation is "time as an input" to procedural nodes (`animation_time`, `real_time`).
- **Generator nodes** (`star`, `regular_polygon`, `spiral`, `arc`, `circle`, `grid`). Adopted: `star`, `polygon`, `scallop`, `blob`, `rays`.
- **Repeat / repeat_radial / copy_to_points + assign_colors.** Adopted as `repeat` (radial / line / grid) with `fills`, `texts`, `vary`, `stagger`.
- **round_corners, dash_pattern, morph, jitter_points.** Adopted `poly.radius`, `dash` on every shape, and the stepped `boil` jitter loop. `blob` is a time-driven organic morph.
- **Layers / hierarchy.** Adopted as nested `group`s.
- **Colour / gradient values flowing through nodes.** Adopted as colour tweens in `moves` and `bgTo` background morphs.
- Assets: `node-graph/nodes/text/src/source-sans-pro-regular.ttf` (SIL OFL) is the only font, a neutral sans and not a bubbly display face, so it's not used for Jadesserts. `demo-artwork/*.graphite` (Apache-2.0) are Graphite documents (fountains, landscapes, string lights) that need the Graphite editor to render and don't fit dessert branding.

## 4. Brand motion research
- **Crumbl** (official weekly-lineup short, analysed scene by scene; public marketing coverage): product-first collage hook, one flat pink stage, one product per ~2s with diagonal drift and handheld jitter, collage bookend, upbeat synth-pop. Became the `lineup-reveal` playbook.
- **Starbucks-style** (an animated ad plus a fan-made piece, both analysed): constant hero, worlds swap around it, drifting soft circles, pop per icon, chime on the logo. Became the `hero-constant` playbook. Starbucks' official Creative Expression site was not readable from this environment (egress blocked), so claims are limited to the public summary ("functional to expressive", "calm confidence").

## 5. Backlog (next upgrades, in priority order)
1. **Real brand fonts** in the environment (allow `fonts.googleapis.com`/`fonts.gstatic.com`, or drop woff2 files into `brand/fonts/`).
2. **SVG path import** (`d` strings) with draw-on via `getTotalLength`, so brand illustrations (the Jadesserts illustration kit) can draw themselves.
3. **Shape morph** between two `poly`/generator shapes with the same point count (Graphite `morph`).
4. **Text-on-path & per-letter colour cycling.**
5. **Spring easing** (stiffness/damping parameters) as an alternative to `outBack`/`outElastic`.
6. **Gradients** (linear/radial fills) for Starbucks-style soft circles.
7. **Licensed music import with beat detection** (auto-set `bpm` from the user's track).
8. **Safe-area lint** measured in the browser (text bounds vs `layout.safe`), not only by eye.
