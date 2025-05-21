// src/components/search/SearchProgress.tsx
import React from 'react';

interface SearchProgressProps {
  isSearching: boolean;
  searchStage: string;
}

const SearchProgress: React.FC<SearchProgressProps> = ({ isSearching, searchStage }) => {
  if (!isSearching) return null;

  // Calculate progress percentage based on search stage
  const getProgressPercentage = () => {
    switch (searchStage) {
      case 'classifying':
        return 20;
      case 'summarizing':
        return 40;
      case 'analyzing_website':
        return 60;
      case 'searching':
      case 'executing_plan_step':
      case 'step_query_generated':
      case 'step_completed':
        return 80;
      case 'complete':
      case 'analysis_complete':
        return 100;
      default:
        return 10;
    }
  };

  // Get appropriate message based on search stage
  const getMessage = () => {
    switch (searchStage) {
      case 'classifying':
        return 'Understanding your query...';
      case 'summarizing':
        return 'Processing your request...';
      case 'searching':
        return 'Finding the best results...';
      case 'analyzing_website':
        return 'Analyzing relevant websites...';
      case 'executing_plan_step':
        return 'Executing search plan...';
      case 'step_query_generated':
        return 'Generating search queries...';
      case 'step_completed':
        return 'Completing search step...';
      case 'complete':
      case 'analysis_complete':
        return 'Finalizing results...';
      case 'error':
        return 'Error processing search...';
      default:
        return 'Searching...';
    }
  };

  return (
    <div className="animate-fade-in mb-6 bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <div className="flex-1">
          <p className="text-blue-700 font-medium">{getMessage()}</p>
          <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchProgress;