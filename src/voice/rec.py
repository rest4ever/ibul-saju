import sys, json, subprocess, re, os
sys.path.insert(0,'/tmp/claude-0/-home-claude/2e213958-334b-5148-84d8-4d9919f64fcb/scratchpad')
from gem_tts import tts
exec(open('lines.py').read())
STYLE=("A cheerful, playful young Korean male scholar from the Joseon era (a 'doryeong'), about 20 years old. "
       "Warm, witty, slightly theatrical sageuk drama tone, friendly and teasing. Medium pace, clear pronunciation. "
       "This is a list of separate lines: take a full two-second silent pause after each line.")
def silences(wav):
    r=subprocess.run(['ffmpeg','-i',wav,'-af','silencedetect=noise=-38dB:d=0.9','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',r)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',r)]
    return list(zip(st,en))
def dur(w): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',w],capture_output=True,text=True).stdout)
batch=[l for l in LINES if l[0] in sys.argv[2:]] if len(sys.argv)>2 else None
tag=sys.argv[1]
parts=[(t,STYLE) for k,t in batch]
print('tokens',tts(parts,'Puck',f'b_{tag}.wav'))
S=[]; D=dur(f"b_{tag}.wav")

# 말 구간 = 쉼 사이



json.dump({"keys":[k for k,_ in batch]},open(f"b_{tag}.json","w")); print("길이",D)
