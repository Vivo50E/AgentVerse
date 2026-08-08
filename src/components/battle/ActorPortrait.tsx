import { useEffect } from 'react';
import { motion, useAnimate } from 'framer-motion';

export interface ActorPortraitProps {
  /** Display name under the portrait. */
  name: string;
  /** Which side this actor is on — picks the emoji + frame accent. */
  side: 'hero' | 'boss';
  /** Flip true to trigger a red flash + shake. */
  hurt?: boolean;
  /** True while the actor is casting — adds a pulsing glow. */
  casting?: boolean;
}

const FACE: Record<ActorPortraitProps['side'], string> = {
  hero: '🧙',
  boss: '🐉',
};

const ACCENT: Record<ActorPortraitProps['side'], string> = {
  hero: '#57d9a3',
  boss: '#ff6b81',
};

/**
 * A framed emoji "sprite" portrait. Reacts to prop changes:
 *  - `hurt` flipping true → red flash + horizontal shake
 *  - `casting` true → pulsing accent glow
 * No external assets — emoji + CSS only.
 */
export function ActorPortrait({ name, side, hurt = false, casting = false }: ActorPortraitProps) {
  const [scope, animate] = useAnimate();
  const accent = ACCENT[side];

  // Red flash + shake whenever `hurt` becomes true.
  useEffect(() => {
    if (!hurt) return;
    animate(
      scope.current,
      { x: [0, -8, 8, -6, 6, 0], backgroundColor: ['#1a1533', '#4a1622', '#1a1533'] },
      { duration: 0.45, ease: 'easeInOut' },
    );
  }, [hurt, animate, scope]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <motion.div
        ref={scope}
        animate={
          casting
            ? { boxShadow: [`0 0 6px ${accent}55`, `0 0 26px ${accent}`, `0 0 6px ${accent}55`] }
            : { boxShadow: `0 0 6px ${accent}33` }
        }
        transition={
          casting
            ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        style={{
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 52,
          lineHeight: 1,
          backgroundColor: '#1a1533',
          border: `2px solid ${accent}`,
          borderRadius: 12,
          imageRendering: 'pixelated',
          transform: side === 'boss' ? 'scaleX(-1)' : undefined,
          userSelect: 'none',
        }}
      >
        {FACE[side]}
      </motion.div>
      <span style={{ color: '#cdc7e6', fontSize: 13, fontWeight: 700 }}>{name}</span>
    </div>
  );
}
