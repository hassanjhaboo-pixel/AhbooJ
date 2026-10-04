# Motion skills

Three skills that build a brand system and produce on-brand motion graphics for **any** brand:

| Skill | Job |
|---|---|
| `brand-kit-intake/` | Turns a brand (logo, site, guide, CSS, or a description) into `brand-motion/brand/<slug>.json` from the blank template. |
| `brand-kit/` | Extends that file into a full identity system (strategy, voice, logo rules, colour + contrast audit, type, imagery, motion tokens, sound, social) and generates a shareable **brand book page**, design tokens (CSS / Tailwind / W3C JSON), `DESIGN.md` and motion guidelines. Holds the creative-brief, promo-brief, campaign-plan, shot-list and voice templates. |
| `brand-motion/` | Writes a storyboard in one of six decoded ad styles (Pop Pulse / Kinetic Type / Line Journey / Diorama Build / Lineup Reveal / Hero Constant), builds a live HTML preview, generates a synced soundtrack, QA-checks motion, and renders an MP4 with motion blur. |

## Use in Claude Code
These live in `.claude/skills/`, so Claude Code picks them up automatically in this repo. Example asks:
- "Set up a brand kit for <brand> from <url/logo>"
- "Make a 15s Pop Pulse ad for <product> in the <brand> kit, 9:16"
- "Re-skin the line-journey storyboard for Ahbooj, 1:1"
- "Build the full brand kit / brand book for <brand>"
- "Make a mockumentary-style toy-world ad for <brand>'s grand opening, with voiced interviews"

## Use on claude.ai (Sonnet / any model)
Zip each skill folder (the folder itself, with `SKILL.md` at its root) and upload it under **Settings → Capabilities → Skills**:
```bash
cd .claude/skills && zip -r brand-motion.zip brand-motion -x '*/out/*' && zip -r brand-kit-intake.zip brand-kit-intake && zip -r brand-kit.zip brand-kit
```
Rendering MP4 needs Node 18+, Playwright/Chromium and ffmpeg. Character voices need the offline TTS engine once: `bash brand-motion/scripts/setup-tts.sh` (~400 MB from GitHub releases). Where those aren't available, the skill still delivers the standalone HTML preview and the storyboard JSON.

## Quick commands
```bash
cd .claude/skills/brand-motion
node scripts/build.mjs  --brand brand/examples/demo-brand.json --story storyboards/pop-pulse.json --out out/pop.html
node scripts/render.mjs out/pop.html --sheet 12     # QA contact sheet
node scripts/render.mjs out/pop.html --qa           # dead-air / blank-frame report
node scripts/audio.mjs --story storyboards/pop-pulse.json --out out/pop.wav --bed pulse
node scripts/render.mjs out/pop.html --audio out/pop.wav --blur 3   # MP4 with sound + motion blur
```

## The repeatable loop
1. Brand once: `brand-kit-intake` → `brand-kit` (brand book + tokens).
2. Every promo: fill `brand-kit/templates/promo-brief.md` → pick a template from `brand-motion/templates/README.md` → render.
3. A season: `brand-kit/templates/campaign-plan.md` → one promo brief per slot → batch-render.

Inspiration and techniques were drawn from iart-ai/motion-skills (character sheets, deliver-and-verify, motion personalities, brand motion guidelines, lower thirds, platform specs), nexu-io/motion-anything (MOTION-SPEC tokens and restraint budget, DESIGN.md format) and fliptheweb/motion-ui-design (principles and references). See brand-motion/references/research-notes.md.
