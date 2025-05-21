// src/components/search/EnhancedSearchResults.tsx - Updated
// Import the new MarkdownRenderer component
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import { Entity, StepExecutionResult, TavilySearchResult, WebsiteAnalysis } from '../../types/search';
import Accordion from '../common/Accordion';
import EntityBubble from './EntityBubble';
import MarkdownRenderer from '../common/MarkdownRenderer';

// CSS for animations - extracted from inline JSX to standard CSS
const animationStyles = {
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out',
  },
  searchBoxStone: {
    backgroundColor: '#f5f5f5',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.8)',
  }
};

// Keyframes are inserted into the document head to avoid JSX style limitations
const insertKeyframes = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
};

interface EnhancedSearchResultsProps {
  results: TavilySearchResult[];
  answer?: string;
  searchQuery: string;
  websiteAnalyses: WebsiteAnalysis[];
  answerEntities?: Entity[];
  stepResults?: StepExecutionResult[];
  searchComplete: boolean;
  showDebug?: boolean;
}

const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  results,
  answer,
  searchQuery,
  websiteAnalyses,
  answerEntities = [],
  stepResults = [],
  searchComplete,
  showDebug = false,
}) => {
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [expandedWebsites, setExpandedWebsites] = useState<Record<string, boolean>>({});
  const [showSearchPlan, setShowSearchPlan] = useState<boolean>(false);
  const [showSources, setShowSources] = useState<boolean>(false);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [highlightedSentences, setHighlightedSentences] = useState<string[]>([]);

  // Insert keyframes animation once when component mounts
  useEffect(() => {
    insertKeyframes();
  }, []);

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

  // First useEffect to update highlighted sentences only
  useEffect(() => {
    if (selectedEntity) {
      setHighlightedSentences(selectedEntity.sentences);
    } else {
      setHighlightedSentences([]);
    }
  }, [selectedEntity]);

  // Second useEffect to handle auto-expanding websites that contain the selected entity
  useEffect(() => {
    if (selectedEntity) {
      const newExpandedWebsites = { ...expandedWebsites };
      let hasChanges = false;

      websiteAnalyses.forEach(website => {
        if (website.entities.some(e =>
          e.text === selectedEntity.text &&
          e.label === selectedEntity.label)) {
          if (!newExpandedWebsites[website.url]) {
            newExpandedWebsites[website.url] = true;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setExpandedWebsites(newExpandedWebsites);
      }
    }
  }, [selectedEntity, websiteAnalyses]); // Removed expandedWebsites from dependencies

  // Get all unique entity types for filtering
  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    answerEntities.forEach(entity => types.add(entity.label));
    websiteAnalyses.forEach(website => {
      website.entities.forEach(entity => types.add(entity.label));
    });
    return Array.from(types).sort();
  }, [answerEntities, websiteAnalyses]);

  const toggleWebsiteExpansion = (url: string) => {
    setExpandedWebsites(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  // Filter entities based on selected type
  const filterEntitiesByType = (entities: Entity[]) => {
    if (!selectedEntityType) return entities;
    return entities.filter(entity => entity.label === selectedEntityType);
  };

  // Helper to highlight entity mentions in text
  const highlightEntityInText = (text: string, entity: Entity | null) => {
    if (!entity || !text) return text || '';

    try {
      // Case-insensitive regex with word boundaries
      const regex = new RegExp(`\\b(${entity.text})\\b`, 'gi');
      return text.replace(regex, '<span class="bg-yellow-200 rounded px-0.5">$1</span>');
    } catch (e) {
      console.warn("Regex error in highlightEntityInText:", e);
      return text;
    }
  };

  // Find websites containing this entity
  const getWebsitesContainingEntity = (entity: Entity): WebsiteAnalysis[] => {
    if (!entity) return [];

    return websiteAnalyses.filter(website =>
      website.entities.some(e =>
        e.text === entity.text &&
        e.label === entity.label
      )
    );
  };

  // Render entity type filters
  const renderEntityTypeFilters = () => {
    if (entityTypes.length <= 1) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Entities</h4>
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

  // Selected Entity Info - Enhanced to show more context
  const renderSelectedEntity = () => {
    if (!selectedEntity) return null;

    // Find websites containing this entity for additional context
    const containingWebsites = getWebsitesContainingEntity(selectedEntity);

    return (
      <div className="mb-6 bg-indigo-50 p-4 rounded-lg" style={animationStyles.fadeIn}>
        <div className="flex justify-between items-center">
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
          <h5 className="text-xs font-medium text-indigo-800 mb-1">
            Found in {selectedEntity.sentences.length} sentences across {containingWebsites.length} sources:
          </h5>
          <ul className="list-disc pl-5 text-sm text-indigo-800 max-h-60 overflow-y-auto">
            {selectedEntity.sentences.map((sentence, idx) => (
              <li key={idx} className="mb-2 pb-2 border-b border-indigo-100 last:border-b-0">
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightEntityInText(sentence, selectedEntity)
                  }}
                />
              </li>
            ))}
          </ul>
        </div>

        {containingWebsites.length > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <h5 className="text-xs font-medium text-indigo-800 mb-1">Found in these sources:</h5>
            <div className="flex flex-wrap gap-2 mt-1">
              {containingWebsites.map((website, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleWebsiteExpansion(website.url)}
                  className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-300 transition-colors"
                >
                  {website.title.length > 30 ? website.title.substring(0, 30) + '...' : website.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Accordion for search plan steps
  const renderSearchPlanAccordion = () => {
    if (!stepResults || stepResults.length === 0) return null;

    return (
      <Accordion
        title="Search Plan"
        badgeText={`${stepResults.length} steps`}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {stepResults.map((stepResult, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Step {index + 1}: {stepResult.step.replace(/Step \d+: /, '')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">Query: {stepResult.query}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: <span className={stepResult.stepType === 'sequential' ? 'text-blue-600' : 'text-green-600'}>
                      {stepResult.stepType === 'sequential' ? 'Sequential' : 'Parallel'}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {stepResult.results.length} results
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {stepResult.entities.length} entities
                  </span>
                </div>
              </div>

              {/* Add entity bubbles for this step */}
              {stepResult.entities.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <h5 className="text-xs font-medium text-gray-500 mb-2">Entities found in this step:</h5>
                  <div className="flex flex-wrap gap-2">
                    {filterEntitiesByType(stepResult.entities).map((entity, entityIdx) => (
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

              {/* Step Answer with Markdown Support */}
              {stepResult.answer && (
                <div className="p-3 border-t border-gray-100">
                  <h5 className="text-xs font-medium text-gray-500 mb-2">Step Answer:</h5>
                  <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded">
                    <MarkdownRenderer
                      content={stepResult.answer}
                      selectedEntity={selectedEntity}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Accordion>
    );
  };

  // Accordion for sources/websites with enhanced entity highlighting
  const renderSourcesAccordion = () => {
    return (
      <Accordion
        title="Sources Used"
        badgeText={`${websiteAnalyses.length}`}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {websiteAnalyses.map((website, i) => (
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

              {/* Website Content (expanded) with improved entity-sentence highlighting */}
              {expandedWebsites[website.url] && (
                <div className="p-4" style={animationStyles.fadeIn}>
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

                  {/* Content Preview with entity highlighting */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-500 mb-1">Content Preview:</h6>
                    <div
                      className="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-60 overflow-auto"
                      dangerouslySetInnerHTML={{
                        __html: highlightEntityInText(
                          website.content.length > 500
                            ? `${website.content.substring(0, 500)}...`
                            : website.content,
                          selectedEntity
                        )
                      }}
                    />
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
      </Accordion>
    );
  };

  // Debug Panel for phase monitoring
  const renderDebugPanel = () => {
    if (!showDebug) return null;

    return (
      <div className="mb-4 bg-gray-100 p-3 rounded border border-gray-300">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h4>
        <div className="text-xs text-gray-600">
          <p>Search Complete: {searchComplete ? 'Yes' : 'No'}</p>
          <p>Step Results: {stepResults.length}</p>
          <p>Entities Found: {answerEntities.length}</p>
          <p>Sources Analyzed: {websiteAnalyses.length}</p>
        </div>
      </div>
    );
  };

  return (
    <div ref={searchResultsRef} className="search-results bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Debug Panel (only visible in development mode) */}
      {renderDebugPanel()}

      {/* Main Answer Section with Markdown rendering */}
      {answer && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Answer</h3>
          <div className="prose prose-blue max-w-none">
            <MarkdownRenderer
              content={answer}
              selectedEntity={selectedEntity}
              className="text-left"
            />
          </div>
        </div>
      )}

      {/* Answer Entities - Only visible when search is complete */}
      {answerEntities.length > 0 && searchComplete && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Entities</h4>
          {renderEntityTypeFilters()}
          <div className="flex flex-wrap gap-2 mt-3">
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

      {/* Selected Entity Details */}
      {renderSelectedEntity()}

      {/* Search Query - Always visible */}
      <div className="mb-4 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-blue-600 font-medium">{searchQuery}</p>
        </div>
      </div>

      {/* Search Plan Accordion - Minimized by default when search complete */}
      {searchComplete && renderSearchPlanAccordion()}

      {/* Sources Accordion - Minimized by default when search complete */}
      {searchComplete && renderSourcesAccordion()}
    </div>
  );
};

export default EnhancedSearchResults;