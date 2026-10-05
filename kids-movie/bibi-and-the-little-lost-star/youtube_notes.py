"""Writes build/youtube_notes.md (title ideas, description with exact chapter timestamps, tags, upload checklist)
from build/timeline.json, so the chapters always match the final cut."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "build", "timeline.json")))
t = {b["id"]: b["t0"] for b in TL["beats"]}
CHAPTERS = [("b01", "Title"), ("b02", "Once upon a time on Clover Hill"), ("b03", "Counting the stars"), ("b04", "The missing star"),
            ("b05", "Bedtime: stars can get lost"), ("b06", "A promise to Mama"), ("b07", "Song: Little Lantern"), ("b08", "The Whispering Woods"),
            ("b09", "Meet Tuck the turtle"), ("b10", "Across the pond"), ("b11", "Odo the owl"), ("b12", "The bramble tunnels"),
            ("b13", "Climbing Berry Hill"), ("b14", "Song: Together"), ("b15", "Luma the little star"), ("b16", "Reaching for the sky"),
            ("b17", "Making Luma happy"), ("b18", "Luma goes home"), ("b19", "Walking home"), ("b21", "Goodnight"), ("b22", "The End")]


def ts(x):
    return "%d:%02d" % (x // 60, x % 60)


total = TL["frames"] / TL["fps"]
chapters = "\n".join("%s %s" % (ts(t[b]), name) for b, name in CHAPTERS)
md = f"""# YouTube upload notes — "Bibi and the Little Lost Star"

**Length:** {ts(total)} · 1920×1080 · 24 fps · stereo, -16 LUFS · captions: `captions.srt`

## Title ideas
- Bibi and the Little Lost Star | Bedtime Story for Kids | Animated Cartoon
- Bedtime Story: Bibi the Bunny Helps a Lost Star Get Home 🌙⭐

## Description (paste as-is; chapters are accurate to the second)
A gentle bedtime story for little ones. 🐰⭐

One night, Bibi the bunny counts only 29 stars — one is missing! With her little lantern she sets off through
the Whispering Woods, where she meets Tuck the slow-and-steady turtle and Odo the owl who thinks his hoot is
too squeaky... and together they find Luma, the little lost star.

A story about kindness, courage, being scared (and being brave anyway), and how the things that make us
different are often our superpowers. Includes two sing-along songs with on-screen lyrics!

Perfect for bedtime, quiet time, and car rides. Ages 2–7.

CHAPTERS
{chapters}

New stories coming soon — subscribe so you don't miss one! 🌟

## Tags
bedtime story, kids story, animated story for kids, bunny, bedtime stories for toddlers, children's cartoon,
sleepy story, sing along songs for kids, lullaby, friendship story, kindness for kids, preschool story, calm story for kids

## Settings checklist
- **Audience:** choose "Yes, it's made for kids" (required for children's content; it disables comments/notifications — that's normal).
- **Altered / synthetic content:** the narration voices are AI-generated text-to-speech (cartoon animals, not realistic people).
  Answer YouTube's synthetic-content question honestly; stylised animation with synthetic narration usually doesn't need the label,
  but check the current form.
- **Captions:** upload `captions.srt` (Subtitles → Add → Upload file → With timing).
- **Thumbnail:** `thumbnail.jpg` (1280×720).
- **Monetisation:** YouTube's "inauthentic / mass-produced content" policy rewards original, varied, clearly human-directed storytelling.
  Keep each episode genuinely different, and add your own creative direction (story, character ideas) to each one.
"""
open(os.path.join(HERE, "build", "youtube_notes.md"), "w").write(md)
print(chapters)
