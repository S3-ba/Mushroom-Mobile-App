// Design tokens. Palette taken from the author's Paint mockup (olive green + gold),
// deepened for a modern dark UI.
export const colors = {
  bg: '#141906',
  bgAlt: '#1C2208',
  surface: '#232B0D',
  surfaceHi: '#2E3911',
  olive: '#56640F',
  oliveSoft: '#7C8E24',
  gold: '#FFC60A',
  goldSoft: '#FFDC62',
  goldDim: 'rgba(255,198,10,0.14)',
  goldLine: 'rgba(255,198,10,0.34)',
  text: '#F6F2DD',
  textDim: 'rgba(246,242,221,0.74)',
  textMute: 'rgba(246,242,221,0.48)',
  line: 'rgba(246,242,221,0.10)',
  glass: 'rgba(20,25,6,0.64)',
  ink: '#1A2006',
  danger: '#FF5A52',
  ok: '#A6E36E',
  warn: '#FFA23E',
} as const;

export const fonts = {
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;

export const TAB_BAR = { height: 66, margin: 12, fab: 62 } as const;

/** Header User-Agent for Wikimedia requests (their API policy asks for a descriptive UA). */
export const WIKI_HEADERS = { 'User-Agent': 'Grzybobranie/1.0 (educational React Native project)' };
