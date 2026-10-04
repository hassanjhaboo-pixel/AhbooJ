# Design System: Jadesserts

> A little box of sweet surprises
> Generated from `jadesserts.json` by brand-kit. Colour and type are referenced by ROLE everywhere (storyboards, CSS, components).

## 1. Visual Theme & Atmosphere
Personality: **cutesy, whimsical, affectionate, generous** (archetype: The Caregiver with a playful streak).
Shape language: **circles** — signature motif: heart bullets + pastel confetti (circles, sparkles, hearts); a 4-segment pastel bar that stands for the 4 items in the box.
Motion energy: **balanced**, signature transition **wipe**.
Imagery: Bright, soft, high-key food photography on cream or pastel backgrounds; treats cut out cleanly and shown whole, never cropped mid-bite. Illustrations are rounded, pastel and toy-like..

## 2. Color Palette & Roles
| Role | Hex | Name | Text on it | Contrast |
|---|---|---|---|---|
| `bg` | #fef9f6 | Vanilla Cream | `ink` | 11.83 (AAA) |
| `ink` | #4a2c33 | Cocoa | `bg` | 11.83 (AAA) |
| `primary` | #f4636f | Cherry Coral | `onPrimary` | 3.06 (AA Large) |
| `onPrimary` | #ffffff |  | `ink` | 12.36 (AAA) |
| `secondary` | #c9b3ea | Lilac Frosting | `onSecondary` | 6.54 (AA) |
| `onSecondary` | #4a2c33 |  | `bg` | 11.83 (AAA) |
| `accent` | #ffab55 | Peach Glaze | `onAccent` | 6.60 (AA) |
| `onAccent` | #4a2c33 |  | `bg` | 11.83 (AAA) |
| `dark` | #4a2c33 | Cocoa | `onDark` | 11.83 (AAA) |
| `onDark` | #fef9f6 |  | `ink` | 11.83 (AAA) |
| `chapter1` | #ffe4e8 | Strawberry Milk | `ink` | 10.31 (AAA) |
| `chapter2` | #e3d5f7 | Lavender Cream | `ink` | 8.90 (AAA) |
| `chapter3` | #d9f0e2 | Pistachio | `ink` | 10.31 (AAA) |
| `chapter4` | #ffdcb0 | Apricot | `ink` | 9.48 (AAA) |
| `blush` | #ffc7cf |  | `ink` | 8.43 (AAA) |
| `blushDeep` | #ffa3ae |  | `ink` | 6.53 (AA) |
| `primaryDeep` | #dd4652 |  | `bg` | 3.96 (AA Large) |
| `mint` | #7fd2a2 |  | `ink` | 6.85 (AA) |
| `lavender` | #a687d9 |  | `ink` | 4.17 (AA Large) |
| `white` | #ffffff |  | `ink` | 12.36 (AAA) |
| `toyYellow` | #ffcd3c |  | `ink` | 8.27 (AAA) |
| `bone` | #f3ecdc |  | `ink` | 10.50 (AAA) |
| `wood` | #b07a4a |  | `bg` | 3.51 (AA Large) |
| `cardboard` | #e8c79a |  | `ink` | 7.69 (AAA) |
| `glass` | #d6eef8 |  | `ink` | 10.27 (AAA) |

Usage ratio: bg 55% · primary 20% · chapter1 12% · secondary 8% · accent 5%.

## 3. Typography Rules
| Role | Family | Weight | Case | Tracking | Line height | Size @1080 |
|---|---|---|---|---|---|---|
| display | Baloo 2 | 800 | none | -0.01 | 0.98 | 151px |
| headline | Baloo 2 | 700 | none | 0 | 1.02 | 97px |
| body | Quicksand | 700 | none | 0.01 | 1.25 | 45px |
| title | (headline face) | | | | | 70px |
| caption | (body face) | | | | | 32px |

Copy: at most **6 words per card** in motion, set in **sentence** case. Default CTA: “Order your sweet box”.

## 4. Component Stylings
- **Buttons / CTA chips**: `primary` fill, `onPrimary` label, radius 38px@1080 (pill when shape language is rounded/circles).
- **Cards**: `bg` fill, `ink` text, soft radius, tinted shadow (never pure black).
- **Highlights / badges**: `accent` sparingly — price, a single word, a sticker.
- **Logo lock-up**: clear space 0.5× logo height on every side; minimum 120px on screen.

## 5. Spacing & Layout
- Safe area: 8% of the short side on every edge (vertical video: keep the bottom 19% and the right 12% clear of text for platform UI).
- Alignment: center. Base spacing unit 8px; spacing scale 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96.

## 6. Motion
| Token | Value |
|---|---|
| duration-instant | 100ms |
| duration-fast | 160ms |
| duration-base | 300ms |
| duration-slow | 500ms |
| duration-slower | 750ms |
| ease-enter | `cubic-bezier(0.34, 1.56, 0.64, 1)` (outBack) |
| ease-exit | `cubic-bezier(0.32, 0, 0.67, 0)` (inCubic) |
| ease-move | `cubic-bezier(0.65, 0, 0.35, 1)` (inOutCubic) |
| ease-emphasis | `cubic-bezier(0.34, 1.56, 0.64, 1)` (outBack) |
| ease-loop | `cubic-bezier(0, 0, 1, 1)` (linear) |
| stagger | 70ms |

Entrances use `ease-enter`, exits use `ease-exit` and are one step shorter, on-screen moves use `ease-move`, loops are linear. One hero motion per scene.

## 7. Usage Guardrails
- ✅ Warm cream is the default background; stage colours are pastels (pink, lavender, mint, peach)
- ✅ Use heart glyphs as the list bullet and confetti shapes for texture
- ✅ Everything rounded; soft, bouncy motion (overshoot) rather than mechanical
- ✅ Price is its own oversized callout
- ❌ No stark white or grey backgrounds, no black shadows (tint shadows plum/pink)
- ❌ Never put white small text on the coral primary (3.1:1) — display sizes only
- ❌ No more than one saturated coral block per scene
- ❌ Never distort, recolour or rotate the logo; never place it inside the safe-area margin.
- ❌ No pure-black shadows on tinted backgrounds; tint shadows with `ink`.
