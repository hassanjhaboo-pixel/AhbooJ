# Motion skills

Two skills that produce on-brand animated motion graphics for **any** brand:

| Skill | Job |
|---|---|
| `brand-kit-intake/` | Turns a brand (logo, site, guide, CSS, or a description) into `brand-motion/brand/<slug>.json` from the blank template. |
| `brand-motion/` | Writes a storyboard in one of six decoded ad styles (Pop Pulse / Kinetic Type / Line Journey / Diorama Build / Lineup Reveal / Hero Constant), builds a live HTML preview, generates a synced soundtrack, QA-checks motion, and renders an MP4 with motion blur. |

## Use in Claude Code
These live in `.claude/skills/`, so Claude Code picks them up automatically in this repo. Example asks:
- "Set up a brand kit for <brand> from <url/logo>"
- "Make a 15s Pop Pulse ad for <product> in the <brand> kit, 9:16"
- "Re-skin the line-journey storyboard for Ahbooj, 1:1"

## Use on claude.ai (Sonnet / any model)
Zip each skill folder (the folder itself, with `SKILL.md` at its root) and upload it under **Settings → Capabilities → Skills**:
```bash
cd .claude/skills && zip -r brand-motion.zip brand-motion -x '*/out/*' && zip -r brand-kit-intake.zip brand-kit-intake
```
Rendering MP4 needs Node 18+, Playwright/Chromium and ffmpeg. Where those aren't available, the skill still delivers the standalone HTML preview and the storyboard JSON.

## Quick commands
```bash
cd .claude/skills/brand-motion
node scripts/build.mjs  --brand brand/examples/demo-brand.json --story storyboards/pop-pulse.json --out out/pop.html
node scripts/render.mjs out/pop.html --sheet 12     # QA contact sheet
node scripts/render.mjs out/pop.html --qa           # dead-air / blank-frame report
node scripts/audio.mjs --story storyboards/pop-pulse.json --out out/pop.wav --bed pulse
node scripts/render.mjs out/pop.html --audio out/pop.wav --blur 3   # MP4 with sound + motion blur
```
