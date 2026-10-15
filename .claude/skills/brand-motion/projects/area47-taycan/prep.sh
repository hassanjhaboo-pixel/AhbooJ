#!/usr/bin/env bash
# One-time asset prep: extracts the owner's phone clips into 30fps, 1080-wide, sharpened JPEG frame sequences.
#   ./prep.sh <reveal.mp4> <wheel.mp4> <badge.mp4>
# Trims are chosen so no licence plate or bystander's feet appear (reveal ends ~1.2s before the plate shows).
set -euo pipefail
cd "$(dirname "$0")/assets"
ex(){ rm -rf "$1"; mkdir -p "$1"; ffmpeg -y -loglevel error -ss "$3" -t "$4" -i "$2" \
  -vf "fps=30,scale=1080:-2:flags=lanczos,unsharp=5:5:0.8,eq=contrast=1.04:saturation=1.08" -q:v 5 "$1/%04d.jpg"; echo "$1: $(ls "$1" | wc -l) frames"; }
ex reveal "$1" 1.5 7.1     # sky → car descent (clip 4c16…)
ex wheel  "$2" 0   6.2     # gold wheel pan (clip 370f…)
ex badge  "$3" 5.5 3.55    # Turbo GT badge (clip 9c09…)
