import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnline } from '@/hooks/useOnline';
import { useToast } from '@/store/toast';
import { colors, fonts, radius, TAB_BAR } from '@/theme';
import { Button } from './Controls';
import { Icon } from './Icon';

/** Small "Offline" pill – shown in screen headers when there is no connection. */
export function OfflinePill() {
  const online = useOnline();
  if (online) return null;
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.offline}>
      <Icon name="cloud-offline-outline" size={14} color={colors.warn} />
      <Text style={styles.offlineText}>Offline</Text>
    </Animated.View>
  );
}

/** Toast shown above the tab bar; trigger with `toast('…')`. */
export function ToastHost() {
  const { message, tone, seq, hide } = useToast();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(30);
  const o = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    y.value = withSpring(0, { damping: 16, stiffness: 220 });
    o.value = withTiming(1, { duration: 160 });
    const t1 = setTimeout(() => {
      y.value = withTiming(24, { duration: 220 });
      o.value = withTiming(0, { duration: 220 });
    }, 2400);
    const t2 = setTimeout(hide, 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [seq]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  if (!message) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { bottom: TAB_BAR.height + TAB_BAR.margin + insets.bottom + 22 }, style]}>
      <Icon name={tone === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={18} color={tone === 'ok' ? colors.ok : colors.warn} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

type Tone = 'danger' | 'warn' | 'tip' | 'info';
const TONES: Record<Tone, { fg: string; bg: string; line: string; icon: string }> = {
  danger: { fg: '#FF7A70', bg: 'rgba(255,90,82,0.12)', line: 'rgba(255,90,82,0.38)', icon: 'warning' },
  warn: { fg: colors.warn, bg: 'rgba(255,162,62,0.12)', line: 'rgba(255,162,62,0.36)', icon: 'alert-circle' },
  tip: { fg: colors.gold, bg: colors.goldDim, line: colors.goldLine, icon: 'bulb' },
  info: { fg: colors.textDim, bg: 'rgba(246,242,221,0.06)', line: colors.line, icon: 'information-circle' },
};

export function Banner({ tone = 'info', title, children, icon }: { tone?: Tone; title?: string; children?: ReactNode; icon?: string }) {
  const t = TONES[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg, borderColor: t.line }]}>
      <Icon name={icon ?? t.icon} size={20} color={t.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <Text style={[styles.bannerTitle, { color: t.fg }]}>{title}</Text> : null}
        {typeof children === 'string' ? <Text style={styles.bannerText}>{children}</Text> : children}
      </View>
    </View>
  );
}

export function EmptyState({ icon, title, text, action, onAction, mci }: { icon: string; title: string; text?: string; action?: string; onAction?: () => void; mci?: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} mci={mci} size={34} color={colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={styles.emptyText}>{text}</Text> : null}
      {action ? <Button label={action} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  offline: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(255,162,62,0.14)', borderWidth: 1, borderColor: 'rgba(255,162,62,0.34)' },
  offlineText: { fontFamily: fonts.bold, fontSize: 12, color: colors.warn },
  toast: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: '#2A3410', borderWidth: 1, borderColor: colors.goldLine, maxWidth: '88%', zIndex: 50, elevation: 12 },
  toastText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flexShrink: 1 },
  banner: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1 },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 14.5 },
  bannerText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textDim },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.text, textAlign: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.textDim, textAlign: 'center' },
});
