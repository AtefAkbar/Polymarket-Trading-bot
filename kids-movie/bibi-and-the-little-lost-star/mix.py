"""Mix voices + score + sound effects + ambience into build/audio.wav, and write captions.srt."""
import json, os, sys, wave, time
import numpy as np
from scipy.signal import butter, sosfilt
import voice, sfxlib, music
from sfxlib import SR

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build")
plan = json.load(open(os.path.join(B, "plan.json")))
TL = json.load(open(os.path.join(B, "timeline.json")))
TOTAL = TL["frames"] / TL["fps"] + 2.5
N = int(TOTAL * SR)

PAN = dict(narr=0.0, bibi=-.12, mama=.12, tuck=.18, odo=-.18, luma=0.0, moon=0.0)


def stereo():
    return np.zeros((N, 2), dtype=np.float32)


def put(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0 or i >= N: return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1)
    j = min(N, i + len(sig))
    buf[i:j] += (sig[: j - i] * gain).astype(np.float32)


def timer(msg, t0=[time.time()]):
    print("[%5.1fs] %s" % (time.time() - t0[0], msg), flush=True)


# ------------------------------------------------------------------ voices
VOICE = stereo()
for ln, tl in zip(plan["lines"], TL["lines"]):
    if ln["special"]:
        x = sfxlib.special_voice(ln["special"][1:])
    else:
        x = voice.render_line(ln["who"], ln["text"])["samples"]
    x = x.astype(np.float32)
    if ln["who"] == "moon":   # the moon sounds big and far away
        x = sfxlib.reverb(x, 2.4, .45, seed=2)[: len(x) + SR].astype(np.float32)
    elif ln["who"] == "luma":
        x = sfxlib.reverb(x, 1.0, .18, seed=4)[: len(x) + SR // 2].astype(np.float32)
    put(VOICE, ln["t0"], x, 1.0, PAN.get(ln["who"], 0))
timer("voices placed (%d lines)" % len(plan["lines"]))

# ------------------------------------------------------------------ sfx + footsteps
SFX = stereo()
cache = {}


def get(name, variant=0):
    k = (name, variant)
    if k not in cache:
        y = sfxlib.render_sfx(name, variant).astype(np.float32)
        pk = float(np.abs(y).max())
        if pk > .8: y *= .8 / pk  # keep every effect clean of clipping
        cache[k] = y
    return cache[k]


for i, ev in enumerate(plan["sfx"]):
    put(SFX, ev["t"], get(ev["name"]), ev["gain"] * .9, 0)
for i, ev in enumerate(plan["steps"]):
    put(SFX, ev["t"], get(ev["name"], i % 5), ev["gain"], 0)
timer("sfx placed (%d events, %d steps)" % (len(plan["sfx"]), len(plan["steps"])))

# ------------------------------------------------------------------ ambience (merge neighbours with the same kind)
AMB = stereo()
merged = []
for a in plan["ambient"]:
    if merged and merged[-1]["kind"] == a["kind"] and abs(merged[-1]["t1"] - a["t0"]) < .01:
        merged[-1]["t1"] = a["t1"]
    else:
        merged.append(dict(a))
for a in merged:
    d = a["t1"] - a["t0"] + 2.0
    x = sfxlib.ambience(a["kind"], d, seed=int(a["t0"])).astype(np.float32)
    f = int(1.0 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    put(AMB, a["t0"] - .5 if a["t0"] > .5 else a["t0"], x, a["gain"], 0)
timer("ambience placed (%d segments)" % len(merged))

# ------------------------------------------------------------------ music
MUS = stereo()
burst_t = next((e["t"] for e in plan["sfx"] if e["name"] == "burst"), None)
for m in plan["music"]:
    d = m["t1"] - m["t0"]
    marks = {}
    if m["cue"] == "rise" and burst_t:
        marks["climax"] = burst_t - m["t0"]
    x = music.render_cue(m["cue"], d, marks).astype(np.float32)
    # every cue is levelled to the same loudness, then peak-limited, so no cue ever shouts over the voices
    body = x[np.abs(x).max(axis=1) > 1e-3]
    rms = float(np.sqrt((body.astype(np.float64) ** 2).mean())) if len(body) else 1.0
    x *= (0.085 if m["cue"].startswith("song") else 0.075) / (rms + 1e-9)
    pk = float(np.abs(x).max())
    if pk > .8: x *= .8 / pk
    x = music.fade_in(x, .6)
    put(MUS, m["t0"], x, 1.0)
    timer("music cue %-12s %6.1fs" % (m["cue"], d))

# ------------------------------------------------------------------ ducking: voice-activity detection with a hold, so the score
# stays politely underneath whole sentences instead of pumping with every syllable
hop = SR // 100
act = sosfilt(butter(2, 15, "low", fs=SR, output="sos"), np.abs(VOICE).max(axis=1))
act = act[::hop]
vad = (act > .012).astype(np.float64)                       # any speech energy at all
hold = np.zeros_like(vad); decay = np.exp(-1 / (.45 * 100)) # keep ducking for ~0.45s after the last word
for i in range(1, len(vad)):
    hold[i] = max(vad[i], hold[i - 1] * decay)
sm = np.zeros_like(hold)
for i in range(1, len(hold)):
    a_ = .22 if hold[i] > sm[i - 1] else .035             # ~50ms attack, ~300ms release
    sm[i] = sm[i - 1] + (hold[i] - sm[i - 1]) * a_
duck = 1 - .74 * np.interp(np.arange(N), np.arange(len(sm)) * hop, sm)
songs = [(m_["t0"], m_["t1"]) for m_ in plan["music"] if m_["cue"] in ("song1", "song2")]
for t0, t1 in songs:
    duck[int(t0 * SR): int(t1 * SR)] = 1.0
MUS *= duck[:, None].astype(np.float32)
AMB *= (1 - .5 * (1 - duck))[:, None].astype(np.float32)
timer("ducking applied")

# ------------------------------------------------------------------ balance report (voice vs everything else while someone is talking)
talking = np.interp(np.arange(N), np.arange(len(sm)) * hop, sm) > .6
def _r(b, mask): return float(np.sqrt((b[mask].astype(np.float64) ** 2).mean()))
db = lambda a, b: 20 * np.log10((a + 1e-9) / (b + 1e-9))
rv, rm_, rs, ra = _r(VOICE, talking), _r(MUS, talking), _r(SFX, talking), _r(AMB, talking)
print("while speaking -> music is %.1f dB, sfx %.1f dB, ambience %.1f dB relative to the voice" % (db(rm_, rv), db(rs, rv), db(ra, rv)))
songmask = np.zeros(N, bool)
for t0, t1 in songs: songmask[int(t0 * SR): int(t1 * SR)] = True
print("during the two songs the score runs at %.3f rms (voice-free)" % _r(MUS, songmask))

# ------------------------------------------------------------------ master
mix = VOICE * 1.0 + SFX * .8 + MUS * 1.0 + AMB * 1.0
peak = np.abs(mix).max()
print("peak before limiting:", round(float(peak), 3), "| rms voice %.3f sfx %.3f music %.3f amb %.3f" % tuple(float(np.sqrt((x.astype(np.float64) ** 2).mean())) for x in (VOICE, SFX, MUS, AMB)))
mix = np.tanh(mix * 1.1) / np.tanh(1.1) if peak > .95 else mix   # gentle soft-clip only when needed
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(os.path.join(B, "audio.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
timer("wrote audio.wav (%.1fs)" % (N / SR))


# ------------------------------------------------------------------ captions (.srt)
import captions
captions.main()
