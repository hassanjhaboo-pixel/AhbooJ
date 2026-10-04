---
name: brand-kit
description: Build or extend a complete brand identity system for ANY brand from one source file — strategy, voice & tone, logo rules, colour system with contrast audit, typography, imagery, layout, motion tokens, sound and social specs — and generate a shareable brand book page, design tokens (CSS, Tailwind v4, W3C JSON), an agent-readable DESIGN.md and motion guidelines. Also holds the fill-in templates for creative briefs, promo/campaign plans, shot lists and voice guides. Use when the user asks for a brand kit, brand book, style guide, brand guidelines, design system, design tokens, "set up my brand properly", "make templates for my brand", "plan a promo/campaign", or before starting a run of branded content.
---

# Brand Kit

One file is the single source of truth: `brand-motion/brand/<slug>.json` (the same file the brand-motion video engine reads).
This skill adds the *identity* layer on top and turns the file into everything a team, a designer or another agent needs.

```
brand/<slug>.json ──kit.mjs──▶ kit/<slug>/brand-book.html   shareable guidelines page (open in a browser / publish)
   (roles, type,                       tokens.css            CSS custom properties incl. motion tokens + reduced-motion
    logo, motion,                      tailwind.css          Tailwind v4 @theme
    + identity)                        tokens.json           W3C Design Tokens (Figma Tokens, Style Dictionary)
                                       DESIGN.md             agent-readable design system (paste into any coding agent)
                                       motion-guidelines.md  principles, timing/easing tokens, library, logo rules, a11y
                                       report.txt            contrast audit + what's still missing
```

## Files
| Path | What it is |
|---|---|
| `templates/brand-kit.template.json` | The full schema: brand-motion roles + optional identity sections, every field explained. |
| `templates/creative-brief.md` | One-page brief for any piece (ad, reel, launch, menu drop). Fill before designing. |
| `templates/promo-brief.md` | Short brief for recurring promotions (offer, dates, formats, CTA) — the "make another one" loop. |
| `templates/campaign-plan.md` | A month / season of content: themes, formats, cadence, reuse plan. |
| `templates/shot-list.md` | Scene-by-scene direction notes (purpose, hero, support, transition, beat, VO/caption). |
| `templates/voice-and-tone.md` | Voice pillars, vocabulary, rewrite examples, per-channel tone. |
| `templates/DESIGN.template.md` | Blank DESIGN.md in the 7-section layout (what kit.mjs generates). |
| `references/motion-personalities.md` | Five motion "tone cells" and the brand-word → motion translation. |
| `references/social-specs.md` | Sizes, lengths and safe zones per platform. |
| `references/brand-qa.md` | Checklist before a kit or a piece ships. |
| `scripts/kit.mjs` | The generator. |

## Workflow
1. **Get the base kit.** If `brand-motion/brand/<slug>.json` doesn't exist, run the **brand-kit-intake** skill (or copy `templates/brand-kit.template.json`). Required: palette roles, type, logo, motion, voice.
2. **Add the identity layer** (optional sections in the template): `strategy`, `voiceGuide`, `logoRules`, `imagery`, `iconography`, `sound`, `social`, `contact`, `paletteNames`, `paletteUsage`, `motionPrinciples`. Take them from the user's material. When you have to draft them yourself, write them from the brand's actual look and copy, add `"_identityStatus": "DRAFT ..."`, and tell the user what to confirm. Never invent facts (addresses, awards, prices, handles).
3. **Generate:** `node scripts/kit.mjs --brand ../brand-motion/brand/<slug>.json` (output defaults to `brand-motion/brand/kit/<slug>/`).
4. **Read `report.txt`.** Any `Fail` pair means that text colour must not sit on that background. `AA Large` means display sizes only. Fix by changing which on-colour a role uses, or record the rule in `rules.dont`.
5. **Look at the brand book** (screenshot it at ~1280px and ~390px wide, or open it). Check the logo rendering, specimens, swatches and that no section shows "Not specified yet" that the user expects filled.
6. **Deliver** the brand book (it's one self-contained HTML file: publish it as a page or send the file), plus the token files for whoever builds the site/app. Summarise roles → hex, fonts, motion energy and every assumption.

## Making content from the kit (the repeatable loop)
- New promo / topic: copy `templates/promo-brief.md`, fill it in a few lines, then hand it to **brand-motion** (pick a playbook or `templates/mockumentary` for character comedy). The kit guarantees every piece looks and moves the same.
- A season of content: `templates/campaign-plan.md` → one promo brief per slot → batch the videos with brand-motion.
- Website / app / Canva work: give the designer or agent `DESIGN.md` + `tokens.css`.

## Rules
- Colours are referenced by **role** everywhere. Tints and shades come from the generated ramps, never new hues.
- Contrast is computed, not eyeballed (report.txt). Small text ≥ 4.5:1, display ≥ 3:1.
- Fonts that can't load (offline/proxy) fall back silently; list real font files in `type.fontFiles` when the exact face matters.
- The brand book shows misuse examples generated from the real logo. Never ship a kit with a placeholder logo without saying so.
