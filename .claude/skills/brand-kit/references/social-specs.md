# Social & delivery specs

| Placement | Size | Aspect | Length | Safe zone (keep text/logo inside) |
|---|---|---|---|---|
| Reels / TikTok / Shorts | 1080×1920 | 9:16 | 7–30s (hook in the first second); 45–60s for story/comedy | top 13%, bottom 19%, left 6%, right 12% (action buttons) |
| Stories | 1080×1920 | 9:16 | ≤ 15s per card | top 14%, bottom 20% |
| Feed portrait | 1080×1350 | 4:5 | 6–20s | 8% top/bottom, 6% sides |
| Feed square | 1080×1080 | 1:1 | 6–20s | 7% all sides |
| YouTube / web / TV | 1920×1080 | 16:9 | 15–60s | title-safe 5% (10% broadcast) |
| Pinterest | 1000×1500 | 2:3 | 6–15s | 8% |

## Encoding (what render.mjs produces)
H.264 High, yuv420p, 30 fps, CRF 17, +faststart · AAC 192 kbps stereo · loudness ≈ −14 LUFS integrated, −1.5 dBTP.

## Multi-format strategy
- Design the vertical master first (most reach), keep the focal subject in the centre band.
- For 1:1 / 4:5 don't just crop: re-stack the layout (generators take per-format pixel offsets).
- Captions burned in on every spoken line — most feeds autoplay muted.
- Frame 1 is the thumbnail: product or character must already be visible at 0.0s.

## Cut-downs
Every 30s+ piece → 15s (hook, one proof, end card) and 6s (hook + logo). Keep the end card identical across cuts.
