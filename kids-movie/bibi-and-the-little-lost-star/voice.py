"""Per-character voices: synthesize, cache, normalise, and extract a mouth envelope for lip-sync."""
import hashlib, json, os
import numpy as np
from scipy.signal import resample_poly
import tts

HERE = os.path.dirname(os.path.abspath(__file__))
LINES = os.path.join(HERE, "build", "lines")
SR = 44100
FPS = 24

# who -> (kokoro voice, speed, pitch factor, target rms)
VOICES = {
    "narr": ("bf_emma", 0.74, 1.00, 0.095),
    "bibi": ("af_sky", 0.84, 1.07, 0.100),
    "mama": ("af_bella", 0.80, 1.00, 0.095),
    "tuck": ("bm_lewis", 0.64, 0.96, 0.100),
    "odo": ("bm_george", 0.82, 1.04, 0.100),
    "luma": ("af_nicole", 0.80, 1.22, 0.095),
    "moon": ("am_adam", 0.64, 0.90, 0.100),
}


def _key(who, text):
    v = VOICES[who]
    return hashlib.md5(json.dumps([who, text, v]).encode()).hexdigest()[:16]


def envelope(x, sr=SR, fps=FPS):
    """Mouth-open amount 0..1 per video frame from the audio's loudness."""
    hop = sr // fps
    n = len(x) // hop + 1
    pad = np.zeros(n * hop - len(x), dtype=np.float32)
    frames = np.concatenate([x, pad]).reshape(n, hop)
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    ref = np.percentile(rms, 92) + 1e-6
    v = np.clip(rms / ref, 0, 1.2)
    v = np.where(rms < ref * .08, 0, v)  # silence => mouth shut
    v = np.clip(v, 0, 1) ** .8
    # quick attack, slower release so lips flutter naturally
    out = np.zeros_like(v)
    for i in range(len(v)):
        prev = out[i - 1] if i else 0
        out[i] = v[i] if v[i] > prev else prev + (v[i] - prev) * .5
    return np.round(out, 3)


def render_line(who, text):
    """Returns dict(path, dur, env, samples)."""
    os.makedirs(LINES, exist_ok=True)
    k = _key(who, text)
    npy = os.path.join(LINES, k + ".npy")
    if os.path.exists(npy):
        x = np.load(npy)
    else:
        voice, speed, pitch, rms_t = VOICES[who]
        s, sr = tts.synth(text, voice, speed)
        # trim leading/trailing silence
        a = np.abs(s)
        idx = np.where(a > 0.01)[0]
        if len(idx):
            s = s[max(0, idx[0] - 600): idx[-1] + 1200]
        x = resample_poly(s, 147, 80).astype(np.float32)  # 24k -> 44.1k
        if abs(pitch - 1) > 1e-3:  # resample trick: shifts pitch (and tempo) together
            x = resample_poly(x, 1000, int(round(1000 * pitch))).astype(np.float32)
        rms = np.sqrt((x ** 2).mean() + 1e-12)
        x = x * (rms_t / rms)
        x = np.clip(x, -.98, .98)
        # 15ms fades to avoid clicks
        f = int(.015 * SR)
        x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        np.save(npy, x)
    return {"samples": x, "dur": len(x) / SR, "env": envelope(x).tolist(), "key": k}


if __name__ == "__main__":
    import sys
    for who in ["narr", "bibi", "mama", "tuck", "odo", "luma", "moon"]:
        r = render_line(who, "Hello there, little friend. Are you ready for an adventure?")
        print(who, round(r["dur"], 2), "s  env max", max(r["env"]), "rms", round(float(np.sqrt((r["samples"] ** 2).mean())), 3))
