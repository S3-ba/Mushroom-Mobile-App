import { Stack } from 'expo-router';
import { colors } from '@/theme';

// Keeps `index` at the bottom of the stack, even when a child screen is opened from another tab.
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }} />;
}
