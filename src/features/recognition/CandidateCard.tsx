import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { EdibilityBadge } from '@/components/mushroom/EdibilityBadge';
import { MushroomPhoto } from '@/components/mushroom/MushroomPhoto';
import { Button, ProgressBar } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, radius } from '@/theme';
import { EDIBILITY, isDangerous } from '@/theme/edibility';
import { displayPercent, type Candidate } from './ranking';

interface Props {
  c: Candidate;
  rank: number;
  onOpen: () => void;
  onAdd: () => void;
}

export function CandidateCard({ c, rank, onOpen, onAdd }: Props) {
  const m = c.mushroom;
  const danger = isDangerous(m.edibility);
  const pct = displayPercent(c.p);
  return (
    <Animated.View layout={LinearTransition.springify().damping(20)} entering={FadeInDown.delay(rank * 70).duration(380)}>
      <PressableScale onPress={onOpen} style={[styles.card, danger && styles.danger, rank === 0 && styles.first]} accessibilityRole="button" accessibilityLabel={`${m.name}, dopasowanie ${pct} procent`}>
        <View style={styles.row}>
          <MushroomPhoto m={m} style={styles.thumb} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name} numberOfLines={1}>{m.name}</Text>
            <Text style={styles.latin} numberOfLines={1}>{m.latin}</Text>
            <EdibilityBadge value={m.edibility} size="sm" />
          </View>
          <View style={styles.pctBox}>
            <Text style={[styles.pct, rank === 0 && { color: colors.gold }]}>{pct}%</Text>
            <Text style={styles.pctLabel}>dopasowanie</Text>
          </View>
        </View>
        <ProgressBar value={pct / 100} color={danger ? EDIBILITY[m.edibility].fg : colors.gold} />
        <View style={styles.foot}>
          <Text style={styles.reasons} numberOfLines={2}>
            {c.reasons.length ? `Pasuje: ${c.reasons.join(' · ')}` : 'Brak potwierdzonych cech — dodaj je poniżej'}
          </Text>
          {danger ? (
            <View style={styles.noPick}>
              <Icon name="hand-left" size={13} color={colors.danger} />
              <Text style={styles.noPickText}>Nie zbieraj</Text>
            </View>
          ) : (
            <Button label="Zbiory" icon="add" size="sm" variant="secondary" onPress={onAdd} />
          )}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  first: { borderColor: colors.goldLine, backgroundColor: 'rgba(255,198,10,0.06)' },
  danger: { borderColor: 'rgba(255,90,82,0.45)', backgroundColor: 'rgba(255,90,82,0.08)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 62, height: 62, borderRadius: 16 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  latin: { fontFamily: fonts.body, fontSize: 12.5, fontStyle: 'italic', color: colors.textMute },
  pctBox: { alignItems: 'flex-end' },
  pct: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  pctLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMute, marginTop: -3 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reasons: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: colors.textDim },
  noPick: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 32, borderRadius: radius.pill, backgroundColor: 'rgba(255,90,82,0.14)' },
  noPickText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.danger },
});
