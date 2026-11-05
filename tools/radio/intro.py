# Makes the intro's voices in radio/ (see README.md, "Pixel Wings > Intro").
#   python3 tools/radio/intro.py <folder with the Piper models> radio
# The narrator is a deep "cinema" voice (lower, with an echo, no radio); Captain Hawk and the Rookie talk on the radio.
import subprocess, sys, os, tempfile
models, out = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
NARRATOR = [('intro_n1', "The Pixel Archipelago. A thousand tiny islands... and two squadrons who can't share the sky.")]
HAWK = [('intro_h1', "Rookie, you awake back there?"),
        ('intro_h2', "Red Squadron wants Blue Island's air base. Blue Island wants to keep it. We fly bombers, they fly fighters."),
        ('intro_h3', "Today? Whichever one you picked."),
        ('intro_h4', "Out at sea, both sides have carriers. Sink theirs, keep yours floating. Simple."),
        ('intro_h5', "Then you parachute, you get a new plane, and the mechanics complain."),
        ('intro_h6', "Stay on my wing, aim before you shoot, and... here they come. Good luck, rookie!")]
ROOKIE = [('intro_r1', "Yes sir! What are we doing, sir?"),
          ('intro_r2', "Which side are we on?"),
          ('intro_r3', "And if I get shot down?")]
for name, text in NARRATOR:
    raw = os.path.join(tempfile.gettempdir(), 'narr.wav')
    subprocess.run(['python3', '-m', 'piper', '-m', os.path.join(models, 'en_US-ryan-medium.onnx'), '--length-scale', '1.15', '-f', raw, '--', text], check=True, stderr=subprocess.DEVNULL)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af',
                    'asetrate=22050*0.84,aresample=22050,atempo=1.19,bass=g=5,aecho=0.8:0.6:70|140:0.25|0.12,volume=1.4,alimiter=limit=0.9',
                    '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '56k', os.path.join(out, name + '.mp3')], check=True)
for name, text in HAWK:
    subprocess.run([os.path.join(here, 'radio.sh'), os.path.join(models, 'en_GB-northern_english_male-medium.onnx'), text, os.path.join(out, name + '.mp3'), '0.95'], check=True)
for name, text in ROOKIE:
    subprocess.run([os.path.join(here, 'radio.sh'), os.path.join(models, 'en_US-joe-medium.onnx'), text, os.path.join(out, name + '.mp3'), '0.85'], check=True, env=dict(os.environ, PITCH='1.12'))
print('intro voices done')
