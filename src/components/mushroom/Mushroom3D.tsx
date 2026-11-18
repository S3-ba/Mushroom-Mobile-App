import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, PanResponder, StyleSheet, Text, View } from 'react-native';
import type { Mushroom } from '@/data/types';
import { colors, fonts, radius } from '@/theme';
import { clamp } from '@/utils/format';
import { Icon } from '../ui/Icon';
import { MushroomIllustration } from './MushroomIllustration';
import type { Controls3D } from './Scene3D';

// Lazy: expo-gl / three are only evaluated when a 3D model is actually opened.
const Scene3D = lazy(() => import('./Scene3D'));

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('3D viewer failed – showing the 2D illustration instead', e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Interactive 3D model: drag to rotate, pinch to zoom, auto-rotates when idle. */
export function Mushroom3D({ m, height = 300 }: { m: Mushroom; height?: number }) {
  const controls = useRef<Controls3D>({ ry: 0.7, rx: 0.12, zoom: 1, lastTouch: 0 });
  const [ready, setReady] = useState(false);

  // let the screen transition finish before creating the GL context
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  const pan = useMemo(() => {
    let lx = 0, ly = 0, ld = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        lx = 0; ly = 0; ld = 0;
        controls.current.lastTouch = Date.now();
      },
      onPanResponderMove: (e, g) => {
        const c = controls.current;
        c.lastTouch = Date.now();
        const t = e.nativeEvent.touches;
        if (t.length >= 2) {
          const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
          if (ld) c.zoom = clamp(c.zoom * (d / ld), 0.7, 1.9);
          ld = d; lx = g.dx; ly = g.dy;
          return;
        }
        ld = 0;
        c.ry += (g.dx - lx) * 0.011;
        c.rx = clamp(c.rx + (g.dy - ly) * 0.007, -0.5, 0.9);
        lx = g.dx; ly = g.dy;
      },
      onPanResponderRelease: () => {
        controls.current.lastTouch = Date.now();
      },
    });
  }, []);

  const fallback = (
    <View style={styles.center}>
      <MushroomIllustration spec={m.model} size="62%" />
    </View>
  );

  return (
    <View style={[styles.wrap, { height }]}>
      <Boundary fallback={fallback}>
        {ready ? (
          <Suspense fallback={<Loader />}>
            <Scene3D spec={m.model} seed={m.id.length} controls={controls} bg={colors.surface} />
          </Suspense>
        ) : (
          <Loader />
        )}
      </Boundary>
      {/* transparent overlay that owns the touches (the GL view itself must not steal them) */}
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
      <View pointerEvents="none" style={styles.hint}>
        <Icon name="hand-left-outline" size={14} color={colors.textMute} />
        <Text style={styles.hintText}>Obracaj palcem · szczypnij, by przybliżyć</Text>
      </View>
    </View>
  );
}

function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 26, borderRadius: radius.pill, backgroundColor: 'rgba(20,25,6,0.55)' },
  hintText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textMute },
});
