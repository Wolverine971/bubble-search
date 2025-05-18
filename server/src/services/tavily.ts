import axios from 'axios';
import dotenv from 'dotenv';

import { TavilyResponse } from '../types/search';

dotenv.config();

export interface TavilySearchOptions {
    query: string;
    topic?: string;
    search_depth?: 'basic' | 'advanced';
    chunks_per_source?: number;
    max_results?: number;
    time_range?: string | null;
    days?: number;
    include_answer?: boolean;
    include_raw_content?: boolean;
    include_images?: boolean;
    include_image_descriptions?: boolean;
    include_domains?: string[];
    exclude_domains?: string[];
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY as string;


const tavilyClient = axios.create({
    baseURL: 'https://api.tavily.com',
    headers: {
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

export const searchTavily = async (options: TavilySearchOptions): Promise<TavilyResponse> => {
    try {
        const response = await tavilyClient.post('/search', options);
        return response.data;
    } catch (error) {
        console.error('Error searching with Tavily:', error);
        throw error;
    }
};

// Default search with common parameters
export const performSearch = async (query: string): Promise<TavilyResponse> => {
    return searchTavily({
        query,
        search_depth: 'basic',
        chunks_per_source: 3,
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
        include_images: false
    });
};