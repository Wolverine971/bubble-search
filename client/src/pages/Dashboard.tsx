import { Button, Card } from '@rewind-ui/core';
import { animate } from 'animejs';
// src/pages/Dashboard.tsx
import React, { useEffect, useRef, useState } from 'react';

import MainLayout from '../components/MainLayout';
import EnhancedSearchResults from '../components/search/EnhancedSearchResults';
import { Entity } from '../components/search/EntityBubble';
import IntentBadge from '../components/search/IntentBadge';
import IntentBubble from '../components/search/IntentBubble';
import QuerySummary from '../components/search/QuerySummary';
import SearchBox from '../components/search/SearchBox';
import SearchProgress from '../components/search/SearchProgress';
import { useAuth } from '../contexts/AuthContext';
// import { SearchState, TavilySearchResult } from '../services/websiteAnalysisService'; // Add type definition to your project
import { SearchState, TavilySearchResult } from '../types/search';

export interface RecognizedEntity {
  text: string;
  label: string;
  sentences: string[];
}

export interface WebsiteAnalysis {
  url: string;
  title: string;
  searchQuery: string;
  content: string;
  entities: RecognizedEntity[];
  isExpanded?: boolean;
}

// Interface for expanded search state
export interface EnhancedSearchState extends SearchState {
  websiteAnalyses?: WebsiteAnalysis[];
  currentAnalysis?: WebsiteAnalysis;
  answerEntities?: Entity[];
  analysisProgress?: {
    message: string;
    currentUrl: string;
    progress: number;
  };
  stepResults?: StepExecutionResult[];
  currentStep?: number;
  totalSteps?: number;
  stepDescription?: string;
  stepQuery?: string;
}

// Add this type for step execution results
export interface StepExecutionResult {
  step: string;
  stepIndex: number;
  query: string;
  results: TavilySearchResult[];
  answer: string;
  entities: Entity[];
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchState, setSearchState] = useState<EnhancedSearchState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchStage, setSearchStage] = useState<string>('initial');
  const [showBubble, setShowBubble] = useState<boolean>(false);
  const [showIntentBadge, setShowIntentBadge] = useState<boolean>(false);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [searchPlan, setSearchPlan] = useState<string[]>([]);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  // Add debug log functionality
  const logDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => `${message}\n${prev}`);
  };

  useEffect(() => {
    // Animation for dashboard elements
    if (dashboardRef.current) {
      animate(dashboardRef.current.querySelectorAll('.animate-item'), {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (el, i) => i * 100,
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, []);

  // Animation for intent badge bubble
  useEffect(() => {
    if (searchState?.intent && !showBubble && searchStage !== 'classifying') {
      // Set this to true to trigger the bubble animation only once
      setShowBubble(true);

      // After bubble rises and expands, "pop" it and show the intent badge
      setTimeout(() => {
        setShowBubble(false);
        setShowIntentBadge(true);
      }, 1700); // Adjusted timing to match animation duration
    }
  }, [searchState?.intent, showBubble, searchStage]);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      closeReader();
    };
  }, []);

  // Handle reader cleanup
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const closeReader = () => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
  };

  const renderAnalysisProgress = () => {
    if (!isSearching || !searchState?.analysisProgress) return null;

    const { message, progress, currentUrl } = searchState.analysisProgress;

    return (
      <div className="mb-4 bg-indigo-50 p-4 rounded-lg animate-fade-in">
        <h4 className="text-sm font-medium text-indigo-800 mb-2">{message}</h4>
        <p className="text-xs text-indigo-600 mb-2 truncate">URL: {currentUrl}</p>
        <div className="w-full bg-indigo-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);
    setIsSearching(true);
    setSearchStage('classifying');
    setShowBubble(false);
    setShowIntentBadge(false);
    setNeedsApproval(false);
    setSearchPlan([]);

    // Reset previous search state but keep the query
    setSearchState({
      query: searchQuery,
      intent: "",
      querySummary: "",
      results: [],
      answer: "",
      websiteAnalyses: []
    });

    logDebug(`Starting enhanced search for: ${searchQuery}`);

    // Animate search box (same as before)

    try {
      // Close any existing reader
      closeReader();

      // Use the enhanced search endpoint
      const response = await fetch('http://localhost:5000/api/enhanced-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          test: false // Toggle for testing
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // Create a new reader to handle the stream
      const reader = response.body!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      let buffer = '';

      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              logDebug('Stream finished');
              setIsSearching(false);
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.substring(6));

                  // Update the search stage
                  setSearchStage(eventData.stage);
                  logDebug(`Received event: ${eventData.stage}`);

                  // Handle special stages for entity analysis
                  if (eventData.stage === 'analyzing_website' && eventData.data?.progress !== undefined) {
                    setSearchState(prevState => ({
                      ...prevState!,
                      analysisProgress: eventData.data
                    }));
                  }

                  // Handle website analysis results
                  if (eventData.stage === 'website_analyzed' && eventData.data?.currentAnalysis) {
                    setSearchState(prevState => ({
                      ...prevState!,
                      websiteAnalyses: eventData.data.websiteAnalyses,
                      currentAnalysis: eventData.data.currentAnalysis
                    }));

                    logDebug(`Website analyzed: ${eventData.data.currentAnalysis.url}`);
                  }

                  // Handle answer entities
                  if (eventData.stage === 'answer_analyzed' && eventData.data?.answerEntities) {
                    setSearchState(prevState => ({
                      ...prevState!,
                      answerEntities: eventData.data.answerEntities
                    }));

                    logDebug(`Answer analyzed with ${eventData.data.answerEntities.length} entities`);
                  }

                  // Handle search plan if present (same as before)
                  if (eventData.data?.searchPlan) {
                    setSearchPlan(eventData.data.searchPlan);
                    logDebug(`Search plan received with ${eventData.data.searchPlan.length} steps`);

                    if (eventData.data.needsApproval) {
                      setNeedsApproval(true);
                      setIsSearching(false);
                      logDebug('Search paused - waiting for plan approval');
                    }
                  }

                  if (eventData.stage === 'executing_plan_step') {
                    setSearchState(prevState => ({
                      ...prevState!,
                      currentStep: eventData.data.currentStep,
                      totalSteps: eventData.data.totalSteps,
                      stepDescription: eventData.data.stepDescription
                    }));

                    logDebug(`Executing step ${eventData.data.currentStep}/${eventData.data.totalSteps}: ${eventData.data.stepDescription}`);
                  }

                  if (eventData.stage === 'step_query_generated') {
                    setSearchState(prevState => ({
                      ...prevState!,
                      stepQuery: eventData.data.stepQuery
                    }));

                    logDebug(`Generated query for step: ${eventData.data.stepQuery}`);
                  }

                  if (eventData.stage === 'step_completed') {
                    setSearchState(prevState => {
                      // Initialize stepResults array if it doesn't exist
                      const currentStepResults = prevState?.stepResults || [];

                      return {
                        ...prevState!,
                        stepResults: [...currentStepResults, eventData.data.stepResult]
                      };
                    });

                    logDebug(`Completed step ${eventData.data.currentStep}/${eventData.data.totalSteps}`);
                  }

                  // Update the search state based on the stage
                  if (eventData.stage === 'error') {
                    setError(eventData.error);
                    setIsSearching(false);
                    logDebug(`Error: ${eventData.error}`);
                  } else {
                    // Use function form to avoid stale state
                    setSearchState(prevState => {
                      // Create a new state object
                      const newState = { ...prevState!, ...eventData.data };

                      // Don't overwrite websiteAnalyses if not provided
                      if (!eventData.data.websiteAnalyses && prevState?.websiteAnalyses) {
                        newState.websiteAnalyses = prevState.websiteAnalyses;
                      }

                      // Don't overwrite answerEntities if not provided
                      if (!eventData.data.answerEntities && prevState?.answerEntities) {
                        newState.answerEntities = prevState.answerEntities;
                      }

                      return newState;
                    });

                    // If we got complete results, stop loading
                    if (eventData.stage === 'complete' || eventData.stage === 'analysis_complete') {
                      setIsSearching(false);
                      logDebug('Search completed');
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing event data:', parseError, 'Line:', line);
                  logDebug(`Parse error: ${parseError}`);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error reading stream:', err);
          setError('An error occurred while processing your search');
          setSearchStage('error');
          setIsSearching(false);
          logDebug(`Stream error: ${err}`);
        }
      };

      processStream();
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
      setSearchStage('error');
      setIsSearching(false);
      logDebug(`Error: ${err}`);

      // Animate search box back to normal if there's an error
      resetSearchBoxAnimation();
    }
  };

  const handleApproveSearchPlan = async () => {
    setNeedsApproval(false);
    setIsSearching(true);
    logDebug('Search plan approved - continuing search');

    try {
      // Continue with the search, passing in the approved plan
      const response = await fetch('http://localhost:5000/api/search/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          plan: searchPlan,
          approved: true,
          test: false // Use test mode for now
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // Create a new reader to handle the stream
      const reader = response.body!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      let buffer = '';

      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              logDebug('Continue stream finished');
              setIsSearching(false);
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete messages - same logic as handleSearch
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.substring(6));
                  setSearchStage(eventData.stage);
                  logDebug(`Received event in continue: ${eventData.stage}`);

                  if (eventData.stage === 'error') {
                    setError(eventData.error);
                    setIsSearching(false);
                  } else {
                    setSearchState(prevState => ({ ...prevState!, ...eventData.data }));

                    if (eventData.stage === 'complete') {
                      setIsSearching(false);
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing event data:', parseError);
                  logDebug(`Parse error in continue: ${parseError}`);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error reading continue stream:', err);
          setError('An error occurred while processing your search');
          setSearchStage('error');
          setIsSearching(false);
          logDebug(`Continue stream error: ${err}`);
        }
      };

      processStream();
    } catch (err) {
      console.error('Error continuing search:', err);
      setError('An error occurred while processing your search');
      setSearchStage('error');
      setIsSearching(false);
      logDebug(`Continue error: ${err}`);
    }
  };

  const handleEditSearchPlan = () => {
    // For now, just log that edit was requested
    logDebug('Search plan edit requested - not implemented yet');
    // This would open an editing UI in a real implementation
  };

  const resetSearchBoxAnimation = () => {
    if (searchBoxRef.current) {
      animate(searchBoxRef.current, {
        backgroundColor: ['#f5f5f5', '#ffffff'],
        boxShadow: [
          '0 4px 8px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.8)',
          '0 1px 3px rgba(0,0,0,0.1)'
        ],
        scale: [1.01, 1],
        easing: 'easeOutExpo',
        duration: 500
      });
    }
  };

  // Render the search plan approval component when needed
  const renderSearchPlanApproval = () => {
    if (!needsApproval || searchPlan.length === 0) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4 animate-item">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Proposed Search Plan</h3>
        <p className="text-yellow-700 mb-4">This query requires multiple steps. Please review and approve the search plan:</p>

        <ul className="list-decimal pl-5 mb-4 space-y-2">
          {searchPlan.map((step, index) => (
            <li key={index} className="text-yellow-700">{step}</li>
          ))}
        </ul>

        <div className="flex space-x-3">
          <Button color="yellow" onClick={handleApproveSearchPlan}>
            Approve and Continue
          </Button>
          <Button color="gray" onClick={handleEditSearchPlan}>
            Edit Plan
          </Button>
        </div>
      </div>
    );
  };

  // Add this to handle the step execution display
  const renderStepExecution = () => {
    if (!isSearching || !searchState?.currentStep || !searchState?.totalSteps) return null;

    const { currentStep, totalSteps, stepDescription, stepQuery } = searchState;

    return (
      <div className="mb-4 bg-green-50 p-4 rounded-lg animate-fade-in">
        <h4 className="text-sm font-medium text-green-800 mb-2">
          Executing plan: Step {currentStep} of {totalSteps}
        </h4>
        <p className="text-xs text-green-700 mb-2">{stepDescription}</p>
        {stepQuery && (
          <div className="flex items-center mt-2">
            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-green-600 font-medium">{stepQuery}</p>
          </div>
        )}
        <div className="w-full bg-green-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Add this to show the step results
  const renderStepResults = () => {
    if (!searchState?.stepResults || searchState.stepResults.length === 0) return null;

    return (
      <div className="mb-6 bg-gray-50 p-4 rounded-lg animate-fade-in">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Plan Execution Steps</h3>

        <div className="space-y-4">
          {searchState.stepResults.map((stepResult, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Step {index + 1}: {stepResult.step.replace(/Step \d+: /, '')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">Query: {stepResult.query}</p>
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
            </div>
          ))}
        </div>
      </div>
    );
  };



  return (
    <MainLayout maxWidth="lg">
      <div ref={dashboardRef} className="max-w-4xl mx-auto">
        <Card shadow="lg" className="overflow-hidden">
          <Card.Header className="bg-white border-b border-gray-100 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 animate-item">Welcome, {user?.user_metadata?.name || 'User'}!</h1>
              <p className="text-gray-500 mt-1 animate-item">Your enhanced search experience</p>
            </div>
            <div className="flex space-x-3">
              <Button color="blue" onClick={() => setShowDebug(!showDebug)} size="sm" className="animate-item">
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </Button>
              <Button color="red" onClick={signOut} className="animate-item">
                Sign Out
              </Button>
            </div>
          </Card.Header>

          <Card.Body className="px-6 py-8">
            <div className="animate-item mb-8 relative">
              {/* Intent bubble and badge components */}
              <IntentBubble
                intent={searchState?.intent || ''}
                showBubble={showBubble}
                searchStage={searchStage}
              />

              <IntentBadge
                intent={searchState?.intent || ''}
                showIntentBadge={showIntentBadge}
              />

              {/* Search box component */}
              <div ref={searchBoxRef}>
                <SearchBox
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isSearching={isSearching}
                  handleSearch={handleSearch}
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Search progress component */}
            <SearchProgress
              isSearching={isSearching}
              searchStage={searchStage}
            />

            {/* Website analysis progress */}
            {renderAnalysisProgress()}

            {/* Search plan approval UI */}
            {renderSearchPlanApproval()}

            {/* Step execution progress */}
            {renderStepExecution()}

            {/* Step results summary (if available) */}
            {searchState?.stepResults && searchState.stepResults.length > 0 && renderStepResults()}

            {/* Query Summary - show even if still analyzing websites */}
            {searchState?.querySummary && (
              <QuerySummary querySummary={searchState.querySummary} />
            )}

            {/* Enhanced Search Results - show as they become available */}
            {searchState?.results && searchState.results.length > 0 && (
              <EnhancedSearchResults
                results={searchState.results}
                answer={searchState.answer}
                searchQuery={searchState.query}
                websiteAnalyses={searchState.websiteAnalyses || []}
                answerEntities={searchState.answerEntities}
                stepResults={searchState.stepResults}
              />
            )}

            {/* Debug information */}
            {showDebug && (
              <div className="mt-8">
                <div className="p-4 bg-gray-100 rounded text-xs text-gray-500 overflow-auto" style={{ maxHeight: '300px' }}>
                  <h3 className="font-semibold mb-2">Current State:</h3>
                  <p>Search Stage: {searchStage}</p>
                  <p>Is Searching: {isSearching ? 'true' : 'false'}</p>
                  <p>Shows Bubble: {showBubble ? 'true' : 'false'}</p>
                  <p>Shows Intent Badge: {showIntentBadge ? 'true' : 'false'}</p>
                  <p>Needs Approval: {needsApproval ? 'true' : 'false'}</p>
                  <p>Intent: {searchState?.intent || 'none'}</p>
                  <p>Has Query Summary: {searchState?.querySummary ? 'Yes' : 'No'}</p>
                  <p>Results Count: {searchState?.results?.length || 0}</p>
                  <p>Website Analyses: {searchState?.websiteAnalyses?.length || 0}</p>
                  <p>Analysis Progress: {searchState?.analysisProgress?.progress || 0}%</p>

                  <h3 className="font-semibold mt-4 mb-2">Debug Log:</h3>
                  <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                </div>
              </div>
            )}

            {/* Initial state */}
            {!searchState && !isSearching && (
              <div className="animate-item bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-2 text-blue-800">Getting Started</h2>
                <p className="text-blue-700">
                  Try searching for anything - news, questions, products, or locations. Our AI will understand your intent and provide tailored results with entity recognition.
                </p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </MainLayout>
  );
};

export default Dashboard;