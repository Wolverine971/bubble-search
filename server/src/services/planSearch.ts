// src/routes/enhancedSearchRoutes.ts
import express, { Request, Response } from 'express';

import { performSearch } from '../services/tavily';
import { SearchIntent, SearchState, TavilySearchResult, WebsiteAnalysis } from '../types/search';
import { executeEnhancedSearchWithProgress } from './searchGraph';
import { analyzeText, generateTestEntities } from './spacyService';

const router = express.Router();

interface EnhancedSearchRequestBody {
    query: string;
    test?: boolean;
}



// Validate the search request
const validateSearchRequest = (req: Request, res: Response, next: express.NextFunction) => {
    const { query } = req.body as Partial<EnhancedSearchRequestBody>;

    if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({
            error: 'Search query is required'
        });
    }

    next();
};

// Analyze a single website from search results
const analyzeWebsite = async (
    result: TavilySearchResult,
    searchQuery: string
): Promise<WebsiteAnalysis> => {
    try {
        // Get the content to analyze
        let content = result.content;

        // Use raw_content if available (this would be more complete text)
        if (result.raw_content) {
            content = result.raw_content;
        }

        // Extract entities from the content
        const entities = await analyzeText(content);

        return {
            url: result.url,
            title: result.title,
            searchQuery,
            content,
            entities
        };
    } catch (error) {
        console.error(`Error analyzing website ${result.url}:`, error);

        // Return a basic analysis even on error
        return {
            url: result.url,
            title: result.title,
            searchQuery,
            content: result.content,
            entities: []
        };
    }
};

// Analyze all websites from search results
const analyzeSearchResults = async (
    results: TavilySearchResult[],
    searchQuery: string,
    progressCallback?: (stage: string, data: any) => void
): Promise<WebsiteAnalysis[]> => {
    const analysisResults: WebsiteAnalysis[] = [];

    for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (progressCallback) {
            // Send progress update to client
            progressCallback('analyzing_website', {
                message: `Analyzing result ${i + 1} of ${results.length}`,
                currentUrl: result.url,
                progress: Math.round((i / results.length) * 100)
            });
        }

        // Analyze this website
        const analysis = await analyzeWebsite(result, searchQuery);
        analysisResults.push(analysis);

        if (progressCallback) {
            // Send this analysis to client
            progressCallback('website_analyzed', {
                websiteAnalyses: analysisResults,
                currentAnalysis: analysis
            });
        }
    }

    return analysisResults;
};

// Helper to generate test intent
const getTestIntent = (query: string): SearchIntent => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('how to') || lowerQuery.includes('what is')) {
        return "Informational Intent";
    } else if (lowerQuery.includes('near me')) {
        return "Local Intent";
    } else if (lowerQuery.includes('best')) {
        return "Commercial Intent";
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
        return "Comparative Intent";
    } else {
        return "Informational Intent";
    }
};

// Helper to generate test summary
const getTestSummary = (query: string, intent: SearchIntent): string => {
    switch (intent) {
        case "Informational Intent":
            return `I'll find information about ${query.replace(/what is|how to/i, '').trim()}.`;
        case "Local Intent":
            return `I'll locate ${query.replace(/near me/i, '').trim()} in your area.`;
        case "Commercial Intent":
            return `I'll find the best ${query.replace(/best/i, '').trim()} options for you.`;
        case "Comparative Intent":
            return `I'll compare ${query.replace(/compare|vs/i, '').trim()} for you.`;
        default:
            return `I'll search for "${query}" for you.`;
    }
};

// Generate test search results
const getTestResults = (query: string): { results: TavilySearchResult[], answer: string } => {
    const results: TavilySearchResult[] = [
        {
            title: `${query} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
            content: `${query} is a term that refers to the study or implementation of specific concepts. It has origins dating back to various historical periods and has evolved significantly over time. John Smith, a researcher at Stanford University, published a major study on ${query} in 2021, which revolutionized our understanding of the field. The research was conducted in New York and London, with funding from the National Science Foundation. According to the analysis, companies like Apple and Microsoft have invested $50 million in this area.`,
            score: 0.92,
            raw_content: null
        },
        {
            title: `Understanding ${query} - Educational Resource`,
            url: `https://www.example-education.com/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
            content: `A comprehensive explanation of ${query}, including key principles, applications, and recent developments in the field. This guide covers essential concepts that students and professionals need to know. Dr. Jane Wilson from Harvard University explains that the concept emerged in the early 1900s and has since been adopted by many industries. The technology can process up to 5 GB of data per second, which is significantly faster than previous methods.`,
            score: 0.87,
            raw_content: null
        },
        {
            title: `Latest Research on ${query} - Science Daily`,
            url: `https://www.sciencedaily.com/search/?keyword=${encodeURIComponent(query)}`,
            content: `Recent scientific findings related to ${query} have shown promising results in various applications. Researchers at MIT and Google have collaborated on a groundbreaking project that demonstrates new capabilities. The study, published in Nature on March 15, 2023, included participants from 12 countries and analyzed over 10,000 data points. The results showed a 35% improvement in efficiency compared to traditional methods.`,
            score: 0.82,
            raw_content: null
        }
    ];

    const answer = `${query} is a concept that has gained significant attention in recent years. It involves several key principles and applications across multiple industries. According to studies by researchers at Stanford University and MIT, the technology has evolved substantially since its inception. Major companies like Apple and Google have invested in developing this field further. The latest research published in 2023 shows promising results with a 35% improvement in efficiency compared to traditional methods.`;

    return { results, answer };
};

// Enhanced search endpoint with entity recognition and streaming


export const planSearch = async (req: Request, res: Response) => {

    const { query, test = false } = req.body as EnhancedSearchRequestBody;

    // Set headers for server-sent events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        if (test) {
            // Test mode - simulate the search process with test data

            // Step 1: Intent classification
            const intent = getTestIntent(query);
            res.write(`data: ${JSON.stringify({
                stage: 'classifying',
                data: { query, intent }
            })}\n\n`);

            // Add a small delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Query summary
            const querySummary = getTestSummary(query, intent);
            res.write(`data: ${JSON.stringify({
                stage: 'summarizing',
                data: { query, intent, querySummary }
            })}\n\n`);

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 3: Get search results
            const { results, answer } = getTestResults(query);
            res.write(`data: ${JSON.stringify({
                stage: 'searching',
                data: {
                    query,
                    intent,
                    querySummary,
                    results,
                    answer
                }
            })}\n\n`);

            // Step 4: Analyze answer entities
            const answerEntities = await analyzeText(answer);
            res.write(`data: ${JSON.stringify({
                stage: 'answer_analyzed',
                data: {
                    answerEntities
                }
            })}\n\n`);

            // Step 5: Analyze each website
            const websiteAnalyses: WebsiteAnalysis[] = [];

            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                // Send progress notification
                res.write(`data: ${JSON.stringify({
                    stage: 'analyzing_website',
                    data: {
                        message: `Analyzing result ${i + 1} of ${results.length}`,
                        currentUrl: result.url,
                        progress: (i / results.length) * 100
                    }
                })}\n\n`);

                await new Promise(resolve => setTimeout(resolve, 1500));

                // Generate analysis for this website
                const analysis = await analyzeWebsite(result, query);
                websiteAnalyses.push(analysis);

                // Send the new analysis
                res.write(`data: ${JSON.stringify({
                    stage: 'website_analyzed',
                    data: {
                        websiteAnalyses,
                        currentAnalysis: analysis
                    }
                })}\n\n`);
            }

            // Step 6: Complete
            res.write(`data: ${JSON.stringify({
                stage: 'analysis_complete',
                data: {
                    query,
                    intent,
                    querySummary,
                    results,
                    answer,
                    websiteAnalyses,
                    answerEntities
                }
            })}\n\n`);

            res.end();
        } else {
            // Real mode - use LangGraph and Tavily

            // First, run the regular search process through LangGraph
            await executeEnhancedSearchWithProgress(query.trim(), async (stage, data) => {
                // Send progress updates to the client
                res.write(`data: ${JSON.stringify({
                    stage,
                    data
                })}\n\n`);

                // When we have search results, start analyzing entities
                if (stage === 'searching' && data.results && data.results.length > 0) {
                    // IMPORTANT: Analyze the answer first to extract key entities
                    if (data.answer) {
                        const answerEntities = await analyzeText(data.answer);

                        res.write(`data: ${JSON.stringify({
                            stage: 'answer_analyzed',
                            data: {
                                answerEntities
                            }
                        })}\n\n`);
                    }

                    // Then analyze each source website
                    const websiteAnalyses = await analyzeSearchResults(
                        data.results,
                        query,
                        (analysisStage, analysisData) => {
                            // Stream the analysis progress
                            res.write(`data: ${JSON.stringify({
                                stage: analysisStage,
                                data: analysisData
                            })}\n\n`);
                        }
                    );

                    // Send final results with all analyses
                    res.write(`data: ${JSON.stringify({
                        stage: 'analysis_complete',
                        data: {
                            ...data,
                            websiteAnalyses
                        }
                    })}\n\n`);
                }

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
        console.error('Error in enhanced search endpoint:', error);
        res.write(`data: ${JSON.stringify({
            stage: 'error',
            error: 'An error occurred while processing your search'
        })}\n\n`);
        res.end();
    }
}






