// QA: every on-screen string must match the brief character-for-character.
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const {TEXT} = await import(path.join(here, '../src/data.ts'));

const brief = {
  companyAr: 'سقطرى للسياحة والسفر',
  companyEn: 'Socotra Travel & Tours',
  title: 'ماليزيا',
  duration: '7 أيام | 6 ليال',
  tripType: 'برنامج خاص لشخصين',
  cities: ['كوالالمبور', 'لنكاوي', 'سيلانجور'],
  features: ['فنادق 4 نجوم', 'إفطار يومي', 'طيران داخلي', 'سيارة وسائق خاص', 'استقبال VIP', 'شريحة اتصال وإنترنت', 'جولات سياحية'],
  price: '5,950 ريال سعودي',
  cta: 'احجز الآن',
  contacts: 'واتساب +60126003060 | www.socotrago.com | info@socotrago.com | إنستغرام socotravelgo',
};
const got = {
  companyAr: TEXT.companyAr,
  companyEn: TEXT.companyEn,
  title: TEXT.title,
  duration: `${TEXT.duration.days} ${TEXT.duration.daysWord} | ${TEXT.duration.nights} ${TEXT.duration.nightsWord}`,
  tripType: TEXT.tripType,
  cities: [...TEXT.cities],
  features: [...TEXT.features],
  price: `${TEXT.price.display} ${TEXT.price.currency}`,
  cta: TEXT.cta,
  contacts: TEXT.contacts.map((c) => (c.label ? `${c.label} ${c.value}` : c.value)).join(' | '),
};
let ok = true;
for (const k of Object.keys(brief)) {
  const a = JSON.stringify(brief[k]);
  const b = JSON.stringify(got[k]);
  const pass = a === b;
  ok &&= pass;
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${k}${pass ? '' : `\n     brief: ${a}\n     data : ${b}`}`);
}
const soq = [...TEXT.companyAr.split(' ')[0]].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
const maqsura = TEXT.companyAr.split(' ')[0].endsWith('ى');
console.log(`سقطرى code points: ${soq.join(' ')} → ends with alef maqsura U+0649: ${maqsura ? 'yes' : 'NO'}`);
console.log(`price value ${TEXT.price.value} formats as ${TEXT.price.value.toLocaleString('en-US')} (display "${TEXT.price.display}")`);
if (!ok || !maqsura || TEXT.price.value.toLocaleString('en-US') !== TEXT.price.display) process.exit(1);
