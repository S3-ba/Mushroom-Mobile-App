import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MushroomCard } from '@/components/mushroom/MushroomCard';
import { Chip } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Feedback';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenHeader } from '@/components/ui/Screen';
import { MUSHROOMS } from '@/data/mushrooms';
import { HABITAT_LABEL, UNDER_LABEL, type Habitat, type Underside } from '@/data/types';
import { advancedCount, applyFilters, DEFAULT_FILTERS, isFiltered, type AtlasFilters } from '@/features/atlas/filters';
import { OfflinePackCard } from '@/features/atlas/OfflinePack';
import { useBottomInset } from '@/hooks/useBottomInset';
import { colors, fonts, radius } from '@/theme';
import { EDIBILITY_ORDER } from '@/theme/edibility';
import type { Edibility } from '@/data/types';

const EDIBILITY_SHORT: Record<Edibility, string> = { edible: 'Jadalne', conditional: 'Warunkowo', inedible: 'Niejadalne', poisonous: 'Trujące', deadly: 'Śmiertelne' };
const UNDERS: Underside[] = ['pores', 'gills', 'folds', 'none'];
const HABITATS: Habitat[] = ['conifer', 'deciduous', 'mixed', 'meadow', 'wood'];

export default function AtlasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ season?: string }>();
  const insets = useSafeAreaInsets();
  const bottom = useBottomInset();
  const { width } = useWindowDimensions();
  const [filters, setFilters] = useState<AtlasFilters>(DEFAULT_FILTERS);
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    if (params.season === '1') setFilters((f) => ({ ...f, season: true }));
  }, [params.season]);

  const set = <K extends keyof AtlasFilters>(k: K, v: AtlasFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const list = useMemo(() => applyFilters(MUSHROOMS, filters), [filters]);
  const cardW = (width - 40 - 12) / 2;
  const adv = advancedCount(filters);

  const header = (
    <View style={{ gap: 14, marginBottom: 6 }}>
      <ScreenHeader title="Atlas grzybów" subtitle={`${MUSHROOMS.length} gatunków · działa offline`} />

      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.textMute} />
          <TextInput
            value={filters.query}
            onChangeText={(t) => set('query', t)}
            placeholder="Szukaj: borowik, kurka, Amanita…"
            placeholderTextColor={colors.textMute}
            selectionColor={colors.gold}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="search"
          />
          {filters.query ? (
            <PressableScale onPress={() => set('query', '')} haptic={false} accessibilityLabel="Wyczyść wyszukiwanie">
              <Icon name="close-circle" size={18} color={colors.textMute} />
            </PressableScale>
          ) : null}
        </View>
        <PressableScale onPress={() => setPanel((p) => !p)} style={[styles.filterBtn, (panel || adv > 0) && styles.filterBtnOn]} accessibilityRole="button" accessibilityLabel="Filtry cech">
          <Icon name="options" size={20} color={panel || adv > 0 ? colors.ink : colors.text} />
          {adv > 0 ? (
            <View style={styles.dot}>
              <Text style={styles.dotText}>{adv}</Text>
            </View>
          ) : null}
        </PressableScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }} contentInset={{ left: 20, right: 20 }}>
        <View style={{ width: 12 }} />
        <Chip label="Wszystkie" active={filters.edibility === 'all'} onPress={() => set('edibility', 'all')} />
        {EDIBILITY_ORDER.map((e) => (
          <Chip key={e} label={EDIBILITY_SHORT[e]} active={filters.edibility === e} onPress={() => set('edibility', filters.edibility === e ? 'all' : e)} />
        ))}
        <View style={{ width: 12 }} />
      </ScrollView>

      {panel ? (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.panel}>
          <Text style={styles.group}>Spód kapelusza</Text>
          <View style={styles.wrap}>
            {UNDERS.map((u) => (
              <Chip key={u} label={UNDER_LABEL[u]} active={filters.under === u} onPress={() => set('under', filters.under === u ? 'all' : u)} />
            ))}
          </View>
          <Text style={styles.group}>Siedlisko</Text>
          <View style={styles.wrap}>
            {HABITATS.map((h) => (
              <Chip key={h} label={HABITAT_LABEL[h]} active={filters.habitat === h} onPress={() => set('habitat', filters.habitat === h ? 'all' : h)} />
            ))}
          </View>
          <Text style={styles.group}>Dodatkowo</Text>
          <View style={styles.wrap}>
            <Chip label="Teraz w sezonie" icon="leaf" active={filters.season} onPress={() => set('season', !filters.season)} />
            <Chip label="Łatwe do rozpoznania" icon="happy-outline" active={filters.easy} onPress={() => set('easy', !filters.easy)} />
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.countRow}>
        <Text style={styles.count}>
          {list.length} z {MUSHROOMS.length} gatunków
        </Text>
        {isFiltered(filters) ? (
          <PressableScale onPress={() => setFilters(DEFAULT_FILTERS)} haptic={false}>
            <Text style={styles.clear}>Wyczyść filtry</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.FlatList
        data={list}
        keyExtractor={(m) => m.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={LinearTransition}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: bottom, paddingHorizontal: 20, gap: 12 }}
        ListHeaderComponent={header}
        ListFooterComponent={<View style={{ marginTop: 8 }}><OfflinePackCard /></View>}
        ListEmptyComponent={<EmptyState icon="search" title="Brak wyników" text="Zmień kryteria wyszukiwania lub wyczyść filtry." action="Wyczyść filtry" onAction={() => setFilters(DEFAULT_FILTERS)} />}
        renderItem={({ item, index }) => <MushroomCard m={item} index={index} width={cardW} onPress={() => router.push({ pathname: '/atlas/[id]', params: { id: item.id } })} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 10 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.07)', borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text, padding: 0 },
  filterBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(246,242,221,0.07)', borderWidth: 1, borderColor: colors.line },
  filterBtnOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  dot: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },
  panel: { gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  group: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase', marginTop: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMute },
  clear: { fontFamily: fonts.bold, fontSize: 13, color: colors.gold },
});
