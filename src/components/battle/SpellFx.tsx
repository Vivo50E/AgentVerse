// SpellFx — combat VFX that MATCH the character's archetype (generated with the
// character at design time): steel slashes for a knight, arcane bolts for a mage,
// arrows for an archer, plus fire / lightning / nature. Fires a one-shot effect
// each time `trigger` changes. Self-contained, inline styles, absolutely
// positioned inside a relative/absolute parent.
import { AnimatePresence, motion } from 'framer-motion';
import type { SkillKind } from '../../battle/types';
import type { FxArchetype } from '../../battle/sprites';

export interface SpellFxProps {
  trigger: number; // change/increment this to fire an effect
  kind: 'cast' | 'hit'; // 'cast' = windup at origin; 'hit' = strike at target
  archetype?: FxArchetype; // decided at design time — drives the visual style
  skill?: SkillKind; // legacy tint fallback when no archetype is given
  originX: number;
  originY: number; // px inside the parent (attacker's hand/weapon)
  targetX: number;
  targetY: number; // px inside the parent (foe center)
}

// ── Palettes ─────────────────────────────────────────────────────────────────
interface Palette {
  core: string; // bright core
  glow: string; // outer glow / secondary
  spark: string; // particle color
}

const ARCHETYPE_PALETTE: Record<FxArchetype, Palette> = {
  arcane: { core: '#3ad6ff', glow: '#7c5cff', spark: '#cfe9ff' },
  slash: { core: '#ffffff', glow: '#c9d4e0', spark: '#ff6b81' },
  arrow: { core: '#ffe6a0', glow: '#b8895a', spark: '#fff2cf' },
  fire: { core: '#ffd166', glow: '#ff5a1f', spark: '#ffd8a0' },
  lightning: { core: '#ffffff', glow: '#4aa3ff', spark: '#cfe9ff' },
  nature: { core: '#b6ff8a', glow: '#3fae5a', spark: '#e6ffcf' },
  // New pre-set effects
  ice: { core: '#a5f2ff', glow: '#5eb8ff', spark: '#e0f8ff' },
  poison: { core: '#9fff6b', glow: '#4ade80', spark: '#d4ffbd' },
  explosion: { core: '#ff6b4d', glow: '#ffaa00', spark: '#ffe066' },
  holy: { core: '#fff7a3', glow: '#ffe066', spark: '#ffffd4' },
  shadow: { core: '#9c7cff', glow: '#5c4a9e', spark: '#d4c8ff' },
  beam: { core: '#7cfaff', glow: '#3ad6ff', spark: '#b0f8ff' },
};

// Legacy skill tint (used only when archetype is absent).
const SKILL_PALETTE: Record<SkillKind, Palette> = {
  intel_summon: { core: '#3ad6ff', glow: '#7c5cff', spark: '#cfe9ff' },
  forge: { core: '#ffd166', glow: '#ff9f43', spark: '#ffe6b0' },
  strike: { core: '#ff6b81', glow: '#ff3b5c', spark: '#ffc2cc' },
  focus: { core: '#9d97c9', glow: '#6f6aa8', spark: '#d8d5f0' },
};

type Family = 'melee' | 'orb' | 'thin' | 'jagged';
const ARCHETYPE_FAMILY: Record<FxArchetype, Family> = {
  arcane: 'orb',
  fire: 'orb',
  nature: 'orb',
  explosion: 'orb', // fiery blast uses orb family with more particles
  ice: 'orb',
  poison: 'orb',
  holy: 'orb',
  shadow: 'orb',
  beam: 'thin', // laser-like
  slash: 'melee',
  arrow: 'thin',
  lightning: 'jagged',
};

function resolve(archetype?: FxArchetype, skill?: SkillKind): { pal: Palette; family: Family } {
  if (archetype) return { pal: ARCHETYPE_PALETTE[archetype], family: ARCHETYPE_FAMILY[archetype] };
  if (skill) return { pal: SKILL_PALETTE[skill], family: 'orb' };
  return { pal: ARCHETYPE_PALETTE.arcane, family: 'orb' };
}

// Deterministic particle angles (no Math.random in render).
const PARTICLE_ANGLES: number[] = Array.from({ length: 12 }, (_, i) => {
  const base = (360 / 12) * i;
  const jitter = ((i * 47) % 23) - 11;
  return ((base + jitter) * Math.PI) / 180;
});
const SWIRL_RADII: number[] = PARTICLE_ANGLES.map((_, i) => 24 + ((i * 13) % 20));

const centered = (x: number, y: number): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  mixBlendMode: 'screen',
});

// ── Magic charge (cast) ──────────────────────────────────────────────────────
function ChargeCast({ x, y, pal }: { x: number; y: number; pal: Palette }): JSX.Element {
  const base = centered(x, y);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.6, 2.1] }}
        transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.5, 1] }}
        style={{ ...base, width: 90, height: 90, borderRadius: '50%', border: `2px solid ${pal.core}`, boxShadow: `0 0 18px ${pal.core}, inset 0 0 18px ${pal.glow}` }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.1, rotate: 0 }}
        animate={{ opacity: [0, 0.7, 0], scale: [0.1, 1.1, 1.5], rotate: 180 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{ ...base, width: 64, height: 64, borderRadius: '50%', border: `2px dashed ${pal.glow}`, boxShadow: `0 0 14px ${pal.glow}` }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.1 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.1, 0.7, 1.1, 2.2] }}
        transition={{ duration: 0.9, ease: 'easeIn', times: [0, 0.35, 0.7, 1] }}
        style={{ ...base, width: 40, height: 40, borderRadius: '50%', background: `radial-gradient(circle, #fff 0%, ${pal.core} 40%, ${pal.glow} 70%, transparent 100%)`, filter: 'blur(1px)', boxShadow: `0 0 26px ${pal.core}, 0 0 46px ${pal.glow}` }}
      />
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
            style={{ ...base, width: 6, height: 6, borderRadius: '50%', background: pal.spark, boxShadow: `0 0 8px ${pal.core}` }}
          />
        );
      })}
    </>
  );
}

// ── Melee windup (cast) — a quick weapon gleam, no arcane rune ───────────────
function MeleeCast({ x, y, pal }: { x: number; y: number; pal: Palette }): JSX.Element {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.9], rotate: [-30, 10, 20] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ ...centered(x, y), width: 46, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${pal.core})`, boxShadow: `0 0 12px ${pal.core}` }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0], scale: [0.2, 1.4, 0.6] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ ...centered(x, y), width: 16, height: 16, borderRadius: '50%', background: `radial-gradient(circle, #fff, ${pal.core} 60%, transparent)`, boxShadow: `0 0 14px ${pal.core}` }}
      />
    </>
  );
}

// ── Melee strike (hit) — crescent slash arcs + sparks at the target ──────────
function MeleeHit({ tx, ty, pal }: { tx: number; ty: number; pal: Palette }): JSX.Element {
  const arc = (rot: number, delay: number): JSX.Element => (
    <motion.div
      initial={{ opacity: 0, rotate: rot - 60, scale: 0.6 }}
      animate={{ opacity: [0, 1, 0], rotate: [rot - 60, rot + 40], scale: [0.6, 1.1, 1.2] }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      style={{
        ...centered(tx, ty),
        width: 96,
        height: 96,
        borderRadius: '50%',
        border: `4px solid ${pal.core}`,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        filter: `drop-shadow(0 0 8px ${pal.core})`,
      }}
    />
  );
  return (
    <>
      {arc(20, 0)}
      {arc(200, 0.08)}
      {/* impact flash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0], scale: [0.3, 1.3, 1.6] }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ ...centered(tx, ty), width: 54, height: 54, borderRadius: '50%', background: `radial-gradient(circle, #fff 0%, ${pal.core} 45%, transparent 75%)`, boxShadow: `0 0 24px ${pal.core}` }}
      />
      {PARTICLE_ANGLES.slice(0, 8).map((ang, i) => {
        const reach = 34 + ((i * 17) % 26);
        const ex = Math.cos(ang) * reach;
        const ey = Math.sin(ang) * reach;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], x: [0, ex], y: [0, ey], scale: [0.6, 1, 0.2] }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: (i % 3) * 0.02 }}
            style={{ ...centered(tx, ty), width: 5, height: 5, borderRadius: '50%', background: pal.spark, boxShadow: `0 0 6px ${pal.core}` }}
          />
        );
      })}
    </>
  );
}

// ── Projectile (hit) — orb bolt or thin arrow ────────────────────────────────
function BoltHit({
  ox, oy, tx, ty, pal, thin,
}: { ox: number; oy: number; tx: number; ty: number; pal: Palette; thin?: boolean }): JSX.Element {
  const dx = tx - ox;
  const dy = ty - oy;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const dist = Math.hypot(dx, dy);
  const travel = thin ? 0.24 : 0.35;
  const impactDelay = travel;
  const orb = thin ? 8 : 20;
  return (
    <>
      {/* trail */}
      <motion.div
        initial={{ opacity: 0, x: ox, y: oy }}
        animate={{ opacity: [0, 0.85, 0.85, 0], x: [ox, tx], y: [oy, ty] }}
        transition={{ duration: travel, ease: 'easeIn' }}
        style={{ position: 'absolute', left: 0, top: 0, width: Math.min(dist, thin ? 90 : 70), height: thin ? 4 : 10, transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`, transformOrigin: 'center', borderRadius: 5, background: `linear-gradient(90deg, transparent 0%, ${pal.glow} 60%, ${pal.core} 100%)`, filter: thin ? 'blur(1px)' : 'blur(3px)', pointerEvents: 'none', mixBlendMode: 'screen' }}
      />
      {/* projectile */}
      <motion.div
        initial={{ opacity: 0, x: ox, y: oy, scale: 0.6, rotate: angleDeg }}
        animate={{ opacity: [0, 1, 1, 1], x: [ox, tx], y: [oy, ty], scale: [0.6, 1, 1, 1.1] }}
        transition={{ duration: travel, ease: 'easeIn' }}
        style={{ position: 'absolute', left: 0, top: 0, width: thin ? orb * 3 : orb, height: orb, transform: 'translate(-50%, -50%)', borderRadius: thin ? 3 : '50%', background: `radial-gradient(circle, #fff 0%, ${pal.core} 45%, ${pal.glow} 80%, transparent 100%)`, boxShadow: `0 0 16px ${pal.core}, 0 0 30px ${pal.glow}`, pointerEvents: 'none', mixBlendMode: 'screen' }}
      />
      {/* impact flash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0], scale: [0.2, 1.4, 1.8] }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: impactDelay }}
        style={{ ...centered(tx, ty), width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle, #fff 0%, ${pal.core} 45%, transparent 75%)`, filter: 'blur(1px)', boxShadow: `0 0 30px ${pal.core}, 0 0 60px ${pal.glow}` }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.1 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.1, 1.6, 2.4] }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: impactDelay }}
        style={{ ...centered(tx, ty), width: 60, height: 60, borderRadius: '50%', border: `3px solid ${pal.core}`, boxShadow: `0 0 18px ${pal.core}` }}
      />
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
            style={{ ...centered(tx, ty), width: 6, height: 6, borderRadius: '50%', background: pal.spark, boxShadow: `0 0 8px ${pal.core}` }}
          />
        );
      })}
    </>
  );
}

// ── Lightning (hit) — jagged bolt via SVG polyline ───────────────────────────
function LightningHit({
  ox, oy, tx, ty, pal,
}: { ox: number; oy: number; tx: number; ty: number; pal: Palette }): JSX.Element {
  // Build a zigzag path from origin to target (deterministic offsets).
  const segs = 6;
  const dx = (tx - ox) / segs;
  const dy = (ty - oy) / segs;
  const pts: string[] = [];
  for (let i = 0; i <= segs; i++) {
    const off = i === 0 || i === segs ? 0 : ((i * 53) % 40) - 20;
    // perpendicular offset
    const len = Math.hypot(tx - ox, ty - oy) || 1;
    const px = -(ty - oy) / len;
    const py = (tx - ox) / len;
    pts.push(`${ox + dx * i + px * off},${oy + dy * i + py * off}`);
  }
  return (
    <>
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.4, times: [0, 0.1, 0.6, 1] }}
        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', mixBlendMode: 'screen' }}
      >
        <polyline points={pts.join(' ')} fill="none" stroke={pal.glow} strokeWidth={7} strokeLinecap="round" style={{ filter: `blur(3px) drop-shadow(0 0 6px ${pal.glow})` }} />
        <polyline points={pts.join(' ')} fill="none" stroke={pal.core} strokeWidth={2.5} strokeLinecap="round" />
      </motion.svg>
      {/* impact burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0], scale: [0.2, 1.5, 2] }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.12 }}
        style={{ ...centered(tx, ty), width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, #fff 0%, ${pal.core} 45%, transparent 75%)`, boxShadow: `0 0 30px ${pal.glow}` }}
      />
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function SpellFx(props: SpellFxProps): JSX.Element {
  const { trigger, kind, archetype, skill, originX, originY, targetX, targetY } = props;
  const { pal, family } = resolve(archetype, skill);

  const renderCast = () =>
    family === 'melee' ? (
      <MeleeCast x={originX} y={originY} pal={pal} />
    ) : (
      <ChargeCast x={originX} y={originY} pal={pal} />
    );

  const renderHit = () => {
    if (family === 'melee') return <MeleeHit tx={targetX} ty={targetY} pal={pal} />;
    if (family === 'jagged')
      return <LightningHit ox={originX} oy={originY} tx={targetX} ty={targetY} pal={pal} />;
    return (
      <BoltHit ox={originX} oy={originY} tx={targetX} ty={targetY} pal={pal} thin={family === 'thin'} />
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      <AnimatePresence>
        {trigger > 0 && (
          <motion.div
            key={trigger}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {kind === 'cast' ? renderCast() : renderHit()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
