// Generic placeholder modal for not-yet-built features (Friends, Leaderboard,
// Quest Board, ...). Just says "coming soon" — swap for the real feature panel
// once it's built, no need to touch the buttons that open it.
import { motion } from 'framer-motion';

export function ComingSoon({ title, desc, onClose }: { title: string; desc?: string; onClose: () => void }) {
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
          width: 'min(380px, 94vw)', background: 'linear-gradient(180deg,#221a44,#100c24 70%)',
          border: '2px solid #6a5aa8', borderRadius: 16, color: '#e6e2ff', boxShadow: '0 24px 90px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          background: 'linear-gradient(180deg,#2e2456,#1c1640)', borderBottom: '2px solid #6a5aa8', borderRadius: '14px 14px 0 0',
        }}>
          <h2 style={{ margin: 0, letterSpacing: 1, fontSize: 15 }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#3a2f66', border: '1px solid #6a5aa8', color: '#e6e2ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ padding: '28px 20px 26px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🚧</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Coming soon</div>
          <div style={{ color: '#a79be0', fontSize: 12 }}>{desc ?? 'This feature is still being forged. Check back soon!'}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
