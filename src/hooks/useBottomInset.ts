import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR } from '@/theme';

/** Space to keep free at the bottom of a screen so content is not hidden by the floating tab bar. */
export function useBottomInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR.height + TAB_BAR.margin + insets.bottom + 20;
}
