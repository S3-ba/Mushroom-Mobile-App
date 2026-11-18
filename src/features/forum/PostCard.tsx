import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { MushroomPhoto } from '@/components/mushroom/MushroomPhoto';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { getMushroom } from '@/data/mushrooms';
import type { ForumPost } from '@/store/forum';
import { colors, fonts, radius } from '@/theme';
import { timeAgo } from '@/utils/format';

const AVATARS = ['#56640F', '#7C8E24', '#8A6A1E', '#4C5A2E', '#6B5A12'];
const avatarColor = (name: string) => AVATARS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATARS.length];

export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.goldLine }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.42, color: colors.text }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

/** Heart with a springy "pop" – the forum's like button (for posts and comments). */
export function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <PressableScale
      haptic={false}
      scaleTo={0.9}
      onPress={() => {
        if (!liked) {
          s.value = withSequence(withSpring(1.4, { damping: 6, stiffness: 420 }), withSpring(1, { damping: 10 }));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress();
      }}
      style={styles.like}
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Cofnij polubienie' : 'Polub'}
    >
      <Animated.View style={style}>
        <Icon name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.danger : colors.textDim} />
      </Animated.View>
      <Text style={[styles.likeCount, liked && { color: colors.danger }]}>{count}</Text>
    </PressableScale>
  );
}

interface Props {
  post: ForumPost;
  full?: boolean;
  onPress?: () => void;
  onLike: () => void;
}

export function PostCard({ post, full, onPress, onLike }: Props) {
  const demo = getMushroom(post.demoSpeciesId);
  const solved = getMushroom(post.solvedSpeciesId);
  const Wrapper: any = onPress ? PressableScale : View;
  return (
    <Wrapper onPress={onPress} scaleTo={0.985} style={styles.card} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={styles.head}>
        <Avatar name={post.author} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.author}>{post.author}</Text>
            {post.demo ? <Text style={styles.demo}>przykład</Text> : null}
          </View>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={[styles.kind, post.kind === 'brag' && { backgroundColor: colors.goldDim }]}>
          <Icon name={post.kind === 'ask' ? 'help-circle' : 'trophy'} size={13} color={post.kind === 'ask' ? colors.textDim : colors.gold} />
          <Text style={[styles.kindText, post.kind === 'brag' && { color: colors.gold }]}>{post.kind === 'ask' ? 'Co to za grzyb?' : 'Pochwała'}</Text>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      {post.text ? <Text style={styles.text} numberOfLines={full ? undefined : 2}>{post.text}</Text> : null}

      {post.photoUri || demo ? (
        <View style={[styles.photo, { height: full ? 260 : 190 }]}>
          {post.photoUri ? <Image source={{ uri: post.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : demo ? <MushroomPhoto m={demo} variant="hero" style={StyleSheet.absoluteFill} /> : null}
        </View>
      ) : null}

      {post.hint && post.hint.length > 0 ? (
        <View style={styles.hint}>
          <Icon name="analytics" size={15} color={colors.gold} />
          <Text style={styles.hintText} numberOfLines={full ? undefined : 2}>
            Podpowiedź aplikacji: {post.hint.map((h) => `${getMushroom(h.speciesId)?.name ?? h.speciesId} (${h.percent}%)`).join(' · ')}
          </Text>
        </View>
      ) : null}

      <View style={styles.foot}>
        <LikeButton liked={post.liked} count={post.likes} onPress={onLike} />
        <View style={styles.like}>
          <Icon name="chatbubble-outline" size={19} color={colors.textDim} />
          <Text style={styles.likeCount}>{post.comments.length}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {solved ? (
          <View style={styles.solved}>
            <Icon name="checkmark-circle" size={15} color={colors.ok} />
            <Text style={styles.solvedText} numberOfLines={1}>{solved.name}</Text>
          </View>
        ) : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  author: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  demo: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textMute, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: 'rgba(246,242,221,0.08)', overflow: 'hidden' },
  time: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 26, borderRadius: radius.pill, backgroundColor: 'rgba(246,242,221,0.08)' },
  kindText: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.textDim },
  title: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25, color: colors.text },
  text: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.textDim },
  photo: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  hint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 10, borderRadius: radius.md, backgroundColor: colors.goldDim },
  hintText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17, color: colors.goldSoft },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  like: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { fontFamily: fonts.bold, fontSize: 14, color: colors.textDim },
  solved: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(166,227,110,0.14)', maxWidth: 190 },
  solvedText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ok },
});
