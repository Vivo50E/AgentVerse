// Captures the browser's install prompt so the UI can offer an explicit
// "Install App" action (Settings). The `beforeinstallprompt` event fires once,
// early, and is lost if nothing is listening — so this module must be imported
// for its side effect before that event can occur (see src/main.tsx).
import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  installed: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Safari/iOS/macOS exposes this instead of the display-mode media query.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export const useInstall = create<InstallState>((set, get) => ({
  deferredPrompt: null,
  canInstall: false,
  installed: isStandalone(),
  promptInstall: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    set({ deferredPrompt: null, canInstall: false });
    return outcome;
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // suppress the mini-infobar; we offer our own button
    useInstall.setState({ deferredPrompt: e as BeforeInstallPromptEvent, canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    useInstall.setState({ installed: true, canInstall: false, deferredPrompt: null });
  });
}
