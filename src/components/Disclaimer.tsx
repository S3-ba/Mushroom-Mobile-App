import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme';
import { Button } from './ui/Controls';
import { Icon } from './ui/Icon';

function useHydrated(): boolean {
  const [done, setDone] = useState(useSettings.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSettings.persist.onFinishHydration(() => setDone(true));
    setDone(useSettings.persist.hasHydrated());
    return unsub;
  }, []);
  return done;
}

/** One-time safety notice shown on the first launch. */
export function DisclaimerModal() {
  const hydrated = useHydrated();
  const accepted = useSettings((s) => s.accepted);
  const accept = useSettings((s) => s.accept);
  const visible = hydrated && !accepted;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={accept}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeInDown.delay(150).duration(420)} style={styles.card}>
          <View style={styles.icon}>
            <Icon name="shield-checkmark" size={30} color={colors.gold} />
          </View>
          <Text style={styles.title}>Zanim zaczniesz</Text>
          <Text style={styles.text}>
            Grzybobranie to aplikacja edukacyjna. Rozpoznawanie ze zdjęcia jest tylko podpowiedzią — nigdy nie jedz grzyba wyłącznie na jej podstawie.
          </Text>
          <Text style={styles.text}>Wątpliwe okazy pokaż grzyboznawcy (np. w lokalnym sanepidzie). W razie podejrzenia zatrucia dzwoń na 112.</Text>
          <Button label="Rozumiem" onPress={accept} size="lg" style={{ marginTop: 8, alignSelf: 'stretch' }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,11,2,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, gap: 12, borderWidth: 1, borderColor: colors.goldLine },
  icon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textDim },
});
