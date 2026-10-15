# Round The Clock Transport: "We make sure it gets there"

A 35-second motion graphic built from the owner's flyer and van photos, cut to **"Ikation" by Kraff Gad** (a clip the owner supplied),
in two formats: 9:16 (Reels, TikTok, WhatsApp Status) and 1:1 (feed posts).

## Cut to the song
The clip was analysed with ffmpeg + numpy (spectral flux and a low-band kick detector): **103 bpm, 2.330s bars, first downbeat 1.345s,
beat drop at 8.336s** (the kick comes in). Every scene starts on a downbeat. Measured against the final mix, cuts are within 16 ms of
the kick (under half a frame), except 24.6s, where the bar has a syncopated kick.

| Time | Scene | Sync |
|---|---|---|
| 0–3.7s | Hook | "NEED IT MOVED?" pops on the 0.48s hit; the clock punches on the 2.52s hit |
| 3.7–8.3s | Brand (2 bars) | TRANSPORT slams in on the 5.13s hit; the camera creeps in to build tension |
| **8.3s** | **DROP** → 01 Trusted | White flash and punch-in exactly on the drop |
| 10.7s | 02 On time | The minute hand races 3 turns and the check pops on beat 3 |
| 13.0–17.7s | 03 Nationwide (2 bars) | The route draws from beat 2 |
| 17.7–24.6s | Why choose us? (3 bars) | A new card and checklist item every 2.5 beats |
| 24.6s | Offer (1 bar) | |
| 27.0–31.6s | Promise (2 bars) | The van parks and WE MAKE SURE IT GETS THERE. lands on beat 4 |
| 31.6–35.4s | End card | Flash on the downbeat; the music fades over the last 1.6s |

To give the end card a full hold, the soundtrack repeats bars 10–11 of the clip (24.647–29.307s) once at 29.307s, a clean bar-line splice
(`mix-song.sh`). The song file isn't committed (copyright). To rebuild, run `./mix-song.sh <your-copy.mp3>`.

**Posting:** a commercial song baked into the file may be muted on Instagram/TikTok business accounts. `rtc-song-9x16-nomusic.mp4`
has the same edit with only the light SFX. Post that, then add "Ikation" from the app's music library, starting at the song's intro,
so the drop lands on the flash at 8.3s.

The original 120 bpm steelpan version (`score.mjs`) is in git history at commit a65e913.

## Beat sheet (scene content)

| # | Time | Scene | What happens |
|---|---|---|---|
| 1 | 0–3.7s | Hook | A gold clock draws itself on, hands racing. "NEED IT MOVED?" Clock ticks build into the drop. |
| 2 | 2–5s | Brand | Wipe to the real van with a slow push-in. *Round the Clock* / TRANSPORT / Trusted · On time · Nationwide |
| 3 | 5–8s | 01 / 03 | Sunset photo. *Trusted &* RELIABLE DRIVERS |
| 4 | 8–11s | 02 / 03 | The clock returns on blue. The minute hand spins 3 times and lands on 12, then a check badge pops. *Always* ON TIME |
| 5 | 11–15s | 03 / 03 | A map of Trinidad. A gold road draws Point Fortin → San Fernando → Chaguanas → Port of Spain → Arima → Sangre Grande → Mayaro, with the van driving it. Each town pops as the van arrives. NATIONWIDE |
| 6 | 15–23s | Why choose us? | A card stack (shopping illustration, rear-cargo photo, side-door photo, fragile-parcel illustration) builds a 4-item checklist, one item every 2s. A small van drives along the bottom. |
| 7 | 23–26s | Offer | Music drop. A "Seasonal Deals" starburst over gold. BOOK WITH US NOW, then "to receive seasonal specials and discounts" |
| 8 | 26–30s | Promise | *"Your best choice this season."* The van drives in and stops just as WE MAKE SURE IT GETS THERE. lands |
| 9 | 30–34s | End card | Flash, then the clock emblem, ROUND THE CLOCK *Transport*, +1 (868) 329-5373, the Instagram handle @a47.detailing (with a drawn Instagram glyph) and a "Book with us now" button. Held for 4s. |

## Copy edits from the flyer (grammar only)
- "Trusted Reliable Drivers" → "Trusted & reliable drivers"
- "Nation Wide Transport" → "Nationwide"
- "Book With Us Now To Receive Seasonal Specials And Discounts" → "Book with us now / to receive seasonal specials and discounts"
- "Best For holiday shopping" → "Best for holiday shopping" (and sentence case across the list)
- "Your Best Choice This Season We Make Sure It Gets There" → *"Your best choice this season."* / "We make sure it gets there."
- The flyer's email is replaced on the end card by the Instagram handle @a47.detailing (owner's request)

## Notes
- The licence plate is blurred in `assets/van-front.jpg`, the same as on the flyer.
- Fonts (all OFL): Big Shoulders (display), Outfit (headline/body) and Instrument Serif Italic (the gold script accent, matching the flyer).
- `score.mjs` (previous version): an original synthesized soca/steelpan score for the 120 bpm cut. It is royalty-free and kept as a fallback if the song can't be used; the storyboards need the old timings from git history to match it.
- The map is a simplified outline of Trinidad. Tobago isn't shown.

## Rebuild
```bash
cd .claude/skills/brand-motion/projects/roundtheclock-transport
node make.mjs                                   # storyboards for both formats (timed to the song's beat grid)
./mix-song.sh /path/to/ikation-clip.mp3         # out/rtc-song-mix.wav (spliced, faded, SFX, -14 LUFS)
for f in 9x16 1x1; do
  node ../../scripts/build.mjs --brand ../../brand/roundtheclock.json --story storyboard-$f.json --out out/rtc-song-$f.html
  node ../../scripts/render.mjs out/rtc-song-$f.html --audio out/rtc-song-mix.wav --blur 3
done
```
