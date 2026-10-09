#!/usr/bin/env bash
# Full-resolution 1920x1080 version small enough for chat upload (<30 MiB): HEVC two-pass at a fixed bitrate + 64k AAC.
# usage: ./compact1080.sh master.mp4 out.mp4 [video_kbps=295]
set -euo pipefail
SRC="$1"; OUT="$2"; VK="${3:-295}"
W="$(dirname "$OUT")/.compact1080_work"; mkdir -p "$W"
ffmpeg -y -loglevel error -i "$SRC" -vn -c:a aac -b:a 64k -ar 48000 "$W/audio.m4a"
echo "pass 1/2"
ffmpeg -y -loglevel error -i "$SRC" -an -c:v libx265 -preset medium -tune animation -b:v ${VK}k -pix_fmt yuv420p \
  -x265-params "pass=1:stats=$W/x265.log:log-level=error" -f null /dev/null
echo "pass 2/2"
ffmpeg -y -loglevel error -i "$SRC" -an -c:v libx265 -preset medium -tune animation -b:v ${VK}k -pix_fmt yuv420p -tag:v hvc1 \
  -x265-params "pass=2:stats=$W/x265.log:log-level=error" "$W/video.mp4"
ffmpeg -y -loglevel error -i "$W/video.mp4" -i "$W/audio.m4a" -c copy -movflags +faststart "$OUT"
ls -l "$OUT" | awk '{printf "%.2f MiB\n", $5/1048576}'
