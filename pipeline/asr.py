import onnxruntime as ort, numpy as np, soundfile as sf, sys
M='/home/user/models/sherpa-onnx-omnilingual-asr-1600-languages-300M-ctc-int8-2025-11-12/'
toks=[l.rstrip('\n').rsplit(' ',1)[0] if not l.startswith('  ') else ' ' for l in open(M+'tokens.txt',encoding='utf8')]
x,sr=sf.read('pipeline/work/vo16k.wav',dtype='float32')
x=(x-x.mean())/(x.std()+1e-7)
s=ort.InferenceSession(M+'model.int8.onnx')
lg=s.run(None,{'x':x[None]})[0][0]
np.save('pipeline/work/logits.npy',lg)
print(lg.shape, len(x)/16000/lg.shape[0])
ids=lg.argmax(-1); out=[];prev=-1
for i in ids:
  if i!=prev and i!=0: out.append(toks[i])
  prev=i
print(''.join(out))
