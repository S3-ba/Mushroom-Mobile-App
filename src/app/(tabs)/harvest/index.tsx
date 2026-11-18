import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MushroomPhoto } from '@/components/mushroom/MushroomPhoto';
import { Button, Card, IconButton, SectionTitle } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Feedback';
import { Icon } from '@/components/ui/Icon';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { getMushroom } from '@/data/mushrooms';
import { groupByDay, lastDays } from '@/features/harvest-stats';
import { WeekChart } from '@/features/WeekChart';
import { useHarvest, type HarvestEntry } from '@/store/harvest';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';
import { dayKey, dayLabel, plural } from '@/utils/format';

const fmtKg = (kg: number) => `${kg.toFixed(kg < 10 ? 2 : 1).replace('.', ',')} kg`;

export default function HarvestScreen() {
  const router = useRouter();
  const entries = useHarvest((s) => s.entries);
  const remove = useHarvest((s) => s.remove);
  const days = useMemo(() => groupByDay(entries), [entries]);
  const week = useMemo(() => lastDays(entries), [entries]);
  const today = days.find((d) => d.key === dayKey(Date.now()));
  const total = entries.reduce((s, e) => s + e.count, 0);
  const speciesCount = new Set(entries.map((e) => e.speciesId)).size;

  return (
    <Screen>
      <ScreenHeader title="Moje zbiory" subtitle="Dziennik wypraw" right={<IconButton icon="add" tone="gold" label="Dodaj zbiór" onPress={() => router.push('/harvest/add')} />} />

      {entries.length === 0 ? (
        <EmptyState
          icon="basket-outline"
          title="Jeszcze pusto w koszu"
          text="Dodaj pierwszy zbiór — ze zdjęciem, miejscem i liczbą sztuk. Aplikacja zrobi podsumowanie dnia i pokaże statystyki."
          action="Dodaj pierwszy zbiór"
          onAction={() => router.push('/harvest/add')}
        />
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.today}>
            <Text style={styles.kicker}>PODSUMOWANIE DNIA</Text>
            {today ? (
              <>
                <Text style={styles.big}>
                  {today.count} <Text style={styles.bigUnit}>{plural(today.count, 'grzyb', 'grzyby', 'grzybów')}</Text>
                </Text>
                <Text style={styles.todaySub}>
                  {today.species.length} {plural(today.species.length, 'gatunek', 'gatunki', 'gatunków')}
                  {today.weight > 0 ? ` · ${fmtKg(today.weight)}` : ''}
                </Text>
                <View style={styles.chips}>
                  {today.species.map((s) => (
                    <View key={s.id} style={styles.chip}>
                      <Text style={styles.chipCount}>{s.count}×</Text>
                      <Text style={styles.chipName}>{getMushroom(s.id)?.name ?? s.id}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.todaySub}>Dziś jeszcze nic nie zebrano. Powodzenia w lesie!</Text>
            )}
          </Animated.View>

          <View style={styles.statRow}>
            <Stat icon="basket" label="Razem" value={String(total)} />
            <Stat icon="mushroom" mci label="Gatunków" value={String(speciesCount)} />
            <Stat icon="calendar" label="Wypraw" value={String(days.length)} />
          </View>

          <SectionTitle>Ostatnie 7 dni</SectionTitle>
          <Card>
            <WeekChart data={week} />
          </Card>

          {days.map((d) => (
            <View key={d.key}>
              <SectionTitle right={<Text style={styles.dayMeta}>{d.count} szt.{d.weight > 0 ? ` · ${fmtKg(d.weight)}` : ''}</Text>}>{dayLabel(d.ts)}</SectionTitle>
              <View style={{ gap: 10 }}>
                {d.entries.map((e, i) => (
                  <EntryRow key={e.id} e={e} index={i} onRemove={() => { remove(e.id); toast('Usunięto wpis'); }} onOpen={() => router.navigate({ pathname: '/atlas/[id]', params: { id: e.speciesId } })} />
                ))}
              </View>
            </View>
          ))}
          <View style={{ marginTop: 24 }}>
            <Button label="Dodaj zbiór" icon="add-circle" onPress={() => router.push('/harvest/add')} />
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({ icon, label, value, mci }: { icon: string; label: string; value: string; mci?: boolean }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} mci={mci} size={18} color={colors.gold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EntryRow({ e, index, onRemove, onOpen }: { e: HarvestEntry; index: number; onRemove: () => void; onOpen: () => void }) {
  const m = getMushroom(e.speciesId);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(360)} style={styles.entry}>
      <View style={styles.thumb}>
        {e.photoUri ? <Image source={{ uri: e.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : m ? <MushroomPhoto m={m} style={StyleSheet.absoluteFill} /> : null}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.entryName} numberOfLines={1} onPress={onOpen}>{m?.name ?? 'Nieznany gatunek'}</Text>
        <Text style={styles.entryMeta}>
          {e.count} {plural(e.count, 'sztuka', 'sztuki', 'sztuk')}
          {e.weightKg ? ` · ${fmtKg(e.weightKg)}` : ''}
          {e.lat !== undefined ? ' · 📍' : ''}
        </Text>
        {e.note ? <Text style={styles.entryNote} numberOfLines={2}>{e.note}</Text> : null}
      </View>
      <IconButton icon="trash-outline" size={38} label="Usuń wpis" onPress={onRemove} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  today: { gap: 6, padding: 20, borderRadius: radius.xl, backgroundColor: colors.olive, borderWidth: 1, borderColor: colors.goldLine },
  kicker: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.6, color: colors.goldSoft },
  big: { fontFamily: fonts.display, fontSize: 52, lineHeight: 58, color: colors.text },
  bigUnit: { fontSize: 22, fontFamily: fonts.displaySemi, color: colors.goldSoft },
  todaySub: { fontFamily: fonts.medium, fontSize: 15, color: 'rgba(246,242,221,0.85)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, height: 28, alignItems: 'center', borderRadius: radius.pill, backgroundColor: 'rgba(20,25,6,0.35)' },
  chipCount: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.gold },
  chipName: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMute },
  dayMeta: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMute },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  thumb: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  entryName: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text },
  entryMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.textDim },
  entryNote: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMute },
});
