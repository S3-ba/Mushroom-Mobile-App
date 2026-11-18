import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, EmptyState } from '@/components/ui/Feedback';
import { Button, Chip, IconButton, SectionTitle } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { MUSHROOMS } from '@/data/mushrooms';
import { PALETTE_LABEL } from '@/data/types';
import { analysePhoto, PALETTE, type PhotoAnalysis } from '@/features/recognition/analysis';
import { CandidateCard } from '@/features/recognition/CandidateCard';
import { confidenceOf, rankCandidates, traitCount, type TraitSelection } from '@/features/recognition/ranking';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useOnline } from '@/hooks/useOnline';
import { downloadToCache } from '@/services/files';
import { getSpeciesMedia } from '@/services/wikipedia';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';
import { isDangerous } from '@/theme/edibility';

type Phase = 'camera' | 'analyzing' | 'result';

const DEMO_WIKI = ['Boletus edulis', 'Cantharellus cibarius', 'Amanita muscaria', 'Imleria badia', 'Lactarius deliciosus'];

const GROUPS: { key: keyof TraitSelection; label: string; options: { v: string | boolean; label: string }[] }[] = [
  { key: 'under', label: 'Spód kapelusza', options: [{ v: 'pores', label: 'Rurki (gąbka)' }, { v: 'gills', label: 'Blaszki' }, { v: 'folds', label: 'Fałdy' }, { v: 'none', label: 'Brak' }] },
  { key: 'place', label: 'Gdzie rośnie', options: [{ v: 'ground', label: 'Ziemia / mech' }, { v: 'wood', label: 'Drewno' }, { v: 'meadow', label: 'Łąka / trawnik' }] },
  { key: 'ring', label: 'Pierścień na trzonie', options: [{ v: true, label: 'Jest' }, { v: false, label: 'Brak' }] },
  { key: 'form', label: 'Kształt', options: [{ v: 'cap', label: 'Kapelusz na trzonie' }, { v: 'funnel', label: 'Lejek' }, { v: 'ball', label: 'Kula / plaster miodu' }, { v: 'shelf', label: 'Półka na pniu' }] },
];

export default function RecognizeScreen() {
  const router = useRouter();
  const online = useOnline();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [focused, setFocused] = useState(false);
  const [torch, setTorch] = useState(false);
  const [phase, setPhase] = useState<Phase>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [traits, setTraits] = useState<TraitSelection>({});
  const [busy, setBusy] = useState(false);

  // The camera is only mounted while this tab is focused (saves battery, releases the camera).
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  const ranked = useMemo(() => rankCandidates(analysis, traits), [analysis, traits]);
  const top = ranked.slice(0, 4);
  const confidence = confidenceOf(ranked, traitCount(traits));
  const dangerous = ranked.slice(0, 3).filter((c) => c.p >= 0.12 && isDangerous(c.mushroom.edibility));

  const handlePhoto = async (uri: string) => {
    setPhoto(uri);
    setTraits({});
    setPhase('analyzing');
    let result: PhotoAnalysis | null = null;
    try {
      const [a] = await Promise.all([analysePhoto(uri), new Promise((r) => setTimeout(r, 1400))]);
      result = a;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      console.warn('Photo analysis failed', e);
      toast('Nie udało się przeanalizować zdjęcia — użyj cech poniżej', 'warn');
    }
    setAnalysis(result);
    setPhase('result');
  };

  const shoot = async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (pic?.uri) await handlePhoto(pic.uri);
    } catch (e) {
      console.warn(e);
      toast('Nie udało się zrobić zdjęcia', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) await handlePhoto(res.assets[0].uri);
  };

  const demo = async () => {
    if (!online) {
      toast('Przykład wymaga internetu (pobiera zdjęcie)', 'warn');
      return;
    }
    setBusy(true);
    try {
      const media = await getSpeciesMedia(DEMO_WIKI[Math.floor(Math.random() * DEMO_WIKI.length)]);
      const url = media?.hero ?? media?.card;
      if (!url) throw new Error('no image');
      await handlePhoto(await downloadToCache(url));
    } catch {
      toast('Nie udało się pobrać zdjęcia przykładowego', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPhase('camera');
    setPhoto(null);
    setAnalysis(null);
    setTraits({});
  };

  const setTrait = (key: keyof TraitSelection, v: string | boolean) => setTraits((t) => ({ ...t, [key]: t[key] === v ? undefined : v }));

  /* ─────────── camera permission / camera ─────────── */
  if (phase === 'camera') {
    if (!permission) return <Screen><View /></Screen>;
    if (!permission.granted) {
      return (
        <Screen>
          <ScreenHeader title="Rozpoznaj grzyba" subtitle="Zrób zdjęcie lub wybierz z galerii" />
          <EmptyState icon="camera-outline" title="Potrzebny dostęp do aparatu" text="Zezwól na użycie aparatu albo wybierz zdjęcie z galerii. Analiza działa w pełni offline." action="Zezwól na aparat" onAction={requestPermission} />
          <View style={{ gap: 10 }}>
            <Button label="Wybierz z galerii" icon="images" variant="secondary" onPress={pick} />
            <Button label="Wypróbuj na przykładowym zdjęciu" icon="sparkles" variant="ghost" loading={busy} onPress={demo} />
          </View>
        </Screen>
      );
    }
    return <CameraScreen cameraRef={cameraRef} active={focused} torch={torch} setTorch={setTorch} busy={busy} onShoot={shoot} onPick={pick} onDemo={demo} />;
  }

  /* ─────────── analysing ─────────── */
  if (phase === 'analyzing' && photo) return <Analyzing uri={photo} />;

  /* ─────────── result ─────────── */
  const lowCoverage = analysis !== null && analysis.coverage < 0.18;
  return (
    <Screen>
      <ScreenHeader title="Wynik analizy" subtitle="Podpowiedzi, nie wyrocznia" right={<IconButton icon="camera-reverse" label="Nowe zdjęcie" onPress={reset} />} />

      {photo ? (
        <Animated.View entering={FadeIn.duration(350)} style={styles.photoCard}>
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(20,25,6,0.85)']} style={styles.photoShade} />
          {analysis && analysis.dominant.length > 0 ? (
            <View style={styles.swatches}>
              {analysis.dominant.slice(0, 3).map((p) => (
                <View key={p} style={styles.swatch}>
                  <View style={[styles.swatchDot, { backgroundColor: `rgb(${PALETTE[p].join(',')})` }]} />
                  <Text style={styles.swatchText}>{PALETTE_LABEL[p]}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      <View style={{ gap: 10, marginTop: 14 }}>
        {dangerous.length > 0 ? (
          <Banner tone="danger" title="Wśród kandydatów jest gatunek trujący">
            {`${dangerous.map((c) => c.mushroom.name).join(', ')}. Nie zbieraj i nie jedz tego grzyba, dopóki nie potwierdzi go grzyboznawca.`}
          </Banner>
        ) : null}
        {lowCoverage ? <Banner tone="warn" title="Słabe zdjęcie">Nie wykryto typowych barw grzyba. Zrób zdjęcie z bliska, na jednolitym tle i przy dobrym świetle.</Banner> : null}
        <Banner tone={confidence === 'high' ? 'tip' : 'warn'} title={confidence === 'high' ? 'Wysokie dopasowanie cech' : confidence === 'medium' ? 'Średnie dopasowanie' : 'Niskie dopasowanie'} icon="analytics">
          {confidence === 'low' ? 'Same kolory to za mało. Zaznacz poniżej cechy, które widzisz — ranking zmieni się na bieżąco.' : 'To tylko podpowiedź oparta na kolorze i zaznaczonych cechach. Zawsze potwierdź gatunek u grzyboznawcy.'}
        </Banner>
      </View>

      <SectionTitle>Najbardziej podobne</SectionTitle>
      <View style={{ gap: 12 }}>
        {top.map((c, i) => (
          <CandidateCard
            key={c.mushroom.id}
            c={c}
            rank={i}
            onOpen={() => router.navigate({ pathname: '/atlas/[id]', params: { id: c.mushroom.id } })}
            onAdd={() => router.navigate({ pathname: '/harvest/add', params: { species: c.mushroom.id, photo: photo ?? '' } })}
          />
        ))}
      </View>

      <SectionTitle>Doprecyzuj cechy</SectionTitle>
      <View style={styles.traits}>
        {GROUPS.map((g) => (
          <View key={g.key} style={{ gap: 8 }}>
            <Text style={styles.group}>{g.label}</Text>
            <View style={styles.wrap}>
              {g.options.map((o) => (
                <Chip key={String(o.v)} label={o.label} active={traits[g.key] === o.v} onPress={() => setTrait(g.key, o.v)} />
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 22 }}>
        <Button
          label="Zapytaj społeczność na forum"
          icon="chatbubbles"
          variant="secondary"
          onPress={() =>
            router.navigate({
              pathname: '/forum/new',
              params: { photo: photo ?? '', hint: JSON.stringify(top.slice(0, 3).map((c) => ({ speciesId: c.mushroom.id, percent: Math.round(c.p * 100) }))) },
            })
          }
        />
        <Button label="Zrób kolejne zdjęcie" icon="camera" variant="ghost" onPress={reset} />
      </View>

      <Text style={styles.disclaimer}>
        Silnik działa offline: analizuje barwy zdjęcia i zaznaczone cechy, a następnie porównuje je z {MUSHROOMS.length} gatunkami z atlasu. Nie jest to pewne rozpoznanie — nigdy nie jedz grzyba wyłącznie na tej podstawie.
      </Text>
    </Screen>
  );
}

/* ═════════════════════ camera view ═════════════════════ */

function CameraScreen({ cameraRef, active, torch, setTorch, busy, onShoot, onPick, onDemo }: {
  cameraRef: RefObject<CameraView | null>;
  active: boolean;
  torch: boolean;
  setTorch: (v: boolean) => void;
  busy: boolean;
  onShoot: () => void;
  onPick: () => void;
  onDemo: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottom = useBottomInset();
  const { width } = useWindowDimensions();
  const frame = Math.min(width * 0.8, 330);
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {active ? <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} /> : null}
      <LinearGradient colors={['rgba(20,25,6,0.8)', 'transparent']} style={[styles.topShade, { height: insets.top + 110 }]} pointerEvents="none" />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20 }}>
        <ScreenHeader title="Rozpoznaj grzyba" subtitle="Zdjęcie analizowane offline" />
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={{ width: frame, height: frame }}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
            <View key={k} style={[styles.corner, styles[k]]} />
          ))}
        </View>
        <View style={styles.hint}>
          <Icon name="scan" size={15} color={colors.gold} />
          <Text style={styles.hintText}>Ułóż grzyba w ramce — kapelusz, spód i trzon</Text>
        </View>
      </View>

      <View style={[styles.controls, { bottom }]}>
        <PressableScale onPress={onDemo} style={styles.demo} haptic={false} accessibilityRole="button" accessibilityLabel="Wypróbuj na przykładowym zdjęciu">
          <Icon name="sparkles" size={14} color={colors.textDim} />
          <Text style={styles.demoText}>{busy ? 'Chwileczkę…' : 'Brak grzyba pod ręką? Wypróbuj przykład'}</Text>
        </PressableScale>
        <View style={styles.shutterRow}>
          <IconButton icon="images" size={52} label="Wybierz z galerii" onPress={onPick} />
          <PressableScale onPress={onShoot} scaleTo={0.9} style={styles.shutterOuter} accessibilityRole="button" accessibilityLabel="Zrób zdjęcie">
            <View style={[styles.shutterInner, busy && { opacity: 0.5 }]} />
          </PressableScale>
          <IconButton icon={torch ? 'flash' : 'flash-off'} size={52} tone={torch ? 'gold' : 'glass'} label="Latarka" onPress={() => setTorch(!torch)} />
        </View>
      </View>
    </View>
  );
}

/* ═════════════════════ analysing ═════════════════════ */

function Analyzing({ uri }: { uri: string }) {
  const [h, setH] = useState(0);
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [y]);
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * h }] }));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={(e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height - 4)}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,25,6,0.55)' }]} />
      <Animated.View style={[styles.scan, line]} />
      <Animated.View entering={FadeInDown.duration(400)} style={styles.analyzingBox}>
        <Text style={styles.analyzingTitle}>Analizuję zdjęcie…</Text>
        <Text style={styles.analyzingSub}>Porównuję barwy i cechy z atlasem</Text>
      </Animated.View>
    </View>
  );
}

const CORNER = 34;
const styles = StyleSheet.create({
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  frameWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 16 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.gold },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 34, borderRadius: radius.pill, backgroundColor: colors.glass },
  hintText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  controls: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 16 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 32, borderRadius: radius.pill, backgroundColor: colors.glass },
  demoText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textDim },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 36 },
  shutterOuter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.gold },
  scan: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  analyzingBox: { position: 'absolute', left: 0, right: 0, bottom: 150, alignItems: 'center', gap: 4 },
  analyzingTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  analyzingSub: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textDim },
  photoCard: { height: 210, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  photoShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  swatches: { position: 'absolute', left: 14, bottom: 12, flexDirection: 'row', gap: 8 },
  swatch: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: 'rgba(20,25,6,0.7)' },
  swatchDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  swatchText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
  traits: { gap: 16, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  group: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  disclaimer: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMute, marginTop: 20, textAlign: 'center' },
});
