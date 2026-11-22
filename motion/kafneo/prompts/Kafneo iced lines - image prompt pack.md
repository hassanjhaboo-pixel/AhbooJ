# Kafneo new iced lines: image prompt pack

What this makes: every image I need to build the cinematic v2 (2.5D camera moves through layered worlds).
Total: 6 drinks, 2 worlds, a set of floating ingredients. Work through the checklist at the bottom.

## How to use this

1. **Paste the STYLE BLOCK at the start of every prompt.** It's what keeps all the images looking like one shoot.
2. **Make drink 1 first, then use it as a reference image** for every other drink ("same cup, same lighting, same angle as the attached image"). Both ChatGPT and Gemini accept a reference image.
3. **Replace the drink names and recipes** below with your real ones before generating. The image should match how the drink is actually made and served.
4. **No text or logos in any image.** AI garbles logos; I add the real Kafneo logo and all text in the animation.
5. **File types and tools:**
   - **Cups and floating ingredients: ChatGPT.** Set Background to *Transparent*, size *1024 × 1536 (portrait)* for cups, *1024 × 1024* for ingredients. Export **PNG**.
   - **Worlds and close-ups: Gemini.** Aspect ratio *9:16*, highest resolution offered. Export **PNG** (or the highest-quality JPG if PNG isn't offered).
   - If you only have one tool: cups and ingredients can also be made in Gemini on a **solid pure white background, with a soft shadow**, and I'll cut them out. Clear cups cut out better from ChatGPT's transparent export, so use ChatGPT for cups if you can.
6. **Name files exactly as listed** (for example `P1_front.png`) and send them all in one zip.

## STYLE BLOCK (paste first, every time)

> Premium commercial beverage photography for a specialty coffee shop. Photorealistic, shot on a full-frame camera with an 85mm lens. One soft warm key light from the upper left, gentle rim light from behind. Rich but natural colour, crisp detail, real condensation droplets on the cup. The cup is a clear 16 oz PET plastic iced-coffee cup with a flat clear lid and a straight paper straw, no logo, no text, no label, no sleeve. No hands, no people, no text, no watermark.

## The cup, from four camera angles

Each drink gets the angles below. Prompt shape (fill in the drink description from the next section):

| Angle | File suffix | Add to the prompt | Tool, size |
|---|---|---|---|
| Front hero | `_front` | "Eye-level straight-on view of the full cup, centred, whole cup and straw in frame with space around it. Transparent background, keep the cup's own reflections and condensation." | ChatGPT, transparent PNG, 1024×1536 |
| Low angle | `_low` | "Low camera angle near table height looking slightly up at the cup so it feels tall and heroic. Whole cup in frame. Transparent background." | ChatGPT, transparent PNG, 1024×1536 |
| Overhead | `_top` | "Directly overhead, looking straight down into the cup with the lid removed, showing the drink's surface, ice and topping clearly. Cup rim fills about 70% of the frame. Transparent background." | ChatGPT, transparent PNG, 1024×1024 |
| Macro | `_macro` | "Extreme macro close-up of the top third of the cup: condensation running down the plastic, ice and the topping in sharp focus, background a soft warm blur. Fill the whole frame." | Gemini, 9:16 PNG |

**Priority:** every drink needs `_front`. Drink 1 of each line also needs `_low`. Any drink with foam or whipped cream needs `_top`. Two `_macro` shots per line is enough (choose the two prettiest drinks).

## The six drinks (replace with your real recipes)

### Pumpkin spice line
- **P1 · Iced Pumpkin Spice Latte:** "Iced latte: pumpkin-spiced milk the colour of pale pumpkin at the bottom, a dark espresso layer swirling on top, large clear ice cubes, a light dusting of cinnamon on the surface."
- **P2 · Pumpkin Cream Cold Brew:** "Dark amber cold brew with large clear ice, topped with a thick layer of pale orange pumpkin cold foam that cascades slightly into the coffee, dusted with pumpkin spice."
- **P3 · Iced Pumpkin Chai:** "Creamy tan spiced chai latte over ice, topped with a tall swirl of whipped cream and a sprinkle of cinnamon, one cinnamon stick resting against the straw."

### Coquito latte line
- **C1 · Iced Coquito Latte:** "Iced latte: creamy coconut-coquito milk (soft ivory) at the bottom, espresso swirling into it from the top, ice cubes, a pinch of grated nutmeg and cinnamon on top."
- **C2 · Coquito Cold Brew:** "Dark cold brew with ice, topped with a thick ivory coconut cream foam and toasted coconut flakes."
- **C3 · Coquito Frappé:** "Blended ivory coquito frappé, thick and frosty, topped with whipped cream, cinnamon and grated nutmeg."

## The two worlds (backgrounds, no cup in them)

Each world is made as **separate layers**, so the camera can move between them. All from **Gemini, 9:16, PNG**. Add to every world prompt: *"Empty scene, no cup, no drink, no people, no text. Leave the centre of the frame clear and the table surface in the lower third, ready for a product to be placed."*

### Pumpkin world: autumn dusk
- `PW_back.png`: "Background plate: a warm autumn dusk, soft golden low sun, out-of-focus orange and red trees, gentle haze, heavy bokeh. Nothing in sharp focus."
- `PW_table.png`: "Mid plate: a rustic warm wooden café table seen at eye level, a few small pumpkins and dried leaves softly blurred at the far edges of the table, golden-hour light raking across the wood."
- `PW_table_top.png`: "Overhead view straight down onto the same rustic wooden table, a few dried autumn leaves and cinnamon sticks scattered near the edges, warm light, centre of the table empty."

### Coquito world: holiday night
- `CW_back.png`: "Background plate: a warm Caribbean holiday night, palm tree silhouettes against a deep teal-green evening sky, strings of warm golden fairy lights out of focus as round bokeh, festive but calm. Nothing in sharp focus."
- `CW_table.png`: "Mid plate: a warm wooden café table at eye level at night, coconut halves and a few cinnamon sticks softly blurred at the far edges, the golden fairy-light bokeh behind."
- `CW_table_top.png`: "Overhead view straight down onto the same table at night, a coconut half and a little grated nutmeg near the edges, warm string-light glow, centre empty."

## Floating ingredients (the foreground and background "life")

These drift past the lens at different depths. **ChatGPT, transparent PNG, 1024 × 1024**, one item per image, centred, whole object in frame, same STYLE BLOCK lighting. (Leave out the cup sentence of the style block for these.)

Pumpkin line:
- `I_leaf_1.png`, `I_leaf_2.png`, `I_leaf_3.png`: "A single autumn maple leaf (vary: orange, deep red, golden), slightly curled, crisp detail."
- `I_cinnamon_1.png`, `I_cinnamon_2.png`: "A single cinnamon stick (vary: one stick, a bundle of two tied with twine)."
- `I_staranise.png`: "A single star anise pod."
- `I_pumpkin.png`: "One small round orange pumpkin with a short green stem."

Coquito line:
- `I_coconut_whole.png`: "One whole brown hairy coconut."
- `I_coconut_half.png`: "One coconut cracked in half, showing the bright white flesh, seen at a three-quarter angle."
- `I_coconut_flakes.png`: "A small loose cluster of toasted coconut flakes."
- `I_nutmeg.png`: "One whole nutmeg seed."

Both lines:
- `I_ice_1.png`, `I_ice_2.png`, `I_ice_3.png`: "One large clear ice cube with frost and a few water droplets (vary the angle)."
- `I_beans.png`: "A small cluster of five roasted coffee beans."
- `I_splash.png`: "A frozen-motion splash of creamy milk, crown shape, isolated." (Transparent background.)

## Optional, nice to have
- `KAFNEO_counter.png` (Gemini, 9:16): "A warm modern café counter at night with string lights and a glass booth softly blurred behind, empty counter in the foreground." Used for the final call-to-action shot. A real phone photo of your counter would be even better.
- A real photo of each finished drink, even rough, so I can check the AI versions match how they're really served.

## Checklist

- [ ] P1: `_front`, `_low`, `_macro` · P2: `_front`, `_top` · P3: `_front`, `_top`, `_macro`
- [ ] C1: `_front`, `_low`, `_macro` · C2: `_front`, `_top` · C3: `_front`, `_top`, `_macro`
- [ ] `PW_back`, `PW_table`, `PW_table_top` · `CW_back`, `CW_table`, `CW_table_top`
- [ ] Ingredients: 3 leaves, 2 cinnamon, star anise, pumpkin, coconut whole, coconut half, flakes, nutmeg, 3 ice, beans, splash
- [ ] Real drink names and recipes confirmed
- [ ] Everything in one zip, file names as above

## Quick quality checks before you send
- Clear cup edges look clean on the transparent PNGs (no white halo). If ChatGPT adds a halo, ask it to "regenerate with a fully transparent background, no white fringe".
- All cups face the same way and look like the same cup. If one drifts, regenerate it with drink 1 attached as the reference.
- Nothing has text, logos or hands in it.
