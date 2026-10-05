"""Writes build/captions.srt: <=2 lines per cue, long sentences split at natural pauses, no overlaps."""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def ts(t):
    h, r = divmod(t, 3600); m, r = divmod(r, 60); s, ms = divmod(r, 1)
    return "%02d:%02d:%02d,%03d" % (h, m, s, round(ms * 1000) % 1000)


def wrap(text, n=42):
    lines, cur = [], ""
    for w in text.split():
        if len(cur) + len(w) + 1 > n and cur:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    return "\n".join(lines)


def split_text(text, limit=84):
    """Split at sentence ends / commas / ellipses so each piece fits in two caption lines."""
    if len(text) <= limit:
        return [text]
    parts = re.split(r"(?<=[.!?…])\s+|(?<=\.\.\.)\s+|(?<=,)\s+", text)
    out, cur = [], ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > limit:
            out.append(cur); cur = p
        else:
            cur = (cur + " " + p).strip()
    if cur:
        out.append(cur)
    return out


def main():
    B = os.path.join(HERE, "build")
    plan = json.load(open(os.path.join(B, "plan.json"))); TL = json.load(open(os.path.join(B, "timeline.json")))
    cues = []
    for ln, tl in zip(plan["lines"], TL["lines"]):
        if ln["special"]:
            continue
        pieces = split_text(ln["text"])
        total = sum(len(p) for p in pieces); t = tl["t0"]; span = tl["t1"] - tl["t0"]
        for p in pieces:
            d = span * len(p) / total
            cues.append([t, t + d, p]); t += d
        cues[-1][1] += .15
    for ly in TL["lyrics"]:
        cues.append([ly["t0"], ly["t1"], "♪ " + ly["text"] + " ♪"])
    cues.sort(key=lambda c: c[0])
    for a, b in zip(cues, cues[1:]):          # never overlap the next cue
        a[1] = min(a[1], b[0] - .02)
    with open(os.path.join(B, "captions.srt"), "w", encoding="utf-8") as f:
        for i, (a, b, t) in enumerate(cues, 1):
            f.write("%d\n%s --> %s\n%s\n\n" % (i, ts(a), ts(b), wrap(t)))
    print("captions.srt: %d cues, longest %.1fs" % (len(cues), max(c[1] - c[0] for c in cues)))


if __name__ == "__main__":
    main()
