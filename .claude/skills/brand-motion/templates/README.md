# Motion templates — pick by goal

All templates are brand-agnostic: they read colour/type **roles** from a brand file, so the same template re-skins to any brand.
Fill a promo brief first (`../../brand-kit/templates/promo-brief.md`), then pick the row that matches the goal.

| Goal / brief sounds like | Template | Length | Formats | How |
|---|---|---|---|---|
| One hero product, bold, punchy | `storyboards/pop-pulse.json` | 10–15s | any | copy + edit JSON |
| Offer, price, features, type-only | `storyboards/kinetic-type.json` | 8–15s | any | copy + edit JSON |
| Brand story, service, warm explainer | `storyboards/line-journey.json` | 20–45s | any | copy + edit JSON |
| Many products / rooms / use-cases, playful world | `storyboards/diorama-build.json` | 20–60s | any | copy + edit JSON |
| Weekly drop, menu, flavours, "what's inside" | `storyboards/lineup-reveal.json` | 12–25s | any | copy + edit JSON |
| One product across moments, calm premium | `storyboards/hero-constant.json` | 12–20s | any | copy + edit JSON |
| **Character comedy / launch / opening / "people go crazy for it"** — voiced reality-TV confessionals, toy world, countdown, stampede, payoff | `templates/mockumentary/` | 40–55s | 9:16 + 1:1 | edit `brief.json`, run `node make.mjs` |

## mockumentary
```bash
cp -r templates/mockumentary projects/<client>-<name>      # keep the copy inside brand-motion so kit paths resolve
# edit projects/<client>-<name>/brief.json: brand path, assets (logo, mark, 4 product PNGs), cast (lines, voices, looks, punch), host, payoff, end card
node projects/<client>-<name>/make.mjs                      # voices + brand.toy.json + storyboard-9x16.json + storyboard-1x1.json
node scripts/build.mjs --brand projects/<client>-<name>/brand.toy.json --story projects/<client>-<name>/storyboard-9x16.json --out projects/<client>-<name>/out/spot.html
node scripts/render.mjs projects/<client>-<name>/out/spot.html --sheet 18     # look at it
node scripts/audio.mjs --story projects/<client>-<name>/storyboard-9x16.json --out projects/<client>-<name>/out/spot.wav --bed musicbox
node scripts/render.mjs projects/<client>-<name>/out/spot.html --audio projects/<client>-<name>/out/spot.wav --blur 3
```
- 2–5 cast members work best. Each gets a confessional; tracking shots down the line are inserted between them automatically.
- `punch` sets the cut on a member's last line: `cheer` (sparkles), `rage` (crash zoom, red rays, impact), `scheme` (white flash, purple, "dun dun DUN"), `zoom`, `none`.
- `brand.toy.json` = the brand plus any missing toy-world roles derived from its own colours (skin yellow, bone, wood, tints of primary).
- Series: keep the cast's `look` + `voice` identical across episodes; change lines, products and one gag.
- Shorter cut: drop cast members (each saves ~5s) or remove the payoff scene.

## Making your own template
A template is a generator script plus a brief: it turns a small JSON brief into storyboards for every format. Start from the closest one, move every brand- or campaign-specific value into the brief, and keep the timing logic in code (scene lengths from voice durations, positions from per-format pixel offsets).
