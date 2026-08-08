import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattle } from './battle/store';
import { runAgent } from './agent/run';
import { BattleStage } from './components/battle';
import { ReportCard } from './components/ReportCard';
import { DesignStudio } from './design';
import { useBattleVoice } from './voice';

export function App() {
  const [task, setTask] = useState('Research the biggest AI agent news this week');
  const [voiceOn, setVoiceOn] = useState(false);
  const [designing, setDesigning] = useState<false | 'hero' | 'boss'>(false);
  const { phase, round, log } = useBattle();

  useBattleVoice(voiceOn); // narration (needs the toggle as the user gesture)

  const toneColor = { info: '#9d97c9', good: '#57d9a3', bad: '#ff6b81', crit: '#ffd166' } as const;
  const fighting = phase === 'fighting';
  const showReport = phase === 'victory' || phase === 'defeat';

  const btn = (bg: string): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: 8, border: 0, background: bg, color: '#fff', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  });

  return (
    <div style={{ fontFamily: 'ui-monospace, monospace', color: '#e6e2ff', padding: 24, minHeight: '100vh', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: '0 0 4px' }}>AgentVerse ⚔️</h1>
        <button onClick={() => setVoiceOn((v) => !v)}
          style={{ background: 'none', border: '1px solid #3a3260', color: voiceOn ? '#57d9a3' : '#9d97c9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {voiceOn ? '🔊 Voice on' : '🔈 Voice off'}
        </button>
      </div>
      <p style={{ margin: '0 0 16px', color: '#9d97c9' }}>
        Watch your AI agent battle the problem — powered by Grok.{phase !== 'idle' && ` · Round ${round}`}
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setDesigning('hero')} style={btn('#2a2450')}>✦ Design your hero</button>
        <button onClick={() => setDesigning('boss')} style={btn('#2a2450')}>👹 Design the boss</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Give your agent a quest…" disabled={fighting}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #3a3260', background: '#181430', color: '#fff', fontFamily: 'inherit' }} />
        <button onClick={() => runAgent(task)} disabled={fighting} style={{ ...btn(fighting ? '#463a7a' : '#7c5cff'), padding: '12px 20px', cursor: fighting ? 'default' : 'pointer' }}>
          {fighting ? 'Fighting…' : 'Start Quest'}
        </button>
      </div>

      {/* Side-view JRPG battle stage — self-contained (sprites, HP bars, damage, casts). */}
      <div style={{ marginBottom: 20 }}>
        <BattleStage />
      </div>

      <div style={{ height: 220, overflowY: 'auto', background: '#120f26', border: '1px solid #2a2450', borderRadius: 10, padding: 14 }}>
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

      {/* Victory / defeat report card */}
      <AnimatePresence>
        {showReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <ReportCard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Human-in-the-loop character designer */}
      {designing && <DesignStudio target={designing} onDone={() => setDesigning(false)} />}
    </div>
  );
}
