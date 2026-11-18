import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MushroomIllustration } from '@/components/mushroom/MushroomIllustration';
import { Icon } from '@/components/ui/Icon';
import { OfflinePill } from '@/components/ui/Feedback';
import { MushroomLogo } from '@/components/ui/MushroomLogo';
import { PressableScale } from '@/components/ui/PressableScale';
import { MUSHROOM_BY_ID, inSeason, MUSHROOMS } from '@/data/mushrooms';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useSpeciesMedia } from '@/hooks/useSpeciesMedia';
import { colors, fonts, radius, WIKI_HEADERS } from '@/theme';
import { isDangerous } from '@/theme/edibility';
import { monthIn } from '@/utils/format';

type Target = string | { pathname: string; params: Record<string, string> };
interface MenuItem {
  target: Target;
  title: string;
  sub: string;
  icon: string;
  mci?: boolean;
  hero?: boolean;
}

const MENU: MenuItem[] = [
  { target: '/recognize', title: 'Rozpoznaj grzyba', sub: 'Zrób zdjęcie i sprawdź, co to za gatunek', icon: 'camera', hero: true },
  { target: '/atlas', title: 'Atlas grzybów', sub: `${MUSHROOMS.length} gatunków · filtry, model 3D, działa offline`, icon: 'mushroom', mci: true },
  { target: '/map', title: 'Mapa grzybiarska', sub: 'Gdzie obserwowano dany gatunek w Polsce', icon: 'map' },
  { target: '/learn', title: 'Poradnik grzybiarza', sub: 'Ekwipunek, sezon i zasady bezpieczeństwa', icon: 'book' },
  { target: '/harvest', title: 'Moje zbiory', sub: 'Dziennik wypraw ze zdjęciami i statystykami', icon: 'basket' },
  { target: '/forum', title: 'Forum grzybiarzy', sub: 'Zapytaj społeczność lub pochwal się okazem', icon: 'chatbubbles' },
  { target: { pathname: '/learn', params: { tab: 'quiz' } }, title: 'Quiz', sub: 'Sprawdź swoją wiedzę w kilku pytaniach', icon: 'trophy' },
];

/** Hero background: a mushroom photo from Wikimedia (cached after the first launch) over a built-in illustration. */
function HomeBackdrop() {
  const hero = MUSHROOM_BY_ID['muchomor-czerwony'];
  const media = useSpeciesMedia(hero.wiki);
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.09, { duration: 18000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [scale]);
  const kenBurns = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[colors.olive, '#2A3410', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={styles.art}>
        <MushroomIllustration spec={hero.model} size={340} />
      </View>
      {media?.hero ? (
        <Animated.View style={[StyleSheet.absoluteFill, kenBurns]}>
          <Image source={{ uri: media.hero, headers: WIKI_HEADERS }} style={StyleSheet.absoluteFill} contentFit="cover" transition={900} cachePolicy="disk" />
        </Animated.View>
      ) : null}
      <LinearGradient colors={['rgba(20,25,6,0.62)', 'rgba(20,25,6,0.18)', 'rgba(20,25,6,0.94)']} locations={[0, 0.34, 0.82]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function SeasonCard() {
  const router = useRouter();
  const month = new Date().getMonth() + 1;
  const list = inSeason(month);
  const deadly = list.filter((m) => m.edibility === 'deadly');
  const danger = list.filter((m) => isDangerous(m.edibility));
  const watch = (deadly.length ? deadly : danger).slice(0, 2).map((m) => m.name).join(', ');
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(450)}>
      <PressableScale onPress={() => router.navigate({ pathname: '/atlas', params: { season: '1' } })} style={styles.season} accessibilityRole="button" accessibilityLabel="Zobacz gatunki w sezonie">
        <View style={styles.seasonIcon}>
          <Icon name="leaf" size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.seasonTitle}>Sezon {monthIn(month)}: {list.length} gatunków</Text>
          {watch ? (
            <Text style={styles.seasonText} numberOfLines={2}>
              <Text style={{ color: colors.warn, fontFamily: fonts.bold }}>Uważaj na: </Text>
              {watch}
            </Text>
          ) : (
            <Text style={styles.seasonText}>Zobacz, co owocnikuje o tej porze roku.</Text>
          )}
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textMute} />
      </PressableScale>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = useBottomInset();
  const h = new Date().getHours();
  const greeting = h < 5 ? 'Dobranoc' : h < 18 ? 'Dzień dobry' : 'Dobry wieczór';

  return (
    <View style={styles.root}>
      <HomeBackdrop />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom, paddingHorizontal: 20 }}>
        <View style={styles.brandRow}>
          <MushroomLogo size={30} />
          <Text style={styles.brand}>Grzybobranie</Text>
          <View style={{ flex: 1 }} />
          <OfflinePill />
        </View>

        <Animated.View entering={FadeInDown.delay(40).duration(500)} style={styles.hero}>
          <Text style={styles.kicker}>{greeting.toUpperCase()}, GRZYBIARZU</Text>
          <Text style={styles.title}>Co dziś znajdziemy{'\n'}w lesie?</Text>
        </Animated.View>

        <SeasonCard />

        <View style={{ gap: 12, marginTop: 14 }}>
          {MENU.map((item, i) => (
            <Animated.View key={item.title} entering={FadeInDown.delay(180 + i * 55).springify().damping(18)}>
              <PressableScale
                onPress={() => router.navigate(item.target as never)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                style={[styles.item, item.hero && styles.itemHero]}
              >
                <View style={[styles.itemIcon, item.hero && { backgroundColor: 'rgba(26,32,6,0.14)' }]}>
                  <Icon name={item.icon} mci={item.mci} size={item.hero ? 26 : 22} color={item.hero ? colors.ink : colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, item.hero && { color: colors.ink, fontSize: 18 }]}>{item.title}</Text>
                  <Text style={[styles.itemSub, item.hero && { color: 'rgba(26,32,6,0.72)' }]} numberOfLines={1}>{item.sub}</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={item.hero ? colors.ink : colors.textMute} />
              </PressableScale>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  art: { position: 'absolute', top: 70, right: -60, opacity: 0.35 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.text },
  hero: { marginTop: 54, marginBottom: 22, gap: 10 },
  kicker: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.6, color: colors.gold },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 43, color: colors.text },
  season: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line },
  seasonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  seasonTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  seasonText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textDim, marginTop: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.goldLine },
  itemHero: { backgroundColor: colors.gold, borderColor: colors.gold, paddingVertical: 18 },
  itemIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontFamily: fonts.bold, fontSize: 16.5, color: colors.text },
  itemSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textDim, marginTop: 1 },
});
