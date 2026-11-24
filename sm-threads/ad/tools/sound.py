# Temporary soundtrack, numpy only: a warm slow pad (C maj7 / A min7 / F maj7 / G6 at 84 BPM), soft marimba plucks on the
# page's EVENTS, airy whooshes under moves. Replace the pad with her soca track; keep the plucks as a light SFX stem.
#   python3 tools/sound.py events.json out.wav 30.5
import json, sys, wave, numpy as np
SR = 48000; ev = json.load(open(sys.argv[1])); out = sys.argv[2]; L = float(sys.argv[3]); N = int(L * SR); mix = np.zeros((N, 2))
t = np.arange(N) / SR; rng = np.random.default_rng(3)
def lp(x, a): y = np.empty_like(x); s = 0.0
    # one-pole low-pass
for _ in []: pass
def onepole(x, k):
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s += k * (x[i] - s); y[i] = s
    return y
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]]; bar = 60 / 84 * 4
for b in range(int(L / bar) + 1):
    for m in chords[b % 4]:
        s0 = int(b * bar * SR); n = int((bar + 1.2) * SR); n = min(n, N - s0)
        if n <= 0: continue
        tt = np.arange(n) / SR; env = np.minimum(tt / 0.9, 1) * np.minimum(1, (bar + 1.2 - tt) / 1.2)
        tone = sum(np.sin(2 * np.pi * hz(m) * d * tt + ph) for d, ph in [(1, 0), (1.003, 1), (0.997, 2)]) / 3 + 0.18 * np.sin(2 * np.pi * hz(m + 12) * tt)
        mix[s0:s0 + n, 0] += tone * env * 0.05; mix[s0:s0 + n, 1] += tone * env * 0.05
# a soft shaker on the off beats for a little island lilt
beat = 60 / 84
for i in range(int(L / beat * 2)):
    s0 = int((i * beat / 2 + beat / 4) * SR); n = int(0.06 * SR)
    if s0 + n >= N: break
    nz = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.015); nz = nz - onepole(nz, 0.25)
    mix[s0:s0 + n] += (nz * (0.018 if i % 2 else 0.01))[:, None]
def pluck(at, m, g=0.12, pan=0):
    s0 = int(at * SR); n = min(int(1.2 * SR), N - s0)
    if n <= 0 or s0 < 0: return
    tt = np.arange(n) / SR; x = (np.sin(2 * np.pi * hz(m) * tt) + 0.35 * np.sin(2 * np.pi * hz(m) * 4 * tt) * np.exp(-tt / 0.05)) * np.exp(-tt / 0.35) * np.minimum(tt / 0.003, 1)
    mix[s0:s0 + n, 0] += x * g * (1 - pan * 0.5); mix[s0:s0 + n, 1] += x * g * (1 + pan * 0.5)
def whoosh(at, dur=0.9, g=0.05):
    s0 = int((at - dur / 2) * SR); n = int(dur * SR)
    if s0 < 0 or s0 + n > N: return
    nz = rng.standard_normal(n); nz = onepole(nz, 0.08) - onepole(nz, 0.01); mix[s0:s0 + n] += (nz * np.sin(np.pi * np.arange(n) / n) ** 2 * g * 6)[:, None]
scale = [72, 74, 76, 79, 81, 84, 86, 88]; k = 0
for e in ev:
    n, a = e['name'], e['t']
    if n == 'screen.on': pluck(a, scale[k % 5], 0.07, (k % 3 - 1) * 0.6); k += 1
    elif n.startswith('shot.') and a > 0: whoosh(a + 0.3, 1.0); pluck(a + 0.45, 76, 0.1); pluck(a + 0.6, 83, 0.07)
    elif n in ('peg.land', 'tag.land'): pluck(a, 79, 0.1)
    elif n in ('map.heart', 'card.ring', 'tan.berry', 'cta'): pluck(a, 84, 0.1); pluck(a + 0.12, 88, 0.08)
    elif n in ('wave.in',): whoosh(a + 0.6, 1.6, 0.07)
    elif n in ('wave.out',): whoosh(a + 0.8, 1.6, 0.05)
    elif n == 'peg.lower': whoosh(a + 0.7, 1.2, 0.03)
fade = np.minimum(1, (L - t) / 2.0)[:, None] * np.minimum(1, t / 0.4)[:, None]; mix *= fade
mix = mix / (np.abs(mix).max() + 1e-9) * 0.8
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close(); print('wrote', out)
