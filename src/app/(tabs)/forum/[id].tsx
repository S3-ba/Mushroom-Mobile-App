import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, SectionTitle } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Feedback';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { SpeciesPicker } from '@/components/ui/SpeciesPicker';
import { getMushroom } from '@/data/mushrooms';
import { Avatar, LikeButton, PostCard } from '@/features/forum/PostCard';
import { useForum, type ForumComment } from '@/store/forum';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';
import { timeAgo } from '@/utils/format';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const post = useForum((s) => s.posts.find((p) => p.id === id));
  const { toggleLike, addComment, toggleCommentLike, markSolved, deletePost } = useForum.getState();
  const [text, setText] = useState('');
  const [speciesId, setSpeciesId] = useState<string | undefined>();
  const [picker, setPicker] = useState(false);

  if (!post) {
    return (
      <Screen>
        <ScreenHeader back title="Wątek" />
        <EmptyState icon="chatbubbles-outline" title="Nie znaleziono wpisu" action="Wróć do forum" onAction={() => router.replace('/forum')} />
      </Screen>
    );
  }

  const send = () => {
    if (text.trim().length < 2 && !speciesId) {
      toast('Napisz odpowiedź lub wskaż gatunek', 'warn');
      return;
    }
    addComment(post.id, text.trim() || 'Moim zdaniem to ten gatunek:', speciesId);
    setText('');
    setSpeciesId(undefined);
    toast('Dodano odpowiedź');
  };

  const remove = () =>
    Alert.alert('Usunąć wpis?', 'Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          deletePost(post.id);
          router.replace('/forum');
        },
      },
    ]);

  const suggested = getMushroom(speciesId);

  return (
    <Screen>
      <ScreenHeader back title="Wątek" subtitle={`${post.comments.length} odpowiedzi`} />
      <PostCard post={post} full onLike={() => toggleLike(post.id)} />
      {post.mine ? (
        <View style={{ marginTop: 10 }}>
          <Button label="Usuń wpis" icon="trash-outline" variant="danger" size="sm" onPress={remove} style={{ alignSelf: 'flex-start' }} />
        </View>
      ) : null}

      <SectionTitle>Odpowiedzi ({post.comments.length})</SectionTitle>
      {post.comments.length === 0 ? <Text style={styles.empty}>Brak odpowiedzi — podziel się swoją wiedzą!</Text> : null}
      <View style={{ gap: 12 }}>
        {post.comments.map((c, i) => (
          <CommentRow
            key={c.id}
            c={c}
            index={i}
            canAccept={post.kind === 'ask' && !!post.mine && !!c.speciesId && post.solvedSpeciesId !== c.speciesId}
            accepted={!!c.speciesId && post.solvedSpeciesId === c.speciesId}
            onLike={() => toggleCommentLike(post.id, c.id)}
            onAccept={() => {
              markSolved(post.id, c.speciesId);
              toast('Oznaczono jako rozwiązane');
            }}
            onOpen={() => c.speciesId && router.navigate({ pathname: '/atlas/[id]', params: { id: c.speciesId } })}
          />
        ))}
      </View>

      <SectionTitle>Twoja odpowiedź</SectionTitle>
      <View style={styles.composer}>
        <TextInput value={text} onChangeText={setText} placeholder="Napisz, co to Twoim zdaniem jest i dlaczego…" placeholderTextColor={colors.textMute} multiline selectionColor={colors.gold} style={styles.input} />
        <View style={styles.composerRow}>
          <PressableScale onPress={() => setPicker(true)} style={[styles.speciesBtn, suggested && { backgroundColor: colors.goldDim, borderColor: colors.goldLine }]} accessibilityRole="button" accessibilityLabel="Wskaż gatunek">
            <Icon name="mushroom-outline" mci size={18} color={suggested ? colors.gold : colors.textDim} />
            <Text style={[styles.speciesText, suggested && { color: colors.gold }]} numberOfLines={1}>{suggested ? suggested.name : 'Wskaż gatunek'}</Text>
            {suggested ? (
              <PressableScale onPress={() => setSpeciesId(undefined)} haptic={false} accessibilityLabel="Usuń gatunek">
                <Icon name="close-circle" size={16} color={colors.gold} />
              </PressableScale>
            ) : null}
          </PressableScale>
          <View style={{ flex: 1 }} />
          <Button label="Wyślij" icon="send" size="sm" onPress={send} />
        </View>
      </View>

      <SpeciesPicker visible={picker} onClose={() => setPicker(false)} onPick={setSpeciesId} />
    </Screen>
  );
}

function CommentRow({ c, index, canAccept, accepted, onLike, onAccept, onOpen }: { c: ForumComment; index: number; canAccept: boolean; accepted: boolean; onLike: () => void; onAccept: () => void; onOpen: () => void }) {
  const m = getMushroom(c.speciesId);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(340)} style={[styles.comment, accepted && styles.commentOk]}>
      <Avatar name={c.author} size={34} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.cHead}>
          <Text style={styles.cAuthor}>{c.author}</Text>
          <Text style={styles.cTime}>{timeAgo(c.createdAt)}</Text>
          {accepted ? (
            <View style={styles.ok}>
              <Icon name="checkmark-circle" size={14} color={colors.ok} />
              <Text style={styles.okText}>Rozwiązanie</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cText}>{c.text}</Text>
        {m ? (
          <PressableScale onPress={onOpen} style={styles.species} accessibilityRole="button" accessibilityLabel={`Otwórz w atlasie: ${m.name}`}>
            <Icon name="mushroom" mci size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.spName}>{m.name}</Text>
              <Text style={styles.spLatin}>{m.latin}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textMute} />
          </PressableScale>
        ) : null}
        <View style={styles.cFoot}>
          <LikeButton liked={c.liked} count={c.likes} onPress={onLike} />
          {canAccept ? <Button label="To to!" icon="checkmark" size="sm" variant="secondary" onPress={onAccept} /> : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.body, fontSize: 14.5, color: colors.textMute },
  comment: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  commentOk: { borderColor: 'rgba(166,227,110,0.4)', backgroundColor: 'rgba(166,227,110,0.07)' },
  cHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cAuthor: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  cTime: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: radius.pill, backgroundColor: 'rgba(166,227,110,0.14)' },
  okText: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.ok },
  cText: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.textDim },
  species: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md, backgroundColor: colors.goldDim, borderWidth: 1, borderColor: colors.goldLine },
  spName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  spLatin: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', color: colors.textMute },
  cFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  composer: { gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  input: { fontFamily: fonts.body, fontSize: 15, color: colors.text, minHeight: 70, textAlignVertical: 'top', padding: 0 },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  speciesBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.06)', borderWidth: 1, borderColor: colors.line, maxWidth: 210 },
  speciesText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textDim, flexShrink: 1 },
});
