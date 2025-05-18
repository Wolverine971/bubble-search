
// src/components/search/SearchProgress.tsx
import React from 'react';

interface SearchProgressProps {
  isSearching: boolean;
  searchStage: string;
}

const SearchProgress: React.FC<SearchProgressProps> = ({ isSearching, searchStage }) => {
  if (!isSearching) return null;

  return (
    <div className="animate-item bg-blue-50 p-6 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <div className="flex-1">
          <p className="text-blue-700 font-medium">
            {searchStage === 'classifying' && 'Understanding your query...'}
            {searchStage === 'summarizing' && 'Processing your request...'}
            {searchStage === 'searching' && 'Finding the best results...'}
            {searchStage === 'complete' && 'Finalizing results...'}
            {searchStage === 'error' && 'Error processing search...'}
          </p>
          <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ 
                width: searchStage === 'classifying' ? '33%' : 
                      searchStage === 'summarizing' ? '66%' : 
                      searchStage === 'searching' ? '90%' : 
                      searchStage === 'complete' ? '100%' : '0%' 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchProgress;

