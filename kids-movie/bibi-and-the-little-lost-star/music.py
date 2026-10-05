"""Original score: every cue is composed here from simple melodies + chords and rendered with synthesised instruments."""
import numpy as np
from sfxlib import (SR, bell, musicbox, pluck, uke, piano, pad, bass, flute, clarinet, shaker, kick, clap, woodblock, mtof, reverb, lp)

# ---------------------------------------------------------------- tiny sequencer
class Buf:
    def __init__(self, dur):
        self.n = int((dur + 4) * SR)
        self.L = np.zeros(self.n); self.R = np.zeros(self.n)
        self.dur = dur

    def add(self, t0, sig, gain=1.0, pan=0.0):
        if t0 < 0 or t0 * SR >= self.n: return
        i = int(t0 * SR); j = min(self.n, i + len(sig)); s = sig[: j - i] * gain
        a = (pan + 1) * np.pi / 4  # equal-power pan
        self.L[i:j] += s * np.cos(a); self.R[i:j] += s * np.sin(a)

    def out(self, rev=1.4, wet=.2):
        L, R = self.L[: int(self.dur * SR)], self.R[: int(self.dur * SR)]
        if wet > 0:
            L = reverb(L, rev, wet, seed=5)[: len(L)]; R = reverb(R, rev, wet, seed=6)[: len(R)]
        return np.stack([L, R], 1)


CH = {  # name -> (bass midi, chord tones)
    "C": (36, [60, 64, 67]), "Cadd9": (36, [60, 64, 67, 74]), "Cmaj7": (36, [59, 64, 67, 72]), "G": (31, [59, 62, 67]), "Am": (33, [57, 60, 64]), "Am7": (33, [55, 60, 64]),
    "F": (29, [57, 60, 65]), "Fmaj7": (29, [57, 60, 64, 65]), "Dm": (38, [57, 62, 65]), "Em": (40, [59, 62, 67]), "E": (40, [56, 59, 64]), "D": (38, [57, 62, 66]),
    "Bb": (34, [58, 62, 65]), "G7": (31, [59, 62, 65, 67]), "A": (33, [57, 61, 64]), "Bm": (35, [59, 62, 66]),
}


def fade_out(x, secs):
    n = int(secs * SR); x = x.copy(); n = min(n, len(x))
    x[-n:] *= np.linspace(1, 0, n)[:, None]
    return x


def fade_in(x, secs):
    n = min(int(secs * SR), len(x)); x = x.copy(); x[:n] *= np.linspace(0, 1, n)[:, None]
    return x


# ---------------------------------------------------------------- shared melodies
LULLABY = [  # (bar-beat offset, midi, beats) per bar, 3/4, key of C
    ("C", [(0, 64, 1), (1, 67, 1), (2, 72, 1)]), ("G", [(0, 71, 2), (2, 69, 1)]), ("C", [(0, 67, 1), (1, 64, 1), (2, 62, 1)]), ("C", [(0, 60, 3)]),
    ("C", [(0, 64, 1), (1, 67, 1), (2, 72, 1)]), ("F", [(0, 74, 2), (2, 72, 1)]), ("G", [(0, 71, 1), (1, 67, 1), (2, 69, 1)]), ("C", [(0, 67, 3)]),
]


def waltz_bar(b, t0, beat, chord, melody, inst, shift=0, melgain=.8, arp=True, padg=.4, bassg=.5, arpg=.3):
    bm, tones = CH[chord]
    b.add(t0, pad(mtof(tones[0] + shift - 12), beat * 3 + .6, padg, att=.3, rel=.6), 1, -.2)
    b.add(t0, pad(mtof(tones[2 % len(tones)] + shift - 12), beat * 3 + .6, padg * .8, att=.3, rel=.6), 1, .2)
    b.add(t0, bass(mtof(bm + shift + 12), beat * 1.8, bassg))
    if arp:
        for i, n in enumerate([tones[1], tones[2 % len(tones)]]):
            b.add(t0 + (i + 1) * beat, pluck(mtof(n + shift), beat * 1.6, arpg), 1, -.3 + .6 * i)
    for off, m, ln in melody:
        b.add(t0 + off * beat, inst(mtof(m + shift), ln * beat * 1.15 + .3, melgain), 1, .05)


def lullaby(dur, bpm=76, shift=0, inst=musicbox, second=bell, arp=True, bars_end_fade=3.0):
    beat = 60 / bpm; bar = beat * 3; b = Buf(dur); nb = int(dur / bar)
    for i in range(nb):
        chord, mel = LULLABY[i % 8]
        last = (i >= nb - 1)
        if last:
            chord, mel = "C", [(0, 72, 3)]
        use = inst if (i // 8) % 2 == 0 else second
        octave = 12 if (i // 8) % 2 == 1 and use is second else 0
        mel2 = [(o, m + octave, l) for o, m, l in mel]
        waltz_bar(b, i * bar, beat, chord, mel2, use, shift, arp=arp, padg=.35 if not last else .5)
    x = b.out(1.8, .28)
    return fade_out(x, bars_end_fade) * .9


def dusk_wonder(dur, bpm=72):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); r = np.random.default_rng(3)
    prog = ["Cmaj7", "Am7", "Fmaj7", "G"]
    for i in range(int(dur / bar) + 1):
        c = prog[i % 4]; bm, tones = CH[c]; t0 = i * bar
        for k, n in enumerate(tones[:3]):
            b.add(t0, pad(mtof(n - 12), bar + .8, .3, att=.5, rel=.8), 1, -.3 + .3 * k)
        b.add(t0, bass(mtof(bm + 12), beat * 2.5, .5))
        arp = [tones[0], tones[1], tones[2], tones[1] + 12 if len(tones) < 4 else tones[3]]
        for s in range(8):
            n = arp[[0, 1, 2, 3, 2, 1, 2, 3][s]] + (12 if s in (3, 7) else 0)
            b.add(t0 + s * beat / 2, pluck(mtof(n), beat * 1.3, .26), 1, -.4 + .8 * (s / 7))
        if r.random() < .8:
            b.add(t0 + beat * r.choice([1, 2, 3]), bell(mtof(r.choice([79, 81, 84, 86, 88])), 1.6, .18), 1, r.uniform(-.6, .6))
    x = b.out(2.0, .3)
    return fade_out(x, 2.5) * .9


def song(dur, bpm, key_shift, verse, chorus, v_chords, c_chords, intro_chords, melody_inst=bell, pat="C"):
    """18 bars: 2 intro + 8 verse + 8 chorus. Notes are (beat, midi, beats) per bar."""
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur)
    bars = [(ch, None) for ch in intro_chords] + list(zip(v_chords, verse)) + list(zip(c_chords, chorus))
    for i, (chord, mel) in enumerate(bars):
        t0 = i * bar; bm, tones = CH[chord]; s = key_shift
        b.add(t0, pad(mtof(tones[0] + s - 12), bar + .3, .22, att=.3, rel=.4), 1, -.3)
        b.add(t0, pad(mtof(tones[2 % len(tones)] + s - 12), bar + .3, .18, att=.3, rel=.4), 1, .3)
        for beat_i in (0, 2):
            b.add(t0 + beat_i * beat, bass(mtof(bm + s + 12), beat * .9, .55))
        for strum in range(8):  # ukulele-style off-beat strums
            if strum % 2 == 1 or strum == 0:
                for j, n in enumerate(tones):
                    b.add(t0 + strum * beat / 2 + j * .012, uke(mtof(n + s), beat * .5, .17 if strum else .22), 1, -.5 + .3 * j)
        for q in range(8):
            b.add(t0 + q * beat / 2, shaker(.1, .35 if q % 2 else .22, q), 1, .5)
        b.add(t0 + beat, woodblock(1100, .3), 1, .3); b.add(t0 + 3 * beat, woodblock(1300, .3), 1, .3)
        if mel is None:  # intro: little hummed riff on flute
            for q, n in enumerate([tones[1], tones[2 % len(tones)], tones[0] + 12, tones[2 % len(tones)]]):
                b.add(t0 + q * beat, flute(mtof(n + s + 12), beat * .9, .4), 1, .1)
        else:
            for off, m, ln in mel:
                b.add(t0 + off * beat, melody_inst(mtof(m + s), ln * beat * 1.2 + .25, .6), 1, .05)
                b.add(t0 + off * beat, flute(mtof(m + s), ln * beat * .95, .3), 1, -.1)
    x = b.out(1.4, .2)
    return fade_out(x, .8) * .9


def song1(dur):
    V = [[(0, 64, 1), (1, 67, 1), (2, 69, 1), (3, 67, 1)], [(0, 64, 1), (1, 67, 1), (2, 72, 2)], [(0, 62, 1), (1, 65, 1), (2, 67, 1), (3, 65, 1)], [(0, 64, 1), (1, 62, 1), (2, 62, 2)],
         [(0, 72, 1), (1, 69, 1), (2, 72, 1), (3, 69, 1)], [(0, 67, 1), (1, 64, 1), (2, 67, 2)], [(0, 69, 1), (1, 67, 1), (2, 65, 1), (3, 69, 1)], [(0, 67, 1), (1, 64, 1), (2, 60, 2)]]
    C = [[(0, 67, 1), (1, 67, 1), (2, 72, 1), (3, 72, 1)], [(0, 76, 1), (1, 74, 1), (2, 72, 2)], [(0, 72, 1), (1, 72, 1), (2, 76, 1), (3, 76, 1)], [(0, 74, 1), (1, 71, 1), (2, 67, 2)],
         [(0, 69, 1), (1, 69, 1), (2, 72, 1), (3, 72, 1)], [(0, 77, 1), (1, 76, 1), (2, 72, 2)], [(0, 74, 1), (1, 74, 1), (2, 71, 1), (3, 67, 1)], [(0, 72, 4)]]
    return song(dur, 104, 0, V, C, ["C", "C", "G", "G", "F", "C", "F", "C"], ["C", "C", "Am", "G", "F", "F", "G", "C"], ["C", "G"])


def song2(dur):
    V = [[(0, 71, 1), (1, 71, 1), (2, 74, 1), (3, 71, 1)], [(0, 67, 1), (1, 71, 1), (2, 74, 2)], [(0, 72, 1), (1, 72, 1), (2, 76, 1), (3, 72, 1)], [(0, 69, 1), (1, 71, 1), (2, 67, 2)],
         [(0, 76, 1), (1, 74, 1), (2, 72, 1), (3, 71, 1)], [(0, 69, 1), (1, 67, 1), (2, 67, 2)], [(0, 69, 1), (1, 69, 1), (2, 74, 1), (3, 72, 1)], [(0, 71, 1), (1, 67, 1), (2, 67, 2)]]
    C = [[(0, 74, 1), (1, 71, 1), (2, 74, 1), (3, 71, 1)], [(0, 74, 1), (1, 79, 2), (3, 74, 1)], [(0, 76, 1), (1, 72, 1), (2, 76, 1), (3, 72, 1)], [(0, 76, 1), (1, 79, 2), (3, 76, 1)],
         [(0, 78, 1), (1, 74, 1), (2, 78, 1), (3, 74, 1)], [(0, 78, 1), (1, 74, 1), (2, 69, 2)], [(0, 76, 1), (1, 74, 1), (2, 71, 1), (3, 67, 1)], [(0, 79, 4)]]
    return song(dur, 116, 0, V, C, ["G", "G", "C", "G", "C", "G", "D", "G"], ["G", "G", "C", "C", "D", "D", "Em", "G"], ["G", "D"], melody_inst=bell)


def sneaky(dur, bpm=96):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); nb = int(dur / bar) + 1; r = np.random.default_rng(11)
    minor = ["Am", "Am", "Dm", "E"]; major = ["C", "F", "G", "C"]
    for i in range(nb):
        t0 = i * bar; c = (minor if i * bar < dur * .52 else major)[i % 4]; bm, tones = CH[c]
        for q, root in enumerate([bm + 12, tones[2 % len(tones)] - 12, bm + 12, tones[1] - 12]):
            b.add(t0 + q * beat, pluck(mtof(root), beat * .7, .5, tone=.8), 1, -.2)
        for q in range(8):
            if q % 2 == 1 and r.random() < .75:
                b.add(t0 + q * beat / 2, pluck(mtof(tones[q // 2 % len(tones)] + 12), beat * .3, .32, tone=1.4), 1, r.uniform(-.5, .5))
        if i * bar < dur * .52:
            b.add(t0, pad(mtof(tones[0] - 12), bar, .18, att=.8, rel=.8), 1, 0)
        else:
            b.add(t0, pad(mtof(tones[0] - 12), bar, .3, att=.5, rel=.8), 1, 0)
            for q, n in enumerate([tones[0] + 12, tones[1] + 12, tones[2 % len(tones)] + 12]):
                b.add(t0 + q * beat * 1.3, flute(mtof(n), beat * 1.2, .35), 1, .2)
    x = b.out(1.6, .22)
    return fade_out(x, 2.0) * .9


def pond(dur, bpm=84):
    beat = 60 / bpm; bar = beat * 3; b = Buf(dur); nb = int(dur / bar) + 1
    MEL = [("F", [(0, 72, 2), (2, 69, 1)]), ("Dm", [(0, 74, 1), (1, 72, 1), (2, 69, 1)]), ("Bb", [(0, 70, 2), (2, 67, 1)]), ("C", [(0, 72, 3)]),
           ("F", [(0, 77, 2), (2, 76, 1)]), ("Dm", [(0, 74, 2), (2, 72, 1)]), ("Bb", [(0, 70, 1), (1, 72, 1), (2, 74, 1)]), ("C", [(0, 72, 3)])]
    for i in range(nb):
        chord, mel = MEL[i % 8]
        use = flute if (i // 8) % 2 == 0 else bell
        if i * bar > dur - bar * 1.5:
            chord, mel = "F", [(0, 72, 3)]
        waltz_bar(b, i * bar, beat, chord, mel, use, 0, melgain=.55 if use is flute else .5, padg=.38, arpg=.3)
        if i % 2 == 1:
            b.add(i * bar + beat * 1.5, bell(mtof(84 + [0, 2, 4, 7][i % 4]), 1.2, .12), 1, .5)
    x = b.out(2.0, .28)
    return fade_out(x, 3.0) * .9


def oak(dur, bpm=112):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); nb = int(dur / bar) + 1
    prog = ["C", "Am", "F", "G"]
    MEL = [[(0, 72, .5), (.5, 76, .5), (1, 79, .5), (1.5, 76, .5), (2, 72, 1), (3, 67, 1)], [(0, 69, .5), (.5, 72, .5), (1, 76, .5), (1.5, 72, .5), (2, 69, 1), (3, 64, 1)],
           [(0, 65, .5), (.5, 69, .5), (1, 72, .5), (1.5, 69, .5), (2, 65, 1), (3, 69, 1)], [(0, 67, .5), (.5, 71, .5), (1, 74, .5), (1.5, 71, .5), (2, 67, 2)]]
    for i in range(nb):
        c = prog[i % 4]; bm, tones = CH[c]; t0 = i * bar
        b.add(t0, pad(mtof(tones[0] - 12), bar, .16, att=.4, rel=.5))
        for q in (0, 1, 2, 3):
            b.add(t0 + q * beat, pluck(mtof(bm + 12 + (7 if q % 2 else 0)), beat * .5, .5, tone=.7), 1, -.2)
        for q in (1, 3):
            for j, n in enumerate(tones):
                b.add(t0 + q * beat + j * .01, uke(mtof(n), beat * .45, .15), 1, .3)
        b.add(t0, woodblock(900, .2), 1, .3)
        mel = MEL[i % 4]
        if i * bar < dur - bar:
            for off, m, ln in mel:
                b.add(t0 + off * beat, clarinet(mtof(m), ln * beat * .95, .55), 1, .1)
    b.add((nb - 1) * bar, clarinet(mtof(72), bar * .9, .5))
    x = b.out(1.2, .18)
    return fade_out(x, 2.0) * .9


def brambles(dur, bpm=80):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); r = np.random.default_rng(5); nb = int(dur / bar) + 1
    turn = dur * .72
    for i in range(nb):
        t0 = i * bar
        if t0 < turn:
            root = [38, 38, 41, 38][i % 4]
            b.add(t0, pad(mtof(root - 12), bar + 1, .32, att=1.2, rel=1.2), 1, -.2)
            b.add(t0, pad(mtof(root - 5), bar + 1, .2, att=1.4, rel=1.2), 1, .2)
            for _ in range(2):
                n = int(r.choice([62, 65, 69, 70, 74])); b.add(t0 + r.uniform(0, bar - .5), pluck(mtof(n), 1.0, .3), 1, r.uniform(-.6, .6))
            if i % 2 == 0:
                b.add(t0 + beat * 2, bass(mtof(root + 12), beat * 1.5, .5))
        else:
            c = ["C", "F", "G", "C"][i % 4]; bm, tones = CH[c]
            b.add(t0, pad(mtof(tones[0] - 12), bar + .6, .34, att=.5, rel=.8), 1, -.3); b.add(t0, pad(mtof(tones[2 % len(tones)] - 12), bar + .6, .25, att=.5, rel=.8), 1, .3)
            b.add(t0, bass(mtof(bm + 12), beat * 1.6, .5))
            for s in range(8):
                b.add(t0 + s * beat / 2, pluck(mtof(tones[[0, 1, 2, 1][s % 4] % len(tones)] + 12 * (1 + (s > 3))), beat * 1.0, .26 + .02 * s), 1, -.4 + .1 * s)
            if i % 2 == 0:
                b.add(t0, bell(mtof(tones[0] + 36), 1.8, .2), 1, .4)
    x = b.out(2.2, .3)
    return fade_out(x, 2.0) * .9


def climb(dur, bpm=116):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); nb = int(dur / bar) + 1
    for i in range(nb):
        c = ["G", "C", "G", "D"][i % 4]; bm, tones = CH[c]; t0 = i * bar
        b.add(t0, pad(mtof(tones[0] - 12), bar + .4, .22, att=.3, rel=.4))
        for q in (0, 2):
            b.add(t0 + q * beat, bass(mtof(bm + 12), beat * .9, .5))
        for q in range(8):
            if q % 2 == 1:
                for j, n in enumerate(tones):
                    b.add(t0 + q * beat / 2 + j * .01, uke(mtof(n), beat * .45, .18 * min(1, .4 + i * .25)), 1, -.4 + .3 * j)
            b.add(t0 + q * beat / 2, shaker(.1, .3 * min(1, .3 + i * .3), q), 1, .5)
        if i == nb - 1:
            for q in range(4):
                b.add(t0 + q * beat / 2 + 2 * beat, woodblock(800 + 150 * q, .35))
    x = b.out(1.2, .18)
    return fade_out(x, .4) * .9


def sad_luma(dur, bpm=60):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); nb = int(dur / bar) + 1; r = np.random.default_rng(9)
    prog = ["Am", "F", "C", "G"]
    MEL = [[(0, 76, 2), (2, 74, 1), (3, 72, 1)], [(0, 72, 2), (2, 69, 2)], [(0, 67, 1), (1, 72, 1), (2, 76, 2)], [(0, 74, 3), (3, 71, 1)]]
    for i in range(nb):
        c = prog[i % 4]; bm, tones = CH[c]; t0 = i * bar
        b.add(t0, pad(mtof(tones[0] - 12), bar + 1, .35, att=.9, rel=1.0), 1, -.2); b.add(t0, pad(mtof(tones[1] - 12), bar + 1, .25, att=.9, rel=1.0), 1, .2)
        for q in range(4):
            b.add(t0 + q * beat, piano(mtof([tones[0], tones[1], tones[2 % len(tones)], tones[1]][q] ), beat * 2, .32), 1, -.3 + .2 * q)
        b.add(t0, bass(mtof(bm + 12), beat * 3, .45))
        mel = MEL[i % 4]
        if i % 2 == 0 and t0 < dur - bar * 1.2:
            for off, m, ln in mel:
                b.add(t0 + off * beat, musicbox(mtof(m), ln * beat * 1.2, .5), 1, .25)
    x = b.out(2.2, .32)
    return fade_out(x, 2.5) * .9


def hope(dur, bpm=84):
    beat = 60 / bpm; bar = beat * 4; b = Buf(dur); nb = int(dur / bar) + 1
    prog = ["C", "G", "Am", "F"]
    for i in range(nb):
        c = prog[i % 4]; bm, tones = CH[c]; t0 = i * bar; k = min(1, .35 + i / max(1, nb) * .9)
        b.add(t0, pad(mtof(tones[0] - 12), bar + .8, .3 * k, att=.6, rel=.8), 1, -.3); b.add(t0, pad(mtof(tones[2 % len(tones)] - 12), bar + .8, .25 * k, att=.6, rel=.8), 1, .3)
        b.add(t0, bass(mtof(bm + 12), beat * 2, .5 * k))
        for s in range(8):
            n = tones[[0, 1, 2, 1, 0, 1, 2, 1][s] % len(tones)] + 12
            b.add(t0 + s * beat / 2, piano(mtof(n), beat * 1.5, .3 * k), 1, -.4 + .1 * s)
        if i % 2 == 0:
            for off, m, ln in LULLABY[(i // 2) % 8][1]:
                b.add(t0 + off * beat * 1.3, bell(mtof(m + 12), 1.2, .3 * k), 1, .3)
    x = b.out(2.0, .3)
    return fade_out(x, 2.0) * .9


def rise(dur, climax, bpm=72):
    """Shimmering ascent that blossoms into a big major chord at `climax` seconds."""
    beat = 60 / bpm; b = Buf(dur); r = np.random.default_rng(4)
    t = 0.0; scale = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96]
    i = 0
    while t < climax - .3:
        k = i / max(1, climax / (beat / 2))
        n = scale[min(len(scale) - 1, int(k * len(scale)))] + (0 if r.random() < .6 else -12)
        b.add(t, pluck(mtof(n), 1.2, .22 + .2 * k), 1, r.uniform(-.5, .5))
        t += beat / 2 * (1 - .35 * k)
        i += 1
    for k_, n in enumerate([48, 55, 60, 64, 67]):
        b.add(max(0, climax - 4 + k_ * .3), pad(mtof(n), climax + 3 - (climax - 4 + k_ * .3), .15 + .05 * k_, att=3.0, rel=1), 1, -.4 + .2 * k_)
    for k_, n in enumerate([48, 55, 60, 64, 67, 72, 76]):
        b.add(climax, pad(mtof(n), dur - climax + 1, .38, att=.15, rel=2.0), 1, -.6 + .2 * k_)
        b.add(climax + .02 * k_, bell(mtof(n + 24), 3.0, .3), 1, r.uniform(-.5, .5))
    for off, m, ln in [(0, 79, 1), (1.2, 84, 1), (2.4, 88, 1.5), (4, 91, 2)]:
        b.add(climax + 1.0 + off, bell(mtof(m), 2.5, .3), 1, .2)
    b.add(climax, bass(mtof(36), 4, .7)); b.add(climax, kick(.4), 1, 0)
    x = b.out(2.4, .34)
    return fade_out(x, 2.5) * .9


def goodnight(dur, bpm=62):
    x = lullaby(dur, bpm=bpm, shift=0, inst=musicbox, second=musicbox, arp=True, bars_end_fade=5.0)
    return x * .85


def home(dur):
    return lullaby(dur, bpm=80, shift=0, inst=piano, second=bell, arp=True, bars_end_fade=2.5)


CUES = {
    "lullaby": lambda d, m: lullaby(d), "dusk_wonder": lambda d, m: dusk_wonder(d), "bedtime_soft": lambda d, m: lullaby(d, bpm=70, shift=5, inst=piano, second=bell),
    "song1": lambda d, m: song1(d), "sneaky": lambda d, m: sneaky(d), "pond": lambda d, m: pond(d), "oak": lambda d, m: oak(d), "brambles": lambda d, m: brambles(d),
    "climb": lambda d, m: climb(d), "song2": lambda d, m: song2(d), "sad_luma": lambda d, m: sad_luma(d), "hope": lambda d, m: hope(d),
    "rise": lambda d, m: rise(d, m.get("climax", d * .4)), "home": lambda d, m: home(d), "goodnight": lambda d, m: goodnight(d),
}


def render_cue(name, dur, marks=None):
    return CUES[name](dur, marks or {})
