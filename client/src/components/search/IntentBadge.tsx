// src/components/search/IntentBadge.tsx
import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';

interface IntentBadgeProps {
  intent: string;
  showIntentBadge: boolean;
}

const IntentBadge: React.FC<IntentBadgeProps> = ({ intent, showIntentBadge }) => {
  const intentBadgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showIntentBadge && intentBadgeRef.current) {
      animate(intentBadgeRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        scale: [0.8, 1],
        easing: 'easeOutExpo',
        duration: 400
      });
    }
  }, [showIntentBadge]);

  if (!showIntentBadge || !intent) return null;

  return (
    <div 
      ref={intentBadgeRef}
      className="absolute z-10 top-[-12px] right-3"
    >
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full shadow-sm">
        {intent}
      </span>
    </div>
  );
};

export default IntentBadge;