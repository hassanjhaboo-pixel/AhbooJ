(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
  const FIELDS = [
    ['businessName', 'Short business name'], ['legalName', 'Legal name'], ['phone', 'Phone'], ['email', 'Email'],
    ['whatsapp', 'WhatsApp (optional)'], ['hours', 'Opening hours'], ['address', 'Address', 1], ['emergency', 'Emergency message', 1],
    ['banner', 'Announcement banner (shows across top; leave blank for none)', 1], ['heroTitle', 'Hero headline', 1],
    ['heroSub', 'Hero sub-text', 1, 'ta'], ['about', 'About us', 1, 'ta'],
    ['rating', 'Google rating (e.g. 4.6)'], ['reviewCount', 'Number of Google reviews'], ['googleReviewUrl', 'Google reviews link (https://…)', 1]
  ];
  let inquiries = [], content = null;

  async function call(method, url, body) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401 && !url.includes('login')) { showLogin(); throw new Error('login'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Request failed');
    return j;
  }
  const showLogin = () => { $('#app').hidden = true; $('#login').hidden = false; };

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    try { await call('POST', '/api/admin/login', { password: $('#pw').value }); $('#pw').value = ''; start(); }
    catch (err) { $('#loginMsg').textContent = err.message; }
  });
  $('#logout').onclick = async () => { await call('POST', '/api/admin/logout'); showLogin(); };

  document.querySelectorAll('header nav button').forEach(b => b.onclick = () => {
    document.querySelectorAll('header nav button').forEach(x => x.classList.toggle('on', x === b));
    ['inbox', 'site', 'acct'].forEach(t => $('#tab-' + t).hidden = t !== b.dataset.tab);
  });

  async function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    [inquiries, content] = await Promise.all([call('GET', '/api/admin/inquiries'), call('GET', '/api/admin/content')]);
    renderInbox(); renderSite();
  }

  // ---------- inbox ----------
  $('#filter').append(...STATUSES.map(s => new Option(s[0].toUpperCase() + s.slice(1), s)));
  $('#filter').onchange = $('#search').oninput = () => renderInbox();

  function renderInbox() {
    const n = s => inquiries.filter(i => i.status === s).length;
    $('#newCount').textContent = n('new') || '';
    const k = $('#kpis'); k.textContent = '';
    [['Total', inquiries.length], ['New', n('new')], ['Quoted', n('quoted')], ['Won', n('won')]].forEach(([l, v]) => {
      const d = el('div', 'kpi'); d.append(el('b', '', v), el('span', '', l)); k.append(d);
    });
    const f = $('#filter').value, q = $('#search').value.toLowerCase();
    const rows = inquiries.filter(i => (!f || i.status === f) && (!q || [i.name, i.phone, i.email, i.message, i.address, i.service].join(' ').toLowerCase().includes(q)));
    const list = $('#list'); list.textContent = '';
    if (!rows.length) { list.append(el('div', 'empty', inquiries.length ? 'No matches.' : 'No quote requests yet. They will appear here when customers use the form on your site.')); return; }
    rows.forEach(i => list.append(card(i)));
  }

  function card(i) {
    const c = el('div', 'q ' + i.status);
    const top = el('div', 'top');
    const l = el('div'); l.append(el('h3', '', i.name));
    const meta = el('div'); meta.append(el('span', 'tag', new Date(i.createdAt).toLocaleString()), ' ', el('span', 'tag', i.service));
    meta.append(' ', el('span', i.urgency === 'Emergency' ? 'tag em' : 'tag', i.urgency));
    top.append(l, meta);
    const contact = el('div');
    const tel = el('a', '', '☎ ' + i.phone); tel.href = 'tel:' + i.phone.replace(/[^\d+]/g, ''); contact.append(tel);
    if (i.email) { const m = el('a', '', ' ✉ ' + i.email); m.href = 'mailto:' + i.email; contact.append(m); }
    if (i.address) contact.append(el('div', 'tag', '📍 ' + i.address));
    const acts = el('div', 'acts');
    const sel = el('select'); STATUSES.forEach(s => sel.append(new Option(s[0].toUpperCase() + s.slice(1), s))); sel.value = i.status;
    sel.onchange = () => patch(i, { status: sel.value });
    const notes = el('textarea'); notes.rows = 2; notes.placeholder = 'Private notes…'; notes.value = i.notes || '';
    notes.onchange = () => patch(i, { notes: notes.value }, true);
    const del = el('button', 'b ghost sm', 'Delete');
    del.onclick = async () => { if (confirm('Delete this request permanently?')) { await call('DELETE', '/api/admin/inquiries/' + i.id); inquiries = inquiries.filter(x => x !== i); renderInbox(); } };
    acts.append(sel, notes, del);
    c.append(top, contact, el('p', '', i.message), acts);
    return c;
  }
  async function patch(i, body, quiet) {
    Object.assign(i, await call('PATCH', '/api/admin/inquiries/' + i.id, body));
    if (!quiet) renderInbox();
  }

  // ---------- site content ----------
  function field(label, value, full, ta) {
    const l = el('label', full ? 'full' : '', label); const i = el(ta ? 'textarea' : 'input'); if (ta) i.rows = 3; i.value = value ?? ''; l.append(i); return [l, i];
  }
  function renderSite() {
    const sf = $('#settingsForm'); sf.textContent = '';
    FIELDS.forEach(([k, label, full, ta]) => { const [l, i] = field(label, content.settings[k], full, ta); i.dataset.k = k; sf.append(l); });
    const sl = $('#svcList'); sl.textContent = '';
    content.services.forEach((s, idx) => sl.append(itemRow(content.services, idx, [
      ['title', 'Title'], ['icon', 'Icon', 'sel'], ['text', 'Description', 'ta']])));
    const rl = $('#revList'); rl.textContent = '';
    content.reviews.forEach((r, idx) => rl.append(itemRow(content.reviews, idx, [
      ['name', 'Reviewer'], ['meta', 'Detail (e.g. Local Guide · 2 years ago)'], ['stars', 'Stars (1–5)'], ['text', 'Review text', 'ta']])));
  }
  function itemRow(arr, idx, cols) {
    const d = el('div', 'item');
    cols.forEach(([k, label, kind]) => {
      const l = el('label', kind === 'ta' ? 'full' : '', label); let i;
      if (kind === 'sel') { i = el('select'); ['drop', 'wrench', 'hammer', 'pipe', 'bolt', 'check'].forEach(o => i.append(new Option(o, o))); }
      else i = el(kind === 'ta' ? 'textarea' : 'input');
      if (kind === 'ta') i.rows = 2; i.value = arr[idx][k] ?? '';
      i.oninput = () => { arr[idx][k] = i.value; }; l.append(i); d.append(l);
    });
    const rm = el('button', 'b ghost sm full', 'Remove'); rm.type = 'button'; rm.onclick = () => { arr.splice(idx, 1); renderSite(); }; d.append(rm);
    return d;
  }
  $('#addSvc').onclick = () => { content.services.push({ icon: 'drop', title: 'New service', text: '' }); renderSite(); };
  $('#addRev').onclick = () => { content.reviews.push({ name: '', meta: '', stars: 5, text: '' }); renderSite(); };
  $('#saveSite').onclick = async () => {
    document.querySelectorAll('#settingsForm [data-k]').forEach(i => { content.settings[i.dataset.k] = i.value; });
    const m = $('#saveMsg');
    try { content = await call('PUT', '/api/admin/content', content); renderSite(); m.className = 'ok'; m.textContent = 'Saved — your website is updated.'; }
    catch (e) { m.className = 'err'; m.textContent = e.message; }
    setTimeout(() => m.textContent = '', 4000);
  };

  // ---------- password ----------
  $('#pwForm').addEventListener('submit', async e => {
    e.preventDefault(); const m = $('#pwMsg');
    try { await call('POST', '/api/admin/password', { current: $('#curPw').value, next: $('#newPw').value }); m.className = 'ok'; m.textContent = 'Password updated.'; e.target.reset(); }
    catch (err) { m.className = 'err'; m.textContent = err.message; }
  });

  call('GET', '/api/admin/me').then(start).catch(showLogin);
})();
