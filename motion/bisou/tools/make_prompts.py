"""Writes prompts/Bisou - Gemini prompts.md. Edit DISHES and re-run: python3 tools/make_prompts.py"""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLE = ("Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), "
         "soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, "
         "no app icons. Maximum resolution.")
BACK = ("Show the whole plate centred with generous space around it, on a flat seamless deep teal backdrop (#2F5D62) instead of the placemat, "
        "with a soft shadow under the plate only. Square, aspect ratio 1:1.")
LOCK = ("Keep the camera angle, the lighting, the plate and every piece of food exactly the same as the attached image. "
        "Only lower the camera straight down towards the centre of the plate, keeping the same point centred.")
DISHES = [
    ('benedict', 'Fried Chicken Eggs Benedict',
     'the round red plate, the crispy fried chicken on toast with spinach, the poached egg with hollandaise sauce, the microgreens on top, and the sauce on the plate',
     'the poached egg, the glossy hollandaise and the microgreens fill the frame, with the crisp chicken coating at the edges'),
    ('shakshuka', 'Shakshuka',
     'the round white plate, the terracotta bowl of eggs baked in red tomato sauce with crumbled white cheese, pickled pink onion and microgreens, the folded white napkin under the bowl, and the three triangles of golden toast fanned around it',
     'the egg yolk, the red tomato sauce, the crumbled white cheese, the pink pickled onion and the microgreens in the terracotta bowl fill the frame'),
    ('turkish', 'Turkish Eggs & Bake',
     'the wide white bowl-plate, the round crispy golden bake in the centre, topped with a soft egg, a pale green herb yoghurt sauce, a drizzle of red chilli oil and a pile of fresh green herbs',
     'the soft egg, the pale green herb sauce, the red chilli oil and the fresh herbs fill the frame, with the crisp golden edge of the bake at the sides'),
    ('chilli', 'Eggs & Chilli Oil',
     'the round white plate, the four triangles of dark golden toast fanned across the top, the soft yellow scrambled eggs topped with dark chilli oil and long green spring onion, and the red sauce swoosh beside them',
     'the soft yellow scrambled eggs with the dark chilli oil and the green spring onion fill the frame, the edge of the toast at the top'),
    ('pancake', 'Pancakes',
     'the round white plate, the golden pancake dusted with powdered sugar and topped with a scoop of cream, the small glass cup of red syrup, the apple slices, the kiwi slices and the strawberry',
     'the scoop of cream melting on the golden pancake with the dusting of powdered sugar fills the frame, the strawberry at the top edge'),
]
out = []; P = out.append
def box(num, title, save, attach, text):
    P(f"\n### {num}. {title}\nSave as `{save}` · Attach: **{attach}**\n\n```\n{text}\n```\n")
P("# Bisou: Gemini prompt pack (new breakfast menu)\n")
P("""## How to use this
1. **Copy a whole grey box.** The style is already inside each one.
2. **Attach the file** named above it. `ref_*.jpg` are their Instagram photos (in `motion/bisou/sources/`, or re-screenshot the post).
3. **New chat per dish**, then go down its list in order.
4. **Best image model** in Gemini (the "Pro" one if offered).
5. **Download full size** and **rename** to the file name shown.
6. **Check it against their photo.** If Gemini adds, moves or "improves" anything, reply in the same chat:
   `Match the attached photo exactly. Do not add, remove or rearrange any food. Regenerate.`
7. **If a close-up drifts**, reply in the same chat:
   `Keep everything identical to the attached image except how close the camera is. Regenerate.`
""")
P("\n## The table\n")
box(1, 'Placemat', 'placemat.png', 'ref_benedict.jpg',
    "Photorealistic overhead texture photograph, maximum resolution. No plates, no food, no people, no text, no watermark.\n\n"
    "The woven placemat from the attached photo, shot from directly above, filling the whole frame edge to edge: the same tan and beige woven grid, "
    "the same fine pattern, the same soft daylight, with gentle even lighting and no vignette. Only the placemat, nothing on it. Portrait, aspect ratio 9:16.")
n = 2
for key, name, full, close in DISHES:
    P(f"\n## {name}\nNew chat.\n")
    box(n, f'{name}: full plate', f'{key}_hero.png', f'ref_{key}.jpg',
        f"{STYLE}\n\nRecreate the dish in the attached photo exactly as it is, with nothing added, removed or rearranged: {full}. {BACK}"); n += 1
    box(n, f'{name}: closer', f'{key}_z2.png', f'{key}_hero.png',
        f"{STYLE}\n\n{LOCK} The food now fills most of the frame and the rim of the plate is just cut off. Square 1:1."); n += 1
    box(n, f'{name}: closest', f'{key}_z3.png', f'{key}_z2.png',
        f"{STYLE}\n\n{LOCK} An extreme close-up: {close}. Square 1:1."); n += 1
P("\nPancakes get eaten at the end. Two more in the same pancake chat:\n")
S2 = STYLE.replace("no cutlery, ", "")
box(n, 'Pancakes: half eaten', 'pancake_eaten1.png', 'pancake_hero.png',
    f"{S2}\n\nExactly the same plate, camera, light and backdrop as the attached image, but the meal is half eaten: half the pancake is gone with a cut edge, "
    "the cream is smeared, one apple slice and the strawberry are gone, the syrup cup is half empty, and a few crumbs and syrup drips are on the plate. Nothing else changes. Square 1:1."); n += 1
box(n, 'Pancakes: finished, fork on the plate', 'pancake_eaten2.png', 'pancake_eaten1.png',
    f"{S2}\n\nExactly the same plate, camera, light and backdrop as the attached image, but the meal is finished: only crumbs, a smear of cream, syrup streaks, "
    "the empty syrup cup and a kiwi skin are left, and a silver fork lies diagonally across the plate. Nothing else changes. Square 1:1.")
open(os.path.join(ROOT, 'prompts/Bisou - Gemini prompts.md'), 'w').write(''.join(out))
print(n, 'prompts')
