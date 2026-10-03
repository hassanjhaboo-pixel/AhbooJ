# Motion language: timing, easing, transitions, continuity

## 1. The beat grid
Music drives everything in the references. Set `bpm` in the storyboard and write times as beats (`"2b"`, `"0.5b"`).

| bpm | 1 beat | 1 bar (4b) | Good for |
|---|---|---|---|
| 90 | 0.667s | 2.67s | calm explainers |
| 100–110 | 0.55–0.6s | 2.2–2.4s | Line Journey, Diorama |
| 120 | 0.5s | 2.0s | Pop Pulse, Kinetic Type |
| 128 | 0.469s | 1.875s | high-energy reels |

- **Scene lengths are whole bars or half bars** (4b, 6b, 8b). Odd lengths feel "off" even to viewers who can't say why.
- **Entrances land ON beats.** The hero lands on beat 1 of the scene (or 0.5b after the cut). Supporting elements land on later beats or use a stagger.
- **Cuts land on downbeats.** In `kinetic-type`, the cycler `every` equals `"1b"`.
- No music provided? Use bpm 120 anyway. It gives a consistent rhythm, and music can be added later at the same tempo.

## 2. Energy presets (`brand.motion.energy`)

| | calm | balanced | punchy |
|---|---|---|---|
| Scene length | 3–5s | 2–3.5s | 1–2.5s |
| Entrance duration | 0.7–1.0s | 0.5–0.7s | 0.25–0.45s |
| Default entrance fx | `fade`, `rise`, `draw`, `iris` | `rise`, `mask-up`, `scale`, `pop-soft` | `pop`, `fly`, `dot-expand`, `cut`, `drop` |
| Stagger | 0.1–0.15s | 0.06–0.1s | 0.03–0.06s or one per beat |
| Transitions | `fade`, `iris`, `cover` 0.7–0.9s | `iris`, `cover`, `push` 0.5–0.7s | `cut`, `wipe`, `flash` 0.3–0.45s |
| Loops | `float`, `sway` | `pulse`, `float` | `beat`, `flap`, `shake` |

## 3. Easing vocabulary
| Ease | Use for |
|---|---|
| `outExpo` | Default "snap and settle": masks, slides, grows. Feels premium. |
| `outBack` | Overshoot: pops, fly-ins, product landings. Playful. |
| `outBackSoft` | Gentle overshoot for logos (`pop-soft`). |
| `outBounce` | Objects dropping onto a surface (`drop`). Diorama only. |
| `inOutCubic` / `inOutExpo` | Moves between two positions (`moves`), transitions, merges. |
| `inCubic` / `inExpo` | Exits: things accelerate away. |
| `linear` | Only for constant drifts, slow zooms and the typewriter. |

**Rule:** enter with `out*`, leave with `in*`, move with `inOut*`. Exits are faster than entrances (about 60–70% of the duration).

## 4. Hierarchy of motion within a scene
1. **Hero motion** (one per scene): the biggest, first, on the beat.
2. **Support**: headline or labels, 1–2 beats after the hero, smaller motion (`mask-up`, `rise`).
3. **Ambient**: dots, background shapes and loops. Low amplitude, never competing.
4. **Hold**: at least 40% of every scene should be still enough to read.

## 5. Transitions (`scene.transition`)
| Type | Reference | When |
|---|---|---|
| `cut` | Spotify, IKEA rooms | Beat-driven change; same layout, new colour/content. The default for punchy. |
| `wipe` (+ `bands`) | Red Bull | Colour bands lead a sweep (e.g. `["onPrimary","primary"]`). Energetic chapter change. |
| `iris` (+ `x`,`y`) | Fresco | Circle opens from a meaningful point (the line's tip, a dot, the product). |
| `cover` | Diorama / generic | Solid brand panel slides over then off. Clean chapter divider. |
| `push` | Fresco | New scene pushes old one off; use for "next step" sequences. |
| `shrink` | Spotify / IKEA ending | Old frame shrinks into a bordered card and disappears. Use for closing. |
| `flash` | Red Bull end card | Quick light flash at mid-point; use into end cards. |
| `fade`, `zoom` | — | Use sparingly; they read as "template-y" in this style family. |

**One signature transition per film** (`brand.motion.signatureTransition`), plus `cut`. A third type is allowed only for the ending (`shrink`/`flash`).

## 6. Continuity: how frames carry into each other
This is what makes the references feel like one film instead of a slideshow. Every cut needs at least one of these:

| Device | How to do it in the engine |
|---|---|
| **Match-cut hero** | Same element (same `x`,`y`,`w`) in consecutive scenes; only bg/companions change. Change rotation/scale with `moves` on the new scene's first 0.4s. |
| **Parked anchor** | Logo or title in the same slot across scenes (copy the element into each scene with no `in`). |
| **Travelling line** | `path` with `trail` + `head` that continues in the next scene from the edge where it left. Exit right → enter left at the same y. |
| **Shape becomes background** | End scene A with a shape scaling up (`moves: scale 8`) in colour X; scene B has `bg: X`. |
| **Iris from a point** | `iris` transition with `x,y` = the last focal element's position. |
| **Direction continuity** | If scene A exits left, scene B enters from right (`slide-left`). Exits continue the direction of travel (the engine does this automatically). |
| **Overlay** | For an element that must persist across many scenes without re-placing it, use top-level `overlays` with absolute times. |
| **Bookend** | The opener's motif (bar, line, dot, shape) returns in the end card. |

## 7. Readability timing
- Min on-screen time for a card: **0.3s × words + 0.5s** (a 4-word card needs ≥ 1.7s). The exception is beat-cycler lists, where each word is a single, predictable token.
- Don't animate text while it must be read; finish its entrance, then hold.
- Never start two text entrances in the same 0.2s unless they are one staggered phrase.
