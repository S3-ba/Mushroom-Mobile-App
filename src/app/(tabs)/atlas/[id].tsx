import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdibilityBadge } from '@/components/mushroom/EdibilityBadge';
import { Mushroom3D } from '@/components/mushroom/Mushroom3D';
import { MushroomPhoto } from '@/components/mushroom/MushroomPhoto';
import { SeasonBar } from '@/components/mushroom/SeasonBar';
import { Button, Chip, IconButton, SectionTitle } from '@/components/ui/Controls';
import { Banner, EmptyState } from '@/components/ui/Feedback';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { getMushroom } from '@/data/mushrooms';
import { DIFFICULTY_LABEL, HABITAT_LABEL, UNDER_LABEL } from '@/data/types';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useSpeciesMedia } from '@/hooks/useSpeciesMedia';
import { colors, fonts, radius } from '@/theme';
import { isDangerous } from '@/theme/edibility';
import { monthName } from '@/utils/format';

const HERO = 330;

function Trait({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.trait}>
      <Text style={styles.traitLabel}>{label}</Text>
      <Text style={styles.traitText}>{text}</Text>
    </View>
  );
}

export default function AtlasDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = getMushroom(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = useBottomInset();
  const media = useSpeciesMedia(m?.wiki);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, HERO], [-80, 0, HERO * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-200, 0], [1.5, 1], Extrapolation.CLAMP) },
    ],
  }));

  if (!m) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" title="Nie znaleziono gatunku" action="Wróć do atlasu" onAction={() => router.replace('/atlas')} />
      </Screen>
    );
  }

  const month = new Date().getMonth() + 1;
  const inSeasonNow = m.months.includes(month);
  const danger = isDangerous(m.edibility);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.View style={[styles.hero, heroStyle]}>
        <MushroomPhoto m={m} variant="hero" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(20,25,6,0.55)', 'transparent', 'rgba(20,25,6,0.5)']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: HERO - 40, paddingBottom: bottom }}>
        <View style={styles.sheet}>
          <Animated.View entering={FadeInDown.duration(420)} style={{ gap: 10 }}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.latin}>
              {m.latin}
              {m.aka ? `  ·  ${m.aka}` : ''}
            </Text>
            <View style={styles.badges}>
              <EdibilityBadge value={m.edibility} />
              <View style={styles.diff}>
                <Icon name="eye-outline" size={14} color={colors.textDim} />
                <Text style={styles.diffText}>Rozpoznanie: {DIFFICULTY_LABEL[m.difficulty].toLowerCase()}</Text>
              </View>
              {inSeasonNow ? (
                <View style={[styles.diff, { backgroundColor: colors.goldDim }]}>
                  <Icon name="leaf" size={14} color={colors.gold} />
                  <Text style={[styles.diffText, { color: colors.gold }]}>W sezonie</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {danger || m.warning ? (
            <View style={{ marginTop: 16 }}>
              <Banner tone={danger ? 'danger' : 'warn'} title={m.edibility === 'deadly' ? 'Śmiertelnie trujący!' : m.edibility === 'poisonous' ? 'Trujący — nie zbieraj' : 'Uwaga'}>
                {m.warning ?? 'Nie jedz tego grzyba.'}
              </Banner>
            </View>
          ) : null}

          <Text style={styles.summary}>{m.summary}</Text>

          <SectionTitle>Model 3D</SectionTitle>
          <Mushroom3D m={m} height={290} />

          <SectionTitle>Cechy rozpoznawcze</SectionTitle>
          <View style={styles.card}>
            <Trait label="KAPELUSZ" text={m.traits.cap} />
            <Trait label="SPÓD" text={UNDER_LABEL[m.under] + (m.ring ? ' · pierścień na trzonie' : '')} />
            <Trait label="TRZON" text={m.traits.stem} />
            <Trait label="MIĄŻSZ" text={m.traits.flesh} />
          </View>

          <SectionTitle>Sezon</SectionTitle>
          <View style={styles.card}>
            <SeasonBar months={m.months} />
            <Text style={styles.seasonNote}>
              {m.months.length === 12 ? 'Owocniki widoczne przez cały rok.' : inSeasonNow ? `Teraz (${monthName(month)}) jest sezon.` : `Teraz (${monthName(month)}) poza sezonem.`}
            </Text>
          </View>

          <SectionTitle>Gdzie szukać</SectionTitle>
          <View style={styles.card}>
            <Text style={styles.traitText}>{m.traits.where}</Text>
            <View style={styles.habitats}>
              {m.habitats.map((h) => (
                <Chip key={h} label={HABITAT_LABEL[h]} />
              ))}
            </View>
            <Button label="Pokaż obserwacje na mapie" icon="map" variant="secondary" onPress={() => router.navigate({ pathname: '/map', params: { species: m.id } })} />
          </View>

          {m.lookalikes.length > 0 ? (
            <>
              <SectionTitle>Łatwo pomylić z</SectionTitle>
              <View style={{ gap: 10 }}>
                {m.lookalikes.map((l) => (
                  <View key={l.name} style={[styles.look, l.danger && styles.lookDanger]}>
                    <Icon name={l.danger ? 'warning' : 'swap-horizontal'} size={18} color={l.danger ? colors.danger : colors.textDim} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.lookName}>
                        {l.name}
                        {l.danger ? '  ·  niebezpieczny' : ''}
                      </Text>
                      <Text style={styles.traitText}>{l.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <SectionTitle>Wskazówki</SectionTitle>
          <View style={styles.card}>
            {m.tips.map((t) => (
              <View key={t} style={styles.tip}>
                <Icon name="bulb" size={16} color={colors.gold} />
                <Text style={[styles.traitText, { flex: 1 }]}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 10, marginTop: 24 }}>
            {!danger ? <Button label="Dodaj do moich zbiorów" icon="add-circle" onPress={() => router.navigate({ pathname: '/harvest/add', params: { species: m.id } })} /> : null}
            <Button label="Zapytaj na forum" icon="chatbubbles" variant="secondary" onPress={() => router.navigate({ pathname: '/forum/new', params: { species: m.id } })} />
          </View>

          <Text style={styles.credit} onPress={() => media?.page && Linking.openURL(media.page)}>
            Zdjęcie: Wikipedia / Wikimedia Commons (licencje CC){media?.page ? ' — otwórz źródło' : ''}
          </Text>
        </View>
      </Animated.ScrollView>

      <View style={[styles.back, { top: insets.top + 8 }]}>
        <IconButton icon="chevron-back" label="Wstecz" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO },
  back: { position: 'absolute', left: 16 },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 26, minHeight: 700 },
  name: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.text },
  latin: { fontFamily: fonts.body, fontSize: 15, fontStyle: 'italic', color: colors.textMute },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  diff: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.07)' },
  diffText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textDim },
  summary: { fontFamily: fonts.body, fontSize: 16.5, lineHeight: 25, color: colors.textDim, marginTop: 18 },
  card: { gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  trait: { gap: 3 },
  traitLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.3, color: colors.gold },
  traitText: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.textDim },
  seasonNote: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMute },
  habitats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  look: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  lookDanger: { backgroundColor: 'rgba(255,90,82,0.1)', borderColor: 'rgba(255,90,82,0.35)' },
  lookName: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  tip: { flexDirection: 'row', gap: 10 },
  credit: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute, marginTop: 22, textAlign: 'center' },
});
