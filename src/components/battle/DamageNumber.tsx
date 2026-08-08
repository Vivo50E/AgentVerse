import { motion } from 'framer-motion';

export interface DamageNumberProps {
  /** Amount of damage to display. */
  value: number;
  /** Crit numbers are bigger and gold. */
  crit?: boolean;
  /** Absolute x position (px) within the overlay. */
  x?: number;
  /** Absolute y position (px) within the overlay. */
  y?: number;
}

/**
 * A single floating damage number: pops in, floats up ~40px, fades out.
 * Designed to live inside an <AnimatePresence> so the exit animation runs
 * when it unmounts.
 */
export function DamageNumber({ value, crit = false, x = 0, y = 0 }: DamageNumberProps) {
  const color = crit ? '#ffd166' : '#ff6b81';
  const fontSize = crit ? 34 : 22;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, x, y }}
      animate={{ opacity: 1, scale: 1, x, y: y - 40 }}
      exit={{ opacity: 0, scale: 0.8, y: y - 56 }}
      transition={{
        opacity: { duration: 0.35 },
        scale: { type: 'spring', stiffness: 500, damping: 18 },
        y: { duration: 0.9, ease: 'easeOut' },
      }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 800,
        fontSize,
        color,
        textShadow: crit
          ? '0 0 10px rgba(255,209,102,0.8), 0 2px 2px rgba(0,0,0,0.6)'
          : '0 2px 3px rgba(0,0,0,0.7)',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {crit ? `${value}!` : value}
    </motion.div>
  );
}
