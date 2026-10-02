export type Contact = {icon: 'whatsapp' | 'mail' | 'globe' | 'instagram' | 'phone'; label?: string; value: string};

export type CtaContent = {
  headline: string;
  founder?: string;
  contacts: Contact[];
  legal: string;
};

export type ReelProps = {
  /** SFX on/off. Override from CLI: --props='{"sfx":false}' */
  sfx: boolean;
  /** Music on/off (also silently off when assets/music.mp3 is missing). */
  music: boolean;
  musicVolume: number;
  /** filled in automatically at render time */
  assets?: {music: boolean; swoosh: boolean; stamp: boolean};
};
