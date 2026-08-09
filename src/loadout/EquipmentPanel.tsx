// Diablo-style equipment paperdoll with a proper game-UI look. Slots hold gear
// granting passive bonuses; the 3 skill sockets hold the agent's real tools.
// Reuses useLoadout (no store changes) so equipped skills still drive
// getEnabledTools() -> backend tools.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLoadout } from './store';
import { CATALOG } from './catalog';
import { HexRadar } from './HexRadar';
import { STAT_LABELS, STATS, type Stat, type EquipmentItem } from './types';
import { useCharacters } from '../battle/characters';
import { useProgression, xpToNext, combineStats, powerOf } from '../progression';

const RARITY: Record<string, string> = {
  common: '#9aa0b5',
  rare: '#4aa3ff',
  epic: '#b06bff',
  legendary: '#ffd166',
};

const GEAR_SLOTS: { key: string; label: string; cat: Stat; empty: string }[] = [
  { key: 'helm', label: 'Helm', cat: 'knowledge', empty: '🎓' },
  { key: 'armor', label: 'Armor', cat: 'autonomy', empty: '🧥' },
  { key: 'charm', label: 'Charm', cat: 'memory', empty: '🧿' },
  { key: 'amulet', label: 'Amulet', cat: 'reasoning', empty: '📿' },
  { key: 'ring', label: 'Ring', cat: 'planning', empty: '💍' },
];
const TOOL_SOCKETS = 3;

// A single game-style slot frame: beveled, corner ticks, rarity glow when filled.
function Slot({
  item, empty, label, onClick, live,
}: { item: EquipmentItem | null; empty: string; label: string; onClick: () => void; live?: boolean }) {
  const border = item ? RARITY[item.rarity] : '#5a4f92';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.96 }} onClick={onClick}
        title={item ? `${item.name} — ${item.desc}\n\nEffect: ${item.use}` : `Empty ${label}`}
        style={{
          width: 62, height: 62, cursor: 'pointer', position: 'relative',
          borderRadius: 9,
          border: `2px solid ${border}`,
          background: item
            ? `radial-gradient(circle at 50% 35%, ${border}33 0%, #14102a 75%)`
            : 'linear-gradient(160deg,#211b3e 0%,#100c22 100%)',
          boxShadow: item
            ? `0 0 14px ${border}88, inset 0 0 10px ${border}44`
            : 'inset 0 2px 8px rgba(0,0,0,0.7), inset 0 0 0 1px #2a2350',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }}>
        <span style={{ opacity: item ? 1 : 0.45, filter: item ? 'none' : 'grayscale(1)' }}>
          {item ? item.icon : empty}
        </span>
        {/* corner ticks */}
        {['0 0 auto auto', '0 auto auto 0', 'auto 0 0 auto', 'auto auto 0 0'].map((pos, i) => {
          const [t, r, b, l] = pos.split(' ');
          return <span key={i} style={{ position: 'absolute', top: t === 'auto' ? undefined : 4, right: r === 'auto' ? undefined : 4, bottom: b === 'auto' ? undefined : 4, left: l === 'auto' ? undefined : 4, width: 6, height: 6, borderTop: t === '0' ? `2px solid ${border}` : undefined, borderBottom: b === '0' ? `2px solid ${border}` : undefined, borderLeft: l === '0' ? `2px solid ${border}` : undefined, borderRight: r === '0' ? `2px solid ${border}` : undefined, opacity: 0.8 }} />;
        })}
        {live && item?.toolId && (
          <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 8, color: '#0a0', background: '#57d9a3', borderRadius: 4, padding: '0 3px', fontWeight: 700 }}>LIVE</span>
        )}
      </motion.div>
      <span style={{ fontSize: 10, color: item ? RARITY[item.rarity] : '#7a72a8', maxWidth: 74, textAlign: 'center', lineHeight: 1.1 }}>
        {item ? item.name : label}
      </span>
    </div>
  );
}

export function EquipmentPanel({ onClose }: { onClose?: () => void }) {
  const equipped = useLoadout((s) => s.equipped);
  const equip = useLoadout((s) => s.equip);
  const unequip = useLoadout((s) => s.unequip);
  const equipStats = useLoadout((s) => s.stats)();
  const growth = useProgression((s) => s.growth);
  const level = useProgression((s) => s.level);
  const xp = useProgression((s) => s.xp);
  // Active stats = equipment + learned growth; Power derives from these so
  // leveling visibly raises both the hexagon and the Power banner.
  const stats = combineStats(equipStats, growth);
  const power = powerOf(stats);
  const xpNext = xpToNext(level);
  const heroSprite = useCharacters((s) => s.hero);
  const [picking, setPicking] = useState<Stat | null>(null);

  const equippedIn = (cat: Stat) => CATALOG.find((i) => i.category === cat && equipped[i.id]) ?? null;
  const equippedTools = CATALOG.filter((i) => i.category === 'tools' && equipped[i.id]);

  function equipSingle(item: EquipmentItem) {
    const prev = equippedIn(item.category);
    if (prev && prev.id !== item.id) unequip(prev.id);
    equip(item.id);
    setPicking(null);
  }
  function equipTool(item: EquipmentItem) {
    if (equipped[item.id]) { unequip(item.id); return; }
    if (equippedTools.length >= TOOL_SOCKETS) return;
    equip(item.id);
    setPicking(null);
  }

  const panelFrame: React.CSSProperties = {
    width: 'min(960px, 96vw)', maxHeight: '94vh', overflowY: 'auto',
    background: 'linear-gradient(180deg,#221a44 0%,#100c24 60%)',
    border: '2px solid #6a5aa8', borderRadius: 16, padding: 0, color: '#e6e2ff',
    boxShadow: '0 24px 90px rgba(0,0,0,0.7), inset 0 0 0 1px #3a2f66',
  };
  const subPanel: React.CSSProperties = {
    background: 'linear-gradient(180deg,#1a1438 0%,#120e28 100%)',
    border: '1px solid #3a2f66', borderRadius: 12, padding: 16,
    boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5)',
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, letterSpacing: 1.5, color: '#a79be0', marginBottom: 10, textTransform: 'uppercase',
    borderBottom: '1px solid #2f2758', paddingBottom: 6,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, fontFamily: 'ui-monospace, monospace' }}>
      <motion.div initial={{ scale: 0.92, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} style={panelFrame}>
        {/* Title banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(180deg,#2e2456,#1c1640)', borderBottom: '2px solid #6a5aa8', borderRadius: '14px 14px 0 0' }}>
          <h2 style={{ margin: 0, letterSpacing: 2, fontSize: 20 }}>⚔ EQUIPMENT</h2>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {/* RPG level + XP-to-next progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 96 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: '#ffd166', fontWeight: 700, fontSize: 13, letterSpacing: 1, textShadow: '0 0 10px #ffd16688' }}>Lv {level}</span>
                <span style={{ color: '#a79be0', fontSize: 9 }}>{xp}/{xpNext}</span>
              </div>
              <div style={{ height: 5, background: '#241f3a', borderRadius: 3, overflow: 'hidden', border: '1px solid #3a2f66' }}>
                <motion.div animate={{ width: `${Math.min(100, (xp / xpNext) * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg,#ffd166,#ffb454)' }} />
              </div>
            </div>
            <span style={{ color: '#ffd166', fontWeight: 700, textShadow: '0 0 10px #ffd16688' }}>⚡ POWER {power}</span>
            {onClose && <button onClick={onClose} style={{ background: '#3a2f66', border: '1px solid #6a5aa8', color: '#e6e2ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: 18, flexWrap: 'wrap' }}>
          {/* ── Paperdoll ─────────────────────────────────────────── */}
          <div style={{ ...subPanel, flex: '1 1 420px' }}>
            <div style={sectionLabel}>Active Tools · real agent tools</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
              {Array.from({ length: TOOL_SOCKETS }).map((_, i) => {
                const item = equippedTools[i] ?? null;
                return <Slot key={i} item={item} empty="➕" label={`Tool ${i + 1}`} live
                  onClick={() => (item ? unequip(item.id) : setPicking('tools'))} />;
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[GEAR_SLOTS[0], GEAR_SLOTS[1], GEAR_SLOTS[2]].map((s) => (
                  <Slot key={s.key} item={equippedIn(s.cat)} empty={s.empty} label={s.label} onClick={() => setPicking(s.cat)} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 240, background: 'radial-gradient(ellipse at 50% 78%, #342b60 0%, transparent 68%)', borderRadius: 12, border: '1px solid #2f2758' }}>
                {heroSprite?.poses?.idle
                  ? <img src={heroSprite.poses.idle} alt="hero" style={{ height: '94%', imageRendering: 'pixelated', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.55))' }} />
                  : <span style={{ fontSize: 96 }}>🧙</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[GEAR_SLOTS[3], GEAR_SLOTS[4]].map((s) => (
                  <Slot key={s.key} item={equippedIn(s.cat)} empty={s.empty} label={s.label} onClick={() => setPicking(s.cat)} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Ability matrix ────────────────────────────────────── */}
          <div style={{ ...subPanel, flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ ...sectionLabel, width: '100%' }}>Ability Matrix</div>
            <div style={{ padding: '4px 0 8px', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <HexRadar stats={stats} size={210} />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {STATS.map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 78, color: '#9d97c9' }}>{STAT_LABELS[s]}</span>
                  <div style={{ flex: 1, height: 10, background: '#241f3a', borderRadius: 5, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${stats[s]}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg,#7c5cff,#57d9a3)' }} />
                  </div>
                  <span style={{ width: 52, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {stats[s]}
                    {growth[s] > 0 && <span style={{ color: '#57d9a3', fontWeight: 700 }}> (+{growth[s]})</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Item picker ───────────────────────────────────────── */}
        <AnimatePresence>
          {picking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPicking(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,12,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}
                style={{ width: 'min(540px, 92vw)', maxHeight: '72vh', overflowY: 'auto', ...panelFrame, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                  <b style={{ letterSpacing: 1 }}>{picking === 'tools' ? '🗡 SOCKET A TOOL' : `EQUIP ${STAT_LABELS[picking].toUpperCase()}`}</b>
                  <span style={{ color: '#8b84b8', cursor: 'pointer' }} onClick={() => setPicking(null)}>✕</span>
                </div>
                {CATALOG.filter((i) => i.category === picking).map((item) => {
                  const on = !!equipped[item.id];
                  return (
                    <motion.div key={item.id} whileHover={{ x: 3 }} onClick={() => (picking === 'tools' ? equipTool(item) : equipSingle(item))}
                      title={`Effect: ${item.use}`}
                      style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 11px', margin: '7px 0', borderRadius: 9, cursor: 'pointer', border: `1px solid ${on ? RARITY[item.rarity] : '#2f2758'}`, background: on ? `${RARITY[item.rarity]}1a` : '#181430', boxShadow: on ? `0 0 12px ${RARITY[item.rarity]}55` : 'none' }}>
                      <span style={{ fontSize: 26, width: 34, textAlign: 'center' }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: RARITY[item.rarity], fontWeight: 700, fontSize: 13 }}>
                          {item.name} <span style={{ fontSize: 9, opacity: 0.7 }}>· {item.rarity}</span>
                          {item.toolId && <span style={{ color: '#57d9a3', fontSize: 10 }}> ● {item.toolId}</span>}
                        </div>
                        <div style={{ color: '#8b84b8', fontSize: 11 }}>{item.desc}</div>
                        <div style={{ color: '#5eead4', fontSize: 10.5, marginTop: 2, fontStyle: 'italic' }}>
                          ⓘ {item.use}
                        </div>
                        <div style={{ color: '#b7adf0', fontSize: 11, marginTop: 3 }}>
                          {Object.entries(item.bonuses).map(([k, v]) => `+${v} ${STAT_LABELS[k as Stat]}`).join('   ')}
                        </div>
                      </div>
                      {on && <span style={{ color: '#57d9a3', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </motion.div>
                  );
                })}
                {picking === 'tools' && equippedTools.length >= TOOL_SOCKETS && (
                  <div style={{ color: '#ffb454', fontSize: 11, marginTop: 6 }}>All 3 tool sockets full — tap an equipped tool to remove it.</div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
