// A hexagonal ability radar (spider chart) for the six agent stats. The filled
// stat polygon animates whenever the equipped loadout changes.
import { motion } from 'framer-motion';
import type { Stat } from './types';
import { STATS, STAT_LABELS, STAT_DESCRIPTIONS } from './types';

const ACCENT = '#7c5cff';
const GRID = '#2a2450';
const GRID_SOFT = '#221d42';
const LABEL = '#9d97c9';
const VALUE = '#e6e2ff';

// Vertex i sits at angle -90° + i*60° (first axis points straight up).
function angleFor(i: number): number {
  return (-90 + i * 60) * (Math.PI / 180);
}

function pointAt(cx: number, cy: number, radius: number, i: number): [number, number] {
  const a = angleFor(i);
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}

function ringPath(cx: number, cy: number, radius: number): string {
  return (
    STATS.map((_, i) => {
      const [x, y] = pointAt(cx, cy, radius, i);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') + ' Z'
  );
}

function statPath(cx: number, cy: number, maxR: number, stats: Record<Stat, number>): string {
  return (
    STATS.map((s, i) => {
      const frac = Math.max(0, Math.min(100, stats[s])) / 100;
      const [x, y] = pointAt(cx, cy, maxR * frac, i);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') + ' Z'
  );
}

export function HexRadar({ stats, size = 320 }: { stats: Record<Stat, number>; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const labelR = maxR + size * 0.11;
  // Reserve margin so the diagonal axis labels ("Reasoning", "Knowledge") don't
  // clip against the SVG bounds. Rendered footprint grows by these paddings.
  const PAD = 64;
  const PADV = 14;

  const rings = [1, 0.66, 0.33];
  const shape = statPath(cx, cy, maxR, stats);

  return (
    <svg
      width={size + PAD * 2}
      height={size + PADV * 2}
      viewBox={`${-PAD} ${-PADV} ${size + PAD * 2} ${size + PADV * 2}`}
      style={{ display: 'block', overflow: 'visible', fontFamily: 'ui-monospace, monospace' }}
    >
      {/* concentric hexagon rings */}
      {rings.map((r, idx) => (
        <path
          key={`ring-${idx}`}
          d={ringPath(cx, cy, maxR * r)}
          fill="none"
          stroke={idx === 0 ? GRID : GRID_SOFT}
          strokeWidth={1}
        />
      ))}

      {/* axis spokes */}
      {STATS.map((s, i) => {
        const [x, y] = pointAt(cx, cy, maxR, i);
        return <line key={`spoke-${s}`} x1={cx} y1={cy} x2={x} y2={y} stroke={GRID_SOFT} strokeWidth={1} />;
      })}

      {/* filled stat polygon (animated) */}
      <motion.path
        initial={false}
        animate={{ d: shape }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        fill={ACCENT}
        fillOpacity={0.22}
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* vertex dots (animated) */}
      {STATS.map((s, i) => {
        const frac = Math.max(0, Math.min(100, stats[s])) / 100;
        const [x, y] = pointAt(cx, cy, maxR * frac, i);
        return (
          <motion.circle
            key={`dot-${s}`}
            initial={false}
            animate={{ cx: x, cy: y }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            r={3.5}
            fill={ACCENT}
            stroke="#0d0b1a"
            strokeWidth={1.5}
          />
        );
      })}

      {/* axis labels + values */}
      {STATS.map((s, i) => {
        const [lx, ly] = pointAt(cx, cy, labelR, i);
        const anchor = Math.abs(lx - cx) < 1 ? 'middle' : lx > cx ? 'start' : 'end';
        return (
          <g key={`label-${s}`} style={{ cursor: 'help' }}>
            <title>{`${STAT_LABELS[s]} — ${STAT_DESCRIPTIONS[s]}`}</title>
            <text
              x={lx}
              y={ly - 4}
              textAnchor={anchor}
              fill={LABEL}
              fontSize={11}
              fontWeight={700}
              dominantBaseline="middle"
            >
              {STAT_LABELS[s]}
            </text>
            <text
              x={lx}
              y={ly + 9}
              textAnchor={anchor}
              fill={VALUE}
              fontSize={11}
              dominantBaseline="middle"
            >
              {Math.round(stats[s])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
