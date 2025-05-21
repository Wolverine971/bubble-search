// src/pages/Dashboard.tsx
import { Button, Card } from '@rewind-ui/core';
import { animate } from 'animejs';
import React, { useEffect, useRef, useState } from 'react';

import MainLayout from '../components/MainLayout';
import EnhancedSearchResults from '../components/search/EnhancedSearchResults';
import IntentBadge from '../components/search/IntentBadge';
// import IntentBubble from '../components/search/IntentBubble';
import QuerySummary from '../components/search/QuerySummary';
import SearchBox from '../components/search/SearchBox';
import SearchPlanApproval from '../components/search/SearchPlanApproval';
import SearchProgress from '../components/search/SearchProgress';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedSearchState, Entity, StepData, WebsiteAnalysis } from '../types/search';


const dashboardStyles = {
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out',
  },
  searchBoxStone: {
    backgroundColor: '#f5f5f5',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.8)',
  }
};

const insertDashboardKeyframes = () => {
  // Check if keyframes were already inserted to avoid duplicates
  if (!document.getElementById('dashboard-keyframes')) {
    const style = document.createElement('style');
    style.id = 'dashboard-keyframes';
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
};

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
  const [searchPlan, setSearchPlan] = useState<StepData[]>([]);
  const [searchPhase, setSearchPhase] = useState<'planning' | 'searching' | 'results'>('planning');
  const [searchComplete, setSearchComplete] = useState<boolean>(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  // Add debug log functionality
  const logDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => `${message}\n${prev}`);
  };

  useEffect(() => {
    // Insert keyframes for animations
    insertDashboardKeyframes();

    // Animation for dashboard elements
    if (dashboardRef.current) {
      animate(dashboardRef.current.querySelectorAll('.animate-item'), {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (_, i) => i * 100,
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, []);


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

  // Update search phase based on search stage
  useEffect(() => {
    if (searchStage === 'classifying' || searchStage === 'summarizing') {
      setSearchPhase('planning');
    } else if (searchStage === 'searching' || searchStage === 'analyzing_website' ||
      searchStage === 'executing_plan_step' || searchStage === 'step_query_generated' ||
      searchStage === 'step_completed') {
      setSearchPhase('searching');
    } else if (searchStage === 'complete' || searchStage === 'analysis_complete') {
      setSearchPhase('results');
      setSearchComplete(true);
    }
  }, [searchStage]);

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
    if (!isSearching || !searchState?.analysisProgress || searchPhase === 'results') return null;

    const { message, progress, currentUrl } = searchState.analysisProgress;

    return (
      <div className="mb-4 bg-indigo-50 p-4 rounded-lg" style={dashboardStyles.fadeIn}>
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

  const extractSentencesWithEntity = (text: string, entityText: string): string[] => {
    if (!text || !entityText) return [];

    // Basic sentence splitting - can be improved with NLP libraries
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex) || [];

    // Find sentences containing the entity (case insensitive)
    const entityRegex = new RegExp(`\\b${entityText}\\b`, 'i');
    return sentences
      .filter(sentence => entityRegex.test(sentence))
      .map(sentence => sentence.trim());
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
    setSearchPhase('planning');
    setSearchComplete(false);

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

    try {
      // Close any existing reader
      closeReader();

      // Use the enhanced search endpoint
      const response = await fetch('http://localhost:5000/api/search', {
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
                    // Ensure entities have sentences
                    const websiteAnalyses = eventData.data.websiteAnalyses.map((analysis: WebsiteAnalysis) => {
                      // Update entities to ensure they have the sentences property
                      const updatedEntities = analysis.entities.map((entity: Entity) => {
                        // If entity doesn't have sentences, generate from content by finding instances
                        if (!entity.sentences || entity.sentences.length === 0) {
                          // Simple extraction - split content by sentence endings and find mentions
                          const sentences = extractSentencesWithEntity(analysis.content, entity.text);
                          return { ...entity, sentences };
                        }
                        return entity;
                      });

                      return { ...analysis, entities: updatedEntities };
                    });

                    setSearchState(prevState => ({
                      ...prevState!,
                      websiteAnalyses,
                      currentAnalysis: eventData.data.currentAnalysis
                    }));

                    logDebug(`Website analyzed: ${eventData.data.currentAnalysis.url}`);
                  }


                  // Handle answer entities
                  if (eventData.stage === 'answer_analyzed' && eventData.data?.answerEntities) {
                    // Ensure answer entities have sentences by checking all website analyses
                    const answerEntities = eventData.data.answerEntities.map((entity: Entity) => {
                      // If entity doesn't have sentences, collect them from all website analyses
                      if (!entity.sentences || entity.sentences.length === 0) {
                        const sentences: string[] = [];

                        // Look through all websites for sentences containing this entity
                        searchState?.websiteAnalyses?.forEach(website => {
                          const matchingEntity = website.entities.find(e =>
                            e.text === entity.text && e.label === entity.label);

                          if (matchingEntity && matchingEntity.sentences) {
                            sentences.push(...matchingEntity.sentences);
                          } else {
                            // Try to extract sentences containing entity from website content
                            const extractedSentences = extractSentencesWithEntity(website.content, entity.text);
                            sentences.push(...extractedSentences);
                          }
                        });

                        // If we have an answer, check there too
                        if (searchState?.answer) {
                          const answerSentences = extractSentencesWithEntity(searchState.answer, entity.text);
                          sentences.push(...answerSentences);
                        }

                        return { ...entity, sentences: [...new Set(sentences)] }; // Remove duplicates
                      }
                      return entity;
                    });

                    setSearchState(prevState => ({
                      ...prevState!,
                      answerEntities
                    }));

                    logDebug(`Answer analyzed with ${answerEntities.length} entities`);
                  }

                  // Handle search plan if present
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

                    setSearchPhase('searching');
                    logDebug(`Executing step ${eventData.data.currentStep}/${eventData.data.totalSteps}: ${eventData.data.stepDescription.step}`);
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
                    setSearchPhase('planning');
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
                      setSearchPhase('results');
                      setSearchComplete(true);
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
          handleSearchError(err, 'Error reading stream:');
        }
      };

      processStream();
    } catch (err) {
      handleSearchError(err, 'Search error:');
      // Animate search box back to normal if there's an error
      resetSearchBoxAnimation();
    }
  };

  const handleApproveSearchPlan = async () => {
    setNeedsApproval(false);
    setIsSearching(true);
    setSearchPhase('searching');
    logDebug('Search plan approved - continuing search');

    try {
      // Continue with the search, passing in the approved plan
      await continuePlanExecution(searchPlan);
    } catch (err) {
      handleSearchError(err, 'Error continuing search:');
    }
  };

  const handleEditSearchPlan = (editedPlan: StepData[]) => {
    setSearchPlan([...editedPlan]);
    logDebug(`Search plan edited - updated to ${editedPlan.length} steps`);

    // The plan was edited, now we need to show the approval UI again
    setNeedsApproval(true);
  };

  // Extract the common logic for continuing the search into a reusable function
  const continuePlanExecution = async (plan: StepData[]) => {
    // Close any existing reader
    closeReader();

    const response = await fetch('http://localhost:5000/api/search/continue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        plan: plan,
        intent: searchState?.intent,
        querySummary: searchState?.querySummary,
        approved: true,
        test: false
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
                  setSearchPhase('planning');
                } else {
                  setSearchState(prevState => ({ ...prevState!, ...eventData.data }));

                  if (eventData.stage === 'complete') {
                    setIsSearching(false);
                    setSearchPhase('results');
                    setSearchComplete(true);
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
        handleSearchError(err, 'Error reading continue stream:');
      }
    };

    processStream();
  };

  // Common error handling for search processes
  const handleSearchError = (err: any, prefix: string) => {
    console.error(prefix, err);
    setError('An error occurred while processing your search');
    setSearchStage('error');
    setIsSearching(false);
    setSearchPhase('planning');
    logDebug(`${prefix} ${err}`);
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
      <SearchPlanApproval
        searchPlan={searchPlan}
        onApprove={handleApproveSearchPlan}
        onEdit={handleEditSearchPlan}
      />
    );
  };

  // Render step execution during the search phase
  const renderStepExecution = () => {
    if (!isSearching || !searchState?.currentStep || !searchState?.totalSteps || searchPhase !== 'searching') return null;

    const { currentStep, totalSteps, stepDescription, stepQuery } = searchState;

    return (
      <div className="mb-4 bg-green-50 p-4 rounded-lg" style={dashboardStyles.fadeIn}>
        <h4 className="text-sm font-medium text-green-800 mb-2">
          Executing plan: Step {currentStep} of {totalSteps}
        </h4>
        <p className="text-xs text-green-700 mb-2">{stepDescription?.step || ''}</p>
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

  // Render based on search phase
  const renderSearchPhaseContent = () => {
    // Phase 1: Planning
    if (searchPhase === 'planning') {
      return (
        <>
          {/* Search progress component */}
          <SearchProgress
            isSearching={isSearching}
            searchStage={searchStage}
          />

          {/* Search plan approval UI */}
          {renderSearchPlanApproval()}

          {/* Query Summary - only show during planning/searching phases */}
          {searchState?.querySummary && (
            <QuerySummary querySummary={searchState.querySummary} />
          )}
        </>
      );
    }

    // Phase 2: Searching
    else if (searchPhase === 'searching') {

      return (
        <>
          {/* Search progress component */}
          <SearchProgress
            isSearching={isSearching}
            searchStage={searchStage}
          />

          {/* Website analysis progress */}
          {renderAnalysisProgress()}

          {/* Step execution progress */}
          {renderStepExecution()}

          {/* Query Summary - shown during searching */}
          {searchState?.querySummary && (
            <QuerySummary querySummary={searchState.querySummary} />
          )}

          {/* Show partial results if available */}
          {searchState?.results && searchState.results.length > 0 && (
            <EnhancedSearchResults
              results={searchState.results}
              answer={searchState.answer}
              searchQuery={searchState.query}
              websiteAnalyses={searchState.websiteAnalyses || []}
              answerEntities={searchState.answerEntities}
              stepResults={searchState.stepResults}
              searchComplete={false}
              showDebug={showDebug}
            />
          )}
        </>
      );
    }

    // Phase 3: Results
    else if (searchPhase === 'results') {

      return (
        <>
          {/* Full results with collapsible sections */}
          {searchState?.results && searchState.results.length > 0 && (
            <EnhancedSearchResults
              results={searchState.results}
              answer={searchState.answer}
              searchQuery={searchState.query}
              websiteAnalyses={searchState.websiteAnalyses || []}
              answerEntities={searchState.answerEntities}
              stepResults={searchState.stepResults}
              searchComplete={true}
              showDebug={showDebug}
            />
          )}
        </>
      );
    }

    // Initial state
    return (
      <>
        {!searchState && !isSearching && (
          <div className="animate-item bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-blue-800">Getting Started</h2>
            <p className="text-blue-700">
              Try searching for anything - news, questions, products, or locations. Our AI will understand your intent and provide tailored results with entity recognition.
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <MainLayout maxWidth="xl">
      <div ref={dashboardRef} className="max-w-5xl mx-auto">
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
              {/* <IntentBubble
                intent={searchState?.intent || ''}
                showBubble={showBubble}
                searchStage={searchStage}
              /> */}

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

            {/* Render content based on search phase */}
            {renderSearchPhaseContent()}

            {/* Debug information */}
            {showDebug && (
              <div className="mt-8">
                <div className="p-4 bg-gray-100 rounded text-xs text-gray-500 overflow-auto" style={{ maxHeight: '300px' }}>
                  <h3 className="font-semibold mb-2">Current State:</h3>
                  <p>Search Stage: {searchStage}</p>
                  <p>Search Phase: {searchPhase}</p>
                  <p>Is Searching: {isSearching ? 'true' : 'false'}</p>
                  <p>Search Complete: {searchComplete ? 'true' : 'false'}</p>
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
          </Card.Body>
        </Card>
      </div>


    </MainLayout>
  );
};

export default Dashboard;