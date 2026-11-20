"""Sound design for the Bisou reel, synthesised (no samples, nothing licensed) and placed on the page's beat times.
Writes out/bisou_sfx.wav (48 kHz stereo). Music is left for the in-app track. Run: python3 -I tools/sfx.py"""
import os, re, json, numpy as np, wave
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 48000
src = open(R + '/bisou.html').read()
B = json.loads(re.sub(r'(\w+):', r'"\1":', re.search(r'const B = (\{.*?\});', src, re.S).group(1)))
END = B['END']; mix = np.zeros((int(SR * (END + 1)), 2)); rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(SR * d)) / SR
def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); n = min(len(sig), len(mix) - i)
    if n <= 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:i + n, 0] += sig[:n] * gain * l * 1.41; mix[i:i + n, 1] += sig[:n] * gain * r * 1.41
def lp(x, a):   # one-pole low-pass, a in (0,1): smaller = darker
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
def bell(f, d, partials=((1, 1), (2.76, .5), (5.4, .25), (8.9, .12)), decay=6):
    t = t_(d); return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * decay * m ** .5) for m, a in partials) * np.minimum(1, t / .002)
def clink(): return bell(2350 + rng.uniform(-80, 80), .5, ((1, 1), (1.47, .6), (2.63, .35), (3.9, .2)), 11)
def tick(): t = t_(.05); return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 120)
def whoosh(d=.9, bright=.08):
    t = t_(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    a = bright * (0.4 + 0.6 * np.sin(np.pi * t / d)); y = np.empty_like(n); acc = 0.0
    for i, v in enumerate(n): acc += a[i] * (v - acc); y[i] = acc
    return y * env * 3
def crunch(d=.28):
    t = t_(d); y = np.zeros(len(t))
    for _ in range(26):
        s = rng.uniform(0, d * .7); i = int(s * SR); L = int(SR * rng.uniform(.004, .02)); g = rng.uniform(.3, 1) * np.exp(-s * 9)
        y[i:i + L] += rng.standard_normal(L)[:len(y) - i] * g * np.exp(-np.arange(L)[:len(y) - i] / (L / 4))
    return lp(y, .35)
def bubbles(d):
    t = t_(d); y = np.zeros(len(t))
    for _ in range(int(d * 9)):
        s = rng.uniform(0, d - .1); f = rng.uniform(380, 900); tt = t_(.06); b = np.sin(2 * np.pi * f * tt * (1 + tt * 6)) * np.exp(-tt * 70)
        i = int(s * SR); y[i:i + len(b)] += b * rng.uniform(.2, .6)
    return y * np.minimum(1, t / .6) * np.minimum(1, (d - t) / .6)
def sizzle(d):
    t = t_(d); n = rng.standard_normal(len(t)); hi = n - lp(n, .25); crack = (rng.random(len(t)) > .9993) * rng.uniform(1, 3, len(t))
    return (hi * .25 + lp(crack, .6) * .6) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .5)
def swell(d):
    t = t_(d); n = rng.standard_normal(len(t)); return lp(n, .02) * (t / d) ** 2 * 4 + np.sin(2 * np.pi * (180 + 160 * t / d) * t) * .08 * (t / d) ** 2
def clatter():
    y = bell(3100, .6, ((1, 1), (1.73, .7), (2.91, .5), (4.4, .3)), 9); y2 = bell(2600, .5, ((1, 1), (2.2, .6), (3.7, .3)), 12)
    out = np.zeros(int(SR * .8)); out[:len(y)] += y; out[int(SR * .09):int(SR * .09) + len(y2)] += y2 * .7; return out
# hook + plates
add(sizzle(2.6), 0.0, .35)
for i, a in enumerate(B['arrive']):
    add(clink(), a - 0.05, .5, [-.2, .15, -.1, .2, 0][i]); add(tick(), a - 0.25, .12, .6)
for p in B['push'][:4]: add(whoosh(1.0), p - 0.05, .55)
add(bubbles(B['push'][1] - B['arrive'][1] + .4), B['arrive'][1], .18, -.15)
add(bubbles(B['push'][2] - B['arrive'][2] + .4), B['arrive'][2], .12, .15)
add(sizzle(B['push'][3] - B['arrive'][3]), B['arrive'][3], .16)
add(bell(1568, 2.2, decay=1.8) * .6 + bell(2093, 2.2, decay=2.2) * .35, B['arrive'][4] + 0.3, .22)   # sugar
# eaten, lights down, plate becomes the O
add(crunch(), B['eat'][0] - .04, .7, -.1); add(crunch(), B['eat'][1] - .04, .75, .1); add(clatter(), B['eat'][1] + .06, .38, .2)
add(swell(B['ring'][1] - B['ring'][0]), B['ring'][0], .5)
add(bell(880, 1.6, decay=2.4), B['ring'][1], .35)
for j, d in enumerate(B['drops']): add(bell([1320, 1175, 1480][j], .9, ((1, 1), (2.4, .5), (4.1, .25)), 5), d, .28, [-.35, 0, .35][j])
add(whoosh(.5, .2), B['rail'], .18)
add(whoosh(.8, .05), B['card'], .3)
for i in range(5): add(tick(), B['plates'] + i * .09, .18, (i - 2) * .25)
add(bell(1046, 2.4, decay=1.6) * .7 + bell(1568, 2.4, decay=2.0) * .3, B['handle'], .3)
# master: soft-clip, normalise to -1 dBFS peak
mix = np.tanh(mix * 1.2) / np.tanh(1.2); mix *= 10 ** (-1 / 20) / max(1e-9, np.abs(mix).max())
os.makedirs(R + '/out', exist_ok=True)
with wave.open(R + '/out/bisou_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix[:int(SR * END)] * 32767).astype('<i2').tobytes())
print('wrote out/bisou_sfx.wav', round(END, 1), 's')
