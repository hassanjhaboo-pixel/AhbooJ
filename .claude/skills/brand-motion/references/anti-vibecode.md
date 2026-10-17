# Don't look vibecoded: 20 tells to avoid

Source: Hassan's "20 reasons why your app looks vibecoded" list (Oct 2026). These are the defaults AI tools reach for, so
viewers now read them as "a bot made this". Check every video, page and screen against this list before delivering.
If a brand really needs one of these, write the reason next to it in the project README.

| # | Tell | In a web page / app | In a motion graphic | Do this instead |
|---|---|---|---|---|
| 1 | Purple-to-blue gradient | Hero, buttons, backgrounds | Background washes, beam colours | Flat brand colour fields. One accent colour, used on purpose |
| 2 | Gradient hero text | `bg-clip-text` headlines | Gradient-filled titles | Solid type. Get contrast from size, weight and colour blocks |
| 3 | Emojis in headings | "🚀 Features" | Emoji stickers in titles | Real icons drawn for the brand, or nothing |
| 4 | Inter everywhere | Default Tailwind/shadcn font | Inter for display, headline and body | A face with character for display. Inter only as a quiet body face, if at all |
| 5 | Coloured border cards | `border-primary` cards | Pills/chips with an accent stroke on every label | Separate with space, fills or rules. Strokes only where they carry meaning |
| 6 | Glassmorphism cards | `backdrop-blur` + translucent white | Frosted panels behind text | Solid panels or no panel. Text sits straight on the image with a real shadow or a colour block |
| 7 | Low-contrast dark mode | Grey on near-black | Small steel/slate HUD text on a dark stage | Small text ≥ 4.5:1. If a label can't be read on a phone, cut it or make it bigger |
| 8 | 3 icon boxes in a row | Feature trio grid | Three identical tiles popping in a row | Uneven layouts: one hero item + supporting detail, a list, a sequence over time |
| 9 | Badge above the headline | "✦ New" pill over H1 | `// SECTION TAG` eyebrow over every title | Let the headline stand alone. Use a tag only where it adds information (a count, a step) |
| 10 | Lucide icons everywhere | Default icon set | Generic line icons as decoration | Custom marks from the brand's own shapes, or real photos/objects |
| 11 | Untouched shadcn UI | Stock radius, shadows, spacing | Stock-looking UI mockups | Restyle components to the brand: radius, density, type, colour |
| 12 | Fade-in on scroll | Every section rises + fades | Every element enters with rise/fade | Pick a motion idea per piece (slam, mask, draw, cut on the beat). Many things should just be there or hard-cut in |
| 13 | Cursor-following beam | Spotlight that tracks the mouse | Light sweeps that serve no story | Light only when it is the concept, and moves with intent |
| 14 | Buttons fade on hover | Opacity-only hover | Soft opacity pulses on CTAs | Hover/attention = a real change: fill, shift, press-down, colour swap |
| 15 | Inconsistent spacing | Random paddings | Elements nudged by eye per scene | One spacing scale (e.g. 8px steps / fixed U grid) and stick to it across scenes |
| 16 | Em dashes everywhere | Copy full of — | On-screen copy and captions with — | Full stops, commas, colons. Short sentences |
| 17 | Generic buzzword copy | "Seamless. Powerful. Effortless." | "Elevate your ride" type lines | The owner's real words, specifics (what, where, price, how to book) |
| 18 | Serif italic accents | One italic serif word in a sans headline | Italic serif "accent" words | One type system. Emphasis by colour or weight inside the same family |
| 19 | Space Grotesk + Instrument Serif | The default "tasteful" pair | Same pair in titles | Choose faces for the brand's personality, not the trend |
| 20 | Grain over a gradient | Noise overlay on a gradient bg | `grade.grain` on every scene + gradient beams | Grain only on photographic/film looks where it means something. Clean flat stages otherwise |

## Engine defaults this changes
- `grade.grain`: off by default. Turn it on only for a film/photo treatment, and say why.
- Eyebrow HUD tags (`// …`) above headlines: not by default. Use them only when they carry data (step 2/5, a time, a price).
- `rise`/`fade` entrances: not the default entrance. Choose the piece's motion idea first; fades are for secondary detail.
- Accent-stroke chips on every label: avoid. Use fills or plain text.
- Gradient beams/washes: one per piece at most, and only when it is the concept (e.g. a UFO beam for AREA 47).

## Writing (chat replies, READMEs, captions)
- No em dashes. Use full stops, commas or colons.
- No buzzwords. Say the specific thing.
