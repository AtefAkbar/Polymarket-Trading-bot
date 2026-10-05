"""BIBI AND THE LITTLE LOST STAR -- script, choreography and timeline builder.

Every time value can be:  12.5 (seconds from beat start) | 'L3' (start of line 3) | 'L3e' (end of line 3)
                          | 'L3+0.4' / 'L3e-0.2' (offsets) | 'e' / 'e-1.5' (beat end).
"""
import json, os, re, math
import numpy as np
import voice, sfxlib

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 24
OUT = os.path.join(HERE, "build")


def k(t, **kw):
    kw["t"] = t
    return kw


BEATS = []


def beat(id, scene, lines=(), cam=None, actors=None, fx=None, sfx=(), lead=.5, tail=.8, gap=.42, dur=None,
         fade=(0, 0), fade_col=None, bpm=100, constel=None, lyrics=(), cards=(), min=0):
    BEATS.append(dict(id=id, scene=scene, lines=list(lines), cam=cam or [], actors=actors or {}, fx=fx or {}, sfx=list(sfx),
                      lead=lead, tail=tail, gap=gap, dur=dur, fade=fade, fade_col=fade_col, bpm=bpm, constel=constel,
                      lyrics=list(lyrics), cards=list(cards), min=min))


# ----------------------------------------------------------------------------------------------
# The story
# ----------------------------------------------------------------------------------------------
HILL_C = dict(x=1330, y=500, s=.86)

# 1. Title -------------------------------------------------------------------------------------
beat("b01", "hill_dusk", dur=11.5, fade=(1.8, 0), fade_col="#0b0a2a",
     cam=[k(0, x=1000, z=1.0), k("e", x=1060, z=1.07)],
     actors=dict(bibi=[k(0, x=1660, s=1.0, flip=-1, face="happy", anim="idle", look=.5, lookY=-.4)]),
     fx=dict(starAlpha=[k(0, v=.3), k("e", v=.5)]),
     cards=[dict(t0=1.6, t1="e-.4", kind="title")])

# 2. Clover Hill -------------------------------------------------------------------------------
beat("b02", "hill_dusk", constel=HILL_C, fade=(.8, 0), lead=.8, gap=.7,
     lines=[("narr", "Once upon a time, on a soft green hill called Clover Hill, there lived a little bunny named Bibi."),
            ("narr", "Bibi had big floppy ears, a fluffy round tail, and a very big love for... stars."),
            ("narr", "Every evening, when the sun went to sleep and the sky turned purple, Bibi sat on her front step, and waited for the first star to peek out.")],
     cam=[k(0, follow="bibi", dx=260, z=1.08)],
     actors=dict(bibi=[k(0, x=450, s=1.05, flip=1, face="happy", anim="walk", look=.4, stride=.8),
                       k("L0e", x=770, e="io"), k("L0e+.1", anim="idle", face="proud"),
                       k("L2", face="happy", lookY=-.9, look=.6)]),
     fx=dict(starAlpha=[k(0, v=.45), k("e", v=.7)]),
     sfx=[("L2e", "sparkle", .5)])

# 3. Counting ----------------------------------------------------------------------------------
_count_lines = [("bibi", w + "!", dict(num=i + 1, gap=.22)) for i, w in
                enumerate(["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"])]
_count_keys = []
for _n in range(1, 11):
    _count_keys += [k(f"L{1 + _n}", v=_n - 1, e="lin"), k(f"L{1 + _n}+.45", v=_n, e="lin")]
beat("b03", "hill_dusk", constel=HILL_C, lead=.5, gap=.5,
     lines=[("bibi", "There you are! Hello, first star!"),
            ("narr", "And then, one by one, the stars came out. Bibi counted every single one.", dict(gap=.5))]
           + _count_lines +
           [("narr", "And on she counted... all the way up to twenty-nine.", dict(gap=.4))],
     cam=[k(0, x=1000, z=1.08), k("L12", x=1100, z=1.18)],
     actors=dict(bibi=[k(0, x=770, s=1.05, flip=1, face="joy", anim="idle", look=.6, lookY=-.9)]),
     fx=dict(starAlpha=[k(0, v=.7), k("e", v=1)],
             starCount=[k(0, v=0), k("L2", v=0)] + _count_keys + [k("L12", v=10), k("L12e", v=29.999, e="lin")]),
     sfx=[(f"L{1 + n}", f"pop:{n}", .7) for n in range(1, 11)] + [("L12", "sparkle_run", .6)])

# 4. The gap -----------------------------------------------------------------------------------
beat("b04", "hill_dusk", constel=HILL_C, gap=.6,
     lines=[("bibi", "Twenty-nine? That's funny. There are always thirty."),
            ("narr", "Bibi looked and looked. Up in the sky, the stars made the shape of a great big bunny. With two ears, a round tummy, and a fluffy tail."),
            ("narr", "But tonight... one of the ear stars was missing."),
            ("mama", "Bibi! It's time for bed, sweetheart!", dict(gap=.7)),
            ("bibi", "But Mama... one of my stars is gone!")],
     cam=[k(0, x=1050, z=1.1), k("L1", x=1000, y=480, z=1.18), k("L2e", x=1000, y=480, z=1.18), k("L3", x=800, y=540, z=1.0)],
     actors=dict(bibi=[k(0, x=770, s=1.05, flip=1, face="surprised", anim="idle", look=.6, lookY=-.9),
                       k("L1", face="worried"), k("L3", face="neutral", look=-.7, lookY=0), k("L4", face="sad")],
                 mama=[k(0, vis=0, x=520, s=1.0, flip=1, face="happy"), k("L3-.2", vis=1, anim="wave"), k("L3e+.3", anim="idle")]),
     fx=dict(starAlpha=1, starCount=29.999, lines=[k(0, v=0), k("L1", v=0), k("L2e", v=.8, e="lin")],
             gapPulse=[k(0, v=0), k("L2", v=0), k("L2+.6", v=1), k("L3", v=1), k("L3+1.5", v=0)]),
     sfx=[("L3-.2", "door", .6)])

# 5. Bedroom: lost stars -----------------------------------------------------------------------
beat("b05", "bedroom", fade=(.9, 0), lead=.8, gap=.55,
     lines=[("mama", "Stars never really go away, my love. But sometimes... they get lost."),
            ("bibi", "Lost? Like when I lost my sock?"),
            ("mama", "Just like that! And a lost star can't find its way home all by itself."),
            ("narr", "Just then, a streak of silver light zoomed across the night sky!", dict(gap=.1)),
            ("bibi", "Mama! A star is falling! Look!"),
            ("narr", "It fell... right behind the Whispering Woods.")],
     cam=[k(0, x=960, z=1.0), k("L3-1", x=900, y=520, z=1.12)],
     actors=dict(bibi=[k(0, x=900, y=735, s=1.0, flip=1, face="sad", anim="idle", cutY=-118, look=-.2, z=0),
                       k("L1", face="worried"), k("L2", face="happy"), k("L3", face="surprised", look=-.9), k("L4", face="surprised")],
                 blanket=[k(0, x=0, y=0, z=1)],
                 mama=[k(0, x=1190, y=850, s=.88, flip=-1, face="happy", anim="idle", z=2),
                       k("L3", face="surprised", look=-.9)]),
     fx=dict(lamp=1, meteors=[dict(t0="L3+.3", dur=1.7, x0=1020, y0=60, x1=260, y1=800)]),
     sfx=[("L3+.3", "star_whoosh", .9)])

# 6. Bedroom: permission + hug ----------------------------------------------------------------
beat("b06", "bedroom", lead=.5, gap=.6, fade=(0, .9),
     lines=[("bibi", "Mama, can I go and help it? I'll take my little lantern!"),
            ("narr", "Mama bunny smiled her warm, gentle smile. She knew that kindness is the bravest thing in the world."),
            ("mama", "Go on, then. Be kind, be brave, and stay with your friends. I'll leave the porch light on."),
            ("bibi", "I promise!", dict(gap=1.4))],
     cam=[k(0, x=1000, z=1.08), k("L3", x=1050, z=1.2)],
     actors=dict(bibi=[k(0, x=950, y=850, s=1.0, flip=1, face="determined", anim="idle", lantern=True, look=.7),
                       k("L1", face="proud"), k("L2", face="happy"), k("L3", face="joy", anim="cheer"),
                       k("L3e", x=1060, anim="hug", face="happy"), ],
                 mama=[k(0, x=1250, y=850, s=.88, flip=-1, face="happy", anim="idle"), k("L1", face="proud"), k("L2", face="happy"),
                       k("L3e", anim="hug", x=1190)]),
     fx=dict(lamp=1),
     sfx=[("L3e", "hug", .6)])

# 7. Song 1 -- "Little Lantern" ---------------------------------------------------------------
_BAR1 = 60 / 104 * 4
beat("b07", "hill_night", dur=18 * _BAR1 + 1.2, bpm=104, lead=0, tail=0, fade=(.9, 0),
     cam=[k(0, follow="bibi", dx=300, z=1.0)],
     actors=dict(bibi=[k(0, x=470, s=1.0, flip=1, face="sing", anim="walk", lantern=True, look=.5, stride=.34),
                       k(1.8, x=480), k("e-1", x=2380, e="lin")],
                 mama=[k(0, x=370, s=1.0, flip=1, face="happy", anim="wave"), k(3.5, anim="idle")]),
     lyrics=[(2, "Little lantern, shine so bright,"), (4, "Lead me through the quiet night."),
             (6, "Hop, hop, hop on the winding way,"), (8, "A little star needs help today!"),
             (10, "Little light, little light,"), (12, "Everything will be alright!"),
             (14, "When the dark feels big and wide,"), (16, "Someone's always by your side!")],
     )
BEATS[-1]["lyrics"] = [dict(t0=b * _BAR1 + .15, t1=(b + 2) * _BAR1 - .1, text=t) for b, t in BEATS[-1]["lyrics"]]

# 8. Whispering Woods ------------------------------------------------------------------------
beat("b08", "woods", fade=(.9, 0), lead=.5, gap=.6,
     lines=[("narr", "Soon, Bibi came to the edge of the Whispering Woods."),
            ("narr", "The trees were very tall. The shadows were very long. And something went... rustle, rustle, RUSTLE!"),
            ("bibi", "W-who's there?", dict(gap=.9)),
            ("narr", "Bibi held up her lantern, very high... and the big, scary shadow had long, floppy ears!"),
            ("bibi", "Oh! It's only my own shadow! Silly me!", dict(gap=.8)),
            ("narr", "Bibi took a deep breath. In through her nose... and out through her mouth.", dict(gap=1.2)),
            ("bibi", "One, two, three. I can do this!")],
     cam=[k(0, follow="bibi", dx=330, z=1.0), k("L2", follow="bibi", dx=420, z=1.12), k("L6", follow="bibi", dx=300, z=1.0), k("e", follow="bibi", dx=420, z=1.0)],
     actors=dict(bibi=[k(0, x=330, s=1.0, flip=1, face="neutral", anim="walk", lantern=True, look=.5),
                       k("L0e+.4", x=920, e="io"), k("L0e+.5", anim="idle"),
                       k("L1+3", face="scared", anim="tremble"), k("L2", face="scared"), k("L3", face="worried", anim="idle", look=.9),
                       k("L4", face="giggle"), k("L5", face="neutral", look=.3),
                       k("L5+1", s=1.0), k("L5+2.2", s=1.07, e="sine"), k("L5+4", s=1.0, e="sine"),
                       k("L5+1.2", face="sleepy"), k("L5e", face="happy"), k("L6", face="determined"),
                       k("L6e", anim="walk", x=920), k("e", x=1400, e="io")],
                 ),
     fx=dict(shadow=[k(0, x=1650, y=880, k=.7, a=0), k("L1+2.2", x=1650, y=880, k=.7, a=0), k("L1+3.2", x=1700, y=880, k=1.75, a=.88, e="out"),
                     k("L3", x=1700, y=880, k=1.75, a=.88), k("L3+3", x=1420, y=880, k=1.0, a=.4, e="io"), k("L4e", x=1420, y=880, k=1.0, a=0, e="out")]),
     sfx=[("L1+3.1", "rustle", .8), ("L1+3.9", "rustle", .9), ("L1+4.7", "rustle", 1.0)])

# 9. The pond: meeting Tuck ------------------------------------------------------------------
beat("b09", "pond", fade=(.9, 0), lead=.5, gap=.6,
     lines=[("narr", "Bibi followed a trail of tiny sparkles through the woods, until she came to a quiet, shimmering pond."),
            ("narr", "But there was no bridge. Just seven round stepping stones... much too far apart for a little bunny."),
            ("bibi", "The sparkles go all the way across! But I can't swim. Hmm."),
            ("narr", "Then, one of the round stones... yawned."),
            ("tuck", "Mmm... good... evening.", dict(gap=.9)),
            ("bibi", "Oh! Excuse me! I thought you were a rock!"),
            ("tuck", "Many... do. I am Tuck. And I am very... very... good at being slow."),
            ("bibi", "I'm Bibi! A star fell down, and I need to cross the pond to find it. Can you help me?"),
            ("tuck", "A star? How wonderful. Climb on, little friend. I'm slow... but I never sink.")],
     cam=[k(0, follow="bibi", dx=330, z=1.0), k("L3", x=900, z=1.08), k("L6", x=880, z=1.14)],
     actors=dict(bibi=[k(0, x=220, s=1.0, flip=1, face="happy", anim="walk", lantern=True, look=.5),
                       k("L0e", x=610, e="io"), k("L0e+.1", anim="idle", face="worried", look=.7),
                       k("L2", face="worried"), k("L3", face="surprised"), k("L5", face="surprised", x=600), k("L5+.4", x=560, anim="tremble"),
                       k("L5e", anim="idle", face="shy", x=585), k("L6", face="happy"), k("L7", face="worried"), k("L8", face="joy")],
                 tuck=[k(0, x=885, y=905, s=1.0, flip=1, face="sleepy", anim="idle"),
                       k("L3e", face="sleepy"), k("L4", face="neutral"), k("L4e", flip=-1, face="happy"), k("L8", face="proud")]),
     fx=dict(wakeX=[k(0, v=0)]),
     sfx=[("L3e-.2", "turtle_yawn", .8)])

# 10. Crossing the pond ----------------------------------------------------------------------
beat("b10", "pond", lead=.5, gap=.6,
     lines=[("narr", "So Bibi climbed onto Tuck's big round shell, and off they floated across the pond... nice and slow.", dict(gap=.1)),
            ("tuck", "Slow... and steady... gets there... in the end.", dict(at=15.2)),
            ("bibi", "Tuck, you're the best boat ever!", dict(gap=.6)),
            ("narr", "On the other side, Tuck climbed out onto the soft grass."),
            ("bibi", "Tuck, would you like to come with me?"),
            ("tuck", "I would love to. I have never... met a star.")],
     cam=[k(0, x=800, z=1.06), k("L0e", follow="tuck", dx=60, z=1.06), k("L3", follow="tuck", dx=80, z=1.1)],
     actors=dict(tuck=[k(0, x=885, y=905, s=1.0, flip=-1, face="happy", anim="idle"),
                       k("L0+2.4", flip=1, anim="swim", x=885), k("L3-1", x=2950, e="io"), k("L3-.9", y=905), k("L3+.2", y=880, anim="walk", x=3010, e="out"),
                       k("L3+.3", x=3010), k("L3e", anim="idle", x=3010), k("L4", x=3010), k("L4+.1", x=3010)],
                 bibi=[k(0, x=585, y=880, s=1.0, flip=1, face="joy", anim="idle", lantern=True, look=.7),
                       k("L0+1.0", anim="jump", jumpU=0), k("L0+2.3", jumpU=1, x=880, y=735, e="io"),
                       k("L0+2.31", ride="tuck", rdx=-8, rdy=170, anim="idle", z=1, face="giggle"),
                       k("L1", face="happy"), k("L2", face="joy", look=.8),
                       k("L3", face="happy"), k("L3+.25", ride=None), k("L3+.26", x=2930, y=880, anim="idle"),
                       k("L3+.9", x=2990, anim="walk"), k("L3e", x=3010, anim="idle"), k("L4", face="happy"), k("L5", face="happy")]),
     fx=dict(wakeX=[k(0, v=885), k("L0+2.4", v=885), k("L3-1", v=2950, e="io"), k("L3e", v=-500)]),
     sfx=[("L0+1.0", "boing", .7), ("L0+2.3", "plop", .7), ("L0e+2", "ribbit", .6), ("L0e+5", "ribbit", .5), ("L0e+7.5", "ribbit_two", .6),
          ("L1e+2", "ribbit", .5), ("L3+.3", "splash_small", .7)])
BEATS[-1]["actors"]["bibi"] = [kk for kk in BEATS[-1]["actors"]["bibi"]]

# 11. Hollow Oak: Odo -----------------------------------------------------------------------
beat("b11", "oak", fade=(.9, 0), lead=.5, gap=.55,
     lines=[("narr", "Next, they came to the Great Hollow Oak. And from high above, a sad little sound drifted down."),
            ("odo", "#hoot_eep", dict(dur=2.3, gap=.7)),
            ("narr", "It was Odo the owl. He was trying to hoot... but all that came out was a tiny squeak."),
            ("bibi", "Hello up there! Are you alright?"),
            ("odo", "Oh. Hello. Please don't laugh. I am supposed to hoot... but it comes out all... squeaky."),
            ("tuck", "Every voice... is the right... voice."),
            ("odo", "Truly? You think so?"),
            ("bibi", "Did you see a star fall from the sky tonight?"),
            ("odo", "Why, yes! It landed beyond the brambles, past Berry Hill. But the brambles are dark and twisty, and the moon is hiding."),
            ("bibi", "Then come with us! We could really use your sharp owl eyes!"),
            ("odo", "Me? Oh! Well... alright!"),
            ("narr", "And so, there were three friends.")],
     cam=[k(0, x=1100, z=1.0), k("L1", x=1500, z=1.0), k("L4", x=2000, y=470, z=1.22), k("L5", x=1500, y=540, z=1.0), k("L6", x=1900, y=470, z=1.2),
          k("L9", x=1450, y=540, z=1.0), k("L10", x=1650, y=540, z=1.05)],
     actors=dict(odo=[k(0, x=2020, y=505, s=.95, flip=-1, face="sad", anim="idle", look=-.3),
                      k("L1", face="embarrassed" if False else "shy"), k("L2", face="sad"), k("L3", face="surprised"), k("L4", face="shy"),
                      k("L6", face="happy"), k("L8", face="worried"), k("L9", face="happy"), k("L10", face="joy"),
                      k("L10", x=2020, y=505, e="io"), k("L10e", anim="fly", face="joy"), k("L10e+2.2", x=1330, y=890, e="io"), k("L10e+2.3", anim="idle", face="happy", flip=-1)],
                 bibi=[k(0, x=200, s=1.0, flip=1, face="happy", anim="walk", lantern=True, look=.6),
                       k("L0e", x=1020, e="io"), k("L0e+.2", anim="idle"), k("L1", face="surprised", lookY=-.5, look=.7),
                       k("L2", face="worried"), k("L3", face="happy", lookY=-.4), k("L4", face="neutral"), k("L5", face="happy"),
                       k("L7", face="neutral"), k("L8", face="surprised"), k("L9", face="happy"), k("L9e", face="joy", anim="cheer"), k("L10e", anim="idle", face="happy")],
                 tuck=[k(0, x=-120, y=890, s=.95, flip=1, face="neutral", anim="walk"), k("L0e+.3", x=780, e="io"), k("L0e+.4", anim="idle", face="neutral"),
                       k("L4", face="happy", look=.6), k("L5", face="proud"), k("L6", face="happy")]),
     fx=dict(cloud=[k(0, v=0), k("L7e", v=0), k("L8e", v=1, e="io")]),
     sfx=[("L10e", "owl_flap_run", .6)])

# 12. The bramble tunnels --------------------------------------------------------------------
beat("b12", "brambles", fade=(.9, 1.2), fade_col="#cfeaff", lead=.5, gap=.6,
     lines=[("narr", "The brambles were dark and twisty. Which way was the right way? Left? Middle? Or right?"),
            ("bibi", "I can't see anything!"),
            ("tuck", "Neither... can I."),
            ("odo", "Hmm. Wait. Everyone, be very quiet."),
            ("narr", "Odo took a big breath, and squeaked into the left tunnel.", dict(gap=.1)),
            ("odo", "#squeak", dict(dur=.9, gap=1.7)),
            ("odo", "The echo came back quick. That's a dead end."),
            ("narr", "So he squeaked into the middle tunnel.", dict(gap=.1)),
            ("odo", "#squeak", dict(dur=.9, gap=1.4)),
            ("odo", "Quick again! Another dead end."),
            ("narr", "Then, he squeaked into the right tunnel.", dict(gap=.1)),
            ("odo", "#squeak", dict(dur=.9, gap=3.4)),
            ("odo", "Listen! The echo goes on and on! This is the way out!"),
            ("bibi", "Odo, your squeak is perfect! A big, deep hoot would just rumble around in the tangles."),
            ("odo", "My squeak... is useful?"),
            ("tuck", "Your squeak... is a gift."),
            ("narr", "And so, with Odo leading the way, the three friends followed the echo out of the brambles.")],
     cam=[k(0, follow="bibi", dx=250, z=1.0), k("L3", follow="bibi", dx=260, z=1.1), k("L13", follow="bibi", dx=220, z=1.08),
          k("L16", follow="bibi", dx=300, z=1.05), k("e", follow="bibi", dx=430, z=1.0)],
     actors=dict(bibi=[k(0, x=250, s=1.0, flip=1, face="worried", anim="walk", lantern=True, look=.6), k("L0e", x=960, e="io"),
                       k("L1", face="scared"), k("L3", face="worried"),
                       k("L7", x=960), k("L7e", x=1480, e="io"), k("L10", x=1480), k("L10e", x=2000, e="io"),
                       k("L12", face="happy"), k("L13", face="joy"), k("L15", face="proud"),
                       k("L16", x=2000), k("e-1.4", x=2420, e="io"), k("e", x=2800, e="in")],
                 tuck=[k(0, x=60, y=900, s=.95, flip=1, face="worried", anim="walk"), k("L0e", x=700, e="io"),
                       k("L2", face="worried"), k("L7", x=700), k("L7e", x=1220, e="io"), k("L10", x=1220), k("L10e", x=1740, e="io"),
                       k("L14", face="proud"), k("L15", face="happy"), k("L16", x=1740), k("e-1.4", x=2160, e="io"), k("e", x=2700, e="in")],
                 odo=[k(0, x=520, y=430, s=.82, flip=1, face="worried", anim="fly", z=3), k("L0e", x=1100, e="io"),
                      k("L3", face="determined", x=1100), k("L3e+.2", x=1170, y=640, e="io"),
                      k("L6e", x=1170), k("L7+.3", x=1690, y=640, e="io"),
                      k("L9e", x=1690), k("L10+.3", x=2210, y=640, e="io"),
                      k("L12", x=2210, face="joy"), k("L14", face="happy"),
                      k("L16", x=2210, flip=1), k("e-1.4", x=2620, y=640, e="io"), k("e", x=3050, y=560, e="in")]),
     fx=dict(),
     sfx=[("L5+.35", "echo_short", .8), ("L8+.35", "echo_short", .8), ("L11+.5", "echo_long", .8), ("L16", "sparkle_run", .5)])

# 13a. Climbing Berry Hill (narration) -------------------------------------------------------
beat("b13", "berry_hill", fade=(1.2, 0), fade_col="#cfeaff", lead=.5, gap=.5,
     lines=[("narr", "Up and up they climbed, over Berry Hill. Tuck was slow... but Bibi didn't mind. She waited, and she hummed a happy little tune."),
            ("narr", "And soon... everyone was singing.")],
     cam=[k(0, follow="bibi", dx=330, z=1.0)],
     actors=dict(bibi=[k(0, x=250, s=.95, flip=1, face="happy", anim="walk", lantern=True, look=.6, stride=.5), k("e", x=820, e="lin")],
                 tuck=[k(0, x=60, s=.9, flip=1, face="proud", anim="walk", stride=.8), k("e", x=620, e="lin")],
                 odo=[k(0, x=-80, y=560, s=.8, flip=1, face="happy", anim="fly"), k("e", x=1000, y=520, e="lin")]),
     sfx=[("e-2", "sparkle", .5)])

# 13b. Song 2 -- "Together" ------------------------------------------------------------------
_BAR2 = 60 / 116 * 4
beat("b14", "berry_hill", dur=18 * _BAR2 + 1.0, bpm=116, lead=0, tail=0,
     cam=[k(0, follow="bibi", dx=330, z=1.0)],
     actors=dict(bibi=[k(0, x=820, s=.95, flip=1, face="sing", anim="walk", lantern=True, look=.6, stride=.3), k("e", x=2700, e="lin")],
                 tuck=[k(0, x=620, s=.9, flip=1, face="sing", anim="walk", stride=.5), k("e", x=2480, e="lin")],
                 odo=[k(0, x=1000, y=520, s=.8, flip=1, face="sing", anim="fly"), k("e", x=3000, y=330, e="lin")]),
     lyrics=[(2, "Slow and steady, quick and bright,"), (4, "Squeaky hoot or hop, hop, light,"),
             (6, "Everyone has something small,"), (8, "Together we can do it all!"),
             (10, "Hop, hop, hop and flap, flap, flap,"), (12, "Slowly rolling, tap, tap, tap,"),
             (14, "Over hills and through the night,"), (16, "Friends make everything alright!")],
     )
BEATS[-1]["lyrics"] = [dict(t0=b * _BAR2 + .15, t1=(b + 2) * _BAR2 - .1, text=t) for b, t in BEATS[-1]["lyrics"]]

# 14. Finding Luma ---------------------------------------------------------------------------
beat("b15", "hollow", fade=(1.0, 0), lead=.6, gap=.6,
     lines=[("narr", "At the very top of the hill, in a little mossy hollow, they found something glowing... just a little."),
            ("narr", "It was the tiniest star they had ever seen. Her light was flickering. Her points were drooping. And she was crying little glittery tears."),
            ("luma", "Hic... hic... h-hello?"),
            ("bibi", "Hello! Are you the star that fell?"),
            ("luma", "I'm Luma. I only wanted to see what the ground looked like. It's so pretty down here... but now my light is all flickery, and I'm too small to get back home."),
            ("luma", "Stars glow when they're happy. And I'm not happy. I miss my family."),
            ("bibi", "Don't cry, Luma. We'll help you get home. I promise."),
            ("narr", "But the sky was so very, very high.")],
     cam=[k(0, x=800, z=1.0), k("L1", x=950, z=1.1), k("L2", x=1010, z=1.22), k("L6", x=980, z=1.15), k("e", x=1050, z=1.0)],
     actors=dict(luma=[k(0, x=1250, y=765, s=1.0, flip=1, face="cry", bright=.15, anim="idle")],
                 bibi=[k(0, x=250, s=1.0, flip=1, face="happy", anim="walk", lantern=True, look=.6), k("L0e", x=700, e="io"), k("L0e+.1", anim="idle", face="surprised"),
                       k("L1", face="worried"), k("L3", face="happy", look=.8), k("L4", face="worried"), k("L5", face="sad"), k("L6", face="determined", x=700), k("L6e", face="worried", lookY=-.8)],
                 tuck=[k(0, x=40, s=.95, flip=1, face="neutral", anim="walk", stride=.8), k("L0e", x=440, e="io"), k("L0e+.1", anim="idle"), k("L1", face="worried"), k("L5", face="sad")],
                 odo=[k(0, x=-120, y=640, s=.85, flip=1, face="neutral", anim="fly"), k("L0e", x=930, y=890, e="io"), k("L0e+.2", anim="idle", face="surprised"), k("L1", face="worried"), k("L5", face="sad")]),
     fx=dict(lumaBright=.15),
     sfx=[("L2", "sniffle", .4)])

# 15. Trying to reach the sky ----------------------------------------------------------------
beat("b16", "summit", fade=(1.0, 0), lead=.5, gap=.55,
     lines=[("narr", "So they carried Luma to the very top of the hill, where the sky felt close enough to touch."),
            ("bibi", "I'll try! I'm a very good jumper!", dict(gap=.2)),
            ("narr", "Boing! Bibi jumped as high as she could. But the sky was still much too far away.", dict(gap=.6)),
            ("odo", "My turn! I can fly!", dict(gap=.2)),
            ("narr", "Odo flapped his wings as hard as he could. Up, up, up... and then, plop! Back down again.", dict(gap=.7)),
            ("bibi", "It's no use. We're too small.", dict(gap=.8)),
            ("tuck", "We are small... but we are together. And Luma... stars glow when they are happy.")],
     cam=[k(0, x=960, z=1.0)],
     actors=dict(luma=[k(0, x=960, y=640, s=1.0, flip=1, face="sad", bright=.22, anim="idle"), k("L5", face="cry"), k("L5e", face="cry")],
                 bibi=[k(0, x=500, s=1.0, flip=1, face="happy", anim="walk", lantern=True, look=.6), k("L0e", x=610, e="io"), k("L0e+.1", anim="idle"),
                       k("L1", face="determined", look=.2, lookY=-.8), k("L2+.5", anim="jump", jumpU=0), k("L2+1.8", jumpU=1, e="lin"), k("L2+1.85", anim="idle", face="worried"),
                       k("L2e+.3", face="sad", lookY=0), k("L5", face="sad"), k("L6", face="surprised", look=.8, lookY=0)],
                 tuck=[k(0, x=300, s=.95, flip=1, face="neutral", anim="walk", stride=.8), k("L0e", x=1270, e="io"), k("L0e+.1", anim="idle", flip=-1, face="neutral"),
                       k("L2", face="worried"), k("L5", face="sad"), k("L6", face="proud")],
                 odo=[k(0, x=-100, y=420, s=.88, flip=1, face="neutral", anim="fly"), k("L0e", x=1520, y=890, e="io"), k("L0e+.1", anim="idle", flip=-1, face="neutral"),
                      k("L3", face="determined"), k("L4+2.0", anim="fly", x=1520, y=890), k("L4+4.4", x=1520, y=420, e="out"), k("L4e-2.0", x=1520, y=410),
                      k("L4e-.8", y=890, x=1550, e="in"), k("L4e-.75", anim="idle", face="worried"), k("L5", face="sad")]),
     fx=dict(twinkle=0, complete=False),
     sfx=[("L2+.5", "boing", .8), ("L2+1.85", "plop", .6), ("L4+2.0", "owl_flap_run", .6), ("L4e-.75", "plop", .8)])

# 16. Making Luma happy -----------------------------------------------------------------------
beat("b17", "summit", lead=.5, gap=.6,
     lines=[("bibi", "That's it! Luma, we just have to make you happy!"),
            ("bibi", "Luma, you are so brave for coming all this way."),
            ("odo", "And you are the shiniest star I have ever met. Truly."),
            ("tuck", "And you are... never alone."),
            ("luma", "Hee hee! It tickles! I feel all warm... and sparkly!"),
            ("narr", "And just like that, Luma began to glow. Brighter... and brighter... and brighter!")],
     cam=[k(0, x=960, y=540, z=1.0), k("L1", x=960, y=600, z=1.15), k("e", x=960, y=540, z=1.05)],
     actors=dict(luma=[k(0, x=960, y=640, s=1.0, flip=1, face="cry", bright=.22, anim="idle"), k("L1", bright=.25, face="sad"),
                       k("L2", face="shy", bright=.45, e="out"), k("L3", face="happy", bright=.7, e="out"), k("L4", face="giggle", bright=.9, e="out"), k("L5", face="joy", bright=1.0, anim="dance")],
                 bibi=[k(0, x=610, s=1.0, flip=1, face="surprised", anim="idle", lantern=True, look=.7, lookY=-.2), k("L0", face="joy"),
                       k("L0e", x=800, anim="hug", face="happy"), k("L2", anim="idle", face="proud"), k("L4", face="giggle"), k("L5", face="joy", anim="cheer")],
                 tuck=[k(0, x=1270, s=.95, flip=-1, face="proud", anim="idle"), k("L3", face="happy"), k("L5", face="joy")],
                 odo=[k(0, x=1520, y=890, s=.88, flip=-1, face="worried", anim="idle"), k("L0", face="surprised"), k("L2", face="happy"), k("L4", face="happy"), k("L5", face="joy", anim="cheer")]),
     fx=dict(twinkle=[k(0, v=0), k("e", v=.7)], complete=False),
     sfx=[("L4", "chime_up_soft", .7), ("L5", "sparkle_run", .7)])

# 17. Luma returns to the sky -----------------------------------------------------------------
beat("b18", "summit", lead=.4, gap=.7, fade=(0, .0),
     lines=[("luma", "Look! I'm floating! I'm going home!", dict(gap=.4)),
            ("narr", "Up she floated, past the treetops, past the clouds, all the way up to the stars...", dict(gap=3.0)),
            ("moon", "Welcome home, little one."),
            ("luma", "Thank you, Bibi! Thank you, Tuck! Thank you, Odo! I'll shine for you every single night!"),
            ("odo", "Hooray! ...eep!"),
            ],
     cam=[k(0, x=960, y=540, z=1.0), k("L1", x=960, y=450, z=1.0), k("L2e", x=960, y=540, z=1.0)],
     actors=dict(luma=[k(0, x=960, y=640, s=1.0, flip=1, face="joy", bright=1.0, anim="dance"),
                       k("L0", lift=0, x=960, y=640), k("L0e", y=580, x=960, e="io"), k("L1", x=870, y=520, e="io"), k("L1+1.4", x=1020, y=380, s=.9, e="io"),
                       k("L1+2.8", x=930, y=270, s=.8, e="io"), k("L1+4.0", x=937, y=196, s=.62, e="out"), k("L1+4.1", anim="idle", face="proud"),
                       k("L3", face="giggle"), k("L3e", face="joy"), k("L4", face="joy"), k("L4+1.2", vis=0)],
                 bibi=[k(0, x=700, s=1.0, flip=1, face="joy", anim="cheer", lantern=True, look=.7, lookY=-.7), k("L1", lookY=-1, anim="idle", face="surprised"), k("L2", face="joy", anim="cheer"),
                       k("L3", face="happy", anim="idle"), k("L4", face="joy", anim="cheer")],
                 tuck=[k(0, x=1270, s=.95, flip=-1, face="joy", anim="idle", lookY=-.6), k("L2", face="joy"), k("L4", face="happy")],
                 odo=[k(0, x=1520, y=890, s=.88, flip=-1, face="joy", anim="cheer"), k("L1", face="surprised", anim="idle", lookY=-.8), k("L2", face="joy"), k("L4", face="joy", anim="cheer")]),
     fx=dict(complete=[k(0, v=0), k("L1+4.0", v=0), k("L1+4.01", v=1)] if False else False,
             twinkle=[k(0, v=.7), k("L1+4", v=.7), k("L1+5", v=1.0), k("e", v=.9)],
             moonEyes=[k(0, v=0), k("L2-.3", v=0), k("L2", v=1, e="out")],
             burst=dict(t0="L1+4.0")),
     sfx=[("L0", "chime_up_soft", .5), ("L1+3.9", "chime_up", .9), ("L1+4.0", "burst", .9), ("L1+4.3", "twinkle_all", .8)])
BEATS[-1]["fx"]["complete"] = "AT:L1+4.0"   # resolved below into a keyed boolean

# 18. Walking home ---------------------------------------------------------------------------
beat("b19", "hill_home", fade=(1.0, 0), lead=.5, gap=.6,
     lines=[("narr", "Then Bibi and her new friends walked home together, under a sky full of thirty twinkling stars."),
            ("tuck", "Goodnight... Bibi. Thank you... for waiting for me."),
            ("odo", "Goodnight, Bibi. Come and visit my tree anytime. I'll... eep... I mean, hoot for you."),
            ("bibi", "Goodnight, Tuck! Goodnight, Odo! See you tomorrow!")],
     cam=[k(0, follow="bibi", dx=300, z=1.0), k("L1", follow="tuck", dx=100, z=1.12), k("L3", follow="bibi", dx=200, z=1.1)],
     actors=dict(bibi=[k(0, x=180, s=1.0, flip=1, face="happy", anim="walk", lantern=True, look=.6, stride=.9), k("L0e+.5", x=1480, e="io"), k("L0e+.6", anim="idle", face="happy", look=-.6),
                       k("L3", face="joy", anim="wave", look=-.8)],
                 tuck=[k(0, x=80, s=.95, flip=1, face="proud", anim="walk", stride=.9), k("L0e+.5", x=1200, e="io"), k("L0e+.6", anim="idle", flip=1, face="happy"),
                       k("L1e", flip=-1, anim="walk", x=1200), k("L2e", x=700, e="io"), k("e", x=300, e="io")],
                 odo=[k(0, x=-100, y=560, s=.85, flip=1, face="happy", anim="fly"), k("L0e+.5", x=1130, y=620, e="io"), k("L1e", x=1130, y=620), k("L2e+.2", x=500, y=440, flip=-1, e="io"), k("e", x=-300, y=300, e="io")]),
     sfx=[("L0e", "sparkle", .4)])

beat("b20", "hill_home", lead=.4, gap=.6, fade=(0, .9),
     lines=[("mama", "Welcome home, my brave little bunny."),
            ("bibi", "Mama! We found the star, and we put her back!"),
            ("mama", "I knew you would. I am so proud of you.")],
     cam=[k(0, x=1500, z=1.2), k("e", x=1560, z=1.3)],
     actors=dict(mama=[k(0, x=1830, s=1.0, flip=-1, face="happy", anim="idle")],
                 bibi=[k(0, x=1460, s=1.0, flip=1, face="happy", anim="walk", lantern=True, look=.7, stride=.9), k("L0e", x=1700, e="io"), k("L0e+.1", anim="idle"),
                       k("L1", face="joy", anim="cheer"), k("L1e", anim="hug", x=1730), k("e", x=1730)]),
     fx=dict(), sfx=[("L1e", "hug", .5)])

# 19. Bedtime -------------------------------------------------------------------------------
beat("b21", "bedroom", fade=(1.0, 0), lead=1.0, gap=.9,
     lines=[("bibi", "Twenty-eight... twenty-nine... THIRTY!"),
            ("narr", "And from that night on, whenever Bibi felt scared, or small, she would look up at the sky and count all thirty stars."),
            ("narr", "And she knew that somewhere out there, a little star was shining... just for her."),
            ("narr", "The end.")],
     cam=[k(0, x=900, y=500, z=1.12), k("L1", x=700, y=420, z=1.28), k("e", x=900, y=520, z=1.1)],
     actors=dict(bibi=[k(0, x=900, y=735, s=1.0, flip=1, face="sleepy", anim="idle", cutY=-118, look=-.8, z=0), k("L0", face="happy"), k("L1", face="proud"), k("L2", face="sleepy"), k("L3", face="sleepy")],
                 blanket=[k(0, x=0, y=0, z=1)]),
     fx=dict(lamp=[k(0, v=.9), k("L1", v=.55, e="io"), k("e", v=.25, e="io")], complete=True),
     sfx=[("L0e", "twinkle_wink", .8)])

# 20. End card -------------------------------------------------------------------------------
beat("b22", "hill_home", dur=7.5, fade=(1.0, 2.0), fade_col="#0b0a2a", lead=0, tail=0,
     cam=[k(0, x=1000, z=1.0), k("e", x=1060, z=1.04)], actors={},
     cards=[dict(t0=.6, t1="e-1.0", kind="end", text="Sweet dreams, little ones")])

# music plan: (cue, first beat, last beat)
MUSIC = [
    ("lullaby", "b01", "b02"),
    ("dusk_wonder", "b03", "b04"),
    ("bedtime_soft", "b05", "b06"),
    ("song1", "b07", "b07"),
    ("sneaky", "b08", "b08"),
    ("pond", "b09", "b10"),
    ("oak", "b11", "b11"),
    ("brambles", "b12", "b12"),
    ("climb", "b13", "b13"),
    ("song2", "b14", "b14"),
    ("sad_luma", "b15", "b16"),
    ("hope", "b17", "b17"),
    ("rise", "b18", "b18"),
    ("home", "b19", "b20"),
    ("goodnight", "b21", "b22"),
]
AMBIENT = {  # scene -> (kind, gain)
    "hill_dusk": ("birds_crickets", .5), "hill_night": ("crickets", .5), "hill_home": ("crickets", .5), "woods": ("wind_crickets", .6),
    "pond": ("frogs_crickets", .6), "oak": ("wind_crickets", .5), "brambles": ("wind", .55), "berry_hill": ("crickets", .45),
    "hollow": ("wind_crickets", .4), "summit": ("wind", .4), "bedroom": ("roomtone", .3),
}

# ----------------------------------------------------------------------------------------------
# Timeline builder
# ----------------------------------------------------------------------------------------------
REF = re.compile(r"^(?:L(\d+)(e)?|e|s)?([+-]\s*\d*\.?\d+)?$")


def build():
    t = 0.0
    tl_beats, tl_lines, tl_lyrics, tl_cards, tl_numbers = [], [], [], [], []
    plan = dict(lines=[], sfx=[], music=[], ambient=[], steps=[])
    for b in BEATS:
        # 1. synthesise + lay out lines
        cursor = b["lead"]
        L = []
        for idx, ln in enumerate(b["lines"]):
            who, text = ln[0], ln[1]
            opts = ln[2] if len(ln) > 2 else {}
            if text.startswith("#"):
                x = sfxlib.special_voice(text[1:])
                dur = x.shape[0] / voice.SR
                env = voice.envelope(x).tolist()
                item = dict(who=who, text=text, samples=x, dur=dur, env=env, key=text)
            else:
                item = dict(who=who, text=text, **voice.render_line(who, text))
            start = opts.get("at", cursor + opts.get("pre", 0))
            item["s"], item["e"] = start, start + item["dur"]
            item["num"] = opts.get("num")
            cursor = item["e"] + opts.get("gap", b["gap"])
            L.append(item)
        end = (L[-1]["e"] + b["tail"]) if L else 0
        if b["lyrics"] and not L:
            end = b["dur"] or 0
        dur = b["dur"] if b["dur"] else max(end, b["min"])
        dur = max(dur, (L[-1]["e"] + .2) if L else 0)
        b0, b1 = t, t + dur

        def R(ref):
            if isinstance(ref, (int, float)):
                return b0 + float(ref)
            m = REF.match(ref.replace(" ", ""))
            if not m:
                raise ValueError("bad time ref %r" % ref)
            li, e, off = m.group(1), m.group(2), m.group(3)
            if li is not None:
                base = L[int(li)]["e" if e else "s"]
            elif ref.startswith("e"):
                base = dur
            else:
                base = 0
            return b0 + base + (float(off.replace(" ", "")) if off else 0)

        def resolve_kfs(kfs):
            out = []
            for kf in kfs:
                kf = dict(kf); kf["t"] = round(R(kf["t"]), 4)
                out.append(kf)
            out.sort(key=lambda q: q["t"])
            return out

        actors = {n: resolve_kfs(kfs) for n, kfs in b["actors"].items()}
        cam = resolve_kfs(b["cam"])
        fx = {}
        for name, v in b["fx"].items():
            if isinstance(v, list):
                if v and "t0" in v[0]:
                    fx[name] = [dict(m, t0=round(R(m["t0"]), 4)) for m in v]
                else:
                    fx[name] = resolve_kfs(v)
            elif isinstance(v, dict) and "t0" in v:
                fx[name] = dict(v, t0=round(R(v["t0"]), 4))
            elif isinstance(v, str) and v.startswith("AT:"):
                at = R(v[3:])
                fx[name] = [dict(t=round(b0, 4), v=0), dict(t=round(at, 4), v=0), dict(t=round(at + .01, 4), v=1), dict(t=round(b1, 4), v=1)]
            else:
                fx[name] = v
        # lines out
        for i, it in enumerate(L):
            tl_lines.append(dict(who=it["who"], t0=round(b0 + it["s"], 4), t1=round(b0 + it["e"], 4), env=it["env"]))
            plan["lines"].append(dict(key=it["key"], who=it["who"], text=it["text"], t0=round(b0 + it["s"], 4), special=it["text"] if it["text"].startswith("#") else None))
            if it["num"]:
                tl_numbers.append(dict(t0=round(b0 + it["s"], 4), n=it["num"]))
        for ly in b["lyrics"]:
            tl_lyrics.append(dict(t0=round(b0 + ly["t0"], 3), t1=round(b0 + ly["t1"], 3), text=ly["text"]))
        for cd in b["cards"]:
            tl_cards.append(dict(cd, t0=round(R(cd["t0"]), 3), t1=round(R(cd["t1"]), 3)))
        for ref, name, g in b["sfx"]:
            plan["sfx"].append(dict(t=round(R(ref), 3), name=name, gain=g))
        plan["ambient"].append(dict(t0=round(b0, 3), t1=round(b1, 3), kind=AMBIENT[b["scene"]][0], gain=AMBIENT[b["scene"]][1]))
        # footsteps etc. derived from the choreography
        plan["steps"] += derive_steps(b, actors, b0, b1)
        fade = dict(**{"in": b["fade"][0], "out": b["fade"][1]}, col=b["fade_col"] or "#0a0824")
        tl_beats.append(dict(id=b["id"], scene=b["scene"], t0=round(b0, 4), t1=round(b1, 4), cam=cam, actors=actors, fx=fx, fade=fade, bpm=b["bpm"], constel=b["constel"]))
        b["_t0"], b["_t1"] = b0, b1
        t = b1
    total = t
    ids = {b["id"]: b for b in BEATS}
    for cue, first, last in MUSIC:
        plan["music"].append(dict(cue=cue, t0=round(ids[first]["_t0"], 3), t1=round(ids[last]["_t1"], 3)))
    frames = int(math.ceil(total * FPS))
    TL = dict(fps=FPS, frames=frames, beats=tl_beats, lines=tl_lines, lyrics=tl_lyrics, cards=tl_cards, numbers=tl_numbers)
    os.makedirs(OUT, exist_ok=True)
    json.dump(TL, open(os.path.join(OUT, "timeline.json"), "w"))
    json.dump(plan, open(os.path.join(OUT, "plan.json"), "w"))
    return TL, plan, total


# --- re-implementation of the JS keyframe maths (to time footsteps exactly like the renderer) ---
EASE = dict(lin=lambda u: u, io=lambda u: 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2, out=lambda u: 1 - (1 - u) ** 3,
            **{"in": lambda u: u ** 3}, sine=lambda u: -(math.cos(math.pi * u) - 1) / 2, hold=lambda u: 1.0 if u >= 1 else 0.0,
            back=lambda u: 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2)


def track(kfs, ch):
    return sorted([(k_["t"], k_[ch], k_.get("e", "io")) for k_ in kfs if ch in k_ and k_[ch] is not None], key=lambda q: q[0])


def chan_at(tr, t, d=0):
    if not tr:
        return d
    if t <= tr[0][0]:
        return tr[0][1]
    for i, (kt, kv, ke) in enumerate(tr):
        if t < kt:
            pt, pv, _ = tr[i - 1]
            if isinstance(pv, (int, float)) and isinstance(kv, (int, float)) and not isinstance(pv, bool):
                u = (t - pt) / max(1e-6, kt - pt)
                return pv + (kv - pv) * EASE.get(ke, EASE["io"])(max(0, min(1, u)))
            return pv
    return tr[-1][1]


def disc_at(tr, t, d=None):
    v = d
    for kt, kv, _ in tr:
        if kt <= t:
            v = kv
    return v


STRIDE = dict(bibi=96, mama=96, tuck=62, odo=90, luma=90)


def derive_steps(b, actors, b0, b1):
    ev = []
    n = int((b1 - b0) * FPS) + 2
    for name, kfs in actors.items():
        if name not in ("bibi", "mama", "tuck"):
            if name == "odo":  # wing flaps while flying
                an = track(kfs, "anim")
                for i in range(int((b1 - b0) * 1.9) + 2):
                    tt = (.25 + math.floor(b0 * 1.9) + i) / 1.9
                    if b0 <= tt < b1 and disc_at(an, tt, "idle") == "fly":
                        ev.append(dict(t=round(tt, 3), name="flap", gain=.5))
            continue
        tx, ty, ts, tst, an = track(kfs, "x"), track(kfs, "y"), track(kfs, "s"), track(kfs, "stride"), track(kfs, "anim")
        prev = chan_at(tx, b0, 0); dist = 0.0; last_i = 0
        for i in range(n):
            tt = b0 + i / FPS
            x = chan_at(tx, tt, 0); dx = abs(x - prev); prev = x; dist += dx
            speed = dx * FPS
            a = disc_at(an, tt, "idle")
            if a in ("idle", "swim") or speed < 6 or a != "walk":
                continue
            s_ = chan_at(ts, tt, 1); stride = STRIDE[name] * chan_at(tst, tt, 1) * s_
            ph = dist / stride * (1.0 if name != "tuck" else 1.0)
            if int(ph) > last_i:
                last_i = int(ph)
                ev.append(dict(t=round(tt, 3), name="hop" if name != "tuck" else "turtle_step", gain=.35 if name == "bibi" else (.4 if name == "mama" else .5)))
    return ev


if __name__ == "__main__":
    TL, plan, total = build()
    print("total %.1fs = %d:%02d | frames %d | beats %d | lines %d | sfx %d | steps %d" % (total, total // 60, total % 60, TL["frames"], len(TL["beats"]), len(TL["lines"]), len(plan["sfx"]), len(plan["steps"])))
    for b in TL["beats"]:
        print("  %s %-10s %7.1f -> %7.1f  (%5.1fs)" % (b["id"], b["scene"], b["t0"], b["t1"], b["t1"] - b["t0"]))
