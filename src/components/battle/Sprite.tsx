import { useEffect } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import type { CharacterSprites, Pose } from '../../battle/sprites';

export interface SpriteProps {
  /** The character's pose -> image src map + intrinsic dimensions. */
  sprites: CharacterSprites;
  /** Which pose to show; changing it (re)fires the matching motion. */
  pose: Pose;
  /** Flip horizontally so a right-facing PNG faces left (the boss). */
  flip?: boolean;
  /** Rendered height in px; width is derived from the sprite's aspect ratio. */
  height?: number;
}

/**
 * A single side-view battler. Swaps between pose PNGs (with a quick crossfade)
 * and plays a pronounced, clearly-visible action animation driven by `pose`:
 *   attack -> lunge toward the enemy and back
 *   hurt   -> shake + red flash
 *   cast   -> rise + purple glow pulse
 *   idle   -> gentle bob loop
 */
export function Sprite({ sprites, pose, flip = false, height = 260 }: SpriteProps) {
  const src = sprites.poses[pose];
  const dir = flip ? -1 : 1; // +1 lunges right (hero), -1 lunges left (boss)

  const move = useAnimationControls();
  const fx = useAnimationControls();

  // Body movement (translate) keyed on pose, always settling into the idle bob.
  useEffect(() => {
    let cancelled = false;
    const play = async () => {
      switch (pose) {
        case 'attack':
          await move.start({
            x: [0, dir * 52, dir * 14, 0],
            y: [0, -10, 2, 0],
            transition: { duration: 0.5, times: [0, 0.35, 0.6, 1], ease: 'easeOut' },
          });
          break;
        case 'hurt':
          await move.start({
            x: [0, -12, 12, -9, 9, -4, 0],
            y: 0,
            transition: { duration: 0.5, ease: 'easeInOut' },
          });
          break;
        case 'cast':
          await move.start({
            x: 0,
            y: [0, -16, -12, -14],
            transition: { duration: 0.55, ease: 'easeOut' },
          });
          break;
        default:
          break;
      }
      if (cancelled) return;
      // Return to a gentle idle bob loop.
      move.start({
        x: 0,
        y: [0, -6, 0],
        transition: { y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
      });
    };
    void play();
    return () => {
      cancelled = true;
    };
  }, [pose, dir, move]);

  // Filter FX (flash / glow) run in parallel with the movement.
  useEffect(() => {
    switch (pose) {
      case 'hurt':
        fx.start({
          filter: [
            'brightness(1) saturate(1)',
            'brightness(2.4) saturate(4) sepia(1) hue-rotate(-25deg)',
            'brightness(1) saturate(1)',
          ],
          transition: { duration: 0.5, ease: 'easeInOut' },
        });
        break;
      case 'cast':
        fx.start({
          filter: [
            'drop-shadow(0 0 0 rgba(124,92,255,0)) brightness(1)',
            'drop-shadow(0 0 18px rgba(124,92,255,0.95)) brightness(1.15)',
            'drop-shadow(0 0 10px rgba(124,92,255,0.6)) brightness(1.05)',
          ],
          transition: { duration: 0.65, ease: 'easeOut' },
        });
        break;
      case 'attack':
        fx.start({
          filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
          transition: { duration: 0.5, ease: 'easeOut' },
        });
        break;
      default:
        fx.start({ filter: 'brightness(1)', transition: { duration: 0.3 } });
        break;
    }
  }, [pose, fx]);

  if (!src) return null; // missing sprite -> render nothing

  const width = Math.round(height * (sprites.w / sprites.h));

  return (
    <motion.div
      animate={move}
      style={{
        position: 'relative',
        width,
        height,
        transformOrigin: 'bottom center',
        willChange: 'transform',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: flip ? 'scaleX(-1)' : 'none',
          transformOrigin: 'bottom center',
        }}
      >
        <motion.div animate={fx} style={{ position: 'absolute', inset: 0 }}>
          <AnimatePresence initial={false}>
            <motion.img
              key={src}
              src={src}
              alt={`${sprites.name} ${pose}`}
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom center',
                imageRendering: 'pixelated',
                userSelect: 'none',
              }}
            />
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
