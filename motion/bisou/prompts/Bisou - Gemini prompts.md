# Bisou: Gemini prompt pack (new breakfast menu)

## How to use this
1. **Copy a whole grey box** with the copy button. The style block is already inside each one.
2. **Attach the file** named next to the prompt before you send it. The `ref_*.jpg` files are their own Instagram photos, in `motion/bisou/sources/` (or just screenshot the post again).
3. **Start a new chat for each dish**, then go down its list in order.
4. **Pick the best image model** in Gemini (the "Pro" one if it's offered).
5. **Download at full size** and **rename** each result to the file name shown.
6. **Check it against their photo.** It must be *their* dish: same plate, same food, same garnish in the same places. If Gemini adds, moves or "improves" anything, reply in the same chat:
   `Match the attached photo exactly. Do not add, remove or rearrange any food. Regenerate.`
7. **If a close-up drifts** (the angle changes or food moves), reply in the same chat:
   `Keep everything identical to the attached image except how close the camera is. Regenerate.`
8. **Send them to me** as you finish each dish.

**Why a teal backdrop and not the placemat:** I cut each plate out and lay all five on one continuous placemat, so the camera can glide across the table in a single take. The flat teal makes the cut clean.

**Why the close-ups must match:** while the camera pushes in, I lay each close-up exactly over the one before it. If anything moves, it smears.

---
# Part A: the table

### A1. Placemat
Save as `placemat.png` · Attach: **ref_benedict.jpg**

```
Photorealistic overhead texture photograph, maximum resolution. No plates, no food, no people, no text, no watermark.

The woven placemat from the attached photo, shot from directly above, filling the whole frame edge to edge: the same tan and beige woven grid, the same fine pattern, the same soft daylight, with gentle even lighting and no vignette. Only the placemat, nothing on it. Portrait, aspect ratio 9:16.
```

---
# Part B: the five dishes

Every dish gets three images in one chat: the full plate, then two steps closer.

## 1. Chicken benedict (red plate)
Start a new chat.

### 1a. Full plate
Save as `benedict_hero.png` · Attach: **ref_benedict.jpg**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, no app icons. Maximum resolution.

Recreate the dish in the attached photo exactly as it is, with nothing added, removed or rearranged: the round red plate, the crispy fried chicken on toast with spinach, the poached egg with hollandaise sauce, the microgreens on top, and the sauce on the plate. Show the whole plate centred with generous space around it, on a flat seamless deep teal backdrop (#2F5D62) instead of the placemat, with a soft shadow under the plate only. Square, aspect ratio 1:1.
```

### 1b. Closer
Save as `benedict_z2.png` · Attach: **benedict_hero.png**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, no app icons. Maximum resolution.

Keep the camera angle, the lighting, the plate and every piece of food exactly the same as the attached image. Only lower the camera straight down towards the centre of the plate, keeping the centre of the food in the centre of the frame. The food now fills most of the frame and the rim of the plate is just cut off. Square 1:1.
```

### 1c. Closest
Save as `benedict_z3.png` · Attach: **benedict_z2.png**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, no app icons. Maximum resolution.

Keep the camera angle, the lighting, the plate and every piece of food exactly the same as the attached image. Only lower the camera straight down towards the centre of the plate, keeping the same point centred. An extreme close-up: the poached egg, the glossy hollandaise and the microgreens fill the frame, with the crisp chicken coating at the edges. Square 1:1.
```

## 2. Eggs in tomato sauce with toast
Start a new chat. Run 2a, then 2b and 2c using the same two "Closer" and "Closest" prompts as dish 1, with these swaps:
- 2b attaches `shakshuka_hero.png`, save as `shakshuka_z2.png`
- 2c attaches `shakshuka_z2.png`, save as `shakshuka_z3.png`, and replace the extreme close-up sentence with:
  `An extreme close-up of the terracotta bowl: the egg yolk, the red tomato sauce, the crumbled white cheese, the pink pickled onion and the microgreens fill the frame.`

### 2a. Full plate
Save as `shakshuka_hero.png` · Attach: **ref_shakshuka.jpg**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, no app icons. Maximum resolution.

Recreate the dish in the attached photo exactly as it is, with nothing added, removed or rearranged: the round white plate, the terracotta bowl of eggs baked in red tomato sauce with crumbled white cheese, pickled pink onion and microgreens, the folded white napkin under the bowl, and the three triangles of golden toast fanned around it. Show the whole plate centred with generous space around it, on a flat seamless deep teal backdrop (#2F5D62) instead of the placemat, with a soft shadow under the plate only. Square, aspect ratio 1:1.
```

## 3. Crispy potato cake with egg and green sauce
Start a new chat. Run 3a, then 3b and 3c with the dish 1 prompts:
- 3b attaches `rosti_hero.png`, save as `rosti_z2.png`
- 3c attaches `rosti_z2.png`, save as `rosti_z3.png`, extreme close-up sentence:
  `An extreme close-up of the top: the soft egg, the pale green herb sauce, the drizzle of red chilli oil and the fresh herbs fill the frame, with the crisp golden edge at the sides.`

### 3a. Full plate
Save as `rosti_hero.png` · Attach: **ref_rosti.jpg**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, no app icons. Maximum resolution.

Recreate the dish in the attached photo exactly as it is, with nothing added, removed or rearranged: the wide white bowl-plate, the round crispy golden potato cake in the centre, topped with a soft egg, a pale green herb sauce, a drizzle of red chilli oil and a pile of fresh green herbs. Show the whole plate centred with generous space around it, on a flat seamless deep teal backdrop (#2F5D62) instead of the placemat, with a soft shadow under the plate only. Square, aspect ratio 1:1.
```

## 4. Scrambled eggs with chilli crisp and toast
Start a new chat. Run 4a, then 4b and 4c with the dish 1 prompts:
- 4b attaches `scramble_hero.png`, save as `scramble_z2.png`
- 4c attaches `scramble_z2.png`, save as `scramble_z3.png`, extreme close-up sentence:
  `An extreme close-up of the soft yellow scrambled eggs with the dark chilli crisp and the green spring onion, the edge of the toast at the top of the frame.`

### 4a. Full plate
Save as `scramble_hero.png` · Attach: **ref_scramble.jpg**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no cutlery, no text, no watermark, no app icons. Maximum resolution.

Recreate the dish in the attached photo exactly as it is, with nothing added, removed or rearranged: the round white plate, the four triangles of dark golden toast fanned across the top, the soft yellow scrambled eggs topped with dark chilli crisp and long green spring onion, and the red sauce swoosh beside them. Show the whole plate centred with generous space around it, on a flat seamless deep teal backdrop (#2F5D62) instead of the placemat, with a soft shadow under the plate only. Square, aspect ratio 1:1.
```

## 5. Pancakes with fruit (this one also gets eaten at the end)
Start a new chat. Run 5a, then 5b and 5c with the dish 1 prompts:
- 5b attaches `pancake_hero.png`, save as `pancake_z2.png`
- 5c attaches `pancake_z2.png`, save as `pancake_z3.png`, extreme close-up sentence:
  `An extreme close-up of the scoop of cream melting on the golden pancake, with the dusting of powdered sugar, the strawberry at the top edge of the frame.`

Then two more in the same chat:

### 5d. Half eaten
Save as `pancake_eaten1.png` · Attach: **pancake_hero.png**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no text, no watermark, no app icons. Maximum resolution.

Exactly the same plate, camera, light and backdrop as the attached image, but the meal is half eaten: half the pancake is gone with a cut edge, the cream is smeared, one apple slice and the strawberry are gone, the syrup cup is half empty, and a few crumbs and syrup drips are on the plate. Nothing else changes. Square 1:1.
```

### 5e. Finished, fork left on the plate
Save as `pancake_eaten2.png` · Attach: **pancake_eaten1.png**

```
Premium commercial food photography for a bistro. Photorealistic, shot from directly above (flat lay, camera pointing straight down), soft natural daylight from the upper left, crisp, high detail, true colours. No hands, no people, no text, no watermark, no app icons. Maximum resolution.

Exactly the same plate, camera, light and backdrop as the attached image, but the meal is finished: only crumbs, a smear of cream, syrup streaks, the empty syrup cup and a kiwi skin are left, and a silver fork lies diagonally across the plate. Nothing else changes. Square 1:1.
```

---
# Done when you have
`placemat.png` and, for each of `benedict`, `shakshuka`, `rosti`, `scramble`, `pancake`: `_hero`, `_z2`, `_z3`. Plus `pancake_eaten1.png` and `pancake_eaten2.png`. That's 18 images.
