#!/usr/bin/env bash
# Final assembly: two-pass loudness normalisation (-16 LUFS, YouTube-friendly) + mux with the silent video.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-build/bibi_and_the_little_lost_star.mp4}"
LN="I=-16:TP=-1.5:LRA=11"
ffmpeg -hide_banner -nostats -i build/audio.wav -af "loudnorm=${LN}:print_format=json" -f null - 2> build/ln_pass1.txt
get() { grep "\"$1\"" build/ln_pass1.txt | head -1 | sed -E 's/.*: "([^"]+)".*/\1/'; }
MI=$(get input_i); MTP=$(get input_tp); MLRA=$(get input_lra); MTH=$(get input_thresh); MOFF=$(get target_offset)
echo "pass1: I=$MI TP=$MTP LRA=$MLRA thresh=$MTH offset=$MOFF"
ffmpeg -y -hide_banner -loglevel error -i build/video_silent.mp4 -i build/audio.wav \
  -af "loudnorm=${LN}:measured_I=${MI}:measured_TP=${MTP}:measured_LRA=${MLRA}:measured_thresh=${MTH}:offset=${MOFF}:linear=true,aresample=48000" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart \
  -metadata title="Bibi and the Little Lost Star" -metadata comment="An original animated bedtime story for children" "$OUT"
ffprobe -v error -show_entries format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E "I:|LRA:|Peak:" 
