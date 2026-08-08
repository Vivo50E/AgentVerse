// QuestTrack — a horizontal RPG "quest" progress bar for the battle area.
// Reads useBattle via selectors and visualizes overall progress as milestone
// nodes along an animated fill. Self-contained, inline styles, no props required.
import { motion } from 'framer-motion';
import { useBattle } from '../battle/store';
import type { BattleAction } from '../battle/types';

const PALETTE = {
  bg: '#120f26',
  accent: '#7c5cff',
  good: '#57d9a3',
  bad: '#ff6b81',
  gold: '#ffd166',
  dim: '#655e90',
  border: '#2a2450',
} as const;

interface Milestone {
  threshold: number;
  label: string;
  icon: string;
}

const MILESTONES: readonly Milestone[] = [
  { threshold: 0, label: 'Quest Start', icon: '🚩' },
  { threshold: 0.15, label: 'Scouting', icon: '🔍' },
  { threshold: 0.4, label: 'Engaging', icon: '⚔️' },
  { threshold: 0.65, label: 'Breakthrough', icon: '💥' },
  { threshold: 0.9, label: 'Final Strike', icon: '🔥' },
  { threshold: 1.0, label: 'Victory', icon: '🏆' },
];

function activityCaption(action: BattleAction | null): string {
  if (!action) return 'Standing by';
  switch (action.type) {
    case 'cast':
      return `Casting ${action.label}…`;
    case 'hit':
      return 'Landing a blow!';
    case 'agent_hurt':
      return 'Taking damage…';
    case 'round_end':
      return 'Regrouping…';
    case 'victory':
      return 'Quest complete!';
    case 'defeat':
      return 'Quest failed';
    default:
      return 'Standing by';
  }
}

export interface QuestTrackProps {
  style?: React.CSSProperties;
  className?: string;
}

export function QuestTrack({ style, className }: QuestTrackProps) {
  const phase = useBattle((s) => s.phase);
  const round = useBattle((s) => s.round);
  const bossHp = useBattle((s) => s.boss.hp);
  const bossMaxHp = useBattle((s) => s.boss.maxHp);
  const lastAction = useBattle((s) => s.lastAction);

  let progress: number;
  if (phase === 'idle') progress = 0;
  else if (phase === 'victory') progress = 1;
  else if (phase === 'defeat') progress = bossMaxHp > 0 ? 1 - bossHp / bossMaxHp : 0;
  else progress = bossMaxHp > 0 ? 1 - bossHp / bossMaxHp : 0;

  progress = Math.max(0, Math.min(1, progress));

  const failed = phase === 'defeat';
  const won = phase === 'victory';
  const fillColor = failed ? PALETTE.bad : won ? PALETTE.gold : PALETTE.accent;

  // Index of the highest reached milestone (the "current" node).
  let currentIndex = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (progress >= MILESTONES[i]!.threshold) currentIndex = i;
  }

  const caption = activityCaption(lastAction);
  const pct = Math.round(progress * 100);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: PALETTE.bg,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 10,
        padding: '14px 18px 20px',
        fontFamily: 'ui-monospace, monospace',
        color: '#e6e2ff',
        ...style,
      }}
    >
      {/* Header: activity caption + round + percent */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <motion.span
          key={caption}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: failed ? PALETTE.bad : won ? PALETTE.gold : PALETTE.good,
          }}
        >
          {caption}
        </motion.span>
        <span style={{ fontSize: 12, color: PALETTE.dim, whiteSpace: 'nowrap' }}>
          <span style={{ opacity: 0.8 }}>Round {round}</span>
          <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
          <span style={{ color: fillColor, fontWeight: 700 }}>{pct}%</span>
        </span>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', padding: '0 6px' }}>
        {/* Rail */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            top: 9,
            height: 6,
            borderRadius: 3,
            background: '#1e1940',
            border: `1px solid ${PALETTE.border}`,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
          }}
        />
        {/* Animated fill */}
        <motion.div
          style={{
            position: 'absolute',
            left: 6,
            top: 9,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${fillColor}, ${won ? PALETTE.gold : PALETTE.good})`,
            boxShadow: `0 0 10px ${fillColor}`,
            transformOrigin: 'left center',
          }}
          animate={{ width: `calc(${progress * 100}% - ${progress * 12}px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />

        {/* Milestone nodes */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {MILESTONES.map((m, i) => {
            const reached = progress >= m.threshold;
            const isCurrent = i === currentIndex && !failed;
            const nodeColor = failed && reached ? PALETTE.bad : reached ? PALETTE.gold : PALETTE.dim;
            return (
              <div
                key={m.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '1 1 0',
                  minWidth: 0,
                }}
              >
                <motion.div
                  animate={
                    isCurrent
                      ? { scale: [1, 1.18, 1], boxShadow: [
                          `0 0 6px ${nodeColor}`,
                          `0 0 16px ${nodeColor}`,
                          `0 0 6px ${nodeColor}`,
                        ] }
                      : { scale: 1, boxShadow: reached ? `0 0 8px ${nodeColor}` : 'none' }
                  }
                  transition={
                    isCurrent
                      ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                      : { type: 'spring', stiffness: 200, damping: 18 }
                  }
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    lineHeight: 1,
                    background: reached ? PALETTE.bg : '#161230',
                    border: `2px solid ${nodeColor}`,
                    opacity: reached ? 1 : 0.5,
                    filter: reached ? 'none' : 'grayscale(0.6)',
                    userSelect: 'none',
                  }}
                >
                  {m.icon}
                </motion.div>
                <span
                  style={{
                    marginTop: 6,
                    fontSize: 9,
                    textAlign: 'center',
                    letterSpacing: 0.3,
                    color: reached ? nodeColor : PALETTE.dim,
                    fontWeight: isCurrent ? 700 : 400,
                    opacity: reached ? 1 : 0.7,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
