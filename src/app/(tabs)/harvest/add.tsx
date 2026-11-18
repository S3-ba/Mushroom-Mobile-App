import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MushroomPhoto } from '@/components/mushroom/MushroomPhoto';
import { Button, Card, Chip } from '@/components/ui/Controls';
import { Banner } from '@/components/ui/Feedback';
import { Icon } from '@/components/ui/Icon';
import { PhotoPicker } from '@/components/ui/PhotoPicker';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { SpeciesPicker } from '@/components/ui/SpeciesPicker';
import { getMushroom } from '@/data/mushrooms';
import { persistPhoto } from '@/services/files';
import { useHarvest } from '@/store/harvest';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';
import { isDangerous } from '@/theme/edibility';

type Loc = { status: 'off' | 'loading' | 'ok' | 'denied' | 'error'; lat?: number; lng?: number };

export default function AddHarvestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ species?: string; photo?: string }>();
  const add = useHarvest((s) => s.add);

  const [speciesId, setSpeciesId] = useState<string | undefined>(params.species || undefined);
  const [photo, setPhoto] = useState<string | undefined>(params.photo || undefined);
  const [count, setCount] = useState(1);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [useLoc, setUseLoc] = useState(true);
  const [loc, setLoc] = useState<Loc>({ status: 'loading' });
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (params.species) setSpeciesId(params.species);
    if (params.photo) setPhoto(params.photo);
  }, [params.species, params.photo]);

  const fetchLocation = useCallback(async () => {
    setLoc({ status: 'loading' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLoc({ status: 'denied' });
        return;
      }
      const last = await Location.getLastKnownPositionAsync();
      if (last) setLoc({ status: 'ok', lat: last.coords.latitude, lng: last.coords.longitude });
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setLoc((l) => (l.status === 'ok' ? l : { status: 'error' }));
    }
  }, []);

  useEffect(() => {
    if (useLoc) fetchLocation();
    else setLoc({ status: 'off' });
  }, [useLoc, fetchLocation]);

  const m = getMushroom(speciesId);

  const save = () => {
    if (!speciesId) {
      toast('Wybierz gatunek', 'warn');
      return;
    }
    const w = parseFloat(weight.replace(',', '.'));
    add({
      speciesId,
      count,
      weightKg: Number.isFinite(w) && w > 0 ? w : undefined,
      note: note.trim() || undefined,
      photoUri: photo ? persistPhoto(photo) : undefined,
      lat: useLoc ? loc.lat : undefined,
      lng: useLoc ? loc.lng : undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast('Dodano do zbiorów');
    if (router.canGoBack()) router.back();
    else router.replace('/harvest');
  };

  const bump = (d: number) => setCount((c) => Math.min(999, Math.max(1, c + d)));

  return (
    <Screen>
      <ScreenHeader back title="Nowy zbiór" subtitle="Zapisz znalezisko" />

      <PhotoPicker uri={photo} onChange={setPhoto} />

      <Text style={styles.label}>GATUNEK</Text>
      <PressableScale onPress={() => setPicker(true)} style={styles.species} accessibilityRole="button" accessibilityLabel="Wybierz gatunek">
        {m ? (
          <>
            <MushroomPhoto m={m} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.spName}>{m.name}</Text>
              <Text style={styles.spLatin}>{m.latin}</Text>
            </View>
            <Text style={styles.change}>Zmień</Text>
          </>
        ) : (
          <>
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Icon name="search" size={20} color={colors.gold} />
            </View>
            <Text style={[styles.spName, { flex: 1 }]}>Wybierz gatunek z atlasu</Text>
            <Icon name="chevron-forward" size={18} color={colors.textMute} />
          </>
        )}
      </PressableScale>
      {m && isDangerous(m.edibility) ? (
        <View style={{ marginTop: 10 }}>
          <Banner tone="danger" title="Gatunek trujący">Zapisujesz tylko obserwację. Nie zbieraj go do jedzenia.</Banner>
        </View>
      ) : null}

      <Text style={styles.label}>LICZBA SZTUK</Text>
      <Card style={styles.stepper}>
        <PressableScale onPress={() => bump(-1)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Mniej">
          <Icon name="remove" size={24} color={colors.text} />
        </PressableScale>
        <Animated.Text key={count} entering={ZoomIn.duration(180)} style={styles.count}>{count}</Animated.Text>
        <PressableScale onPress={() => bump(1)} style={[styles.stepBtn, { backgroundColor: colors.gold }]} accessibilityRole="button" accessibilityLabel="Więcej">
          <Icon name="add" size={24} color={colors.ink} />
        </PressableScale>
      </Card>
      <View style={styles.quick}>
        {[5, 10].map((n) => (
          <Chip key={n} label={`+${n}`} onPress={() => bump(n)} />
        ))}
      </View>

      <Text style={styles.label}>WAGA (KG, OPCJONALNIE)</Text>
      <TextInput value={weight} onChangeText={setWeight} placeholder="np. 1,5" placeholderTextColor={colors.textMute} keyboardType="decimal-pad" selectionColor={colors.gold} style={styles.input} />

      <Text style={styles.label}>NOTATKA</Text>
      <TextInput value={note} onChangeText={setNote} placeholder="np. pod świerkami, po deszczu…" placeholderTextColor={colors.textMute} multiline selectionColor={colors.gold} style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} />

      <PressableScale onPress={() => setUseLoc((v) => !v)} style={styles.locRow} accessibilityRole="switch" accessibilityState={{ checked: useLoc }}>
        <View style={[styles.locIcon, useLoc && { backgroundColor: colors.goldDim }]}>
          <Icon name={useLoc ? 'location' : 'location-outline'} size={20} color={useLoc ? colors.gold : colors.textMute} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.spName}>Zapisz miejsce znaleziska</Text>
          <Text style={styles.spLatin}>
            {!useLoc ? 'Wyłączone' : loc.status === 'loading' ? 'Ustalam pozycję…' : loc.status === 'ok' ? `${loc.lat?.toFixed(4)}, ${loc.lng?.toFixed(4)} — pojawi się na mapie` : loc.status === 'denied' ? 'Brak zgody na lokalizację' : 'Nie udało się ustalić pozycji'}
          </Text>
        </View>
        {useLoc && loc.status === 'ok' ? <Animated.View entering={FadeIn}><Icon name="checkmark-circle" size={22} color={colors.ok} /></Animated.View> : null}
      </PressableScale>

      <View style={{ marginTop: 26 }}>
        <Button label="Zapisz zbiór" icon="checkmark" size="lg" onPress={save} />
      </View>

      <SpeciesPicker visible={picker} onClose={() => setPicker(false)} onPick={setSpeciesId} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.4, color: colors.gold, marginTop: 22, marginBottom: 10 },
  species: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  thumb: { width: 54, height: 54, borderRadius: 15 },
  thumbEmpty: { backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  spName: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text },
  spLatin: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMute, marginTop: 1 },
  change: { fontFamily: fonts.bold, fontSize: 13, color: colors.gold, paddingRight: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  stepBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(246,242,221,0.1)', alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: fonts.display, fontSize: 44, color: colors.text },
  quick: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { fontFamily: fonts.body, fontSize: 15.5, color: colors.text, paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.md, backgroundColor: 'rgba(246,242,221,0.06)', borderWidth: 1, borderColor: colors.line },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, padding: 12, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  locIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(246,242,221,0.07)', alignItems: 'center', justifyContent: 'center' },
});
