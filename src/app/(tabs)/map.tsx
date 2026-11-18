import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, IconButton } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { ScreenHeader } from '@/components/ui/Screen';
import { getMushroom, inSeason, MUSHROOMS } from '@/data/mushrooms';
import { MAP_STYLE } from '@/features/map/mapStyle';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useOnline } from '@/hooks/useOnline';
import { CELL_LAT, CELL_LNG, getOccurrences, type OccCell, type OccData } from '@/services/gbif';
import { useHarvest } from '@/store/harvest';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';
import { dayLabel, plural } from '@/utils/format';

type LoadState = { status: 'idle' | 'loading' } | { status: 'ready'; data: OccData; cached: boolean } | { status: 'error'; offline: boolean };

const POLAND = { latitude: 52.0, longitude: 19.3, latitudeDelta: 8.5, longitudeDelta: 8.5 };

function defaultSpecies(): string {
  const month = new Date().getMonth() + 1;
  return (inSeason(month).find((m) => m.edibility === 'edible') ?? MUSHROOMS[0]).id;
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = useBottomInset();
  const online = useOnline();
  const params = useLocalSearchParams<{ species?: string }>();
  const mapRef = useRef<MapView>(null);
  const entries = useHarvest((s) => s.entries);

  const [speciesId, setSpeciesId] = useState<string>(() => (params.species && getMushroom(params.species) ? params.species : defaultSpecies()));
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [showRange, setShowRange] = useState(true);
  const [showMine, setShowMine] = useState(true);
  const [located, setLocated] = useState(false);
  const [reload, setReload] = useState(0);
  const [picked, setPicked] = useState<OccCell | null>(null);

  const species = getMushroom(speciesId) ?? MUSHROOMS[0];

  useEffect(() => {
    if (params.species && getMushroom(params.species)) setSpeciesId(params.species);
  }, [params.species]);

  // Load real observations (GBIF) for the chosen species; cached → works offline afterwards.
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    setPicked(null);
    getOccurrences(species.latin, online).then((res) => {
      if (!alive) return;
      if (!res) {
        setState({ status: 'error', offline: !online });
        return;
      }
      setState({ status: 'ready', data: res.data, cached: res.cached });
      if (res.data.cells.length > 0) {
        const lats = res.data.cells.flatMap((c) => [c.lat, c.lat + CELL_LAT]);
        const lngs = res.data.cells.flatMap((c) => [c.lng, c.lng + CELL_LNG]);
        const coords = [
          { latitude: Math.min(...lats), longitude: Math.min(...lngs) },
          { latitude: Math.max(...lats), longitude: Math.max(...lngs) },
        ];
        setTimeout(() => mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 260, right: 40, bottom: bottom + 150, left: 40 }, animated: true }), 250);
      }
    });
    return () => {
      alive = false;
    };
  }, [species.latin, reload, online]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = useMemo(() => (showMine ? entries.filter((e) => e.lat !== undefined && e.lng !== undefined) : []), [entries, showMine]);

  const locate = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      toast('Brak zgody na lokalizację', 'warn');
      return;
    }
    setLocated(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.25, longitudeDelta: 0.25 }, 700);
    } catch {
      toast('Nie udało się ustalić pozycji', 'warn');
    }
  }, []);

  const navigateTo = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
      default: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`,
    });
    Linking.openURL(url as string).catch(() => toast('Nie znaleziono aplikacji map', 'warn'));
  };

  const data = state.status === 'ready' ? state.data : null;

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={MAP_STYLE}
        initialRegion={POLAND}
        showsUserLocation={located}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        userInterfaceStyle="dark"
        mapPadding={{ top: insets.top + 120, right: 0, bottom: bottom + 120, left: 0 }}
      >
        {showRange && data
          ? data.cells.map((c) => {
              const alpha = 0.16 + 0.55 * Math.sqrt(c.n / data.maxN);
              return (
                <Polygon
                  key={`${c.lat}:${c.lng}`}
                  coordinates={[
                    { latitude: c.lat, longitude: c.lng },
                    { latitude: c.lat + CELL_LAT, longitude: c.lng },
                    { latitude: c.lat + CELL_LAT, longitude: c.lng + CELL_LNG },
                    { latitude: c.lat, longitude: c.lng + CELL_LNG },
                  ]}
                  fillColor={`rgba(255,198,10,${alpha.toFixed(2)})`}
                  strokeColor="rgba(255,198,10,0.55)"
                  strokeWidth={1}
                  tappable
                  onPress={() => setPicked(c)}
                />
              );
            })
          : null}
        {mine.map((e) => {
          const sp = getMushroom(e.speciesId);
          return (
            <Marker
              key={e.id}
              coordinate={{ latitude: e.lat as number, longitude: e.lng as number }}
              title={sp?.name ?? 'Znalezisko'}
              description={`${dayLabel(e.createdAt)} · ${e.count} ${plural(e.count, 'sztuka', 'sztuki', 'sztuk')} — dotknij, by nawigować`}
              pinColor={colors.gold}
              onCalloutPress={() => navigateTo(e.lat as number, e.lng as number, sp?.name ?? 'Znalezisko')}
            />
          );
        })}
      </MapView>

      <LinearGradient colors={['rgba(20,25,6,0.92)', 'rgba(20,25,6,0.55)', 'transparent']} style={[styles.topShade, { height: insets.top + 190 }]} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <ScreenHeader title="Mapa grzybiarska" subtitle="Obserwacje w Polsce (GBIF)" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          {MUSHROOMS.map((m) => (
            <Chip key={m.id} label={m.name} active={m.id === speciesId} onPress={() => setSpeciesId(m.id)} />
          ))}
        </ScrollView>
        <View style={styles.layers}>
          <Chip label="Zasięg" icon="layers" active={showRange} onPress={() => setShowRange((v) => !v)} />
          <Chip label={`Moje znaleziska (${entries.filter((e) => e.lat !== undefined).length})`} icon="location" active={showMine} onPress={() => setShowMine((v) => !v)} />
          <View style={{ flex: 1 }} />
          <IconButton icon="locate" label="Moja pozycja" onPress={locate} size={40} />
        </View>
      </View>

      <Animated.View key={speciesId} entering={FadeInDown.duration(380)} style={[styles.info, { bottom }]}>
        <View style={styles.infoHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoName} numberOfLines={1}>{species.name}</Text>
            <Text style={styles.infoLatin} numberOfLines={1}>{species.latin}</Text>
          </View>
          <Button label="Atlas" size="sm" variant="secondary" icon="chevron-forward" onPress={() => router.navigate({ pathname: '/atlas/[id]', params: { id: species.id } })} />
        </View>

        {state.status === 'loading' ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.infoText}>Pobieram obserwacje…</Text>
          </View>
        ) : null}

        {state.status === 'ready' ? (
          <>
            {data && data.cells.length > 0 ? (
              <>
                <Text style={styles.infoText}>
                  {picked ? `Wybrany kwadrat: ${picked.n} ${plural(picked.n, 'obserwacja', 'obserwacje', 'obserwacji')} (z próbki).` : `${data.total.toLocaleString('pl-PL')} obserwacji w Polsce · na mapie próbka ${data.sample}.`}
                </Text>
                <View style={styles.legend}>
                  <Text style={styles.legendText}>mało</Text>
                  <LinearGradient colors={['rgba(255,198,10,0.2)', 'rgba(255,198,10,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.legendBar} />
                  <Text style={styles.legendText}>dużo</Text>
                </View>
              </>
            ) : (
              <Text style={styles.infoText}>Brak obserwacji tego gatunku w Polsce w bazie GBIF.</Text>
            )}
            {state.cached ? (
              <View style={styles.cachedRow}>
                <Icon name="download" size={13} color={colors.ok} />
                <Text style={[styles.legendText, { color: colors.ok }]}>Dane zapisane na urządzeniu — działają offline</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {state.status === 'error' ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.infoText}>
              {state.offline ? 'Brak danych offline dla tego gatunku. Połącz się z internetem — obserwacje zapiszą się na urządzeniu.' : 'Nie udało się pobrać obserwacji. Spróbuj ponownie.'}
            </Text>
            {!state.offline ? <Button label="Spróbuj ponownie" size="sm" variant="secondary" onPress={() => setReload((n) => n + 1)} /> : null}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, gap: 10 },
  layers: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  info: { position: 'absolute', left: 16, right: 16, gap: 10, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(24,30,8,0.96)', borderWidth: 1, borderColor: colors.goldLine },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoName: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  infoLatin: { fontFamily: fonts.body, fontSize: 12.5, fontStyle: 'italic', color: colors.textMute },
  infoText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.textDim },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendBar: { flex: 1, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textMute },
  cachedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
