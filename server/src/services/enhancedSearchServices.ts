// src/services/enhancedSearchServices.ts
import axios from 'axios';
import { analyzeText } from './spacyService';
import { RecognizedEntity, SearchIntent, TavilySearchResult, WebsiteAnalysis } from '../types/search';

// Interface for the website analysis result


// Simulated function to fetch the content of a webpage
const fetchWebpageContent = async (url: string): Promise<string> => {
    try {
        // In a real implementation, you would use a proxy or service to fetch the webpage content
        // For now, we'll simulate it with a delayed response

        // For test purposes, generate some fake content based on the URL
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        const domain = new URL(url).hostname;
        return `This is simulated content for ${url}. This webpage from ${domain} contains information relevant to your search. 
    The article discusses important topics and provides valuable insights. 
    John Smith, a researcher at Stanford University, published a study on this topic in March 2023.
    The research was conducted in New York and London, with funding from the National Science Foundation.
    According to the analysis, companies like Apple and Microsoft have invested $50 million in this area.
    The technology can process up to 5 GB of data per second, which is significantly faster than previous methods.`;
    } catch (error) {
        console.error('Error fetching webpage content:', error);
        return 'Error fetching content';
    }
};

// Function to analyze a single website
export const analyzeWebsite = async (
    result: TavilySearchResult,
    searchQuery: string
): Promise<WebsiteAnalysis> => {
    try {
        // 1. Get the full content of the webpage
        const content = await fetchWebpageContent(result.url);

        // 2. Extract entities using spaCy
        const entities = await analyzeText(content);

        // 3. Return the analysis
        return {
            url: result.url,
            title: result.title,
            searchQuery,
            content: content,
            entities,
            isExpanded: false
        };
    } catch (error) {
        console.error('Error analyzing website:', error);
        return {
            url: result.url,
            title: result.title,
            searchQuery,
            content: 'Error analyzing content',
            entities: [],
            isExpanded: false
        };
    }
};

// Function to perform a search and analyze each result
export const performEnhancedSearch = async (
    query: string,
    progressCallback: (stage: string, data: any) => void
): Promise<{
    results: TavilySearchResult[];
    websiteAnalyses: WebsiteAnalysis[];
    answer: string;
}> => {
    try {
        // 1. Perform the initial search using Tavily (or simulated for testing)
        progressCallback('searching', { message: 'Performing initial search...' });

        // Simulated Tavily search results
        const tavilyResults = {
            query,
            results: [
                {
                    title: `${query} - Wikipedia`,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
                    content: `Information about ${query} from Wikipedia...`,
                    score: 0.95,
                    raw_content: null
                },
                {
                    title: `Understanding ${query} - Educational Resource`,
                    url: `https://www.example-education.com/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
                    content: `A comprehensive explanation of ${query}, including key principles...`,
                    score: 0.88,
                    raw_content: null
                },
                {
                    title: `Latest Research on ${query} - Science Daily`,
                    url: `https://www.sciencedaily.com/search/?keyword=${encodeURIComponent(query)}`,
                    content: `Recent scientific findings related to ${query}...`,
                    score: 0.82,
                    raw_content: null
                }
            ],
            answer: `Here is a comprehensive answer about ${query} based on the search results...`
        };

        progressCallback('initial_results', {
            results: tavilyResults.results,
            answer: tavilyResults.answer
        });

        // 2. Analyze each search result one by one, streaming the results back
        const websiteAnalyses: WebsiteAnalysis[] = [];

        for (let i = 0; i < tavilyResults.results.length; i++) {
            const result = tavilyResults.results[i];

            progressCallback('analyzing_website', {
                message: `Analyzing result ${i + 1} of ${tavilyResults.results.length}`,
                currentUrl: result.url,
                progress: (i / tavilyResults.results.length) * 100
            });

            // Analyze this specific website
            const analysis = await analyzeWebsite(result, query);
            websiteAnalyses.push(analysis);

            // Send progress update with the new analysis
            progressCallback('website_analyzed', {
                websiteAnalyses,
                currentAnalysis: analysis
            });
        }

        // 3. Return the final compiled results
        progressCallback('compiling_results', { message: 'Compiling all analysis results...' });

        return {
            results: tavilyResults.results,
            websiteAnalyses,
            answer: tavilyResults.answer
        };
    } catch (error) {
        console.error('Error in enhanced search:', error);
        throw error;
    }
};