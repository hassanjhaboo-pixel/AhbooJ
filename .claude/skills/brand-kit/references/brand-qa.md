# Brand QA

## The kit
- [ ] Every required palette role filled; no `<…>` placeholders (`report.txt` says "All required fields present").
- [ ] No `Fail` contrast pair is used for text anywhere; `AA Large` pairs are display-only and noted in `rules.dont`.
- [ ] Logo renders on bg, on a chapter colour and on dark; a real file (not the wordmark fallback) unless the user has none.
- [ ] Fonts named and loadable (Google Fonts URL or `type.fontFiles`); substitutions stated.
- [ ] Motion energy and signature transition chosen; durations feel right in the live demos.
- [ ] Draft identity text is marked `_identityStatus: DRAFT` and the user was told what to confirm.
- [ ] Brand book checked at desktop and phone width.

## Any piece made from the kit
- [ ] Only role tokens (no stray hex) in storyboards / CSS.
- [ ] Copy ≤ `voice.maxWordsPerCard` per card, in `voice.case`, using the voice guide's vocabulary.
- [ ] Logo never stretched, rotated or recoloured; clear space respected.
- [ ] Captions on every spoken line; nothing important in the platform UI zones.
- [ ] End card on `bg`, logo + one line + CTA, held ≥ 2s (≥ 3s for 20s+).
- [ ] Contact sheet viewed; `render.mjs --qa` passes (no dead air, no blank frames).
- [ ] Audio ≈ −14 LUFS; dialogue sits above the music (bed ducks under voices).
