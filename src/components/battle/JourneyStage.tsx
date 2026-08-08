import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useBattle } from '../../battle/store';
import { useCharacters } from '../../battle/characters';
import { poseForAction } from '../../battle/sprites';
import type { CharacterSprites } from '../../battle/sprites';
import type { SkillKind } from '../../battle/types';
import {
  WAYPOINTS,
  computeProgress,
  foeStatus,
  loadFoes,
  KIND_SCALE,
} from '../../battle/journey';
import type { FoeSprites } from '../../battle/journey';
import { Sprite } from './Sprite';
import { SkillCast } from './SkillCast';
import { SpellFx } from './SpellFx';

const WORLD = 2600;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** World x-position for a waypoint's foe (mirrors the hero path math). */
function foeWorldX(at: number): number {
  return 120 + at * (WORLD - 320);
}

interface CastFx {
  id: number;
  label: string;
  skill: SkillKind;
}

/** Compact floating HP bar used above battlers along the path. */
function MiniHpBar({
  pct,
  color,
  label,
}: {
  pct: number;
  color: string;
  label?: string;
}) {
  const p = clamp(pct, 0, 100);
  const low = p <= 25;
  const fill = low ? '#ff6b81' : color;
  return (
    <div style={{ width: 132, fontFamily: 'ui-monospace, monospace', textAlign: 'center' }}>
      {label && (
        <div
          style={{
            color: '#e6e2ff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
            marginBottom: 2,
            textShadow: '0 2px 3px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          height: 8,
          background: '#0d0b1a',
          border: '2px solid #2a2450',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        <motion.div
          animate={{ width: `${p}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{
            height: '100%',
            background: `linear-gradient(180deg, ${fill} 0%, ${fill}aa 100%)`,
            boxShadow: `0 0 8px ${fill}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 10px)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Side-scrolling "journey" battle stage: the hero travels left→right through a
 * scrolling scene, clearing a foe at each workflow waypoint and ending at the
 * big boss (the dragon). Camera follows the hero; the scene glides via springs.
 */
export function JourneyStage() {
  const heroSprites = useCharacters((s) => s.hero);
  const bossSprites = useCharacters((s) => s.boss);
  const background = useCharacters((s) => s.background);

  const phase = useBattle((s) => s.phase);
  const boss = useBattle((s) => s.boss);
  const heroActor = useBattle((s) => s.hero);
  const lastAction = useBattle((s) => s.lastAction);

  // Load default hero/boss sprites + the foe table once on mount.
  const [foes, setFoes] = useState<Record<string, FoeSprites>>({});
  useEffect(() => {
    void useCharacters.getState().loadDefaults();
    let alive = true;
    void loadFoes().then((table) => {
      if (alive) setFoes(table);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Measure the viewport so the camera + sprite sizes stay responsive.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 720, h: 405 });
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vw = size.w || 720;
  const vh = size.h || 405;

  // Journey progress drives everything: camera, hero position, foe status.
  const progress = computeProgress(phase, boss.hp, boss.maxHp);

  // The active foe = lowest-index waypoint not yet cleared (fall back to the
  // final boss once everything is cleared so the VFX still has a target).
  const activeIndex = WAYPOINTS.findIndex((_, i) => foeStatus(i, progress) !== 'cleared');
  const activeWp = WAYPOINTS[activeIndex >= 0 ? activeIndex : WAYPOINTS.length - 1];
  const heroPose = poseForAction(lastAction, 'hero');

  // ── Sizing (one shared ground baseline; consistent 320x720 framing) ────────
  // Every battler is bottom-aligned to `groundY`, so nobody floats or sinks.
  const groundY = Math.round(vh * 0.05);
  const heroH = Math.round(vh * 0.46);
  const NOMINAL_ASPECT = 320 / 720; // pipeline framing when dims not yet loaded
  const heroW = Math.round(heroH * (heroSprites ? heroSprites.w / heroSprites.h : NOMINAL_ASPECT));

  // Active-foe geometry — normal foe ≈ hero, miniboss bigger, boss much bigger.
  const activeIsBoss = activeWp.foeKey === 'boss';
  const activeFoeSprites = activeIsBoss ? bossSprites : foes[activeWp.foeKey];
  const activeFoeH = Math.round(vh * 0.5 * KIND_SCALE[activeWp.kind]);
  const activeFoeW = Math.round(
    activeFoeH * (activeFoeSprites ? activeFoeSprites.w / activeFoeSprites.h : NOMINAL_ASPECT),
  );

  // ── Engagement gap ─────────────────────────────────────────────────────────
  // Natural path position for the current progress…
  const heroPathX = 120 + progress * (WORLD - 320);
  // …then halt a visible gap to the LEFT of the active foe so the two face off
  // (hero faces right, foe faces left) instead of overlapping. Account for both
  // half-widths so even the huge boss leaves a clear ~ENGAGEMENT_GAP px gap.
  const ENGAGEMENT_GAP = 96;
  const engageOffset = ENGAGEMENT_GAP + heroW / 2 + activeFoeW / 2;
  const heroX = Math.max(60, heroPathX - engageOffset);

  // Camera follows the hero (~35% from the left) so both hero and the foe to
  // its right stay comfortably in frame.
  const maxCam = Math.max(0, WORLD - vw);
  const cameraX = clamp(heroX - vw * 0.35, 0, maxCam);
  const parallax = cameraX * 0.5;

  // ── VFX anchor points (world-layer px, y measured from the top like SpellFx) ─
  const activeFoeX = foeWorldX(activeWp.at);
  // Hero staff tip = top-right of the hero sprite.
  const staffX = heroX + heroW / 2;
  const staffY = vh - (groundY + heroH * 0.92);
  // Active foe center.
  const foeCenterX = activeFoeX;
  const foeCenterY = vh - (groundY + activeFoeH / 2);

  // Melee archetypes (e.g. a knight) have no projectile, so on a hit the hero
  // must DASH in to the foe, strike, and return — otherwise it looks like it's
  // swinging at empty air across the engagement gap. Ranged/magic stay put and
  // let their bolt/arrow cross the gap. Driven by the design-time fx archetype.
  const isMelee = heroSprites?.fx?.archetype === 'slash';
  const lungeRef = useRef(0);
  lungeRef.current = Math.max(0, foeCenterX - heroX - activeFoeW * 0.45 - heroW * 0.2);

  // Smooth, uniform glide for travel (hero + camera + parallax) so big and
  // small progress jumps both feel smooth rather than snapping/overshooting.
  const travel = { type: 'tween' as const, duration: 0.9, ease: 'easeInOut' as const };

  // "Walking" feel: procedural step-bob + forward lean while progress changes.
  const [walking, setWalking] = useState(false);
  const prevProgress = useRef(progress);
  useEffect(() => {
    if (Math.abs(progress - prevProgress.current) > 0.0004) {
      setWalking(true);
      const t = window.setTimeout(() => setWalking(false), 1000);
      prevProgress.current = progress;
      return () => window.clearTimeout(t);
    }
    prevProgress.current = progress;
    return undefined;
  }, [progress]);

  // Skill-cast banner (center-top) + cast VFX trigger, re-fired per cast.
  const [cast, setCast] = useState<CastFx | null>(null);
  const castId = useRef(0);
  const [castTrigger, setCastTrigger] = useState(0);
  const [lastSkill, setLastSkill] = useState<SkillKind>('intel_summon');
  useEffect(() => {
    if (lastAction?.type !== 'cast') return undefined;
    setCast({ id: ++castId.current, label: lastAction.label, skill: lastAction.skill });
    setLastSkill(lastAction.skill);
    setCastTrigger((n) => n + 1);
    const t = window.setTimeout(() => setCast(null), 1100);
    return () => window.clearTimeout(t);
  }, [lastAction]);

  // Hit-spark + projectile VFX near the active foe when the hero lands a blow.
  const [hit, setHit] = useState<number | null>(null);
  const hitId = useRef(0);
  const [hitTrigger, setHitTrigger] = useState(0);
  const dashControls = useAnimationControls(); // melee lunge (dash-in strike)
  useEffect(() => {
    if (lastAction?.type !== 'hit') return undefined;
    const id = ++hitId.current;
    setHit(id);
    setHitTrigger((n) => n + 1);
    if (isMelee) {
      // Dash to the foe, hold for the slash, then return.
      void dashControls.start({
        x: [0, lungeRef.current, lungeRef.current, 0],
        transition: { duration: 0.6, times: [0, 0.28, 0.5, 1], ease: 'easeOut' },
      });
    }
    const t = window.setTimeout(() => setHit((cur) => (cur === id ? null : cur)), 500);
    return () => window.clearTimeout(t);
    // isMelee/lungeRef are read live; only re-run when the action changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAction]);

  return (
    <div
      ref={viewportRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #2a2450',
        background: '#0d0b1a',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* The scrolling world — everything lives here; camera slides it left. */}
      <motion.div
        animate={{ x: -cameraX }}
        transition={travel}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: WORLD,
          height: '100%',
          willChange: 'transform',
        }}
      >
        {/* Parallax tiled background (slower than foreground for depth). */}
        {background && (
          <motion.div
            animate={{ x: parallax }}
            transition={travel}
            style={{
              position: 'absolute',
              top: 0,
              left: -120,
              width: WORLD + 240,
              height: '100%',
              backgroundImage: `url(${background})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
              imageRendering: 'pixelated',
              willChange: 'transform',
            }}
          />
        )}
        {/* Depth vignette. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 38%, rgba(13,11,26,0) 45%, rgba(13,11,26,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Soft grounding shadow along the bottom — no hard line, keeps the
            real dungeon floor from the background visible. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: WORLD,
            height: '22%',
            background:
              'linear-gradient(180deg, rgba(13,11,26,0) 0%, rgba(13,11,26,0.25) 55%, rgba(13,11,26,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Foes at each waypoint. */}
        {WAYPOINTS.map((wp, i) => {
          const isBoss = wp.foeKey === 'boss';
          const sprites: CharacterSprites | FoeSprites | null | undefined = isBoss
            ? bossSprites
            : foes[wp.foeKey];
          if (!sprites) return null; // still loading — render nothing for this foe

          const status = foeStatus(i, progress);
          const cleared = status === 'cleared';
          const isBig = wp.kind !== 'foe';
          // Normal foe ≈ hero height, miniboss bigger, boss much bigger.
          const foeH = Math.round(vh * 0.5 * KIND_SCALE[wp.kind]);
          const x = foeWorldX(wp.at);

          // HP feel: every foe (boss included) shows FULL HP until the hero is
          // close, then drains over a short "engagement zone" right before it
          // falls — so foes never pop in already half-dead.
          const showHp = i === activeIndex && !cleared;
          const prevAt = i === 0 ? 0 : WAYPOINTS[i - 1].at;
          const span = wp.at - prevAt;
          const engage = Math.min(span, 0.1);
          const startDrain = wp.at - engage;
          const frac = engage > 0 ? clamp((progress - startDrain) / engage, 0, 1) : 1;
          const hpPct = (1 - frac) * 100;

          const foeCharacter: CharacterSprites = {
            name: wp.label,
            poses: sprites.poses,
            w: sprites.w,
            h: sprites.h,
          };

          return (
            <div
              key={wp.foeKey + i}
              style={{
                position: 'absolute',
                left: x,
                bottom: groundY,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                zIndex: isBig ? 4 : 3,
                pointerEvents: 'none',
              }}
            >
              {(isBig || showHp) && (
                <div style={{ minHeight: 6 }}>
                  {isBig && !cleared && (
                    <div
                      style={{
                        color: '#ffd166',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: 1,
                        textAlign: 'center',
                        textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                        marginBottom: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {wp.label}
                    </div>
                  )}
                  {showHp && (
                    <MiniHpBar pct={hpPct} color={isBoss ? '#ff6b81' : '#ff9f43'} />
                  )}
                </div>
              )}

              <motion.div
                animate={{
                  opacity: cleared ? 0 : status === 'pending' ? 0.8 : 1,
                  y: cleared ? 24 : 0,
                  rotate: cleared ? (isBig ? -8 : 14) : 0,
                  scale: cleared ? 0.65 : 1,
                }}
                transition={{
                  duration: cleared ? (isBig ? 1.2 : 0.6) : 0.3,
                  ease: 'easeIn',
                }}
                style={{ willChange: 'transform, opacity' }}
              >
                <Sprite
                  sprites={foeCharacter}
                  pose={cleared ? 'hurt' : 'idle'}
                  flip
                  height={foeH}
                />
              </motion.div>
            </div>
          );
        })}

        {/* Hit spark near the active foe. */}
        <AnimatePresence>
          {hit !== null && activeIndex >= 0 && (
            <motion.div
              key={hit}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.4, 1.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: foeWorldX(WAYPOINTS[activeIndex].at),
                bottom: groundY + Math.round(vh * 0.18),
                transform: 'translate(-50%, 0)',
                width: 60,
                height: 60,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, #fff 0%, #ffd166 35%, rgba(255,107,129,0.6) 60%, rgba(255,107,129,0) 75%)',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                zIndex: 8,
              }}
            />
          )}
        </AnimatePresence>

        {/* Hero — glides between waypoints; camera keeps it in frame. */}
        {heroSprites && (
          <motion.div
            animate={{ x: heroX }}
            transition={travel}
            style={{
              position: 'absolute',
              left: 0,
              bottom: groundY,
              zIndex: 6,
              willChange: 'transform',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MiniHpBar pct={heroActor.maxHp > 0 ? (heroActor.hp / heroActor.maxHp) * 100 : 0} color="#57d9a3" label={heroActor.name} />
              {/* Melee lunge layer: dashes toward the foe on a hit (no-op for
                  ranged/magic heroes, whose projectiles cross the gap instead). */}
              <motion.div animate={dashControls} initial={{ x: 0 }} style={{ willChange: 'transform' }}>
                {/* Procedural walk cycle: step-bob + forward lean + squash while
                    travelling; settles to a still stance on arrival. Pivots at the
                    feet so the lean/squash read as a stride, not a spin. */}
                <motion.div
                  animate={
                    walking
                      ? { y: [0, -10, 0, -10, 0], rotate: [1, 4, 1, 4, 1], scaleY: [1, 0.96, 1, 0.96, 1] }
                      : { y: 0, rotate: 0, scaleY: 1 }
                  }
                  transition={
                    walking
                      ? { duration: 0.46, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.3, ease: 'easeOut' }
                  }
                  style={{ transformOrigin: 'bottom center', willChange: 'transform' }}
                >
                  <Sprite sprites={heroSprites} pose={heroPose} height={heroH} />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Magic VFX — live inside the scrolling world so they track the
            battlers. Cast = charge aura at the hero's staff; hit = bolt from the
            staff to the active foe's center + impact. Same world coordinate
            space as the sprites (px, y from the top of the world layer). */}
        <SpellFx
          trigger={castTrigger}
          kind="cast"
          archetype={heroSprites?.fx?.archetype}
          skill={lastSkill}
          originX={staffX}
          originY={staffY}
          targetX={foeCenterX}
          targetY={foeCenterY}
        />
        <SpellFx
          trigger={hitTrigger}
          kind="hit"
          archetype={heroSprites?.fx?.archetype}
          skill={lastSkill}
          originX={staffX}
          originY={staffY}
          targetX={foeCenterX}
          targetY={foeCenterY}
        />
      </motion.div>

      {/* Skill-cast banner — fixed to the viewport, center-top. */}
      <AnimatePresence>
        {cast && (
          <motion.div
            key={cast.id}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '12%',
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
    </div>
  );
}
