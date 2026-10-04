#!/usr/bin/env node
// Brand kit generator: one brand JSON → a complete, shareable brand system.
//
//   node scripts/kit.mjs --brand ../brand-motion/brand/<slug>.json [--out <dir>]
//
// Writes to <out> (default: <brand dir>/kit/<slug>/):
//   brand-book.html        self-contained brand guidelines page (logo, colour, type, motion, voice, layout, social, do/don't)
//   tokens.css             CSS custom properties (colour roles, tints, type, radius, motion durations + easings)
//   tokens.json            W3C Design Tokens (DTCG) format, for Figma Tokens / Style Dictionary
//   tailwind.css           Tailwind v4 @theme block
//   DESIGN.md              agent-readable design system (Open Design / motion-anything DESIGN.md layout)
//   motion-guidelines.md   filled brand motion guidelines (principles, tokens, library, logo rules, a11y)
//   report.txt             contrast audit + missing-field list
// Works with the plain brand-motion schema; the optional identity sections (strategy, voiceGuide, logoRules, imagery,
// iconography, sound, social, contact, paletteNames, paletteUsage) enrich the output. See templates/brand-kit.template.json.
import fs from 'node:fs';
import path from 'node:path';

const a = process.argv.slice(2), opt = k => { const i = a.indexOf(`--${k}`); return i >= 0 ? a[i + 1] : undefined; };
if (!opt('brand')) { console.error('usage: kit.mjs --brand <brand.json> [--out <dir>]'); process.exit(1); }
const brandPath = path.resolve(opt('brand')), bdir = path.dirname(brandPath);
const B = JSON.parse(fs.readFileSync(brandPath, 'utf8'));
const slug = (B.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const out = path.resolve(opt('out') || path.join(bdir, 'kit', slug));
fs.mkdirSync(out, { recursive: true });
const missing = [];
const need = (v, label) => { if (v == null || v === '' || (typeof v === 'string' && v.includes('<'))) missing.push(label); return v; };

// ---------------- colour ----------------
const pal = B.palette || {};
const ROLE_ORDER = ['bg', 'ink', 'primary', 'onPrimary', 'secondary', 'onSecondary', 'accent', 'onAccent', 'dark', 'onDark', 'chapter1', 'chapter2', 'chapter3', 'chapter4'];
const roles = [...new Set([...ROLE_ORDER.filter(r => pal[r] != null), ...Object.keys(pal).filter(k => !k.startsWith('_'))])];
const res = (c, d = 0) => (d > 8 || c == null ? c : pal[c] !== undefined ? res(pal[c], d + 1) : c);
const hex = c => { c = res(c); if (!c || c[0] !== '#') return null; let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join(''); return '#' + h.slice(0, 6).toLowerCase(); };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = v => '#' + v.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const mix = (h1, h2, t) => { const A = rgb(h1), Bc = rgb(h2); return toHex(A.map((v, i) => v + (Bc[i] - v) * t)); };
const lum = h => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (x, y) => { const L1 = lum(x), L2 = lum(y); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
const grade = r => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA Large' : 'Fail');
const hsl = h => { let [r, g, b] = rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let hh = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; } return `${Math.round(hh)}° ${Math.round(s * 100)}% ${Math.round(l * 100)}%`; };
const cmyk = h => { const [r, g, b] = rgb(h).map(v => v / 255), k = 1 - Math.max(r, g, b); if (k >= 1) return '0 0 0 100'; return [r, g, b].map(v => Math.round(((1 - v - k) / (1 - k)) * 100)).concat(Math.round(k * 100)).join(' '); };
const BG = hex('bg') || '#ffffff', INK = hex('ink') || '#111111';
const onFor = role => { const pair = { primary: 'onPrimary', secondary: 'onSecondary', accent: 'onAccent', dark: 'onDark', bg: 'ink' }[role]; if (pair && hex(pair)) return pair; const h = hex(role); return contrast(h, INK) >= contrast(h, BG) ? 'ink' : 'bg'; };
['bg', 'ink', 'primary', 'onPrimary'].forEach(r => need(pal[r], `palette.${r}`));
const audit = [];
roles.filter(r => !r.startsWith('on') && r !== 'ink' && hex(r)).forEach(r => { const on = onFor(r), c = contrast(hex(r), hex(on)); audit.push({ bg: r, fg: on, ratio: c, grade: grade(c) }); });
const ramp = h => [0.9, 0.75, 0.55, 0.3, 0, -0.2, -0.4, -0.6].map(t => (t >= 0 ? mix(h, '#ffffff', t) : mix(h, '#000000', -t)));

// ---------------- type ----------------
const T = B.type || {}, face = k => T[k] || {};
const fam = k => face(k).family ? `"${face(k).family}", ${face(k).fallback || 'sans-serif'}` : 'system-ui, sans-serif';
const scale = Object.assign({ display: 0.14, headline: 0.09, title: 0.065, body: 0.042, caption: 0.03 }, T.scale || {});
need(face('display').family, 'type.display.family'); need(face('body').family, 'type.body.family');

// ---------------- motion tokens ----------------
const M = B.motion || {}, energy = M.energy || 'balanced';
const DUR = { calm: [120, 200, 400, 700, 1000], balanced: [100, 160, 300, 500, 750], punchy: [80, 120, 220, 350, 500] }[energy] || [100, 160, 300, 500, 750];
const BEZ = { linear: [0, 0, 1, 1], inQuad: [0.11, 0, 0.5, 0], outQuad: [0.5, 1, 0.89, 1], inOutQuad: [0.45, 0, 0.55, 1], inCubic: [0.32, 0, 0.67, 0], outCubic: [0.33, 1, 0.68, 1], inOutCubic: [0.65, 0, 0.35, 1],
  outQuart: [0.25, 1, 0.5, 1], inOutQuart: [0.76, 0, 0.24, 1], inExpo: [0.7, 0, 0.84, 0], outExpo: [0.16, 1, 0.3, 1], inOutExpo: [0.87, 0, 0.13, 1], outBack: [0.34, 1.56, 0.64, 1], outBackSoft: [0.3, 1.3, 0.6, 1], inBack: [0.36, 0, 0.66, -0.56] };
const playful = ['circles', 'rounded', 'organic'].includes((B.shape || {}).language) && energy !== 'calm';
const ease = { enter: playful ? 'outBack' : 'outExpo', exit: M.exit || 'inCubic', move: M.move || 'inOutCubic', emphasis: energy === 'calm' ? 'outCubic' : 'outBack', loop: 'linear' };
const bz = n => `cubic-bezier(${(BEZ[n] || BEZ.outCubic).join(', ')})`;
const durations = { instant: DUR[0], fast: DUR[1], base: DUR[2], slow: DUR[3], slower: DUR[4] };
const stagger = Math.round((M.stagger || 0.06) * 1000);

// ---------------- logo ----------------
const L = B.logo || {};
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const dataUri = src => { if (!src) return null; if (/^(data:|https?:)/.test(src)) return src; const p = path.resolve(bdir, src); if (!fs.existsSync(p)) { missing.push(`logo file ${src}`); return null; } return `data:${MIME[path.extname(p).toLowerCase()] || 'image/png'};base64,${fs.readFileSync(p).toString('base64')}`; };
// images are embedded ONCE as CSS variables and painted as backgrounds, so the page stays small however often the logo appears
const ratioOf = src => { if (!src || /^(data:|https?:)/.test(src)) return 1.5; const p = path.resolve(bdir, src); if (!fs.existsSync(p)) return 1.5; const b = fs.readFileSync(p); return b.toString('ascii', 1, 4) === 'PNG' ? b.readUInt32BE(16) / b.readUInt32BE(20) : 1.5; };
const IMG = []; // [cssVar, dataUri, ratio]
const imgVar = (src) => { const d = dataUri(src); if (!d) return null; const k = `--img${IMG.length}`; IMG.push([k, d, ratioOf(src)]); return IMG[IMG.length - 1]; };
const logo = imgVar(L.src), logoDark = L.srcOnDark && L.srcOnDark !== L.src ? imgVar(L.srcOnDark) || logo : logo;
const LR = B.logoRules || {};
const wordmark = L.wordmark || B.name || 'Brand';
const logoTag = (im, cls = '', style = '') => (im ? `<i class="logo ${cls}" role="img" aria-label="${esc(B.name || 'logo')}" style="background-image:var(${im[0]});aspect-ratio:${im[2].toFixed(3)};${style}"></i>` : `<span class="wordmark ${cls}" style="${style}">${esc(wordmark)}</span>`);

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const list = arr => (arr && arr.length ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">Not specified yet.</p>');
const S = B.strategy || {}, VG = B.voiceGuide || {}, V = B.voice || {}, IM = B.imagery || {}, IC = B.iconography || {}, SND = B.sound || {}, SOC = B.social || {}, CT = B.contact || {};
const shape = B.shape || {}, layout = B.layout || {}, rules = B.rules || {};
const names = B.paletteNames || {};
const usage = B.paletteUsage || { bg: 60, primary: 25, secondary: 10, accent: 5 };

// ---------------- tokens.css / tokens.json / tailwind ----------------
const cssVars = [];
roles.forEach(r => { const h = hex(r); if (h) cssVars.push(`  --color-${r}: ${h};`); });
['primary', 'secondary', 'accent'].forEach(r => { const h = hex(r); if (h) ramp(h).forEach((c, i) => cssVars.push(`  --color-${r}-${[50, 100, 200, 300, 500, 600, 700, 800][i]}: ${c};`)); });
['display', 'headline', 'body'].forEach(k => { if (face(k).family) { cssVars.push(`  --font-${k}: ${fam(k)};`, `  --font-${k}-weight: ${face(k).weight || 400};`); } });
Object.entries(scale).forEach(([k, v]) => { if (!k.startsWith('_')) cssVars.push(`  --text-${k}: ${Math.round(v * 1080)}px; /* at 1080px frame short side */`); });
cssVars.push(`  --radius: ${Math.round((shape.radius || 0.03) * 1080)}px;`, `  --stroke: ${Math.round((shape.strokeW || 0.008) * 1080)}px;`, `  --safe: ${Math.round((layout.safe || 0.08) * 100)}%;`);
Object.entries(durations).forEach(([k, v]) => cssVars.push(`  --duration-${k}: ${v}ms;`));
Object.entries(ease).forEach(([k, v]) => cssVars.push(`  --ease-${k}: ${bz(v)};`));
cssVars.push(`  --stagger: ${stagger}ms;`);
const tokensCss = `/* ${B.name} design tokens — generated by brand-kit/scripts/kit.mjs from ${path.basename(brandPath)}. Edit the brand JSON, not this file. */\n:root {\n${cssVars.join('\n')}\n}\n@media (prefers-reduced-motion: reduce) {\n  :root { ${Object.keys(durations).map(k => `--duration-${k}: 1ms;`).join(' ')} --stagger: 0ms; }\n}\n`;
const dtcg = { color: {}, font: {}, fontWeight: {}, dimension: {}, duration: {}, cubicBezier: {} };
roles.forEach(r => { const h = hex(r); if (h) dtcg.color[r] = { $type: 'color', $value: h, ...(names[r] ? { $description: names[r] } : {}) }; });
['display', 'headline', 'body'].forEach(k => { if (face(k).family) { dtcg.font[k] = { $type: 'fontFamily', $value: [face(k).family, ...(face(k).fallback || 'sans-serif').split(',').map(s => s.trim().replace(/'/g, ''))] }; dtcg.fontWeight[k] = { $type: 'fontWeight', $value: face(k).weight || 400 }; } });
Object.entries(scale).forEach(([k, v]) => { if (!k.startsWith('_')) dtcg.dimension[`text-${k}`] = { $type: 'dimension', $value: `${Math.round(v * 1080)}px` }; });
dtcg.dimension.radius = { $type: 'dimension', $value: `${Math.round((shape.radius || 0.03) * 1080)}px` };
Object.entries(durations).forEach(([k, v]) => (dtcg.duration[k] = { $type: 'duration', $value: `${v}ms` }));
Object.entries(ease).forEach(([k, v]) => (dtcg.cubicBezier[k] = { $type: 'cubicBezier', $value: BEZ[v] || BEZ.outCubic }));
const tailwind = `/* ${B.name} — Tailwind v4 theme. @import "tailwindcss"; then this file. */\n@theme {\n${roles.filter(r => hex(r)).map(r => `  --color-${r}: ${hex(r)};`).join('\n')}\n${['display', 'headline', 'body'].filter(k => face(k).family).map(k => `  --font-${k}: ${fam(k)};`).join('\n')}\n  --radius-brand: ${Math.round((shape.radius || 0.03) * 1080)}px;\n${Object.entries(ease).map(([k, v]) => `  --ease-${k}: ${bz(v)};`).join('\n')}\n}\n`;

// ---------------- DESIGN.md ----------------
const designMd = `# Design System: ${B.name}

> ${esc(B.tagline || S.promise || '')}
> Generated from \`${path.basename(brandPath)}\` by brand-kit. Colour and type are referenced by ROLE everywhere (storyboards, CSS, components).

## 1. Visual Theme & Atmosphere
${S.personality && S.personality.traits ? `Personality: **${S.personality.traits.join(', ')}**${S.personality.archetype ? ` (archetype: ${S.personality.archetype})` : ''}.` : `Tone: **${V.tone || 'not set'}**.`}
Shape language: **${shape.language || 'rounded'}** — signature motif: ${shape.motif || 'not set'}.
Motion energy: **${energy}**${M.signatureTransition ? `, signature transition **${M.signatureTransition}**` : ''}.
${IM.style ? `Imagery: ${IM.style}.` : ''}

## 2. Color Palette & Roles
| Role | Hex | Name | Text on it | Contrast |
|---|---|---|---|---|
${roles.filter(r => hex(r)).map(r => { const on = onFor(r), c = contrast(hex(r), hex(on)); return `| \`${r}\` | ${hex(r)} | ${names[r] || ''} | \`${on}\` | ${c.toFixed(2)} (${grade(c)}) |`; }).join('\n')}

Usage ratio: ${Object.entries(usage).map(([k, v]) => `${k} ${v}%`).join(' · ')}.

## 3. Typography Rules
| Role | Family | Weight | Case | Tracking | Line height | Size @1080 |
|---|---|---|---|---|---|---|
${['display', 'headline', 'body'].map(k => `| ${k} | ${face(k).family || '—'} | ${face(k).weight || '—'} | ${face(k).case || 'none'} | ${face(k).tracking ?? 0} | ${face(k).lineHeight ?? '—'} | ${Math.round((scale[k] || 0.05) * 1080)}px |`).join('\n')}
| title | (headline face) | | | | | ${Math.round(scale.title * 1080)}px |
| caption | (body face) | | | | | ${Math.round(scale.caption * 1080)}px |

Copy: at most **${V.maxWordsPerCard || 4} words per card** in motion, set in **${V.case || 'sentence'}** case. Default CTA: “${V.cta || ''}”.

## 4. Component Stylings
- **Buttons / CTA chips**: \`primary\` fill, \`onPrimary\` label, radius ${Math.round((shape.radius || 0.03) * 1080)}px@1080 (pill when shape language is rounded/circles).
- **Cards**: \`bg\` fill, \`ink\` text, ${shape.language === 'sharp' ? 'square corners, 2px rules' : 'soft radius, tinted shadow (never pure black)'}.
- **Highlights / badges**: \`accent\` sparingly — price, a single word, a sticker.
- **Logo lock-up**: clear space ${L.clearSpace || 0.5}× logo height on every side${LR.minSize ? `; minimum ${LR.minSize.px || '?'}px on screen` : ''}.

## 5. Spacing & Layout
- Safe area: ${Math.round((layout.safe || 0.08) * 100)}% of the short side on every edge (vertical video: keep the bottom 19% and the right 12% clear of text for platform UI).
- Alignment: ${layout.alignment || 'center'}. Base spacing unit 8px; spacing scale 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96.

## 6. Motion
| Token | Value |
|---|---|
${Object.entries(durations).map(([k, v]) => `| duration-${k} | ${v}ms |`).join('\n')}
${Object.entries(ease).map(([k, v]) => `| ease-${k} | \`${bz(v)}\` (${v}) |`).join('\n')}
| stagger | ${stagger}ms |

Entrances use \`ease-enter\`, exits use \`ease-exit\` and are one step shorter, on-screen moves use \`ease-move\`, loops are linear. One hero motion per scene.

## 7. Usage Guardrails
${(rules.do || []).map(x => `- ✅ ${x}`).join('\n')}
${(rules.dont || []).map(x => `- ❌ ${x}`).join('\n')}
- ❌ Never distort, recolour or rotate the logo; never place it inside the safe-area margin.
- ❌ No pure-black shadows on tinted backgrounds; tint shadows with \`ink\`.
`;

// ---------------- motion-guidelines.md ----------------
const motionMd = `# ${B.name} — Motion Guidelines
Version 1 · generated by brand-kit from ${path.basename(brandPath)} · energy: **${energy}**

## 1. Principles
${(B.motionPrinciples || [
  `Feel ${(V.tone || 'on-brand').split(',')[0].trim()}, not generic — every move should be something only ${B.name} would do.`,
  'One hero motion per scene; everything else supports it.',
  `Arrive with ${ease.enter === 'outBack' ? 'a soft overshoot' : 'a confident deceleration'}, leave faster than you came.`,
  'Something meaningful moves at least every 0.8s — but nothing moves without a reason.',
]).map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 2. Timing tokens
${Object.entries(durations).map(([k, v]) => `- \`duration-${k}\` = ${v}ms`).join('\n')}
- Video scenes: ${energy === 'calm' ? '3–4s' : energy === 'punchy' ? '1–2s, cut on the beat' : '2–3s'} per idea; end card held ≥ 2s (≥ 3s for spots over 20s).

## 3. Easing tokens
${Object.entries(ease).map(([k, v]) => `- \`ease-${k}\` = \`${bz(v)}\``).join('\n')}

## 4. Motion library
| Pattern | Tokens |
|---|---|
| Fade + rise in | duration-base · ease-enter · 16px travel |
| Pop / scale in | duration-base · ease-emphasis · 0.6→1 |
| Exit | duration-fast · ease-exit · continue the direction of travel |
| Scene transition | duration-slow · ease-move · **${M.signatureTransition || 'cut'}** (the signature) |
| List / lineup | duration-fast per item · ${stagger}ms stagger |
| Logo sting | duration-slower · ease-emphasis · whole-logo pop or rise only |
| Ambient loops | float / pulse / sway, subtle, linear or sine |

## 5. Logo animation
- Allowed: pop, rise, scale or wipe in as one piece; gentle float or jelly while parked.
- Never: stretch, rotate freely, recolour, animate letters apart, or animate it on every appearance.

## 6. Feedback & states (product UI)
Loading: skeletons for layout, spinner only for short waits. Success/error: always paired with a label or icon. Hover/focus: duration-fast, visible focus ring that never animates away.

## 7. Accessibility
- Honour reduced motion: swap travel/scale for opacity cross-fades (tokens.css sets all durations to 1ms).
- No more than 3 flashes per second; no full-screen strobing.
- Burned-in captions on every spoken line in social video (most feeds autoplay muted).

## 8. Do / Don't
${(rules.do || []).map(x => `- ✅ ${x}`).join('\n')}
${(rules.dont || []).map(x => `- ❌ ${x}`).join('\n')}
`;

// ---------------- brand-book.html ----------------
const swatch = r => { const h = hex(r); if (!h) return ''; const on = onFor(r), c = contrast(h, hex(on)); const [R, G, Bb] = rgb(h);
  return `<figure class="sw"><div class="chip" style="background:${h};color:${hex(on)}"><b>${esc(names[r] || r)}</b><span>Aa</span></div><figcaption><code>${r}</code><span>${h.toUpperCase()}</span><span>RGB ${R} ${G} ${Bb}</span><span>HSL ${hsl(h)}</span><span>CMYK ${cmyk(h)}</span><span class="badge ${grade(c).replace(' ', '')}">${c.toFixed(2)} · ${grade(c)} with ${on}</span></figcaption></figure>`; };
const rampRow = r => { const h = hex(r); if (!h) return ''; return `<div class="ramp"><span class="lab">${r}</span>${ramp(h).map((c, i) => `<i style="background:${c}" title="${[50, 100, 200, 300, 500, 600, 700, 800][i]} ${c}"><em style="color:${contrast(c, '#000') > 8 ? '#000' : '#fff'}">${[50, 100, 200, 300, 500, 600, 700, 800][i]}</em></i>`).join('')}</div>`; };
const specimen = (k, text) => { const f = k === 'title' ? 'headline' : k === 'caption' ? 'body' : k, F = face(f), px = Math.round((scale[k] || 0.05) * 1080);
  return `<div class="spec"><div class="meta"><code>${k}</code> ${esc(F.family || '')} · ${F.weight || ''} · ${px}px @1080</div><div style="font-family:${fam(f).replace(/"/g, "'")};font-weight:${F.weight || 400};font-size:clamp(14px,${((scale[k] || 0.05) * 62).toFixed(2)}vw,${Math.round(px * 0.6)}px);line-height:${F.lineHeight || 1.1};letter-spacing:${F.tracking || 0}em;text-transform:${({ upper: 'uppercase', lower: 'lowercase' })[F.case] || 'none'}">${esc(text)}</div></div>`; };
const easeDemo = ([k, v]) => `<div class="ease"><div class="el"><code>ease-${k}</code><small>${bz(v)}</small></div><div class="track"><span class="dot" style="animation-timing-function:${bz(v)};animation-duration:${k === 'exit' ? durations.slow : durations.slower * 1.6}ms"></span></div></div>`;
const FORMATS = [['9:16', 'Reels · TikTok · Shorts · Stories', 1080, 1920, [13, 19, 6, 12]], ['4:5', 'Feed portrait', 1080, 1350, [8, 8, 6, 6]], ['1:1', 'Feed square', 1080, 1080, [7, 7, 7, 7]], ['16:9', 'YouTube · web · TV', 1920, 1080, [5, 5, 5, 5]]];
const safeDiag = ([name, use, w, h, s]) => `<div class="fmt"><div class="frame" style="aspect-ratio:${w}/${h}"><div class="safe" style="top:${s[0]}%;bottom:${s[1]}%;left:${s[2]}%;right:${s[3]}%"><span>${logo ? logoTag(logo, 'mini') : esc(wordmark)}</span></div></div><b>${name}</b><small>${w}×${h} · ${use}</small></div>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(B.name)} Brand Book</title>
${(T.fontUrls || []).map(u => `<link rel="stylesheet" href="${esc(u)}">`).join('\n')}
<style>
:root{__IMGVARS__${roles.filter(r => hex(r)).map(r => `--${r}:${hex(r)}`).join(';')};--fd:${fam('display')};--fh:${fam('headline')};--fb:${fam('body')};--r:${Math.max(4, Math.round((shape.radius || 0.03) * 400))}px;--d-base:${durations.base}ms;--d-slow:${durations.slow}ms;--ease-enter:${bz(ease.enter)};--ease-emph:${bz(ease.emphasis)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--fb);line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}code{font-family:ui-monospace,Menlo,monospace;font-size:.85em;background:color-mix(in srgb,var(--ink) 7%,transparent);padding:.1em .35em;border-radius:4px}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
nav{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
nav .wrap{display:flex;gap:18px;overflow-x:auto;padding:12px 20px;font:600 14px var(--fb);white-space:nowrap}nav a{text-decoration:none;opacity:.75}nav a:hover{opacity:1}
header{background:var(--primary);color:var(--onPrimary);padding:72px 0 64px;overflow:hidden;position:relative}
i.logo{display:block;background:center/contain no-repeat;width:100%}.safe i.logo.mini{width:60%;max-height:40px}
header .logo{width:min(460px,72vw);filter:drop-shadow(0 6px 18px color-mix(in srgb,var(--ink) 25%,transparent))}
header .wordmark{font:${face('display').weight || 800} clamp(48px,10vw,120px)/1 var(--fd)}
header h1{font:${face('headline').weight || 700} clamp(22px,4vw,40px)/1.1 var(--fh);margin:24px 0 6px}header p{margin:0;opacity:.9;max-width:60ch}
.hero-logo{background:var(--bg);display:inline-block;padding:28px 36px;border-radius:calc(var(--r)*2)}
section{padding:64px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
h2{font:${face('display').weight || 800} clamp(30px,5vw,52px)/1 var(--fd);margin:0 0 8px;color:var(--primary)}h3{font:${face('headline').weight || 700} 22px/1.2 var(--fh);margin:28px 0 10px}
.lead{max-width:68ch;opacity:.85;margin:0 0 24px}.muted{opacity:.6}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.card{background:color-mix(in srgb,var(--ink) 4%,var(--bg));border-radius:var(--r);padding:20px}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips span{background:var(--primary);color:var(--onPrimary);padding:6px 14px;border-radius:99px;font-weight:700}
.sw{margin:0}.sw .chip{height:130px;border-radius:var(--r) var(--r) 0 0;display:flex;justify-content:space-between;align-items:flex-end;padding:14px;font-family:var(--fh);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 10%,transparent)}
.sw .chip span{font:${face('display').weight || 800} 40px/1 var(--fd)}.sw figcaption{display:flex;flex-direction:column;gap:2px;padding:12px;font-size:13px;background:color-mix(in srgb,var(--ink) 4%,var(--bg));border-radius:0 0 var(--r) var(--r)}
.badge{margin-top:6px;align-self:flex-start;font-weight:700;padding:2px 8px;border-radius:99px;background:#d9f2e0;color:#14532d}.badge.AALarge{background:#fff1c2;color:#7a4d00}.badge.Fail{background:#ffd6d6;color:#8a1111}
.ramp{display:flex;align-items:stretch;margin:6px 0;border-radius:10px;overflow:hidden}.ramp .lab{width:96px;flex:none;font:600 13px var(--fb);display:flex;align-items:center}.ramp i{flex:1;height:44px;display:flex;align-items:flex-end;padding:4px}.ramp em{font:600 10px var(--fb);font-style:normal;opacity:.8}
.usage{display:flex;height:56px;border-radius:var(--r);overflow:hidden;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 12%,transparent)}.usage div{display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.logos{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}.lbox{border-radius:var(--r);aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.lbox .logo{width:62%;max-height:58%}.lbox .wordmark{font:${face('display').weight || 800} 44px/1 var(--fd);color:var(--${L.color || 'primary'})}.lbox small{position:absolute;left:12px;bottom:8px;font-size:12px;opacity:.75}
.clear{outline:2px dashed color-mix(in srgb,var(--primary) 70%,transparent);outline-offset:calc(${L.clearSpace || 0.5} * 3.2em)}
.misuse .lbox::after{content:"✕";position:absolute;top:8px;right:12px;font:800 22px var(--fb);color:#c0182b}
.spec{padding:18px 0;border-top:1px dashed color-mix(in srgb,var(--ink) 15%,transparent)}.spec .meta{font-size:13px;opacity:.7;margin-bottom:6px}
.ease{display:grid;grid-template-columns:minmax(150px,240px) 1fr;gap:16px;align-items:center;padding:10px 0}.ease small{display:block;opacity:.6;font-size:12px}
.track{height:36px;border-radius:99px;background:color-mix(in srgb,var(--ink) 6%,var(--bg));position:relative}.dot{position:absolute;top:6px;left:6px;width:24px;height:24px;border-radius:50%;background:var(--primary);animation:slide 2s infinite alternate}
@keyframes slide{to{left:calc(100% - 30px)}}
.demos{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}.demo{height:140px;border-radius:var(--r);background:color-mix(in srgb,var(--ink) 5%,var(--bg));display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;font-size:12px}
.demo b{width:64px;height:64px;border-radius:${shape.language === 'sharp' ? '4px' : '50%'};background:var(--accent);display:block}
.d1 b{animation:rise 1.6s var(--ease-enter) infinite}.d2 b{animation:pop 1.6s var(--ease-emph) infinite}.d3 b{animation:wipe 1.6s var(--ease-enter) infinite}.d4 b{animation:float 3s ease-in-out infinite}
@keyframes rise{0%{opacity:0;transform:translateY(24px)}40%,100%{opacity:1;transform:none}}@keyframes pop{0%{transform:scale(0)}40%,100%{transform:scale(1)}}@keyframes wipe{0%{clip-path:inset(0 100% 0 0)}45%,100%{clip-path:inset(0 0 0 0)}}@keyframes float{50%{transform:translateY(-10px)}}
.formats{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));align-items:end}.fmt{display:flex;flex-direction:column;gap:4px;font-size:13px}.fmt small{opacity:.65}
.frame{background:var(--chapter1,var(--secondary));border-radius:10px;position:relative;max-height:300px}.safe{position:absolute;border:2px dashed color-mix(in srgb,var(--ink) 45%,transparent);border-radius:6px;display:flex;align-items:center;justify-content:center}.safe span{font:700 13px var(--fd);width:100%;display:flex;justify-content:center}
.dd{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.dd .card ul{margin:0;padding-left:20px}.do h3{color:#15803d}.dont h3{color:#b91c1c}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent);vertical-align:top}
details{margin:10px 0}summary{cursor:pointer;font-weight:700}pre{background:var(--dark,#111);color:var(--onDark,#eee);padding:16px;border-radius:var(--r);overflow:auto;font-size:12px;max-height:420px}
footer{padding:40px 0 60px;opacity:.7;font-size:13px}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style></head><body>
<nav><div class="wrap"><b>${esc(B.name)}</b><a href="#strategy">Strategy</a><a href="#voice">Voice</a><a href="#logo">Logo</a><a href="#color">Colour</a><a href="#type">Type</a><a href="#shape">Shape</a><a href="#imagery">Imagery</a><a href="#layout">Layout</a><a href="#motion">Motion</a><a href="#sound">Sound</a><a href="#social">Social</a><a href="#rules">Do / Don't</a><a href="#tokens">Tokens</a></div></nav>
<header><div class="wrap"><div class="hero-logo">${logoTag(logo)}</div><h1>${esc(B.tagline || S.promise || 'Brand guidelines')}</h1><p>${esc(S.positioning || `The ${B.name} brand book: how we look, sound and move.`)}</p></div></header>
<main class="wrap">
<section id="strategy"><h2>Strategy</h2><p class="lead">${esc(S.mission || 'Who we are and why we exist. (Add strategy.mission to the brand file.)')}</p>
<div class="grid">${S.vision ? `<div class="card"><h3>Vision</h3><p>${esc(S.vision)}</p></div>` : ''}${S.promise ? `<div class="card"><h3>Brand promise</h3><p>${esc(S.promise)}</p></div>` : ''}<div class="card"><h3>Values</h3>${list(S.values)}</div><div class="card"><h3>Audience</h3>${list((S.audience || []).map(p => (typeof p === 'string' ? p : `${p.name}: ${p.need || ''}`)))}</div></div>
${S.personality ? `<h3>Personality</h3><div class="chips">${(S.personality.traits || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>${S.personality.isNot ? `<p class="muted">We are not: ${esc(S.personality.isNot.join(', '))}.</p>` : ''}` : ''}</section>
<section id="voice"><h2>Voice &amp; tone</h2><p class="lead">We sound <b>${esc(V.tone || '—')}</b>. On-screen copy: max <b>${V.maxWordsPerCard || 4}</b> words per card, ${esc(V.case || 'sentence')} case. Default CTA: <b>“${esc(V.cta || '')}”</b>.</p>
<div class="grid">${(VG.pillars || []).map(p => `<div class="card"><h3>${esc(p.name)}</h3><p>${esc(p.means || '')}</p>${p.notMeans ? `<p class="muted">Not: ${esc(p.notMeans)}</p>` : ''}</div>`).join('') || '<div class="card"><p class="muted">Add voiceGuide.pillars.</p></div>'}
<div class="card"><h3>Say</h3>${list((VG.vocabulary || {}).use)}</div><div class="card"><h3>Avoid</h3>${list((VG.vocabulary || {}).avoid)}</div></div>
${(VG.examples || []).length ? `<h3>Rewrite examples</h3><table><tr><th>Instead of</th><th>We say</th></tr>${VG.examples.map(e => `<tr><td>${esc(e.bad)}</td><td><b>${esc(e.good)}</b></td></tr>`).join('')}</table>` : ''}</section>
<section id="logo"><h2>Logo</h2><p class="lead">Clear space: ${L.clearSpace || 0.5}× the logo height on every side${LR.minSize ? `. Minimum size: ${LR.minSize.px || '—'}px on screen${LR.minSize.mm ? `, ${LR.minSize.mm}mm in print` : ''}` : ''}.</p>
<div class="logos"><div class="lbox" style="background:var(--bg)">${logoTag(logo, 'clear')}<small>On bg · clear space shown</small></div><div class="lbox" style="background:var(--${hex('chapter1') ? 'chapter1' : 'secondary'})">${logoTag(logo)}<small>On ${hex('chapter1') ? 'chapter1' : 'secondary'}</small></div><div class="lbox" style="background:var(--dark,var(--ink))">${logoTag(logoDark)}<small>On dark</small></div>${(LR.variants || []).map(v => `<div class="lbox" style="background:var(--bg)">${logoTag(imgVar(v.src))}<small>${esc(v.name)} — ${esc(v.use || '')}</small></div>`).join('')}</div>
<h3>Never</h3><div class="logos misuse">
<div class="lbox" style="background:var(--bg)">${logoTag(logo, '', 'transform:scaleX(1.45)')}<small>Stretch or squash</small></div>
<div class="lbox" style="background:var(--bg)">${logoTag(logo, '', 'transform:rotate(-14deg)')}<small>Rotate</small></div>
<div class="lbox" style="background:var(--bg)">${logoTag(logo, '', 'filter:hue-rotate(140deg) saturate(1.6)')}<small>Recolour off-palette</small></div>
<div class="lbox" style="background:repeating-linear-gradient(45deg,var(--primary) 0 14px,var(--accent) 14px 28px)">${logoTag(logo)}<small style="color:#fff">Busy backgrounds</small></div>
${(LR.misuse || []).map(m => `<div class="lbox" style="background:var(--bg)"><small>${esc(m)}</small></div>`).join('')}</div></section>
<section id="color"><h2>Colour</h2><p class="lead">Every design references colours by <b>role</b>, never by hex, so the whole system re-skins from one file. Contrast is computed (WCAG 2.1): text needs 4.5:1, display text 3:1.</p>
<div class="grid">${roles.filter(r => !r.startsWith('on') && hex(r)).map(swatch).join('')}</div>
<h3>Tints &amp; shades</h3>${['primary', 'secondary', 'accent'].map(rampRow).join('')}
<h3>Usage ratio</h3><div class="usage">${Object.entries(usage).map(([r, v]) => `<div style="flex:${v};background:var(--${r});color:${hex(onFor(r))}">${r} ${v}%</div>`).join('')}</div></section>
<section id="type"><h2>Typography</h2><p class="lead">${esc(face('display').family || '—')} for display, ${esc(face('headline').family || '—')} for headlines, ${esc(face('body').family || '—')} for text. Sizes are fractions of the frame's short side (shown at 1080px).</p>
${specimen('display', B.tagline || 'Worth every wait.')}${specimen('headline', 'A headline that earns the scroll')}${specimen('title', 'Section title · 123')}${specimen('body', 'Body copy is set for comfortable reading on small screens, with generous line height and short lines.')}${specimen('caption', 'CAPTION · LOWER THIRDS · LEGAL')}</section>
<section id="shape"><h2>Shape &amp; motif</h2><div class="grid"><div class="card"><h3>Language</h3><p><b>${esc(shape.language || '—')}</b> · radius ${Math.round((shape.radius || 0.03) * 1080)}px@1080 · stroke ${Math.round((shape.strokeW || 0.008) * 1080)}px</p></div><div class="card"><h3>Signature motif</h3><p>${esc(shape.motif || 'Add shape.motif')}</p></div>${IC.style ? `<div class="card"><h3>Iconography</h3><p>${esc(IC.style)}</p></div>` : ''}</div></section>
<section id="imagery"><h2>Imagery</h2><p class="lead">${esc(IM.style || 'Describe the photo / illustration style in imagery.style.')}</p><div class="dd"><div class="card do"><h3>Do</h3>${list(IM.do)}</div><div class="card dont"><h3>Don't</h3>${list(IM.dont)}</div></div></section>
<section id="layout"><h2>Layout &amp; formats</h2><p class="lead">Safe area: ${Math.round((layout.safe || 0.08) * 100)}% of the short side. Vertical video also keeps the bottom ~19% and the right ~12% free of text (captions, buttons, handle). Alignment: ${esc(layout.alignment || 'center')}.</p><div class="formats">${FORMATS.map(safeDiag).join('')}</div></section>
<section id="motion"><h2>Motion</h2><p class="lead">Energy: <b>${energy}</b>${M.signatureTransition ? ` · signature transition: <b>${esc(M.signatureTransition)}</b>` : ''} · ${M.bpm || 120} bpm grid. Entrances decelerate, exits accelerate and are shorter, loops are linear.</p>
<table><tr><th>Duration token</th><th>Value</th></tr>${Object.entries(durations).map(([k, v]) => `<tr><td><code>duration-${k}</code></td><td>${v}ms</td></tr>`).join('')}<tr><td><code>stagger</code></td><td>${stagger}ms</td></tr></table>
<h3>Easing tokens (live)</h3>${Object.entries(ease).map(easeDemo).join('')}
<h3>Pattern library (live)</h3><div class="demos"><div class="demo d1"><b></b>Rise in · enter</div><div class="demo d2"><b></b>Pop · emphasis</div><div class="demo d3"><b></b>Wipe · enter</div><div class="demo d4"><b></b>Float · ambient</div></div></section>
<section id="sound"><h2>Sound</h2><div class="grid"><div class="card"><h3>Music</h3><p>${esc(SND.music || ({ calm: 'Soft, warm, sparse (pads, piano, music box).', balanced: 'Bright and friendly, mid-tempo (plucks, bells, light percussion).', punchy: 'Driving and percussive, beat-cut (kick, claps, bass).' })[energy])}</p></div><div class="card"><h3>Sonic logo</h3><p>${esc(SND.sonicLogo || 'A short rising chime on the logo reveal.')}</p></div><div class="card"><h3>Voice</h3><p>${esc(SND.voice || 'Warm, natural read; captions on every spoken line.')}</p></div></div></section>
<section id="social"><h2>Social</h2>${SOC.handles ? `<p class="lead">${Object.entries(SOC.handles).map(([k, v]) => `${esc(k)}: <b>${esc(v)}</b>`).join(' · ')}</p>` : ''}
<table><tr><th>Placement</th><th>Size</th><th>Length</th><th>Notes</th></tr>
<tr><td>Reels / TikTok / Shorts</td><td>1080×1920</td><td>7–30s (hook in 1s)</td><td>Captions burned in; keep text out of the bottom 19% and right 12%.</td></tr>
<tr><td>Stories</td><td>1080×1920</td><td>≤15s per card</td><td>Top 14% and bottom 20% hold UI.</td></tr>
<tr><td>Feed (portrait)</td><td>1080×1350</td><td>6–20s</td><td>Most screen real estate in feed.</td></tr>
<tr><td>Feed (square)</td><td>1080×1080</td><td>6–20s</td><td>Universal fallback.</td></tr>
<tr><td>YouTube / web</td><td>1920×1080</td><td>15–60s</td><td>Title-safe 5% (10% for broadcast).</td></tr></table></section>
<section id="rules"><h2>Do &amp; don't</h2><div class="dd"><div class="card do"><h3>Do</h3>${list(rules.do)}</div><div class="card dont"><h3>Don't</h3>${list(rules.dont)}</div></div></section>
<section id="tokens"><h2>Tokens</h2><p class="lead">Generated from the brand file. Copy into code, Figma Tokens or Tailwind.</p>
<details open><summary>tokens.css</summary><pre>${esc(tokensCss)}</pre></details><details><summary>tailwind.css</summary><pre>${esc(tailwind)}</pre></details><details><summary>tokens.json (W3C DTCG)</summary><pre>${esc(JSON.stringify(dtcg, null, 2))}</pre></details></section>
</main>
<footer><div class="wrap">${esc(B.name)} brand book · generated from ${esc(path.basename(brandPath))}${CT.url || B.url ? ` · ${esc(CT.url || B.url)}` : ''}${CT.phone ? ` · ${esc(CT.phone)}` : ''}</div></footer>
</body></html>`;

const page = html.replace('__IMGVARS__', IMG.map(([k, d]) => `${k}:url("${d}");`).join(''));
fs.writeFileSync(path.join(out, 'brand-book.html'), page);
fs.writeFileSync(path.join(out, 'tokens.css'), tokensCss);
fs.writeFileSync(path.join(out, 'tokens.json'), JSON.stringify(dtcg, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'tailwind.css'), tailwind);
fs.writeFileSync(path.join(out, 'DESIGN.md'), designMd);
fs.writeFileSync(path.join(out, 'motion-guidelines.md'), motionMd);
const optional = { strategy: 'strategy (mission, values, audience, personality)', voiceGuide: 'voiceGuide (pillars, vocabulary, examples)', logoRules: 'logoRules (minSize, variants, misuse)', imagery: 'imagery (style, do, dont)', sound: 'sound', social: 'social.handles', paletteNames: 'paletteNames' };
const enrich = Object.entries(optional).filter(([k]) => !B[k]).map(([, v]) => v);
const report = [`${B.name} brand kit → ${out}`, '', 'Contrast audit (background role → best text role):',
  ...audit.map(x => `  ${x.grade === 'Fail' ? '✗' : x.grade === 'AA Large' ? '~' : '✓'} ${x.bg.padEnd(12)} ${x.fg.padEnd(11)} ${x.ratio.toFixed(2).padStart(5)}  ${x.grade}`),
  '', missing.length ? `Missing required: ${missing.join(', ')}` : 'All required fields present.', enrich.length ? `Optional sections not yet filled (brand book shows placeholders): ${enrich.join('; ')}` : 'All identity sections filled.'].join('\n');
fs.writeFileSync(path.join(out, 'report.txt'), report + '\n');
console.log(report);
console.log(`\nwrote brand-book.html (${(page.length / 1024).toFixed(0)} KB), tokens.css, tokens.json, tailwind.css, DESIGN.md, motion-guidelines.md, report.txt`);
