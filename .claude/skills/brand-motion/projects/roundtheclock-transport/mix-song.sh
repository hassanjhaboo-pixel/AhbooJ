#!/usr/bin/env bash
# Soundtrack for the "Ikation" cut: the owner-supplied clip, with bars 10-11 (24.647-29.307s) repeated once at 29.307s
# so the end card gets a full hold, a 1.6s fade at the end, quiet timeline SFX underneath, loudness -14 LUFS.
#   ./mix-song.sh <song-clip.mp3>   → out/rtc-song-mix.wav  (35.406s, lines up with storyboard-*.json)
# The song file is not committed (copyright); pass the path to your copy.
set -euo pipefail
SONG="${1:?usage: mix-song.sh <song-clip.mp3>}"
cd "$(dirname "$0")"
mkdir -p out
A=29.307; B=24.647; END=35.406
node ../../scripts/audio.mjs --story storyboard-9x16.json --out out/sfx-song.wav --bed none --lufs -28 >/dev/null
ffmpeg -y -loglevel error -i "$SONG" -i out/sfx-song.wav -filter_complex "
  [0:a]aresample=44100,asplit=2[s1][s2];
  [s1]atrim=0:$A,asetpts=PTS-STARTPTS,afade=t=out:st=$(echo "$A-0.012"|bc):d=0.012[p1];
  [s2]atrim=$B,asetpts=PTS-STARTPTS,afade=t=in:d=0.012[p2];
  [p1][p2]concat=n=2:v=0:a=1,atrim=0:$END,afade=t=out:st=$(echo "$END-1.6"|bc):d=1.6[song];
  [song][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[out]" \
  -map "[out]" -ar 44100 -c:a pcm_s16le out/rtc-song-mix.wav
echo "out/rtc-song-mix.wav $(ffprobe -v error -show_entries format=duration -of csv=p=0 out/rtc-song-mix.wav)s"
