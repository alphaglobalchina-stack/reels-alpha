#!/usr/bin/env bash
# Re-render only frames A..B of the reel and splice them into the existing export
# (video re-encoded once, original audio stream copied untouched).
#   usage: scripts/splice_segment.sh A B [video=out/reel_malaysia.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
A=$1
B=$2
SRC=${3:-out/reel_malaysia.mp4}
SEG=out/qa/segment_${A}_${B}.mp4
TMP=out/qa/spliced.mp4

npx remotion render Malaysia "$SEG" --frames="$A-$B" --concurrency=100% --muted --log=error

ffmpeg -v error -y -i "$SRC" -i "$SEG" -filter_complex "\
[0:v]trim=start_frame=0:end_frame=${A},setpts=PTS-STARTPTS[a];\
[1:v]setpts=PTS-STARTPTS[s];\
[0:v]trim=start_frame=$((B + 1)),setpts=PTS-STARTPTS[b];\
[a][s][b]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -map 0:a -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart "$TMP"

frames=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$TMP")
echo "spliced frames ${A}-${B}; total frames: $frames"
mv "$TMP" "$SRC"
