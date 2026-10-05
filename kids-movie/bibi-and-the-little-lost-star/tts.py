"""Text-to-speech wrapper around sherpa-onnx + Kokoro (Apache-2.0 voice model)."""
import os, wave
import numpy as np
import sherpa_onnx

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(HERE, "models", "kokoro-en-v0_19")

# Kokoro v0.19 speaker ids
SPEAKERS = {
    "af": 0, "af_bella": 1, "af_nicole": 2, "af_sarah": 3, "af_sky": 4,
    "am_adam": 5, "am_michael": 6, "bf_emma": 7, "bf_isabella": 8,
    "bm_george": 9, "bm_lewis": 10,
}

_tts = None


def engine():
    global _tts
    if _tts is None:
        cfg = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(
                kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                    model=os.path.join(MODEL_DIR, "model.onnx"),
                    voices=os.path.join(MODEL_DIR, "voices.bin"),
                    tokens=os.path.join(MODEL_DIR, "tokens.txt"),
                    data_dir=os.path.join(MODEL_DIR, "espeak-ng-data"),
                ),
                num_threads=4,
                provider="cpu",
            ),
        )
        _tts = sherpa_onnx.OfflineTts(cfg)
    return _tts


def synth(text, voice, speed=1.0):
    """Return (float32 mono samples, sample_rate)."""
    audio = engine().generate(text, sid=SPEAKERS[voice], speed=speed)
    return np.asarray(audio.samples, dtype=np.float32), audio.sample_rate


def write_wav(path, samples, sr):
    pcm = np.clip(samples, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    import time
    t0 = time.time()
    s, sr = synth("Once upon a time, on a soft green hill called Clover Hill, there lived a little bunny named Bibi.", "bf_emma", 0.9)
    print("sr", sr, "dur", len(s) / sr, "peak", float(np.abs(s).max()), "rms", float(np.sqrt((s ** 2).mean())), "synth_s", round(time.time() - t0, 2))
