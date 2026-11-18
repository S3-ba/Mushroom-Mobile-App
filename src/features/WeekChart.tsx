import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const W = 300;
const BASE = 84;
const MAXH = 64;

function Bar({ i, value, max, today, slot, bw }: { i: number; value: number; max: number; today: boolean; slot: number; bw: number }) {
  const h = useSharedValue(0);
  const target = value === 0 ? 4 : Math.max(10, (value / max) * MAXH);
  useEffect(() => {
    h.value = withDelay(i * 60, withTiming(target, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [target, i, h]);
  const props = useAnimatedProps(() => ({ height: h.value, y: BASE - h.value }));
  return <AnimatedRect x={i * slot + (slot - bw) / 2} width={bw} rx={7} fill={value === 0 ? 'rgba(246,242,221,0.12)' : today ? colors.gold : colors.oliveSoft} animatedProps={props} />;
}

/** 7-day bar chart (react-native-svg) – the last bar is today. */
export function WeekChart({ data }: { data: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const slot = W / data.length;
  const bw = Math.min(30, slot - 12);
  return (
    <Svg width="100%" height={116} viewBox={`0 0 ${W} 116`}>
      {data.map((d, i) => (
        <Bar key={d.key} i={i} value={d.count} max={max} today={i === data.length - 1} slot={slot} bw={bw} />
      ))}
      {data.map((d, i) => (
        <SvgText key={`v${d.key}`} x={i * slot + slot / 2} y={BASE - (d.count === 0 ? 4 : Math.max(10, (d.count / max) * MAXH)) - 6} fontSize={11} fontWeight="bold" textAnchor="middle" fill={d.count ? colors.text : 'transparent'}>
          {d.count}
        </SvgText>
      ))}
      {data.map((d, i) => (
        <SvgText key={`l${d.key}`} x={i * slot + slot / 2} y={104} fontSize={11} textAnchor="middle" fill={i === data.length - 1 ? colors.text : colors.textMute}>
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}
