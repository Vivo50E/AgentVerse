import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattle } from './battle/store';
import { runAgent } from './agent/run';
import type { Actor, SkillKind } from './battle/types';
import { ActorPortrait, DamageLayer, SkillCast } from './components/battle';
import { ReportCard } from './components/ReportCard';
import { useBattleVoice } from './voice';

function HpBar({ actor, color }: { actor: Actor; color: string }) {
  const pct = (actor.hp / actor.maxHp) * 100;
  return (
    <div style={{ width: 240 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cdc7e6', fontSize: 13, marginBottom: 3 }}>
        <span>{actor.name}</span>
        <span>{actor.hp}/{actor.maxHp}</span>
      </div>
      <div style={{ height: 14, background: '#241f3a', borderRadius: 7, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{ height: '100%', background: color }}
        />
      </div>
    </div>
  );
}

export function App() {
  const [task, setTask] = useState('Research the biggest AI agent news this week');
  const [voiceOn, setVoiceOn] = useState(false);
  const { phase, round, hero, boss, log, lastAction } = useBattle();

  // Voice narration (needs a user gesture; the toggle provides it).
  useBattleVoice(voiceOn);

  // Transient FX flags derived from the latest battle action.
  const [heroHurt, setHeroHurt] = useState(false);
  const [bossHurt, setBossHurt] = useState(false);
  const [casting, setCasting] = useState(false);
  const [cast, setCast] = useState<{ id: number; label: string; skill: SkillKind } | null>(null);
  const castId = useRef(0);

  useEffect(() => {
    if (!lastAction) return;
    if (lastAction.type === 'cast') {
      setCasting(true);
      setCast({ id: ++castId.current, label: lastAction.label, skill: lastAction.skill });
      const t = setTimeout(() => setCasting(false), 900);
      return () => clearTimeout(t);
    }
    if (lastAction.type === 'hit') {
      setBossHurt(true);
      const t = setTimeout(() => setBossHurt(false), 350);
      return () => clearTimeout(t);
    }
    if (lastAction.type === 'agent_hurt') {
      setHeroHurt(true);
      const t = setTimeout(() => setHeroHurt(false), 350);
      return () => clearTimeout(t);
    }
  }, [lastAction]);

  const toneColor = { info: '#9d97c9', good: '#57d9a3', bad: '#ff6b81', crit: '#ffd166' } as const;
  const fighting = phase === 'fighting';
  const showReport = phase === 'victory' || phase === 'defeat';

  return (
    <div style={{ fontFamily: 'ui-monospace, monospace', color: '#e6e2ff', padding: 24, minHeight: '100vh', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: '0 0 4px' }}>AgentVerse ⚔️</h1>
        <button
          onClick={() => setVoiceOn((v) => !v)}
          style={{ background: 'none', border: '1px solid #3a3260', color: voiceOn ? '#57d9a3' : '#9d97c9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
        >
          {voiceOn ? '🔊 Voice on' : '🔈 Voice off'}
        </button>
      </div>
      <p style={{ margin: '0 0 20px', color: '#9d97c9' }}>
        Watch your AI agent battle the problem — powered by Grok.{phase !== 'idle' && ` · Round ${round}`}
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Give your agent a quest…"
          disabled={fighting}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #3a3260', background: '#181430', color: '#fff' }}
        />
        <button
          onClick={() => runAgent(task)}
          disabled={fighting}
          style={{ padding: '12px 20px', borderRadius: 8, border: 0, background: fighting ? '#463a7a' : '#7c5cff', color: '#fff', fontWeight: 700, cursor: fighting ? 'default' : 'pointer' }}
        >
          {fighting ? 'Fighting…' : 'Start Quest'}
        </button>
      </div>

      {/* Battle stage — relative so DamageLayer + SkillCast overlay correctly. */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 8px', marginBottom: 20, background: 'radial-gradient(circle at 50% 30%, #1a1536 0%, #0d0b1a 80%)', borderRadius: 14, border: '1px solid #2a2450', minHeight: 150 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ActorPortrait name={hero.name} side="hero" hurt={heroHurt} casting={casting} />
          <HpBar actor={hero} color="#57d9a3" />
        </div>

        <AnimatePresence>
          {cast && (
            <motion.div key={cast.id} style={{ position: 'absolute', left: 0, right: 0, top: 10, display: 'flex', justifyContent: 'center' }}>
              <SkillCast label={cast.label} skill={cast.skill} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ActorPortrait name={boss.name} side="boss" hurt={bossHurt} />
          <HpBar actor={boss} color="#ff6b81" />
        </div>

        <DamageLayer />
      </div>

      <div style={{ maxWidth: 720, height: 260, overflowY: 'auto', background: '#120f26', border: '1px solid #2a2450', borderRadius: 10, padding: 14 }}>
        <AnimatePresence initial={false}>
          {log.map((e) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{ color: toneColor[e.tone], fontSize: 14, padding: '3px 0' }}>
              <span style={{ opacity: 0.4 }}>R{e.round} </span>{e.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {log.length === 0 && <span style={{ color: '#655e90' }}>Battle log will appear here…</span>}
      </div>

      {/* Victory / defeat report card overlay */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          >
            <ReportCard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
