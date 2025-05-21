Enhanced Search Dashboard
This improved search dashboard provides a cleaner, more intuitive user experience by organizing the search process into three distinct phases:

1. Planning Phase
   Shows initial query understanding and classification
   Displays search plan for user approval when complex queries require multiple steps
   Highlights query summary to inform user of AI's interpretation
2. Searching Phase
   Shows real-time progress of search execution
   Displays step-by-step execution with progress indicators
   Shows intermediate results as they become available
   Animates the process to keep users engaged
3. Results Phase
   Focuses primarily on the answer and key entities
   Minimizes technical details into collapsible accordions
   Provides entity interaction for deeper exploration
   Organizes source websites in a clean, expandable interface
   Key Components
   Dashboard.tsx
   The main container that manages:

Search state and phase tracking
API communications (searching and streaming results)
Phase transitions and UI orchestration
EnhancedSearchResults.tsx
Displays search results with:

Prominent answer section
Interactive entity display with filtering
Collapsible accordions for search plan and sources
Website details with entities and content previews
Accordion.tsx
A reusable component for collapsible sections that:

Shows/hides content sections
Provides consistent styling and animations
Improves UI organization and reduces clutter
SearchProgress.tsx
Shows real-time search status with:

Stage-appropriate messages
Progress bar visualization
Loading animations
EntityBubble.tsx
Interactive entity visualization with:

Type-based color coding
Click-to-expand functionality for sentences
Filtering capabilities
SearchPlanApproval.tsx
UI for user approval of multi-step search plans:

Lists planned search steps
Provides approve/edit options
Clear visual feedback
Usage Improvements
Progressive Disclosure: Shows more details as users need them
Focus on Results: Minimizes technical details to emphasize answers
Interactive Exploration: Allows users to explore entities and sources
Visual Continuity: Maintains context through all search phases
Real-time Feedback: Shows progress and intermediate results during search
Design Patterns
Component Reusability: Common UI elements extracted as reusable components
State Management: Clear state transitions between search phases
Responsive Animation: Subtle animations provide feedback and engagement
Progressive Loading: Results appear incrementally as they become available
Accordion Pattern: Collapsible sections reduce visual complexity
