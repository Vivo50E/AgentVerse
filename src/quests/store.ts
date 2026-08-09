// User-added Quest Board entries — persisted locally, separate from the
// built-in DEMO_QUESTS (which stay read-only/pinned). Small text-only records,
// so no realistic quota pressure — a generous cap just guards against abuse.
import { create } from 'zustand';
import type { DemoQuest } from './demoQuests';

const STORAGE_KEY = 'agentverse:customQuests';
const MAX_QUESTS = 24;

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function load(): DemoQuest[] {
  if (!hasStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q): q is DemoQuest =>
        !!q &&
        typeof q === 'object' &&
        typeof (q as DemoQuest).id === 'number' &&
        typeof (q as DemoQuest).title === 'string' &&
        typeof (q as DemoQuest).prompt === 'string',
    );
  } catch {
    return [];
  }
}

function persist(quests: DemoQuest[]): DemoQuest[] {
  if (!hasStorage()) return quests;
  let candidate = quests.slice(0, MAX_QUESTS);
  while (candidate.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return candidate;
    } catch {
      candidate = candidate.slice(0, candidate.length - 1); // quota — drop oldest
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return candidate;
}

interface CustomQuestStore {
  quests: DemoQuest[];
  add: (q: Omit<DemoQuest, 'id'>) => DemoQuest;
  remove: (id: number) => void;
}

export const useCustomQuests = create<CustomQuestStore>((set, get) => ({
  quests: load(),
  add: (q) => {
    const quest: DemoQuest = { ...q, id: Date.now() };
    const next = persist([quest, ...get().quests]);
    set({ quests: next });
    return quest;
  },
  remove: (id) => {
    const next = persist(get().quests.filter((q) => q.id !== id));
    set({ quests: next });
  },
}));
