(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const ICONS = {
    drop: '<path d="M12 3s-6 7-6 11a6 6 0 0012 0c0-4-6-11-6-11z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 005 5l-9.4 9.4a2.1 2.1 0 01-3-3l9.4-9.4a4 4 0 00-2-2z"/>',
    hammer: '<path d="M14 5l5 5-2 2-5-5zM12 7L4 15l3 3 8-8M3 21h8"/>',
    pipe: '<path d="M3 8h8v8h10M3 8v-2M21 16v2"/><circle cx="11" cy="12" r="1"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    check: '<path d="M4 12l5 5L20 6"/>'
  };
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const svg = n => { const w = el('span', 'ico'); w.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[n] || ICONS.drop}</svg>`; return w; };
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  function observe(root = document) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      const c = e.target.querySelector('[data-count]'); if (c) count(c);
    }), { threshold: .15 });
    root.querySelectorAll('.reveal:not(.in)').forEach(n => io.observe(n));
  }
  function count(n) {
    const to = parseFloat(n.dataset.count), dec = +n.dataset.dec || 0, suf = n.dataset.suffix || '', t0 = performance.now();
    const tick = t => { const p = Math.min(1, (t - t0) / 1400), v = to * (1 - Math.pow(1 - p, 3)); n.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  function render(c) {
    const s = c.settings;
    document.querySelectorAll('[data-s]').forEach(n => { n.textContent = s[n.dataset.s] || ''; });
    const tel = 'tel:' + s.phone.replace(/[^\d+]/g, '');
    document.querySelectorAll('[data-tel]').forEach(a => a.href = tel);
    document.title = s.businessName + ' | Plumbing & Construction, Port of Spain';
    const b = $('#banner'); if (s.banner) { b.textContent = s.banner; b.hidden = false; } else b.hidden = true;
    if (s.email) { const a = el('a', '', s.email); a.href = 'mailto:' + s.email; const r = $('#emailRow'); r.textContent = ''; r.append(a); }
    if (s.rating) { $('#ratingBadge').hidden = false; $('#heroStars').textContent = stars(Math.round(s.rating)); $('#ratingNum').textContent = Number(s.rating).toFixed(1); $('#ratingCount').textContent = s.reviewCount; }
    if (/^https:\/\//.test(s.googleReviewUrl)) { const g = $('#googleLink'); g.href = s.googleReviewUrl; g.hidden = false; }

    const sg = $('#serviceGrid'); sg.textContent = '';
    const sel = $('#serviceSelect'); sel.textContent = '';
    c.services.forEach((x, i) => {
      const card = el('div', 'card reveal'); card.style.transitionDelay = (i % 3) * .1 + 's';
      card.append(svg(x.icon), el('h3', '', x.title), el('p', '', x.text)); sg.append(card);
      sel.append(new Option(x.title, x.title));
    });
    sel.append(new Option('Other', 'Other'));

    const rg = $('#reviewGrid'); rg.textContent = '';
    c.reviews.forEach((r, i) => {
      const card = el('div', 'card review reveal'); card.style.transitionDelay = (i % 3) * .1 + 's';
      const st = el('div', 'stars', stars(r.stars)); const who = el('div', 'who', r.name); who.append(el('small', '', r.meta));
      card.append(st, el('p', '', '“' + r.text + '”'), who); rg.append(card);
    });
    observe();
  }

  fetch('/api/content').then(r => r.json()).then(render).catch(() => observe());
  observe();
  $('#yr').textContent = new Date().getFullYear();

  // quote form
  const f = $('#quoteForm'), msg = $('#formMsg');
  f.addEventListener('submit', async e => {
    e.preventDefault(); msg.className = ''; msg.textContent = '';
    const data = Object.fromEntries(new FormData(f));
    if (!data.name.trim() || !data.phone.trim() || !data.message.trim()) { msg.className = 'err'; msg.textContent = 'Please fill in your name, phone and a short description.'; return; }
    const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const r = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Something went wrong.');
      f.reset(); msg.className = 'ok'; msg.textContent = 'Thank you! We have your request and will be in touch shortly.';
    } catch (err) { msg.className = 'err'; msg.textContent = err.message + ' You can also call us.'; }
    btn.disabled = false;
  });

  // bubbles canvas
  const cv = $('#bubbles'), ctx = cv.getContext('2d');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let W, H, bs = [];
    const size = () => { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; };
    size(); addEventListener('resize', size);
    const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 20, r: 3 + Math.random() * 14, v: .3 + Math.random() * 1, ph: Math.random() * 6.28 });
    for (let i = 0; i < 45; i++) bs.push(mk(true));
    let mx = -999, my = -999;
    cv.parentElement.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; });
    (function loop(t) {
      ctx.clearRect(0, 0, W, H);
      for (const b of bs) {
        b.y -= b.v; b.x += Math.sin(t / 900 + b.ph) * .4;
        const dx = b.x - mx, dy = b.y - my, d = Math.hypot(dx, dy);
        if (d < 80) { b.x += dx / d * 2; b.y += dy / d * 2; }
        if (b.y < -20) Object.assign(b, mk(false));
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283);
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
        ctx.strokeStyle = 'rgba(160,240,255,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x - b.r / 3, b.y - b.r / 3, b.r / 4, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
      }
      requestAnimationFrame(loop);
    })(0);
  }
})();
