import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '@/hooks/useKeyboard';
import { colors, fonts, TAB_BAR } from '@/theme';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';

interface Item {
  key: string;
  href: string;
  label: string;
  icon: string;
  iconOn: string;
  mci?: boolean;
  fab?: boolean;
}

// Six slots fit comfortably on every phone: recognition is the raised centre action,
// the quiz lives next to the guide ("Nauka"), and the Home menu is reachable from the logo / Back.
const ITEMS: Item[] = [
  { key: 'learn', href: '/learn', label: 'Nauka', icon: 'book-outline', iconOn: 'book' },
  { key: 'atlas', href: '/atlas', label: 'Atlas', icon: 'mushroom-outline', iconOn: 'mushroom', mci: true },
  { key: 'recognize', href: '/recognize', label: 'Rozpoznaj', icon: 'camera', iconOn: 'camera', fab: true },
  { key: 'map', href: '/map', label: 'Mapa', icon: 'map-outline', iconOn: 'map' },
  { key: 'harvest', href: '/harvest', label: 'Zbiory', icon: 'basket-outline', iconOn: 'basket' },
  { key: 'forum', href: '/forum', label: 'Forum', icon: 'chatbubbles-outline', iconOn: 'chatbubbles' },
];

/**
 * Persistent floating navigation bar. It is rendered by the tabs layout above every screen
 * (including nested detail screens), derives the active tab from the URL and navigates with the router.
 */
export function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyboard = useKeyboardVisible();

  const barW = width - TAB_BAR.margin * 2;
  const slotW = barW / ITEMS.length;

  const seg = pathname.split('/').filter(Boolean)[0] ?? '';
  const currentIdx = ITEMS.findIndex((i) => i.key === seg);
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => setPending(null), [pathname]);
  const activeIdx = pending ?? currentIdx;
  const pillVisible = activeIdx >= 0 && !ITEMS[activeIdx].fab;

  const x = useSharedValue(Math.max(0, activeIdx) * slotW);
  const pill = useSharedValue(pillVisible ? 1 : 0);
  const hide = useSharedValue(0);
  useEffect(() => {
    if (activeIdx >= 0) x.value = withSpring(activeIdx * slotW, { damping: 18, stiffness: 230 });
    pill.value = withTiming(pillVisible ? 1 : 0, { duration: 200 });
  }, [activeIdx, slotW, pillVisible, x, pill]);
  useEffect(() => {
    hide.value = withTiming(keyboard ? 1 : 0, { duration: 180 });
  }, [keyboard, hide]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: pill.value, transform: [{ translateX: x.value }, { scale: 0.9 + 0.1 * pill.value }] }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hide.value * 160 }] }));

  return (
    <Animated.View style={[styles.bar, { left: TAB_BAR.margin, right: TAB_BAR.margin, bottom: TAB_BAR.margin + insets.bottom }, barStyle]} pointerEvents={keyboard ? 'none' : 'box-none'}>
      <Animated.View style={[styles.pill, { width: slotW - 10, left: 5 }, pillStyle]} />
      {ITEMS.map((item, idx) => {
        const active = idx === activeIdx;
        const press = () => {
          setPending(idx);
          router.navigate(item.href as never);
        };
        return item.fab ? <Fab key={item.key} item={item} active={active} width={slotW} onPress={press} /> : <TabButton key={item.key} item={item} active={active} width={slotW} onPress={press} />;
      })}
    </Animated.View>
  );
}

function TabButton({ item, active, width, onPress }: { item: Item; active: boolean; width: number; onPress: () => void }) {
  const s = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(active ? 1 : 0, { damping: 13, stiffness: 260 });
  }, [active, s]);
  const icon = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.14 * s.value }, { translateY: -1.5 * s.value }] }));
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} style={[styles.slot, { width }]} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }}>
      <Animated.View style={icon}>
        <Icon name={active ? item.iconOn : item.icon} mci={item.mci} size={22} color={active ? colors.gold : colors.textMute} />
      </Animated.View>
      <Text style={[styles.label, active && styles.labelOn]} numberOfLines={1}>{item.label}</Text>
    </PressableScale>
  );
}

function Fab({ item, active, width, onPress }: { item: Item; active: boolean; width: number; onPress: () => void }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.32 * (1 - pulse.value), transform: [{ scale: 1 + 0.5 * pulse.value }] }));
  return (
    <View style={[styles.slot, { width }]} pointerEvents="box-none">
      <PressableScale onPress={onPress} scaleTo={0.92} style={[styles.fabWrap, { left: (width - TAB_BAR.fab) / 2 }]} accessibilityRole="tab" accessibilityLabel="Rozpoznaj grzyba" accessibilityState={{ selected: active }}>
        <Animated.View style={[styles.fabRing, ring]} />
        <View style={[styles.fab, active && styles.fabOn]}>
          <Icon name={item.icon} size={28} color={colors.ink} />
        </View>
      </PressableScale>
      <Text style={[styles.label, styles.fabLabel, active && styles.labelOn]} numberOfLines={1}>{item.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: TAB_BAR.height,
    flexDirection: 'row',
    borderRadius: TAB_BAR.height / 2,
    backgroundColor: 'rgba(26,32,9,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(246,242,221,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  pill: { position: 'absolute', top: 8, height: TAB_BAR.height - 18, borderRadius: 24, backgroundColor: colors.goldDim, borderWidth: 1, borderColor: colors.goldLine },
  slot: { height: TAB_BAR.height, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textMute },
  labelOn: { color: colors.gold, fontFamily: fonts.bold },
  fabWrap: { position: 'absolute', top: -22, width: TAB_BAR.fab, height: TAB_BAR.fab },
  fabRing: { position: 'absolute', width: TAB_BAR.fab, height: TAB_BAR.fab, borderRadius: TAB_BAR.fab / 2, backgroundColor: colors.gold },
  fab: { width: TAB_BAR.fab, height: TAB_BAR.fab, borderRadius: TAB_BAR.fab / 2, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.bg, shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  fabOn: { backgroundColor: colors.goldSoft },
  fabLabel: { position: 'absolute', bottom: 7 },
});
