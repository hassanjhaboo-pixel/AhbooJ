# Motion personalities

Place every brand (or piece) in ONE cell. Mixing two cells produces mush.
Adapted from the iart.ai motion-design-skills direction playbook; values map onto brand JSON `motion.*` and the kit's tokens.

| Cell | Brands | Easing (enter / exit) | Base unit | Transitions | Stagger | Intensity | Holds |
|---|---|---|---|---|---|---|---|
| **Calm + Soft** | luxury, wellness, editorial | `cubic-bezier(0.4,0,0.2,1)` long tails | 0.6s (hero 1.2s) | slow crossfade + gentle scale, no hard cuts | 120ms | travel ≤ 16px, no overshoot | ≥ 0.6s |
| **Calm + Sharp** | premium tech, fintech | `cubic-bezier(0.22,1,0.36,1)` / `(0.4,0,1,1)` | 0.4s | match-cut + crossfade | 60ms | overshoot ≤ 2% | ≥ 0.3s |
| **Kinetic + Sharp** | sport, drinks, gaming, launches | `cubic-bezier(0.16,1,0.3,1)` hard-out | 0.25s | hard cuts on beats, speed ramps | 40ms | big travel, 1.18→1 on impact | ≥ 0.2s |
| **Kinetic + Soft** | playful, food, kids, lifestyle | `cubic-bezier(0.34,1.56,0.64,1)` overshoot / springs | 0.4s | bouncy pushes, squash-and-stretch | 80ms, irregular | generous bounce + follow-through | ≥ 0.3s |
| **Neutral data** | explainers, reports | `cubic-bezier(0.25,0.1,0.25,1)` | 0.5s, count-ups 0.8–1.2s | cross-dissolve | 80ms | no overshoot on numbers | ≥ 0.5s per value |

Brand JSON mapping: Calm → `energy: "calm"`; Kinetic+Soft / Calm+Sharp → `"balanced"`; Kinetic+Sharp → `"punchy"`. Shape language `circles/rounded/organic` + non-calm energy makes `ease-enter` an overshoot.

## Brand word → motion
| Word | Easing | Timing | Intensity | Avoid |
|---|---|---|---|---|
| premium / luxury | long soft decel | slow, generous holds | minimal travel | bounce, fast cuts |
| trustworthy / precise | clean symmetric | on the grid | small, controlled | wobble |
| energetic / bold | hard-out | fast, syncopated | big scale, overshoot on beats | slow fades |
| friendly / cute | spring / overshoot | loose | soft bounce, follow-through | robotic linear |
| innovative / techy | decel + subtle anticipation | tight layered staggers | crisp, geometric | grunge |

Map only the 2–3 strongest brand words.

## Pre-render direction checklist
- One message, three mood words, one cell.
- ≤ 2 primary easing curves in the whole piece.
- One signature transition (plus cuts).
- Every frame has exactly one hero; exactly one "wow" moment.
- A hold after a fast sequence makes the next hit land.
