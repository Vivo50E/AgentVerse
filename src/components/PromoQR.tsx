// A small floating QR card (replaces the old Groklet guide). Scans to the
// public promo/landing page. Draggable, self-positioning top-right.
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

const PROMO_URL = 'https://vivo50e.github.io/AgentVerse/';

export function PromoQR({ style }: { style?: CSSProperties }) {
  const [dragging, setDragging] = useState(false);
  return (
    <motion.a
      href={PROMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      drag
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      whileHover={{ y: -2 }}
      style={{
        position: 'fixed',
        top: 120,
        right: 40,
        zIndex: 100,
        width: 150,
        textDecoration: 'none',
        cursor: dragging ? 'grabbing' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(32,25,64,0.92), rgba(15,11,34,0.92))',
          border: '2px solid #7c5cff',
          borderRadius: 14,
          padding: 12,
          boxShadow: '0 10px 35px rgba(124,92,255,0.4)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'ui-monospace, monospace',
          textAlign: 'center',
        }}
      >
        <div style={{ background: '#fff', borderRadius: 8, padding: 8 }}>
          <img
            src="/promo-qr.svg"
            alt="Scan for the AgentVerse promo page"
            width={110}
            height={110}
            style={{ display: 'block', width: '100%', height: 'auto', imageRendering: 'pixelated' }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#ffd166' }}>
          ⚔ AgentVerse
        </div>
        <div style={{ marginTop: 2, fontSize: 9.5, color: '#a79be0', lineHeight: 1.3 }}>
          Scan for the promo page →
        </div>
      </div>
    </motion.a>
  );
}
