// QuestTrack — a horizontal RPG "quest" progress bar for the battle area.
// Reads useBattle via selectors and visualizes overall progress as milestone
// nodes along an animated fill. Self-contained, inline styles, no props required.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattle } from '../battle/store';
import { useQuestStages } from '../battle/questStages';
import type { BattleAction, FlowStep } from '../battle/types';

/** Short label for a real tool in the live track. */
function toolShort(step: FlowStep): string {
  if (step.kind !== 'tool') return step.label;
  switch (step.tool) {
    case 'web_search': return 'Web';
    case 'x_search': return 'X';
    case 'code_execution': return 'Code';
    default: return step.tool ?? 'Tool';
  }
}

const STATUS_ICON: Record<FlowStep['status'], string> = { running: '◌', ok: '✓', error: '✕' };

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

// Base thresholds/icons/fallback labels. The 4 middle labels (indices 1-4) are
// overridden per-quest with task-themed names from useQuestStages — "Quest
// Start" and "Victory" stay generic since they're universal battle states.
const MILESTONE_BASE: readonly Milestone[] = [
  { threshold: 0, label: 'Quest Start', icon: '🚩' },
  { threshold: 0.2, label: '???', icon: '❓' },
  { threshold: 0.45, label: '???', icon: '❓' },
  { threshold: 0.7, label: '???', icon: '❓' },
  { threshold: 0.9, label: '???', icon: '❓' },
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
  const flow = useBattle((s) => s.flow);
  const stageLabels = useQuestStages((s) => s.labels);
  const [mode, setMode] = useState<'stages' | 'live'>('live');

  // Dynamic live chain of UNKNOWN length: start with a single "?", then each
  // real agent step is appended (replacing the trailing "?"), with a fresh "?"
  // after it for the next unknown step. Ends on 🏆 (victory) or ✕ (defeat).
  const liveNodes = useMemo(() => {
    type Node = { key: string; icon: string; label: string; color: string; pulse: boolean; unknown: boolean };
    const nodes: Node[] = flow.map((step) => ({
      key: `f${step.id}`,
      icon: STATUS_ICON[step.status],
      label: toolShort(step),
      color: step.status === 'error' ? PALETTE.bad : step.status === 'ok' ? PALETTE.good : PALETTE.gold,
      pulse: step.status === 'running',
      unknown: false,
    }));
    if (phase === 'victory') {
      nodes.push({ key: 'win', icon: '🏆', label: 'Victory', color: PALETTE.gold, pulse: false, unknown: false });
    } else if (phase === 'defeat') {
      nodes.push({ key: 'lose', icon: '✕', label: 'Failed', color: PALETTE.bad, pulse: false, unknown: false });
    } else {
      // The next step is unknown — a pulsing "?" placeholder (also the sole node
      // before the quest starts).
      nodes.push({ key: 'next', icon: '❓', label: '?', color: PALETTE.dim, pulse: phase === 'fighting', unknown: true });
    }
    return nodes;
  }, [flow, phase]);

  const MILESTONES = useMemo(() => {
    const base = [...MILESTONE_BASE];
    // Only reveal stage names as the agent makes real progress (per round/cast)
    const revealedCount = Math.min(
      Math.floor((round + (phase === 'victory' || phase === 'defeat' ? 2 : 0)) / 2) + 1,
      4
    );
    for (let i = 1; i <= revealedCount && i < base.length - 1; i++) {
      base[i] = { 
        ...base[i], 
        label: stageLabels[i - 1] ?? '???', 
        icon: stageLabels[i - 1] ? (i === 1 ? '🔍' : i === 2 ? '⚔️' : i === 3 ? '💥' : '🔥') : '❓' 
      };
    }
    return base;
  }, [stageLabels, round, phase]);

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

  // Keep the newest node in view as the live chain grows.
  const chainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode === 'live' && chainRef.current) {
      chainRef.current.scrollLeft = chainRef.current.scrollWidth;
    }
  }, [liveNodes.length, mode]);

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
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: PALETTE.dim, whiteSpace: 'nowrap' }}>
          {/* Stages (RPG) ↔ Live (real agent steps) toggle */}
          <span style={{ display: 'inline-flex', gap: 4 }}>
            {(['stages', 'live'] as const).map((m) => {
              const on = mode === m;
              return (
                <button key={m} onClick={() => setMode(m)}
                  style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${on ? PALETTE.accent : 'transparent'}`,
                    background: on ? 'rgba(124,92,255,0.2)' : 'transparent',
                    color: on ? '#e6e2ff' : PALETTE.dim }}>
                  {m === 'stages' ? 'Stages' : 'Live'}
                </button>
              );
            })}
          </span>
          <span>
            <span style={{ opacity: 0.8 }}>Round {round}</span>
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            <span style={{ color: fillColor, fontWeight: 700 }}>{pct}%</span>
          </span>
        </span>
      </div>

      {/* Track */}
      {mode === 'live' ? (
        /* Dynamic chain of unknown length: real steps append and push the "?"
           forward; auto-scrolls to the newest. */
        <div ref={chainRef} style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', overflowY: 'hidden', padding: '2px 2px 4px' }}>
          <AnimatePresence initial={false}>
            {liveNodes.map((n, i) => (
              <motion.div
                key={n.key}
                layout
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}
              >
                {i > 0 && (
                  <div style={{ width: 20, height: 2, marginTop: 13, background: liveNodes[i - 1]!.unknown ? PALETTE.border : liveNodes[i - 1]!.color, opacity: 0.7 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
                  <motion.div
                    animate={n.pulse
                      ? { boxShadow: [`0 0 4px ${n.color}`, `0 0 14px ${n.color}`, `0 0 4px ${n.color}`], scale: [1, 1.12, 1] }
                      : { boxShadow: `0 0 8px ${n.color}`, scale: 1 }}
                    transition={n.pulse ? { duration: 1.1, repeat: Infinity } : { type: 'spring', stiffness: 200, damping: 18 }}
                    style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: PALETTE.bg, border: `2px solid ${n.color}`, borderStyle: n.unknown ? 'dashed' : 'solid', color: n.color }}
                  >
                    {n.icon}
                  </motion.div>
                  <span style={{ marginTop: 6, fontSize: 9, textAlign: 'center', letterSpacing: 0.3, color: n.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 58 }}>
                    {n.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
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

        {/* RPG milestone nodes */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 4,
          }}
        >
          {MILESTONES.map((m, i) => {
            const reached = progress >= m.threshold;
            const isCurrent = i === currentIndex && !failed;
            const nodeColor = failed && reached ? PALETTE.bad : reached ? PALETTE.gold : PALETTE.dim;
            return (
              <div
                key={m.threshold}
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
      )}
    </div>
  );
}
