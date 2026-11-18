import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import type { Mushroom } from '@/data/types';
import { colors, fonts, radius } from '@/theme';
import { PressableScale } from '../ui/PressableScale';
import { EdibilityBadge } from './EdibilityBadge';
import { MushroomPhoto } from './MushroomPhoto';

export function MushroomCard({ m, index, width, onPress }: { m: Mushroom; index: number; width: number; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(380)} layout={LinearTransition.springify().damping(20)} style={{ width }}>
      <PressableScale onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={`${m.name}, ${m.latin}`}>
        <View>
          <MushroomPhoto m={m} style={styles.photo} />
          <View style={styles.badge}>
            <EdibilityBadge value={m.edibility} size="sm" />
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>{m.name}</Text>
          <Text style={styles.latin} numberOfLines={1}>{m.latin}</Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: 'rgba(246,242,221,0.06)', borderWidth: 1, borderColor: colors.line },
  photo: { height: 122 },
  badge: { position: 'absolute', left: 8, bottom: 8 },
  body: { padding: 12, gap: 2, minHeight: 66 },
  name: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.text },
  latin: { fontFamily: fonts.body, fontSize: 12.5, fontStyle: 'italic', color: colors.textMute },
});
