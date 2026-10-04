# Engine API (storyboard JSON)

```jsonc
{
  "title": "string",
  "format": { "w": 1080, "h": 1920, "fps": 30 },
  "bpm": 120,                     // enables "Nb" beat times
  "duration": null,               // optional; defaults to the sum of scene durations
  "scenes": [ Scene, ... ],
  "overlays": [ Element, ... ]    // drawn above every scene, times are ABSOLUTE (seconds from start)
}
```

**Times** anywhere: number = seconds, `"4b"` = beats at `bpm`, `"12f"` = frames, `"1.5s"` = seconds, or an **expression** of terms joined by `+`/`-`:
- `"cueName"`: from `scene.cues` (scene-local) or `story.cues` (absolute, for overlays)
- `"@id"` / `"@id.end"`: the entrance start / end of the element with that `id` in the same scene (MotionGfx-style chaining)
- e.g. `"@box.end+0.5b"`, `"open-0.15"`. Ids and cue names must not contain `+` or `-`. Negative times are allowed (`-0.2` = already mid-entrance on frame 0).
**Colours** anywhere: a palette role (`"primary"`) or a literal CSS colour (avoid literals).
**Coordinates:** `x`,`y` are fractions of frame width/height. Sizes: see each element.

## Scene
```jsonc
{
  "id": "hook",
  "dur": "4b",
  "bg": "primary",
  "transition": "cut" | { "type": "wipe|iris|cover|push|shrink|flash|fade|zoom|cut", "dur": 0.5, "ease": "inOutCubic", ...typeOptions },
  "camera": { "zoom": [1, 1.05], "shake": 0.3, "pan": [[0,0],[0.02,0]], "ease": "inOutQuad" },
  "cues": { "open": 1.55 },                                     // named moments for this scene
  "bgTo": [ { "at": 2, "dur": 0.5, "bg": "chapter2", "ease": "inOutCubic" } ],  // background colour morphs
  "elements": [ Element, ... ]    // drawn in order (later = on top); times are relative to scene start
}
```
The transition belongs to the INCOMING scene and plays over its first `dur` seconds.
| type | options |
|---|---|
| `wipe` | `dir`: left/right/up/down (direction the edge travels from), `bands`: [roles] leading colour bands, `bandW`: 0.12 |
| `iris` | `x`,`y` origin (fractions), `ring`: role for a ring at the edge |
| `cover` | `dir`, `color`: role of the panel |
| `push` | `dir` |
| `shrink` | `to`: final scale (0 = vanish), `border`: role, `borderW`: 0.02 |
| `flash` | `color` |

## Element (common fields)
```jsonc
{
  "type": "text|cycler|logo|image|group|repeat|poly|circle|ring|semicircle|heart|sparkle|star|polygon|scallop|blob|rays|rect|pill|segbar|path|dots",
  "id": "box",                    // optional; lets other elements time themselves with "@box" / "@box.end"
  "sfx": "chime",                 // optional audio.mjs override ("pop","plop","bloop","whoosh","tick","twinkle","chime","shimmer"), or false to mute
  "x": 0.5, "y": 0.5,             // position of the anchor point
  "anchor": "center",             // center|left|right|top|bottom|top-left|top-right|bottom-left|bottom-right
  "scale": 1, "rot": 0,           // rot in degrees
  "opacity": 1,
  "in":  { "fx": "pop", "at": 0.2, "dur": 0.5, "ease": "outBack" },   // or just "pop"
  "out": { "fx": "fade", "at": 2.5, "dur": 0.3 },                      // exits continue direction of travel
  "moves": [ { "at": 1, "dur": 0.6, "x": 0.5, "y": 0.4, "scale": 1.2, "rot": 0, "opacity": 1, "fill": "accent", "color": "ink", "ease": "inOutCubic" } ],
  "loop": { "fx": "float|pulse|sway|flap|spin|shake|beat|jelly|boil|wave", "period": "1b", "amp": 1, "phase": 0, "seed": 0 },
  "shadow": { "color": "rgba(0,0,0,.25)", "blur": 0.03, "y": 0.015 },
  "blend": "multiply",            // optional canvas composite mode
  "from": 0                       // optional: hidden before this time
}
```
- An element with no `in` is visible from the start of its scene. With no `out`, it stays until the scene ends.
- `moves` apply in order; each one interpolates from the current state to its targets.
- Negative `amp` on `flap`/`sway` mirrors the motion (use it for left/right wing pairs).
- `moves` can tween colours: `fill` / `color` (role or literal) blend from the current colour.
- Loops: `jelly` = squishy alternating squash (desserts, soft goods) · `boil` = stepped hand-held jitter at 8fps (sticker / handmade / Crumbl handheld feel) · `wave` (text with `split`) = letters or words bob in sequence.

### Effects (`in.fx` / `out.fx`)
`plop` (gravity fall + squash & stretch landing, use `anchor: "bottom"`) · `swing` (elastic swing-in, great for hanging signs and stickers) · `zoom-in` (settles from 150%) · `cut` · `fade` · `pop` · `pop-soft` · `rise` · `sink` · `mask-up` · `mask-down` · `slide-left` · `slide-right` · `slide-up` · `slide-down` · `drop` (bounce, from above the frame) · `drop-near` (bounce, shorter fall, fades in) · `drop-soft` · `fly` (from below with tilt) · `grow` (scaleX from anchor) · `grow-y` · `scale` · `scale-down` · `spin-in` · `blur-in` · `draw` (paths and rings) · `wipe` (left→right reveal) · `iris` (circular reveal) · `dot-expand` · `type` (typewriter, text only)

### Easings
`linear inQuad outQuad inOutQuad inCubic outCubic inOutCubic outQuart inOutQuart inExpo outExpo inOutExpo outBack outBackSoft inBack outElastic outBounce`

## Element types

### `text`
```jsonc
{ "type": "text", "text": "Line one\nLine two", "role": "display|headline|title|body|caption",
  "color": "onPrimary", "size": 0.1, "weight": 800, "case": "upper|lower|none", "tracking": 0.02,
  "lineHeight": 1.0, "maxWidth": 0.84, "align": "center|left|right",
  "split": "none|line|word|char", "stagger": 0.06,
  "highlight": { "fill": "accent", "pad": 0.25, "radius": null },   // chip behind the text
  "outline": { "color": "bg", "w": 0.06 },                          // sticker border around glyphs (fraction of font size)
  "bubble": 0.03,                                                   // fattens + rounds glyphs with a same-colour stroke (bubbly look)
  "dotColor": "onPrimary" }                                        // for dot-expand
```
With `split` set, the `in` effect plays per unit, staggered. Text wraps automatically at `maxWidth`.

### `cycler` (beat-synced word list in one slot)
```jsonc
{ "type": "cycler", "items": ["Playlists","Podcasts","Live"], "every": "1b", "at": 0,
  "fx": "cut|pop|rise|mask-up", "fxDur": 0.25, "outFx": "cut", "holdLast": true, ...textFields }
```

### `logo`
```jsonc
{ "type": "logo", "w": 0.5, "onDark": false }
```
Uses `brand.logo.src` (or `srcOnDark` when `onDark: true`). With no file, it renders `brand.logo.wordmark` in the display face, coloured `brand.logo.color` (override with `color`, `role`, `size`).

### `image` (product shots, footage stills, illustrations)
```jsonc
{ "type": "image", "src": "assets/can.png", "w": 0.3, "h": 0.62, "hUnit": "U|W",
  "mask": "none|circle|rounded", "radius": 0.04, "fit": "cover", "stroke": "bg", "strokeW": 0.01,
  "label": "PRODUCT", "placeholder": "primary" }
```
`w` = fraction of frame width (or of the short side with `wUnit: "U"`, recommended for heroes so they keep their size across formats); `h` = fraction of the short side (or width with `hUnit: "W"`). Omit `h` to keep the image's aspect ratio. Use transparent PNGs for cut-out products. If `src` is empty or missing, a labelled placeholder box in the `placeholder` colour is drawn.

### Shapes
```jsonc
{ "type": "circle",     "r": 0.1, "fill": "accent", "stroke": null, "strokeW": 0.008 }  // r × short side
{ "type": "ring",       "r": 0.1, "fill": "ink", "strokeW": 0.008, "startAngle": -90 }  // in: "draw" draws it on
{ "type": "heart",      "r": 0.04, "fill": "primary" }                                    // r × short side; rotate with rot
{ "type": "sparkle",    "r": 0.04, "fill": "bg" }                                         // four-point star
{ "type": "semicircle", "r": 0.1, "fill": "dark" }                                      // flat edge at bottom; rotate with rot
{ "type": "rect",       "w": 0.5, "wUnit": "W|U", "h": 0.05, "hUnit": "U|H", "radius": 0.02, "fill": "primary" }
{ "type": "pill",       "w": 0.3, "h": 0.08, "fill": "bg" }
{ "type": "segbar",     "w": 0.6, "h": 0.016, "segments": 4, "gap": 0.012, "fill": "primary" | ["primary","accent"], "stagger": 0.15 }
```

### `group` (hierarchy: move, scale, rotate, fade many things as one)
```jsonc
{ "type": "group", "x": 0.5, "y": 0.7, "scale": 1.1, "rot": -4, "in": { "fx": "plop" },
  "children": [ /* any elements; their x/y are OFFSETS in short-side units (U) from the group origin; default 0,0 */ ] }
```
Groups nest. Children keep their own `in/out/moves/loop` (same scene clock). Use a group per physical object (a box, a lid, a sticker with its product).

### `poly` (custom shapes: boxes, ribbons, bags, cups)
```jsonc
{ "type": "poly", "pts": [[-0.25,0],[0.25,0],[0.25,-0.22],[-0.25,-0.22]], "radius": 0.012, "fill": "blush", "stroke": null, "dash": null }
```
`pts` are U offsets from the element's x/y (or the group origin). `radius` rounds every corner (U).

### Generators (Graphite-inspired)
```jsonc
{ "type": "star",    "r": 0.05, "points": 5, "inner": 0.5, "round": 0.15 }   // round = corner rounding (fraction of r)
{ "type": "polygon", "r": 0.05, "sides": 6, "round": 0.1 }
{ "type": "scallop", "r": 0.2,  "bumps": 16, "depth": 0.08 }                 // badges, plates, stickers, cloud frames
{ "type": "blob",    "r": 0.3,  "wobble": 0.08, "speed": 1, "seed": 1 }       // organic shape that keeps morphing over time
{ "type": "rays",    "r": 0.9,  "count": 18 }                                  // sunburst; add loop spin
```
All accept `fill`, `stroke`, `strokeW`, `dash` (e.g. `[0.012, 0.01]` for a stitched outline), `opacity`, `shadow`.

### `repeat` (copies with colour cycling, organic variation and a stagger)
```jsonc
{ "type": "repeat", "mode": "radial|line|grid", "count": 12, "x": 0.5, "y": 0.5,
  "radius": 0.4, "angle0": -90, "arc": 360, "orient": true,          // radial
  "step": [0.1, 0],                                                   // line (U per copy)
  "cols": 3, "gap": [0.2, 0.2],                                       // grid
  "fills": ["primary","accent"], "texts": ["A","B"], "stagger": 0.05, "seed": 4,
  "vary": { "rot": 20, "scale": 0.4, "pos": 0.05 },                  // per-copy randomness (deterministic)
  "child": { "type": "heart", "r": 0.03, "in": { "fx": "pop", "at": 0.5 } } }
```

### `path` (lines that draw on, travel, and carry a marker)
```jsonc
{ "type": "path", "points": [[-0.05,0.5],[0.3,0.4],[0.6,0.55],[1.05,0.45]],   // frame fractions; may start off-frame
  "smooth": true, "stroke": "ink", "strokeW": 0.007, "cap": "round", "dash": [0.02, 0.015],
  "trail": 0.4,                                   // show only a travelling segment of this length (0–1)
  "head": { "r": 0.025, "fill": "accent", "src": null, "orient": false },     // marker riding the tip
  "in": { "fx": "draw", "at": 0, "dur": 1.6 }, "out": { "fx": "draw", "at": 3, "dur": 0.6 } }   // out:draw erases from the tail
```

### `dots` (particle fields)
```jsonc
{ "type": "dots", "count": 30, "seed": 7, "fill": ["primary","accent"], "r": 0.012,
  "area": [x0, y0, x1, y1], "motion": "scatter|fall|burst|drift", "speed": 0.25, "spread": 0.6,
  "x": 0.5, "y": 0.5,      // burst origin
  "in": { "at": 0.2, "dur": 0.8 } }
```
`scatter` = staggered pop-in over `spread` seconds · `fall` = confetti · `burst` = explode from (x,y) · `drift` = ambient float.

## Brand fields the engine reads
`palette.*` · `type.display|headline|body.{family,fallback,weight,case,tracking,lineHeight,italic}` · `type.scale.*` · `type.fontUrls` · `type.fontFiles[{family,weight,style,src}]` · `logo.{src,srcOnDark,wordmark,color}` · `motion.{exit,move,transition,stagger}` · `name`.

## Player / render hooks
The built HTML exposes `window.MG_ready` (Promise), `MG_seek(t)`, `MG_duration`, `MG_fps` and `MG_size`. Add `?render=1` to hide the controls.
`MG.normalize(story)` returns the resolved timeline without a canvas (used by `audio.mjs` and the build lint). Load `engine/motion.js` in Node with `vm`.
