// Diablo-style equipment paperdoll. Slots hold gear that grants passive bonuses;
// the 3 skill sockets hold the agent's real tools. Reuses useLoadout (no store
// changes), so equipped skills still drive getEnabledTools() -> backend tools.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLoadout } from './store';
import { CATALOG } from './catalog';
import { HexRadar } from './HexRadar';
import { STAT_LABELS, STATS, type Stat, type EquipmentItem } from './types';
import { useCharacters } from '../battle/characters';

const RARITY: Record<string, string> = {
  common: '#9aa0b5',
  rare: '#4aa3ff',
  epic: '#b06bff',
  legendary: '#ffd166',
};

// Passive gear slots — one item each, mapped to a capability axis.
const GEAR_SLOTS: { key: string; label: string; cat: Stat; empty: string }[] = [
  { key: 'helm', label: 'Helm', cat: 'knowledge', empty: '🎓' },
  { key: 'armor', label: 'Armor', cat: 'prompt', empty: '🧥' },
  { key: 'charm', label: 'Charm', cat: 'memory', empty: '🧿' },
  { key: 'amulet', label: 'Amulet', cat: 'reasoning', empty: '📿' },
  { key: 'ring', label: 'Ring', cat: 'mcp', empty: '💍' },
];
const SKILL_SOCKETS = 3;

export function EquipmentPanel({ onClose }: { onClose?: () => void }) {
  const equipped = useLoadout((s) => s.equipped);
  const equip = useLoadout((s) => s.equip);
  const unequip = useLoadout((s) => s.unequip);
  const stats = useLoadout((s) => s.stats)();
  const power = useLoadout((s) => s.powerLevel)();
  const heroSprite = useCharacters((s) => s.hero);

  // which slot's picker is open: a Stat category, or 'skills'
  const [picking, setPicking] = useState<Stat | null>(null);

  const equippedIn = (cat: Stat) => CATALOG.find((i) => i.category === cat && equipped[i.id]) ?? null;
  const equippedSkills = CATALOG.filter((i) => i.category === 'skills' && equipped[i.id]);

  // Equip into a SINGLE slot: swap out whatever shared that category first.
  function equipSingle(item: EquipmentItem) {
    const prev = equippedIn(item.category);
    if (prev && prev.id !== item.id) unequip(prev.id);
    equip(item.id);
    setPicking(null);
  }
  function equipSkill(item: EquipmentItem) {
    if (equipped[item.id]) { unequip(item.id); return; }
    if (equippedSkills.length >= SKILL_SOCKETS) return; // sockets full
    equip(item.id);
    setPicking(null);
  }

  const slotBox = (border: string, glow: boolean): React.CSSProperties => ({
    width: 66, height: 66, borderRadius: 10, border: `2px solid ${border}`,
    background: 'linear-gradient(180deg,#1a1533,#0e0b20)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 30, cursor: 'pointer', position: 'relative',
    boxShadow: glow ? `0 0 14px ${border}` : 'inset 0 0 14px rgba(0,0,0,0.6)',
  });

  const GearSlot = ({ s }: { s: (typeof GEAR_SLOTS)[number] }) => {
    const item = equippedIn(s.cat);
    const border = item ? RARITY[item.rarity] : '#3a3260';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <motion.div whileHover={{ scale: 1.06 }} onClick={() => setPicking(s.cat)}
          title={item ? `${item.name} — ${item.desc}` : `Empty ${s.label} (${STAT_LABELS[s.cat]})`}
          style={slotBox(border, !!item)}>
          <span style={{ opacity: item ? 1 : 0.3 }}>{item ? item.icon : s.empty}</span>
        </motion.div>
        <span style={{ fontSize: 10, color: '#8b84b8' }}>{s.label}</span>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, fontFamily: 'ui-monospace, monospace' }}>
      <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ width: 'min(880px, 94vw)', maxHeight: '92vh', overflowY: 'auto', background: 'radial-gradient(circle at 50% 0%, #241c44 0%, #120f26 70%)', border: '1px solid #4a3f7a', borderRadius: 16, padding: 22, color: '#e6e2ff', boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>⚔ Equipment</h2>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            <span style={{ color: '#ffd166', fontWeight: 700 }}>⚡ Power {power}</span>
            {onClose && <button onClick={onClose} style={{ background: 'none', border: '1px solid #4a3f7a', color: '#cdc7e6', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Close</button>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {/* ── Paperdoll ─────────────────────────────────────────── */}
          <div style={{ flex: '1 1 360px' }}>
            {/* Active skill sockets = real tools */}
            <div style={{ fontSize: 11, color: '#8b84b8', marginBottom: 6 }}>ACTIVE SKILLS · real agent tools</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {Array.from({ length: SKILL_SOCKETS }).map((_, i) => {
                const item = equippedSkills[i];
                const border = item ? RARITY[item.rarity] : '#3a3260';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <motion.div whileHover={{ scale: 1.06 }} onClick={() => (item ? unequip(item.id) : setPicking('skills'))}
                      title={item ? `${item.name}${item.toolId ? ` (${item.toolId})` : ''} — click to unsocket` : 'Empty skill socket'}
                      style={slotBox(border, !!item)}>
                      <span style={{ opacity: item ? 1 : 0.25 }}>{item ? item.icon : '➕'}</span>
                      {item?.toolId && <span style={{ position: 'absolute', bottom: 2, fontSize: 8, color: '#57d9a3' }}>● live</span>}
                    </motion.div>
                    <span style={{ fontSize: 10, color: '#8b84b8' }}>Skill {i + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Hero flanked by gear slots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <GearSlot s={GEAR_SLOTS[0]} />
                <GearSlot s={GEAR_SLOTS[1]} />
                <GearSlot s={GEAR_SLOTS[2]} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 220, background: 'radial-gradient(circle at 50% 70%, #2a2350 0%, transparent 70%)', borderRadius: 12 }}>
                {heroSprite?.poses?.idle ? (
                  <img src={heroSprite.poses.idle} alt="hero" style={{ height: '100%', imageRendering: 'pixelated', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' }} />
                ) : (
                  <span style={{ fontSize: 90 }}>🧙</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <GearSlot s={GEAR_SLOTS[3]} />
                <GearSlot s={GEAR_SLOTS[4]} />
              </div>
            </div>
          </div>

          {/* ── Radar + stats ─────────────────────────────────────── */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <HexRadar stats={stats} size={260} />
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {STATS.map((s) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, background: '#181430', padding: '4px 8px', borderRadius: 6 }}>
                  <span style={{ color: '#9d97c9' }}>{STAT_LABELS[s]}</span>
                  <span style={{ color: '#e6e2ff', fontWeight: 700 }}>{stats[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Item picker ───────────────────────────────────────── */}
        <AnimatePresence>
          {picking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPicking(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,12,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}
                style={{ width: 'min(520px, 92vw)', maxHeight: '70vh', overflowY: 'auto', background: '#151130', border: '1px solid #4a3f7a', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <b>{picking === 'skills' ? 'Socket a Skill' : `Equip ${STAT_LABELS[picking]}`}</b>
                  <span style={{ color: '#655e90', cursor: 'pointer' }} onClick={() => setPicking(null)}>✕</span>
                </div>
                {CATALOG.filter((i) => i.category === picking).map((item) => {
                  const on = !!equipped[item.id];
                  return (
                    <motion.div key={item.id} whileHover={{ x: 3 }}
                      onClick={() => (picking === 'skills' ? equipSkill(item) : equipSingle(item))}
                      style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', margin: '6px 0', borderRadius: 8, cursor: 'pointer', border: `1px solid ${on ? RARITY[item.rarity] : '#2a2450'}`, background: on ? 'rgba(124,92,255,0.12)' : '#181430' }}>
                      <span style={{ fontSize: 24 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: RARITY[item.rarity], fontWeight: 700, fontSize: 13 }}>
                          {item.name} {item.toolId && <span style={{ color: '#57d9a3', fontSize: 10 }}>● {item.toolId}</span>}
                        </div>
                        <div style={{ color: '#8b84b8', fontSize: 11 }}>{item.desc}</div>
                        <div style={{ color: '#9d97c9', fontSize: 11 }}>
                          {Object.entries(item.bonuses).map(([k, v]) => `+${v} ${STAT_LABELS[k as Stat]}`).join('  ')}
                        </div>
                      </div>
                      {on && <span style={{ color: '#57d9a3', fontSize: 12 }}>equipped</span>}
                    </motion.div>
                  );
                })}
                {picking === 'skills' && equippedSkills.length >= SKILL_SOCKETS && (
                  <div style={{ color: '#ffb454', fontSize: 11, marginTop: 6 }}>All 3 skill sockets full — unsocket one first.</div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
