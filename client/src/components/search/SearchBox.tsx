import { Input } from '@rewind-ui/core';
// src/components/search/SearchBox.tsx
import React, { useRef } from 'react';

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  handleSearch: (e: React.FormEvent) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  isSearching, 
  handleSearch 
}) => {
  const searchBoxRef = useRef<HTMLDivElement>(null);

  return (
    <form onSubmit={handleSearch} className="flex flex-col space-y-4">
      <div 
        ref={searchBoxRef} 
        className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
          isSearching ? 'search-box-stone' : ''
        }`}
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Input
          name="search"
          placeholder="What would you like to search for?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pr-10 text-lg transition-all duration-300 ${
            isSearching ? 'bg-gray-100 text-gray-700' : 'bg-white'
          }`}
          size="lg"
          disabled={isSearching}
        />
        <button 
          type="submit" 
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          disabled={isSearching}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-6 w-6 ${isSearching ? 'text-gray-400' : 'text-blue-600'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SearchBox;




