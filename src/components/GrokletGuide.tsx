import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../battle/store';

const GROKLET_IMAGES = {
  main: '/demo/groklet-astronaut-main.jpg',
  excited: '/demo/groklet-astronaut-expressions.jpg',
  thinking: '/demo/groklet-astronaut-main.jpg',
  victory: '/demo/groklet-astronaut-expressions.jpg',
};

const NARRATION_LINES: Record<string, string> = {
  welcome: "Hello! I'm Groklet, your guide in AgentVerse.",
  intel: "Intel Summon activated! Pulling live data from X...",
  cast: "Skill cast detected! The agent is taking action.",
  crit: "Critical Hit! Excellent reasoning step.",
  victory: "Victory! The agent has successfully completed the quest.",
  default: "Observing the battle... Every agent deserves an epic fight.",
};

export function GrokletGuide({ style }: { style?: React.CSSProperties }) {
  const [currentImage, setCurrentImage] = useState(GROKLET_IMAGES.main);
  const [message, setMessage] = useState(NARRATION_LINES.welcome);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const phase = useBattle((s) => s.phase);
  const lastAction = useBattle((s) => s.lastAction);

  // React to battle events
  useEffect(() => {
    if (phase === 'victory') {
      setCurrentImage(GROKLET_IMAGES.victory);
      setMessage(NARRATION_LINES.victory);
    }
    else if (lastAction?.type === 'cast') {
      setCurrentImage(GROKLET_IMAGES.excited);
      setMessage(NARRATION_LINES.cast);
    }
    else if (lastAction?.type === 'hit' && Math.random() > 0.6) {
      setCurrentImage(GROKLET_IMAGES.excited);
      setMessage(NARRATION_LINES.crit);
    }
  }, [phase, lastAction]);

  const handleClick = () => {
    setIsSpeaking(true);

    const messages = Object.values(NARRATION_LINES);
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    setMessage(randomMsg);

    // Visual feedback
    setCurrentImage(GROKLET_IMAGES.excited);

    setTimeout(() => {
      setIsSpeaking(false);
      setCurrentImage(GROKLET_IMAGES.main);
    }, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
      style={{
        width: '180px',
        cursor: 'pointer',
        ...style,
      }}
      onClick={handleClick}
    >
      <motion.div
        animate={isSpeaking ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.6 }}
        style={{
          border: '4px solid #7c5cff',
          borderRadius: '16px',
          background: '#120f26',
          padding: '12px',
          boxShadow: '0 0 30px rgba(124, 92, 255, 0.5)',
        }}
      >
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
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#a0ffcc',
          textAlign: 'center',
          lineHeight: 1.4,
          minHeight: '42px',
        }}>
          {message}
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          fontSize: '10px',
          color: '#7c5cff',
          opacity: 0.7,
        }}>
          Click to ask Groklet →
        </div>
      </motion.div>
    </motion.div>
  );
}
