# Bisou: Gemini prompt pack (part 1)

## How to use this
1. **Copy a whole grey box** with the copy button. The style block is already inside each one.
2. **Attach the file** named next to the prompt before you send it.
3. **Start a new chat for each menu item**, then go down its list in order.
4. **Pick the best image model** in Gemini (the "Pro" one if it's offered).
5. **Download at full size** and **rename** each result to the file name shown.
6. **If anything drifts** (the plate changes, the angle moves, a topping appears or vanishes), reply in the same chat:
   `Keep everything identical to the attached image except how close the camera is. Regenerate.`
   Attach the image it should match.
7. **Send them to me** as you finish each item.

**Not in this pack: the logo.** Don't run the logo through Gemini, because it changes letterforms. Send me screenshots and I'll rebuild it as vectors.

**Why the close-ups must match:** while the camera pushes in, I lay each close-up exactly over the one before it. If the angle moves, it smears.

---
# Part A: the set (you can start these now)

### A1. Cake stand, empty
Save as `stand.png` · Attach: nothing (or a photo of a cake stand in their shop, if you have one)

```
Premium commercial food photography for a dessert bistro. Photorealistic, full-frame camera, 85mm lens, one soft warm key light from the upper left, a gentle rim light from behind. Crisp, high detail. No hands, no people, no text, no watermark. Maximum resolution.

A single empty round footed cake stand in white marble with a thin brushed-gold rim, 30 cm wide. Camera 15 degrees above the stand looking slightly down, so the flat top is visible as a wide oval. Centred, whole stand in frame with generous space around it. Flat seamless deep teal backdrop (#2F5D62), a soft shadow under the foot only. Portrait, aspect ratio 2:3.
```

### A2. The bistro, background plate
Save as `world.png` · Attach: **1 or 2 photos of the inside of Bisou** (from their Instagram)

```
Photorealistic interior photography, maximum resolution. No people, no text, no watermark.

The inside of the bistro in the attached photos, recreated faithfully: same colours, materials, lighting and decor. A view across the dessert counter at warm late afternoon, with the counter top running across the lower third of the frame and nothing standing on it. The background is softly out of focus as if shot at f/2, with warm practical lights glowing. Portrait, aspect ratio 9:16.
```

### A3. The bistro, lights dimmed (for the logo ending)
Save as `world_dim.png` · Attach: **world.png**

```
Photorealistic interior photography, maximum resolution. No people, no text, no watermark.

Exactly the same scene, camera, framing and focus as the attached image. Only the lighting changes: it is now evening, the room is dimmer and warmer, and only the small practical lights are glowing. Nothing moves. Portrait, aspect ratio 9:16.
```

---
# Part B: each new menu item

**Send me the list of new items** (names, plus a screenshot of each from their posts) and I'll write the full prompts for each, like Kafneo's. Until then, here's the pattern so you can see what's coming. Each item gets five images in one chat:

| # | File | What it is |
|---|---|---|
| 1 | `<item>_hero.png` | The item alone on the teal backdrop, recreated from their photo, camera 15 degrees above |
| 2 | `<item>_z2.png` | Same shot, camera moved straight in, top half of the item fills the frame |
| 3 | `<item>_z3.png` | Closer: the texture of the top (glaze, crumb, cream) fills the frame |
| 4 | `<item>_z4.png` | Extreme close-up of the best detail (a drip, a berry, the sheen) |
| 5 | `<item>_back.png` | The same item turned half a turn, so it can visibly rotate on the stand |

Drinks get the same five, with a straight-on camera instead of 15 degrees above.
