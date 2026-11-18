import { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MUSHROOMS } from '@/data/mushrooms';
import { colors, fonts, radius } from '@/theme';
import { fold } from '@/utils/format';
import { EdibilityBadge } from '../mushroom/EdibilityBadge';
import { MushroomPhoto } from '../mushroom/MushroomPhoto';
import { IconButton } from './Controls';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/** Full-screen modal with search for choosing a species from the atlas. */
export function SpeciesPicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const f = fold(q.trim());
    return f ? MUSHROOMS.filter((m) => fold(`${m.name} ${m.aka ?? ''} ${m.latin}`).includes(f)) : MUSHROOMS;
  }, [q]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <View style={styles.head}>
          <Text style={styles.title}>Wybierz gatunek</Text>
          <IconButton icon="close" label="Zamknij" onPress={onClose} />
        </View>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.textMute} />
          <TextInput value={q} onChangeText={setQ} placeholder="Szukaj gatunku…" placeholderTextColor={colors.textMute} selectionColor={colors.gold} style={styles.input} autoCorrect={false} />
        </View>
        <FlatList
          data={list}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 10, paddingBottom: insets.bottom + 24, paddingTop: 12 }}
          renderItem={({ item }) => (
            <PressableScale
              onPress={() => {
                onPick(item.id);
                setQ('');
                onClose();
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <MushroomPhoto m={item} style={styles.thumb} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.latin} numberOfLines={1}>{item.latin}</Text>
              </View>
              <EdibilityBadge value={item.edibility} size="sm" />
            </PressableScale>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.07)', borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  latin: { fontFamily: fonts.body, fontSize: 12.5, fontStyle: 'italic', color: colors.textMute },
});
