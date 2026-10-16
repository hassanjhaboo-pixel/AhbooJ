# SEV, AREA 47's mascot ("Too clean.")

Head of security: an alien in a black durag with glowing antennae, heavy-lidded stare, iced grill, Cuban link chain with a
UFO pendant, black hoodie with the 47 patch, blue microfiber towel, and a small "47" under the eye. An original character; the
street energy is a vibe, not any real person's likeness. No weapons.

## v2 (current): built from the owner's generated art
- Art: `brand/assets/area47/sev/` → `hero`, `face-{smirk,wink,side,hype,chill,laugh,flat,shocked,proud}`, `pose-{point,keys,47}`
  (waist-up), `turn-{front,34,side,back}`. Cut with `cut-art.py` (flood-fill keying) + `keep-main.py` (drops neighbour fragments).
- Kit: `kits/area47-sev.mjs` → `sev({ x, y, h, art: [[t, name, h?], …] })`, bottom-centre anchored, pose-to-pose with a squash bump on each swap.
- `make.mjs` → `intro.json` (beamed down, 47 hands → key flex → point → wink "Too clean.") and `sheet.json` (hero + 9 expressions).

**Trademark note:** the generated full-body art has Nike-swoosh sneakers. The kit only uses waist-up crops. To use full-body poses
in ads, regenerate with: *"same character, plain unbranded white-and-cyan high-top sneakers with no logos or swooshes"*.

## v1 (fallback)
Hand-drawn layered SVG version (`brand/assets/area47/mascot/`, `kits/area47-mascot.mjs`). It can lip-sync and nod by layer, but the art is simpler.

Image-generator prompts: `IMAGE-PROMPTS.md`.
