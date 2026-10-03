/**
 * كل ما يمكن تعديله في الفيديو موجود هنا: النصوص، الأرقام، الصور، الألوان، التوقيت.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** مدة كل مشهد (إطار). 6 × 160 − 5 انتقالات × 12 = 900 إطار = 30 ثانية بالضبط. */
export const SCENE_FRAMES = 160;
export const TRANSITION_FRAMES = 12; // 0.4 ثانية
export const SCENE_COUNT = 6;
export const TOTAL_FRAMES = SCENE_FRAMES * SCENE_COUNT - TRANSITION_FRAMES * (SCENE_COUNT - 1); // 900
/** إزاحة بداية كل مشهد على الخط الزمني العام */
export const SCENE_STRIDE = SCENE_FRAMES - TRANSITION_FRAMES;

export const COLORS = {
  red: '#DE2910',
  gold: '#FFDE00',
  black: '#0A0A0A',
  cream: '#F5F0E6',
};

export const FONTS = {
  arabic: 'Cairo',
  display: 'Bebas Neue',
};

/** المناطق الآمنة لواجهة إنستقرام (بكسل) */
export const SAFE = {top: 200, bottom: 250, side: 70};

export type SceneNumber = {
  /** القيمة التي يعدّ إليها العدّاد */
  value: number;
  /** رمز قبل الرقم مثل + أو % */
  prefix?: string;
  /** وحدة تظهر تحت الرقم */
  unit: string;
};

export type SceneConfig = {
  id: string;
  /** عنوان المشهد (كلمة كلمة). استخدم \\n لفرض سطر جديد */
  title: string;
  /** سطر صغير فوق العنوان */
  tag?: string;
  /** رقم كبير بعدّاد متحرك */
  number?: SceneNumber;
  /** نص كبير بديل للرقم (مثل مشهد الطبيعة) */
  highlight?: string;
  /** سطر وصف صغير */
  caption?: string;
  /** رابط الصورة (Unsplash/Pexels). إن فشل التحميل يُستخدم التدرج البديل */
  image: string;
  /** ألوان التدرج البديل (من الأعلى للأسفل) */
  fallback: [string, string, string];
};

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const SCENES: SceneConfig[] = [
  {
    id: 'hook',
    tag: 'الصين في 30 ثانية',
    title: 'هل تعرف\nالصين فعلًا؟',
    number: {value: 21196, unit: 'كم'},
    caption: 'طول سور الصين العظيم',
    image: u('photo-1508804185872-d7badad00f7d'), // سور الصين العظيم
    fallback: ['#3b1d0f', '#7a2a12', '#1a0c06'],
  },
  {
    id: 'shanghai',
    tag: 'شنغهاي',
    title: 'أكبر مدينة\nفي العالم',
    number: {value: 26, prefix: '+', unit: 'مليون نسمة'},
    image: u('photo-1474181487882-5abf3f0ba6c2'), // شنغهاي ليلًا
    fallback: ['#0b1b3a', '#4a1560', '#0a0a1a'],
  },
  {
    id: 'train',
    tag: 'القطار فائق السرعة',
    title: 'شبكة قطارات\nلا تُصدّق',
    number: {value: 350, unit: 'كم/س'},
    image: u('photo-1474487548417-781cb71495f3'), // قطار فائق السرعة
    fallback: ['#10222b', '#14586b', '#07121a'],
  },
  {
    id: 'guilin',
    tag: 'قويلين',
    title: 'جمال الطبيعة',
    highlight: 'مناظر كأنها لوحة',
    image: u('photo-1537531383496-f4749b8032cf'), // جبال قويلين
    fallback: ['#0f2a1e', '#2e6b4a', '#08150f'],
  },
  {
    id: 'factory',
    tag: 'الصناعة',
    title: 'مصنع العالم',
    number: {value: 30, prefix: '%', unit: 'من صناعة العالم'},
    image: u('photo-1494412574643-ff11b0a5c1c3'), // ميناء حاويات
    fallback: ['#2a1a0a', '#8a4a10', '#140a04'],
  },
];

export const OUTRO = {
  title: 'تابعنا لتعرف أكثر',
  /** صورة خلفية اختيارية للمشهد الأخير ('' = تدرج فقط) */
  image: '',
  fallback: ['#3b0a05', '#a31a08', '#120403'] as [string, string, string],
  /** الشعار: ضع ملفك في public/ وغيّر الاسم هنا */
  logo: 'logo.png',
  /** اسم الحساب يظهر تحت الشعار (اتركه فارغًا لإخفائه) */
  accountName: '',
  buttonText: 'متابعة',
};

export const AUDIO = {
  music: 'music.mp3',
  musicVolume: 0.8,
  whoosh: 'sfx/whoosh.wav',
  whooshVolume: 0.7,
  fadeInSeconds: 1,
  fadeOutSeconds: 2,
};

export const PARTICLES = {count: 26};
