import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Banner } from '@/components/ui/Feedback';
import { Button, ProgressBar } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme';
import { GUIDE, GUIDE_READ_MIN, type GuideBlock, type GuideSection } from './content';

export function GuideView({ onScroll }: { onScroll: any }) {
  const bottom = useBottomInset();
  return (
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: bottom, gap: 6 }}>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.intro}>
        <Text style={styles.introTitle}>Poradnik dla początkujących</Text>
        <Text style={styles.introText}>Wszystko, co warto wiedzieć przed pierwszą wyprawą — od ekwipunku po zasady bezpieczeństwa.</Text>
        <View style={styles.introMeta}>
          <Icon name="time-outline" size={14} color={colors.gold} />
          <Text style={styles.introMetaText}>ok. {GUIDE_READ_MIN} min czytania · działa offline</Text>
        </View>
      </Animated.View>
      {GUIDE.map((s, i) => (
        <SectionView key={s.id} section={s} index={i} />
      ))}
    </Animated.ScrollView>
  );
}

function SectionView({ section, index }: { section: GuideSection; index: number }) {
  return (
    <View style={{ gap: 14, marginTop: 22 }}>
      <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Icon name={section.icon} size={22} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionNum}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      </Animated.View>
      {section.blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </View>
  );
}

function Block({ block }: { block: GuideBlock }) {
  const router = useRouter();
  switch (block.t) {
    case 'p':
      return <Text style={styles.p}>{block.text}</Text>;
    case 'list':
      return (
        <View style={{ gap: 10 }}>
          {block.items.map((it) => (
            <View key={it} style={styles.li}>
              <View style={styles.bullet} />
              <Text style={[styles.p, { flex: 1 }]}>{it}</Text>
            </View>
          ))}
        </View>
      );
    case 'callout':
      return <Banner tone={block.tone} title={block.title}>{block.text}</Banner>;
    case 'checklist':
      return <Checklist items={block.items} />;
    case 'myths':
      return (
        <View style={{ gap: 10 }}>
          {block.items.map((m) => (
            <View key={m.myth} style={styles.myth}>
              <View style={styles.mythRow}>
                <Text style={[styles.tag, { color: colors.danger, backgroundColor: 'rgba(255,90,82,0.14)' }]}>MIT</Text>
                <Text style={[styles.p, { flex: 1, color: colors.text }]}>{m.myth}</Text>
              </View>
              <View style={styles.mythRow}>
                <Text style={[styles.tag, { color: colors.ok, backgroundColor: 'rgba(166,227,110,0.14)' }]}>FAKT</Text>
                <Text style={[styles.p, { flex: 1 }]}>{m.fact}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    case 'cta':
      return <Button label={block.label} icon={block.icon} variant="secondary" onPress={() => router.navigate(block.target as never)} />;
  }
}

function Checklist({ items }: { items: { id: string; label: string }[] }) {
  const checked = useSettings((s) => s.checklist);
  const toggle = useSettings((s) => s.toggleCheck);
  const reset = useSettings((s) => s.resetChecklist);
  const done = items.filter((i) => checked[i.id]).length;
  return (
    <View style={styles.checklist}>
      <View style={{ gap: 8 }}>
        <Text style={styles.checkCount}>
          Spakowane: {done} / {items.length}
        </Text>
        <ProgressBar value={done / items.length} color={done === items.length ? colors.ok : colors.gold} />
      </View>
      {items.map((it) => (
        <CheckRow key={it.id} label={it.label} on={!!checked[it.id]} onPress={() => toggle(it.id)} />
      ))}
      {done > 0 ? <Button label="Wyczyść listę" variant="ghost" size="sm" onPress={reset} /> : null}
    </View>
  );
}

function CheckRow({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const s = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(on ? 1 : 0, { damping: 12, stiffness: 260 });
  }, [on, s]);
  const box = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + 0.16 * s.value }],
    backgroundColor: interpolateColor(s.value, [0, 1], ['rgba(246,242,221,0.06)', colors.gold]),
  }));
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label}>
      <Animated.View style={[styles.box, box]}>{on ? <Icon name="checkmark" size={16} color={colors.ink} /> : null}</Animated.View>
      <Text style={[styles.p, { flex: 1 }, on && { color: colors.textMute, textDecorationLine: 'line-through' }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 8, padding: 18, borderRadius: radius.xl, backgroundColor: colors.olive, borderWidth: 1, borderColor: colors.goldLine },
  introTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  introText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(246,242,221,0.85)' },
  introMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  introMetaText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.goldSoft },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sectionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  sectionNum: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.6, color: colors.gold },
  sectionTitle: { fontFamily: fonts.display, fontSize: 23, lineHeight: 28, color: colors.text },
  p: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: 23, color: colors.textDim },
  li: { flexDirection: 'row', gap: 12 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold, marginTop: 9 },
  myth: { gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  mythRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tag: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', marginTop: 2 },
  checklist: { gap: 6, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  checkCount: { fontFamily: fonts.bold, fontSize: 13, color: colors.textDim },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  box: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
});
