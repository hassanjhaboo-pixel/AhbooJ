// Zero-dependency Node server: serves the one-page site, a public quote API,
// and a password-protected owner API. Data lives in data/db.json.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA, 'db.json');
const AUTH_FILE = path.join(DATA, 'auth.json');

// ---------- default site content (owner can edit all of this in /admin) ----------
const DEFAULTS = {
  settings: {
    businessName: 'Anthony James Plumbing',
    legalName: 'Anthony James Plumbing Maintenance and Construction Services Ltd',
    phone: '(868) 627-6740',
    email: '',
    whatsapp: '',
    address: 'Corporate Office, Port of Spain, Trinidad (MF6V+9P3)',
    hours: 'Mon–Fri 8:00 am – 5:00 pm',
    emergency: 'Call us for urgent leaks and burst pipes.',
    heroTitle: 'Plumbing & construction you can trust.',
    heroSub: 'A long-standing Port of Spain company delivering quality workmanship and great customer service — from a dripping tap to a full build.',
    about: 'Anthony James Plumbing Maintenance and Construction Services Ltd has served homes and businesses around Port of Spain for years. Our customers keep telling us the same thing: quality workmanship and great customer service. We turn up, we do the job right, and we stand behind it.',
    banner: '',
    rating: 4.6,
    reviewCount: 8,
    googleReviewUrl: ''
  },
  services: [
    { icon: 'drop', title: 'Plumbing Repairs', text: 'Leaks, blocked drains, burst pipes, taps, toilets, water heaters and pumps — fixed properly the first time.' },
    { icon: 'wrench', title: 'Maintenance Contracts', text: 'Scheduled inspections and upkeep for homes, offices and commercial properties so small problems never become big ones.' },
    { icon: 'hammer', title: 'Construction & Renovation', text: 'New builds, extensions, bathrooms, kitchens and refurbishments managed from plan to handover.' },
    { icon: 'pipe', title: 'Installations', text: 'New piping, fixtures, tanks, water-supply and drainage systems installed to code.' },
    { icon: 'bolt', title: 'Emergency Call-outs', text: 'Burst pipe at night? Overflowing line? Call us and we will get to you as fast as we can.' },
    { icon: 'check', title: 'Inspections & Quotes', text: 'Honest assessments and clear, itemised quotes before any work begins.' }
  ],
  reviews: [
    { name: 'David Marshall', meta: '11 reviews · a year ago', stars: 5, text: 'Great service, quality workmanship. I would highly recommend Anthony James Plumbing.' },
    { name: 'Adelaide Cupid', meta: 'Local Guide · 4 years ago', stars: 5, text: 'A long standing company with great customer service.' },
    { name: 'Yoel Padrón Vega', meta: 'Local Guide · 7 years ago', stars: 5, text: 'Anything on plumbing and construction services are right there.' }
  ],
  inquiries: []
};

// ---------- tiny JSON "database" ----------
function loadDb() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return structuredClone(DEFAULTS); }
}
let db = loadDb();
function saveDb() {
  fs.mkdirSync(DATA, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
if (!fs.existsSync(DB_FILE)) saveDb();

// ---------- auth ----------
function hash(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
function initAuth() {
  if (process.env.ADMIN_PASSWORD) {
    const salt = crypto.randomBytes(16).toString('hex');
    return { salt, hash: hash(process.env.ADMIN_PASSWORD, salt), fromEnv: true };
  }
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch {}
  const pw = crypto.randomBytes(6).toString('base64url');
  const salt = crypto.randomBytes(16).toString('hex');
  const a = { salt, hash: hash(pw, salt) };
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(a));
  console.log(`\n  First run — owner password generated: ${pw}\n  Change it in the dashboard (Account tab) or set ADMIN_PASSWORD.\n`);
  return a;
}
let auth = initAuth();
const sessions = new Map(); // token -> expiry
const SESSION_MS = 1000 * 60 * 60 * 12;
const loginFails = new Map(); // ip -> {n, until}

function checkPassword(pw) {
  const a = Buffer.from(hash(String(pw), auth.salt), 'hex');
  const b = Buffer.from(auth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isAdmin(req) {
  const t = cookies(req).ajp_session;
  const exp = t && sessions.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(t); return false; }
  return true;
}

// ---------- helpers ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json' };
const SEC = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://www.google.com; connect-src 'self'"
};
function send(res, code, body, headers = {}) {
  res.writeHead(code, { ...SEC, ...headers });
  res.end(body);
}
function json(res, code, obj, headers = {}) {
  send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
}
function readBody(req, limit = 200_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const ip = req => req.socket.remoteAddress || 'x';
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now); hits.set(key, arr); return true;
}

function publicContent() {
  const { settings, services, reviews } = db;
  const { /* nothing private in settings */ ...s } = settings;
  return { settings: s, services, reviews };
}

function cleanSettings(s) {
  const d = DEFAULTS.settings, out = {};
  for (const k of Object.keys(d)) {
    if (k === 'rating') out[k] = Math.min(5, Math.max(0, Number(s[k]) || d[k]));
    else if (k === 'reviewCount') out[k] = Math.max(0, parseInt(s[k], 10) || 0);
    else out[k] = str(s[k], k === 'about' || k === 'heroSub' ? 1500 : 300);
  }
  return out;
}
const ICONS = ['drop', 'wrench', 'hammer', 'pipe', 'bolt', 'check'];
const cleanServices = a => (Array.isArray(a) ? a : []).slice(0, 24).map(x => ({
  icon: ICONS.includes(x.icon) ? x.icon : 'drop', title: str(x.title, 80), text: str(x.text, 400) })).filter(x => x.title);
const cleanReviews = a => (Array.isArray(a) ? a : []).slice(0, 50).map(x => ({
  name: str(x.name, 80), meta: str(x.meta, 80), stars: Math.min(5, Math.max(1, parseInt(x.stars, 10) || 5)), text: str(x.text, 600) })).filter(x => x.name && x.text);

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

// ---------- API ----------
async function api(req, res, url) {
  const m = req.method, p = url.pathname;

  if (m === 'GET' && p === '/api/content') return json(res, 200, publicContent());

  if (m === 'POST' && p === '/api/quote') {
    if (!rateLimit('q:' + ip(req), 5, 3600_000)) return json(res, 429, { error: 'Too many requests. Please call us instead.' });
    const b = await readBody(req);
    if (b.website) return json(res, 200, { ok: true }); // honeypot
    const q = {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'new', notes: '',
      name: str(b.name, 100), phone: str(b.phone, 40), email: str(b.email, 120),
      service: str(b.service, 80), urgency: ['Emergency', 'This week', 'Flexible'].includes(b.urgency) ? b.urgency : 'Flexible',
      address: str(b.address, 200), message: str(b.message, 2000)
    };
    if (!q.name || !q.phone || !q.message) return json(res, 400, { error: 'Name, phone and a short description are required.' });
    db.inquiries.unshift(q); saveDb();
    return json(res, 201, { ok: true });
  }

  if (m === 'POST' && p === '/api/admin/login') {
    const k = ip(req), f = loginFails.get(k);
    if (f && f.until > Date.now()) return json(res, 429, { error: 'Too many attempts. Try again in a few minutes.' });
    const b = await readBody(req);
    if (!checkPassword(b.password)) {
      const n = (f?.n || 0) + 1;
      loginFails.set(k, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
      return json(res, 401, { error: 'Wrong password.' });
    }
    loginFails.delete(k);
    const t = crypto.randomBytes(32).toString('hex');
    sessions.set(t, Date.now() + SESSION_MS);
    return json(res, 200, { ok: true }, { 'Set-Cookie': `ajp_session=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}` });
  }

  if (!p.startsWith('/api/admin/')) return json(res, 404, { error: 'Not found' });
  if (!isAdmin(req)) return json(res, 401, { error: 'Login required' });
  // CSRF: state-changing requests must be same-origin
  if (m !== 'GET') {
    const o = req.headers.origin;
    if (o && new URL(o).host !== req.headers.host) return json(res, 403, { error: 'Bad origin' });
  }

  if (m === 'POST' && p === '/api/admin/logout') {
    sessions.delete(cookies(req).ajp_session);
    return json(res, 200, { ok: true }, { 'Set-Cookie': 'ajp_session=; HttpOnly; Path=/; Max-Age=0' });
  }
  if (m === 'GET' && p === '/api/admin/me') return json(res, 200, { ok: true });

  if (m === 'GET' && p === '/api/admin/inquiries') return json(res, 200, db.inquiries);

  if (m === 'GET' && p === '/api/admin/inquiries.csv') {
    const esc = v => { let s = String(v ?? '').replace(/\r?\n/g, ' '); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const cols = ['createdAt', 'status', 'name', 'phone', 'email', 'service', 'urgency', 'address', 'message', 'notes'];
    const csv = [cols.join(','), ...db.inquiries.map(i => cols.map(c => esc(i[c])).join(','))].join('\n');
    return send(res, 200, csv, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="quote-requests.csv"' });
  }

  let mm = p.match(/^\/api\/admin\/inquiries\/([\w-]+)$/);
  if (mm) {
    const i = db.inquiries.findIndex(x => x.id === mm[1]);
    if (i < 0) return json(res, 404, { error: 'Not found' });
    if (m === 'DELETE') { db.inquiries.splice(i, 1); saveDb(); return json(res, 200, { ok: true }); }
    if (m === 'PATCH') {
      const b = await readBody(req);
      if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return json(res, 400, { error: 'Bad status' }); db.inquiries[i].status = b.status; }
      if (b.notes !== undefined) db.inquiries[i].notes = str(b.notes, 3000);
      saveDb(); return json(res, 200, db.inquiries[i]);
    }
  }

  if (m === 'GET' && p === '/api/admin/content') return json(res, 200, publicContent());
  if (m === 'PUT' && p === '/api/admin/content') {
    const b = await readBody(req);
    if (b.settings) db.settings = cleanSettings(b.settings);
    if (b.services) db.services = cleanServices(b.services);
    if (b.reviews) db.reviews = cleanReviews(b.reviews);
    saveDb(); return json(res, 200, publicContent());
  }

  if (m === 'POST' && p === '/api/admin/password') {
    const b = await readBody(req);
    if (!checkPassword(b.current)) return json(res, 403, { error: 'Current password is wrong.' });
    if (str(b.next, 200).length < 8) return json(res, 400, { error: 'New password must be at least 8 characters.' });
    if (auth.fromEnv) return json(res, 400, { error: 'Password is set by the ADMIN_PASSWORD environment variable.' });
    const salt = crypto.randomBytes(16).toString('hex');
    auth = { salt, hash: hash(b.next, salt) };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(auth));
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'Not found' });
}

// ---------- static ----------
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/admin' || p === '/admin/') p = '/admin.html';
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    send(res, 200, buf, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' });
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    serveStatic(req, res, url);
  } catch (e) {
    json(res, 400, { error: 'Bad request' });
  }
}).listen(PORT, () => console.log(`Anthony James Plumbing running on http://localhost:${PORT}  (owner dashboard: /admin)`));
