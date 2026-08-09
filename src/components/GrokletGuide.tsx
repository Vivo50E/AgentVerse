import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useBattle } from '../battle/store';

const GROKLET_IMAGES = {
  idle: '/demo/groklet-astronaut-main.jpg',
  talking: '/demo/groklet-astronaut-expressions.jpg',
  excited: '/demo/groklet-astronaut-expressions.jpg',
};

const TUTORIAL_MESSAGES = [
  "Hello! I'm Groklet, your guide in AgentVerse.",
  "When the agent uses search, I cast my signature skill: Intel Summon!",
  "Critical Hit! That means the agent made an excellent move.",
  "Victory! Check the battle report card and share it on X.",
];

export function GrokletGuide({ style }: { style?: CSSProperties }) {
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState(TUTORIAL_MESSAGES[0]);
  const [currentImage, setCurrentImage] = useState(GROKLET_IMAGES.idle);

  const phase = useBattle((s) => s.phase);
  const lastAction = useBattle((s) => s.lastAction);

  // Auto tutorial based on battle events (visual only — narration is handled by
  // the synth SFX module; this component no longer speaks).
  useEffect(() => {
    if (phase === 'victory') {
      setMessage(TUTORIAL_MESSAGES[3]);
      setCurrentImage(GROKLET_IMAGES.excited);
    } else if (lastAction?.type === 'cast') {
      setMessage(TUTORIAL_MESSAGES[1]);
      setCurrentImage(GROKLET_IMAGES.talking);
    } else if (lastAction?.type === 'hit') {
      setMessage(TUTORIAL_MESSAGES[2]);
      setCurrentImage(GROKLET_IMAGES.excited);
    }
  }, [phase, lastAction]);

  // Cycle a random tip on click (visual only).
  const cycleMessage = () => {
    const randomMsg = TUTORIAL_MESSAGES[Math.floor(Math.random() * TUTORIAL_MESSAGES.length)];
    setMessage(randomMsg);
    setCurrentImage(GROKLET_IMAGES.talking);
    setTimeout(() => setCurrentImage(GROKLET_IMAGES.idle), 2200);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      style={{
        position: 'fixed',
        top: 120,
        right: 40,
        zIndex: 100,
        width: '175px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    >
      <div style={{
        background: 'rgba(18, 15, 38, 0.95)',
        border: '3px solid #7c5cff',
        borderRadius: '16px',
        padding: '10px',
        boxShadow: '0 10px 35px rgba(124, 92, 255, 0.45)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #57d9a3',
          marginBottom: '10px',
        }}>
          <img 
            src={currentImage} 
            alt="Groklet" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{
          fontSize: '12.5px',
          lineHeight: '1.4',
          color: '#e0d4ff',
          textAlign: 'center',
          minHeight: '52px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {message}
        </div>

        <div
          onClick={cycleMessage}
          style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '10px',
            color: '#7c5cff',
            opacity: 0.9,
            cursor: 'pointer',
          }}
        >
          Click to hear Groklet →
        </div>
      </div>
    </motion.div>
  );
}
