// Hero Inventory — a full-screen modal roster of every hero the player has
// designed. Browse past heroes, re-equip one into the active battle, rename or
// delete them, or jump straight into designing a new one.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCharacters } from '../battle/characters';
import { useHeroRoster, type SavedHero } from './roster';

/* ---- palette (matches App.tsx aesthetic) ---- */
const BG = '#0d0b1a';
const PANEL = '#120f26';
const PANEL_HI = '#181430';
const BORDER = '#2a2450';
const ACCENT = '#7c5cff';
const GOOD = '#57d9a3';
const GOLD = '#ffd166';
const DANGER = '#ff6b81';
const TEXT = '#e6e2ff';
const MUTED = '#9d97c9';
const FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const btnBase: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 700,
  borderRadius: 10,
  padding: '10px 16px',
  border: 0,
  cursor: 'pointer',
  fontSize: 13,
};

const spriteImg: React.CSSProperties = {
  width: '100%',
  display: 'block',
  imageRendering: 'pixelated',
  aspectRatio: '4 / 1',
  objectFit: 'contain',
  background: '#1a1536',
  borderRadius: 8,
};

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

interface HeroInventoryProps {
  onClose?: () => void;
  onDesignNew?: () => void;
}

export function HeroInventory({ onClose, onDesignNew }: HeroInventoryProps) {
  const heroes = useHeroRoster((s) => s.heroes);
  const remove = useHeroRoster((s) => s.remove);
  const rename = useHeroRoster((s) => s.rename);

  const equip = (hero: SavedHero) => {
    useCharacters.getState().setHero(hero.sprites);
    onClose?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(6,4,16,0.78)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
        fontFamily: FONT,
        color: TEXT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 920,
          margin: '40px auto',
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 18,
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          padding: '28px 24px 36px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            🎒 HERO ROSTER
          </h1>
          <button
            onClick={onClose}
            style={{
              ...btnBase,
              background: 'none',
              border: `1px solid ${BORDER}`,
              color: MUTED,
              padding: '6px 12px',
              fontWeight: 500,
            }}
          >
            ✕ Close
          </button>
        </div>
        <p style={{ margin: '0 0 22px', color: MUTED, fontSize: 13 }}>
          {heroes.length > 0
            ? `${heroes.length} hero${heroes.length === 1 ? '' : 'es'} saved. Re-equip one into battle or forge another.`
            : 'Every hero you design is stored here.'}
        </p>

        {heroes.length === 0 ? (
          <EmptyState onDesignNew={onDesignNew} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            <AnimatePresence>
              {heroes.map((hero, i) => (
                <HeroCard
                  key={hero.id}
                  hero={hero}
                  index={i}
                  onEquip={() => equip(hero)}
                  onRemove={() => remove(hero.id)}
                  onRename={(name) => rename(hero.id, name)}
                />
              ))}
            </AnimatePresence>

            {/* Design New tile */}
            <motion.button
              layout
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={onDesignNew}
              style={{
                cursor: 'pointer',
                minHeight: 180,
                borderRadius: 14,
                background: PANEL,
                border: `2px dashed ${BORDER}`,
                color: ACCENT,
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 34 }}>＋</span>
              Design New
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ onDesignNew }: { onDesignNew?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 12 }}>🫥</div>
      <div style={{ color: TEXT, fontSize: 16, marginBottom: 8 }}>
        No heroes yet — design your first!
      </div>
      <p style={{ color: MUTED, fontSize: 13, margin: '0 0 20px' }}>
        Your designed heroes will be saved here so you can re-equip them anytime.
      </p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onDesignNew}
        style={{ ...btnBase, background: ACCENT, color: '#fff', padding: '12px 22px', fontSize: 14 }}
      >
        ✦ Design New Hero
      </motion.button>
    </motion.div>
  );
}

interface HeroCardProps {
  hero: SavedHero;
  index: number;
  onEquip: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
}

function HeroCard({ hero, index, onEquip, onRemove, onRename }: HeroCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hero.name);

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, y: -8 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ y: -4, boxShadow: `0 10px 28px rgba(124,92,255,0.25)` }}
      style={{
        padding: 10,
        borderRadius: 14,
        background: PANEL,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <img src={hero.sprites.poses.idle} alt={hero.name} style={spriteImg} />

      {/* Name + rename */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(hero.name);
                setEditing(false);
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '4px 8px',
              borderRadius: 8,
              border: `1px solid ${ACCENT}`,
              background: PANEL_HI,
              color: '#fff',
              fontFamily: FONT,
              fontSize: 13,
            }}
          />
        ) : (
          <>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                color: TEXT,
                fontSize: 14,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={hero.name}
            >
              {hero.name}
            </span>
            <button
              onClick={() => {
                setDraft(hero.name);
                setEditing(true);
              }}
              title="Rename"
              style={{
                background: 'none',
                border: 0,
                color: MUTED,
                cursor: 'pointer',
                fontSize: 13,
                padding: 2,
              }}
            >
              ✎
            </button>
          </>
        )}
      </div>

      <span style={{ color: MUTED, fontSize: 11 }}>{relativeDate(hero.createdAt)}</span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onEquip}
          style={{ ...btnBase, flex: 1, background: GOOD, color: '#062117' }}
        >
          ⚔ Equip
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          title="Delete"
          style={{
            ...btnBase,
            background: 'transparent',
            border: `1px solid ${DANGER}`,
            color: DANGER,
            padding: '10px 12px',
          }}
        >
          🗑
        </motion.button>
      </div>
    </motion.div>
  );
}
