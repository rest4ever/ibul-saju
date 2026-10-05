import json, re, subprocess, difflib, sys
from types import SimpleNamespace as NS
exec(open('lines.py').read()); TXT=dict(LINES)
norm=lambda s: re.sub(r'[^가-힣0-9]','',s)
NUM={'2027':'이천이십칠','10':'십','4':'네','2':'두','8':'여덟','5':'다섯','7':'일곱'}
def nn(s):
    s=norm(s)
    for k,v in NUM.items(): s=s.replace(k,v)
    return s
res={}
for tag in sys.argv[1:]:
    keys=json.load(open(f'b_{tag}.json'))['keys']
    W=[NS(**w) for w in json.load(open(f'w_{tag}.json'))]
    n=len(W); L=len(keys)
    T=[nn(w.word) for w in W]
    seg=lambda i,j: ''.join(T[i:j])
    sim=lambda a,b: difflib.SequenceMatcher(None,a,b).ratio()*len(b)
    # dp[l][j]: 앞 l줄을 단어 0..j로 덮을 때 최고 점수
    NEG=-1e9
    dp=[[NEG]*(n+1) for _ in range(L+1)]; bk=[[0]*(n+1) for _ in range(L+1)]
    dp[0][0]=0
    for l in range(1,L+1):
        e=nn(TXT[keys[l-1]])
        for j in range(1,n+1):
            best=NEG;bi=0
            for i in range(max(0,j-40),j):
                if dp[l-1][i]==NEG: continue
                v=dp[l-1][i]+sim(seg(i,j),e)
                if v>best: best=v;bi=i
            dp[l][j]=best; bk[l][j]=bi
    cuts=[n]; j=n
    for l in range(L,0,-1): j=bk[l][j]; cuts.append(j)
    cuts=cuts[::-1]
    for l,k in enumerate(keys):
        i,j=cuts[l],cuts[l+1]
        s=max(0,W[i].start-0.12); e=W[j-1].end+0.3
        if j<n: e=min(e,(W[j-1].end+W[j].start)/2+0.05)
        if l>0: s=max(s,(W[i-1].end+W[i].start)/2-0.05)
        subprocess.run(['ffmpeg','-loglevel','error','-y','-i',f'b_{tag}.wav','-ss',f'{s:.2f}','-to',f'{e:.2f}','-af','afade=t=in:d=0.03,areverse,afade=t=in:d=0.08,areverse','-ac','1','-ar','24000','-b:a','40k',f'lines/{k}.mp3'])
        hyp=''.join(w.word for w in W[i:j]).strip()
        r=difflib.SequenceMatcher(None,nn(TXT[k]),nn(hyp)).ratio()
        res[k]={'s':round(s,2),'e':round(e,2),'ratio':round(r,2),'heard':hyp}
        print(tag,k,round(s,2),round(e,2),round(r,2),hyp)
json.dump(res,open('align3.json','w'),ensure_ascii=False,indent=1)
