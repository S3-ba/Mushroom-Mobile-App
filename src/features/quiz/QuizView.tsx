import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button, ProgressBar } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme';
import { newRound, QUESTIONS, ROUND_SIZE, type RoundQuestion } from './questions';

type Phase = 'intro' | 'play' | 'result';

export function QuizView() {
  const bottom = useBottomInset();
  const best = useSettings((s) => s.quizBest);
  const played = useSettings((s) => s.quizPlayed);
  const saveQuiz = useSettings((s) => s.saveQuiz);
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState<RoundQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const start = () => {
    setRound(newRound());
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setPhase('play');
  };

  const answered = (ok: boolean) => {
    if (ok) {
      setScore(score + 1);
      setStreak(streak + 1);
      setBestStreak(Math.max(bestStreak, streak + 1));
    } else setStreak(0);
  };

  const finish = (finalScore: number) => {
    saveQuiz(Math.round((finalScore / round.length) * 100));
    setPhase('result');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: bottom }}>
      {phase === 'intro' ? <Intro best={best} played={played} onStart={start} /> : null}
      {phase === 'play' ? <Play round={round} score={score} streak={streak} onAnswer={answered} onFinish={finish} /> : null}
      {phase === 'result' ? <Result score={score} total={round.length} streak={bestStreak} best={best} onAgain={start} /> : null}
    </ScrollView>
  );
}

function Intro({ best, played, onStart }: { best: number; played: number; onStart: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
      <View style={styles.heroIcon}>
        <Icon name="trophy" size={34} color={colors.gold} />
      </View>
      <Text style={styles.heroTitle}>Quiz grzybiarza</Text>
      <Text style={styles.heroText}>
        {ROUND_SIZE} losowych pytań z puli {QUESTIONS.length}: bezpieczeństwo, rozpoznawanie, sezon i zasady zbierania. Po każdej odpowiedzi dowiesz się, dlaczego.
      </Text>
      <View style={styles.stats}>
        <Stat label="Najlepszy wynik" value={played ? `${best}%` : '—'} />
        <Stat label="Rozegrane rundy" value={String(played)} />
      </View>
      <Button label="Zaczynamy" icon="play" size="lg" onPress={onStart} style={{ alignSelf: 'stretch' }} />
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Play({ round, score, streak, onAnswer, onFinish }: { round: RoundQuestion[]; score: number; streak: number; onAnswer: (ok: boolean) => void; onFinish: (score: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = round[i];
  const last = i === round.length - 1;
  const revealed = picked !== null;

  const pick = (idx: number) => {
    if (revealed) return;
    setPicked(idx);
    const ok = idx === q.correct;
    onAnswer(ok);
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  const next = () => {
    if (last) {
      onFinish(score);
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Pytanie {i + 1} z {round.length}</Text>
          {streak >= 2 ? (
            <Animated.View key={streak} entering={ZoomIn.springify()} style={styles.streak}>
              <Icon name="flame" size={14} color={colors.gold} />
              <Text style={styles.streakText}>{streak} z rzędu</Text>
            </Animated.View>
          ) : null}
        </View>
        <ProgressBar value={(i + (revealed ? 1 : 0)) / round.length} />
      </View>

      <Animated.View key={i} entering={FadeInDown.duration(380)} style={styles.qCard}>
        <Text style={styles.q}>{q.q}</Text>
      </Animated.View>

      <View style={{ gap: 10 }}>
        {q.options.map((o, idx) => (
          <Option
            key={`${i}-${idx}`}
            index={idx}
            label={o}
            status={!revealed ? 'idle' : idx === q.correct ? 'correct' : idx === picked ? 'wrong' : 'dim'}
            onPress={() => pick(idx)}
          />
        ))}
      </View>

      {revealed ? (
        <Animated.View entering={FadeInDown.duration(320)} style={[styles.explain, picked === q.correct ? styles.explainOk : styles.explainBad]}>
          <Icon name={picked === q.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={picked === q.correct ? colors.ok : colors.danger} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.explainTitle}>{picked === q.correct ? 'Dobrze!' : 'Niestety nie'}</Text>
            <Text style={styles.explainText}>{q.explain}</Text>
          </View>
        </Animated.View>
      ) : null}

      {revealed ? <Button label={last ? 'Zobacz wynik' : 'Dalej'} icon={last ? 'flag' : 'arrow-forward'} onPress={next} size="lg" /> : null}
    </View>
  );
}

type OptStatus = 'idle' | 'correct' | 'wrong' | 'dim';

function Option({ index, label, status, onPress }: { index: number; label: string; status: OptStatus; onPress: () => void }) {
  const tone = useSharedValue(0);
  const x = useSharedValue(0);
  useEffect(() => {
    tone.value = withTiming(status === 'correct' ? 1 : status === 'wrong' ? 2 : 0, { duration: 260 });
    if (status === 'wrong') x.value = withSequence(withTiming(-8, { duration: 50 }), withRepeat(withTiming(8, { duration: 80 }), 4, true), withTiming(0, { duration: 50 }));
  }, [status, tone, x]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    backgroundColor: interpolateColor(tone.value, [0, 1, 2], ['rgba(246,242,221,0.06)', 'rgba(166,227,110,0.18)', 'rgba(255,90,82,0.18)']),
    borderColor: interpolateColor(tone.value, [0, 1, 2], [colors.line, colors.ok, colors.danger]),
    opacity: status === 'dim' ? 0.5 : 1,
  }));
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(340)}>
      <PressableScale onPress={onPress} haptic={status === 'idle'} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={label}>
        <Animated.View style={[styles.option, style]}>
          <View style={[styles.letter, status === 'correct' && { backgroundColor: colors.ok }, status === 'wrong' && { backgroundColor: colors.danger }]}>
            <Text style={[styles.letterText, (status === 'correct' || status === 'wrong') && { color: colors.ink }]}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={styles.optionText}>{label}</Text>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

function Result({ score, total, streak, best, onAgain }: { score: number; total: number; streak: number; best: number; onAgain: () => void }) {
  const router = useRouter();
  const pct = Math.round((score / total) * 100);
  const msg = pct === 100 ? 'Mistrz grzybobrania! 🍄' : pct >= 75 ? 'Świetnie — jesteś na dobrej drodze.' : pct >= 50 ? 'Nieźle! Zajrzyj do poradnika, by utrwalić wiedzę.' : 'Warto powtórzyć zasady bezpieczeństwa z poradnika.';
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.scoreRing}>
        <Text style={styles.scoreText}>{score}/{total}</Text>
        <Text style={styles.scorePct}>{pct}%</Text>
      </Animated.View>
      <Text style={styles.heroTitle}>{msg}</Text>
      <View style={styles.stats}>
        <Stat label="Najlepsza passa" value={String(streak)} />
        <Stat label="Rekord" value={`${Math.max(best, pct)}%`} />
      </View>
      <View style={{ gap: 10, alignSelf: 'stretch' }}>
        <Button label="Zagraj ponownie" icon="refresh" size="lg" onPress={onAgain} />
        <Button label="Otwórz poradnik" icon="book" variant="secondary" onPress={() => router.navigate({ pathname: '/learn', params: { tab: 'guide' } })} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 16, padding: 22, borderRadius: radius.xl, backgroundColor: 'rgba(246,242,221,0.05)', borderWidth: 1, borderColor: colors.line, marginTop: 6 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.text, textAlign: 'center' },
  heroText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textDim, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, backgroundColor: 'rgba(246,242,221,0.05)' },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.gold },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMute, marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textDim },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: colors.goldDim },
  streakText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.gold },
  qCard: { padding: 20, borderRadius: radius.xl, backgroundColor: colors.olive, borderWidth: 1, borderColor: colors.goldLine },
  q: { fontFamily: fonts.display, fontSize: 21, lineHeight: 28, color: colors.text },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1.5 },
  letter: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(246,242,221,0.1)', alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textDim },
  optionText: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, lineHeight: 21, color: colors.text },
  explain: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1 },
  explainOk: { backgroundColor: 'rgba(166,227,110,0.10)', borderColor: 'rgba(166,227,110,0.35)' },
  explainBad: { backgroundColor: 'rgba(255,90,82,0.10)', borderColor: 'rgba(255,90,82,0.35)' },
  explainTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  explainText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textDim },
  scoreRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldDim },
  scoreText: { fontFamily: fonts.display, fontSize: 38, color: colors.text },
  scorePct: { fontFamily: fonts.bold, fontSize: 14, color: colors.gold, marginTop: -4 },
});
