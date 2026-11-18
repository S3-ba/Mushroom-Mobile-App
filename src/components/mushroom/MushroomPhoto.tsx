import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Mushroom } from '@/data/types';
import { useSpeciesMedia } from '@/hooks/useSpeciesMedia';
import { colors, WIKI_HEADERS } from '@/theme';
import { MushroomIllustration } from './MushroomIllustration';

interface Props {
  m: Mushroom;
  variant?: 'card' | 'hero';
  style?: StyleProp<ViewStyle>;
}

/**
 * Species photo (Wikimedia, cached on disk by expo-image) that fades in over the built-in
 * illustration – so the atlas always looks complete, even offline before the photos are downloaded.
 */
export function MushroomPhoto({ m, variant = 'card', style }: Props) {
  const media = useSpeciesMedia(m.wiki);
  const uri = variant === 'hero' ? media?.hero : media?.card;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <View style={[styles.box, style]}>
      <LinearGradient colors={[colors.surfaceHi, colors.surface]} style={StyleSheet.absoluteFill} />
      <View style={styles.art}>
        <MushroomIllustration spec={m.model} size="78%" />
      </View>
      {uri && !failed ? (
        <Image
          source={{ uri, headers: WIKI_HEADERS }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
          cachePolicy="disk"
          onError={() => setFailed(true)}
          accessibilityLabel={`Zdjęcie: ${m.name}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: colors.surface },
  art: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
