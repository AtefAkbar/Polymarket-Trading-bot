"""contact.py out.jpg frame1.jpg frame2.jpg ... -> grid contact sheet (3 columns), each tile 640x360 with a timestamp label"""
import sys, os
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
cols = 3
tw, th = 640, 360
rows = (len(files) + cols - 1) // cols
S = Image.new("RGB", (cols * tw, rows * th), "black")
for i, f in enumerate(files):
    im = Image.open(f).resize((tw, th))
    d = ImageDraw.Draw(im)
    t = int(os.path.basename(f)[1:6]) / 10
    d.rectangle([0, 0, 92, 22], fill=(0, 0, 0)); d.text((6, 4), "%d:%04.1f" % (t // 60, t % 60), fill=(255, 255, 255))
    S.paste(im, ((i % cols) * tw, (i // cols) * th))
S.save(out, quality=88)
