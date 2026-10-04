#!/bin/bash
# usage: stills.sh name sec1 sec2 ...   → renders stills at given seconds into a contact sheet
cd "$(dirname "$0")"
S=/tmp/claude-0/-home-user-reels-alpha/0a37cbb2-bd10-5f73-ae82-bdc71fd07126/scratchpad/stills
mkdir -p $S; name=$1; shift; files=()
for s in "$@"; do f=$(python3 -c "print(round($s*60))"); out=$S/${name}_$f.jpg
  npx remotion still ${COMP:-AlphaOpening} $out --frame=$f --props='{"audio":false,"subtitles":false}' --log=error --scale=0.5 >/dev/null 2>&1 || echo "fail $s"; files+=($out); done
python3 - "$S/${name}_sheet.jpg" "${files[@]}" <<'PY'
import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; fs=sys.argv[2:]
ims=[Image.open(f).resize((360,640)) for f in fs]
o=Image.new('RGB',(368*len(ims),672),'#300')
for i,(im,f) in enumerate(zip(ims,fs)):
  o.paste(im,(i*368,0)); ImageDraw.Draw(o).text((i*368+6,646),f.split('_')[-1].split('.')[0]+'f = '+str(round(int(f.split('_')[-1].split('.')[0])/60,2))+'s',fill='white')
o.save(out)
PY
echo $S/${name}_sheet.jpg
