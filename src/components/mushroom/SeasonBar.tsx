import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/theme';
import { MONTHS_SHORT } from '@/utils/format';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const W = 320;
const BW = 20;
const GAP = (W - 12 * BW) / 11;
const BASE = 58;

function Bar({ i, on, now }: { i: number; on: boolean; now: boolean }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(i * 35, withTiming(on ? 46 : 8, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [on, i, h]);
  const props = useAnimatedProps(() => ({ height: h.value, y: BASE - h.value }));
  return (
    <AnimatedRect
      x={i * (BW + GAP)}
      width={BW}
      rx={6}
      fill={on ? colors.gold : 'rgba(246,242,221,0.12)'}
      stroke={now ? colors.text : 'none'}
      strokeWidth={now ? 1.6 : 0}
      animatedProps={props}
    />
  );
}

/** 12-month fruiting calendar (react-native-svg); the current month is outlined. */
export function SeasonBar({ months, current = new Date().getMonth() + 1 }: { months: number[]; current?: number }) {
  return (
    <Svg width="100%" height={86} viewBox={`0 0 ${W} 86`}>
      {Array.from({ length: 12 }, (_, i) => (
        <Bar key={i} i={i} on={months.includes(i + 1)} now={current === i + 1} />
      ))}
      {MONTHS_SHORT.map((m, i) => (
        <SvgText key={m} x={i * (BW + GAP) + BW / 2} y={78} fontSize={9.5} textAnchor="middle" fill={current === i + 1 ? colors.text : colors.textMute}>
          {m}
        </SvgText>
      ))}
    </Svg>
  );
}
