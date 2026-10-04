export const C = {
  ink: '#07080A', // base black
  graphite: '#121417',
  navy: '#0A0F1A', // deep navy-black
  ivory: '#F6F1E7',
  ivory2: '#EDE5D5',
  white: '#FFFFFF',
  mist: 'rgba(255,255,255,0.62)',
  gold: '#C9971C',
  goldLight: '#F0D38A',
  goldPale: '#E9CF8F',
  goldDark: '#7C5B0E',
  red: '#E8402F', // sparing: targets / scan markers only
};

export const FONT = {
  ar: "Cairo, 'Noto Sans Arabic', sans-serif",
  la: "Montserrat, 'Helvetica Neue', Arial, sans-serif",
};

/** Restrained metallic gold — mostly mid-gold, a narrow pale highlight. */
export const goldText = (shift = 0) => ({
  backgroundImage: `linear-gradient(100deg, #8A6512 0%, #C9971C 22%, #E2BC5E 38%, #F6E2A6 ${46 + shift * 0}%, #D9AE45 54%, #B7871A 72%, #8A6512 100%)`,
  backgroundSize: '220% 100%',
  backgroundPosition: `${100 - shift * 100}% 0`,
  WebkitBackgroundClip: 'text' as const,
  backgroundClip: 'text' as const,
  color: 'transparent',
});

export const IMG = {
  tower: 'film/gz_tower.mp4',
  fairExt: 'film/fair_exterior.webp',
  fairHall: 'film/fair_hall.webp',
  fairBooth: 'film/fair_booth.webp',
  logo: 'film/logo_official_crop.png',
  cmp: 'photos16/cmp.jpg',
  line: 'photos16/line.jpg',
  insp: 'photos16/insp.jpg',
  cnc: 'photos16/cnc.jpg',
  pack: 'photos16/pack.jpg',
  ware: 'photos16/ware.jpg',
  factory: 'photos17/n4.jpg',
  inspWare: 'photos17/n1.jpg',
};
