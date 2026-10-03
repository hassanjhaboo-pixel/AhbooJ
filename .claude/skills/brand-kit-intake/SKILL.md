---
name: brand-kit-intake
description: Turn any brand into a filled brand kit (brand JSON) for the brand-motion video system. Works from a logo, website, style guide PDF, CSS/Tailwind theme, Figma/Canva export, screenshots, or just a description. Use when the user wants motion graphics or animated ads for a brand that has no brand/<slug>.json yet, says "here's my brand", "use these colours/fonts", "set up a new brand", "add a client", or asks to re-skin a video for another brand.
---

# Brand Kit Intake

Output: `brand/<slug>.json` inside the **brand-motion** skill folder (or the user's project), following `brand-motion/brand/brand.template.json` exactly. Every storyboard reads colours and type **by role**, so the job is to map the brand onto roles. Don't just list its colours.

## 1. Collect (use whatever exists, in this priority)
1. **Code**: CSS variables, Tailwind `@theme`/config, design-token JSON. These are exact; prefer them.
2. **Brand guide / PDF / Figma / Canva brand kit**: primary/secondary palette, fonts, logo rules.
3. **Logo file(s)**: SVG preferred, otherwise PNG with transparency. Note light and dark versions.
4. **Website / screenshots**: sample the dominant colours (button = usually `primary`; page bg = `bg`; body text = `ink`).
5. **Description only**: ask at most 3 short questions: *main colour(s)? font or vibe (bold/elegant/friendly)? logo file?* Then propose the rest and say what you assumed.

## 2. Map to roles
| Role | How to choose |
|---|---|
| `primary` | The colour people would name the brand by. Hook and claim scenes sit on it. |
| `onPrimary` | White or the brand's light neutral, whichever has more contrast on `primary`. |
| `bg` | The brand's light neutral (off-white, cream, light grey). Pure #FFFFFF only if that's the brand. |
| `ink` | The brand's darkest text colour (rarely pure black). |
| `secondary`, `onSecondary` | Second brand colour, or a tint/shade of primary if there isn't one. |
| `accent`, `onAccent` | The brand's pop colour, used sparingly. With no pop colour, use the most saturated secondary. |
| `dark`, `onDark` | Deepest tone (can equal `ink`) and its light partner (can equal `bg`). |
| `chapter1..4` | 3–4 stage colours for rotating scenes: primary, secondary, accent-tint, and a light tint of primary are a safe default. All must carry `ink` or `onPrimary` text legibly. |

Roles may alias: `"secondary": "primary"` is valid. Never invent off-brand hues; derive tints and shades from brand colours instead (mix with `bg`/`ink`).

**Contrast check** (compute it, don't eyeball it): WCAG ratio for `onPrimary/primary`, `ink/bg`, `onSecondary/secondary`, `onAccent/accent`, `onDark/dark`, and the text colour on each chapter. Display text ≥ 3:1, small text ≥ 4.5:1. Fix by swapping on-colours or adjusting the chapter tint. Quick formula: relative luminance L = 0.2126R + 0.7152G + 0.0722B on linearised sRGB; ratio = (L1+0.05)/(L2+0.05).

## 3. Type
- `display` = the brand's headline face at its heaviest sensible weight. `headline` = the same face one step lighter, or the secondary face. `body` = the text face.
- `case`: upper for bold/sporty/streetwear brands, sentence for warm/editorial, as the brand guide dictates.
- Fonts: add the Google Fonts CSS URL to `fontUrls`. If the font isn't on Google Fonts, or the render environment is offline or proxied, put the font files in `brand/fonts/` and list them in `fontFiles` (`{ "family", "weight", "src" }`). With no font file available, choose the closest Google font and tell the user what you substituted.

## 4. Logo, shape, motion, voice
- `logo.src` / `srcOnDark`: paths relative to the brand JSON. Put files in `brand/assets/<slug>/`. With no file, set `wordmark` and `color`.
- `shape.language` and `shape.motif`: read the brand's existing graphics. Rounded corners → rounded; circles/dots → circles; hard edges/stripes → sharp; hand-drawn/flowing → organic. The motif is the ONE recurring device (a line, a bar, a symbol from the logo).
- `motion.energy`: from the brand personality (calm = luxury, wellness, finance; balanced = lifestyle, food, services; punchy = drinks, sport, music, youth, retail promos). Choose `signatureTransition` to match: calm → iris/fade/cover, balanced → iris/cover/push, punchy → cut/wipe/flash.
- `voice`: 3 tone adjectives, `maxWordsPerCard` (3–5), `case`, default `cta`.
- `rules.do/dont`: copy any hard rules from the guide (logo clear space, forbidden pairings).

## 5. Verify
1. Validate that the JSON parses and that every template key is present (no `<...>` placeholders left).
2. Render a swatch test with any storyboard (from the brand-motion folder):
   ```bash
   node scripts/build.mjs --brand brand/<slug>.json --story storyboards/kinetic-type.json --out out/<slug>-test.html
   node scripts/render.mjs out/<slug>-test.html --sheet 12
   ```
3. Look at the sheet. Confirm the fonts loaded, the logo reads on its backgrounds, and no text is illegible.
4. Show the user a compact summary: role → hex table, fonts, logo, energy. List every assumption so they can correct it.
