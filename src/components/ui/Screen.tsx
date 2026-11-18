import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomInset } from '@/hooks/useBottomInset';
import { colors, fonts } from '@/theme';
import { IconButton } from './Controls';
import { OfflinePill } from './Feedback';
import { MushroomLogo } from './MushroomLogo';
import { PressableScale } from './PressableScale';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Common screen shell: gradient background, safe areas and room for the floating tab bar. */
export function Screen({ children, scroll = true, padded = true, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottom = useBottomInset();
  const pad = padded ? 20 : 0;
  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgAlt, colors.bg]} style={StyleSheet.absoluteFill} />
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingTop: insets.top + 10, paddingBottom: bottom, paddingHorizontal: pad }, contentStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: insets.top + 10, paddingHorizontal: pad }, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** show a back arrow instead of the brand button */
  back?: boolean;
}

export function ScreenHeader({ title, subtitle, right, back }: HeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton icon="chevron-back" label="Wstecz" onPress={() => router.back()} />
      ) : (
        <PressableScale onPress={() => router.navigate('/')} accessibilityRole="button" accessibilityLabel="Strona główna" style={styles.brand}>
          <MushroomLogo size={26} />
        </PressableScale>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <OfflinePill />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  brand: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.goldLine },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMute, marginTop: -2 },
});
