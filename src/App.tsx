import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattle } from './battle/store';
import { useCharacters } from './battle/characters';
import { runAgent } from './agent/run';
import { JourneyStage, BossAwakening, CommandMenu, type BossAwakeningPhase } from './components/battle';
import { QuestTrack } from './components/QuestTrack';
import { ReportCard } from './components/ReportCard';
import { AnswerView } from './components/AnswerView';
import { AgentFlowView } from './components/AgentFlowView';
import { SettingsPanel } from './components/SettingsPanel';
import { ComingSoon } from './components/ComingSoon';
import { PromoQR } from './components/PromoQR';
import { DesignStudio } from './design';
import { requestTaskBoss } from './design/designApi';
import { EquipmentPanel } from './loadout';
import { HeroInventory } from './heroes';
import { useBattleSfx, resumeAudio } from './sfx';
import {
  IconWand, IconSkull, IconRoster, IconLoadout, IconSettings, IconPlay, IconSwords, IconBook,
  IconFriends, IconTrophy, IconBoard,
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

const readSfxPref = (): boolean => {
  try { return localStorage.getItem('agentverse:sfx') !== 'off'; } catch { return true; }
};

// Opt-in (plan.md §7d adds a ~5-10s wait before battle starts): off by default,
// so the default experience stays fast; players who want the "wow" turn it on.
const readThemedBossPref = (): boolean => {
  try { return localStorage.getItem('agentverse:themedBoss') === 'on'; } catch { return false; }
};

// Opt-in (plan.md §7e pauses between rounds for player input): off by default,
// so the default demo stays a hands-off, uninterrupted run.
const readHitlPref = (): boolean => {
  try { return localStorage.getItem('agentverse:hitl') === 'on'; } catch { return false; }
};

export function App() {
  const [task, setTask] = useState('Research the biggest AI agent news this week');
  const [sfxOn, setSfxOn] = useState(readSfxPref); // ON by default
  const [designing, setDesigning] = useState<false | 'hero' | 'boss'>(false);
  const [loadout, setLoadout] = useState(false);
  const [showHeroes, setShowHeroes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [logMode, setLogMode] = useState<'log' | 'flow'>('log');
  const [reportDismissed, setReportDismissed] = useState(false);
  const [bossPhase, setBossPhase] = useState<BossAwakeningPhase>(null);
  const [awakenedBossName, setAwakenedBossName] = useState<string | undefined>();
  const [themedBossOn, setThemedBossOnState] = useState(readThemedBossPref);
  const [hitlOn, setHitlOnState] = useState(readHitlPref);
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [comingSoon, setComingSoon] = useState<{ title: string; desc: string } | null>(null);
  const taskInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the quest textarea with its content instead of scrolling internally.
  useLayoutEffect(() => {
    const el = taskInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [task]);

  const { phase, round, log, answer, sources, streamDone } = useBattle();

  // 6 high-variance demo cases spanning different domains, tools, and complexity
  // (code, research, creative, real-time social, analysis, multi-step planning)
  const demoCases = [
    {
      id: 1,
      title: "Code Healer",
      emoji: "🔧",
      desc: "Real bug fix + test verification (code_execution heavy)",
      prompt: `Fix this bug and verify with a test: function sumArray(arr) { let total; for (let i=0; i<=arr.length; i++) { total += arr[i]; } return total; }`,
    },
    {
      id: 2,
      title: "Market Oracle",
      emoji: "📈",
      desc: "Deep research on latest AI investment trends (web_search + synthesis)",
      prompt: `Provide a comprehensive analysis of the top 5 AI investment trends in 2026. Include key companies, funding numbers, and why each trend matters. Cite sources.`,
    },
    {
      id: 3,
      title: "Creative Director",
      emoji: "🎨",
      desc: "Multi-step creative task (image concept + prompt engineering)",
      prompt: `Design a complete visual identity for a new cyber-fantasy JRPG called "AgentVerse". Propose hero, villain, logo concept, color palette, and write 3 detailed Grok Imagine prompts that would generate perfect key art.`,
    },
    {
      id: 4,
      title: "X Pulse",
      emoji: "⚡",
      desc: "Real-time social sentiment + trend analysis (x_search dominant)",
      prompt: `What's the current sentiment on X about Grok 4 versus Claude 4 and GPT-5? Identify the top 3 most discussed strengths/weaknesses and any viral memes or controversies in the last 48 hours.`,
    },
    {
      id: 5,
      title: "Policy Analyst",
      emoji: "📜",
      desc: "Complex multi-tool reasoning on real-world regulation (web_search + critical thinking)",
      prompt: `Analyze the potential impact of the EU AI Act on open-source model development in 2026. Compare it with US policy, predict the biggest winners and losers among AI companies, and suggest one strategic pivot for xAI.`,
    },
    {
      id: 6,
      title: "Epic Quest Master",
      emoji: "🗡️",
      desc: "Full multi-tool creative + technical combo (research + code + narrative)",
      prompt: `Create a complete 5-room text adventure game set in an AI research lab that has gone rogue. Include: (1) rich narrative, (2) interesting puzzles that require code or search to solve, (3) write the full working Python code using only standard library, and (4) test that it runs without errors.`,
    },
  ];

  const loadDemo = (index: number) => {
    const demo = demoCases[index];
    setTask(demo.prompt);
    setSelectedDemo(index);
    // Optional: auto-start after load (uncomment if desired)
    // setTimeout(() => startQuest(), 100);
  };

  useBattleSfx(sfxOn);

  const changeSfx = (v: boolean) => {
    setSfxOn(v);
    try { localStorage.setItem('agentverse:sfx', v ? 'on' : 'off'); } catch { /* ignore */ }
  };

  const changeThemedBoss = (v: boolean) => {
    setThemedBossOnState(v);
    try { localStorage.setItem('agentverse:themedBoss', v ? 'on' : 'off'); } catch { /* ignore */ }
  };

  const changeHitl = (v: boolean) => {
    setHitlOnState(v);
    try { localStorage.setItem('agentverse:hitl', v ? 'on' : 'off'); } catch { /* ignore */ }
  };

  const toneColor = { info: '#9d97c9', good: '#57d9a3', bad: '#ff6b81', crit: '#ffd166' } as const;
  const fighting = phase === 'fighting';
  const summoningBoss = bossPhase !== null;
  const showReport = (phase === 'victory' || phase === 'defeat') && !reportDismissed;
  const startQuest = async () => {
    setReportDismissed(false);
    if (sfxOn) resumeAudio(); // unlock the audio context within this click (browser policy)

    // Task-themed boss generation (plan.md §7d) — opt-in via Settings, since it
    // adds a ~5-10s wait before the fight begins. Falls back to the default
    // boss silently on failure/timeout, or immediately if the toggle is off.
    if (themedBossOn) {
      setBossPhase('summoning');
      const { sprites } = await requestTaskBoss(task);
      const chars = useCharacters.getState();
      if (sprites) {
        chars.setBoss(sprites);
        setAwakenedBossName(sprites.name);
        setBossPhase('revealed');
        await new Promise((r) => setTimeout(r, 900));
      } else {
        chars.resetBoss();
      }
      setBossPhase(null);
    } else {
      useCharacters.getState().resetBoss();
    }
    runAgent(task, { hitl: hitlOn });
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
        <PromoQR style={{ zIndex: 50 }} />
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
        <GameButton onClick={() => setLoadout(true)}><IconLoadout size={15} /> Equipment</GameButton>
        <GameButton
          onClick={() => setShowDemoPanel(!showDemoPanel)}
          variant={showDemoPanel ? "gold" : "ghost"}
        >
          <IconBook size={15} /> {showDemoPanel ? 'Hide Demos' : 'Show 6 Demos'}
        </GameButton>
        <GameButton onClick={() => setComingSoon({ title: '🧑‍🤝‍🧑 FRIENDS', desc: 'Add friends and watch each other\'s quests unfold.' })}>
          <IconFriends size={15} /> Friends
        </GameButton>
        <GameButton onClick={() => setComingSoon({ title: '🏆 LEADERBOARD', desc: 'Rank agent runs by HP remaining, speed, and tool efficiency.' })}>
          <IconTrophy size={15} /> Leaderboard
        </GameButton>
        <GameButton onClick={() => setComingSoon({ title: '📌 QUEST BOARD', desc: 'A home base listing every pending and completed quest.' })}>
          <IconBoard size={15} /> Quest Board
        </GameButton>
        <GameButton onClick={() => setShowSettings(true)}><IconSettings size={15} /> Settings</GameButton>
      </div>

      {/* Collapsible Demo Cases Panel */}
      <AnimatePresence>
        {showDemoPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ ...panel, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontFamily: PIXEL, fontSize: 14, color: '#ffd166' }}>
                <IconBook size={20} /> 6 DEMO QUESTS — Click any card to load prompt
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 10 }}>
                {demoCases.map((demo, index) => {
                  const isSelected = selectedDemo === index;
                  return (
                    <motion.button
                      key={demo.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => loadDemo(index)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? '#ffd166' : '#3a2f66'}`,
                        background: isSelected 
                          ? 'linear-gradient(145deg, rgba(255,209,102,0.15), rgba(26,22,48,0.8))' 
                          : 'rgba(26, 22, 48, 0.7)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        fontFamily: 'inherit',
                        boxShadow: isSelected ? '0 0 16px rgba(255, 209, 102, 0.4)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 26, marginBottom: 6, lineHeight: 1 }}>{demo.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: isSelected ? '#ffd166' : '#e6e2ff' }}>
                        {demo.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#a79be0', lineHeight: 1.4, minHeight: '2.8em' }}>
                        {demo.desc}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: '#655e90', textAlign: 'center', fontStyle: 'italic' }}>
                Each demo is tuned to trigger specific tools (Intel Summon ⚡, Forge, multi-tool combos), themed bosses, and rich battle flow.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest console */}
      <div style={{ ...panel, display: 'flex', gap: 12, padding: 12, marginBottom: 20, alignItems: 'flex-end' }}>
        <span style={{ color: '#57d9a3', fontWeight: 700, paddingBottom: 10 }}>▸</span>
        <textarea
          ref={taskInputRef}
          value={task}
          onChange={(e) => {
            setTask(e.target.value);
            setSelectedDemo(null); // clear selection when user edits manually
          }}
          onKeyDown={(e) => {
            // Enter inserts a newline (default textarea behavior); Shift+Enter submits.
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault();
              if (!fighting && !summoningBoss) startQuest();
            }
          }}
          placeholder="Give your agent a quest…"
          disabled={fighting || summoningBoss}
          rows={1}
          style={{
            flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', background: 'transparent',
            color: '#fff', fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'none',
            lineHeight: 1.5, minHeight: 22, maxHeight: 200, overflowY: 'auto',
          }}
        />
        <GameButton variant="primary" disabled={fighting || summoningBoss} onClick={startQuest}>
          {fighting
            ? <><IconSwords size={15} /> Fighting…</>
            : summoningBoss
              ? <>🌑 Awakening foe…</>
              : <><IconPlay size={15} /> Start Quest</>}
        </GameButton>
      </div>

      {/* Quest track + classic JRPG side-scrolling journey (restored) */}
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
      <BossAwakening phase={bossPhase} bossName={awakenedBossName} />
      <CommandMenu />

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
          <SettingsPanel
            key="settings"
            sfxOn={sfxOn}
            setSfxOn={changeSfx}
            themedBossOn={themedBossOn}
            setThemedBossOn={changeThemedBoss}
            hitlOn={hitlOn}
            setHitlOn={changeHitl}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comingSoon && (
          <ComingSoon
            key="coming-soon"
            title={comingSoon.title}
            desc={comingSoon.desc}
            onClose={() => setComingSoon(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
