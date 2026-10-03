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

**Times** anywhere: number = seconds, `"4b"` = beats at `bpm`, `"12f"` = frames, `"1.5s"` = seconds.
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
  "type": "text|cycler|logo|image|circle|ring|semicircle|rect|pill|segbar|path|dots",
  "x": 0.5, "y": 0.5,             // position of the anchor point
  "anchor": "center",             // center|left|right|top|bottom|top-left|top-right|bottom-left|bottom-right
  "scale": 1, "rot": 0,           // rot in degrees
  "opacity": 1,
  "in":  { "fx": "pop", "at": 0.2, "dur": 0.5, "ease": "outBack" },   // or just "pop"
  "out": { "fx": "fade", "at": 2.5, "dur": 0.3 },                      // exits continue direction of travel
  "moves": [ { "at": 1, "dur": 0.6, "x": 0.5, "y": 0.4, "scale": 1.2, "rot": 0, "opacity": 1, "ease": "inOutCubic" } ],
  "loop": { "fx": "float|pulse|sway|flap|spin|shake|beat", "period": "1b", "amp": 1, "phase": 0 },
  "shadow": { "color": "rgba(0,0,0,.25)", "blur": 0.03, "y": 0.015 },
  "blend": "multiply",            // optional canvas composite mode
  "from": 0                       // optional: hidden before this time
}
```
- An element with no `in` is visible from the start of its scene. With no `out`, it stays until the scene ends.
- `moves` apply in order; each one interpolates from the current state to its targets.
- Negative `amp` on `flap`/`sway` mirrors the motion (use it for left/right wing pairs).

### Effects (`in.fx` / `out.fx`)
`cut` · `fade` · `pop` · `pop-soft` · `rise` · `sink` · `mask-up` · `mask-down` · `slide-left` · `slide-right` · `slide-up` · `slide-down` · `drop` (bounce) · `drop-soft` · `fly` (from below with tilt) · `grow` (scaleX from anchor) · `grow-y` · `scale` · `scale-down` · `spin-in` · `blur-in` · `draw` (paths and rings) · `wipe` (left→right reveal) · `iris` (circular reveal) · `dot-expand` · `type` (typewriter, text only)

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
{ "type": "semicircle", "r": 0.1, "fill": "dark" }                                      // flat edge at bottom; rotate with rot
{ "type": "rect",       "w": 0.5, "wUnit": "W|U", "h": 0.05, "hUnit": "U|H", "radius": 0.02, "fill": "primary" }
{ "type": "pill",       "w": 0.3, "h": 0.08, "fill": "bg" }
{ "type": "segbar",     "w": 0.6, "h": 0.016, "segments": 4, "gap": 0.012, "fill": "primary" | ["primary","accent"], "stagger": 0.15 }
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
