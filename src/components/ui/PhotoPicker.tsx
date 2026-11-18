import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radius } from '@/theme';
import { toast } from '@/store/toast';
import { Button, IconButton } from './Controls';
import { Icon } from './Icon';

/** Photo slot with "take a photo" / "choose from gallery" actions. Returns a (cache) URI. */
export function PhotoPicker({ uri, onChange, height = 190 }: { uri?: string; onChange: (uri: string | undefined) => void; height?: number }) {
  const take = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast('Brak zgody na użycie aparatu', 'warn');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) onChange(res.assets[0].uri);
  };
  const choose = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) onChange(res.assets[0].uri);
  };

  if (uri) {
    return (
      <View style={[styles.box, { height }]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <View style={styles.remove}>
          <IconButton icon="close" size={36} label="Usuń zdjęcie" onPress={() => onChange(undefined)} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.box, styles.empty, { height }]}>
      <Icon name="image-outline" size={30} color={colors.textMute} />
      <Text style={styles.hint}>Dodaj zdjęcie (opcjonalnie)</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Aparat" icon="camera" size="sm" variant="secondary" onPress={take} />
        <Button label="Galeria" icon="images" size="sm" variant="secondary" onPress={choose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, borderStyle: 'dashed' },
  hint: { fontFamily: fonts.medium, fontSize: 14, color: colors.textDim },
  remove: { position: 'absolute', top: 10, right: 10 },
});
