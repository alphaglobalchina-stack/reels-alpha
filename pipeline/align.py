"""CTC forced alignment of the known Arabic script against the voice-over.
Emissions: Meta Omnilingual ASR 300M CTC (sherpa-onnx export). Output: content/vo-timing.json"""
import json, re, numpy as np, onnxruntime as ort, soundfile as sf, os
M='/home/user/models/sherpa-onnx-omnilingual-asr-1600-languages-300M-ctc-int8-2025-11-12/'
vocab={}
for l in open(M+'tokens.txt',encoding='utf8'):
  l=l.rstrip('\n'); t,i=l.rsplit(' ',1); vocab[t if t else ' ']=int(i)

# Subtitle phrases; words separated by spaces. "display=align" overrides the spoken form.
PHRASES = [
 ("s1", "الصين مليئة بالفُرَص…"),
 ("s1", "لكن الوصول إلى المُوَرِّد الصحيح"),
 ("s1", "هو البداية فقط."),
 ("s2", "من قوانزو، في قلب الصين،"),
 ("s2", "نعمل معك من داخل السوق نفسه."),
 ("s4", "نبحث عن المُوَرِّدين والمصانع المناسبة،"),
 ("s5", "نقارن العروض، ونتفاوض"),
 ("s5", "على الأسعار والمواصفات"),
 ("s5", "بما يخدم احتياجك."),
 ("s6", "نتابع طلبك من العَيِّنَة إلى الإنتاج،"),
 ("s6", "وننسّق فحص البضاعة قبل الشحن"),
 ("s6", "للتأكد من مطابقتها للمواصفات."),
 ("s7", "سواء كنت تبحث عن منتجات، معدات،"),
 ("s7", "مكائن، أو خطوط إنتاج كاملة،"),
 ("s7", "نحن نساعدك في التوريد من الصين"),
 ("s7", "بخطوات واضحة ومدروسة."),
 ("s8", "ثم نرتب الشحن من الصين"),
 ("s8", "إلى ميناء وِجهَتك."),
 ("s9", "لا تبحث عن مُوَرِّد فقط…"),
 ("s9", "امتلك شريكًا داخل الصين."),
 ("s10", "GUANGZHOU=guangzhou ALPHA=alpha GLOBAL=global TRADING=trading CO.,=co LTD=limited"),
 ("s10", "شريكك التجاري من الصين."),
]
DIAC = re.compile('[ً-ْٰـ]')
def norm(w):
  w = DIAC.sub('', w).lower()
  return ''.join(c for c in w if c in vocab and c != ' ')

words=[]  # dict(text, phrase, tokens)
for pi,(scene,p) in enumerate(PHRASES):
  for raw in p.split(' '):
    disp, spoken = (raw.split('=',1) if '=' in raw else (raw, raw))
    toks=[vocab[c] for c in norm(spoken)]
    assert toks, raw
    words.append(dict(text=disp, phrase=pi, toks=toks))

# emissions
x,sr=sf.read('pipeline/work/vo16k.wav',dtype='float32')
if os.path.exists('pipeline/work/logits.npy'): lg=np.load('pipeline/work/logits.npy')
else:
  s=ort.InferenceSession(M+'model.int8.onnx'); lg=s.run(None,{'x':((x-x.mean())/(x.std()+1e-7))[None]})[0][0]
lp = lg - np.log(np.exp(lg - lg.max(-1,keepdims=True)).sum(-1,keepdims=True)) - lg.max(-1,keepdims=True)
T=lp.shape[0]; fr = len(x)/sr/T
# token sequence with optional space token between words
seq=[]; owner=[]
for wi,w in enumerate(words):
  for t in w['toks']: seq.append(t); owner.append(wi)
L=len(seq); BL=0
# standard CTC Viterbi over extended sequence (blank, t1, blank, t2, ..., blank)
ext=[BL]; eown=[-1]
for t,o in zip(seq,owner): ext += [t, BL]; eown += [o, -1]
S=len(ext); ext=np.array(ext)
NEG=-1e18
dp=np.full(S,NEG); dp[0]=lp[0,BL]; dp[1]=lp[0,ext[1]]
bp=np.zeros((T,S),dtype=np.int8)
skip=np.zeros(S,bool)
for s in range(2,S):
  skip[s] = ext[s]!=BL and ext[s]!=ext[s-2]
for t in range(1,T):
  a=dp; b=np.concatenate([[NEG],dp[:-1]]); c=np.concatenate([[NEG,NEG],dp[:-2]]); c=np.where(skip,c,NEG)
  st=np.stack([a,b,c]); arg=st.argmax(0); bp[t]=arg
  dp=st[arg,np.arange(S)]+lp[t,ext]
s = S-1 if dp[S-1]>dp[S-2] else S-2
path=np.zeros(T,dtype=int)
for t in range(T-1,-1,-1):
  path[t]=s; s-=int(bp[t,s])
# word spans
span={}
for t in range(T):
  o=eown[path[t]]
  if o>=0:
    a,b=span.get(o,(t,t)); span[o]=(min(a,t),max(b,t))
# confidence per word: mean prob of its emitting frames
out_words=[]
for wi,w in enumerate(words):
  a,b=span[wi]
  frames=[t for t in range(a,b+1) if eown[path[t]]==wi]
  conf=float(np.exp(np.mean([lp[t,ext[path[t]]] for t in frames])))
  out_words.append(dict(i=wi,text=w['text'],phrase=w['phrase'],start=round(a*fr,3),end=round((b+1)*fr,3),conf=round(conf,3)))
# phrases
phr=[]
for pi,(scene,p) in enumerate(PHRASES):
  ws=[w for w in out_words if w['phrase']==pi]
  phr.append(dict(i=pi,scene=scene,text=' '.join(w['text'] for w in ws),start=ws[0]['start'],end=ws[-1]['end'],words=[w['i'] for w in ws]))
dur=len(x)/sr
json.dump(dict(source='assets/voiceover.mp3',duration=round(dur,3),frameSec=fr,aligner='Omnilingual-ASR 300M CTC, Viterbi forced alignment',phrases=phr,words=out_words),open('content/vo-timing.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
for p in phr: print(f"{p['start']:6.2f}-{p['end']:6.2f} {p['scene']:4} {p['text']}")
print('low conf:',[(w['text'],w['conf']) for w in out_words if w['conf']<0.2])
