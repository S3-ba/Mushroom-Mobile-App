import type { Edibility } from '@/data/types';

export const EDIBILITY: Record<Edibility, { label: string; fg: string; bg: string; icon: string }> = {
  edible: { label: 'Jadalny', fg: '#A6E36E', bg: 'rgba(166,227,110,0.14)', icon: 'checkmark-circle' },
  conditional: { label: 'Warunkowo jadalny', fg: '#FFC247', bg: 'rgba(255,194,71,0.14)', icon: 'flame' },
  inedible: { label: 'Niejadalny', fg: '#C9C3B0', bg: 'rgba(201,195,176,0.14)', icon: 'close-circle' },
  poisonous: { label: 'Trujący', fg: '#FF8A5B', bg: 'rgba(255,138,91,0.16)', icon: 'warning' },
  deadly: { label: 'Śmiertelnie trujący', fg: '#FF4D5E', bg: 'rgba(255,77,94,0.18)', icon: 'skull' },
};

export const EDIBILITY_ORDER: Edibility[] = ['edible', 'conditional', 'inedible', 'poisonous', 'deadly'];

export const isDangerous = (e: Edibility) => e === 'poisonous' || e === 'deadly';
