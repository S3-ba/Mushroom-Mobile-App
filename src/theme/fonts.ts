import { useFonts } from 'expo-font';
import * as DMSans from '@expo-google-fonts/dm-sans';
import * as Fraunces from '@expo-google-fonts/fraunces';

// Fonts are bundled with the app (npm packages), so they work offline.
// Missing exports are filtered out so that a renamed font never crashes the app.
const map: Record<string, unknown> = {
  DMSans_400Regular: DMSans.DMSans_400Regular,
  DMSans_500Medium: DMSans.DMSans_500Medium,
  DMSans_700Bold: DMSans.DMSans_700Bold,
  Fraunces_600SemiBold: Fraunces.Fraunces_600SemiBold,
  Fraunces_700Bold: Fraunces.Fraunces_700Bold,
};
const available = Object.fromEntries(Object.entries(map).filter(([, v]) => !!v)) as Record<string, any>;

/** true when the fonts are loaded (or failed — the system font is used then). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(available);
  return loaded || !!error;
}
