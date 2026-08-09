// In-battle HITL command menu (plan.md §7e). Between rounds, the run pauses
// here so the player can steer the agent's next move — pick an AI-suggested
// tactic, type a free-text hint, or just continue. Auto-continues on a
// countdown so a live demo never stalls waiting on an unattended player.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCommandMenu } from '../../battle/commandMenu';
import { useBattle } from '../../battle/store';

const PIXEL = "'Press Start 2P', ui-monospace, monospace";
const AUTO_CONTINUE_MS = 25_000;

export function CommandMenu() {
  const { open, options } = useCommandMenu();
  const boss = useBattle((s) => s.boss);
  const round = useBattle((s) => s.round);
  const [hint, setHint] = useState('');

  // Countdown lives here (not in the store) so it restarts cleanly each time
  // the menu re-opens — a fresh mount per round via AnimatePresence's `key`.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => useCommandMenu.getState().choose(null), AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open) setHint('');
  }, [open]);

  const choose = (h: string | null) => useCommandMenu.getState().choose(h);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={round}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 115, background: 'rgba(6,4,16,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            style={{
              width: 'min(440px, 94vw)', background: 'linear-gradient(180deg,#221a44,#100c24 70%)',
              border: '2px solid #6a5aa8', borderRadius: 16, color: '#e6e2ff',
              boxShadow: '0 24px 90px rgba(0,0,0,0.7)', overflow: 'hidden',
            }}
          >
            {/* Shrinking countdown bar — auto-continues when it empties. */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_CONTINUE_MS / 1000, ease: 'linear' }}
              style={{ height: 3, background: '#ffd166', transformOrigin: 'left' }}
            />

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
              background: 'linear-gradient(180deg,#2e2456,#1c1640)', borderBottom: '2px solid #6a5aa8',
            }}>
              <h2 style={{ margin: 0, letterSpacing: 1, fontSize: 14, fontFamily: PIXEL }}>⏸ YOUR CALL</h2>
              <span style={{ color: '#9d97c9', fontSize: 11 }}>Round {round} · {boss.name}</span>
            </div>

            <div style={{ padding: '16px 18px 18px' }}>
              <div style={{ color: '#a79be0', fontSize: 12, marginBottom: 12 }}>
                The agent is between moves — steer its next tool call, or let it carry on.
              </div>

              {options.length === 0 ? (
                <div style={{ color: '#7a72a8', fontSize: 12, padding: '10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                    🧠
                  </motion.span>
                  Weighing tactics…
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => choose(opt)}
                      style={{
                        textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid #5a4f92', background: 'linear-gradient(180deg,#2a2350,#1c1740)',
                        color: '#e6e2ff', fontFamily: 'inherit', fontSize: 13,
                      }}
                    >
                      ▸ {opt}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hint.trim()) choose(hint.trim());
                  }}
                  placeholder="...or type your own hint"
                  style={{
                    flex: 1, padding: '9px 10px', borderRadius: 8, border: '1px solid #3a2f66',
                    background: '#17122e', color: '#fff', fontFamily: 'inherit', fontSize: 12, outline: 'none',
                  }}
                />
                <button
                  disabled={!hint.trim()}
                  onClick={() => choose(hint.trim())}
                  style={{
                    padding: '9px 14px', borderRadius: 8, border: '1px solid #7c5cff', cursor: hint.trim() ? 'pointer' : 'default',
                    background: hint.trim() ? 'linear-gradient(180deg,#8f6dff,#6a45e0)' : '#2a2350',
                    color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, opacity: hint.trim() ? 1 : 0.5,
                  }}
                >
                  Send
                </button>
              </div>

              <button
                onClick={() => choose(null)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: '1px solid #57d9a3', background: 'linear-gradient(180deg,#245a49,#173d32)',
                  color: '#c9f5e4', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                }}
              >
                ▶ Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
