import sherpa_onnx, soundfile as sf, numpy as np
M='/home/user/models/sherpa-onnx-whisper-turbo/'
import glob
enc=sorted(glob.glob(M+'*encoder*.onnx')); dec=sorted(glob.glob(M+'*decoder*.onnx'))
enc=[e for e in enc if 'int8' in e] or enc; dec=[d for d in dec if 'int8' in d] or dec
r=sherpa_onnx.OfflineRecognizer.from_whisper(encoder=enc[0],decoder=dec[0],tokens=glob.glob(M+'*tokens.txt')[0],language='ar',task='transcribe',num_threads=4)
x,sr=sf.read('pipeline/work/vo16k.wav',dtype='float32')
# chunk at detected silences (<30s each)
cuts=[0,10.2,18.1,25.6,35.2,42.3,len(x)/sr]
for a,b in zip(cuts,cuts[1:]):
  st=r.create_stream(); st.accept_waveform(sr,x[int(a*sr):int(b*sr)]); r.decode_stream(st)
  print(f'[{a:.1f}-{b:.1f}]',st.result.text)
