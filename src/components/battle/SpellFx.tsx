// SpellFx — reusable arcane magic VFX for the wizard hero.
// Fires a one-shot effect each time `trigger` changes. Fully self-contained,
// inline styles only, positioned absolutely inside a relative/absolute parent.
import { AnimatePresence, motion } from 'framer-motion';
import type { SkillKind } from '../../battle/types';

export interface SpellFxProps {
  trigger: number; // change/increment this to fire an effect
  kind: 'cast' | 'hit'; // 'cast' = charge aura at origin; 'hit' = projectile origin->target + impact
  skill?: SkillKind; // tints the effect
  originX: number;
  originY: number; // px inside the parent (hero staff tip)
  targetX: number;
  targetY: number; // px inside the parent (foe center)
}

// ── Palette ────────────────────────────────────────────────────────────────
interface Palette {
  core: string; // bright core
  glow: string; // outer glow / secondary
  spark: string; // particle color
}

// Default = arcane blue/purple/cyan (matches the blue mage).
const DEFAULT_PALETTE: Palette = { core: '#3ad6ff', glow: '#7c5cff', spark: '#bfe9ff' };

const PALETTES: Record<SkillKind, Palette> = {
  intel_summon: { core: '#3ad6ff', glow: '#7c5cff', spark: '#cfe9ff' },
  forge: { core: '#ffd166', glow: '#ff9f43', spark: '#ffe6b0' },
  strike: { core: '#ff6b81', glow: '#ff3b5c', spark: '#ffc2cc' },
  focus: { core: '#9d97c9', glow: '#6f6aa8', spark: '#d8d5f0' },
};

function paletteFor(skill?: SkillKind): Palette {
  return skill ? PALETTES[skill] : DEFAULT_PALETTE;
}

// Deterministic particle angles (no Math.random in render). 12 evenly spread,
// nudged per-index so bursts feel organic but reproducible.
const PARTICLE_ANGLES: number[] = Array.from({ length: 12 }, (_, i) => {
  const base = (360 / 12) * i;
  const jitter = ((i * 47) % 23) - 11; // deterministic pseudo-jitter
  return ((base + jitter) * Math.PI) / 180;
});

// Deterministic swirl radii for the charge particles.
const SWIRL_RADII: number[] = PARTICLE_ANGLES.map((_, i) => 24 + ((i * 13) % 20));

// ── Charge / cast effect ─────────────────────────────────────────────────────
function CastEffect({ x, y, pal }: { x: number; y: number; pal: Palette }): JSX.Element {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    mixBlendMode: 'screen',
  };
  return (
    <>
      {/* Expanding glowing rune circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.6, 2.1] }}
        transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.5, 1] }}
        style={{
          ...base,
          width: 90,
          height: 90,
          borderRadius: '50%',
          border: `2px solid ${pal.core}`,
          boxShadow: `0 0 18px ${pal.core}, inset 0 0 18px ${pal.glow}`,
        }}
      />
      {/* Second counter-rune ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.1, rotate: 0 }}
        animate={{ opacity: [0, 0.7, 0], scale: [0.1, 1.1, 1.5], rotate: 180 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{
          ...base,
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `2px dashed ${pal.glow}`,
          boxShadow: `0 0 14px ${pal.glow}`,
        }}
      />
      {/* Pulsing orb that grows then bursts */}
      <motion.div
        initial={{ opacity: 0, scale: 0.1 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.1, 0.7, 1.1, 2.2] }}
        transition={{ duration: 0.9, ease: 'easeIn', times: [0, 0.35, 0.7, 1] }}
        style={{
          ...base,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff 0%, ${pal.core} 40%, ${pal.glow} 70%, transparent 100%)`,
          filter: 'blur(1px)',
          boxShadow: `0 0 26px ${pal.core}, 0 0 46px ${pal.glow}`,
        }}
      />
      {/* Swirling arcane particles drawn inward toward the orb */}
      {PARTICLE_ANGLES.map((ang, i) => {
        const r = SWIRL_RADII[i];
        const sx = Math.cos(ang) * r;
        const sy = Math.sin(ang) * r;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: sx, y: sy, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], x: [sx, 0], y: [sy, 0], scale: [0.4, 1, 0.2] }}
            transition={{ duration: 0.75, ease: 'easeIn', delay: (i % 4) * 0.03 }}
            style={{
              ...base,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: pal.spark,
              boxShadow: `0 0 8px ${pal.core}`,
            }}
          />
        );
      })}
    </>
  );
}

// ── Projectile + impact effect ────────────────────────────────────────────────
function HitEffect({
  ox,
  oy,
  tx,
  ty,
  pal,
}: {
  ox: number;
  oy: number;
  tx: number;
  ty: number;
  pal: Palette;
}): JSX.Element {
  const dx = tx - ox;
  const dy = ty - oy;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const dist = Math.hypot(dx, dy);
  const travel = 0.35; // projectile duration
  const impactDelay = travel; // impact starts when bolt lands

  const centered = (x: number, y: number): React.CSSProperties => ({
    position: 'absolute',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    mixBlendMode: 'screen',
  });

  return (
    <>
      {/* Motion-blur tail/trail behind the bolt */}
      <motion.div
        initial={{ opacity: 0, x: ox, y: oy }}
        animate={{ opacity: [0, 0.8, 0.8, 0], x: [ox, tx], y: [oy, ty] }}
        transition={{ duration: travel, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: Math.min(dist, 70),
          height: 10,
          transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
          transformOrigin: 'center',
          borderRadius: 5,
          background: `linear-gradient(90deg, transparent 0%, ${pal.glow} 60%, ${pal.core} 100%)`,
          filter: 'blur(3px)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      {/* Glowing projectile orb */}
      <motion.div
        initial={{ opacity: 0, x: ox, y: oy, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1, 1], x: [ox, tx], y: [oy, ty], scale: [0.6, 1, 1, 1.2] }}
        transition={{ duration: travel, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 20,
          height: 20,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff 0%, ${pal.core} 45%, ${pal.glow} 80%, transparent 100%)`,
          boxShadow: `0 0 16px ${pal.core}, 0 0 30px ${pal.glow}`,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      {/* Impact: radial flash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0], scale: [0.2, 1.4, 1.8] }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: impactDelay }}
        style={{
          ...centered(tx, ty),
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff 0%, ${pal.core} 45%, transparent 75%)`,
          filter: 'blur(1px)',
          boxShadow: `0 0 30px ${pal.core}, 0 0 60px ${pal.glow}`,
        }}
      />
      {/* Impact: shockwave ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.1 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.1, 1.6, 2.4] }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: impactDelay }}
        style={{
          ...centered(tx, ty),
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: `3px solid ${pal.core}`,
          boxShadow: `0 0 18px ${pal.core}`,
        }}
      />
      {/* Impact: sparks flying outward */}
      {PARTICLE_ANGLES.map((ang, i) => {
        const reach = 40 + ((i * 17) % 30);
        const ex = Math.cos(ang) * reach;
        const ey = Math.sin(ang) * reach;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], x: [0, ex], y: [0, ey], scale: [0.5, 1, 0.2] }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: impactDelay + (i % 3) * 0.02 }}
            style={{
              ...centered(tx, ty),
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: pal.spark,
              boxShadow: `0 0 8px ${pal.core}`,
            }}
          />
        );
      })}
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function SpellFx(props: SpellFxProps): JSX.Element {
  const { trigger, kind, skill, originX, originY, targetX, targetY } = props;
  const pal = paletteFor(skill);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      <AnimatePresence>
        {trigger > 0 && (
          // keyed remount on every trigger change so repeated casts replay cleanly
          <motion.div
            key={trigger}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {kind === 'cast' ? (
              <CastEffect x={originX} y={originY} pal={pal} />
            ) : (
              <HitEffect ox={originX} oy={originY} tx={targetX} ty={targetY} pal={pal} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
