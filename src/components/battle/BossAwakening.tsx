// Loading beat shown while a task-themed boss is generated (plan.md §7d).
// Blocks quest start briefly so the boss sprite is ready before the fight begins;
// masks Grok Imagine's generation latency instead of popping the boss in mid-fight.
import { AnimatePresence, motion } from 'framer-motion';

const PIXEL = "'Press Start 2P', ui-monospace, monospace";

export type BossAwakeningPhase = 'summoning' | 'revealed' | null;

export function BossAwakening({ phase, bossName }: { phase: BossAwakeningPhase; bossName?: string }) {
  return (
    <AnimatePresence>
      {phase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(6,4,16,0.86)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
          }}
        >
          {phase === 'summoning' ? (
            <>
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ rotate: { repeat: Infinity, duration: 1.6, ease: 'linear' }, scale: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } }}
                style={{ fontSize: 48 }}
              >
                🌑
              </motion.div>
              <div style={{ color: '#ff6b81', fontFamily: PIXEL, fontSize: 12, letterSpacing: 1, textAlign: 'center' }}>
                A foe stirs in the dark…
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 16 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 40 }}>👹</div>
              <div style={{ color: '#ffd166', fontFamily: PIXEL, fontSize: 14, marginTop: 12, textShadow: '0 0 12px #ffd16688' }}>
                {bossName ?? 'The boss'} awakens!
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
