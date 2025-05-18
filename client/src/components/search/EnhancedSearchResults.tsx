import { animate } from 'animejs';
// src/components/search/EnhancedSearchResults.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { StepExecutionResult } from '../../pages/Dashboard';
import { TavilySearchResult } from '../../types/search';
import EntityBubble, { Entity } from './EntityBubble';

export interface WebsiteAnalysis {
  url: string;
  title: string;
  searchQuery: string;
  content: string;
  entities: Entity[];
  isExpanded?: boolean;
  stepIndex?: number; // Add stepIndex to the interface
}

interface EnhancedSearchResultsProps {
  results: TavilySearchResult[];
  answer?: string;
  searchQuery: string;
  websiteAnalyses: WebsiteAnalysis[];
  answerEntities?: Entity[];
  stepResults?: StepExecutionResult[];
}

const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  results,
  answer,
  searchQuery,
  websiteAnalyses,
  answerEntities = [],
  stepResults = []
}) => {
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [expandedWebsites, setExpandedWebsites] = useState<Record<string, boolean>>({});
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);

  useEffect(() => {
    if (results.length > 0 && searchResultsRef.current) {
      animate(searchResultsRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        easing: 'easeOutExpo',
        duration: 600
      });
    }
  }, [results]);

  // Auto-expand the first website to show entities
  useEffect(() => {
    if (websiteAnalyses.length > 0 && Object.keys(expandedWebsites).length === 0) {
      setExpandedWebsites({ [websiteAnalyses[0].url]: true });
    }
  }, [websiteAnalyses]);

  const toggleWebsiteExpansion = (url: string) => {
    setExpandedWebsites(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  // Filter websites based on selected step
  const filteredWebsiteAnalyses = selectedStep !== null
    ? websiteAnalyses.filter(website => website.stepIndex === selectedStep)
    : websiteAnalyses;

  // Get all unique entity types for filtering
  const entityTypes = useMemo(() => {
    const types = new Set<string>();

    // Add entity types from answer entities
    answerEntities.forEach(entity => types.add(entity.label));

    // Add entity types from website analyses
    websiteAnalyses.forEach(website => {
      website.entities.forEach(entity => types.add(entity.label));
    });

    return Array.from(types).sort();
  }, [answerEntities, websiteAnalyses]);

  // Filter entities based on selected type
  const filterEntitiesByType = (entities: Entity[]) => {
    if (!selectedEntityType) return entities;
    return entities.filter(entity => entity.label === selectedEntityType);
  };

  // Render entity type filters
  const renderEntityTypeFilters = () => {
    if (entityTypes.length <= 1) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Entity Type</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEntityType(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border 
              ${selectedEntityType === null
                ? 'bg-gray-800 text-white border-gray-900'
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
          >
            All Types
          </button>

          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedEntityType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium border 
                ${selectedEntityType === type
                  ? 'bg-purple-600 text-white border-purple-700'
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render plan steps for filtering
  const renderPlanSteps = () => {
    if (!stepResults || stepResults.length <= 1) return null;

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Search Plan Steps</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStep(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border 
              ${selectedStep === null
                ? 'bg-gray-800 text-white border-gray-900'
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
          >
            All Steps
          </button>

          {stepResults.map((step, index) => (
            <button
              key={index}
              onClick={() => setSelectedStep(index)}
              className={`px-3 py-1 rounded-full text-xs font-medium border 
                ${selectedStep === index
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'}`}
            >
              Step {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // CSS classes for animations
  const fadeInClass = "opacity-0 animate-fadeIn";

  return (
    <div ref={searchResultsRef} className="search-results bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Answer Section */}
      <h3 className="text-lg font-medium text-gray-800 mb-2">Answer</h3>
      <div className="prose prose-blue max-w-none mb-4">
        <p className="text-gray-700">{answer}</p>
      </div>

      {/* Answer Entities */}
      {answerEntities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Entities</h4>
          <div className="flex flex-wrap gap-2">
            {filterEntitiesByType(answerEntities).map((entity, idx) => (
              <EntityBubble
                key={`answer-entity-${idx}`}
                entity={entity}
                onClick={() => setSelectedEntity(entity)}
                isSelected={selectedEntity?.text === entity.text && selectedEntity?.label === entity.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Entity Type Filtering */}
      {renderEntityTypeFilters()}

      {/* Plan Step Filtering */}
      {renderPlanSteps()}

      {/* Selected Entity Info */}
      {selectedEntity && (
        <div className="mb-6 bg-indigo-50 p-4 rounded-lg animate-fadeIn">
          <div className="flex justify-between">
            <h4 className="text-sm font-medium text-indigo-900 mb-2">
              Entity: <span className="font-bold">{selectedEntity.text}</span> ({selectedEntity.label})
            </h4>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-indigo-500 hover:text-indigo-700"
              aria-label="Close entity details"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            <h5 className="text-xs font-medium text-indigo-800 mb-1">Found in sentences:</h5>
            <ul className="list-disc pl-5 text-sm text-indigo-800">
              {selectedEntity.sentences.map((sentence, idx) => (
                <li key={idx} className="mb-1">"{sentence}"</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Search Query */}
      <div className="mb-4 bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Search Query</h4>
        <div className="flex items-center">
          <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-blue-600 font-medium">{searchQuery}</p>
        </div>
      </div>

      {/* Websites Analyzed Section */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          Websites Analyzed ({filteredWebsiteAnalyses.length})
          {selectedStep !== null && ` for Step ${selectedStep + 1}`}
        </h4>

        <div className="space-y-4">
          {filteredWebsiteAnalyses.map((website, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Website Header */}
              <div
                className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleWebsiteExpansion(website.url)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded p-1 mr-3">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 truncate" style={{ maxWidth: '250px' }}>
                      {website.title}
                      {website.stepIndex !== undefined && (
                        <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 ml-2">
                          Step {website.stepIndex + 1}
                        </span>
                      )}
                    </h5>
                    <p className="text-xs text-gray-500 truncate" style={{ maxWidth: '250px' }}>
                      {website.url}
                    </p>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={expandedWebsites[website.url] ? "Collapse website details" : "Expand website details"}
                >
                  <svg
                    className={`h-5 w-5 transform transition-transform ${expandedWebsites[website.url] ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Website Content (expanded) */}
              {expandedWebsites[website.url] && (
                <div className="p-4 animate-fadeIn">
                  {/* Search Query Used */}
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-gray-500 mb-1">Search Query:</h6>
                    <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                      {website.searchQuery || searchQuery}
                    </p>
                  </div>

                  {/* Recognized Entities */}
                  {website.entities.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-xs font-medium text-gray-500 mb-2">Recognized Entities:</h6>
                      <div className="flex flex-wrap gap-2">
                        {filterEntitiesByType(website.entities).map((entity, entityIdx) => (
                          <EntityBubble
                            key={`${entity.text}-${entityIdx}`}
                            entity={entity}
                            onClick={() => setSelectedEntity(entity)}
                            isSelected={selectedEntity?.text === entity.text && selectedEntity?.label === entity.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-500 mb-1">Content Preview:</h6>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                      {website.content.length > 300
                        ? `${website.content.substring(0, 300)}...`
                        : website.content}
                    </p>
                  </div>

                  {/* View Full Source Link */}
                  <div className="mt-3">
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Full Source
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sources Section */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Sources</h4>
        <div className="space-y-2">
          {results.map((result: TavilySearchResult, index: number) => (
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:underline"
            >
              {result.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchResults;