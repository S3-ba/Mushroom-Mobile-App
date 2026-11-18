import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  accepted: boolean;
  checklist: Record<string, boolean>;
  quizBest: number; // best score in %
  quizPlayed: number;
  packDone: string[]; // species ids whose photos are cached offline
  accept: () => void;
  toggleCheck: (id: string) => void;
  resetChecklist: () => void;
  saveQuiz: (percent: number) => void;
  markPack: (ids: string[]) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      accepted: false,
      checklist: {},
      quizBest: 0,
      quizPlayed: 0,
      packDone: [],
      accept: () => set({ accepted: true }),
      toggleCheck: (id) => set((s) => ({ checklist: { ...s.checklist, [id]: !s.checklist[id] } })),
      resetChecklist: () => set({ checklist: {} }),
      saveQuiz: (percent) => set((s) => ({ quizBest: Math.max(s.quizBest, percent), quizPlayed: s.quizPlayed + 1 })),
      markPack: (ids) => set((s) => ({ packDone: Array.from(new Set([...s.packDone, ...ids])) })),
    }),
    { name: 'settings-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
