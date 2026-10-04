# الصين في 30 ثانية — Remotion Reel

فيديو عمودي 1080×1920، 30fps، 900 إطار (30 ثانية بالضبط). كل شيء يُعدَّل من `src/config.ts`.

## التشغيل

```bash
cd china-reel
npm install
npm start          # معاينة في Remotion Studio
npm run render     # يخرج out/china-reel.mp4 (H.264, CRF 16)
npm run typecheck
```

## تغيير النصوص والأرقام
افتح `src/config.ts` ← مصفوفة `SCENES`:
- `title` العنوان (استخدم `\n` لفرض سطر جديد)، `tag` الوسم الصغير، `caption` السطر الصغير.
- `number: {value, prefix, unit}` الرقم الكبير بعدّاده ووحدته. `highlight` نص كبير بدل الرقم.
- مشهد الخاتمة في `OUTRO` (العنوان، نص الزر، اسم الحساب).
- الألوان في `COLORS`، المناطق الآمنة في `SAFE`، عدد الجسيمات في `PARTICLES`.

## تغيير الصور
- كل مشهد له `image` برابط مباشر (Unsplash/Pexels) في `config.ts`. بدّل الرابط فقط.
- **روابط الصور الحالية لم أستطع التحقق منها** (بيئة التطوير تحجب Unsplash/Pexels)، فبدّلها بصور تختارها.
- إن فشل التحميل يظهر **تدرج لوني بديل** (`fallback`) ولا ينكسر الريندر.
- للعمل دون إنترنت: ضع الصورة في `public/images/` واستخدم `staticFile('images/x.jpg')` بدل الرابط.
- الصور الحرة: https://unsplash.com ، https://pexels.com ، https://pixabay.com

## الموسيقى
ضع موسيقاك في **`public/music.mp3`** (الملف الحالي placeholder مولَّد برمجيًا). الـ Fade-in أول ثانية والـ Fade-out آخر ثانيتين تلقائيًا (من `AUDIO`).
مصادر مجانية مقترحة:
1. YouTube Audio Library — https://studio.youtube.com (Audio Library)
2. Pixabay Music — https://pixabay.com/music/
3. Free Music Archive — https://freemusicarchive.org

تحقق من الترخيص (والإسناد إن لزم) قبل النشر. صوت الـ whoosh مولَّد برمجيًا في `public/sfx/whoosh.wav` (`npm run sfx` يعيد توليد whoosh والموسيقى الـ placeholder؛ لا تشغّله إن وضعت موسيقاك).

## الشعار
`OUTRO.logo` يشير إلى `public/logo.png` (شعار Alpha). استبدل الملف أو غيّر الاسم. `OUTRO.accountName` لإظهار اسم الحساب.

## التوقيت
6 مشاهد × 160 إطار − 5 انتقالات Wipe × 12 إطار = 900 إطار. بداية المشاهد: 0 / 4.93 / 9.87 / 14.8 / 19.7 / 24.7 ثانية تقريبًا (الانتقال يتداخل مع المشهدين).

## الهيكل
```
src/Root.tsx          تسجيل الـ Composition
src/ChinaReel.tsx     التركيب + الانتقالات + الصوت
src/WipeTransition.tsx  Wipe قطري أحمر
src/scenes/Scene1..6  المشاهد
src/components/       KenBurnsImage, AnimatedText, Counter, Particles, ProgressBar, CloudPattern, ...
src/config.ts         كل المحتوى والإعدادات
```
