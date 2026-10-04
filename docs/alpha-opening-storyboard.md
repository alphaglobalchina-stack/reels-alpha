# ALPHA — Opening Brand Film · Storyboard

Composition `AlphaOpening` · 1080×1920 · 60 fps master (+30 fps review) · 50.4 s
(voice-over 47.39 s + 3.0 s CTA hold).

All times below come from `content/vo-timing.json` — CTC forced alignment of the
script against `assets/voiceover.mp3` (Meta Omnilingual-ASR 300M CTC emissions,
Viterbi alignment; transcript cross-checked with Whisper-turbo). Phrase edges
agree with the measured pauses in the audio to within ~50 ms. Every cue in the
code is looked up from that file by word, never typed in by hand.

## Asset audit

| Category | Kept (used) | Rejected / why |
|---|---|---|
| Guangzhou skyline / aerial | `film/gz_tower.mp4` (user clip, Canton Tower sunset orbit — motion-interpolated to 60 fps, slowed 1.55×) | `photos16/city.jpg`, `photos17/n7.jpg` — flat daylight stock look, weaker than the clip |
| Canton Fair / market | `film/fair_exterior.webp`, `film/fair_hall.webp`, `film/fair_booth.webp` (user photos) | — |
| Sourcing / meetings | `photos16/cmp.jpg` (sample / catalogue review) | `type.jpg`, `n3.jpg`, `fryer.jpg` — bright lifestyle, off-tone |
| Machinery / factories | `photos16/line.jpg`, `cnc.jpg`, `pack.jpg`, `photos17/n4.jpg` | `n0.jpg`, `still.jpg` — toy-like still life |
| Inspection / QC | `photos16/insp.jpg`, `photos17/n1.jpg` | — |
| Shipping / logistics | `photos16/ware.jpg` + **code-built** globe, routes, top-down container ship & wake | `plane.jpg` — paper-plane cliché |
| Brand | `logo.png` — official, unaltered (only cropped to its bounding box, shown on ivory so the black "A" stays black) | interiors `flat/show/man/n2/n5/n6` — unrelated to sourcing |

The Higgsfield library also holds a night port video, a top-down container ship
and factory/fair stills that would fit Scene 8; this session's network policy
blocks their CDN (`d8j0ntlcm91z4.cloudfront.net`), so Scene 8 is built in code.
Drop any of them into `assets/film/` to swap in.

## Story beats

| # | Time (s) | Spoken words (anchor) | Assets | Scene | Hand-off to next |
|---|---|---|---|---|---|
| 1 | 0.00 – 5.95 | **الصين** 0.12 · مليئة 0.60 · لكن الوصول 2.10 · **المُوَرِّد** 3.04 · **الصحيح** 3.52 · البداية 4.58 · فقط 5.14 | gz_tower.mp4 | Monumental "الصين" readable at frame 0 over the aerial. On "لكن" a 3-D field of supplier nodes rises over the city; "المورد" triggers a search sweep; on "الصحيح" every node dims except one gold target (lock-on ring, small red marker). | Camera dollies into the chosen node; its core becomes a portal. |
| 2 | 5.55 – 9.30 | من **قوانزو** 6.12 · في قلب الصين 6.84 · نعمل معك 7.96 · داخل **السوق** 9.34 | china-dots (Natural-Earth 50m) · fair_exterior | Inside the portal: dotted China on a tilted plane. Guangzhou pin drops on "قوانزو", coordinates type on, camera pushes toward it on "في قلب الصين", then dives. | The pin opens into the real Canton Fair entrance. |
| 3 | 8.90 – 10.60 | نعمل معك من داخل **السوق** نفسه | fair_exterior · fair_hall · fair_booth | Exterior → push through the doors → hall corridor with photo planes in depth. Labels INSIDE THE MARKET / CANTON FAIR · GUANGZHOU. | Camera pulls back; the hall plane becomes one card in a network. |
| 4 | 10.25 – 13.25 | **نبحث** 10.42 · الموردين 10.92 · والمصانع 11.68 · **المناسبة** 12.30 | factory / market crops as supplier cards | 3-D wall of supplier cards. SEARCH → VERIFY → COMPARE → SELECT light up on the words; scan, ticks, three forward, one turns gold "BEST FIT". | Fly into the gold card. |
| 5 | 12.90 – 18.40 | **نقارن** العروض 13.18 · ونتفاوض 14.36 · **الأسعار** 15.26 · **والمواصفات** 15.84 · بما يخدم احتياجك 16.76 | fair_booth (negotiation) | Negotiation photo in a glass card; three offers compared; PRICE / SPECIFICATIONS / TERMS cards land on their words, align and merge into RIGHT MATCH. | Camera pushes through the merged card. |
| 6 | 18.05 – 25.85 | نتابع 18.26 · **العيّنة** 19.34 · **الإنتاج** 20.14 · **فحص** 21.50 · قبل **الشحن** 22.62 · **مطابقتها** 24.00 | cmp · line · insp · cnc | Camera travels a gold process axis: SAMPLE → PRODUCTION → INSPECTION stations. Inspection: scan beam, measuring brackets, red markers → QUALITY CHECK → VERIFIED seal on "مطابقتها". | Whip-through along the axis into the tunnel. |
| 7 | 25.45 – 35.40 | **منتجات** 27.00 · **معدات** 27.78 · **مكائن** 28.62 · **خطوط إنتاج** 29.50 · نساعدك في **التوريد** 31.30 · **بخطوات واضحة** 33.06 | fair_hall crop · fair_booth crop · cnc · pack · n4 | Industrial tunnel of gold rings with photo panels; each category lands as a big chip on its word. Then the tunnel resolves into five clear steps (SOURCE · NEGOTIATE · PRODUCE · INSPECT · SHIP). | Step 05 SHIP ignites; its line extends into the route. |
| 8 | 35.00 – 38.62 | ثم نرتب **الشحن** 36.02 · من الصين · إلى **ميناء** 37.38 · وجهتك 37.80 | land-dots globe · code-built ship | Dark dotted globe, Guangzhou origin, gold route arcs out on "الشحن", destination pin on "ميناء". Camera follows the line down to sea level; it becomes a ship's wake. | Fade to the vacuum. |
| 9 | 38.31 – 42.40 | لا تبحث عن **مُوَرِّد** 39.37 فقط… · امتلك **شريكًا** 40.91 **داخل الصين** 41.47 | — (pure type) | Vacuum: music drops out. "مُوَرِّد" sits small in a thin box, then dims. Box breaks open and "شريكًا داخل الصين" lands huge in gold (impact, light leak, brief RGB split). YOUR TRADE PARTNER IN CHINA. | Every line, node and route from the film converges to centre. |
| 10 | 42.17 – 50.40 | **GUANGZHOU ALPHA GLOBAL TRADING CO., LTD** 42.52 · **شريكك التجاري من الصين** 45.45 | logo.png | Convergence flash opens into a warm ivory end card: official logo (with English + Chinese names), tagline, CTA "ابدأ رحلتك في التوريد من الصين / START YOUR SOURCING JOURNEY", alphaglobalcargo.com + contact row. Clean hold ≥ 3 s. | — |

## Rules held throughout

- Safe area: important text between y = 250 and y = 1600; subtitles sit in a glass panel at y ≈ 1440–1580.
- Subtitles are hidden where the same words are already the hero type (opening line, scenes 9–10).
- Palette: graphite/navy-black base, ALPHA gold (#C9971C family) accents, China red only on targeting/scan markers.
- Never split or letter-space Arabic; Latin labels may be tracked.
