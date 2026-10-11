# Round The Clock Transport: "We make sure it gets there"

A 34-second motion graphic (120 bpm, 17 bars) built from the owner's flyer and van photos, in two formats:
9:16 (Reels, TikTok, WhatsApp Status) and 1:1 (feed posts).

## Beat sheet

| # | Time | Scene | What happens |
|---|---|---|---|
| 1 | 0–2s | Hook | A gold clock draws itself on, hands racing. "NEED IT MOVED?" Clock ticks build into the drop. |
| 2 | 2–5s | Brand | Wipe to the real van with a slow push-in. *Round the Clock* / TRANSPORT / Trusted · On time · Nationwide |
| 3 | 5–8s | 01 / 03 | Sunset photo. *Trusted &* RELIABLE DRIVERS |
| 4 | 8–11s | 02 / 03 | The clock returns on blue. The minute hand spins 3 times and lands on 12, then a check badge pops. *Always* ON TIME |
| 5 | 11–15s | 03 / 03 | A map of Trinidad. A gold road draws Point Fortin → San Fernando → Chaguanas → Port of Spain → Arima → Sangre Grande → Mayaro, with the van driving it. Each town pops as the van arrives. NATIONWIDE |
| 6 | 15–23s | Why choose us? | A card stack (shopping illustration, rear-cargo photo, side-door photo, fragile-parcel illustration) builds a 4-item checklist, one item every 2s. A small van drives along the bottom. |
| 7 | 23–26s | Offer | Music drop. A "Seasonal Deals" starburst over gold. BOOK WITH US NOW, then "to receive seasonal specials and discounts" |
| 8 | 26–30s | Promise | *"Your best choice this season."* The van drives in and stops just as WE MAKE SURE IT GETS THERE. lands |
| 9 | 30–34s | End card | Flash, then the clock emblem, ROUND THE CLOCK *Transport*, +1 (868) 329-5373, the email address and a "Book with us now" button. Held for 4s. |

## Copy edits from the flyer (grammar only)
- "Trusted Reliable Drivers" → "Trusted & reliable drivers"
- "Nation Wide Transport" → "Nationwide"
- "Book With Us Now To Receive Seasonal Specials And Discounts" → "Book with us now / to receive seasonal specials and discounts"
- "Best For holiday shopping" → "Best for holiday shopping" (and sentence case across the list)
- "Your Best Choice This Season We Make Sure It Gets There" → *"Your best choice this season."* / "We make sure it gets there."
- Email set in lowercase: roundtheclocktransport@gmail.com

## Notes
- The licence plate is blurred in `assets/van-front.jpg`, the same as on the flyer.
- Fonts (all OFL): Big Shoulders (display), Outfit (headline/body) and Instrument Serif Italic (the gold script accent, matching the flyer).
- Soundtrack (`score.mjs`): an original synthesized soca/calypso groove with a steelpan lead and an "iron" rhythm, mixed with the timeline's SFX. It is royalty-free by construction.
- The map is a simplified outline of Trinidad. Tobago isn't shown.

## Rebuild
```bash
cd .claude/skills/brand-motion/projects/roundtheclock-transport
node make.mjs                                   # storyboards for both formats
node score.mjs                                  # out/score.wav
node ../../scripts/audio.mjs --story storyboard-9x16.json --out out/sfx.wav --bed none --lufs -21
ffmpeg -y -i out/score.wav -i out/sfx.wav -filter_complex "[0][1]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 44100 -c:a pcm_s16le out/rtc-mix.wav
for f in 9x16 1x1; do
  node ../../scripts/build.mjs --brand ../../brand/roundtheclock.json --story storyboard-$f.json --out out/rtc-$f.html
  node ../../scripts/render.mjs out/rtc-$f.html --audio out/rtc-mix.wav --blur 3
done
```
