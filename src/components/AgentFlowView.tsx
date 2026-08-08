// Agent Flow — the real agent-execution trace behind the RPG battle log:
// the actual tool calls (web_search / x_search / code_execution), their status,
// and the final output. This is the "observability" side of the gamified view.
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../battle/store';

const C = {
  border: '#2f2758',
  accent: '#7c5cff',
  good: '#57d9a3',
  bad: '#ff6b81',
  gold: '#ffd166',
  text: '#e6e2ff',
  dim: '#9d97c9',
  faint: '#655e90',
};

const STATUS: Record<string, { icon: string; color: string }> = {
  running: { icon: '◌', color: '#ffd166' },
  ok: { icon: '✓', color: '#57d9a3' },
  error: { icon: '✕', color: '#ff6b81' },
};

export function AgentFlowView() {
  const flow = useBattle((s) => s.flow);
  const phase = useBattle((s) => s.phase);
  const streamDone = useBattle((s) => s.streamDone);

  return (
    <div style={{ fontFamily: 'ui-monospace, monospace' }}>
      {flow.length === 0 && phase === 'idle' && (
        <span style={{ color: C.faint, fontSize: 13 }}>
          The agent's real execution trace (tool calls, results, output) will appear here.
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence initial={false}>
          {flow.map((step, i) => {
            const st = STATUS[step.status];
            const running = step.status === 'running';
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', fontSize: 13, lineHeight: 1.4 }}
              >
                <span style={{ color: C.faint, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <span
                  style={{ color: st.color, flexShrink: 0, animation: running ? 'blink 1s step-end infinite' : undefined }}
                >
                  {st.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: step.kind === 'tool' ? C.accent : step.status === 'error' ? C.bad : C.gold, fontWeight: 700 }}>
                    {step.label}
                  </span>
                  {step.detail && (
                    <span style={{ color: C.dim }}> — {step.detail}</span>
                  )}
                  {running && <span style={{ color: C.faint }}> …</span>}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {phase !== 'idle' && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.faint }}>
          {streamDone ? 'Run complete.' : 'Agent running…'}
        </div>
      )}
    </div>
  );
}
