// src/services/enhancedPlanExecution.ts
import { RecognizedEntity, SearchIntent, SearchState, StepExecutionResult, TavilySearchResult } from '../types/search';
import { analyzeText } from './spacyService';
import { performSearch } from './tavily';
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

/**
 * Interface for step result with entity analysis
 */


// Initialize the language model for synthesis
const synthesisModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini', // or your preferred model
    temperature: 0
});

// Create a prompt template for synthesizing answers from multiple steps
const synthesisPrompt = PromptTemplate.fromTemplate(`
You are tasked with synthesizing search results from multiple steps to provide a comprehensive answer.

Original Query: {originalQuery}
Search Intent: {intent}

Previous Step Results:
{stepResults}

Your task is to create a well-structured, comprehensive answer that addresses the original query
by synthesizing information from all the previous steps. The answer should be:
1. Comprehensive but concise
2. Well-organized with appropriate headings
3. Formatted in Markdown for readability
4. Focused on answering the original query

Synthesized Answer:
`);

// Create the synthesis chain
const synthesizeAnswerChain = RunnableSequence.from([
    synthesisPrompt,
    synthesisModel,
    new StringOutputParser()
]);

// Function to format step results for the synthesis prompt
const formatStepResultsForPrompt = (stepResults: StepExecutionResult[]): string => {
    return stepResults.map((result, index) => {
        return `${result.step}
Query: ${result.query}
Answer: ${result.answer}
Key Entities: ${result.entities.map(e => `${e.text} (${e.label})`).join(', ')}
`;
    }).join('\n\n');
};

/**
 * Enhanced search plan execution with entity recognition that handles parallel and sequential steps
 */
export const executePlanWithEntityRecognition = async (
    originalQuery: string,
    searchPlan: { step: string, stepType: string }[],
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

    // Group steps by type (parallel vs sequential)
    const executionGroups: Array<{ type: string, steps: Array<{ step: string, stepType: string, index: number }> }> = [];
    let currentGroup: { type: string, steps: Array<{ step: string, stepType: string, index: number }> } | null = null;

    // Group steps by execution type
    searchPlan.forEach((step, index) => {
        if (!currentGroup || currentGroup.type !== step.stepType) {
            currentGroup = { type: step.stepType, steps: [] };
            executionGroups.push(currentGroup);
        }
        currentGroup.steps.push({ ...step, index });
    });

    // Execute each group of steps
    for (let groupIndex = 0; groupIndex < executionGroups.length; groupIndex++) {
        const group = executionGroups[groupIndex];

        // Notify about the current execution group
        progressCallback('executing_group', {
            groupIndex,
            totalGroups: executionGroups.length,
            groupType: group.type,
            steps: group.steps.map(s => s.step)
        });

        if (group.type === 'parallel') {
            // Execute all steps in this parallel group concurrently
            const parallelPromises = group.steps.map(async (stepInfo) => {
                const { step, stepType, index } = stepInfo;

                // Notify start of step execution
                progressCallback('executing_plan_step', {
                    currentStep: index + 1,
                    totalSteps: searchPlan.length,
                    stepDescription: { step, stepType }
                });

                // Generate a query for this specific step
                const stepQuery = await generateStepQuery(originalQuery, { step, stepType }, intent);

                // Notify step query generated
                progressCallback('step_query_generated', {
                    currentStep: index + 1,
                    totalSteps: searchPlan.length,
                    stepDescription: { step, stepType },
                    stepQuery
                });

                // Perform search for this step
                const tavilyResults = await performSearch(stepQuery);

                // Analyze the step results for entities
                const stepEntities = await analyzeStepResults(tavilyResults, stepQuery);

                // Return this step's results
                return {
                    step,
                    stepIndex: index,
                    query: stepQuery,
                    results: tavilyResults.results,
                    answer: tavilyResults.answer,
                    entities: stepEntities
                };
            });

            // Wait for all parallel steps to complete
            const parallelResults = await Promise.all(parallelPromises);

            // Add all results to the combined collection
            for (const result of parallelResults) {
                stepResults.push(result);
                combinedResults = [...combinedResults, ...result.results];

                // Merge entities, avoiding duplicates
                result.entities.forEach(entity => {
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

                // Stream each step's results
                progressCallback('step_completed', {
                    currentStep: result.stepIndex + 1,
                    totalSteps: searchPlan.length,
                    stepResult: result
                });
            }
        } else if (group.type === 'sequential') {
            // For sequential steps, use previous results to inform the query
            for (const stepInfo of group.steps) {
                const { step, stepType, index } = stepInfo;

                // Notify start of sequential step execution
                progressCallback('executing_sequential_step', {
                    currentStep: index + 1,
                    totalSteps: searchPlan.length,
                    stepDescription: { step, stepType },
                    previousStepsCount: stepResults.length
                });

                // If this is a synthesis step and we have previous results, use LangChain to synthesize
                if (stepResults.length > 0) {
                    progressCallback('synthesizing_step', {
                        currentStep: index + 1,
                        totalSteps: searchPlan.length,
                        stepDescription: { step, stepType },
                        previousStepsCount: stepResults.length
                    });

                    // Format previous step results for the synthesis prompt
                    const formattedStepResults = formatStepResultsForPrompt(stepResults);

                    // Use the synthesis chain to create a contextual answer
                    const synthesizedAnswer = await synthesizeAnswerChain.invoke({
                        originalQuery,
                        intent,
                        stepResults: formattedStepResults
                    });

                    // Use the synthesized answer as this step's answer
                    const stepResult: StepExecutionResult = {
                        step,
                        stepIndex: index,
                        query: `Synthesizing results for: ${originalQuery}`,
                        results: [], // No new search results for synthesis steps
                        answer: synthesizedAnswer,
                        entities: [] // We'll analyze the synthesized answer for entities
                    };

                    // Extract entities from the synthesized answer
                    stepResult.entities = await analyzeText(synthesizedAnswer);

                    // Add this step's results
                    stepResults.push(stepResult);

                    // Update the final answer with the synthesized one
                    finalAnswer = synthesizedAnswer;

                    // Add entities from the synthesized answer
                    stepResult.entities.forEach(entity => {
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

                    // Notify about completion of synthesis step
                    progressCallback('synthesis_step_completed', {
                        currentStep: index + 1,
                        totalSteps: searchPlan.length,
                        stepResult
                    });
                } else {
                    // If there are no previous results to synthesize, treat it like a normal search step
                    const stepQuery = await generateStepQuery(originalQuery, { step, stepType }, intent);

                    progressCallback('step_query_generated', {
                        currentStep: index + 1,
                        totalSteps: searchPlan.length,
                        stepDescription: { step, stepType },
                        stepQuery
                    });

                    const tavilyResults = await performSearch(stepQuery);
                    const stepEntities = await analyzeStepResults(tavilyResults, stepQuery);

                    const stepResult: StepExecutionResult = {
                        step,
                        stepIndex: index,
                        query: stepQuery,
                        results: tavilyResults.results,
                        answer: tavilyResults.answer,
                        entities: stepEntities
                    };

                    stepResults.push(stepResult);
                    combinedResults = [...combinedResults, ...tavilyResults.results];

                    // Merge entities
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

                    finalAnswer = tavilyResults.answer;

                    progressCallback('step_completed', {
                        currentStep: index + 1,
                        totalSteps: searchPlan.length,
                        stepResult
                    });
                }
            }
        }
    }

    // If we never got to a sequential step that synthesizes, generate a final answer
    if (finalAnswer.length < 100 && stepResults.length > 1) {
        progressCallback('final_synthesis', {
            stepsCount: stepResults.length
        });

        // Format previous step results for the synthesis prompt
        const formattedStepResults = formatStepResultsForPrompt(stepResults);

        // Use the synthesis chain to create a final answer
        finalAnswer = await synthesizeAnswerChain.invoke({
            originalQuery,
            intent,
            stepResults: formattedStepResults
        });
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
    step: { step: string, stepType: string },
    intent: SearchIntent
): Promise<string> => {
    // Extract the main focus from the step description
    const focusMatch = step.step.match(/Search for (.*?)(?:to |$)/i);
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