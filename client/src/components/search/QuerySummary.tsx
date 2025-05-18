// src/components/search/QuerySummary.tsx
import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';

interface QuerySummaryProps {
  querySummary: string;
}

const QuerySummary: React.FC<QuerySummaryProps> = ({ querySummary }) => {
  const querySummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (querySummary && querySummaryRef.current) {
      animate(querySummaryRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        easing: 'easeOutExpo',
        duration: 400
      });
    }
  }, [querySummary]);

  if (!querySummary) return null;

  return (
    <div ref={querySummaryRef} className="query-summary bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-xl font-medium text-gray-800">
        {querySummary}
      </h3>
    </div>
  );
};

export default QuerySummary;
