// Server types
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

// Define StepData on the server side as well for consistency
export interface StepData {
    step: string;
    stepType: 'sequential' | 'parallel';
}

export interface StepExecutionResult {
    step: string;
    stepIndex: number;
    query: string;
    results: TavilySearchResult[];
    answer: string;
    entities: RecognizedEntity[];
}

export interface SearchState {
    query: string;
    intent: string;
    querySummary: string;
    results: TavilySearchResult[];
    stepResults: StepExecutionResult[]
    answer?: string;
    searchPlan?: StepData[]; // Use the StepData interface
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

// You may need to add the other interfaces to the server side if they're used there

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
    isExpanded: boolean;
}