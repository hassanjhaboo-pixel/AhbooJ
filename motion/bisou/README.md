# Bisou Bistro & Cakery: new menu reel (pitch)

**Purpose:** pitch piece to win Bisou's content contract. Shown to them privately; not posted or run as ads
until they sign off. If it goes public before that, end it with "Spec ad. Not affiliated with Bisou Bistro & Cakery."

- **Client:** Bisou Bistro & Cakery, Trinidad. Instagram @bisoutt. Known for desserts, food and drinks.
- **Subject:** their newly launched menu items.
- **Where:** Instagram Reels + TikTok. 1080x1920 (9:16), rendered at 2x. About 18 to 22s.
- **Ending:** logo builds itself, then "New on the menu" and @bisoutt. Viewer action: visit / DM to order.
- **Template:** `../kafneo/coquito-one-take/coquito.html` (one continuous take, push-in per product, logo build at the end).

## Concept: "The table" (replaces the cake stand idea)
One unbroken overhead take across their woven placemat. Each of the five new breakfast plates slides to centre,
the camera eases in (zoom ladder close-ups) while its name slides up out of a mask, eases back, and glides on in
one direction to the next. The last plate (pancakes) gets eaten to crumbs and a fork, a nod to their own outro.
The placemat darkens to black, the three utensils drop onto the rail and swing to rest, BISOU settles in, then
"New on the breakfast menu" and @bisoutt.

Running order (proposal): benedict (red plate, strongest hook) > shakshuka > Turkish Eggs & Bake > Eggs & Chilli Oil > pancakes.
Names from their poll: Shakshuka, Turkish Eggs & Bake, Eggs & chilli oil, Fried Chicken Eggs Benedict. Pancakes: name not in the poll yet.

## Assets checklist
| File | From | Status |
|---|---|---|
| Logo + outro screen recording | `sources/logo_screenshot.png`, `sources/outro_recording.mp4` | in |
| White mark (utensil rail + BISOU) as vectors | `hi/mark_white.svg`, `hi/mark_parts.json` (rail/utensils, word, letters) via `tools/build_mark.py`, overlay-checked against `sources/outro_mark_crop.png` | done |
| Brown cutting-board script logo as vectors | `sources/logo_screenshot.png` | not needed yet (videos use the white mark) |
| Brand colours + fonts | white, near-black, cutting-board brown, red-stained wood; lettering is Nunito (`fonts/`) | done |
| New breakfast menu photos (their post, 5 dishes) | `sources/ref_*.jpg` | in |
| Per dish: hero + 2 close-ups on teal; pancake eaten x2; placemat | Gemini, `prompts/Bisou - Gemini prompts.md` (18 images) | waiting |
| Real dish names | Bisou's menu / post caption | waiting |

## Their look (from the outro recording)
- Overhead shots on red-stained wood, food on a white square plate.
- Their outro: the plate gets eaten down to crumbs and a fork, then a cut to the white mark on black.
- Two logos: brown cutting-board script logo (profile picture) and the white utensil-rail mark (videos).

## Notes
- Food on screen must be their real items, shown accurately (no invented toppings or items).
- House rules: `/CLAUDE.md` + `.claude/skills/saas-animation/references/motion-bible.md`.
