import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uid } from '@/utils/format';

export interface HarvestEntry {
  id: string;
  createdAt: number;
  speciesId: string;
  count: number;
  weightKg?: number;
  note?: string;
  photoUri?: string;
  lat?: number;
  lng?: number;
}

interface HarvestState {
  entries: HarvestEntry[];
  add: (e: Omit<HarvestEntry, 'id' | 'createdAt'> & { createdAt?: number }) => string;
  remove: (id: string) => void;
}

export const useHarvest = create<HarvestState>()(
  persist(
    (set) => ({
      entries: [],
      add: (e) => {
        const id = uid();
        set((s) => ({ entries: [{ ...e, id, createdAt: e.createdAt ?? Date.now() }, ...s.entries] }));
        return id;
      },
      remove: (id) => set((s) => ({ entries: s.entries.filter((x) => x.id !== id) })),
    }),
    { name: 'harvest-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
