// Settings modal — houses app preferences (sound effects, ...). Kept small
// and extensible so more toggles can move here instead of cluttering the header.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInstall } from '../pwa/install';

const C = {
  border: '#3a2f66',
  accent: '#7c5cff',
  good: '#57d9a3',
  gold: '#ffd166',
  text: '#e6e2ff',
  dim: '#9d97c9',
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 52, height: 28, borderRadius: 999, flexShrink: 0,
        // Off-state needs real contrast against the panel's near-identical dark
        // purple bg, or the track disappears and it just reads as a stray dot.
        border: `2px solid ${on ? C.good : '#5a4f92'}`,
        background: on ? 'linear-gradient(90deg,#3fb489,#57d9a3)' : 'linear-gradient(180deg,#2a2350,#1c1740)',
        boxShadow: on ? `0 0 10px ${C.good}55` : 'inset 0 2px 4px rgba(0,0,0,0.45)',
        position: 'relative', cursor: 'pointer', padding: 0, transition: 'background .2s, border-color .2s',
      }}
    >
      <motion.span
        animate={{ x: on ? 26 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ position: 'absolute', top: 3, left: 0, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
      />
    </button>
  );
}

function Row({ title, desc, control }: { title: string; desc: string; control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 4px', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>{desc}</div>
      </div>
      {control}
    </div>
  );
}

const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android|crios|firefox|edg).)*safari/i.test(navigator.userAgent);

/** Install-to-Dock row. Chrome/Edge get a real one-click prompt; Safari (macOS/iOS)
 *  has no programmatic install API, so it gets the manual menu instructions instead. */
function InstallRow() {
  const canInstall = useInstall((s) => s.canInstall);
  const installed = useInstall((s) => s.installed);
  const promptInstall = useInstall((s) => s.promptInstall);
  const [status, setStatus] = useState<'idle' | 'dismissed'>('idle');

  const button = installed ? (
    <span style={{ color: C.good, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓ Installed</span>
  ) : canInstall ? (
    <button
      onClick={async () => {
        const outcome = await promptInstall();
        if (outcome === 'dismissed') setStatus('dismissed');
      }}
      style={{ background: C.accent, border: 0, color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
    >
      ⬇ Install
    </button>
  ) : (
    <span style={{ color: C.dim, fontSize: 11, flexShrink: 0, maxWidth: 150, textAlign: 'right' }}>
      {isSafari ? 'File ▸ Add to Dock' : 'Look for ⊕ in the address bar'}
    </span>
  );

  return (
    <Row
      title="🖥 Install as app"
      desc={
        installed
          ? 'Running as a standalone app — nice.'
          : status === 'dismissed'
            ? 'Maybe later — you can install anytime from here.'
            : 'Get a native Mac window: its own Dock icon, no browser tabs/address bar.'
      }
      control={button}
    />
  );
}

export function SettingsPanel({
  sfxOn, setSfxOn, themedBossOn, setThemedBossOn, hitlOn, setHitlOn, onClose,
}: {
  sfxOn: boolean;
  setSfxOn: (v: boolean) => void;
  themedBossOn: boolean;
  setThemedBossOn: (v: boolean) => void;
  hitlOn: boolean;
  setHitlOn: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, fontFamily: 'ui-monospace, monospace', padding: 16 }}>
      <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(460px, 94vw)', background: 'linear-gradient(180deg,#221a44,#100c24 70%)', border: `2px solid #6a5aa8`, borderRadius: 16, color: C.text, boxShadow: '0 24px 90px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(180deg,#2e2456,#1c1640)', borderBottom: '2px solid #6a5aa8', borderRadius: '14px 14px 0 0' }}>
          <h2 style={{ margin: 0, letterSpacing: 2, fontSize: 18 }}>⚙ SETTINGS</h2>
          <button onClick={onClose} style={{ background: '#3a2f66', border: '1px solid #6a5aa8', color: C.text, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ padding: '6px 18px 18px' }}>
          <Row
            title="🔊 Sound effects"
            desc="Chiptune blips for skill casts, hits, and crits. Instant — no lag."
            control={<Toggle on={sfxOn} onChange={setSfxOn} />}
          />
          <Row
            title="👹 Task-themed boss"
            desc="Grok summons a unique boss for your quest before the fight starts (~5-10s wait). Off = default boss, no wait."
            control={<Toggle on={themedBossOn} onChange={setThemedBossOn} />}
          />
          <Row
            title="⏸ In-battle commands"
            desc="Pause after each tool round so you can steer the agent's next move — pick a tactic or type a hint. Adds a short wait per round."
            control={<Toggle on={hitlOn} onChange={setHitlOn} />}
          />
          <InstallRow />
          <div style={{ color: '#7a72a8', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
            More settings coming soon.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
