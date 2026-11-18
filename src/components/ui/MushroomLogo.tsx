import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

export function MushroomLogo({ size = 28, cap = colors.gold, stem = colors.text, spots = colors.olive }: { size?: number; cap?: string; stem?: string; spots?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M24 38h16l-2 14c-.4 3-2 5-6 5s-5.6-2-6-5l-2-14Z" fill={stem} />
      <Path d="M6 36C6 18 18 7 32 7s26 11 26 29c0 3-3 4-6 4H12c-3 0-6-1-6-4Z" fill={cap} />
      <Circle cx="20" cy="25" r="4.5" fill={spots} opacity={0.9} />
      <Circle cx="34" cy="16" r="3.4" fill={spots} opacity={0.9} />
      <Circle cx="44" cy="28" r="4.2" fill={spots} opacity={0.9} />
    </Svg>
  );
}
