// Character Design Studio — a delightful human-in-the-loop screen where the
// player co-creates their hero (or boss) sprite with a team of AI designers.
//   concept -> summon candidates -> pick one -> (refine | use it) -> forge sprite.
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CharacterSprites } from '../battle/sprites';
import { useCharacters } from '../battle/characters';
import { finalizeDesign, requestDesigns, type Candidate } from './designApi';

/* ---- palette (matches App.tsx aesthetic) ---- */
const BG = '#0d0b1a';
const PANEL = '#120f26';
const PANEL_HI = '#181430';
const BORDER = '#2a2450';
const ACCENT = '#7c5cff';
const GOOD = '#57d9a3';
const GOLD = '#ffd166';
const TEXT = '#e6e2ff';
const MUTED = '#9d97c9';
const FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const CONCEPT_CHIPS = [
  'cyber ninja',
  'flame knight',
  'cute slime mage',
  'astral archer',
  'clockwork golem',
  'void sorceress',
];

const HERO_LABEL = { hero: 'hero', boss: 'boss' } as const;

type Phase = 'concept' | 'gallery';

interface DesignStudioProps {
  onDone: () => void;
  target?: 'hero' | 'boss';
}

const btnBase: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 700,
  borderRadius: 10,
  padding: '12px 20px',
  border: 0,
  cursor: 'pointer',
  fontSize: 14,
};

const spriteImg: React.CSSProperties = {
  width: '100%',
  display: 'block',
  imageRendering: 'pixelated',
  aspectRatio: '4 / 1',
  objectFit: 'contain',
  background: '#1a1536',
};

export function DesignStudio({ onDone, target = 'hero' }: DesignStudioProps) {
  const [phase, setPhase] = useState<Phase>('concept');
  const [concept, setConcept] = useState('');
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false); // summoning / refining candidates
  const [forging, setForging] = useState(false); // finalizing chosen sprite
  const [error, setError] = useState<string | null>(null);

  const n = 4;
  const busy = loading || forging;
  const kind = HERO_LABEL[target];

  const selected = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  const summon = useCallback(
    async (fb?: string) => {
      const c = concept.trim();
      if (!c || busy) return;
      setLoading(true);
      setError(null);
      setSelectedId(null);
      setPhase('gallery');
      const res = await requestDesigns(c, { feedback: fb, n, target });
      setCandidates(res.candidates);
      if (res.error) setError(res.error);
      else if (res.candidates.length === 0) setError('The designers came back empty-handed. Try another concept.');
      setLoading(false);
    },
    [concept, busy, target],
  );

  const useThis = useCallback(async () => {
    if (!selected || busy) return;
    setForging(true);
    setError(null);
    try {
      const finalName = name.trim() || selected.label || concept.trim() || `My ${kind}`;
      const sprites: CharacterSprites = await finalizeDesign(selected.url, finalName);
      if (target === 'boss') useCharacters.getState().setBoss(sprites);
      else useCharacters.getState().setHero(sprites);
      setForging(false);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to forge the sprite. Try again.');
      setForging(false);
    }
  }, [selected, busy, name, concept, kind, target, onDone]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: BG, overflowY: 'auto', fontFamily: FONT, color: TEXT }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 56px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ margin: 0, fontSize: 28, background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
          >
            ✦ Character Design Studio
          </motion.h1>
          <button
            onClick={onDone}
            disabled={forging}
            style={{ ...btnBase, background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '6px 12px', fontWeight: 500, cursor: forging ? 'default' : 'pointer' }}
          >
            ✕ Close
          </button>
        </div>
        <p style={{ margin: '0 0 24px', color: MUTED }}>
          Co-create your {kind} with a team of AI designers. Describe it, pick your favorite, refine until it's perfect.
        </p>

        {/* ---- Concept panel ---- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginBottom: 24 }}
        >
          <label style={{ display: 'block', color: MUTED, fontSize: 13, marginBottom: 8 }}>Describe your {kind}</label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void summon(); }}
              placeholder={`Describe your ${kind}…`}
              disabled={busy}
              style={{ flex: '1 1 320px', padding: 12, borderRadius: 10, border: `1px solid ${BORDER}`, background: PANEL_HI, color: '#fff', fontFamily: FONT, fontSize: 14 }}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => void summon()}
              disabled={busy || !concept.trim()}
              style={{ ...btnBase, background: busy || !concept.trim() ? '#463a7a' : ACCENT, color: '#fff', cursor: busy || !concept.trim() ? 'default' : 'pointer' }}
            >
              {loading ? '✧ Summoning…' : '✧ Summon designs'}
            </motion.button>
          </div>

          {/* Quick-pick chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {CONCEPT_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => { setConcept(chip); }}
                disabled={busy}
                style={{
                  ...btnBase,
                  padding: '6px 12px',
                  fontWeight: 500,
                  fontSize: 13,
                  background: concept === chip ? 'rgba(124,92,255,0.22)' : 'transparent',
                  border: `1px solid ${concept === chip ? ACCENT : BORDER}`,
                  color: concept === chip ? TEXT : MUTED,
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ---- Gallery ---- */}
        <AnimatePresence>
          {phase === 'gallery' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  {loading ? 'Designers at work…' : `${candidates.length} design${candidates.length === 1 ? '' : 's'} ready`}
                </h2>
                {loading && <span style={{ color: MUTED, fontSize: 13 }}>{n} AI designers sketching in parallel</span>}
              </div>

              {/* Error / empty state */}
              {!loading && error && (
                <div style={{ background: 'rgba(255,107,129,0.1)', border: '1px solid #ff6b81', borderRadius: 12, padding: 16, marginBottom: 16, color: '#ffb3bf' }}>
                  <div style={{ marginBottom: 10 }}>⚠ {error}</div>
                  <button
                    onClick={() => void summon(feedback.trim() || undefined)}
                    style={{ ...btnBase, background: ACCENT, color: '#fff', padding: '8px 16px' }}
                  >
                    ↻ Try again
                  </button>
                </div>
              )}

              {/* Grid of candidates or animated placeholders */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {loading
                  ? Array.from({ length: n }).map((_, i) => <DesignerPlaceholder key={i} index={i} />)
                  : candidates.map((cand, i) => (
                      <motion.button
                        key={cand.id}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedId(cand.id)}
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: 10,
                          borderRadius: 14,
                          background: PANEL,
                          border: `2px solid ${selectedId === cand.id ? GOOD : BORDER}`,
                          boxShadow: selectedId === cand.id ? `0 0 0 3px rgba(87,217,163,0.25), 0 8px 24px rgba(87,217,163,0.15)` : 'none',
                          fontFamily: FONT,
                          position: 'relative',
                        }}
                      >
                        <img src={cand.url} alt={cand.label} style={{ ...spriteImg, borderRadius: 8 }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          <span style={{ color: TEXT, fontSize: 13 }}>{cand.label}</span>
                          {selectedId === cand.id && <span style={{ color: GOOD, fontSize: 13, fontWeight: 700 }}>✓ picked</span>}
                        </div>
                      </motion.button>
                    ))}
              </div>

              {/* Refine + confirm controls */}
              {!loading && candidates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginTop: 24 }}
                >
                  <label style={{ display: 'block', color: MUTED, fontSize: 13, marginBottom: 8 }}>
                    Not quite right? Tell the designers what to change, then refine.
                  </label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    <input
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void summon(feedback.trim() || undefined); }}
                      placeholder="e.g. more glowing, add a cape, darker colors…"
                      disabled={busy}
                      style={{ flex: '1 1 320px', padding: 12, borderRadius: 10, border: `1px solid ${BORDER}`, background: PANEL_HI, color: '#fff', fontFamily: FONT, fontSize: 14 }}
                    />
                    <button
                      onClick={() => void summon(feedback.trim() || undefined)}
                      disabled={busy}
                      style={{ ...btnBase, background: 'transparent', border: `1px solid ${ACCENT}`, color: ACCENT, cursor: busy ? 'default' : 'pointer' }}
                    >
                      ↻ Refine
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={`Name your ${kind} (optional)`}
                      disabled={busy}
                      style={{ flex: '1 1 220px', padding: 12, borderRadius: 10, border: `1px solid ${BORDER}`, background: PANEL_HI, color: '#fff', fontFamily: FONT, fontSize: 14 }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => void useThis()}
                      disabled={busy || !selected}
                      style={{
                        ...btnBase,
                        background: !selected || busy ? '#2f6a52' : GOOD,
                        color: !selected || busy ? '#7fb79f' : '#062117',
                        cursor: !selected || busy ? 'default' : 'pointer',
                      }}
                    >
                      {forging ? '⚒ Forging sprite…' : selected ? `⚔ Use this ${kind}` : `Pick a ${kind} first`}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Forging overlay */}
      <AnimatePresence>
        {forging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, zIndex: 120 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
              style={{ width: 56, height: 56, borderRadius: '50%', border: `4px solid ${BORDER}`, borderTopColor: GOLD }}
            />
            <div style={{ color: GOLD, fontSize: 16, letterSpacing: 1 }}>Forging your sprite…</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Playful "an AI designer is sketching" placeholder shown while candidates load. */
function DesignerPlaceholder({ index }: { index: number }) {
  const labels = ['Designer A', 'Designer B', 'Designer C', 'Designer D', 'Designer E', 'Designer F'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{ padding: 10, borderRadius: 14, background: PANEL, border: `1px solid ${BORDER}` }}
    >
      <motion.div
        animate={{ backgroundPositionX: ['0%', '200%'] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear', delay: index * 0.12 }}
        style={{
          ...spriteImg,
          borderRadius: 8,
          background: `linear-gradient(90deg, #1a1536 0%, #2a2450 20%, #1a1536 40%)`,
          backgroundSize: '200% 100%',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: index * 0.15 }}
          style={{ color: ACCENT }}
        >
          ✦
        </motion.span>
        <span style={{ color: MUTED, fontSize: 13 }}>{labels[index % labels.length]} sketching…</span>
      </div>
    </motion.div>
  );
}
