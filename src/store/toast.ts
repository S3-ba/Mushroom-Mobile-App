import { create } from 'zustand';

interface ToastState {
  message: string | null;
  tone: 'ok' | 'warn';
  seq: number;
  show: (message: string, tone?: 'ok' | 'warn') => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'ok',
  seq: 0,
  show: (message, tone = 'ok') => set((s) => ({ message, tone, seq: s.seq + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = (message: string, tone: 'ok' | 'warn' = 'ok') => useToast.getState().show(message, tone);
