export const C = {
  bg: '#0B1020',
  bgDeep: '#070B17',
  surface: '#141B33',
  surface2: '#1C2545',
  surface3: '#26315A',
  border: '#2A3560',
  text: '#EEF1FF',
  textMuted: '#9AA4C7',
  textDim: '#6B7499',
  primary: '#7C5CFF',
  primaryDark: '#5B3FE0',
  cyan: '#00D4FF',
  success: '#2BD576',
  successDark: '#1B9E55',
  successBg: '#0F2E22',
  danger: '#FF5A6E',
  dangerDark: '#C8364B',
  dangerBg: '#36141C',
  gold: '#FFC83D',
  goldDark: '#D19A12',
  fire: '#FF9F1C',
  gem: '#4FC3F7',
  heart: '#FF4B6E',
  white: '#FFFFFF',
  plotGrid: '#1F2850',
  plotAxis: '#5A6694',
  // plot palette
  p1: '#7C5CFF',
  p2: '#00D4FF',
  p3: '#FF9F1C',
  p4: '#2BD576',
  p5: '#FF5A9E',
  p6: '#FFC83D',
};

export const F = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const R = { sm: 8, md: 14, lg: 20, xl: 28 };

export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amt));
  const g = clamp(((n >> 8) & 255) * (1 + amt));
  const b = clamp((n & 255) * (1 + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
