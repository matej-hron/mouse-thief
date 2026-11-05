# Makes the radio voice clips in radio/ (see README.md, "Pixel Wings > Radio").
#   pip install piper-tts      (and ffmpeg)
#   download the voice models (.onnx + .onnx.json) from https://huggingface.co/rhasspy/piper-voices:
#   en_US-ryan-medium, en_US-joe-medium, en_US-lessac-medium (pilots), en_GB-alan-medium (command),
#   en_GB-northern_english_male-medium (flight school instructor)
#   python3 tools/radio/gen.py <folder with the models> radio
import subprocess, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import P, C, I
models, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
radio = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'radio.sh')
voices = ['en_US-ryan-medium', 'en_US-joe-medium', 'en_US-lessac-medium']
jobs = [(f'{k}_{i}', voices[i], t, '0.85') for k, t in P.items() for i in range(3)] + \
       [(f'{k}_c', 'en_GB-alan-medium', t, '0.95') for k, t in C.items()] + \
       [(f'{k}_i', 'en_GB-northern_english_male-medium', t, '0.95') for k, t in I.items()]
only = sys.argv[3:]                                   # optional: just these clip names
if only: jobs = [j for j in jobs if j[0] in only]
for name, v, t, ls in jobs:
    subprocess.run([radio, os.path.join(models, v + '.onnx'), t, os.path.join(out, name + '.mp3'), ls], check=True)
print(len(jobs), 'clips')
