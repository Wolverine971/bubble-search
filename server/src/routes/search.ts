// src/routes/search.ts
import express, { Request, Response } from 'express';

import { executeApprovedSearchPlan, executeEnhancedSearchWithProgress } from '../services/searchGraph';
import { SearchIntent, SearchState } from '../types/search';

const router = express.Router();

interface SearchRequestBody {
    query: string;
    intent?: SearchIntent;
    test?: boolean;
}

interface ContinueSearchRequestBody {
    query: string;
    plan: string[];
    approved: boolean;
    edits?: string[];
}

// Test data - modified to include search plans
const testIntents: Record<string, SearchIntent> = {
    default: "Informational Intent",
    "how to": "Informational Intent",
    "what is": "Informational Intent",
    "who is": "Informational Intent",
    "where is": "Local Intent",
    "best": "Commercial Intent",
    "compare": "Comparative Intent",
    "vs": "Comparative Intent",
    "buy": "Transactional Intent",
    "purchase": "Transactional Intent",
    "near me": "Local Intent",
    "weather": "Specific Question Intent",
    "news": "News Intent",
    "login": "Navigational Intent",
    "sign in": "Navigational Intent",
    "download": "Transactional Intent",
    "images": "Visual Intent",
    "pictures": "Visual Intent",
    "video": "Video Intent",
    "videos": "Video Intent",
    "games": "Entertainment Intent"
};

// Helper to determine test intent based on query
const getTestIntent = (query: string): SearchIntent => {
    const lowerQuery = query.toLowerCase();

    for (const [keyword, intent] of Object.entries(testIntents)) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
            return intent;
        }
    }

    return "Informational Intent";
};

// Helper to generate test summary based on intent and query
const getTestSummary = (query: string, intent: SearchIntent): string => {
    switch (intent) {
        case "Informational Intent":
            return `I'll find you information about ${query.replace(/what is|how to|who is/i, '').trim()}.`;
        case "Local Intent":
            return `I'll locate ${query.replace(/where is|near me/i, '').trim()} in your area.`;
        case "Commercial Intent":
            return `I'll find the best ${query.replace(/best/i, '').trim()} options for you to consider.`;
        case "Comparative Intent":
            return `I'll compare ${query.replace(/compare|vs/i, '').trim()} to help you make a decision.`;
        case "Transactional Intent":
            return `I'll help you ${query.replace(/buy|purchase|download/i, '').trim()}.`;
        case "News Intent":
            return `I'll find the latest news about ${query.replace(/news/i, '').trim()}.`;
        case "Navigational Intent":
            return `I'll take you to the ${query.replace(/login|sign in/i, '').trim()} page.`;
        case "Visual Intent":
            return `I'll show you images of ${query.replace(/images|pictures/i, '').trim()}.`;
        case "Video Intent":
            return `I'll find videos about ${query.replace(/video|videos/i, '').trim()}.`;
        case "Entertainment Intent":
            return `I'll find fun ${query.replace(/games/i, '').trim()} content for you.`;
        case "Specific Question Intent":
            return `I'll get you a direct answer about ${query}.`;
        default:
            return `I'll search for information about "${query}".`;
    }
};

// New helper to generate test search plans
const getTestSearchPlan = (query: string, intent: SearchIntent): string[] => {
    const lowerQuery = query.toLowerCase();

    // Determine complexity based on query length and certain keywords
    const isComplex =
        lowerQuery.length > 50 ||
        lowerQuery.includes("compare") ||
        lowerQuery.includes("vs") ||
        lowerQuery.includes("between") ||
        lowerQuery.includes("and") ||
        (lowerQuery.match(/\band\b/g) || []).length > 1;

    // Generate more steps for complex queries
    if (isComplex) {
        if (intent === "Comparative Intent") {
            const parts = lowerQuery.split(/compare|vs|between|and/i).filter(p => p.trim().length > 0);
            if (parts.length >= 2) {
                return [
                    `Step 1: Search for information about ${parts[0].trim()}`,
                    `Step 2: Search for information about ${parts[1].trim()}`,
                    `Step 3: Find comparison data between ${parts[0].trim()} and ${parts[1].trim()}`,
                    `Step 4: Analyze the pros and cons of each option`
                ];
            }
        }

        if (intent === "Commercial Intent") {
            return [
                `Step 1: Search for top-rated ${lowerQuery.replace(/best/i, '').trim()} options`,
                `Step 2: Find pricing information for each option`,
                `Step 3: Look for recent reviews and customer feedback`,
                `Step 4: Compare features across different brands/models`
            ];
        }

        if ((lowerQuery.match(/\band\b/g) || []).length > 1) {
            // For queries with multiple "and" conjunctions
            return [
                "Step 1: Break down the query into separate topics",
                "Step 2: Research each topic individually",
                "Step 3: Find connections between the topics",
                "Step 4: Synthesize the information into a comprehensive answer"
            ];
        }

        // Default complex plan
        return [
            "Step 1: Gather general information about the topic",
            "Step 2: Find specific details related to key aspects",
            "Step 3: Look for recent developments or updates"
        ];
    }

    // For simpler queries, return a 1-2 step plan
    if (intent === "Specific Question Intent") {
        return ["Step 1: Search for a direct answer to this specific question"];
    }

    if (intent === "Informational Intent") {
        return [
            "Step 1: Find a comprehensive overview of the topic",
            "Step 2: Gather specific details if needed"
        ];
    }

    // Default simple plan
    return ["Step 1: Search for relevant information about the query"];
};

// Validate the search request
const validateSearchRequest = (req: Request, res: Response, next: express.NextFunction) => {
    const { query } = req.body as Partial<SearchRequestBody>;

    if (!query || typeof query !== 'string' || query.trim() === '') {
        res.status(400).json({
            error: 'Search query is required'
        });
    }

    next();
};

// Main search endpoint with streaming
router.post('/', validateSearchRequest, async (req: Request, res: Response) => {
    const { query, test } = req.body as SearchRequestBody;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        if (test) {
            // Step 1: Intent classification
            const intent = getTestIntent(query);
            res.write(`data: ${JSON.stringify({
                stage: 'classifying',
                data: { query, intent }
            })}\n\n`);

            // Add a small delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Query summary
            const querySummary = getTestSummary(query, intent);
            res.write(`data: ${JSON.stringify({
                stage: 'summarizing',
                data: { query, intent, querySummary }
            })}\n\n`);

            // Add a small delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step a3: Generate search plan
            const searchPlan = getTestSearchPlan(query, intent);
            const needsApproval = searchPlan.length > 2;

            res.write(`data: ${JSON.stringify({
                stage: 'planning',
                data: {
                    query,
                    intent,
                    querySummary,
                    searchPlan,
                    needsApproval
                }
            })}\n\n`);

            // If plan needs approval, stop streaming here and wait for user input
            if (needsApproval) {
                res.end();
                return;
            }

            // Add a small delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 4: Search results (only if no approval needed)
            // Re-use the existing test results functionality
            const { results, answer } = getTestResults(query, intent);

            res.write(`data: ${JSON.stringify({
                stage: 'searching',
                data: {
                    query,
                    intent,
                    querySummary,
                    searchPlan,
                    results,
                    answer
                }
            })}\n\n`);

            // Step 5: Complete
            res.write(`data: ${JSON.stringify({
                stage: 'complete',
                data: {
                    query,
                    intent,
                    querySummary,
                    searchPlan,
                    results,
                    answer
                }
            })}\n\n`);

            res.end();
        } else {
            // Use our enhanced search function with progress tracking
            await executeEnhancedSearchWithProgress(query.trim(), (stage, data) => {
                // Send progress updates to the client
                res.write(`data: ${JSON.stringify({
                    stage,
                    data
                })}\n\n`);

                // If plan needs approval, end the stream
                if (stage === 'planning' && data.needsApproval) {
                    res.end();
                }
            });

            // Only end the response if it hasn't been ended due to needing approval
            if (!res.writableEnded) {
                res.end();
            }
        }
    } catch (error) {
        console.error('Error in search endpoint:', error);
        res.write(`data: ${JSON.stringify({
            stage: 'error',
            error: 'An error occurred while processing your search'
        })}\n\n`);
        res.end();
    }
});

// New endpoint to continue search after plan approval
router.post('/continue', async (req: Request, res: Response) => {
    const { query, plan, approved, edits } = req.body as ContinueSearchRequestBody;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        if (!approved) {
            // If not approved, send back to planning stage with edits
            // (In a real implementation, you would regenerate the plan with the edits)
            res.write(`data: ${JSON.stringify({
                stage: 'planning',
                data: {
                    query,
                    searchPlan: edits || plan,
                    needsApproval: true
                }
            })}\n\n`);
            res.end();
            return;
        }

        // If we're in test mode, simulate executing the plan with entity analysis
        if (req.query.test === 'true') {
            // Step 1: Update that plan is approved
            res.write(`data: ${JSON.stringify({
                stage: 'plan_approved',
                data: {
                    query,
                    searchPlan: plan,
                    needsApproval: false
                }
            })}\n\n`);

            // Generate test intent for simulation
            const intent = getTestIntent(query);
            const querySummary = getTestSummary(query, intent);

            // Step 2: Simulate executing each step with entity analysis
            const stepResults = [];

            for (let i = 0; i < plan.length; i++) {
                // Notify of step execution
                res.write(`data: ${JSON.stringify({
                    stage: 'executing_plan_step',
                    data: {
                        currentStep: i + 1,
                        totalSteps: plan.length,
                        stepDescription: plan[i]
                    }
                })}\n\n`);

                await new Promise(resolve => setTimeout(resolve, 500));

                // Generate step query
                const stepQuery = `${query} ${plan[i].replace(/Step \d+: Search for /, '').replace(/Find /, '')}`;

                res.write(`data: ${JSON.stringify({
                    stage: 'step_query_generated',
                    data: {
                        currentStep: i + 1,
                        totalSteps: plan.length,
                        stepDescription: plan[i],
                        stepQuery
                    }
                })}\n\n`);

                await new Promise(resolve => setTimeout(resolve, 500));

                // Simulate search results for this step
                const { results, answer } = getTestResults(stepQuery, intent);

                // Simulate entity recognition
                const entities = await simulateEntityRecognition(results, answer);

                // Add to step results
                const stepResult = {
                    step: plan[i],
                    stepIndex: i,
                    query: stepQuery,
                    results,
                    answer,
                    entities
                };

                stepResults.push(stepResult);

                // Send step completion with entities
                res.write(`data: ${JSON.stringify({
                    stage: 'step_completed',
                    data: {
                        currentStep: i + 1,
                        totalSteps: plan.length,
                        stepResult
                    }
                })}\n\n`);

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Combine all entities from all steps
            const allEntities = [];
            const entitiesMap = {};

            for (const stepResult of stepResults) {
                for (const entity of stepResult.entities) {
                    const key = `${entity.text.toLowerCase()}_${entity.label}`;

                    if (!entitiesMap[key]) {
                        entitiesMap[key] = {
                            text: entity.text,
                            label: entity.label,
                            sentences: [...entity.sentences]
                        };
                    } else {
                        // Add unique sentences
                        for (const sentence of entity.sentences) {
                            if (!entitiesMap[key].sentences.includes(sentence)) {
                                entitiesMap[key].sentences.push(sentence);
                            }
                        }
                    }
                }
            }

            const combinedEntities = Object.values(entitiesMap);

            // Create website analyses from step results
            const websiteAnalyses = stepResults.flatMap(step =>
                step.results.map(result => ({
                    url: result.url,
                    title: result.title,
                    searchQuery: step.query,
                    content: result.content,
                    entities: step.entities.filter(entity =>
                        result.content.toLowerCase().includes(entity.text.toLowerCase())
                    ),
                    isExpanded: false,
                    stepIndex: step.stepIndex
                }))
            );

            // Final combined results
            const combinedResults = stepResults.flatMap(step => step.results).slice(0, 5);
            const finalAnswer = stepResults[stepResults.length - 1].answer;

            // Send the final analysis-complete event
            res.write(`data: ${JSON.stringify({
                stage: 'analysis_complete',
                data: {
                    query,
                    intent,
                    querySummary,
                    searchPlan: plan,
                    results: combinedResults,
                    answer: finalAnswer,
                    stepResults,
                    answerEntities: combinedEntities,
                    websiteAnalyses
                }
            })}\n\n`);

            res.end();
        } else {
            // Execute the approved plan with entity recognition
            await executeApprovedSearchPlan(query, plan, (stage, data) => {
                // Send progress updates to the client
                res.write(`data: ${JSON.stringify({
                    stage,
                    data
                })}\n\n`);
            });

            res.end();
        }
    } catch (error) {
        console.error('Error in continue search endpoint:', error);
        res.write(`data: ${JSON.stringify({
            stage: 'error',
            error: 'An error occurred while processing your search'
        })}\n\n`);
        res.end();
    }
});

// Helper function to generate test search results (reused from your original code)
const getTestResults = (query: string, intent: SearchIntent) => {
    const lowerQuery = query.toLowerCase();
    let answer = "";
    let results = [];

    // Generate a relevant answer based on intent and query
    switch (intent) {
        case "Informational Intent":
            answer = `${query} refers to a concept or topic that people often search for information about. In general terms, it involves key aspects that experts in the field consider important. Many resources provide detailed explanations and examples that can help deepen your understanding of this subject.`;
            results = [
                {
                    title: `Complete Guide to ${query} - Wikipedia`,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
                    content: `${query} is a term that refers to the study or implementation of specific concepts. It has origins dating back to various historical periods and has evolved significantly over time...`,
                    score: 0.92,
                    raw_content: null
                },
                {
                    title: `Understanding ${query} - Educational Resource`,
                    url: `https://www.example-education.com/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
                    content: `A comprehensive explanation of ${query}, including key principles, applications, and recent developments in the field. This guide covers essential concepts...`,
                    score: 0.87,
                    raw_content: null
                }
            ];
            break;

        case "Commercial Intent":
            answer = `Based on current reviews and market analysis, the top options for ${query.replace(/best/i, '').trim()} include several highly-rated products across different price points. Most experts recommend considering factors like quality, features, and price when making your selection.`;
            results = [
                {
                    title: `Top 10 ${query.replace(/best/i, '').trim()} of 2025 - Expert Reviews`,
                    url: `https://www.reviewsite.com/best-${encodeURIComponent(query.replace(/best/i, '').trim().replace(/\s+/g, '-'))}`,
                    content: `Our comprehensive review of the top ${query.replace(/best/i, '').trim()} options available today. We tested dozens of products to find the best performers across all price ranges...`,
                    score: 0.94,
                    raw_content: null
                },
                {
                    title: `${query.replace(/best/i, '').trim()} Buying Guide - Consumer Reports`,
                    url: `https://www.consumerreports.org/buying-guides/${encodeURIComponent(query.replace(/best/i, '').trim().replace(/\s+/g, '-'))}`,
                    content: `Before purchasing a ${query.replace(/best/i, '').trim()}, consider these important factors. Our testing revealed significant differences in performance, reliability, and value...`,
                    score: 0.89,
                    raw_content: null
                }
            ];
            break;

        case "Local Intent":
            answer = `There are several highly-rated options for ${query.replace(/near me/i, '').trim()} in your area. Most locations are open regular business hours and offer standard services. It's recommended to call ahead to confirm availability or make reservations if needed.`;
            results = [
                {
                    title: `Top-rated ${query.replace(/near me/i, '').trim()} Near You - Google Maps`,
                    url: `https://www.google.com/maps/search/${encodeURIComponent(query.replace(/near me/i, '').trim())}`,
                    content: `Find the best ${query.replace(/near me/i, '').trim()} near your location. Includes reviews, hours, directions, and additional information to help you choose...`,
                    score: 0.95,
                    raw_content: null
                },
                {
                    title: `Local Guide to ${query.replace(/near me/i, '').trim()} - Yelp`,
                    url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(query.replace(/near me/i, '').trim())}`,
                    content: `Discover the highest-rated local ${query.replace(/near me/i, '').trim()} with verified reviews from other customers. Filter by price, rating, hours, and more...`,
                    score: 0.91,
                    raw_content: null
                }
            ];
            break;

        case "News Intent":
            answer = `Recent news about ${query.replace(/news/i, '').trim()} includes several significant developments. Major news outlets have reported on events related to this topic in the past week, with updates continuing to emerge as the situation evolves.`;
            results = [
                {
                    title: `Latest Updates on ${query.replace(/news/i, '').trim()} - CNN`,
                    url: `https://www.cnn.com/search?q=${encodeURIComponent(query.replace(/news/i, '').trim())}`,
                    content: `Breaking news and analysis on recent developments related to ${query.replace(/news/i, '').trim()}. Our reporters provide in-depth coverage of this evolving story...`,
                    score: 0.96,
                    raw_content: null
                },
                {
                    title: `${query.replace(/news/i, '').trim()} Situation: What We Know - BBC`,
                    url: `https://www.bbc.com/news/search?q=${encodeURIComponent(query.replace(/news/i, '').trim())}`,
                    content: `A comprehensive look at the current state of ${query.replace(/news/i, '').trim()}, including background information, recent developments, and expert analysis on what might happen next...`,
                    score: 0.93,
                    raw_content: null
                }
            ];
            break;
        default:
            answer = `Based on available information, ${query} is a topic that has multiple aspects worth exploring. There are several reputable sources that provide details on this subject, covering different perspectives and applications.`;
            results = [
                {
                    title: `${query} - Comprehensive Resource`,
                    url: `https://www.example.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,
                    content: `Everything you need to know about ${query}, including detailed explanations, examples, and practical applications in various contexts...`,
                    score: 0.88,
                    raw_content: null
                },
                {
                    title: `Exploring ${query} - In-depth Analysis`,
                    url: `https://www.example-research.org/analysis/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,
                    content: `A thorough examination of ${query} from multiple perspectives, highlighting key findings, challenges, and opportunities for further development or understanding...`,
                    score: 0.85,
                    raw_content: null
                }
            ];
            break;
    }

    return {
        results,
        answer
    };
};

// Add this helper function for simulating entity recognition in test mode
async function simulateEntityRecognition(results, answer) {
    // Try to use the real entity recognition if available
    try {
        const { analyzeText } = await import('../services/spacyService');
        const answerEntities = await analyzeText(answer);

        // Also analyze result content
        const contentEntities = [];
        for (const result of results) {
            if (result.content) {
                const entities = await analyzeText(result.content);
                contentEntities.push(...entities);
            }
        }

        // Combine and deduplicate
        const entitiesMap = {};
        [...answerEntities, ...contentEntities].forEach(entity => {
            const key = `${entity.text.toLowerCase()}_${entity.label}`;

            if (!entitiesMap[key]) {
                entitiesMap[key] = entity;
            } else {
                // Merge sentences
                entity.sentences.forEach(sentence => {
                    if (!entitiesMap[key].sentences.includes(sentence)) {
                        entitiesMap[key].sentences.push(sentence);
                    }
                });
            }
        });

        return Object.values(entitiesMap);
    } catch (error) {
        console.warn('Using fake entity extraction due to error:', error);

        // Generate fake entities based on the content
        const fakeEntities = [
            { text: "John Smith", label: "PERSON", sentences: ["John Smith is a researcher in this field."] },
            { text: "Microsoft", label: "ORG", sentences: ["Microsoft has been investing in this technology."] },
            { text: "New York", label: "LOC", sentences: ["Studies were conducted in New York."] },
            { text: "2022", label: "DATE", sentences: ["In 2022, significant progress was made."] },
            { text: "$100 million", label: "MONEY", sentences: ["The industry invested $100 million in research."] }
        ];

        // Make some entities specific to the answer
        const words = answer.split(/\s+/);
        for (let i = 0; i < words.length; i += 10) {
            if (words[i] && words[i][0] === words[i][0].toUpperCase()) {
                fakeEntities.push({
                    text: words[i],
                    label: ["PERSON", "ORG", "GPE", "PRODUCT"][Math.floor(Math.random() * 4)],
                    sentences: [answer.substring(0, 100) + "..."]
                });
            }
        }

        return fakeEntities;
    }
}

export default router;