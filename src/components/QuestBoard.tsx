// Quest Board (plan.md §7g) — a corkboard of launchable quest prompts.
// Clicking a card FILLS the quest console (doesn't run it) so the player can
// review/edit before hitting Start Quest themselves. Built-in "Pinned" quests
// are read-only; "Your Quests" are user-added and persisted, deletable.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DemoQuest } from '../quests/demoQuests';

const PIXEL = "'Press Start 2P', ui-monospace, monospace";
const EMOJI_CHOICES = ['⚔️', '🔧', '📈', '🎨', '⚡', '📜', '🧪', '🌐', '🧩', '👾', '🗺️', '🔍'];

function QuestCard({
  quest, done, active, selected, disabled, deletable, onPick, onDelete,
}: {
  quest: DemoQuest;
  done: boolean;
  active: boolean;
  selected: boolean;
  disabled: boolean;
  deletable: boolean;
  onPick: () => void;
  onDelete?: () => void;
}) {
  const borderColor = active ? '#ffd166' : selected ? '#7c5cff' : done ? '#57d9a3' : '#3a2f66';
  const statusLabel = active ? '⚔ FIGHTING…' : selected ? '✎ IN QUEST BOX' : done ? '✓ COMPLETED · REUSE' : '✎ FILL QUEST';
  const statusColor = active ? '#ffd166' : selected ? '#7c5cff' : done ? '#57d9a3' : '#8b84b8';
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={() => !disabled && onPick()}
      disabled={disabled}
      style={{
        position: 'relative', textAlign: 'left', padding: '14px 16px', borderRadius: 10,
        border: `2px solid ${borderColor}`,
        background: active
          ? 'linear-gradient(145deg, rgba(255,209,102,0.15), rgba(26,22,48,0.8))'
          : selected
            ? 'linear-gradient(145deg, rgba(124,92,255,0.15), rgba(26,22,48,0.8))'
            : done
              ? 'linear-gradient(145deg, rgba(87,217,163,0.12), rgba(26,22,48,0.8))'
              : 'rgba(26,22,48,0.7)',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled && !active ? 0.5 : 1,
        fontFamily: 'inherit',
        boxShadow: active ? '0 0 16px rgba(255,209,102,0.4)' : selected ? '0 0 14px rgba(124,92,255,0.35)' : 'none',
      }}
    >
      {done && !active && (
        <span style={{ position: 'absolute', top: 8, right: deletable ? 32 : 10, fontSize: 13, color: '#57d9a3' }}>✓</span>
      )}
      {deletable && onDelete && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Remove this quest"
          style={{ position: 'absolute', top: 6, right: 8, fontSize: 12, color: '#8b84b8', padding: 4, cursor: 'pointer', lineHeight: 1 }}
        >
          🗑
        </span>
      )}
      <div style={{ fontSize: 24, marginBottom: 6, lineHeight: 1 }}>{quest.emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: active ? '#ffd166' : selected ? '#c3b0ff' : '#e6e2ff' }}>
        {quest.title}
      </div>
      <div style={{ fontSize: 11, color: '#a79be0', lineHeight: 1.4, minHeight: '2.6em' }}>
        {quest.desc}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, fontFamily: PIXEL, letterSpacing: 0.5, color: statusColor }}>
        {statusLabel}
      </div>
    </motion.button>
  );
}

function AddQuestForm({ onAdd, onCancel }: { onAdd: (q: Omit<DemoQuest, 'id'>) => void; onCancel: () => void }) {
  const [emoji, setEmoji] = useState('⚔️');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [prompt, setPrompt] = useState('');

  const canSubmit = title.trim().length > 0 && prompt.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onAdd({ emoji, title: title.trim(), desc: desc.trim() || 'Custom quest', prompt: prompt.trim() });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #3a2f66',
    background: '#181430', color: '#fff', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box',
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden', marginBottom: 14 }}
    >
      <div style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid #4a3f7a', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                fontSize: 18, width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                background: emoji === e ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${emoji === e ? '#7c5cff' : '#3a2f66'}`,
              }}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest title (e.g. Bug Bounty Hunter)"
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description (optional)"
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="The actual quest prompt sent to the agent…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 10, fontFamily: 'ui-monospace, monospace' }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: '1px solid #3a2f66', color: '#a79be0', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? '#7c5cff' : '#3a2f66', border: 0, color: '#fff', borderRadius: 8,
              padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default',
              opacity: canSubmit ? 1 : 0.6, fontFamily: 'inherit',
            }}
          >
            ＋ Add Quest
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function QuestBoard({
  quests, customQuests, completed, activeId, selectedId, disabled, onPick, onAdd, onRemove, onClose,
}: {
  quests: DemoQuest[];
  customQuests: DemoQuest[];
  completed: Set<number>;
  activeId: number | null;
  selectedId: number | null;
  disabled: boolean;
  onPick: (quest: DemoQuest) => void;
  onAdd: (q: Omit<DemoQuest, 'id'>) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(6,4,16,0.82)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 120, fontFamily: 'ui-monospace, monospace', padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 94vw)', maxHeight: '86vh', overflowY: 'auto',
          background: 'linear-gradient(180deg,#221a44,#100c24 70%)', border: '2px solid #6a5aa8',
          borderRadius: 16, color: '#e6e2ff', boxShadow: '0 24px 90px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          background: 'linear-gradient(180deg,#2e2456,#1c1640)', borderBottom: '2px solid #6a5aa8',
          borderRadius: '14px 14px 0 0', position: 'sticky', top: 0,
        }}>
          <h2 style={{ margin: 0, letterSpacing: 1, fontSize: 15 }}>📌 QUEST BOARD</h2>
          <button onClick={onClose} style={{ background: '#3a2f66', border: '1px solid #6a5aa8', color: '#e6e2ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          <div style={{ color: '#a79be0', fontSize: 12, marginBottom: 14 }}>
            Click a card to load its prompt into the quest console — review or edit it, then hit Start Quest yourself.
          </div>

          <div style={{ fontSize: 11, fontFamily: PIXEL, letterSpacing: 1, color: '#8b84b8', marginBottom: 10 }}>PINNED</div>
          <div style={{ ...grid, marginBottom: 22 }}>
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                done={completed.has(quest.id)}
                active={activeId === quest.id}
                selected={selectedId === quest.id}
                disabled={disabled}
                deletable={false}
                onPick={() => onPick(quest)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontFamily: PIXEL, letterSpacing: 1, color: '#8b84b8' }}>YOUR QUESTS</div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{ background: 'rgba(124,92,255,0.15)', border: '1px solid #7c5cff', color: '#c3b0ff', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ＋ Add Quest
              </button>
            )}
          </div>

          <AnimatePresence>
            {showAddForm && (
              <AddQuestForm
                onAdd={(q) => { onAdd(q); setShowAddForm(false); }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </AnimatePresence>

          {customQuests.length === 0 && !showAddForm ? (
            <div style={{ color: '#655e90', fontSize: 12, padding: '10px 2px' }}>
              No quests yet — add your own to pin it here.
            </div>
          ) : (
            <div style={grid}>
              <AnimatePresence>
                {customQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    done={completed.has(quest.id)}
                    active={activeId === quest.id}
                    selected={selectedId === quest.id}
                    disabled={disabled}
                    deletable
                    onPick={() => onPick(quest)}
                    onDelete={() => onRemove(quest.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
