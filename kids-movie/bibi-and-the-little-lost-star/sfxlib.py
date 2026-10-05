"""Procedural sound effects, bell/pluck instruments and ambience (all synthesised with numpy/scipy)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
TAU = 2 * np.pi


def T(dur):
    return np.arange(int(dur * SR)) / SR


def exp_env(n_or_dur, tau):
    t = T(n_or_dur) if isinstance(n_or_dur, float) else np.arange(n_or_dur) / SR
    return np.exp(-t / tau)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, f0, f1, order=2):
    return sosfilt(butter(order, [f0, min(f1, SR / 2 - 100)], "band", fs=SR, output="sos"), x)


def fade(x, a=.01, b=.03):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def norm(x, peak=.9):
    p = np.abs(x).max()
    return x * (peak / p) if p > 1e-9 else x


def reverb(x, rt=1.6, wet=.25, seed=3, damp=3500):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / rt))
    ir = lp(ir, damp)
    ir[: int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))
    ir /= np.sqrt((ir ** 2).sum()) + 1e-9
    wetsig = fftconvolve(x, ir)[: len(x) + n // 2]
    out = np.zeros(len(wetsig)); out[: len(x)] += x * (1 - wet * .5); out += wetsig * wet * 1.6
    return out


# ---------------------------------------------------------------- instruments (note renderers)
def bell(freq, dur=1.6, amp=1.0, bright=1.0):
    t = T(dur)
    parts = [(1, 1, 1.0), (2.76, .5, .45), (5.4, .25, .22), (8.9, .12, .1)]
    x = sum(a * np.sin(TAU * freq * r * t + i) * np.exp(-t / (dur * d * .45)) for i, (r, a, d) in enumerate([(p[0], p[1] * (1 if i == 0 else bright), p[2]) for i, p in enumerate(parts)]))
    x *= np.minimum(1, t / .002)
    return x * amp


def musicbox(freq, dur=1.4, amp=1.0):
    t = T(dur)
    x = (np.sin(TAU * freq * t) + .35 * np.sin(TAU * freq * 3 * t) * np.exp(-t / .25) + .18 * np.sin(TAU * freq * 6.01 * t) * np.exp(-t / .12)) * np.exp(-t / (dur * .28))
    return x * np.minimum(1, t / .002) * amp


def pluck(freq, dur=.7, amp=1.0, tone=1.0):
    t = T(dur)
    x = np.zeros_like(t)
    for h in range(1, 9):
        x += (1.0 / h ** 1.15) * np.sin(TAU * freq * h * t + h) * np.exp(-t / (.32 / (1 + h * .55 * tone)))
    return x * np.minimum(1, t / .002) * amp * .9


def uke(freq, dur=.5, amp=1.0):
    return pluck(freq, dur, amp, tone=1.4)


def piano(freq, dur=1.6, amp=1.0):
    t = T(dur)
    x = np.zeros_like(t)
    for h in range(1, 7):
        x += (1.0 / h ** 1.3) * np.sin(TAU * freq * h * t * (1 + .0003 * h * h)) * np.exp(-t / (1.1 / (1 + h * .7)))
    return x * np.minimum(1, t / .003) * amp


def pad(freq, dur=3.0, amp=1.0, att=.6, rel=.8):
    t = T(dur)
    x = np.zeros_like(t)
    for det in (-.004, 0, .004):
        f = freq * (1 + det)
        x += np.sin(TAU * f * t) + .3 * np.sin(TAU * 2 * f * t) + .12 * np.sin(TAU * 3 * f * t)
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel))
    return x * env * amp * .33


def bass(freq, dur=.6, amp=1.0):
    t = T(dur)
    x = np.sin(TAU * freq * t) + .4 * np.sin(TAU * 2 * freq * t) * np.exp(-t / .2)
    return x * np.exp(-t / (dur * .6)) * np.minimum(1, t / .004) * amp


def flute(freq, dur=1.0, amp=1.0, vib=5.0):
    t = T(dur)
    f = freq * (1 + .004 * np.sin(TAU * vib * t) * np.minimum(1, t / .4))
    ph = np.cumsum(f) / SR * TAU
    x = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    breath = bp(np.random.default_rng(int(freq)).standard_normal(len(t)), freq * 2, freq * 5) * .05
    env = np.minimum(1, t / .08) * np.minimum(1, np.maximum(0, (dur - t) / .12))
    return (x + breath) * env * amp * .7


def clarinet(freq, dur=1.0, amp=1.0, vib=4.8):
    t = T(dur)
    f = freq * (1 + .003 * np.sin(TAU * vib * t) * np.minimum(1, t / .5))
    ph = np.cumsum(f) / SR * TAU
    x = np.sin(ph) + .45 * np.sin(3 * ph) + .22 * np.sin(5 * ph) + .1 * np.sin(7 * ph)
    env = np.minimum(1, t / .05) * np.minimum(1, np.maximum(0, (dur - t) / .08))
    return lp(x, 3000) * env * amp * .55


def shaker(dur=.12, amp=1.0, seed=0):
    n = np.random.default_rng(seed).standard_normal(int(dur * SR))
    return hp(n, 5000) * np.exp(-np.arange(len(n)) / SR / (dur * .35)) * amp * .5


def kick(amp=1.0):
    t = T(.28)
    f = 120 * np.exp(-t * 18) + 45
    return np.sin(np.cumsum(f) / SR * TAU) * np.exp(-t / .09) * amp


def clap(amp=1.0, seed=1):
    r = np.random.default_rng(seed)
    n = r.standard_normal(int(.14 * SR))
    x = bp(n, 900, 3500) * np.exp(-np.arange(len(n)) / SR / .035)
    return x * amp * .8


def woodblock(freq=900, amp=1.0):
    t = T(.12)
    return (np.sin(TAU * freq * t) + .4 * np.sin(TAU * freq * 2.4 * t)) * np.exp(-t / .02) * amp


# ---------------------------------------------------------------- sound effects
def _mix(parts, length):
    out = np.zeros(int(length * SR))
    for t0, x in parts:
        i = int(t0 * SR)
        if i >= len(out): continue
        j = min(len(out), i + len(x)); out[i:j] += x[: j - i]
    return out


PENT = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]  # C major pentatonic, high


def fx_sparkle(seed=1, dur=1.4, n=7, start=0):
    r = np.random.default_rng(seed)
    parts = [(i * .075 + r.uniform(0, .03), bell(mtof(PENT[min(len(PENT) - 1, start + i)] + (12 if i > 4 else 0)), .9, .35 + .05 * r.random())) for i in range(n)]
    return reverb(_mix(parts, dur), 1.2, .3)


def fx_sparkle_run(seed=2):
    return fx_sparkle(seed, 2.8, 16, 0) * .8 + fx_sparkle(seed + 5, 2.8, 12, 2) * .5


def fx_pop(n=1):
    t = T(.3)
    f = 520 + 90 * n * .6 + 700 * np.exp(-t * 28)
    b = np.sin(np.cumsum(f) / SR * TAU) * np.exp(-t / .045)
    ding = bell(mtof(PENT[(n - 1) % 8 + 1]), .5, .35)
    return _mix([(0, b * .7), (.02, ding)], .5)


def fx_door():
    t = T(1.0); r = np.random.default_rng(4)
    creak = np.sin(np.cumsum(260 + 90 * np.sin(TAU * 3.2 * t) + 60 * t) / SR * TAU) * np.minimum(1, t / .1) * np.maximum(0, 1 - t / .7) * .25
    creak = lp(creak, 900)
    thump = np.zeros_like(t); i = int(.72 * SR); tt = T(.2); thump[i:i + len(tt)] = np.sin(TAU * 80 * tt) * np.exp(-tt / .05) * .7
    click = np.zeros_like(t); click[i - 400:i] = r.standard_normal(400) * np.linspace(0, 1, 400) * .08
    return creak + thump + click


def fx_star_whoosh():
    d = 2.2; t = T(d); r = np.random.default_rng(7)
    n = r.standard_normal(len(t))
    sweep = np.sin(np.cumsum(2400 - 1700 * (t / d) ** .6) / SR * TAU)
    env = np.sin(np.pi * np.minimum(1, t / d)) ** 1.4
    whoosh = bp(n, 800, 7000) * env * .35 + sweep * env * .12
    sp = fx_sparkle(11, d, 14, 3) * .6
    return reverb(whoosh, 1.4, .25)[: len(t)] + sp[: len(t)]


def fx_hug():
    r = np.random.default_rng(9); n = r.standard_normal(int(.7 * SR))
    x = bp(n, 300, 2200) * np.sin(np.pi * np.linspace(0, 1, len(n))) ** 2 * .22
    return x + bell(mtof(84), 1.0, .12)[: len(x)] if len(x) <= int(1.0 * SR) else x


def fx_rustle(seed=1):
    r = np.random.default_rng(seed); n = r.standard_normal(int(.9 * SR)); t = T(.9)
    am = (.5 + .5 * np.sin(TAU * 11 * t + r.random() * 6)) ** 2 * np.sin(np.pi * t / .9)
    return bp(n, 1500, 7500) * am * .5


def fx_ribbit(two=False):
    def one(f0):
        t = T(.34); f = f0 + 60 * np.sin(TAU * 9 * t)
        x = np.sin(np.cumsum(f) / SR * TAU) * (.55 + .45 * np.sin(TAU * 38 * t)) * np.sin(np.pi * t / .34) ** .6
        return lp(x, 1800) * .45
    parts = [(0, one(230)), (.28, one(280))]
    if two: parts += [(.55, one(190)), (.84, one(250))]
    return _mix(parts, 1.3 if two else .7)


def fx_plop():
    t = T(.35); f = 900 * np.exp(-t * 9) + 140
    x = np.sin(np.cumsum(f) / SR * TAU) * np.exp(-t / .08)
    n = np.random.default_rng(2).standard_normal(len(t)); x += lp(n, 2500) * np.exp(-t / .03) * .25
    return reverb(x * .55, .6, .18)[: len(t)]


def fx_splash_small():
    n = np.random.default_rng(5).standard_normal(int(.9 * SR)); t = T(.9)
    x = bp(n, 600, 5000) * np.exp(-t / .22) * .4
    p = fx_plop(); x[: len(p)] += p * .5
    return x


def fx_boing():
    t = T(.7); f = 190 + 260 * np.sin(np.pi * np.minimum(1, t / .5)) ** 1.5 + 12 * np.sin(TAU * 22 * t)
    ph = np.cumsum(f) / SR * TAU
    return (np.sin(ph) + .4 * np.sin(2 * ph)) * np.exp(-t / .3) * .55


def fx_turtle_yawn():
    d = 1.5; t = T(d); r = np.random.default_rng(3)
    f = 150 + 40 * np.sin(np.pi * t / d)
    x = (np.sin(np.cumsum(f) / SR * TAU) + .5 * np.sin(np.cumsum(f * 2) / SR * TAU)) * np.sin(np.pi * t / d) ** 1.2
    return lp(x, 900) * .25 + bp(r.standard_normal(len(t)), 400, 1500) * np.sin(np.pi * t / d) * .08


def fx_sniffle():
    r = np.random.default_rng(6); parts = []
    for i, t0 in enumerate([0, .22, .5]):
        n = r.standard_normal(int(.12 * SR)); parts.append((t0, bp(n, 1200, 4500) * np.exp(-np.arange(len(n)) / SR / .04) * .5))
    return _mix(parts, .7)


def fx_flap(seed=0):
    r = np.random.default_rng(seed); n = r.standard_normal(int(.22 * SR)); t = T(.22)
    return bp(n, 200, 1800) * np.sin(np.pi * t / .22) ** 2 * .35


def fx_owl_flap_run():
    return _mix([(i / 1.9, fx_flap(i)) for i in range(5)], 3.0)


def fx_hop(seed=0):
    t = T(.11); r = np.random.default_rng(seed)
    return (np.sin(TAU * (170 + 10 * r.random()) * t) * np.exp(-t / .028) + lp(r.standard_normal(len(t)), 700) * np.exp(-t / .012) * .5) * .8


def fx_turtle_step(seed=0):
    t = T(.16); r = np.random.default_rng(seed)
    return (lp(r.standard_normal(len(t)), 600) * np.exp(-t / .03) + np.sin(TAU * 90 * t) * np.exp(-t / .05) * .6) * .6


def _squeak_raw(f0=1900, f1=2900, dur=.28):
    t = T(dur)
    f = f0 + (f1 - f0) * (t / dur) ** .7 + 25 * np.sin(TAU * 30 * t)
    ph = np.cumsum(f) / SR * TAU
    return (np.sin(ph) + .35 * np.sin(2 * ph) + .12 * np.sin(3 * ph)) * np.sin(np.pi * t / dur) ** .7


def fx_squeak():
    return _squeak_raw() * .55


def fx_echo_short():
    s = _squeak_raw() * .35
    return _mix([(0, lp(s, 2200) * .6), (.16, lp(s, 1600) * .35), (.30, lp(s, 1200) * .15)], .8)


def fx_echo_long():
    s = _squeak_raw() * .4
    parts = [(i * .42, lp(s, max(500, 2800 - i * 380)) * (.7 ** i)) for i in range(7)]
    return reverb(_mix(parts, 3.4), 2.0, .35)[: int(3.4 * SR)]


def special_voice(name):
    """Voice-like sounds for Odo (no speech): returns mono float32 at 44.1k."""
    if name == "squeak":
        return fade(np.concatenate([np.zeros(int(.12 * SR)), _squeak_raw() * .6, np.zeros(int(.5 * SR))]), .01, .02).astype(np.float32)
    if name == "hoot_eep":
        t = T(.8); f = 330 - 55 * (t / .8) + 5 * np.sin(TAU * 5 * t)
        ph = np.cumsum(f) / SR * TAU
        hoot = (np.sin(ph) + .35 * np.sin(2 * ph) + .12 * np.sin(3 * ph)) * np.sin(np.pi * np.minimum(1, t / .8)) ** .8 * .5
        t2 = T(.5)
        f2 = np.where(t2 < .28, 330 - 40 * (t2 / .28), 290 + (2600 - 290) * np.clip((t2 - .28) / .2, 0, 1) ** 1.3)
        ph2 = np.cumsum(f2) / SR * TAU
        hoot2 = (np.sin(ph2) + .3 * np.sin(2 * ph2)) * np.sin(np.pi * np.minimum(1, t2 / .5)) ** .6 * .5
        x = np.concatenate([np.zeros(int(.15 * SR)), hoot, np.zeros(int(.35 * SR)), hoot2, np.zeros(int(.3 * SR))])
        return fade(x, .01, .05).astype(np.float32)
    raise KeyError(name)


def fx_chime_up(soft=False):
    notes = [72, 76, 79, 84, 88, 91, 96] if not soft else [72, 76, 79, 84, 88]
    d = 2.6 if not soft else 1.9
    parts = [(i * (.12 if not soft else .15), bell(mtof(n), 1.6, .38 if not soft else .28)) for i, n in enumerate(notes)]
    x = reverb(_mix(parts, d), 1.8, .3)
    if not soft:
        t = T(d); sh = bp(np.random.default_rng(1).standard_normal(len(t)), 5000, 12000) * np.sin(np.pi * t / d) ** 2 * .06
        x[: len(sh)] += sh
    return x


def fx_burst():
    d = 3.0
    chord = [bell(mtof(m), 2.4, .3) for m in (84, 88, 91, 96)]
    x = _mix([(0, c) for c in chord], d)
    n = np.random.default_rng(3).standard_normal(int(d * SR)); t = T(d)
    x += hp(n, 4000) * np.exp(-t / .5) * .12
    r = np.random.default_rng(8)
    x += _mix([(r.uniform(.1, 2.2), bell(mtof(r.choice(PENT)), 1.0, .14)) for _ in range(22)], d)
    return reverb(x, 2.2, .35)


def fx_twinkle_all():
    r = np.random.default_rng(12); d = 3.4
    x = _mix([(r.uniform(0, 2.8), bell(mtof(r.choice(PENT) + 12), .8, .06 + .08 * r.random())) for _ in range(60)], d)
    return reverb(x, 1.6, .3)


def fx_twinkle_wink():
    x = _mix([(0, bell(mtof(96), 1.6, .4)), (.07, bell(mtof(103), 1.2, .22)), (.2, bell(mtof(108), .9, .12))], 1.8)
    return reverb(x, 1.6, .3)


SFX = {
    "sparkle": lambda: fx_sparkle(), "sparkle_run": fx_sparkle_run, "door": fx_door, "star_whoosh": fx_star_whoosh, "hug": fx_hug,
    "rustle": fx_rustle, "ribbit": fx_ribbit, "ribbit_two": lambda: fx_ribbit(True), "plop": fx_plop, "splash_small": fx_splash_small,
    "boing": fx_boing, "turtle_yawn": fx_turtle_yawn, "sniffle": fx_sniffle, "flap": fx_flap, "owl_flap_run": fx_owl_flap_run,
    "hop": fx_hop, "turtle_step": fx_turtle_step, "squeak": fx_squeak, "echo_short": fx_echo_short, "echo_long": fx_echo_long,
    "chime_up": lambda: fx_chime_up(False), "chime_up_soft": lambda: fx_chime_up(True), "burst": fx_burst, "twinkle_all": fx_twinkle_all,
    "twinkle_wink": fx_twinkle_wink,
}


def render_sfx(name, seed=0):
    if name.startswith("pop:"):
        return fx_pop(int(name.split(":")[1]))
    if name == "pop":
        return fx_pop(1)
    f = SFX[name]
    try:
        return f(seed) if name in ("hop", "turtle_step", "flap", "rustle") else f()
    except TypeError:
        return f()


# ---------------------------------------------------------------- ambience
def crickets(dur, seed=0):
    r = np.random.default_rng(seed); t = T(dur); out = np.zeros_like(t)
    for k in range(5):
        f = 3800 + 260 * k + r.uniform(-60, 60); rate = 3.1 + .35 * k
        gate = (np.sin(TAU * rate * t + r.uniform(0, 6)) > .35) * (np.sin(TAU * (.07 + .02 * k) * t + r.uniform(0, 6)) > -.2)
        trill = np.sin(TAU * f * t) * (.5 + .5 * np.sin(TAU * 60 * t))
        out += trill * np.convolve(gate.astype(float), np.ones(300) / 300, "same") * .018
    return out


def wind(dur, seed=0, gain=1.0):
    r = np.random.default_rng(seed); n = r.standard_normal(int(dur * SR)); t = T(dur)
    x = lp(n, 500) * (.5 + .5 * np.sin(TAU * .09 * t + 1)) * .35 + bp(n, 400, 1400) * (.5 + .5 * np.sin(TAU * .13 * t)) * .12
    return x * gain * .6


def frogs(dur, seed=0):
    r = np.random.default_rng(seed); out = np.zeros(int(dur * SR)); t = 1.0
    while t < dur - 1:
        x = fx_ribbit(r.random() < .3) * (.12 + .1 * r.random()); i = int(t * SR); j = min(len(out), i + len(x)); out[i:j] += x[: j - i]
        t += r.uniform(2.2, 6)
    return out


def birds(dur, seed=0):
    r = np.random.default_rng(seed); out = np.zeros(int(dur * SR)); t = .5
    while t < dur - 1:
        n = r.integers(2, 5); f0 = r.uniform(2400, 3600)
        for k in range(n):
            tt = T(.09); f = f0 * (1 + .25 * r.random()) * (1 + .25 * np.sin(TAU * 18 * tt))
            x = np.sin(np.cumsum(f) / SR * TAU) * np.sin(np.pi * tt / .09) * .05
            i = int((t + k * .13) * SR); out[i:i + len(x)] += x[: max(0, min(len(x), len(out) - i))]
        t += r.uniform(3, 8)
    return out


def ambience(kind, dur, seed=0):
    parts = kind.split("_")
    out = np.zeros(int(dur * SR))
    for p in parts:
        if p == "crickets": out += crickets(dur, seed)
        elif p == "wind": out += wind(dur, seed + 1)
        elif p == "frogs": out += frogs(dur, seed + 2)
        elif p == "birds": out += birds(dur, seed + 3)
        elif p == "roomtone": out += lp(np.random.default_rng(seed).standard_normal(len(out)), 220) * .03 + crickets(dur, seed) * .3
    return out
