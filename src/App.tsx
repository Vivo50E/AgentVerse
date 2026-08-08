import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattle } from './battle/store';
import { runAgent } from './agent/run';
import { JourneyStage } from './components/battle';
import { QuestTrack } from './components/QuestTrack';
import { ReportCard } from './components/ReportCard';
import { AnswerView } from './components/AnswerView';
import { AgentFlowView } from './components/AgentFlowView';
import { SettingsPanel } from './components/SettingsPanel';
import { GrokletGuide } from './components/GrokletGuide';
import { DesignStudio } from './design';
import { EquipmentPanel } from './loadout';
import { HeroInventory } from './heroes';
import { useBattleVoice, primeSpeech, speak } from './voice';
import {
  IconWand, IconSkull, IconRoster, IconLoadout, IconSettings, IconPlay, IconSwords,
} from './components/icons';

const PIXEL = "'Press Start 2P', ui-monospace, monospace";

// Chamfered "pixel window" corner cut (clip-path clips outset shadows, so all
// bevels/borders below are drawn with INSET shadows).
const chamfer = (c: number): string =>
  `polygon(0 ${c}px, ${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

// A retro RPG window frame: cut corners + chunky double inset border + top
// highlight, no rounded corners.
const panel: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(32,25,64,0.82), rgba(15,11,34,0.82))',
  clipPath: chamfer(10),
  boxShadow:
    'inset 0 0 0 2px #4a3f7a, inset 0 0 0 4px #17122e, inset 0 3px 0 rgba(255,255,255,0.07), 0 14px 44px rgba(0,0,0,0.45)',
  backdropFilter: 'blur(8px)',
};

function GameButton({ children, onClick, variant = 'ghost', disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'ghost' | 'primary' | 'gold'; disabled?: boolean;
}) {
  const themes = {
    ghost: { bg: 'linear-gradient(180deg,#2a2350,#1c1740)', bd: '#5a4f92', fg: '#d9d3ff', glow: 'rgba(124,92,255,0.30)' },
    primary: { bg: 'linear-gradient(180deg,#8f6dff,#6a45e0)', bd: '#c3b0ff', fg: '#fff', glow: 'rgba(124,92,255,0.6)' },
    gold: { bg: 'linear-gradient(180deg,#ffd873,#e0a63a)', bd: '#fff0c2', fg: '#3a2600', glow: 'rgba(255,209,102,0.55)' },
  }[variant];
  return (
    // Pixel-game feel: the button jumps on hover / sinks on press (no scale).
    <motion.button
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { y: 1 }}
      transition={{ type: 'tween', duration: 0.06 }}
      onClick={onClick} disabled={disabled}
      style={{
        position: 'relative', overflow: 'hidden', padding: '10px 16px',
        clipPath: chamfer(5),
        border: 'none', background: themes.bg, color: themes.fg, fontFamily: 'inherit',
        fontWeight: 700, letterSpacing: 0.4, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1,
        // 2px pixel border + top highlight + bottom bevel "lip" (all inset so the
        // chamfer clip doesn't eat them), plus an outer glow ring.
        boxShadow: `inset 0 0 0 2px ${themes.bd}, inset 0 2px 0 rgba(255,255,255,0.28), inset 0 -4px 0 rgba(0,0,0,0.32), 0 0 14px ${themes.glow}`,
      }}>
      {variant === 'primary' && !disabled && (
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)', backgroundSize: '250% 100%', animation: 'sheen 2.6s linear infinite' }} />
      )}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7 }}>{children}</span>
    </motion.button>
  );
}

const readVoicePref = (): boolean => {
  try { return localStorage.getItem('agentverse:voice') !== 'off'; } catch { return true; }
};

export function App() {
  const [task, setTask] = useState('Research the biggest AI agent news this week');
  const [voiceOn, setVoiceOn] = useState(readVoicePref); // ON by default
  const [designing, setDesigning] = useState<false | 'hero' | 'boss'>(false);
  const [loadout, setLoadout] = useState(false);
  const [showHeroes, setShowHeroes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [logMode, setLogMode] = useState<'log' | 'flow'>('log');
  const [reportDismissed, setReportDismissed] = useState(false);
  const { phase, round, log, answer, sources, streamDone } = useBattle();

  useBattleVoice(voiceOn);

  const changeVoice = (v: boolean) => {
    setVoiceOn(v);
    try { localStorage.setItem('agentverse:voice', v ? 'on' : 'off'); } catch { /* ignore */ }
    if (v) speak('Voice narration on'); // spoken inside the toggle gesture → confirms + unlocks the engine
  };

  const toneColor = { info: '#9d97c9', good: '#57d9a3', bad: '#ff6b81', crit: '#ffd166' } as const;
  const fighting = phase === 'fighting';
  const showReport = (phase === 'victory' || phase === 'defeat') && !reportDismissed;
  const startQuest = () => {
    setReportDismissed(false);
    if (voiceOn) primeSpeech(); // unlock speech within this click so async battle lines can play
    runAgent(task);
  };

  return (
    <div style={{ color: '#e6e2ff', padding: '28px 24px 48px', minHeight: '100vh', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{
          margin: 0, fontFamily: PIXEL, fontSize: 30, lineHeight: 1.2,
          background: 'linear-gradient(90deg,#b9a3ff,#7c5cff 40%,#57d9a3)', WebkitBackgroundClip: 'text',
          backgroundClip: 'text', color: 'transparent', animation: 'titleGlow 4s ease-in-out infinite',
        }}>
          AgentVerse<span style={{ WebkitTextFillColor: 'initial' }}> ⚔️</span>
        </h1>
        <GrokletGuide style={{ position: 'fixed', top: '120px', right: '40px', zIndex: 50 }} />
        <GameButton onClick={() => setShowSettings(true)}><IconSettings size={15} /> Settings</GameButton>
      </div>
      <p style={{ margin: '0 0 22px', color: '#a79be0', fontSize: 13 }}>
        Watch your AI agent adventure through the problem — powered by Grok.
        {phase !== 'idle' && <span style={{ color: '#ffd166' }}>{'  ·  Round ' + round}</span>}
      </p>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <GameButton onClick={() => setDesigning('hero')}><IconWand size={15} /> Design Hero</GameButton>
        <GameButton onClick={() => setDesigning('boss')}><IconSkull size={15} /> Design Boss</GameButton>
        <GameButton onClick={() => setShowHeroes(true)}><IconRoster size={15} /> Heroes</GameButton>
        <GameButton onClick={() => setLoadout(true)}><IconLoadout size={15} /> Loadout</GameButton>
      </div>

      {/* Quest console */}
      <div style={{ ...panel, display: 'flex', gap: 12, padding: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ color: '#57d9a3', fontWeight: 700 }}>▸</span>
        <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Give your agent a quest…" disabled={fighting}
          style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: '#fff', fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
        <GameButton variant="primary" disabled={fighting} onClick={startQuest}>
          {fighting ? <><IconSwords size={15} /> Fighting…</> : <><IconPlay size={15} /> Start Quest</>}
        </GameButton>
      </div>

      {/* Quest track + journey stage */}
      <div style={{ ...panel, padding: 14, marginBottom: 20 }}>
        <QuestTrack />
        <div style={{ marginTop: 12 }}>
          <JourneyStage />
        </div>
      </div>

      {/* Battle log / Agent flow — a toggle between the RPG-flavored log and the
          real agent execution trace (gamified view <-> observability view). */}
      <div style={{ ...panel, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #3a2f66', background: 'linear-gradient(180deg,#2a2350,#1c1740)' }}>
          {([['log', '⚔ Battle Log'], ['flow', '◇ Agent Flow']] as const).map(([mode, label]) => {
            const on = logMode === mode;
            return (
              <button key={mode} onClick={() => setLogMode(mode)}
                style={{ fontFamily: PIXEL, fontSize: 9, letterSpacing: 1, padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${on ? '#7c5cff' : 'transparent'}`,
                  background: on ? 'rgba(124,92,255,0.22)' : 'transparent',
                  color: on ? '#e6e2ff' : '#8b84b8' }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ height: 220, overflowY: 'auto', padding: 14 }}>
          {logMode === 'log' ? (
            <>
              <AnimatePresence initial={false}>
                {log.map((e) => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    style={{ color: toneColor[e.tone], fontSize: 13, padding: '3px 0', textShadow: e.tone === 'crit' ? '0 0 8px #ffd16688' : 'none' }}>
                    <span style={{ opacity: 0.4 }}>R{e.round} </span>{e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              {log.length === 0 && (
                <span style={{ color: '#655e90' }}>Battle log will appear here<span style={{ animation: 'blink 1s step-end infinite' }}>▌</span></span>
              )}
            </>
          ) : (
            <AgentFlowView />
          )}
        </div>
      </div>

      {/* Persistent quest result — the actual useful output, always on screen. */}
      {phase !== 'idle' && (
        <div style={{ ...panel, padding: 16, marginTop: 20 }}>
          <AnswerView answer={answer} sources={sources} streaming={!streamDone} maxHeight={300} />
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {showReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setReportDismissed(true)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '4vh 16px' }}>
            <div onClick={(e) => e.stopPropagation()}>
              <ReportCard onClose={() => setReportDismissed(true)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {designing && <DesignStudio target={designing} onDone={() => setDesigning(false)} />}

      {showHeroes && (
        <HeroInventory
          onClose={() => setShowHeroes(false)}
          onDesignNew={() => { setShowHeroes(false); setDesigning('hero'); }}
        />
      )}

      <AnimatePresence>
        {loadout && <EquipmentPanel key="loadout" onClose={() => setLoadout(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel key="settings" voiceOn={voiceOn} setVoiceOn={changeVoice} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
