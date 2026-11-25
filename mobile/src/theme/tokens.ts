// Design tokens from the spec's design system (user_flow.md §3):
// Inter only · lowercase voice · one primary action per screen
// radii 999 pills / 40 frames / 18–20 cards / 12 thumbnails · dark #14121B canvas.
export const colors = {
  canvas: '#14121B',
  card: '#1D1A28',
  cardAlt: '#252134',
  border: '#2E2942',
  text: '#F4F2FB',
  muted: '#AFA7C6',
  primary: '#7C5CFF',
  primarySoft: 'rgba(124, 92, 255, 0.18)',
  onPrimary: '#FFFFFF',
  danger: '#FF6B6B',
} as const;

export const radius = { pill: 999, frame: 40, card: 20, thumb: 12 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const font = 'Inter';

export const type = {
  hero: { fontFamily: font, fontWeight: '700', fontSize: 34, color: colors.text },
  title: { fontFamily: font, fontWeight: '600', fontSize: 24, color: colors.text },
  body: { fontFamily: font, fontWeight: '400', fontSize: 16, color: colors.text },
  meta: { fontFamily: font, fontWeight: '500', fontSize: 13, color: colors.muted },
  micro: { fontFamily: font, fontWeight: '500', fontSize: 11, color: colors.muted },
} as const;
