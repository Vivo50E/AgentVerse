import { motion } from 'framer-motion';
import type { SkillKind } from '../../battle/types';

export interface SkillCastProps {
  /** Text shown in the banner, e.g. the tool label. */
  label: string;
  /** Which skill is being cast — drives the accent color. */
  skill: SkillKind;
}

interface SkillTheme {
  accent: string;
  glow: string;
  icon: string;
}

const THEMES: Record<SkillKind, SkillTheme> = {
  intel_summon: { accent: '#7c5cff', glow: '#3ad6ff', icon: '🔮' },
  forge: { accent: '#ff9f43', glow: '#ffca7a', icon: '⚒️' },
  strike: { accent: '#ff6b81', glow: '#ff9aa8', icon: '⚔️' },
  focus: { accent: '#9d97c9', glow: '#cdc7e6', icon: '🧠' },
};

/**
 * A skill-cast banner/flash: scales up with a glow, then fades.
 * Meant to be keyed (or wrapped in AnimatePresence) so a new cast re-triggers it.
 */
export function SkillCast({ label, skill }: SkillCastProps) {
  const theme = THEMES[skill];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1.12, 1, 1.02],
      }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.1, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 18px',
        borderRadius: 10,
        border: `1px solid ${theme.accent}`,
        background: `linear-gradient(180deg, #181430 0%, #120f26 100%)`,
        color: '#e6e2ff',
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: 0.5,
        textShadow: `0 0 8px ${theme.glow}`,
        boxShadow: `0 0 18px ${theme.accent}, 0 0 40px ${theme.glow}55`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 20 }}>{theme.icon}</span>
      <span>{label}</span>
    </motion.div>
  );
}
