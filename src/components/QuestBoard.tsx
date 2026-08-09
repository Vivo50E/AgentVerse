// Quest Board (plan.md §7g, lightweight cut) — a corkboard of launchable demo
// quests. Click a card to start it directly; completed ones get a checkmark
// and can be rerun. Replaces the old standalone "Show 6 Demos" panel.
import { motion } from 'framer-motion';
import type { DemoQuest } from '../quests/demoQuests';

const PIXEL = "'Press Start 2P', ui-monospace, monospace";

export function QuestBoard({
  quests, completed, activeId, disabled, onRun, onClose,
}: {
  quests: DemoQuest[];
  completed: Set<number>;
  activeId: number | null;
  disabled: boolean;
  onRun: (quest: DemoQuest) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.82)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 120, fontFamily: 'ui-monospace, monospace', padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 94vw)', maxHeight: '86vh', overflowY: 'auto',
          background: 'linear-gradient(180deg,#221a44,#100c24 70%)', border: '2px solid #6a5aa8',
          borderRadius: 16, color: '#e6e2ff', boxShadow: '0 24px 90px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          background: 'linear-gradient(180deg,#2e2456,#1c1640)', borderBottom: '2px solid #6a5aa8',
          borderRadius: '14px 14px 0 0', position: 'sticky', top: 0,
        }}>
          <h2 style={{ margin: 0, letterSpacing: 1, fontSize: 15 }}>📌 QUEST BOARD</h2>
          <button onClick={onClose} style={{ background: '#3a2f66', border: '1px solid #6a5aa8', color: '#e6e2ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          <div style={{ color: '#a79be0', fontSize: 12, marginBottom: 14 }}>
            Pinned quests, tuned to trigger specific tools and rich battle flow. Click one to launch it.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
            {quests.map((quest) => {
              const isDone = completed.has(quest.id);
              const isActive = activeId === quest.id;
              return (
                <motion.button
                  key={quest.id}
                  whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={disabled ? undefined : { scale: 0.98 }}
                  onClick={() => !disabled && onRun(quest)}
                  disabled={disabled}
                  style={{
                    position: 'relative', textAlign: 'left', padding: '14px 16px', borderRadius: 10,
                    border: `2px solid ${isActive ? '#ffd166' : isDone ? '#57d9a3' : '#3a2f66'}`,
                    background: isActive
                      ? 'linear-gradient(145deg, rgba(255,209,102,0.15), rgba(26,22,48,0.8))'
                      : isDone
                        ? 'linear-gradient(145deg, rgba(87,217,163,0.12), rgba(26,22,48,0.8))'
                        : 'rgba(26,22,48,0.7)',
                    cursor: disabled ? 'default' : 'pointer', opacity: disabled && !isActive ? 0.5 : 1,
                    fontFamily: 'inherit',
                    boxShadow: isActive ? '0 0 16px rgba(255,209,102,0.4)' : 'none',
                  }}
                >
                  {isDone && !isActive && (
                    <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 13, color: '#57d9a3' }}>✓</span>
                  )}
                  <div style={{ fontSize: 24, marginBottom: 6, lineHeight: 1 }}>{quest.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: isActive ? '#ffd166' : '#e6e2ff' }}>
                    {quest.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#a79be0', lineHeight: 1.4, minHeight: '2.6em' }}>
                    {quest.desc}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, fontFamily: PIXEL, letterSpacing: 0.5, color: isActive ? '#ffd166' : isDone ? '#57d9a3' : '#8b84b8' }}>
                    {isActive ? '⚔ FIGHTING…' : isDone ? '✓ COMPLETED · RERUN' : '▶ START'}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
