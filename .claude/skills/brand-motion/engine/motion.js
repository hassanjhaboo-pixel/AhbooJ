/* brand-motion engine — deterministic, dependency-free canvas renderer.
 * Every frame is a pure function of time: MG.seek(t) always draws the same pixels,
 * which is what lets scripts/render.mjs capture frame-perfect MP4s.
 *
 * Inputs: a BRAND (tokens) and a STORY (scenes + elements). See references/engine-api.md.
 */
(function (global) {
  'use strict';

  // ---------- math + easing ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const DEG = Math.PI / 180;

  const EASE = {
    linear: t => t,
    inQuad: t => t * t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: t => t * t * t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: t => 1 - Math.pow(1 - t, 4),
    inOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inExpo: t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: t => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outBackSoft: t => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
    outElastic: t => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; },
    outBounce: t => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };

  // Seeded PRNG so "random" fields are identical on every render.
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  // ---------- entrance / exit effects ----------
  // Each takes eased progress e (0 → 1 = hidden → settled) and frame info, returns a transform delta.
  // `ease` is the default easing when the storyboard doesn't specify one.
  const FX = {
    none: { ease: 'linear', f: () => ({}) },
    cut: { ease: 'linear', f: e => ({ o: e > 0 ? 1 : 0 }) },
    fade: { ease: 'outCubic', f: e => ({ o: e }) },
    pop: { ease: 'outBack', f: e => ({ o: clamp(e * 4), s: Math.max(0, e) }) },
    'pop-soft': { ease: 'outBackSoft', f: e => ({ o: clamp(e * 3), s: 0.6 + 0.4 * e }) },
    rise: { ease: 'outCubic', f: (e, k) => ({ o: e, dy: (1 - e) * k.U * 0.06 }) },
    sink: { ease: 'outCubic', f: (e, k) => ({ o: e, dy: -(1 - e) * k.U * 0.06 }) },
    'mask-up': { ease: 'outExpo', f: (e, k) => ({ dy: (1 - e) * k.h * 1.15, clip: true }) },
    'mask-down': { ease: 'outExpo', f: (e, k) => ({ dy: -(1 - e) * k.h * 1.15, clip: true }) },
    'slide-left': { ease: 'outExpo', f: (e, k) => ({ dx: (1 - e) * k.W }) },
    'slide-right': { ease: 'outExpo', f: (e, k) => ({ dx: -(1 - e) * k.W }) },
    'slide-up': { ease: 'outExpo', f: (e, k) => ({ dy: (1 - e) * k.H }) },
    'slide-down': { ease: 'outExpo', f: (e, k) => ({ dy: -(1 - e) * k.H }) },
    drop: { ease: 'outBounce', f: (e, k) => ({ dy: -(1 - e) * k.H * 0.7 }) },
    'drop-soft': { ease: 'outBack', f: (e, k) => ({ dy: -(1 - e) * k.H * 0.5, o: clamp(e * 5) }) },
    fly: { ease: 'outBack', f: (e, k) => ({ dy: (1 - e) * k.H * 0.75, r: -(1 - e) * 35 * DEG }) },
    grow: { ease: 'outExpo', f: e => ({ sx: Math.max(0, e) }) },
    'grow-y': { ease: 'outExpo', f: e => ({ sy: Math.max(0, e) }) },
    scale: { ease: 'outExpo', f: e => ({ s: Math.max(0, e), o: clamp(e * 3) }) },
    'scale-down': { ease: 'outExpo', f: e => ({ s: 1 + (1 - e) * 0.6, o: e }) },
    'spin-in': { ease: 'outBack', f: e => ({ s: Math.max(0, e), r: (1 - e) * -180 * DEG }) },
    'blur-in': { ease: 'outCubic', f: e => ({ o: e, blur: (1 - e) * 24 }) },
    draw: { ease: 'inOutCubic', f: e => ({ reveal: clamp(e) }) },
    wipe: { ease: 'outExpo', f: e => ({ wipe: clamp(e) }) },
    iris: { ease: 'outCubic', f: e => ({ iris: clamp(e) }) },
    'dot-expand': {
      ease: 'linear',
      f: (e, k) => {
        // 0–35%: a dot pops in. 35–100%: the dot swells and the element bursts out of it.
        const a = clamp(e / 0.35), b = clamp((e - 0.35) / 0.65);
        return { dot: { r: k.U * 0.035 * EASE.outBack(a) * (1 + 1.6 * EASE.outCubic(b)), o: 1 - b }, s: 0.25 + 0.75 * EASE.outBack(b), o: b > 0 ? clamp(b * 3) : 0 };
      },
    },
    type: { ease: 'linear', f: e => ({ o: e > 0 ? 1 : 0 }) }, // used per-character, see text drawer
  };

  // ---------- color + token resolution ----------
  function makeResolver(brand) {
    const pal = (brand && brand.palette) || {};
    const color = c => {
      if (c == null) return null;
      if (typeof c !== 'string') return c;
      if (pal[c] !== undefined) return color(pal[c]); // tokens may alias other tokens
      return c; // literal css color
    };
    return color;
  }

  // ---------- time parsing: numbers are seconds; "4b" = 4 beats at story.bpm; "12f" = 12 frames ----------
  function makeTime(story) {
    const bpm = story.bpm || 120, fps = (story.format && story.format.fps) || 30;
    return v => {
      if (v == null) return v;
      if (typeof v === 'number') return v;
      const s = String(v).trim();
      if (s.endsWith('b')) return (parseFloat(s) * 60) / bpm;
      if (s.endsWith('f')) return parseFloat(s) / fps;
      if (s.endsWith('s')) return parseFloat(s);
      return parseFloat(s);
    };
  }

  // ---------- engine ----------
  function create(canvas, brand, story) {
    const ctx = canvas.getContext('2d');
    const fmt = Object.assign({ w: 1080, h: 1920, fps: 30 }, story.format || {});
    canvas.width = fmt.w; canvas.height = fmt.h;
    const W = fmt.w, H = fmt.h, U = Math.min(W, H);
    const C = makeResolver(brand);
    const T = makeTime(story);
    const motion = Object.assign({ exit: 'inCubic', move: 'inOutCubic', transition: 'inOutCubic', stagger: 0.06 }, brand.motion || {});
    const type = brand.type || {};
    const images = {};

    // --- normalise story: resolve times, expand cyclers, compute scene starts ---
    function normFx(spec, defAt, defDur) {
      if (!spec) return null;
      if (typeof spec === 'string') spec = { fx: spec };
      return Object.assign({}, spec, { at: T(spec.at != null ? spec.at : defAt), dur: T(spec.dur != null ? spec.dur : defDur) });
    }
    function normEl(el) {
      const out = Object.assign({}, el);
      out.in = normFx(el.in, 0, 0.6);
      out.out = normFx(el.out, 0, 0.4);
      if (el.moves) out.moves = el.moves.map(m => Object.assign({}, m, { at: T(m.at || 0), dur: T(m.dur != null ? m.dur : 0.8) }));
      if (el.stagger != null) out.stagger = T(el.stagger);
      return out;
    }
    function expand(els) {
      const res = [];
      (els || []).forEach(el => {
        if (el.type === 'cycler') {
          // A cycler becomes N text elements that hand off to each other on a fixed cadence (beat-synced lists).
          const at = T(el.at || 0), every = T(el.every || 1), n = el.items.length;
          el.items.forEach((txt, i) => {
            const last = i === n - 1;
            res.push(normEl(Object.assign({}, el, {
              type: 'text', text: txt, items: undefined,
              in: Object.assign({ fx: el.fx || 'cut', dur: el.fxDur || 0.25 }, { at: at + i * every }),
              out: last && el.holdLast !== false ? el.out || null : { fx: el.outFx || 'cut', at: at + (i + 1) * every - (el.outFx && el.outFx !== 'cut' ? T(el.outDur || 0.2) : 0.0001), dur: el.outFx && el.outFx !== 'cut' ? el.outDur || 0.2 : 0.0001 },
            })));
          });
        } else res.push(normEl(el));
      });
      return res;
    }
    let cursor = 0;
    const scenes = (story.scenes || []).map(sc => {
      const s = Object.assign({}, sc);
      s.dur = T(sc.dur);
      s.start = cursor; cursor += s.dur;
      s.elements = expand(sc.elements);
      if (sc.transition) {
        const tr = typeof sc.transition === 'string' ? { type: sc.transition } : sc.transition;
        s.transition = Object.assign({ dur: 0.5 }, tr, { dur: T(tr.dur != null ? tr.dur : 0.5) });
      }
      return s;
    });
    const duration = story.duration ? T(story.duration) : cursor;
    const overlays = expand(story.overlays);

    // --- assets ---
    function collectSrcs() {
      const srcs = new Set();
      const visit = el => { if (el.src) srcs.add(el.src); };
      scenes.forEach(s => s.elements.forEach(visit)); overlays.forEach(visit);
      if (brand.logo && brand.logo.src) srcs.add(brand.logo.src);
      if (brand.logo && brand.logo.srcOnDark) srcs.add(brand.logo.srcOnDark);
      return [...srcs];
    }
    function loadImages() {
      return Promise.all(collectSrcs().map(src => new Promise(res => {
        const im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = () => { images[src] = im; res(); };
        im.onerror = () => { console.warn('[brand-motion] image failed:', src); res(); };
        im.src = src;
      })));
    }
    function loadFonts() {
      if (!document.fonts) return Promise.resolve();
      const fams = ['display', 'headline', 'body'].map(k => type[k] && type[k].family).filter(Boolean);
      const weights = ['display', 'headline', 'body'].map(k => (type[k] && type[k].weight) || 400);
      const loads = fams.map((f, i) => document.fonts.load(`${weights[i]} 64px "${f}"`).catch(() => {}));
      const timeout = new Promise(r => setTimeout(r, 5000));
      return Promise.race([Promise.all(loads).then(() => document.fonts.ready), timeout]);
    }
    const ready = Promise.all([loadImages(), loadFonts()]);

    // --- type ---
    const ROLE_SIZE = { display: 0.14, headline: 0.09, title: 0.065, body: 0.042, caption: 0.03 };
    function fontFor(el) {
      const role = el.role || 'headline';
      const face = (role === 'display' ? type.display : role === 'headline' || role === 'title' ? type.headline || type.display : type.body) || {};
      const scale = (type.scale && type.scale[role]) || ROLE_SIZE[role] || 0.06;
      const size = (el.size != null ? el.size : scale) * U;
      const weight = el.weight || face.weight || (role === 'body' || role === 'caption' ? 400 : 700);
      const family = face.family ? `"${face.family}", ${face.fallback || 'sans-serif'}` : 'system-ui, sans-serif';
      const style = el.italic || face.italic ? 'italic ' : '';
      const tracking = el.tracking != null ? el.tracking : face.tracking != null ? face.tracking : 0;
      const lh = el.lineHeight || face.lineHeight || (role === 'body' || role === 'caption' ? 1.35 : 1.0);
      const cs = el.case || face.case || 'none';
      return { css: `${style}${weight} ${size}px ${family}`, size, tracking: tracking * size, lh, cs };
    }
    function applyCase(s, cs) { return cs === 'upper' ? s.toUpperCase() : cs === 'lower' ? s.toLowerCase() : s; }

    function layoutText(el) {
      const f = fontFor(el);
      ctx.font = f.css;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${f.tracking}px`;
      const raw = applyCase(String(el.text == null ? '' : el.text), f.cs);
      const maxW = (el.maxWidth || 0.84) * W;
      const lines = [];
      raw.split('\n').forEach(par => {
        const words = par.split(' ');
        let line = [];
        words.forEach(w => {
          const test = line.concat(w).join(' ');
          if (line.length && ctx.measureText(test).width > maxW) { lines.push(line); line = [w]; } else line.push(w);
        });
        lines.push(line);
      });
      const lineH = f.size * f.lh, space = ctx.measureText(' ').width;
      const lineWs = lines.map(l => ctx.measureText(l.join(' ')).width);
      const boxW = Math.max(1, ...lineWs), boxH = lines.length * lineH;
      const align = el.align || 'center';
      const units = []; // {text,x,y,w,h,line}
      const split = el.in && el.in.fx === 'type' ? 'char' : el.split || 'none';
      lines.forEach((l, li) => {
        const lw = lineWs[li];
        let x = align === 'left' ? 0 : align === 'right' ? boxW - lw : (boxW - lw) / 2;
        const y = li * lineH;
        if (split === 'none' || split === 'line') {
          units.push({ text: l.join(' '), x, y, w: lw, h: lineH, line: li });
          return;
        }
        l.forEach((w, wi) => {
          if (split === 'char') {
            for (const ch of w + (wi < l.length - 1 ? ' ' : '')) {
              const cw = ctx.measureText(ch).width;
              units.push({ text: ch, x, y, w: cw, h: lineH, line: li }); x += cw;
            }
          } else {
            const ww = ctx.measureText(w).width;
            units.push({ text: w, x, y, w: ww, h: lineH, line: li }); x += ww + space;
          }
        });
      });
      if (split === 'none') { // keep as one unit for whole-block effects
        return { f, w: boxW, h: boxH, units: [{ text: null, x: 0, y: 0, w: boxW, h: boxH, all: units }], lineWs };
      }
      return { f, w: boxW, h: boxH, units };
    }

    // --- element sizing (box w/h in px) ---
    function boxOf(el) {
      switch (el.type) {
        case 'text': return null; // computed via layout
        case 'circle': case 'ring': { const d = (el.r || 0.1) * 2 * U; return { w: d, h: d }; }
        case 'semicircle': { const d = (el.r || 0.1) * 2 * U; return { w: d, h: d / 2 }; }
        case 'rect': case 'pill': case 'segbar': return { w: (el.w || 0.5) * (el.wUnit === 'U' ? U : W), h: (el.h || 0.05) * (el.hUnit === 'H' ? H : U) };
        case 'image': case 'logo': {
          const src = el.type === 'logo' ? el.src || logoSrc(el) : el.src;
          const im = images[src];
          const w = (el.w || 0.4) * (el.wUnit === 'U' ? U : W);
          if (el.h) return { w, h: el.h * (el.hUnit === 'W' ? W : U) };
          if (im) return { w, h: (w * im.naturalHeight) / im.naturalWidth };
          return { w, h: w * 0.3 };
        }
        default: return { w: 0, h: 0 };
      }
    }
    function logoSrc(el) {
      const L = brand.logo || {};
      return el.onDark && L.srcOnDark ? L.srcOnDark : L.src;
    }

    // --- per-element state at local time t ---
    function stateAt(el, t, k) {
      const st = { x: el.x != null ? el.x : 0.5, y: el.y != null ? el.y : 0.5, s: el.scale != null ? el.scale : 1, sx: 1, sy: 1, r: (el.rot || 0) * DEG, o: el.opacity != null ? el.opacity : 1, dx: 0, dy: 0, extra: {} };
      if (el.from != null && t < T(el.from)) return null;
      // moves: keyframed position / scale / rotation (also how elements "travel" between layouts)
      (el.moves || []).forEach(m => {
        if (t < m.at) return;
        const e = (EASE[m.ease || motion.move] || EASE.inOutCubic)(clamp((t - m.at) / m.dur));
        if (m.x != null) st.x = lerp(st.x, m.x, e);
        if (m.y != null) st.y = lerp(st.y, m.y, e);
        if (m.scale != null) st.s = lerp(st.s, m.scale, e);
        if (m.rot != null) st.r = lerp(st.r, m.rot * DEG, e);
        if (m.opacity != null) st.o = lerp(st.o, m.opacity, e);
      });
      const apply = d => {
        if (d.o != null) st.o *= d.o;
        if (d.s != null) st.s *= d.s;
        if (d.sx != null) st.sx *= d.sx;
        if (d.sy != null) st.sy *= d.sy;
        if (d.r) st.r += d.r;
        if (d.dx) st.dx += d.dx;
        if (d.dy) st.dy += d.dy;
        ['reveal', 'wipe', 'iris', 'clip', 'blur', 'dot'].forEach(key => { if (d[key] != null) st.extra[key] = d[key]; });
      };
      if (el.in) {
        if (t < el.in.at) return null;
        const fx = FX[el.in.fx] || FX.fade;
        const p = el.in.dur > 0 ? clamp((t - el.in.at) / el.in.dur) : 1;
        if (p < 1 || el.in.fx === 'draw') {
          const ease = EASE[el.in.ease || fx.ease] || EASE.outCubic;
          apply(fx.f(ease(p), k));
        }
      }
      if (el.out && t >= el.out.at) {
        const fx = FX[el.out.fx] || FX.fade;
        const q = el.out.dur > 0 ? clamp((t - el.out.at) / el.out.dur) : 1;
        if (q >= 1 && el.out.fx !== 'draw') return null;
        const ease = EASE[el.out.ease || motion.exit] || EASE.inCubic;
        const d = fx.f(1 - ease(q), k);
        // exits continue the direction of travel instead of reversing it
        if (d.dx) d.dx = -d.dx; if (d.dy) d.dy = -d.dy; if (d.r) d.r = -d.r;
        if (el.out.fx === 'draw') { d.reveal = undefined; st.extra.tail = ease(q); }
        apply(d);
      }
      const L = el.loop;
      if (L) {
        const lt = t - (el.in ? el.in.at + el.in.dur : 0);
        const per = T(L.period || 1.6), amp = L.amp != null ? L.amp : 1;
        const ph = (2 * Math.PI * lt) / per + (L.phase || 0);
        if (L.fx === 'float') st.dy += Math.sin(ph) * amp * U * 0.012;
        if (L.fx === 'pulse') st.s *= 1 + Math.sin(ph) * 0.04 * amp;
        if (L.fx === 'spin') st.r += (lt / per) * 2 * Math.PI;
        if (L.fx === 'sway' || L.fx === 'flap') st.r += Math.sin(ph) * (L.fx === 'flap' ? 18 : 5) * amp * DEG;
        if (L.fx === 'shake') { const R = rng(Math.floor(lt * 24) + 7); st.dx += (R() - 0.5) * amp * U * 0.01; st.dy += (R() - 0.5) * amp * U * 0.01; }
        if (L.fx === 'beat') { const b = (lt % per) / per; st.s *= 1 + 0.06 * amp * Math.pow(1 - b, 3); }
      }
      return st;
    }

    // --- drawers (draw in local coords; box top-left at (-ax*w, -ay*h)) ---
    function anchorOf(el) {
      const a = el.anchor || 'center';
      const map = { center: [0.5, 0.5], left: [0, 0.5], right: [1, 0.5], top: [0.5, 0], bottom: [0.5, 1], 'top-left': [0, 0], 'top-right': [1, 0], 'bottom-left': [0, 1], 'bottom-right': [1, 1] };
      return map[a] || [0.5, 0.5];
    }
    function fillStroke(el, path) {
      if (el.fill) { ctx.fillStyle = C(el.fill); ctx.fill(path); }
      if (el.stroke) { ctx.strokeStyle = C(el.stroke); ctx.lineWidth = (el.strokeW || 0.008) * U; ctx.stroke(path); }
    }

    function drawShape(el, st, w, h) {
      const [ax, ay] = anchorOf(el);
      const x0 = -ax * w, y0 = -ay * h;
      const p = new Path2D();
      if (el.type === 'circle' || el.type === 'ring') {
        const r = w / 2;
        if (st.extra.reveal != null || st.extra.tail != null) { // ring draw-on
          const a0 = (el.startAngle || -90) * DEG, span = 2 * Math.PI * (st.extra.reveal != null ? st.extra.reveal : 1);
          const t0 = st.extra.tail != null ? st.extra.tail * 2 * Math.PI : 0;
          p.arc(x0 + r, y0 + r, Math.max(0, r - ((el.strokeW || 0.008) * U) / 2), a0 + t0, a0 + span);
          ctx.strokeStyle = C(el.stroke || el.fill); ctx.lineWidth = (el.strokeW || 0.008) * U; ctx.lineCap = 'round';
          ctx.stroke(p); return;
        }
        p.arc(x0 + r, y0 + r, r, 0, Math.PI * 2);
        if (el.type === 'ring' && !el.stroke) { ctx.strokeStyle = C(el.fill); ctx.lineWidth = (el.strokeW || 0.008) * U; ctx.stroke(p); return; }
      } else if (el.type === 'semicircle') {
        p.moveTo(x0, y0 + h); p.arc(x0 + w / 2, y0 + h, w / 2, Math.PI, 0); p.closePath();
      } else if (el.type === 'rect' || el.type === 'pill') {
        const rr = el.type === 'pill' ? h / 2 : (el.radius || 0) * U;
        p.roundRect(x0, y0, w, h, rr);
      }
      fillStroke(el, p);
    }

    function drawSegbar(el, st, w, h, t) {
      // Segmented progress bar — a bookend motif: grows segment by segment.
      const [ax, ay] = anchorOf(el);
      const n = el.segments || 4, gap = (el.gap || 0.01) * W, sw = (w - gap * (n - 1)) / n;
      const at = el.in ? el.in.at : 0, dur = el.in ? el.in.dur : 0.6, stg = el.stagger != null ? el.stagger : dur / n;
      const cols = Array.isArray(el.fill) ? el.fill : [el.fill || 'primary'];
      for (let i = 0; i < n; i++) {
        const p = el.in ? EASE.outExpo(clamp((t - at - i * stg) / Math.max(0.001, dur / n * 1.5))) : 1;
        if (p <= 0) continue;
        ctx.fillStyle = C(cols[i % cols.length]);
        ctx.beginPath(); ctx.roundRect(-ax * w + i * (sw + gap), -ay * h, sw * p, h, (el.radius || 0) * U); ctx.fill();
      }
    }

    function drawImage(el, st, w, h, src) {
      const im = images[src];
      const [ax, ay] = anchorOf(el);
      const x0 = -ax * w, y0 = -ay * h;
      ctx.save();
      if (el.mask === 'circle') { ctx.beginPath(); ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2); ctx.clip(); }
      else if (el.mask === 'rounded') { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, (el.radius || 0.03) * U); ctx.clip(); }
      if (im) {
        if (el.fit === 'cover' || el.mask) {
          const r = Math.max(w / im.naturalWidth, h / im.naturalHeight);
          const iw = im.naturalWidth * r, ih = im.naturalHeight * r;
          ctx.drawImage(im, x0 + (w - iw) / 2, y0 + (h - ih) / 2, iw, ih);
        } else ctx.drawImage(im, x0, y0, w, h);
      } else { // placeholder so storyboards render before real assets exist
        ctx.fillStyle = C(el.placeholder || 'rgba(127,127,127,0.35)'); ctx.fillRect(x0, y0, w, h);
        if (el.label) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.font = `600 ${U * 0.03}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(el.label, x0 + w / 2, y0 + h / 2); }
      }
      ctx.restore();
      if (el.stroke) { ctx.strokeStyle = C(el.stroke); ctx.lineWidth = (el.strokeW || 0.008) * U; ctx.beginPath(); if (el.mask === 'circle') ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2); else ctx.roundRect(x0, y0, w, h, el.mask === 'rounded' ? (el.radius || 0.03) * U : 0); ctx.stroke(); }
    }

    // Smooth path through points (Catmull-Rom) sampled to a polyline so we can draw it on by length.
    const pathCache = new WeakMap();
    function samplePath(el) {
      if (pathCache.has(el)) return pathCache.get(el);
      const P = el.points.map(([x, y]) => [x * W, y * H]);
      const pts = [];
      if (el.smooth === false || P.length < 3) P.forEach(p => pts.push(p));
      else {
        for (let i = 0; i < P.length - 1; i++) {
          const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
          for (let s = 0; s < 24; s++) {
            const t = s / 24, t2 = t * t, t3 = t2 * t;
            pts.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
          }
        }
        pts.push(P[P.length - 1]);
      }
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const res = { pts, cum, len: cum[cum.length - 1] };
      pathCache.set(el, res); return res;
    }
    function pointAt(sp, d) {
      let i = 1; while (i < sp.cum.length - 1 && sp.cum[i] < d) i++;
      const seg = sp.cum[i] - sp.cum[i - 1] || 1, f = clamp((d - sp.cum[i - 1]) / seg);
      return [lerp(sp.pts[i - 1][0], sp.pts[i][0], f), lerp(sp.pts[i - 1][1], sp.pts[i][1], f), Math.atan2(sp.pts[i][1] - sp.pts[i - 1][1], sp.pts[i][0] - sp.pts[i - 1][0])];
    }
    function drawPath(el, st) {
      // Paths are in absolute frame fractions, so they ignore x/y; transforms still apply about frame center.
      const sp = samplePath(el);
      const head = (st.extra.reveal != null ? st.extra.reveal : 1) * sp.len;
      let tail = st.extra.tail != null ? st.extra.tail * sp.len : 0;
      if (el.trail) tail = Math.max(tail, head - el.trail * sp.len); // travelling segment
      if (head - tail <= 0.5) return;
      ctx.beginPath();
      const a = pointAt(sp, tail); ctx.moveTo(a[0], a[1]);
      for (let i = 0; i < sp.pts.length; i++) if (sp.cum[i] > tail && sp.cum[i] < head) ctx.lineTo(sp.pts[i][0], sp.pts[i][1]);
      const b = pointAt(sp, head); ctx.lineTo(b[0], b[1]);
      ctx.strokeStyle = C(el.stroke || 'ink'); ctx.lineWidth = (el.strokeW || 0.008) * U;
      ctx.lineCap = el.cap || 'round'; ctx.lineJoin = 'round';
      if (el.dash) ctx.setLineDash(el.dash.map(v => v * U));
      ctx.stroke(); ctx.setLineDash([]);
      if (el.head) { // a marker riding the tip (heart, dot, icon) — the continuity "pen"
        ctx.save(); ctx.translate(b[0], b[1]); if (el.head.orient) ctx.rotate(b[2]);
        const hr = (el.head.r || 0.02) * U;
        if (el.head.src && images[el.head.src]) ctx.drawImage(images[el.head.src], -hr, -hr, hr * 2, hr * 2);
        else { ctx.fillStyle = C(el.head.fill || el.stroke || 'ink'); ctx.beginPath(); ctx.arc(0, 0, hr, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }

    const dotsCache = new WeakMap();
    function drawDots(el, t) {
      // Particle fields: confetti fall, scatter pop-in, burst from a point, slow drift.
      if (!dotsCache.has(el)) {
        const R = rng(el.seed || 42), n = el.count || 30, area = el.area || [0, 0, 1, 1];
        const cols = Array.isArray(el.fill) ? el.fill : [el.fill || 'ink'];
        dotsCache.set(el, Array.from({ length: n }, (_, i) => ({ x: area[0] + R() * (area[2] - area[0]), y: area[1] + R() * (area[3] - area[1]), r: (el.r || 0.012) * U * (0.5 + R()), c: cols[i % cols.length], v: 0.5 + R(), d: R() * (el.spread || 0.6), a: R() * Math.PI * 2 })));
      }
      const at = el.in ? el.in.at : 0, lt = t - at;
      if (lt < 0) return;
      dotsCache.get(el).forEach((d, i) => {
        let x = d.x * W, y = d.y * H, s = 1;
        if (el.motion === 'fall') { y = (((d.y + lt * d.v * (el.speed || 0.25)) % 1.1) - 0.05) * H; x += Math.sin(lt * 2 + d.a) * U * 0.01; }
        else if (el.motion === 'burst') { const e = EASE.outExpo(clamp(lt / (el.in ? el.in.dur : 0.8))); x = lerp((el.x != null ? el.x : 0.5) * W, x, e); y = lerp((el.y != null ? el.y : 0.5) * H, y, e); s = 1 - 0.3 * e; }
        else if (el.motion === 'drift') { x += Math.cos(lt * 0.6 * d.v + d.a) * U * 0.02; y += Math.sin(lt * 0.5 * d.v + d.a) * U * 0.02; }
        else { s = EASE.outBack(clamp((lt - d.d) / 0.35)); } // scatter pop
        if (s <= 0) return;
        ctx.fillStyle = C(d.c); ctx.beginPath(); ctx.arc(x, y, d.r * s, 0, Math.PI * 2); ctx.fill();
      });
    }

    function drawText(el, st, lay, t) {
      const [ax, ay] = anchorOf(el);
      const x0 = -ax * lay.w, y0 = -ay * lay.h;
      ctx.font = lay.f.css;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${lay.f.tracking}px`;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = C(el.color || 'ink');
      const hl = el.highlight; // optional pill/box behind text (Spotify-style chips)
      if (hl) {
        const pad = (hl.pad || 0.25) * lay.f.size;
        ctx.save(); ctx.fillStyle = C(hl.fill || 'accent');
        ctx.beginPath(); ctx.roundRect(x0 - pad * 1.4, y0 - pad, lay.w + pad * 2.8, lay.h + pad * 2, hl.radius != null ? hl.radius * U : (lay.h + pad * 2) / 2); ctx.fill(); ctx.restore();
      }
      const isType = el.in && el.in.fx === 'type';
      const stagger = isType ? el.in.dur / Math.max(1, lay.units.length) : el.stagger != null ? el.stagger : motion.stagger;
      const k = { W, H, U };
      lay.units.forEach((u, i) => {
        let us = { o: 1, s: 1, dx: 0, dy: 0, r: 0, clip: false };
        if (el.in && lay.units.length > 1) { // per-unit stagger replaces the block-level entrance
          const fx = FX[el.in.fx] || FX.fade;
          const at = el.in.at + i * stagger, dur = isType ? 0.0001 : el.in.dur;
          if (t < at) return;
          const p = clamp((t - at) / dur);
          const d = fx.f((EASE[el.in.ease || fx.ease] || EASE.outCubic)(p), Object.assign({ h: u.h }, k));
          us = Object.assign(us, d, { o: d.o != null ? d.o : 1, s: d.s != null ? d.s : 1 });
        } else if (st.extra.clip) us.clip = true;
        if (us.o <= 0) return;
        ctx.save();
        if (us.clip) { ctx.beginPath(); ctx.rect(x0 + u.x - lay.f.size, y0 + u.y, u.w + lay.f.size * 2, u.h); ctx.clip(); }
        const cx = x0 + u.x + u.w / 2, cy = y0 + u.y + u.h / 2;
        ctx.translate(cx + (us.dx || 0), cy + (us.dy || 0)); ctx.rotate(us.r || 0); ctx.scale(us.s, us.s);
        ctx.globalAlpha *= us.o;
        if (u.all) u.all.forEach(a => ctx.fillText(a.text, a.x - u.w / 2, a.y + a.h / 2 - u.h / 2));
        else ctx.fillText(u.text, -u.w / 2, 0);
        ctx.restore();
      });
    }

    function drawElement(el, t) {
      const k = { W, H, U, h: 0 };
      let lay = null, box;
      if (el.type === 'text' || (el.type === 'logo' && !logoSrc(el) && !el.src)) {
        const tel = el.type === 'logo' ? Object.assign({ role: 'display', text: (brand.logo && brand.logo.wordmark) || brand.name || 'BRAND', color: (brand.logo && brand.logo.color) || 'ink' }, el) : el;
        lay = layoutText(tel); box = { w: lay.w, h: lay.h }; el = tel;
      } else box = boxOf(el);
      k.h = box.h;
      const st = stateAt(el, t, k);
      if (!st || st.o <= 0.001) return;
      ctx.save();
      ctx.globalAlpha *= st.o;
      if (el.blend) ctx.globalCompositeOperation = el.blend;
      if (st.extra.blur) ctx.filter = `blur(${st.extra.blur}px)`;
      if (el.shadow) { const sh = el.shadow; ctx.shadowColor = C(sh.color || 'rgba(0,0,0,0.25)'); ctx.shadowBlur = (sh.blur || 0.03) * U; ctx.shadowOffsetY = (sh.y != null ? sh.y : 0.015) * U; }
      if (el.type === 'path') {
        ctx.translate(W / 2 + st.dx, H / 2 + st.dy); ctx.rotate(st.r); ctx.scale(st.s * st.sx, st.s * st.sy); ctx.translate(-W / 2, -H / 2);
        drawPath(el, st); ctx.restore(); return;
      }
      if (el.type === 'dots') { drawDots(el, t); ctx.restore(); return; }
      ctx.translate(st.x * W + st.dx, st.y * H + st.dy);
      ctx.rotate(st.r);
      ctx.scale(st.s * st.sx, st.s * st.sy);
      if (st.extra.dot) { // dot-expand: the seed dot
        ctx.save(); ctx.globalAlpha *= st.extra.dot.o; ctx.fillStyle = C(el.dotColor || el.color || el.fill || 'ink');
        ctx.beginPath(); ctx.arc(0, 0, st.extra.dot.r / Math.max(0.05, st.s), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const [ax, ay] = anchorOf(el);
      if (st.extra.wipe != null) { ctx.beginPath(); ctx.rect(-ax * box.w - 2, -ay * box.h - 2, (box.w + 4) * st.extra.wipe, box.h + 4); ctx.clip(); }
      if (st.extra.iris != null) { ctx.beginPath(); ctx.arc((0.5 - ax) * box.w, (0.5 - ay) * box.h, (Math.hypot(box.w, box.h) / 2) * st.extra.iris, 0, Math.PI * 2); ctx.clip(); }
      switch (el.type) {
        case 'text': case 'logo':
          if (lay) drawText(el, st, lay, t);
          else drawImage(el, st, box.w, box.h, el.src || logoSrc(el));
          break;
        case 'image': drawImage(el, st, box.w, box.h, el.src); break;
        case 'segbar': drawSegbar(el, st, box.w, box.h, t); break;
        default: drawShape(el, st, box.w, box.h);
      }
      ctx.restore();
    }

    // --- scenes + transitions ---
    function drawScene(sc, lt) {
      ctx.save();
      const cam = sc.camera;
      if (cam) {
        const p = clamp(lt / sc.dur);
        const z = cam.zoom ? lerp(cam.zoom[0], cam.zoom[1], EASE[cam.ease || 'inOutQuad'](p)) : 1;
        let sx = 0, sy = 0;
        if (cam.shake) { const R = rng(Math.floor(lt * 30) + 3); sx = (R() - 0.5) * cam.shake * U * 0.02; sy = (R() - 0.5) * cam.shake * U * 0.02; }
        const pan = cam.pan ? [lerp(cam.pan[0][0], cam.pan[1][0], p) * W, lerp(cam.pan[0][1], cam.pan[1][1], p) * H] : [0, 0];
        ctx.translate(W / 2 + sx + pan[0], H / 2 + sy + pan[1]); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      }
      ctx.fillStyle = C(sc.bg || 'bg'); ctx.fillRect(-W, -H, W * 3, H * 3);
      sc.elements.forEach(el => drawElement(el, lt));
      ctx.restore();
    }

    function drawTransition(prev, cur, lt) {
      const tr = cur.transition, p = clamp(lt / tr.dur), e = (EASE[tr.ease || motion.transition] || EASE.inOutCubic)(p);
      const plt = prev.dur + lt;
      const dir = tr.dir || 'left';
      const vec = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir] || [-1, 0];
      switch (tr.type) {
        case 'fade':
          drawScene(prev, plt); ctx.save(); ctx.globalAlpha = e; drawScene(cur, lt); ctx.restore(); break;
        case 'push':
          ctx.save(); ctx.translate(vec[0] * W * e, vec[1] * H * e); drawScene(prev, plt); ctx.restore();
          ctx.save(); ctx.translate(-vec[0] * W * (1 - e), -vec[1] * H * (1 - e)); drawScene(cur, lt); ctx.restore(); break;
        case 'wipe': {
          // Leading colour bands sweep across, the new scene follows behind them.
          const bands = (tr.bands || []).map(C), bw = (tr.bandW || 0.12);
          const total = 1 + bands.length * bw, f = e * total;
          drawScene(prev, plt);
          const along = dir === 'left' || dir === 'right' ? W : H;
          const rectFor = (a, b) => { // a..b are fractions along travel direction from the entry edge
            a = clamp(a); b = clamp(b); if (b <= a) return null;
            if (dir === 'left') return [W - b * W, 0, (b - a) * W, H];
            if (dir === 'right') return [a * W, 0, (b - a) * W, H];
            if (dir === 'up') return [0, H - b * H, W, (b - a) * H];
            return [0, a * H, W, (b - a) * H];
          };
          bands.forEach((c, i) => { const r = rectFor(f - (i + 1) * bw, f - i * bw); if (r) { ctx.fillStyle = c; ctx.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); } });
          const rc = rectFor(0, f - bands.length * bw);
          if (rc) { ctx.save(); ctx.beginPath(); ctx.rect(...rc); ctx.clip(); drawScene(cur, lt); ctx.restore(); }
          void along; break;
        }
        case 'iris': {
          drawScene(prev, plt);
          const cx = (tr.x != null ? tr.x : 0.5) * W, cy = (tr.y != null ? tr.y : 0.5) * H;
          const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * e;
          if (tr.ring) { ctx.fillStyle = C(tr.ring); ctx.beginPath(); ctx.arc(cx, cy, R * 1.0 + U * 0.04 * (1 - e), 0, Math.PI * 2); ctx.fill(); }
          ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); drawScene(cur, lt); ctx.restore(); break;
        }
        case 'cover': { // solid panel slides over, then slides off revealing the next scene
          const col = C(tr.color || 'accent');
          if (p < 0.5) { drawScene(prev, plt); const k2 = EASE.inOutCubic(p * 2); ctx.fillStyle = col; ctx.fillRect(vec[0] < 0 ? W * (1 - k2) : vec[0] > 0 ? -W * (1 - k2) : 0, vec[1] < 0 ? H * (1 - k2) : vec[1] > 0 ? -H * (1 - k2) : 0, W, H); }
          else { drawScene(cur, lt); const k2 = EASE.inOutCubic((p - 0.5) * 2); ctx.fillStyle = col; ctx.fillRect(vec[0] * W * k2, vec[1] * H * k2, W, H); }
          break;
        }
        case 'shrink': { // the previous frame shrinks into a bordered card over the new scene
          drawScene(cur, lt);
          const to = tr.to != null ? tr.to : 0, s = lerp(1, to, e);
          if (s <= 0.001) break;
          const bw = (tr.borderW || 0.02) * U;
          ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
          if (tr.border) { ctx.fillStyle = C(tr.border); ctx.fillRect(-bw / s, -bw / s, W + (2 * bw) / s, H + (2 * bw) / s); }
          ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); drawScene(prev, plt); ctx.restore(); break;
        }
        case 'zoom': {
          ctx.save(); ctx.globalAlpha = 1 - e; ctx.translate(W / 2, H / 2); ctx.scale(1 + 2 * e, 1 + 2 * e); ctx.translate(-W / 2, -H / 2); drawScene(prev, plt); ctx.restore();
          ctx.save(); ctx.globalAlpha = e; ctx.translate(W / 2, H / 2); ctx.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e); ctx.translate(-W / 2, -H / 2); drawScene(cur, lt); ctx.restore(); break;
        }
        case 'flash':
          if (p < 0.5) drawScene(prev, plt); else drawScene(cur, lt);
          ctx.fillStyle = C(tr.color || '#ffffff'); ctx.globalAlpha = 1 - Math.abs(p - 0.5) * 2; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; break;
        default: drawScene(cur, lt);
      }
    }

    function seek(t) {
      t = clamp(t, 0, Math.max(0, duration - 1e-6));
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
      ctx.clearRect(0, 0, W, H);
      let i = scenes.findIndex(s => t >= s.start && t < s.start + s.dur);
      if (i < 0) i = scenes.length - 1;
      const sc = scenes[i];
      if (!sc) return;
      const lt = t - sc.start;
      if (i > 0 && sc.transition && sc.transition.type !== 'cut' && lt < sc.transition.dur) drawTransition(scenes[i - 1], sc, lt);
      else drawScene(sc, lt);
      overlays.forEach(el => drawElement(el, t));
    }

    return { ready, seek, duration, fps: fmt.fps, width: W, height: H, scenes };
  }

  global.MG = { create, EASE, FX: Object.keys(FX) };
})(typeof window !== 'undefined' ? window : globalThis);
