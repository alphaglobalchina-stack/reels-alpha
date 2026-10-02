/**
 * ALPHA — single theme file.
 * Change colors / fonts / safe zones here and every reel follows.
 */
export const theme = {
  colors: {
    gold: '#C9971C', // primary
    goldLight: '#F2D27A', // highlights / shimmer (derived from gold)
    goldDark: '#8F6A10', // shadows / gradients
    black: '#111111', // background
    deep: '#0A0A0A', // vignette / curtains
    white: '#FFFFFF',
    grey: '#8A8A8A', // crossed-out "problem" text
    // The original logo's "A" is black. On a black background it would vanish,
    // so it is drawn in this colour instead.
    logoDark: '#F4F1EA',
  },
  fonts: {
    arabic: "Cairo, 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
    latin: "Montserrat, 'Helvetica Neue', Arial, sans-serif",
    // Only used for the Chinese legal name in the CTA small print.
    cjk: "'Noto Sans SC', 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  video: {width: 1080, height: 1920, fps: 30},
  // Instagram UI overlaps these bands — keep text out of them.
  safe: {top: 250, bottom: 320},
  assets: {
    logo: 'logo.png',
    music: 'music.mp3',
    sfx: {swoosh: 'sfx/swoosh.wav', stamp: 'sfx/stamp.wav'},
  },
} as const;

export const goldGradient = `linear-gradient(135deg, ${theme.colors.goldDark} 0%, ${theme.colors.gold} 35%, ${theme.colors.goldLight} 52%, ${theme.colors.gold} 70%, ${theme.colors.goldDark} 100%)`;
