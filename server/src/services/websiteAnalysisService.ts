// src/services/websiteAnalysisService.ts
import { RecognizedEntity, TavilySearchResult, WebsiteAnalysis } from '../types/search';
import { analyzeText } from './spacyService';



/**
 * Analyze a single website from search results
 */
export const analyzeWebsite = async (
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

        // Extract entities from the content using spaCy
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

/**
 * Analyze all websites from search results with progress updates
 */
export const analyzeSearchResults = async (
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