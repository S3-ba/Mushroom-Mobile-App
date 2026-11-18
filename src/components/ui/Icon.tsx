import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

interface Props {
  name: string;
  size?: number;
  color?: string;
  /** use MaterialCommunityIcons instead of Ionicons */
  mci?: boolean;
}

export function Icon({ name, size = 22, color = colors.text, mci }: Props) {
  const Comp: any = mci ? MaterialCommunityIcons : Ionicons;
  return <Comp name={name} size={size} color={color} />;
}
