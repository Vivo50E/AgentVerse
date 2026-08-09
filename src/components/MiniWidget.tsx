// Draggable floating mini view — HP/round/latest log line pinned to the
// viewport, so the fight stays visible while you scroll down to read the
// answer or open another panel. Toggled from the action bar (App.tsx).
import { motion } from 'framer-motion';
import { useBattle } from '../battle/store';

const toneColor = { info: '#9d97c9', good: '#57d9a3', bad: '#ff6b81', crit: '#ffd166' } as const;

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2, color: '#e6e2ff' }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#1e1940', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          style={{ height: '100%', background: color }}
        />
      </div>
    </div>
  );
}

export function MiniWidget({ onClose }: { onClose: () => void }) {
  const hero = useBattle((s) => s.hero);
  const boss = useBattle((s) => s.boss);
  const round = useBattle((s) => s.round);
  const phase = useBattle((s) => s.phase);
  const log = useBattle((s) => s.log);
  const lastLog = log[log.length - 1];

  const heroPct = hero.maxHp > 0 ? Math.round((hero.hp / hero.maxHp) * 100) : 0;
  const bossPct = boss.maxHp > 0 ? Math.round((boss.hp / boss.maxHp) * 100) : 0;
  const statusLabel = phase === 'fighting' ? 'fighting' : phase === 'victory' ? 'victory' : phase === 'defeat' ? 'defeat' : 'standing by';

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: 8, top: 8, right: window.innerWidth - 220, bottom: window.innerHeight - 160 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 105, width: 210,
        background: 'linear-gradient(180deg,#221a44,#100c24 85%)', border: '2px solid #6a5aa8',
        borderRadius: 12, boxShadow: '0 16px 50px rgba(0,0,0,0.6)', color: '#e6e2ff',
        fontFamily: 'ui-monospace, monospace', userSelect: 'none',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px',
        borderBottom: '1px solid #3a2f66', cursor: 'grab',
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1, color: '#9d97c9' }}>⛶ MINI VIEW</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#9d97c9', cursor: 'pointer', fontSize: 12, padding: 2 }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '10px 10px 8px' }}>
        <Bar label={hero.name} pct={heroPct} color="#57d9a3" />
        <Bar label={boss.name} pct={bossPct} color="#ff6b81" />
        <div style={{ fontSize: 10, color: '#9d97c9', marginTop: 4 }}>
          Round {round} · {statusLabel}
        </div>
        {lastLog && (
          <div style={{
            fontSize: 11, marginTop: 6, color: toneColor[lastLog.tone], lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {lastLog.text}
          </div>
        )}
      </div>
    </motion.div>
  );
}
