import sys
STYLE = ("Premium commercial beverage photography for a specialty coffee shop. Photorealistic, full-frame camera, 85mm lens, "
         "one soft warm key light from the upper left, a gentle rim light from behind. Crisp, high detail, real condensation droplets. "
         "The cup is a clear 16 oz plastic iced-coffee cup with a flat clear lid and a straight paper straw, no logo, no label. "
         "No hands, no people, no text, no watermark. Maximum resolution.")
SCENE = "Photorealistic, maximum resolution. No people, no text, no watermark."
LOCK = ("Keep the camera height, the camera angle, the lighting, the backdrop, the drink and the straw position exactly the same as the attached image. "
        "Only move the camera straight forward, closer to the cup, keeping the top of the cup centred.")
out = []; P = out.append; n = [0]
def block(title, fname, attach, text, style=STYLE):
    n[0] += 1
    P(f"\n### {n[0]}. {title}\nSave as `{fname}` · Attach: **{attach}**\n\n```\n{style}\n\n{text}\n```\n")
def drink(line, key, label, sheet, pos, desc, topping, back_desc, have_hero=False, skip=()):
    P(f"\n## {label}\n" + ("You already have the hero and the first close-up. In a new chat, do only these three. Use the hero and close-up you already made as the attachments.\n" if have_hero else "Start a new chat for this drink. Run the prompts in order. Each one after the first attaches the image the step before it made.\n"))
    if not have_hero:
        block(f"{label}: hero", f"{key}_hero.png", f"your {line} cups image",
              f"Recreate only the {pos} cup from the attached image, exactly as it is: {desc}. Show it alone, centred, eye-level straight-on, the whole cup and straw in frame with generous space around it. {sheet}, a soft shadow under the cup only. Portrait, aspect ratio 2:3.")
    if 'z2' not in skip:
        block(f"{label}: closer", f"{key}_z2.png", f"{key}_hero.png",
              f"{LOCK} The frame now runs from the middle of the cup up to the top of the straw. Portrait 2:3.")
    block(f"{label}: closer again", f"{key}_z3.png", f"{key}_z2.png (the first close-up you already made)" if 'z2' in skip else f"{key}_z2.png",
          f"{LOCK} The frame now shows the top third of the cup: the rim and {topping} fill the frame, the straw in the same place, leaning the same way. Portrait 2:3.")
    block(f"{label}: closest", f"{key}_z4.png", f"{key}_z3.png",
          f"{LOCK} An extreme close-up of {topping} and the condensation on the plastic just below the rim, the straw at the edge of the frame in the same place. Portrait 2:3.")
    block(f"{label}: back view", f"{key}_back.png", f"{key}_hero.png",
          f"The same cup, drink, light, backdrop and framing as the attached image, but the cup has been turned half a turn on the spot so we see its back: {back_desc}. Same size, same position in the frame, same camera height. Portrait 2:3.")
P("# Kafneo: every prompt still needed (Gemini AI Plus)\n")
P("""## How to use this
1. **Copy a whole grey box** with the copy button. The style block is already inside every one, so it's the only thing you paste.
2. **Attach the file** named next to each prompt before you send it.
3. **Start a new chat for each drink**, then go down its list in order.
4. **Pick the best image model** in Gemini (the "Pro" one if it's offered).
5. **Download each result** with the download button at full size, and **rename it** to the file name shown.
6. **If anything drifts** (a different cup shape, the straw moves, the angle changes), reply in the same chat:
   `Keep everything identical to the attached image except how close the camera is. Regenerate.`
   Attach the image it should match.
7. **Send them to me** as you finish each drink.

**Why the close-ups must match:** I lay each close-up exactly over the one before it while the camera pushes in. If the angle or straw moves, it smears, and I can't use it. That's why every close-up prompt now locks them.
""")
P("\n---\n# Part 1: finish the coquito line\n")
GREEN = "Flat seamless deep palm-green backdrop (#2E5A4C)"
drink("coquito", "coq_latte", "Iced Coquito Latte", GREEN, "left",
      "iced latte, soft ivory coconut-coquito milk with espresso swirling down from the top, big clear ice cubes, grated nutmeg and cinnamon dusted on the ice, the same straw angle",
      "the ice cubes, the nutmeg and cinnamon dusting and the espresso swirl", "the espresso swirl from the other side, the straw now leaning the other way")
drink("coquito", "coq_coldbrew", "Coquito Cold Brew", GREEN, "middle", "", "the ivory coconut foam and the toasted coconut flakes",
      "the foam and toasted coconut from behind, the straw now leaning the other way", have_hero=True, skip=('z2',))
drink("coquito", "coq_frappe", "Coquito Frappé", GREEN, "right", "", "the whipped cream swirl with its cinnamon and nutmeg",
      "the whipped cream swirl from behind, the straw now leaning the other way", have_hero=True, skip=('z2',))
P("\n---\n# Part 2: the pumpkin line\nAttach your pumpkin cups image (the three cups on cream) for each hero.\n")
CREAM = "Flat seamless warm cream backdrop (#F4E6D0)"
drink("pumpkin", "pmk_latte", "Iced Pumpkin Spice Latte", CREAM, "left",
      "iced latte, pale pumpkin-coloured milk with dark espresso swirling on top, big clear ice cubes, a dusting of cinnamon, the same straw angle",
      "the cinnamon-dusted ice and the espresso swirl", "the espresso swirl from the other side, the straw now leaning the other way")
drink("pumpkin", "pmk_coldbrew", "Pumpkin Cream Cold Brew", CREAM, "middle",
      "dark amber cold brew and ice under a thick layer of pale orange pumpkin cold foam dusted with pumpkin spice, the same straw angle",
      "the orange pumpkin cold foam settling over the ice", "the pumpkin foam from behind, the straw now leaning the other way")
drink("pumpkin", "pmk_chai", "Iced Pumpkin Chai", CREAM, "right",
      "creamy tan chai over ice, a tall swirl of whipped cream dusted with cinnamon, one cinnamon stick resting against the straw, the same straw angle",
      "the whipped cream swirl, the cinnamon and the cinnamon stick", "the whipped cream from behind, the cinnamon stick and straw now on the other side")
P("\n---\n# Part 3: light changing over the scenes\n")
P("\n## Pumpkin world: golden hour to night\nOne new chat. Attach your pumpkin world image (the autumn table at sunset) to the first prompt, then attach each result to the next.\n")
block("Pumpkin world: golden hour", "pmk_world_golden.png", "your pumpkin world image",
      "Recreate the attached scene exactly: the same camera angle, the same rustic wooden table, the same trees and pumpkins, at golden hour as shown. Remove anything from the centre of the table so it is completely empty. Landscape, aspect ratio 3:2.", SCENE)
block("Pumpkin world: blue hour", "pmk_world_blue.png", "pmk_world_golden.png",
      "The exact same scene and framing as the attached image, nothing moved, ten minutes after sunset: blue hour. The sky is deep blue-violet fading to amber at the horizon, the trees are darker, and the table is lit only by soft sky light. The centre of the table stays empty. Landscape 3:2.", SCENE)
block("Pumpkin world: night", "pmk_world_night.png", "pmk_world_blue.png",
      "The exact same scene and framing as the attached image, at night. Warm golden string lights hang between the trees as soft round bokeh, and the table is lit warmly from the left by them. The centre of the table stays empty. Landscape 3:2.", SCENE)
P("\n## Coquito world: dusk (optional)\nOne new chat. Attach your lights-off night image (the dark palms and unlit bulbs).\n")
block("Coquito world: dusk, lights off", "coq_world_dusk.png", "your lights-off night image",
      "The exact same scene and framing as the attached image, with the same table, palms, coconut halves, cinnamon and string of unlit bulbs, but earlier: dusk. The sky is deep teal with the last orange glow low on the horizon, and the bulbs are still switched off. Landscape 16:9.", SCENE)
P("\n---\n# Part 4: your logo on the cups\nOne new chat per drink. Attach that drink's hero image. Do these last, once the heroes are final.\n")
for key, label in [("coq_latte", "Iced Coquito Latte"), ("coq_coldbrew", "Coquito Cold Brew"), ("coq_frappe", "Coquito Frappé"), ("pmk_latte", "Iced Pumpkin Spice Latte"), ("pmk_coldbrew", "Pumpkin Cream Cold Brew"), ("pmk_chai", "Iced Pumpkin Chai")]:
    block(f"{label}: blank sleeve", f"{key}_sleeve.png", f"{key}_hero.png",
          "The exact same cup, drink, light, backdrop and framing as the attached image, now wearing a plain blank kraft-paper cup sleeve around the middle of the cup, completely empty, no print, no logo, no text. Portrait 2:3.")
P("""
---
## Checklist
- **Coquito:** latte (hero, closer, closer again, closest, back) · cold brew (closer again, closest, back) · frappé (closer again, closest, back)
- **Pumpkin:** latte, cold brew and chai (hero, closer, closer again, closest, back for each)
- **Scenes:** pumpkin golden, blue and night · coquito dusk (optional)
- **Sleeves:** all six drinks
- **Plus:** the real drink names and recipes, if they differ from these

**Already done, no need to redo:** ice, drops, the drip, the leaves, props, the lazy Susan, the coquito cups sheet and world, the lights-off night, the cold brew and frappé heroes and first close-ups.
""")
open(sys.argv[1] if len(sys.argv) > 1 else 'prompts.md', 'w').write(''.join(out))
print(n[0], 'prompts')
