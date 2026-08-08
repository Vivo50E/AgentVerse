// Settings modal — houses app preferences (sound effects, ...). Kept small
// and extensible so more toggles can move here instead of cluttering the header.
import { motion } from 'framer-motion';

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
        width: 52, height: 28, borderRadius: 999, border: `1px solid ${on ? C.good : C.border}`,
        background: on ? 'linear-gradient(90deg,#3fb489,#57d9a3)' : '#231d44',
        position: 'relative', cursor: 'pointer', padding: 0, transition: 'background .2s',
      }}
    >
      <motion.span
        animate={{ x: on ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ position: 'absolute', top: 2, left: 0, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
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

export function SettingsPanel({
  sfxOn, setSfxOn, themedBossOn, setThemedBossOn, onClose,
}: {
  sfxOn: boolean;
  setSfxOn: (v: boolean) => void;
  themedBossOn: boolean;
  setThemedBossOn: (v: boolean) => void;
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
          <div style={{ color: '#7a72a8', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
            More settings coming soon.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
