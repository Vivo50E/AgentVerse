// Task-themed quest-stage labels (the 4 middle milestones between "Quest Start"
// and "Victory" shown in QuestTrack + JourneyStage). Independent of the
// task-themed boss toggle (plan.md §7d) — this is a cheap text-only Grok call,
// so it always runs, with a silent fallback to the generic defaults.
import { create } from 'zustand';

export const DEFAULT_STAGE_LABELS = ['Scouting', 'Engaging', 'Breakthrough', 'Final Strike'] as const;

interface QuestStagesState {
  labels: readonly string[];
  setLabels: (labels: string[]) => void;
  resetLabels: () => void;
}

export const useQuestStages = create<QuestStagesState>((set) => ({
  labels: DEFAULT_STAGE_LABELS,
  setLabels: (labels) =>
    set({ labels: labels.length === DEFAULT_STAGE_LABELS.length ? labels : DEFAULT_STAGE_LABELS }),
  resetLabels: () => set({ labels: DEFAULT_STAGE_LABELS }),
}));
