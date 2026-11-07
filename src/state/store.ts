import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addDays, computeStreak, dateKey } from '../lib/dates';

export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 20 * 60 * 1000;
export const FREEZE_PRICE = 60;
export const REFILL_PRICE = 30;

export type LessonProgress = { done: number; best: number; xp: number; last: number };
export type Mistake = { lessonId: string; idx: number; count: number; last: number };
export type Quest = { id: string; kind: QuestKind; target: number; progress: number; reward: number; claimed: boolean };
export type QuestKind = 'xp' | 'lessons' | 'perfect' | 'combo' | 'practice' | 'correct';

export type Settings = {
  sound: boolean;
  haptics: boolean;
  hearts: boolean;
  freeMode: boolean;
  notifications: boolean;
  reminderHour: number;
  reminderMinute: number;
  riskReminder: boolean;
  dailyGoal: number;
  section: string;
};

export type Stats = {
  lessonsDone: number;
  perfect: number;
  answers: number;
  correct: number;
  bestCombo: number;
  timeMs: number;
  practiceDone: number;
  nightOwl: number; // lessons after 23h
  earlyBird: number; // lessons before 7h
};

export type CompleteInput = {
  lessonId: string | null; // null for practice
  correct: number;
  total: number;
  bestCombo: number;
  durationMs: number;
  practice?: boolean;
  /** sub-lesson index and how many the lesson has */
  part?: number;
  partsTotal?: number;
};

export type CompleteSummary = {
  xp: number;
  gems: number;
  accuracy: number;
  perfect: boolean;
  streakBefore: number;
  streakAfter: number;
  goalReachedNow: boolean;
  levelBefore: number;
  levelAfter: number;
  newAchievements: string[];
  /** set for path lessons: which sub-lesson was finished and whether the whole lesson is now done */
  part?: { index: number; total: number; lessonDone: boolean };
};

type State = {
  name: string;
  onboarded: boolean;
  xp: number;
  gems: number;
  hearts: number;
  heartsAt: number;
  freezes: number;
  frozenDays: string[];
  days: Record<string, number>;
  lessons: Record<string, LessonProgress>;
  /** sub-lessons finished in lessons not completed yet */
  parts: Record<string, number>;
  mistakes: Record<string, Mistake>;
  achievements: Record<string, number>;
  quests: { date: string; list: Quest[] };
  stats: Stats;
  settings: Settings;
  lastOpen: string;
};

type Actions = {
  setName: (n: string) => void;
  setOnboarded: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  currentHearts: () => number;
  loseHeart: () => void;
  refillHearts: (paid: boolean) => boolean;
  gainHeart: () => void;
  buyFreeze: () => boolean;
  recordAnswer: (lessonId: string, idx: number, correct: boolean) => void;
  completeLesson: (i: CompleteInput) => CompleteSummary;
  ensureDaily: () => void;
  claimQuest: (id: string) => void;
  resetAll: () => void;
};

export function levelFromXp(xp: number): { level: number; base: number; next: number } {
  let level = 1;
  let need = 60;
  let base = 0;
  while (xp >= base + need) {
    base += need;
    level++;
    need = Math.round(60 + (level - 1) * 40);
  }
  return { level, base, next: base + need };
}

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  hearts: true,
  freeMode: false,
  notifications: true,
  reminderHour: 19,
  reminderMinute: 0,
  riskReminder: true,
  dailyGoal: 50,
  section: 'fund',
};

const DEFAULT_STATS: Stats = { lessonsDone: 0, perfect: 0, answers: 0, correct: 0, bestCombo: 0, timeMs: 0, practiceDone: 0, nightOwl: 0, earlyBird: 0 };

function initial(): State {
  return {
    name: 'Engenheiro(a)',
    onboarded: false,
    xp: 0,
    gems: 100,
    hearts: MAX_HEARTS,
    heartsAt: Date.now(),
    freezes: 1,
    frozenDays: [],
    days: {},
    lessons: {},
    parts: {},
    mistakes: {},
    achievements: {},
    quests: { date: '', list: [] },
    stats: { ...DEFAULT_STATS },
    settings: { ...DEFAULT_SETTINGS },
    lastOpen: '',
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function makeQuests(date: string, goal: number): Quest[] {
  const h = hashStr(date);
  const pool: Omit<Quest, 'progress' | 'claimed'>[] = [
    { id: 'xp', kind: 'xp', target: Math.max(30, goal), reward: 15 },
    { id: 'lessons', kind: 'lessons', target: 2 + (h % 2), reward: 15 },
    { id: 'perfect', kind: 'perfect', target: 1, reward: 20 },
    { id: 'combo', kind: 'combo', target: 5 + (h % 3) * 2, reward: 15 },
    { id: 'practice', kind: 'practice', target: 1, reward: 15 },
    { id: 'correct', kind: 'correct', target: 15 + (h % 3) * 5, reward: 15 },
  ];
  // first quest always XP; pick 2 others deterministically
  const others = pool.slice(1);
  const a = others[h % others.length];
  const rest = others.filter((q) => q.id !== a.id);
  const b = rest[(h >> 4) % rest.length];
  return [pool[0], a, b].map((q) => ({ ...q, progress: 0, claimed: false }));
}

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),
      setName: (n) => set({ name: n.trim() || 'Engenheiro(a)' }),
      setOnboarded: () => set({ onboarded: true }),
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),

      currentHearts: () => {
        const { hearts, heartsAt, settings } = get();
        if (!settings.hearts) return MAX_HEARTS;
        if (hearts >= MAX_HEARTS) return MAX_HEARTS;
        const gained = Math.floor((Date.now() - heartsAt) / HEART_REGEN_MS);
        return Math.min(MAX_HEARTS, hearts + gained);
      },
      loseHeart: () => {
        if (!get().settings.hearts) return;
        const cur = get().currentHearts();
        const now = Date.now();
        // keep regen timer progress when below max
        const { hearts, heartsAt } = get();
        let at = now;
        if (hearts < MAX_HEARTS) {
          const gained = Math.floor((now - heartsAt) / HEART_REGEN_MS);
          at = heartsAt + gained * HEART_REGEN_MS;
        }
        set({ hearts: Math.max(0, cur - 1), heartsAt: cur >= MAX_HEARTS ? now : at });
      },
      gainHeart: () => {
        const cur = get().currentHearts();
        set({ hearts: Math.min(MAX_HEARTS, cur + 1), heartsAt: Date.now() });
      },
      refillHearts: (paid) => {
        if (paid) {
          if (get().gems < REFILL_PRICE) return false;
          set({ gems: get().gems - REFILL_PRICE });
        }
        set({ hearts: MAX_HEARTS, heartsAt: Date.now() });
        return true;
      },
      buyFreeze: () => {
        const { gems, freezes } = get();
        if (gems < FREEZE_PRICE || freezes >= 2) return false;
        set({ gems: gems - FREEZE_PRICE, freezes: freezes + 1 });
        return true;
      },

      recordAnswer: (lessonId, idx, correct) => {
        const key = `${lessonId}#${idx}`;
        const m = { ...get().mistakes };
        if (correct) {
          if (m[key]) {
            m[key] = { ...m[key], count: m[key].count - 1 };
            if (m[key].count <= 0) delete m[key];
          }
        } else {
          m[key] = { lessonId, idx, count: Math.min(3, (m[key]?.count ?? 0) + 1), last: Date.now() };
        }
        const st = get().stats;
        set({ mistakes: m, stats: { ...st, answers: st.answers + 1, correct: st.correct + (correct ? 1 : 0) } });
      },

      ensureDaily: () => {
        const today = dateKey();
        const s = get();
        let patch: Partial<State> = {};
        if (s.quests.date !== today) patch.quests = { date: today, list: makeQuests(today, s.settings.dailyGoal) };
        // Streak freeze: if yesterday was missed but the day before was active, consume a freeze.
        if (s.lastOpen && s.lastOpen !== today) {
          const y = dateKey(addDays(new Date(), -1));
          const yy = dateKey(addDays(new Date(), -2));
          const active = (k: string) => (s.days[k] ?? 0) > 0 || s.frozenDays.includes(k);
          if (!active(y) && active(yy) && s.freezes > 0) {
            patch.freezes = s.freezes - 1;
            patch.frozenDays = [...s.frozenDays, y];
          }
        }
        patch.lastOpen = today;
        set(patch);
      },

      claimQuest: (id) => {
        const q = get().quests;
        const list = q.list.map((x) => (x.id === id && !x.claimed && x.progress >= x.target ? { ...x, claimed: true } : x));
        const gained = q.list.find((x) => x.id === id && !x.claimed && x.progress >= x.target)?.reward ?? 0;
        set({ quests: { ...q, list }, gems: get().gems + gained });
      },

      completeLesson: (inp) => {
        get().ensureDaily();
        const s = get();
        const today = dateKey();
        const accuracy = inp.total ? inp.correct / inp.total : 1;
        const perfect = inp.total > 0 && inp.correct === inp.total;
        const wasDone = inp.lessonId ? (s.lessons[inp.lessonId]?.done ?? 0) > 0 : false;
        const total = Math.max(1, inp.partsTotal ?? 1);
        const partIdx = inp.part ?? 0;
        const prevParts = inp.lessonId ? s.parts[inp.lessonId] ?? 0 : 0;
        const replay = wasDone || (inp.lessonId != null && partIdx < prevParts);
        const newParts = wasDone ? prevParts : Math.max(prevParts, partIdx + 1);
        const lessonDoneNow = !!inp.lessonId && !wasDone && newParts >= total;
        let xp = Math.round(inp.correct * 10 * (replay ? 0.6 : 1));
        if (perfect) xp += 10;
        if (inp.bestCombo >= 5) xp += 5;
        if (inp.practice) xp = Math.max(10, Math.round(inp.correct * 8));
        xp = Math.max(5, xp);
        let gems = perfect ? 8 : 4;
        const levelBefore = levelFromXp(s.xp).level;
        const streakBefore = computeStreak(s.days, s.frozenDays);
        const todayBefore = s.days[today] ?? 0;
        const days = { ...s.days, [today]: todayBefore + xp };
        const streakAfter = computeStreak(days, s.frozenDays);
        const goalReachedNow = todayBefore < s.settings.dailyGoal && todayBefore + xp >= s.settings.dailyGoal;
        if (goalReachedNow) gems += 10;
        const lessons = { ...s.lessons };
        const parts = { ...s.parts };
        if (inp.lessonId && !wasDone && !lessonDoneNow) parts[inp.lessonId] = newParts;
        if (lessonDoneNow) delete parts[inp.lessonId!];
        if (inp.lessonId && (wasDone || lessonDoneNow)) {
          const prev = lessons[inp.lessonId];
          lessons[inp.lessonId] = {
            done: (prev?.done ?? 0) + 1,
            best: Math.max(prev?.best ?? 0, accuracy),
            xp: (prev?.xp ?? 0) + xp,
            last: Date.now(),
          };
        }
        const hour = new Date().getHours();
        const stats: Stats = {
          ...s.stats,
          lessonsDone: s.stats.lessonsDone + (inp.practice ? 0 : 1),
          perfect: s.stats.perfect + (perfect ? 1 : 0),
          bestCombo: Math.max(s.stats.bestCombo, inp.bestCombo),
          timeMs: s.stats.timeMs + inp.durationMs,
          practiceDone: s.stats.practiceDone + (inp.practice ? 1 : 0),
          nightOwl: s.stats.nightOwl + (hour >= 23 || hour < 3 ? 1 : 0),
          earlyBird: s.stats.earlyBird + (hour >= 4 && hour < 7 ? 1 : 0),
        };
        const quests = {
          ...s.quests,
          list: s.quests.list.map((q) => {
            let p = q.progress;
            if (q.kind === 'xp') p += xp;
            if (q.kind === 'lessons' && !inp.practice) p += 1;
            if (q.kind === 'perfect' && perfect) p += 1;
            if (q.kind === 'combo') p = Math.max(p, inp.bestCombo);
            if (q.kind === 'practice' && inp.practice) p += 1;
            if (q.kind === 'correct') p += inp.correct;
            return { ...q, progress: Math.min(q.target, p) };
          }),
        };
        const newXp = s.xp + xp;
        set({ xp: newXp, gems: s.gems + gems, days, lessons, parts, stats, quests });
        // achievements
        // lazy require: achievements.ts imports this store (import cycle)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { checkAchievements } = require('../content/achievements');
        const unlocked: string[] = checkAchievements(get());
        if (unlocked.length) {
          const a = { ...get().achievements };
          let bonus = 0;
          for (const id of unlocked) {
            a[id] = Date.now();
            bonus += 20;
          }
          set({ achievements: a, gems: get().gems + bonus });
        }
        return {
          xp,
          gems,
          accuracy,
          perfect,
          streakBefore,
          streakAfter,
          goalReachedNow,
          levelBefore,
          levelAfter: levelFromXp(newXp).level,
          newAchievements: unlocked,
          part: inp.lessonId ? { index: partIdx, total, lessonDone: lessonDoneNow || wasDone } : undefined,
        };
      },

      resetAll: () => set(initial()),
    }),
    {
      name: 'engineer-academy-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted || {}),
        settings: { ...current.settings, ...(persisted?.settings || {}) },
        stats: { ...current.stats, ...(persisted?.stats || {}) },
      }),
    },
  ),
);

export function useStreak() {
  return useApp((s) => computeStreak(s.days, s.frozenDays));
}
