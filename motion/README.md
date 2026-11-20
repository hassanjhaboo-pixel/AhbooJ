# Motion: code-built video ads

Ads here are made as code and rendered to MP4. Each ad is an HTML canvas page: the animation lives in the page, and a headless browser renders it frame by frame. Image assets come from Gemini (with prompts that keep them consistent) or from real photos. They are then cut out and lined up with the Python tools.

Before starting, read the house rules in `/CLAUDE.md` (the "don't look vibecoded" list) and `.claude/skills/saas-animation/` (its `references/motion-bible.md` is the critique checklist every draft is scored against).

## What's here

| Folder | What it is | Start from it for |
|---|---|---|
| `kafneo/coquito-one-take/coquito.html` | **Best current template.** One unbroken 24s take of three iced drinks on a lazy Susan at night. String lights switch on, the camera pushes in on each drink, then they stack, split and the logo ends it. | Any product line-up (drinks, food, merch) |
| `kafneo/menu-drop/menu.html` | **In-store screen loop, 16:9, about 57s, seamless.** Drink cards in Bricolage Grotesque (names) and Archivo (descriptions). Drinks under frosted glass domes on the real Kafneo counter; each dome lifts with cold mist, names on the counter slats; light turns evening to golden between the coquito and pumpkin sets | Screen loops, menu launches. Swap `hi/counter_*.jpg` and `hi/coq*/pmk*.png` for real photos |
| `kafneo/pumpkin-one-take/pumpkin.html` | The same one-take at autumn dusk, with falling leaves that land on the table | Seasonal variants |
| `kafneo/reels/your-spot.html` | 30s brand reel (scenes from the Kafneo brief, labels with gold dot bullets) | Brand or venue reels |
| `kafneo/reels/gold-special.html` | 15s single-drink special | One-product promos |
| `kafneo/landscape-and-story/` | Landscape ad with the logo built from its own colour layers, plus an IG story recipe build | Logo reveals, stories |
| `procreate/procreate.html` | 29s app spec ad: shapes turn into each other, with no cuts | SaaS and app ads |
| `kafneo/prompts/` | Every Gemini prompt pack used. The newest is `Kafneo - all missing prompts (Gemini).md` | Making new assets |
| `kafneo/sources/` | Original Gemini images for the coquito line, before cutting | Re-cutting assets |
| `tools/` | Renderer, stills, contact sheets, cut-out and alignment scripts | Every job |

Each ad folder holds its own `hi/` (cut assets, logo layers, alignment data) and `fonts/`. Every folder runs on its own.

## Page contract (every ad page follows it)
- One `<canvas id="c">` at 1080×1920 (or 1920×1080), drawn only by `window.renderAt(t)`.
- `window.TOTAL` is the length in seconds, and `window.ready` is a promise that resolves once assets are loaded.
- URL options: `?t=3.2` renders one frame, `?scale=2` renders at 2x (4K), `?mb=3` adds motion blur (averages sub-frames).
- Timings live in one `B = {...}` object at the top. The camera is `mono([...])` keyframes, a smooth curve that never overshoots.

## Render

Serve the ad's folder over HTTP. Opening it from `file://` blocks reading the canvas.
```bash
cd motion/kafneo/coquito-one-take
python3 -m http.server 8765 --bind 127.0.0.1 &
# stills to check, then a contact sheet
PORT=8765 node ../../tools/render-pw.js stills coquito.html st 0 3 6 9 12 15 18 21 24
python3 ../../tools/sheet.py st sheet.jpg 9
# final video (MB=3 is the motion blur; about 25 min for 24s at 30fps)
PORT=8765 MB=3 node ../../tools/render-pw.js video coquito.html out.mp4 --fps 30
```
- `tools/still.js page.html <t> out.jpg` grabs a single frame.
- The renderer needs Playwright and ffmpeg. Long renders should run in the background.
- If frames come out blank or you get `ERR_CONNECTION_REFUSED`, the HTTP server has stopped. Start it again.

## Making assets (Gemini AI Plus)
1. Use the prompt packs in `kafneo/prompts/`. `tools/make_prompt_file.py out.md` regenerates the latest pack: edit the drinks in it and it writes one copy-paste box per image, with the style block included.
2. Request **one asset per image**, each in its own chat per drink: a hero on a flat backdrop, then close-ups with the camera height, angle and straw position locked.
3. Cut and line up the assets:
   - `tools/cut_hero_and_ladder.py <folder>`: keys the hero and its close-ups off the flat backdrop, then lines each close-up up with the one before it (SIFT plus similarity, written to `hi/ladders*.json`). Edit `JOBS` at the top of the script.
     - A close-up needs about 50 or more inliers to be usable. Fewer means the angle drifted, so regenerate it.
   - `tools/cut_sheet_and_ladder.py` and `tools/register_props_turntable_world.py`: for older multi-item "gang sheets", the lazy Susan and the world plates.
   - `tools/cut_overhead_props.py`: props on white, with their shadows kept as real transparent shadows.
4. Needs `pip install opencv-python-headless scipy pillow numpy`. Run with `python3 -I`.

## Techniques worth reusing (see `coquito.html`)
- **Zoom ladder:** close-ups laid exactly over the hero and clipped to its outline, faded in by screen scale (`ladder()`). The camera can push very deep and stay sharp.
- **Turntable:** cups ride a ring (`cupPose`). The front cup is lit and sharp; the back cups are dimmed on their own layer (so the dim never touches the empty box around them) and blurred.
- **Lights on:** bulbs detected in a lights-off plate (`hi/bulbs_off.json`) switch on in a ripple, with a flicker, and warm the scene.
- **Logo build:** the logo split into colour layers (`hi/logo_*.png`) and assembled piece by piece.
- **Text:** words slide up out of a mask, never fade. Labels use a dot bullet, never an outlined pill.

## Notes from client feedback (Kafneo)
- **Loved:**
  - The one-take turntable.
  - The background dimming down for the logo ending.
  - Smooth push-ins.
- **Hated:**
  - Hard cuts to close-ups and letterboxed inserts.
  - Things falling for no reason (beans from the sky).
  - Outlined pill labels.
  - The brief's "vibe coded" look.
- **Still to do:**
  - Real drink names.
  - Sound.
  - Back views of the cups, so they can visibly turn.
  - The pumpkin line close-ups, and the pumpkin world at three times of day.

## Starting a new video type in a new session
Tell Claude: *"Read motion/README.md, then let's make a [type] for [brand]. Start from [template]."* Copy the template folder, swap the assets in `hi/` and the copy in `DRINKS` / `B`, then iterate with stills and contact sheets before rendering the full video.
