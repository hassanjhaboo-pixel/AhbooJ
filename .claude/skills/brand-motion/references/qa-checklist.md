# QA checklist: run on the contact sheet + a few stills before delivering

## Build
- [ ] `build.mjs` printed **no** `! unknown colour tokens` and no `! asset not found` warnings (or each one is a deliberate placeholder you will mention).
- [ ] Fonts: the sheet shows the brand face, not a fallback. If it fell back, add `type.fontFiles` (local woff2/ttf) and rebuild.

## Brand fidelity
- [ ] Only palette roles are used; nothing is off-palette.
- [ ] Logo is undistorted, has clear space, and sits on a background that gives it contrast (use `onDark` on dark stages).
- [ ] Copy follows `voice.case` and is ≤ `voice.maxWordsPerCard` words per card. Tone matches `voice.tone`.
- [ ] Every rule in `brand.rules.do/dont` is respected.

## Layout
- [ ] No text crosses the safe margin or clips at the frame edge (check the widest word in cyclers).
- [ ] No unintended overlaps between headline and hero.
- [ ] Hero is centred or deliberately placed; pairs and trios have equal gutters.
- [ ] Contrast is readable on every stage colour (small text ≥ 4.5:1, display ≥ 3:1).

## Motion
- [ ] Every scene has exactly one hero motion; ambient loops are subtle.
- [ ] Entrances land on beats (if `bpm` is set); scene lengths are whole or half bars.
- [ ] Each card holds long enough to read (0.3s × words + 0.5s).
- [ ] Every cut has a continuity device (match-cut, parked anchor, travelling line, iris from a point, bookend).
- [ ] At most one signature transition type plus `cut` (plus an ending `shrink`/`flash`).
- [ ] No empty or blank frame except intentional black at the very end.

## Structure
- [ ] Hook in the first 1–2s.
- [ ] End card: logo + at most one line + URL/CTA on a calm bg, held ≥ 2s.
- [ ] Opening motif returns at the end (bookend).
- [ ] Total length matches the platform (Reels/TikTok 6–30s; pre-roll 15s; bumper 6s).

## Delivery
- [ ] MP4 rendered (H.264, yuv420p) at the requested format.
- [ ] HTML preview, storyboard JSON and beat sheet handed over.
- [ ] Placeholders that still need real assets are listed.
