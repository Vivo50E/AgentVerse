// The RPG inventory / loadout screen. Left: the hex ability radar + power level.
// Right: the gear catalog grouped by category; click a chip to equip/unequip.
import { AnimatePresence, motion } from 'framer-motion';
import { CATALOG } from './catalog';
import { HexRadar } from './HexRadar';
import { useLoadout } from './store';
import type { EquipmentItem, Rarity, Stat } from './types';
import { STATS, STAT_LABELS } from './types';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9d97c9',
  rare: '#4aa8ff',
  epic: '#b06cff',
  legendary: '#ffd166',
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

function bonusText(item: EquipmentItem): string {
  return STATS.filter((s) => item.bonuses[s])
    .map((s) => `+${item.bonuses[s]} ${STAT_LABELS[s]}`)
    .join('  ');
}

function ItemChip({
  item,
  equipped,
  onToggle,
}: {
  item: EquipmentItem;
  equipped: boolean;
  onToggle: () => void;
}) {
  const color = RARITY_COLOR[item.rarity];
  return (
    <motion.button
      layout
      onClick={onToggle}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      animate={{
        borderColor: equipped ? color : '#2a2450',
        backgroundColor: equipped ? 'rgba(124,92,255,0.14)' : '#151130',
      }}
      title={item.desc}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 8,
        border: '1px solid #2a2450',
        color: '#e6e2ff',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</span>
          <span style={{ fontSize: 10, color, fontWeight: 700 }}>{RARITY_LABEL[item.rarity]}</span>
          {item.toolId && (
            <span style={{ fontSize: 10, color: '#57d9a3' }}>· {item.toolId}</span>
          )}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: '#9d97c9', marginTop: 2 }}>
          {bonusText(item)}
        </span>
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: equipped ? '#57d9a3' : '#655e90',
          whiteSpace: 'nowrap',
        }}
      >
        {equipped ? '✓ Equipped' : 'Equip'}
      </span>
    </motion.button>
  );
}

export function CharacterSheet({ onClose }: { onClose?: () => void }) {
  // Subscribe to `equipped` (stable ref; changes only on toggle), then derive.
  const equipped = useLoadout((s) => s.equipped);
  const toggle = useLoadout((s) => s.toggle);
  const stats = useLoadout.getState().stats();
  const power = useLoadout.getState().powerLevel();

  const grouped: Record<Stat, EquipmentItem[]> = {} as Record<Stat, EquipmentItem[]>;
  for (const s of STATS) grouped[s] = [];
  for (const item of CATALOG) grouped[item.category].push(item);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,4,16,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 20,
          width: '100%',
          maxWidth: 860,
          maxHeight: '88vh',
          background: '#120f26',
          border: '1px solid #2a2450',
          borderRadius: 14,
          padding: 20,
          color: '#e6e2ff',
          fontFamily: 'ui-monospace, monospace',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: radar + power */}
        <div
          style={{
            flex: '1 1 300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'stretch' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Equipment ⚙️</h2>
          </div>
          <HexRadar stats={stats} size={320} />
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 12, color: '#9d97c9', letterSpacing: 1 }}>POWER LEVEL</div>
            <motion.div
              key={power}
              initial={{ scale: 0.8, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              style={{ fontSize: 42, fontWeight: 800, color: '#ffd166', lineHeight: 1 }}
            >
              {power}
            </motion.div>
          </div>
        </div>

        {/* Right: catalog */}
        <div style={{ flex: '1 1 340px', overflowY: 'auto', maxHeight: '80vh', paddingRight: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid #3a3260',
                  color: '#9d97c9',
                  borderRadius: 8,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                }}
              >
                ✕ Close
              </button>
            )}
          </div>

          {STATS.map((s) => (
            <div key={s} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: '#7c5cff',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                {STAT_LABELS[s]}
              </div>
              <AnimatePresence initial={false}>
                {grouped[s].map((item) => (
                  <ItemChip
                    key={item.id}
                    item={item}
                    equipped={!!equipped[item.id]}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
