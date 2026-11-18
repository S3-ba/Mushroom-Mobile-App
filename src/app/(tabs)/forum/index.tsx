import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Chip, IconButton } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Feedback';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { PostCard } from '@/features/forum/PostCard';
import { useForum } from '@/store/forum';

type Filter = 'all' | 'ask' | 'brag' | 'solved';

export default function ForumScreen() {
  const router = useRouter();
  const posts = useForum((s) => s.posts);
  const toggleLike = useForum((s) => s.toggleLike);
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(
    () =>
      posts.filter((p) => (filter === 'all' ? true : filter === 'solved' ? !!p.solvedSpeciesId : p.kind === filter)).sort((a, b) => b.createdAt - a.createdAt),
    [posts, filter],
  );

  return (
    <Screen>
      <ScreenHeader title="Forum" subtitle="Pytaj i chwal się znaleziskami" right={<IconButton icon="create" tone="gold" label="Nowy wpis" onPress={() => router.push('/forum/new')} />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20, marginBottom: 14 }}>
        <View style={{ width: 12 }} />
        <Chip label="Wszystkie" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Co to za grzyb?" icon="help-circle" active={filter === 'ask'} onPress={() => setFilter('ask')} />
        <Chip label="Pochwały" icon="trophy" active={filter === 'brag'} onPress={() => setFilter('brag')} />
        <Chip label="Rozwiązane" icon="checkmark-circle" active={filter === 'solved'} onPress={() => setFilter('solved')} />
        <View style={{ width: 12 }} />
      </ScrollView>

      {list.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="Brak wpisów" text="Bądź pierwszy — zapytaj o grzyba albo pochwal się okazem." action="Nowy wpis" onAction={() => router.push('/forum/new')} />
      ) : (
        <View style={{ gap: 14 }}>
          {list.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(Math.min(i, 6) * 60).duration(380)} layout={LinearTransition.springify().damping(20)}>
              <PostCard post={p} onPress={() => router.push({ pathname: '/forum/[id]', params: { id: p.id } })} onLike={() => toggleLike(p.id)} />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}
