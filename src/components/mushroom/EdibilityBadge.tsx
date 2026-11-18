import { StyleSheet, Text, View } from 'react-native';
import type { Edibility } from '@/data/types';
import { EDIBILITY } from '@/theme/edibility';
import { fonts, radius } from '@/theme';
import { Icon } from '../ui/Icon';

export function EdibilityBadge({ value, size = 'md' }: { value: Edibility; size?: 'sm' | 'md' }) {
  const m = EDIBILITY[value];
  const sm = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }, sm && styles.sm]}>
      <Icon name={m.icon} size={sm ? 12 : 15} color={m.fg} />
      <Text style={[styles.text, { color: m.fg }, sm && { fontSize: 11 }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, height: 28, borderRadius: radius.pill },
  sm: { height: 22, paddingHorizontal: 8, gap: 4 },
  text: { fontFamily: fonts.bold, fontSize: 12.5 },
});
