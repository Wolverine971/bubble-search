// src/services/enhancedPlanExecution.ts
import { SearchIntent, SearchState, TavilySearchResult } from '../types/search';
import { performSearch } from './tavily';
import { analyzeText, RecognizedEntity } from './spacyService';

/**
 * Interface for step result with entity analysis
 */
export interface StepExecutionResult {
    step: string;
    stepIndex: number;
    query: string;
    results: TavilySearchResult[];
    answer: string;
    entities: RecognizedEntity[];
}

/**
 * Enhanced search plan execution with entity recognition
 */
export const executePlanWithEntityRecognition = async (
    originalQuery: string,
    searchPlan: string[],
    intent: SearchIntent,
    progressCallback: (stage: string, data: any) => void
): Promise<{
    results: TavilySearchResult[];
    answer: string;
    stepResults: StepExecutionResult[];
    combinedEntities: RecognizedEntity[];
}> => {
    // Step results will store each step's execution result
    const stepResults: StepExecutionResult[] = [];
    let combinedResults: TavilySearchResult[] = [];
    let finalAnswer = '';

    // Initialize combined entities map for deduplication
    const entitiesMap: Record<string, RecognizedEntity> = {};

    // Execute each step in the plan
    for (let i = 0; i < searchPlan.length; i++) {
        const step = searchPlan[i];

        // Notify start of step execution
        progressCallback('executing_plan_step', {
            currentStep: i + 1,
            totalSteps: searchPlan.length,
            stepDescription: step
        });

        // Generate a query for this specific step
        const stepQuery = await generateStepQuery(originalQuery, step, intent);

        // Notify step query generated
        progressCallback('step_query_generated', {
            currentStep: i + 1,
            totalSteps: searchPlan.length,
            stepDescription: step,
            stepQuery
        });

        // Perform search for this step
        const tavilyResults = await performSearch(stepQuery);

        // Analyze the step results for entities
        const stepEntities = await analyzeStepResults(tavilyResults, stepQuery);

        // Save this step's results
        const stepResult: StepExecutionResult = {
            step,
            stepIndex: i,
            query: stepQuery,
            results: tavilyResults.results,
            answer: tavilyResults.answer,
            entities: stepEntities
        };

        stepResults.push(stepResult);

        // Add to combined results and entities
        combinedResults = [...combinedResults, ...tavilyResults.results];

        // Merge entities, avoiding duplicates
        stepEntities.forEach(entity => {
            const key = `${entity.text.toLowerCase()}_${entity.label}`;

            if (!entitiesMap[key]) {
                entitiesMap[key] = {
                    text: entity.text,
                    label: entity.label,
                    sentences: entity.sentences
                };
            } else {
                // Add any new sentences
                entity.sentences.forEach(sentence => {
                    if (!entitiesMap[key].sentences.includes(sentence)) {
                        entitiesMap[key].sentences.push(sentence);
                    }
                });
            }
        });

        // Stream the step results
        progressCallback('step_completed', {
            currentStep: i + 1,
            totalSteps: searchPlan.length,
            stepResult
        });

        // For the final step, use its answer as the final answer
        if (i === searchPlan.length - 1) {
            finalAnswer = tavilyResults.answer;
        }
    }

    // Generate a synthesized answer from all steps if needed
    if (searchPlan.length > 1 && finalAnswer.length < 100) {
        finalAnswer = await synthesizeAnswer(originalQuery, stepResults);
    }

    // Return combined results
    return {
        results: combinedResults.slice(0, 5), // Limit to top 5 results
        answer: finalAnswer,
        stepResults,
        combinedEntities: Object.values(entitiesMap)
    };
};

/**
 * Generate a specific query for a plan step
 */
const generateStepQuery = async (
    originalQuery: string,
    step: string,
    intent: SearchIntent
): Promise<string> => {
    // Extract the main focus from the step description
    const focusMatch = step.match(/Search for (.*?)(?:to |$)/i);
    const focus = focusMatch ? focusMatch[1].trim() : '';

    // If focus found, use it to refine the query
    if (focus && !focus.includes('information about')) {
        return `${focus} ${originalQuery}`;
    }

    // Otherwise, use the original query with some context from the step
    return originalQuery;
};

/**
 * Analyze results from a step for entities
 */
const analyzeStepResults = async (
    tavilyResults: { results: TavilySearchResult[], answer: string },
    stepQuery: string
): Promise<RecognizedEntity[]> => {
    // Analyze the answer first
    let entities: RecognizedEntity[] = [];

    if (tavilyResults.answer) {
        const answerEntities = await analyzeText(tavilyResults.answer);
        entities = [...entities, ...answerEntities];
    }

    // Analyze each result
    for (const result of tavilyResults.results) {
        const content = result.raw_content || result.content;
        if (content) {
            const contentEntities = await analyzeText(content);
            entities = [...entities, ...contentEntities];
        }
    }

    // Deduplicate entities
    const entitiesMap: Record<string, RecognizedEntity> = {};

    entities.forEach(entity => {
        const key = `${entity.text.toLowerCase()}_${entity.label}`;

        if (!entitiesMap[key]) {
            entitiesMap[key] = {
                text: entity.text,
                label: entity.label,
                sentences: entity.sentences
            };
        } else {
            // Add any new sentences
            entity.sentences.forEach(sentence => {
                if (!entitiesMap[key].sentences.includes(sentence)) {
                    entitiesMap[key].sentences.push(sentence);
                }
            });
        }
    });

    return Object.values(entitiesMap);
};

/**
 * Synthesize a final answer from all step results
 */
const synthesizeAnswer = async (
    originalQuery: string,
    stepResults: StepExecutionResult[]
): Promise<string> => {
    // For now, just combine the answers with a simple template
    const stepAnswers = stepResults.map(step => step.answer).filter(Boolean);

    if (stepAnswers.length === 0) {
        return "No results found for your query.";
    }

    // If only one answer, return it
    if (stepAnswers.length === 1) {
        return stepAnswers[0];
    }

    // Otherwise, combine them with a template
    return `Here's what I found about "${originalQuery}":\n\n${stepAnswers.join('\n\n')}`;
};