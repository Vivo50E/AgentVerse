import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattle } from '../../battle/store';
import { useCharacters } from '../../battle/characters';
import { poseForAction } from '../../battle/sprites';
import type { Actor, SkillKind } from '../../battle/types';
import { DamageLayer } from './DamageLayer';
import { SkillCast } from './SkillCast';
import { Sprite } from './Sprite';

/** Retro segmented HP bar that floats above a battler. */
function HpBar({ actor, color, align }: { actor: Actor; color: string; align: 'left' | 'right' }) {
  const pct = actor.maxHp > 0 ? Math.max(0, Math.min(100, (actor.hp / actor.maxHp) * 100)) : 0;
  const low = pct <= 25;
  const fill = low ? '#ff6b81' : color;
  return (
    <div
      style={{
        width: 172,
        fontFamily: 'ui-monospace, monospace',
        textAlign: align,
        textShadow: '0 2px 3px rgba(0,0,0,0.9)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          color: '#e6e2ff',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          marginBottom: 3,
          flexDirection: align === 'right' ? 'row-reverse' : 'row',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {actor.name}
        </span>
        <span style={{ color: low ? '#ff6b81' : '#cdc7e6' }}>
          {actor.hp}/{actor.maxHp}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 12,
          background: '#0d0b1a',
          border: '2px solid #2a2450',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{
            height: '100%',
            background: `linear-gradient(180deg, ${fill} 0%, ${fill}aa 100%)`,
            boxShadow: `0 0 8px ${fill}`,
          }}
        />
        {/* pixel segment grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 12px)',
          }}
        />
      </div>
    </div>
  );
}

interface CastFx {
  id: number;
  label: string;
  skill: SkillKind;
}

/**
 * Full side-view JRPG battle scene: hero on the left facing right, boss on the
 * right facing left, full-bleed pixel background. Reads sprites from the
 * useCharacters store and poses/HP/actions from the useBattle store.
 */
export function BattleStage() {
  const heroSprites = useCharacters((s) => s.hero);
  const bossSprites = useCharacters((s) => s.boss);
  const background = useCharacters((s) => s.background);

  const lastAction = useBattle((s) => s.lastAction);
  const heroActor = useBattle((s) => s.hero);
  const bossActor = useBattle((s) => s.boss);

  // Load the default sprite set once on mount.
  useEffect(() => {
    void useCharacters.getState().loadDefaults();
  }, []);

  // Measure the stage so sprites scale with the responsive container.
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageH, setStageH] = useState(0);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Brief skill-cast banner, re-triggered per cast (same pattern as App.tsx).
  const [cast, setCast] = useState<CastFx | null>(null);
  const castId = useRef(0);
  useEffect(() => {
    if (lastAction?.type !== 'cast') return;
    setCast({ id: ++castId.current, label: lastAction.label, skill: lastAction.skill });
    const t = window.setTimeout(() => setCast(null), 1100);
    return () => window.clearTimeout(t);
  }, [lastAction]);

  const spriteH = Math.round(stageH * 0.66);
  const heroPose = poseForAction(lastAction, 'hero');
  const bossPose = poseForAction(lastAction, 'boss');

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 760,
        aspectRatio: '16 / 9',
        margin: '0 auto',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #2a2450',
        background: '#0d0b1a',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Full-bleed pixel background */}
      {background && (
        <img
          src={background}
          alt="battle background"
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            imageRendering: 'pixelated',
            userSelect: 'none',
          }}
        />
      )}
      {/* Subtle vignette for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 40%, rgba(13,11,26,0) 40%, rgba(13,11,26,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Hero — bottom-left, facing right */}
      {heroSprites && stageH > 0 && (
        <>
          <div style={{ position: 'absolute', left: '4%', bottom: 0, zIndex: 5 }}>
            <Sprite sprites={heroSprites} pose={heroPose} height={spriteH} />
          </div>
          <div style={{ position: 'absolute', left: '3%', top: '6%', zIndex: 15 }}>
            <HpBar actor={heroActor} color="#57d9a3" align="left" />
          </div>
        </>
      )}

      {/* Boss — bottom-right, facing left (flipped) */}
      {bossSprites && stageH > 0 && (
        <>
          <div style={{ position: 'absolute', right: '4%', bottom: 0, zIndex: 5 }}>
            <Sprite sprites={bossSprites} pose={bossPose} flip height={spriteH} />
          </div>
          <div style={{ position: 'absolute', right: '3%', top: '6%', zIndex: 15 }}>
            <HpBar actor={bossActor} color="#ff6b81" align="right" />
          </div>
        </>
      )}

      {/* Skill-cast banner, center-top */}
      <AnimatePresence>
        {cast && (
          <motion.div
            key={cast.id}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '14%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 25,
              pointerEvents: 'none',
            }}
          >
            <SkillCast label={cast.label} skill={cast.skill} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating damage numbers overlay */}
      <DamageLayer />
    </div>
  );
}
