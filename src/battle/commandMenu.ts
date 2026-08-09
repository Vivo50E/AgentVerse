// Bridges the non-React HITL run loop (src/agent/run.ts) and the CommandMenu
// modal (src/components/battle/CommandMenu.tsx). run.ts calls request() and
// awaits the promise; the modal calls choose() when the player picks an
// option, types a hint, hits "Continue", or the countdown expires.
import { create } from 'zustand';

interface CommandMenuStore {
  open: boolean;
  options: string[];
  /** Opens the menu (options may be filled in later via setOptions) and
   * returns a promise that resolves with the player's hint, or null for
   * "continue with no hint". */
  request: (options: string[]) => Promise<string | null>;
  setOptions: (options: string[]) => void;
  choose: (hint: string | null) => void;
  _resolve: ((hint: string | null) => void) | null;
}

export const useCommandMenu = create<CommandMenuStore>((set, get) => ({
  open: false,
  options: [],
  _resolve: null,

  request: (options) =>
    new Promise((resolve) => {
      set({ open: true, options, _resolve: resolve });
    }),

  setOptions: (options) => set({ options }),

  choose: (hint) => {
    const resolve = get()._resolve;
    set({ open: false, options: [], _resolve: null });
    resolve?.(hint);
  },
}));
