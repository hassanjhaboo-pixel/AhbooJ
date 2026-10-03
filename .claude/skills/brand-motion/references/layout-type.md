# Layout, spacing, type and colour roles

All positions are **fractions of the frame** (`x: 0.5, y: 0.5` = centre). Sizes for shapes and type are fractions of the **short side** (`U`). Widths of rects, images and text `maxWidth` are fractions of the frame **width**. Use `wUnit: "U"` on hero images/pills so they keep their size when switching between vertical and horizontal. This means a storyboard survives format changes. Always re-check with a contact sheet.

## Frame zones (vertical 1080×1920)
```
y 0.00 ┌──────────────────────┐
       │  safe margin (8%U)   │
y 0.10 │  HEADLINE ZONE       │  ← support copy, parked logo (0.12–0.26)
y 0.30 │                      │
       │     HERO ZONE        │  ← product / big disc / room (0.35–0.70), centre y≈0.5
y 0.70 │                      │
y 0.75 │  CAPTION / CHIP ZONE │  ← tagline chips, labels (0.76–0.88)
y 0.90 │  URL / legal         │  ← caption role only (≈0.9)
y 1.00 └──────────────────────┘
```
- Horizontal (1920×1080): hero centre x≈0.5 or split 0.3 / 0.7; headline y≈0.18; caption y≈0.85.
- Square / 4:5: compress the zones proportionally. Hero ≈ 0.5, headline ≈ 0.14, caption ≈ 0.86.
- **Platform UI:** on Reels/TikTok, keep key copy out of the bottom 0.15 and right 0.12 (buttons and captions overlay there).

## Spacing rules (from the references)
- **Safe margin:** `brand.layout.safe` (default 0.08 × short side) on every edge for text and logo.
- **Headline ↔ hero gap:** ≥ 0.06 of frame height.
- **Stacked text lines:** use `\n` inside one element (line-height from the brand) rather than separate elements, unless they enter separately.
- **Pairs and trios** (variants, grid): equal gutters. Use x positions 0.2 / 0.5 / 0.8 for a trio and 0.25 / 0.75 for a pair.
- **Grids** (Fresco): disc diameter d, gutter ≈ 0.3d–0.6d. Rows step ≈ 1.6–1.8 × radius in y (vertical frame).
- **Logo end card:** logo width 0.45–0.6 of frame width at y≈0.44–0.46; tagline 0.08–0.1 below it; URL at y≈0.9. Respect `logo.clearSpace`.

## Type
| Role | Default size (× short side) | Use |
|---|---|---|
| `display` | 0.14 | Hooks, claims, one-word cyclers, price. 1–3 words. |
| `headline` | 0.09 | Main support lines. 2–4 words. |
| `title` | 0.065 | Labels inside shapes, end-card tagline. |
| `body` | 0.042 | Rare. One short line max. |
| `caption` | 0.03 | URL, legal, qualifiers ("per month"). |

- Override per element with `size` (fraction of U). Long words: lower `size` before raising `maxWidth` above 0.86.
- Case comes from `brand.type.<face>.case`. Override per element with `case`.
- Tracking: display -0.01 to -0.03 (tight); spaced-caps labels +0.2 to +0.35 (like IKEA "TOGETHER").
- Never more than **two type roles per scene** (plus caption).

## Colour roles: how to use them
| Role | Use | Don't |
|---|---|---|
| `bg` | End cards, breathers, product-on-light scenes | Don't use for 3+ consecutive scenes in punchy edits |
| `ink` | Text/lines on `bg` and light chapters | — |
| `primary` / `onPrimary` | Hook scene, claim scene, the brand's "home" colour | Don't put `primary` text on `accent` |
| `secondary` / `onSecondary` | Variant/feature scenes, second chapter | — |
| `accent` / `onAccent` | ONE focal spot per scene: heart, grid dot, price chip, wipe band | Never a full background for more than a flash |
| `dark` / `onDark` | Kinetic-type openers, borders, ground-plane tints (with `opacity`) | — |
| `chapter1..4` | Rotating stage colours (Fresco/IKEA) | Don't use more than 4 chapter colours in one film |

**The 60/30/10 split per scene:** about 60% background role, 30% hero/support, 10% accent.

## Shape language (`brand.shape.language`)
| Language | Elements | Reference |
|---|---|---|
| circles | `circle`, `semicircle`, `ring`, `dots` | Fresco, Spotify logo, Red Bull dots |
| rounded | `pill`, `rect` with `radius` 0.02–0.05 | IKEA objects, chips |
| sharp | `rect` radius 0, `segbar` | Bars, blocks, editorial |
| organic | `path` (smooth), `dots: drift`, `semicircle` blobs | Fresco line, Red Bull arcs |

Keep backgrounds simple: at most **3 decorative shapes** per scene, plus one dot field.
