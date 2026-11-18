import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors, fonts, radius } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/* ───────────────────────── Button ───────────────────────── */

interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, icon, variant = 'primary', size = 'md', disabled, loading, style }: ButtonProps) {
  const bg = variant === 'primary' ? colors.gold : variant === 'secondary' ? colors.surfaceHi : variant === 'danger' ? 'rgba(255,90,82,0.16)' : 'transparent';
  const fg = variant === 'primary' ? colors.ink : variant === 'danger' ? colors.danger : colors.text;
  const border = variant === 'primary' ? 'transparent' : variant === 'danger' ? 'rgba(255,90,82,0.4)' : colors.line;
  return (
    <PressableScale
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.btn, size === 'sm' && styles.btnSm, size === 'lg' && styles.btnLg, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={fg} /> : null}
          <Text style={[styles.btnLabel, { color: fg }, size === 'sm' && { fontSize: 13 }]}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

/* ───────────────────────── Chip ───────────────────────── */

export function Chip({ label, active, onPress, icon, style }: { label: string; active?: boolean; onPress?: () => void; icon?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && styles.chipOn, style]}
    >
      {icon ? <Icon name={icon} size={14} color={active ? colors.ink : colors.textDim} /> : null}
      <Text style={[styles.chipText, active && { color: colors.ink, fontFamily: fonts.bold }]}>{label}</Text>
    </PressableScale>
  );
}

/* ───────────────────────── IconButton ───────────────────────── */

export function IconButton({ icon, onPress, size = 42, tone = 'glass', mci, label }: { icon: string; onPress?: () => void; size?: number; tone?: 'glass' | 'gold'; mci?: boolean; label?: string }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={[styles.iconBtn, { width: size, height: size, borderRadius: size / 2 }, tone === 'gold' && { backgroundColor: colors.gold, borderColor: 'transparent' }]}
    >
      <Icon name={icon} mci={mci} size={size * 0.5} color={tone === 'gold' ? colors.ink : colors.text} />
    </PressableScale>
  );
}

/* ───────────────────────── SegmentedControl ───────────────────────── */

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { key: T; label: string; icon?: string }[]; value: T; onChange: (k: T) => void }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useSharedValue(0);
  const segW = w > 0 ? (w - 8) / options.length : 0;
  useEffect(() => {
    x.value = withSpring(idx * segW, { damping: 20, stiffness: 240 });
  }, [idx, segW, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={styles.seg} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {segW > 0 && <Animated.View style={[styles.segPill, { width: segW }, pill]} />}
      {options.map((o) => {
        const on = o.key === value;
        return (
          <PressableScale key={o.key} onPress={() => onChange(o.key)} scaleTo={0.97} style={styles.segItem} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            {o.icon ? <Icon name={o.icon} size={16} color={on ? colors.ink : colors.textDim} /> : null}
            <Text style={[styles.segText, on && { color: colors.ink }]}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ───────────────────────── ProgressBar ───────────────────────── */

export function ProgressBar({ value, color = colors.gold, height = 6 }: { value: number; color?: string; height?: number }) {
  const [w, setW] = useState(0);
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 420 });
  }, [value, p]);
  const fill = useAnimatedStyle(() => ({ width: p.value * w }));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}

/* ───────────────────────── Card / Section ───────────────────────── */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.secRow}>
      <Text style={styles.sec}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, height: 48, borderRadius: radius.pill, borderWidth: 1 },
  btnSm: { height: 38, paddingHorizontal: 14 },
  btnLg: { height: 56 },
  btnLabel: { fontFamily: fonts.bold, fontSize: 15 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.06)', borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.textDim },
  iconBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line },
  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.07)', borderWidth: 1, borderColor: colors.line },
  segPill: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: radius.pill, backgroundColor: colors.gold },
  segItem: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  segText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textDim },
  track: { width: '100%', backgroundColor: 'rgba(246,242,221,0.10)', overflow: 'hidden' },
  card: { backgroundColor: 'rgba(246,242,221,0.05)', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16 },
  secRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sec: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.text },
});
