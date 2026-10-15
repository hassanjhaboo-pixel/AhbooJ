// Minimal QR Code encoder (byte mode, versions 1-40, ECC L/M/Q/H), after Project Nayuki's qrcodegen (MIT).
// Plus verifyQR(): an independent read-back that checks format bits, Reed-Solomon syndromes and decodes the payload.
//   const q = encodeQR('https://wa.me/...', 'M');  q.size, q.get(x, y) -> true = dark;  verifyQR(q) -> decoded string
const ECC_CW = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const NUM_BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];
const ECL = { L: [0, 1], M: [1, 0], Q: [2, 3], H: [3, 2] }; // [table index, format bits]
const bit = (x, i) => ((x >>> i) & 1) !== 0;
function rawModules(ver) { let r = (16 * ver + 128) * ver + 64; if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; } return r; }
const dataCodewords = (ver, e) => Math.floor(rawModules(ver) / 8) - ECC_CW[e][ver] * NUM_BLOCKS[e][ver];
function gmul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; }
function rsDivisor(deg) { const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1; for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gmul(root, 2); } return r; }
function rsRemainder(data, div) { const r = div.map(() => 0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gmul(c, f); }); } return r; }
function alignPositions(ver, size) { if (ver === 1) return []; const n = Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, r = [6]; for (let p = size - 7; r.length < n; p -= step) r.splice(1, 0, p); return r; }
export function formatBits(eclBits, mask) { const d = (eclBits << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); return ((d << 10) | r) ^ 0x5412; }
export function versionBits(ver) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); return (ver << 12) | r; }
function maskFn(m, x, y) { return [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x * y) % 2 + (x * y) % 3 === 0, ((x * y) % 2 + (x * y) % 3) % 2 === 0, ((x + y) % 2 + (x * y) % 3) % 2 === 0][m]; }

// the grid's function patterns (also used by the verifier to know which modules carry data)
function functionGrid(ver) {
  const size = ver * 4 + 17, mod = [...Array(size)].map(() => new Array(size).fill(false)), fn = [...Array(size)].map(() => new Array(size).fill(false));
  const set = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, dist = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const ap = alignPositions(ver, size), n = ap.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  placeFormat(set, size, 0); // reserve (real bits written later)
  if (ver >= 7) { const b = versionBits(ver); for (let i = 0; i < 18; i++) { const d = bit(b, i), a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, d); set(c, a, d); } }
  return { size, mod, fn };
}
function placeFormat(set, size, bits) {
  for (let i = 0; i <= 5; i++) set(8, i, bit(bits, i));
  set(8, 7, bit(bits, 6)); set(8, 8, bit(bits, 7)); set(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(bits, i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(bits, i));
  set(8, size - 8, true);
}
function dataOrder(size, fn) { // zigzag codeword placement order: list of [x, y]
  const out = []; for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v; if (!fn[y][x]) out.push([x, y]); } }
  return out;
}
function penalty(m, size) {
  let p = 0; const run = len => (len >= 5 ? 3 + (len - 5) : 0);
  for (let y = 0; y < size; y++) { let c = 1; for (let x = 1; x < size; x++) { if (m[y][x] === m[y][x - 1]) c++; else { p += run(c); c = 1; } } p += run(c); }
  for (let x = 0; x < size; x++) { let c = 1; for (let y = 1; y < size; y++) { if (m[y][x] === m[y - 1][x]) c++; else { p += run(c); c = 1; } } p += run(c); }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
  const pats = [[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]];
  for (let y = 0; y < size; y++) for (let x = 0; x + 11 <= size; x++) for (const pt of pats) { if (pt.every((v, k) => +m[y][x + k] === v)) p += 40; if (pt.every((v, k) => +m[x + k][y] === v)) p += 40; }
  let dark = 0; m.forEach(r => r.forEach(v => { dark += v; })); p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return p;
}
export function encodeQR(text, eclName = 'M') {
  const [e, eBits] = ECL[eclName], bytes = [...new TextEncoder().encode(text)];
  let ver = 1; for (; ver <= 40; ver++) { const cc = ver < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCodewords(ver, e) * 8) break; }
  if (ver > 40) throw new Error('text too long for a QR code');
  const cap = dataCodewords(ver, e) * 8, bits = [], push = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  push(4, 4); push(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => push(b, 8));
  push(0, Math.min(4, cap - bits.length)); push(0, (8 - bits.length % 8) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // split into blocks, add ECC, interleave
  const nb = NUM_BLOCKS[e][ver], eccLen = ECC_CW[e][ver], raw = Math.floor(rawModules(ver) / 8), nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) { const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1)); k += dat.length; const ecc = rsRemainder(dat, div); if (i < nShort) dat.push(0); blocks.push(dat.concat(ecc)); }
  const cw = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) cw.push(b[i]); });
  // place, try all masks, keep the lowest penalty
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const { size, mod, fn } = functionGrid(ver), order = dataOrder(size, fn);
    order.forEach(([x, y], i) => { mod[y][x] = i < cw.length * 8 ? bit(cw[i >>> 3], 7 - (i & 7)) : false; });
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn(mask, x, y)) mod[y][x] = !mod[y][x];
    placeFormat((x, y, d) => { mod[y][x] = d; }, size, formatBits(eBits, mask));
    const pen = penalty(mod, size); if (!best || pen < best.pen) best = { pen, mod, size, mask };
  }
  return { size: best.size, version: ver, ecl: eclName, mask: best.mask, modules: best.mod, get: (x, y) => best.mod[y][x] };
}

// ---------------------------------------------------------------- independent read-back
export function verifyQR(q) {
  const size = q.size, ver = (size - 17) / 4, m = (x, y) => q.modules[y][x];
  // format bits, copy 1 — try all 32 codes, accept the exact match
  let fb = 0; const read = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  read.forEach(([x, y], i) => { if (m(x, y)) fb |= 1 << i; });
  let fmt = null; for (const [name, [, eb]] of Object.entries(ECL)) for (let mask = 0; mask < 8; mask++) if (formatBits(eb, mask) === fb) fmt = { name, e: ECL[name][0], mask };
  if (!fmt) throw new Error('format bits invalid');
  // copy 2 must agree
  let fb2 = 0; for (let i = 0; i < 8; i++) if (m(size - 1 - i, 8)) fb2 |= 1 << i; for (let i = 8; i < 15; i++) if (m(8, size - 15 + i)) fb2 |= 1 << i;
  if (fb2 !== fb) throw new Error('format copies disagree');
  // finder pattern sanity (outer ring dark, inner gap light)
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) if (!m(cx - 3, cy) || m(cx - 2, cy) || !m(cx, cy)) throw new Error('finder pattern wrong');
  // unmask + read codewords
  const { fn } = functionGrid(ver), order = dataOrder(size, fn), e = fmt.e;
  const raw = Math.floor(rawModules(ver) / 8), cw = new Array(raw).fill(0);
  order.forEach(([x, y], i) => { if (i < raw * 8) { const v = m(x, y) !== maskFn(fmt.mask, x, y); if (v) cw[i >>> 3] |= 1 << (7 - (i & 7)); } });
  const nb = NUM_BLOCKS[e][ver], eccLen = ECC_CW[e][ver], nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), blocks = [...Array(nb)].map(() => []);
  let k = 0; for (let i = 0; i < shortLen + 1; i++) for (let j = 0; j < nb; j++) { if (i === shortLen - eccLen && j < nShort) continue; if (k < raw) blocks[j].push(cw[k++]); }
  // Reed-Solomon: every syndrome must be zero (roots alpha^0 .. alpha^(eccLen-1))
  let alpha = 1; for (let r = 0; r < eccLen; r++) { for (const b of blocks) { let s = 0; for (const c of b) s = gmul(s, alpha) ^ c; if (s !== 0) throw new Error('Reed-Solomon check failed'); } alpha = gmul(alpha, 2); }
  // parse data (byte mode)
  const data = blocks.flatMap(b => b.slice(0, b.length - eccLen)); let p = 0; const rd = n => { let v = 0; for (let i = 0; i < n; i++, p++) v = (v << 1) | ((data[p >>> 3] >>> (7 - (p & 7))) & 1); return v; };
  if (rd(4) !== 4) throw new Error('not byte mode'); const len = rd(ver < 10 ? 8 : 16), out = []; for (let i = 0; i < len; i++) out.push(rd(8));
  return new TextDecoder().decode(new Uint8Array(out));
}
