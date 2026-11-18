import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SegmentedControl } from '@/components/ui/Controls';
import { ScreenHeader } from '@/components/ui/Screen';
import { GuideView } from '@/features/guide/GuideView';
import { QuizView } from '@/features/quiz/QuizView';
import { colors } from '@/theme';

type Tab = 'guide' | 'quiz';

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>('guide');

  useEffect(() => {
    if (params.tab === 'quiz' || params.tab === 'guide') setTab(params.tab);
  }, [params.tab]);

  // reading progress of the guide (thin bar under the tabs)
  const progress = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    const max = e.contentSize.height - e.layoutMeasurement.height;
    progress.value = max > 0 ? Math.min(1, Math.max(0, e.contentOffset.y / max)) : 0;
  });
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.bgAlt, colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, gap: 4 }}>
        <ScreenHeader title="Nauka" subtitle={tab === 'guide' ? 'Poradnik grzybiarza' : 'Quiz wiedzy'} />
        <SegmentedControl
          options={[
            { key: 'guide' as const, label: 'Poradnik', icon: 'book' },
            { key: 'quiz' as const, label: 'Quiz', icon: 'trophy' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <View style={styles.track}>
        {tab === 'guide' ? <Animated.View style={[styles.fill, barStyle]} /> : null}
      </View>
      {tab === 'guide' ? <GuideView onScroll={onScroll} /> : <QuizView />}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 3, marginTop: 12, marginHorizontal: 20, borderRadius: 2, backgroundColor: 'rgba(246,242,221,0.08)', overflow: 'hidden' },
  fill: { height: 3, backgroundColor: colors.gold },
});
