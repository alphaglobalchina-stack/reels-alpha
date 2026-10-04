#!/bin/bash
# Contact sheets from a rendered film at given seconds: qc_sheet.sh video.mp4 out.jpg 1.0 2.5 ...
v=$1; out=$2; shift 2; tmp=$(mktemp -d); i=0
for s in "$@"; do ffmpeg -v error -ss $s -i "$v" -frames:v 1 -vf "scale=360:640,drawtext=text='${s}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.5" $tmp/$(printf %03d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$tmp/*.png" -vf "tile=${i}x1:padding=6:color=0x300000" -frames:v 1 "$out"; rm -rf $tmp; echo "$out"
