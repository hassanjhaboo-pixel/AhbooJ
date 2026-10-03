---
name: brand-motion
description: Generate on-brand animated motion-graphics videos (MP4 + live HTML preview) for ANY brand from a blank brand kit, using four proven ad styles decoded from Red Bull, IKEA "Together", Fresco (Buff Motion) and Spotify spots. Use whenever the user asks for a motion graphic, animated ad, promo video, social reel/story/TikTok animation, product launch animation, kinetic typography, animated logo sting or end card, explainer animation, or "make a video like the Red Bull/IKEA/Spotify/Fresco one" — even if they only paste copy and a brand name. Also use to re-skin an existing storyboard to a different brand or format.
---

# Brand Motion

You turn **a brand kit + a message** into a finished, frame-exact motion-graphics video.
The system is brand-agnostic: storyboards reference colour/type **roles** (`primary`, `onPrimary`, `bg`, `ink`, `accent`, `chapter1`…), never hex codes. You can re-skin any storyboard to any brand by swapping the brand file.

```
brand/<brand>.json  +  storyboards/<style>.json  ──build.mjs──▶  out/<name>.html  ──render.mjs──▶  out/<name>.mp4
   (who it is)            (what happens, when)                    (live preview)                     (deliverable)
```

## Files

| Path | What it is |
|---|---|
| `brand/brand.template.json` | **Blank brand kit.** Copy it per brand. |
| `brand/examples/*.json` | Filled examples (`demo-brand` = fictional, `ahbooj`). |
| `storyboards/*.json` | Four style playbooks, ready to re-skin and re-write. |
| `references/style-dna.md` | Read first. The four reference ads broken down scene by scene, plus the shared grammar. |
| `references/motion-language.md` | Timing, easing, beat grid, transitions, continuity (how frames carry into each other). |
| `references/layout-type.md` | Frame grid, safe areas, type scale, spacing, colour-role usage. |
| `references/engine-api.md` | Every element, effect, transition and field the engine supports. |
| `references/qa-checklist.md` | Run before you deliver. |
| `engine/motion.js`, `engine/player.html` | Deterministic canvas engine and preview player. No dependencies. |
| `scripts/build.mjs`, `scripts/render.mjs` | Bundle to one HTML file; render to MP4/stills/contact sheet. |

## Workflow

### 1. Get the brand kit
- If `brand/<slug>.json` already exists, use it.
- Otherwise run the **brand-kit-intake** skill if available. If not, copy `brand/brand.template.json` and fill it from what the user gives you: logo, site, style guide, CSS, or just "our colours are X and Y".
- Every role in `palette` must be filled. If the brand has only 2–3 colours, **alias** roles (for example `"secondary": "primary"`, `"chapter2": "bg"`) instead of inventing colours.
- Check contrast for every pair you will use: `onPrimary` on `primary`, `ink` on `bg`, and `ink` or `onPrimary` on each `chapterN`. Aim for at least 4.5:1 for small text and 3:1 for display text.
- Fonts: `fontUrls` (Google Fonts CSS) works where the network allows it. For offline or locked-down environments, add `type.fontFiles: [{ "family", "weight", "src": "fonts/X.woff2" }]`. `build.mjs` inlines those files.

### 2. Pick the style (or blend)
Match the brief to a playbook. Read its section in `references/style-dna.md`.

| Brief sounds like… | Playbook | Length | Energy |
|---|---|---|---|
| Product hit, drink/snack/gadget, "bold", "punchy", one hero product | `pop-pulse` (Red Bull) | 10–15s | punchy |
| Offer, subscription, app, price, list of features, "minimal", "type only" | `kinetic-type` (Spotify) | 8–15s | punchy, beat-cut |
| Brand launch, service, community, explainer, "warm", "friendly", food/lifestyle | `line-journey` (Fresco) | 20–45s | balanced/calm |
| Many products, rooms, use-cases, storytelling, "playful", "build a world" | `diorama-build` (IKEA) | 20–60s | balanced |

Blending is fine, for example a Kinetic Type opener, then a Pop Pulse product scene, then a Line Journey end card. Keep **one** signature transition and **one** motif across the blend.

### 3. Write the storyboard (before any JSON)
Write a short beat sheet. Use one row per scene:

`# | beat (sec or beats) | bg role | headline (≤ brand.voice.maxWordsPerCard words) | hero visual | motion in | continuity → next`

Rules that make it read like the references:
- **One idea per scene.** One headline, one hero. If you need a second sentence, you need a second scene.
- **Structure:** Hook (question or tension) → Answer/Product → Proof/Range → Character/Motif → Claim → End card. Shorter spots drop middle beats, never the hook or the end card.
- **Colour rhythm:** change the background role on most cuts and return to `bg` for the end card. Never put two adjacent scenes on the same colour unless the cut is a deliberate "same stage, new objects" repeat (diorama).
- **Continuity:** every cut has a carry-over: a match-cut hero in the same x/y, a line that keeps drawing, a logo that stays parked, or a shape that becomes the next scene's background. See `motion-language.md` § Continuity.
- **End card:** logo plus at most one line plus URL/CTA on `bg`, held for at least 2s (at least 3s for spots over 20s).

### 4. Build the storyboard JSON
- Copy the closest playbook from `storyboards/` to `storyboards/<brand>-<name>.json` (or the user's project folder) and edit it. Don't write from scratch.
- Replace copy, keep the timing skeleton, then adjust.
- Use `"4b"` beat times when there is music. Set `bpm` in the story and keep entrances on beats.
- Products, photos and footage stills use `image` elements with `src`. With no asset yet, leave `src: ""` and set `label`. The engine draws a labelled placeholder so the timing can be reviewed first.
- Format presets: `1080x1920` (Reels/TikTok/Stories, default), `1080x1350` (feed 4:5), `1080x1080` (square), `1920x1080` (YouTube/web). Positions are fractions, so they scale. After a format change, re-check the layout with a contact sheet.

### 5. Build, check, render
Run from this skill's folder (or pass absolute paths):
```bash
node scripts/build.mjs  --brand brand/<brand>.json --story storyboards/<story>.json --out out/<name>.html
node scripts/render.mjs out/<name>.html --sheet 12          # contact sheet → out/<name>_sheet.png  (LOOK AT IT)
node scripts/render.mjs out/<name>.html --stills 1.2,4.5    # spot-check specific moments
node scripts/render.mjs out/<name>.html [--audio track.mp3] [--gif]   # final MP4 (+ optional GIF)
```
- `build.mjs` warns about unknown colour tokens and missing assets. Fix every warning.
- **Always open the contact sheet image and look at it** before rendering the MP4. Check for text clipping off-frame, collisions, unreadable contrast and empty frames. Then run `references/qa-checklist.md`.
- The HTML file is a standalone player (Space = play/pause, scrubber). Give it to the user as the live preview alongside the MP4.
- Rendering needs Node 18+, Playwright (Chromium) and ffmpeg. If they're missing, deliver the HTML preview and tell the user the exact render command.

### 6. Deliver
Give the user: the MP4, the HTML preview, the storyboard JSON (editable source), and a 3–6 line beat sheet of what happens. State any placeholders that still need real assets (product shots, logo file, music).

## Non-negotiables
1. **Only role tokens** in storyboards (`primary`, `ink`, `chapter2`…). Never use a hex code unless the user explicitly asks for an off-brand one-off.
2. **Everything inside the safe area** (`brand.layout.safe`, default 8% of the short side), except deliberate bleeds: background shapes, lines entering from off-frame, and transitions.
3. **Copy is short.** At most `voice.maxWordsPerCard` words per card (default 4), set in `voice.case`. Reading time is about 0.3s per word plus 0.5s; never cut a card before that.
4. **Motion has a reason.** Entrances follow the beat, exits continue the direction of travel, and every scene has exactly one hero motion. Ambient loops (float, pulse, sway) stay subtle.
5. **The logo is never distorted, recoloured off-palette, or animated "through" itself.** It may pop, rise, scale or wipe in as a whole, keeping `logo.clearSpace` around it.
6. **Look before you ship.** You must view a contact sheet of the final version.

## Adapting to a new brand quickly (re-skin)
Same storyboard, new brand. Run `build.mjs --brand brand/<other>.json --story <same story>`, then look at the sheet. Typical fixes:
- Different type width: adjust `size` or `maxWidth` on overflowing text.
- Low contrast on a chapter colour: switch that scene's `color` role.
- Brand has a real logo file: check that the logo `w` still respects clear space.
- `shape.language` differs: circles brand → `circle`/`semicircle`; sharp brand → `rect` with `radius: 0`; rounded → `pill`/`rect` with radius; organic → `path` lines and `dots: drift`.
