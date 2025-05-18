// src/types/search.ts
export interface SearchQuery {
    query: string;
}

export type SearchIntent =
    | "Informational Intent"
    | "Navigational Intent"
    | "Commercial Intent"
    | "Transactional Intent"
    | "Local Intent"
    | "Comparative Intent"
    | "Pre-Informational Intent"
    | "Visual Intent"
    | "Video Intent"
    | "Local Service Intent"
    | "News Intent"
    | "Entertainment Intent"
    | "Specific Question Intent";

export interface SearchState {
    query: string;
    intent: string;
    querySummary: string;
    results: TavilySearchResult[];
    answer?: string;
    searchPlan?: string[];
    needsApproval?: boolean;
    currentStep?: number;
    totalSteps?: number;
    stepDescription?: string;
}

export interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content: string | null;
}

export interface TavilyResponse {
    query: string;
    answer: string;
    images: any[];
    results: TavilySearchResult[];
    response_time: string;
}