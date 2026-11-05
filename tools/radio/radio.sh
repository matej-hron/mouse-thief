#!/bin/bash
# radio.sh MODEL "text" out.mp3 [length_scale]
set -e
python3 -m piper -m "$1" --length-scale "${4:-0.88}" -f ${TMPDIR:-/tmp}/raw_$$.wav -- "$2" 2>/dev/null
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 ${TMPDIR:-/tmp}/raw_$$.wav)
# a pilot's headset over the radio: narrow band, squashed, a bit overdriven, a hiss underneath
ffmpeg -hide_banner -loglevel error -y -i ${TMPDIR:-/tmp}/raw_$$.wav \
  -f lavfi -t "$D" -i "anoisesrc=color=pink:amplitude=0.05:sample_rate=22050" \
  -filter_complex "[0:a]aresample=22050,highpass=f=380,highpass=f=380,lowpass=f=3000,lowpass=f=3000,acompressor=threshold=0.05:ratio=10:attack=2:release=60:makeup=4,volume=1.6,asoftclip=type=tanh,equalizer=f=1800:t=q:w=1:g=5[v];[1:a]highpass=f=600,lowpass=f=4500,volume=0.6[n];[v][n]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[o]" \
  -map "[o]" -ac 1 -ar 22050 -c:a libmp3lame -b:a 40k "$3"
rm -f ${TMPDIR:-/tmp}/raw_$$.wav
