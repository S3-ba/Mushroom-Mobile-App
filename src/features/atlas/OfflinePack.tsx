import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Button, ProgressBar } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { MUSHROOMS } from '@/data/mushrooms';
import { useOnline } from '@/hooks/useOnline';
import { getSpeciesMedia } from '@/services/wikipedia';
import { useSettings } from '@/store/settings';
import { toast } from '@/store/toast';
import { colors, fonts, radius, WIKI_HEADERS } from '@/theme';

/** Lets the user cache all species photos for the forest (text, filters and 3D models are always offline). */
export function OfflinePackCard() {
  const online = useOnline();
  const packDone = useSettings((s) => s.packDone);
  const markPack = useSettings((s) => s.markPack);
  const [progress, setProgress] = useState<number | null>(null);
  const total = MUSHROOMS.length;
  const complete = packDone.length >= total;

  const start = async () => {
    if (!online) {
      toast('Połącz się z internetem, aby pobrać zdjęcia', 'warn');
      return;
    }
    setProgress(0);
    const queue = [...MUSHROOMS];
    const ok: string[] = [];
    let n = 0;
    const worker = async () => {
      for (let m = queue.shift(); m; m = queue.shift()) {
        const media = await getSpeciesMedia(m.wiki);
        const urls = [media?.card, media?.hero].filter(Boolean) as string[];
        if (urls.length) {
          try {
            if (await Image.prefetch(urls, { cachePolicy: 'disk', headers: WIKI_HEADERS } as any)) ok.push(m.id);
          } catch {
            /* skip this species, retry on next download */
          }
        }
        n += 1;
        setProgress(n / total);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    markPack(ok);
    setProgress(null);
    toast(ok.length === total ? 'Atlas gotowy do pracy offline' : `Pobrano zdjęcia: ${ok.length} z ${total}`, ok.length === total ? 'ok' : 'warn');
  };

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name={complete ? 'checkmark-circle' : 'cloud-download-outline'} size={22} color={complete ? colors.ok : colors.gold} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.title}>{complete ? 'Atlas gotowy offline' : 'Zdjęcia offline'}</Text>
        {progress !== null ? (
          <ProgressBar value={progress} />
        ) : (
          <Text style={styles.text}>
            {complete ? 'Zdjęcia zapisano na urządzeniu.' : 'Opisy, filtry i modele 3D działają bez internetu. Pobierz też zdjęcia (ok. 8 MB).'}
          </Text>
        )}
      </View>
      {!complete && progress === null ? <Button label="Pobierz" size="sm" onPress={start} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  text: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: colors.textDim },
});
