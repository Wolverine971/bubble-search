import { animate } from 'animejs';
// src/components/search/IntentBubble.tsx
import React, { useEffect, useRef } from 'react';

interface IntentBubbleProps {
  intent: string;
  showBubble: boolean;
  searchStage: string;
}

const IntentBubble: React.FC<IntentBubbleProps> = ({ intent, showBubble, searchStage }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (intent && showBubble && bubbleRef.current) {
      // Create bubble animation
      animate(bubbleRef.current, {
        opacity: [0, 1],
        scale: [0.3, 1.2, 1],
        translateY: [-20, -60],
        duration: 1200,
        easing: 'easeOutElastic(1, .6)'
      });
    }
  }, [intent, showBubble, searchStage]);

  if (!showBubble || !intent) return null;

  return (
    <div 
      ref={bubbleRef}
      className="absolute z-10 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
      style={{ 
        top: '0', 
        left: '10%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}
    >
      {intent}
    </div>
  );
};

export default IntentBubble;