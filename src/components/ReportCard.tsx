// End-of-battle "report card" — a screenshot-worthy RPG victory/defeat card
// that doubles as the image users share to X. Reads live run data from the
// zustand battle store; a few optional props allow overrides for testing or
// for wiring "New Quest" to app-level logic.
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../battle/store';
import { useProgression, xpToNext } from '../progression';
import { STAT_LABELS } from '../loadout/types';
import type { Stat as StatKey } from '../loadout/types';
import { buildShareText, shareToX } from './shareToX';
import type { SkillKind } from '../battle/types';

// ── palette (matches App.tsx) ──────────────────────────────────────────────
const C = {
  bg0: '#0d0b1a',
  bg1: '#120f26',
  panel: '#181430',
  border: '#2a2450',
  accent: '#7c5cff',
  good: '#57d9a3',
  bad: '#ff6b81',
  gold: '#ffd166',
  text: '#e6e2ff',
  dim: '#9d97c9',
  faint: '#655e90',
};

export interface ReportCardProps {
  /** Called when the player starts a new quest. Defaults to store `reset()`. */
  onNewQuest?: () => void;
  /** Dismiss the card without resetting the run (keeps the result on screen). */
  onClose?: () => void;
  /**
   * Override the "skills cast" stat. When omitted it is derived from the log
   * (entries created by `cast` actions, which are prefixed with "✦").
   */
  skillsCast?: number;
}

/** Derive the agent's "class" from the mix of skills it leaned on. */
function deriveClass(counts: Record<SkillKind, number>): string {
  const entries = Object.entries(counts) as [SkillKind, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] === 0) return 'Wandering Adept';
  const byKind: Record<SkillKind, string> = {
    intel_summon: 'Oracle Seeker',
    forge: 'Rune Forgemaster',
    strike: 'Blade Vanguard',
    focus: 'Mind Ascetic',
  };
  return byKind[top[0]];
}

export function ReportCard({ onNewQuest, onClose, skillsCast }: ReportCardProps) {
  const phase = useBattle((s) => s.phase);
  const round = useBattle((s) => s.round);
  const hero = useBattle((s) => s.hero);
  const log = useBattle((s) => s.log);
  const sources = useBattle((s) => s.sources);
  const reportSummary = useBattle((s) => s.reportSummary);
  const streamDone = useBattle((s) => s.streamDone);
  const reset = useBattle((s) => s.reset);

  // Agent progression — level, XP toward next, and what was learned this quest.
  const level = useProgression((s) => s.level);
  const xp = useProgression((s) => s.xp);
  const award = useProgression((s) => s.lastAward);

  const won = phase === 'victory';

  // Cast log lines are prefixed "✦ … casts <skill>". We can't recover the exact
  // SkillKind from the log text, so class is best-effort from label keywords.
  const { castCount, agentClass } = useMemo(() => {
    const castLines = log.filter((e) => e.text.startsWith('✦'));
    const counts: Record<SkillKind, number> = {
      intel_summon: 0,
      forge: 0,
      strike: 0,
      focus: 0,
    };
    for (const e of castLines) {
      const t = e.text.toLowerCase();
      if (t.includes('search') || t.includes('intel') || t.includes('summon')) counts.intel_summon++;
      else if (t.includes('forge') || t.includes('code') || t.includes('build')) counts.forge++;
      else if (t.includes('strike') || t.includes('attack')) counts.strike++;
      else counts.focus++;
    }
    return { castCount: castLines.length, agentClass: deriveClass(counts) };
  }, [log]);

  const casts = skillsCast ?? castCount;
  const hpPct = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
  const accent = won ? C.gold : C.bad;

  const xpNext = xpToNext(level);
  const xpPct = Math.max(0, Math.min(100, (xp / xpNext) * 100));
  const learned = award
    ? (Object.entries(award.gains) as [StatKey, number][]).filter(([, n]) => n > 0)
    : [];

  const handleShare = () => {
    void shareToX(
      buildShareText({ heroName: hero.name, rounds: round, won, summary: reportSummary }),
    );
  };

  const handleNewQuest = () => {
    if (onNewQuest) onNewQuest();
    else reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      style={{
        fontFamily: 'ui-monospace, monospace',
        width: 600,
        minHeight: 400,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        borderRadius: 18,
        color: C.text,
        background: `radial-gradient(120% 120% at 50% -10%, ${
          won ? 'rgba(124,92,255,0.28)' : 'rgba(255,107,129,0.20)'
        } 0%, ${C.bg1} 45%, ${C.bg0} 100%)`,
        border: `1px solid ${won ? 'rgba(255,209,102,0.55)' : C.border}`,
        boxShadow: won
          ? '0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(255,209,102,0.18) inset'
          : '0 24px 60px rgba(0,0,0,0.55)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* corner sigil */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${accent}, transparent 60%)`,
          opacity: 0.18,
          filter: 'blur(2px)',
        }}
      />

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <motion.h1
            initial={{ letterSpacing: '0.3em', opacity: 0 }}
            animate={{ letterSpacing: '0.12em', opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              margin: 0,
              fontSize: 40,
              fontWeight: 800,
              color: accent,
              textShadow: won ? `0 0 18px rgba(255,209,102,0.5)` : `0 0 18px rgba(255,107,129,0.4)`,
            }}
          >
            {won ? 'VICTORY' : 'DEFEAT'}
          </motion.h1>
          <div style={{ marginTop: 4, color: C.dim, fontSize: 13 }}>
            {hero.name} · <span style={{ color: C.text }}>{agentClass}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {onClose && (
            <button
              onClick={onClose}
              title="Close (keep result)"
              style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
            >
              ✕
            </button>
          )}
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              color: C.faint,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '4px 8px',
              textTransform: 'uppercase',
            }}
          >
            AgentVerse
          </div>
        </div>
      </div>

      {/* stats row */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <Stat label="Rounds Fought" value={String(round)} accent={accent} />
        <Stat label="Skills Cast" value={String(casts)} accent={accent} />
        <Stat label="Loot Found" value={String(sources.length)} accent={accent} />
      </div>

      {/* HP bar */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: C.dim,
            marginBottom: 6,
          }}
        >
          <span>HP Remaining</span>
          <span style={{ color: C.text }}>
            {hero.hp}/{hero.maxHp}
          </span>
        </div>
        <div style={{ height: 14, background: C.panel, borderRadius: 7, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hpPct}%` }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 90, damping: 18 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${hpPct > 33 ? C.good : C.bad}, ${
                hpPct > 33 ? '#3fb489' : '#d94e63'
              })`,
            }}
          />
        </div>
      </div>

      {/* progression — level, XP, learned growth, level-up celebration */}
      <div style={{ marginTop: 16 }}>
        {/* level-up banner (animates in when the award lands) */}
        <AnimatePresence>
          {award?.leveledUp && (
            <motion.div
              key="levelup"
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{
                opacity: 1,
                scale: [0.6, 1.08, 1],
                y: 0,
                boxShadow: [
                  '0 0 0px rgba(255,209,102,0)',
                  '0 0 26px rgba(255,209,102,0.65)',
                  '0 0 14px rgba(255,209,102,0.35)',
                ],
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
                padding: '8px 12px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '0.06em',
                color: '#1a1405',
                background: `linear-gradient(90deg, ${C.gold}, #ffe6a3)`,
                border: `1px solid ${C.gold}`,
                textShadow: '0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <motion.span
                aria-hidden
                animate={{ rotate: [0, 18, -18, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
                style={{ fontSize: 18 }}
              >
                ⭐
              </motion.span>
              LEVEL UP! &nbsp;Lv {award.fromLevel} → {award.toLevel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* level + XP bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontSize: 12,
            color: C.dim,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: C.gold, letterSpacing: '0.04em' }}>
            Lv {level}
          </span>
          <span style={{ color: C.text }}>
            {xp} / {xpNext} XP
          </span>
        </div>
        <div style={{ height: 8, background: C.panel, borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 90, damping: 18 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${C.gold}, #ffb347)`,
            }}
          />
        </div>

        {/* learned this quest — XP gained + stat growth chips */}
        <AnimatePresence>
          {award && (
            <motion.div
              key="learned"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
                fontSize: 11,
              }}
            >
              <span style={{ color: C.faint, letterSpacing: '0.04em' }}>Learned this quest:</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 700,
                  color: C.gold,
                  background: 'rgba(255,209,102,0.12)',
                  border: `1px solid rgba(255,209,102,0.4)`,
                }}
              >
                +{award.xpGained} XP
              </span>
              {learned.map(([stat, n]) => (
                <span
                  key={stat}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontWeight: 700,
                    color: C.good,
                    background: 'rgba(87,217,163,0.12)',
                    border: `1px solid rgba(87,217,163,0.35)`,
                  }}
                >
                  +{n} {STAT_LABELS[stat]}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* quest result */}
      <div
        style={{
          marginTop: 18,
          padding: '12px 14px',
          background: 'rgba(0,0,0,0.28)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          fontSize: 14,
          lineHeight: 1.45,
          color: reportSummary ? C.text : C.faint,
          fontStyle: reportSummary ? 'normal' : 'italic',
        }}
      >
        <span style={{ color: accent, fontWeight: 700 }}>Quest Result — </span>
        {reportSummary || (won ? 'The problem was vanquished.' : 'The quest ends here… for now.')}
      </div>

      {/* Pointer to the full result — the answer + sources live in the page
          panel below so this card stays compact and fully on-screen. */}
      <div
        style={{
          marginTop: 16,
          padding: '12px 14px',
          background: 'rgba(87,217,163,0.08)',
          border: `1px solid ${C.good}55`,
          borderRadius: 10,
          fontSize: 13,
          color: C.text,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>📜</span>
        <span>
          {streamDone ? 'Full answer' : 'Answer streaming in'} · <b>{sources.length}</b> sources —{' '}
          <span style={{ color: C.good }}>see “Quest Result” below ↓</span>
        </span>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={handleShare}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: 0,
            cursor: 'pointer',
            fontWeight: 700,
            fontFamily: 'inherit',
            fontSize: 14,
            color: '#fff',
            background: `linear-gradient(90deg, ${C.accent}, #5a3fe0)`,
            boxShadow: '0 6px 18px rgba(124,92,255,0.4)',
          }}
        >
          𝕏 &nbsp;Share to X
        </button>
        <button
          onClick={handleNewQuest}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            cursor: 'pointer',
            fontWeight: 700,
            fontFamily: 'inherit',
            fontSize: 14,
            color: C.text,
            background: 'transparent',
          }}
        >
          ⟳ &nbsp;New Quest
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '12px 8px',
        background: 'rgba(0,0,0,0.25)',
        border: `1px solid ${C.border}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 2, letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

/** Turn a citation URL into a short, readable label (host + trimmed path). */
function prettySource(src: string): string {
  try {
    const u = new URL(src);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return src;
  }
}
