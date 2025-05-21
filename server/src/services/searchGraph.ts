// src/services/searchGraph.ts
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

import { SearchIntent, SearchState } from "../types/search";
import { executePlanWithEntityRecognition, StepExecutionResult } from './enhancedPlanExecution';
import { performSearch } from "./tavily";

// Initialize the language model
const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // "gpt-4o",
  temperature: 0
});

// Create prompt template for classifying search intent
const classificationPrompt = PromptTemplate.fromTemplate(`
Given the following search query, classify it into exactly one of these intent categories:

- Informational Intent: When users want to learn or find information about a topic
- Navigational Intent: When users are looking for a specific website or page
- Commercial Intent: When users are researching products or services before making a purchase decision
- Transactional Intent: When users are ready to complete a specific action like making a purchase
- Local Intent: Searches for nearby businesses, services, or locations
- Comparative Intent: When users want to weigh options between similar products or services
- Pre-Informational Intent: Users just beginning to explore a broad topic without specific questions
- Visual Intent: When users want to see images or visual representations
- Video Intent: When users specifically want video content
- Local Service Intent: Specifically seeking service providers in a geographic area
- News Intent: When users want current information about recent events
- Entertainment Intent: Searches focused on amusement or leisure content
- Specific Question Intent: Users seeking direct answers to specific questions

Respond with ONLY the intent category name, nothing else.

Search query: {query}
`);

// Prompt template for generating a user-friendly summary of what was understood
const querySummaryPrompt = PromptTemplate.fromTemplate(`
Given the following search query and its classified intent, create a brief, friendly summary that shows you understand what the user is looking for.
Do not restate the query verbatim but reformulate it to show understanding of their intent.
Keep it concise and conversational.

Search query: {query}
Classified intent: {intent}

Summary:
`);

// New prompt for analyzing query complexity and generating a search plan
const searchPlanPrompt = PromptTemplate.fromTemplate(`
Analyze the following search query and determine the steps needed to fully answer it.
If the query is simple and can be answered in a single search, return an array with just one step.
If the query requires multiple searches or has multiple parts, break it down into logical steps.

Some steps need to be done sequentially, while others can be done in parallel. So add a label to each step indicating if it is a sequential or parallel step.
The steps that are sequential will look at the previous step's results to determine it's output.

Search query: {query}
Intent: {intent}

For each step, provide:
1. A description of what information needs to be searched for
2. The type of step (sequential or parallel)

Format your response as a valid JSON array of strings, where each string is a step in the search plan.
Example format: [{{"step": "Step 1: Lookup information about A", stepType: "parallel"}}, {{"step":"Step 2: Lookup information about B", stepType: "parallel"}}, {{"step":"Step 3: Take the information learned about A and B and come up with an answer", stepType: "sequential"}}]

Search Plan:
`);

// Function chains
const classifyIntentChain = RunnableSequence.from([
  classificationPrompt,
  model,
  new StringOutputParser()
]);

const generateQuerySummaryChain = RunnableSequence.from([
  querySummaryPrompt,
  model,
  new StringOutputParser()
]);

const generateSearchPlanChain = RunnableSequence.from([
  searchPlanPrompt,
  model,
  new StringOutputParser(),
  // Parse the model output as JSON
  (text) => {
    try {
      if (text.includes("```json")) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

        if (!match) throw new Error('No JSON block found');

        // match[1] is the pure JSON
        return JSON.parse(match[1]);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing search plan JSON:", e);
      return ["Search for information about the query"];
    }
  }
]);

// Node functions
const classifyIntentNode = async (state: SearchState): Promise<Partial<SearchState>> => {
  const intent = await classifyIntentChain.invoke({ query: state.query });
  return { intent: intent as SearchIntent };
};

const generateSummaryNode = async (state: SearchState): Promise<Partial<SearchState>> => {
  const querySummary = await generateQuerySummaryChain.invoke({
    query: state.query,
    intent: state.intent
  });
  return { querySummary };
};

const generateSearchPlanNode = async (state: SearchState): Promise<Partial<SearchState>> => {
  const searchPlan = await generateSearchPlanChain.invoke({
    query: state.query,
    intent: state.intent
  });

  return {
    searchPlan,
    needsApproval: searchPlan.length > 2 // If more than 2 steps, needs approval
  };
};

const performSearchNode = async (state: SearchState): Promise<Partial<SearchState>> => {
  // Handle multi-step search if we have an approved plan
  if (state.searchPlan && state.searchPlan.length > 1 && !state.needsApproval) {
    // For simplicity in this example, we'll just perform a single search
    // In a real implementation, you would execute each step of the plan
    const tavilyResults = await performSearch(state.query);
    return {
      results: tavilyResults.results,
      answer: tavilyResults.answer
    };
  } else {
    // Basic single search for simpler queries
    const tavilyResults = await performSearch(state.query);
    return {
      results: tavilyResults.results,
      answer: tavilyResults.answer
    };
  }
};

// Initial state
const initialState: SearchState = {
  query: "",
  intent: "",
  querySummary: "",
  results: [],
  answer: "",
  searchPlan: [],
  needsApproval: false
};

// Build the graph
export const createEnhancedSearchGraph = () => {
  const workflow = new StateGraph<SearchState>({
    channels: {
      query: {},
      intent: {},
      querySummary: {},
      results: {},
      answer: {},
      searchPlan: {},
      needsApproval: {}
    }
  } as any);

  // Add nodes
  workflow.addNode("classify_intent", classifyIntentNode as any);
  workflow.addNode("generate_summary", generateSummaryNode as any);
  workflow.addNode("generate_search_plan", generateSearchPlanNode as any);
  workflow.addNode("perform_search", performSearchNode as any);

  // Entry point routes to intent classification
  workflow.addEdge(START, "classify_intent" as any);

  // After classification, generate summary
  workflow.addEdge("classify_intent" as any, "generate_summary" as any);

  // After generating summary, generate search plan
  workflow.addEdge("generate_summary" as any, "generate_search_plan" as any);

  // Conditional edge: If plan needs approval, stop here
  workflow.addConditionalEdges(
    "generate_search_plan" as any,
    (state) => state.needsApproval ? END : "perform_search" as any
  );

  // After performing search, end the workflow
  workflow.addEdge("perform_search" as any, END);

  // Compile the workflow
  return workflow.compile();
};

// Modified execute search for streaming
export const executeEnhancedSearchWithProgress = async (
  query: string,
  progressCallback: (stage: string, data: Partial<SearchState>) => void
): Promise<SearchState> => {
  // Step 1: Classification
  progressCallback('classifying', { query });
  const intent = await classifyIntentChain.invoke({ query });
  progressCallback('classifying', { query, intent: intent as SearchIntent });

  // Step 2: Generate summary
  progressCallback('summarizing', { query, intent: intent as SearchIntent });
  const querySummary = await generateQuerySummaryChain.invoke({
    query,
    intent: intent as SearchIntent
  });
  progressCallback('summarizing', {
    query,
    intent: intent as SearchIntent,
    querySummary
  });

  // Step 3: Generate search plan
  progressCallback('planning', {
    query,
    intent: intent as SearchIntent,
    querySummary
  });
  const searchPlan = await generateSearchPlanChain.invoke({
    query,
    intent: intent as SearchIntent
  });

  const needsApproval = searchPlan.length > 2;

  progressCallback('planning', {
    query,
    intent: intent as SearchIntent,
    querySummary,
    searchPlan,
    needsApproval
  });

  // If plan needs approval, stop here and wait for user input
  if (needsApproval) {
    return {
      query,
      intent: intent as SearchIntent,
      querySummary,
      searchPlan,
      needsApproval,
      results: [],
      answer: ""
    };
  }

  // Step 4: Search if no approval needed
  progressCallback('searching', {
    query,
    intent: intent as SearchIntent,
    querySummary,
    searchPlan,
    needsApproval: false
  });

  const tavilyResults = await performSearch(query);
  const result = {
    query,
    intent: intent as SearchIntent,
    querySummary,
    searchPlan,
    needsApproval: false,
    results: tavilyResults.results,
    answer: tavilyResults.answer
  };

  progressCallback('searching', result);

  // Step 5: Complete
  progressCallback('complete', result);

  return result;
};

// Execute search with an approved plan
export const executeApprovedSearchSteps = async (
  query: string,
  searchPlan: { step: string, stepType: string }[],
  intent: SearchIntent,
  querySummary: string,
  progressCallback: (stage: string, data: Partial<SearchState>) => void
): Promise<SearchState> => {

  // Notify that we're starting with the approved plan
  progressCallback('executing_plan', {
    query,
    intent: intent as SearchIntent,
    querySummary,
    searchPlan,
    needsApproval: false
  });

  try {
    // Execute the plan with entity recognition
    // Get the steps then develop the plan
    const {
      results,
      answer,
      stepResults,
      combinedEntities
    } = await executePlanWithEntityRecognition(
      query,
      searchPlan,
      intent as SearchIntent,
      (stage, data) => {
        // Forward progress updates
        progressCallback(stage, data);
      }
    );

    // Final result with all steps completed and analyzed
    const result = {
      query,
      intent: intent as SearchIntent,
      querySummary,
      searchPlan,
      needsApproval: false,
      results,
      answer,
      stepResults,
      answerEntities: combinedEntities,
      websiteAnalyses: stepResults.flatMap(step =>
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
      )
    };

    progressCallback('analysis_complete', result);

    return result;
  } catch (error) {
    console.error('Error executing search plan:', error);

    // Fallback to basic search if there's an error
    const tavilyResults = await performSearch(query);

    return {
      query,
      intent: intent as SearchIntent,
      querySummary,
      searchPlan,
      needsApproval: false,
      results: tavilyResults.results,
      answer: tavilyResults.answer
    };
  }
};

// Export standalone functions
export const classifyIntent = async (query: string): Promise<SearchIntent> => {
  const intent = await classifyIntentChain.invoke({ query });
  return intent as SearchIntent;
};

export const generateSummary = async (query: string, intent: SearchIntent): Promise<string> => {
  const querySummary = await generateQuerySummaryChain.invoke({ query, intent });
  return querySummary;
};

export const generateSearchPlan = async (query: string, intent: SearchIntent): Promise<string[]> => {
  const searchPlan = await generateSearchPlanChain.invoke({ query, intent });
  return searchPlan;
};