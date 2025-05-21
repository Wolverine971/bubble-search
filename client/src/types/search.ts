// Client types
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

export interface StepData {
    step: string;
    stepType: 'sequential' | 'parallel';
}

export interface SearchState {
    query: string;
    intent: string;
    querySummary: string;
    results: TavilySearchResult[];
    answer?: string;
    searchPlan?: StepData[]; // Updated to match the StepData interface
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
    entities: Entity[];
    isExpanded?: boolean;
    stepIndex?: number;
}

// Interface for expanded search state
export interface EnhancedSearchState extends SearchState {
    websiteAnalyses?: WebsiteAnalysis[];
    currentAnalysis?: WebsiteAnalysis;
    answerEntities?: Entity[];
    analysisProgress?: {
        message: string;
        currentUrl: string;
        progress: number;
    };
    stepResults?: StepExecutionResult[];
    currentStep?: number;
    totalSteps?: number;
    stepDescription?: StepData;
    stepQuery?: string;
}

// Add this type for step execution results
export interface StepExecutionResult {
    step: string;
    stepIndex: number;
    query: string;
    results: TavilySearchResult[];
    answer: string;
    entities: RecognizedEntity[];
    stepType: 'sequential' | 'parallel'; // Add this line to track step type
}

export interface Entity {
    text: string;
    label: string;
    sentences: string[];
    confidence?: number; // Optional confidence score
}

