import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBattle } from '../../battle/store';
import { DamageNumber } from './DamageNumber';

interface FloatingNumber {
  id: number;
  value: number;
  crit: boolean;
  x: number;
  y: number;
}

/** How long a number stays mounted before we drop it (ms). */
const LIFETIME = 1000;

let seq = 0;

/**
 * Full-bleed overlay that watches the battle store's `lastAction` and spawns
 * floating DamageNumbers: 'hit' actions land on the boss (right) side,
 * 'agent_hurt' actions land on the hero (left) side.
 */
export function DamageLayer() {
  const lastAction = useBattle((s) => s.lastAction);
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!lastAction) return;
    if (lastAction.type !== 'hit' && lastAction.type !== 'agent_hurt') return;

    const isHit = lastAction.type === 'hit';
    const crit = lastAction.type === 'hit' ? lastAction.crit : false;
    // Hero on the left third, boss on the right third; a little jitter each time.
    const baseX = isHit ? 74 : 26; // percent
    const x = baseX + (Math.random() * 12 - 6);
    const y = 30 + Math.random() * 20; // percent

    const id = ++seq;
    setNumbers((prev) => [
      ...prev,
      { id, value: lastAction.damage, crit, x, y },
    ]);

    const timer = window.setTimeout(() => {
      setNumbers((prev) => prev.filter((n) => n.id !== id));
    }, LIFETIME);
    timers.current.push(timer);
  }, [lastAction]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      <AnimatePresence>
        {numbers.map((n) => (
          <div
            key={n.id}
            style={{
              position: 'absolute',
              left: `${n.x}%`,
              top: `${n.y}%`,
            }}
          >
            <DamageNumber value={n.value} crit={n.crit} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
