import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, SegmentedControl } from '@/components/ui/Controls';
import { Banner } from '@/components/ui/Feedback';
import { PhotoPicker } from '@/components/ui/PhotoPicker';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { getMushroom } from '@/data/mushrooms';
import { persistPhoto } from '@/services/files';
import { useForum, type ForumPost } from '@/store/forum';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';

export default function NewPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ species?: string; photo?: string; hint?: string }>();
  const addPost = useForum((s) => s.addPost);

  const hint = useMemo<ForumPost['hint']>(() => {
    try {
      return params.hint ? (JSON.parse(params.hint) as ForumPost['hint']) : undefined;
    } catch {
      return undefined;
    }
  }, [params.hint]);

  const asked = getMushroom(params.species);
  const [kind, setKind] = useState<'ask' | 'brag'>('ask');
  const [photo, setPhoto] = useState<string | undefined>(params.photo || undefined);
  const [title, setTitle] = useState(asked ? `Czy to ${asked.name.toLowerCase()}?` : '');
  const [text, setText] = useState('');

  useEffect(() => {
    if (params.photo) setPhoto(params.photo);
  }, [params.photo]);

  const publish = () => {
    if (title.trim().length < 4) {
      toast('Dodaj tytuł wpisu (min. 4 znaki)', 'warn');
      return;
    }
    const id = addPost({ kind, title: title.trim(), text: text.trim(), photoUri: photo ? persistPhoto(photo) : undefined, hint: kind === 'ask' ? hint : undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast('Wpis opublikowany');
    router.replace({ pathname: '/forum/[id]', params: { id } });
  };

  return (
    <Screen>
      <ScreenHeader back title="Nowy wpis" subtitle="Zapytaj lub pochwal się" />
      <SegmentedControl
        options={[
          { key: 'ask' as const, label: 'Co to za grzyb?', icon: 'help-circle' },
          { key: 'brag' as const, label: 'Pochwal się', icon: 'trophy' },
        ]}
        value={kind}
        onChange={setKind}
      />

      <View style={{ marginTop: 18 }}>
        <PhotoPicker uri={photo} onChange={setPhoto} height={200} />
      </View>
      {kind === 'ask' && !photo ? (
        <View style={{ marginTop: 10 }}>
          <Banner tone="tip">Dodaj zdjęcie z kilku stron (kapelusz, spód, trzon) — łatwiej będzie Ci pomóc.</Banner>
        </View>
      ) : null}
      {kind === 'ask' && hint && hint.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          <Banner tone="info" icon="analytics">Do wpisu dołączymy podpowiedź aplikacji z wyniku rozpoznawania.</Banner>
        </View>
      ) : null}

      <Text style={styles.label}>TYTUŁ</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder={kind === 'ask' ? 'np. Co to za grzyb pod świerkiem?' : 'np. Rekordowy prawdziwek!'} placeholderTextColor={colors.textMute} selectionColor={colors.gold} style={styles.input} maxLength={90} />

      <Text style={styles.label}>OPIS</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={kind === 'ask' ? 'Gdzie go znalazłeś? Jak pachnie, jak wygląda spód kapelusza?' : 'Opowiedz o swoim znalezisku…'}
        placeholderTextColor={colors.textMute}
        multiline
        selectionColor={colors.gold}
        style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]}
      />

      <View style={{ marginTop: 26 }}>
        <Button label="Opublikuj" icon="send" size="lg" onPress={publish} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.4, color: colors.gold, marginTop: 22, marginBottom: 10 },
  input: { fontFamily: fonts.body, fontSize: 15.5, color: colors.text, paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.md, backgroundColor: 'rgba(246,242,221,0.06)', borderWidth: 1, borderColor: colors.line },
});
