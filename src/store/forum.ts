import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uid } from '@/utils/format';

export interface ForumComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  likes: number;
  liked: boolean;
  speciesId?: string; // species suggested by the commenter
  mine?: boolean;
}

export interface ForumPost {
  id: string;
  kind: 'ask' | 'brag';
  author: string;
  title: string;
  text: string;
  createdAt: number;
  photoUri?: string; // user's photo
  demoSpeciesId?: string; // seed posts borrow the atlas photo of a species
  likes: number;
  liked: boolean;
  comments: ForumComment[];
  solvedSpeciesId?: string;
  hint?: { speciesId: string; percent: number }[]; // suggestions from the offline recognizer
  mine?: boolean;
  demo?: boolean;
}

const H = 3600 * 1000;
const now = Date.now();

// Demo content so that the forum is not empty on first launch.
// The data layer is isolated in this store – swap it for a backend (Supabase/Firebase) without touching the UI.
const SEED: ForumPost[] = [
  {
    id: 'seed-1', kind: 'ask', author: 'Kasia_z_Beskidów', demo: true, demoSpeciesId: 'goryczak-zolciowy', createdAt: now - 5 * H,
    title: 'Co to za grzyb? Pod świerkami, brązowy kapelusz',
    text: 'Znalazłam pod starym świerkiem, kapelusz ok. 10 cm. Wygląda jak prawdziwek, ale rurki robią się różowawe. Jadalny?',
    likes: 6, liked: false,
    comments: [
      { id: 'c1', author: 'Marek_Leśnik', text: 'Różowiejące rurki i ciemna siateczka na trzonie — to goryczak żółciowy. Nie jest trujący, ale jest bardzo gorzki i zepsuje całą potrawę.', createdAt: now - 4 * H, likes: 9, liked: false, speciesId: 'goryczak-zolciowy' },
      { id: 'c2', author: 'Ola_mykolog', text: 'Potwierdzam. Prawdziwek ma jasną siateczkę i białe, nierożowiejące rurki.', createdAt: now - 3 * H, likes: 4, liked: false },
    ],
    solvedSpeciesId: 'goryczak-zolciowy',
  },
  {
    id: 'seed-2', kind: 'brag', author: 'Tomek_Borowik', demo: true, demoSpeciesId: 'borowik-szlachetny', createdAt: now - 26 * H,
    title: 'Rekordowy prawdziwek! Kapelusz 22 cm 🍄',
    text: 'Dziś rano, bukowy las pod Krakowem. Jędrny, bez ani jednego robaka. Kosz pełny!',
    likes: 48, liked: false,
    comments: [
      { id: 'c3', author: 'Basia_Kurka', text: 'Piękny okaz! Zazdroszczę 😍', createdAt: now - 25 * H, likes: 3, liked: false },
    ],
  },
  {
    id: 'seed-3', kind: 'ask', author: 'Piotr_74', demo: true, demoSpeciesId: 'opienka-miodowa', createdAt: now - 50 * H,
    title: 'Opieńki czy coś groźnego? Kępa na pniu',
    text: 'Duża kępa na starym pniu liściastym. Chcę zrobić zupę, ale boję się pomyłki z hełmówką. Na co patrzeć?',
    likes: 12, liked: false,
    comments: [
      { id: 'c4', author: 'Ola_mykolog', text: 'Opieńki rosną w dużych kępach i mają białe zarodniki; hełmówka ma rdzawe i jest drobna. Zrób wysyp zarodników na kartce. I obgotuj dokładnie!', createdAt: now - 48 * H, likes: 15, liked: false, speciesId: 'opienka-miodowa' },
    ],
  },
  {
    id: 'seed-4', kind: 'brag', author: 'Basia_Kurka', demo: true, demoSpeciesId: 'pieprznik-jadalny', createdAt: now - 80 * H,
    title: 'Pierwsze kurki w tym roku',
    text: 'Mchy pod sosnami po deszczu. Pachną morelą!',
    likes: 31, liked: false, comments: [],
  },
];

interface ForumState {
  posts: ForumPost[];
  addPost: (p: { kind: 'ask' | 'brag'; title: string; text: string; photoUri?: string; hint?: ForumPost['hint'] }) => string;
  deletePost: (id: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string, speciesId?: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  markSolved: (postId: string, speciesId?: string) => void;
}

const flip = (liked: boolean, likes: number) => ({ liked: !liked, likes: likes + (liked ? -1 : 1) });

export const useForum = create<ForumState>()(
  persist(
    (set) => ({
      posts: SEED,
      addPost: (p) => {
        const id = uid();
        set((s) => ({ posts: [{ id, author: 'Ty', mine: true, createdAt: Date.now(), likes: 0, liked: false, comments: [], ...p }, ...s.posts] }));
        return id;
      },
      deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),
      toggleLike: (postId) => set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, ...flip(p.liked, p.likes) } : p)) })),
      addComment: (postId, text, speciesId) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, { id: uid(), author: 'Ty', mine: true, text, speciesId, createdAt: Date.now(), likes: 0, liked: false }] } : p,
          ),
        })),
      toggleCommentLike: (postId, commentId) =>
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: p.comments.map((c) => (c.id === commentId ? { ...c, ...flip(c.liked, c.likes) } : c)) } : p)),
        })),
      markSolved: (postId, speciesId) => set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, solvedSpeciesId: speciesId } : p)) })),
    }),
    { name: 'forum-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
