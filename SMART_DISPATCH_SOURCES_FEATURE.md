# Smart Dispatch - Source Citations, Chat & Map Interaction

## Overview
Enhanced the Smart Dispatch page with data source transparency, interactive chat capabilities, and map interaction features. Users can now see exactly what data the AI analyzed, continue the conversation to dig deeper into dispatch optimization, and click on load markers to view detailed load information.

## New Features

### 1. **Interactive Map Load Details**
Click on any load marker (dot) on the dispatch optimization map to view:
- Complete load information in a detailed modal
- Route map showing pickup and delivery locations
- Financial information (customer rate, carrier cost, margin)
- Equipment requirements and commodity details
- Customer and carrier information
- Rate confirmation status
- Pickup and delivery time windows

This feature brings the same functionality from the loads page to the smart dispatch map, making it easy to inspect individual loads during dispatch planning.

### 2. **Data Source Citations**
After the AI generates recommendations, a new "Data Sources" section displays:
- **Loads**: All loads the AI analyzed, showing load numbers, routes, status, equipment, pickup dates, and rates
- **Fleet**: Available trucks/trailers with unit numbers, vehicle details, year, status, and assignments
- **Carriers**: Available carriers with names and MC numbers

Each section is expandable with detailed tables showing the exact records the AI used for its analysis.

### 3. **Interactive Chat Interface**
A new chat component allows users to:
- Ask follow-up questions about the data and recommendations
- Interrogate the AI about specific details
- Explore patterns and insights conversationally
- Get suggested questions to guide the exploration

The chat maintains context from the initial query and has access to the same data sources.

## Components Added/Modified

### `components/loads/load-details-modal.tsx`
Reused existing component that displays comprehensive load information in a modal dialog. Now used on both the loads page and smart dispatch page.

### `components/smart-dispatch/source-citations.tsx`
Displays expandable sections for each data source (loads, fleet, carriers) with:
- Summary counts
- Expandable data tables
- Color-coded by data type
- Responsive design with scrollable tables

### `components/smart-dispatch/dispatch-chat.tsx`
Interactive chat interface featuring:
- Message history with user/AI avatars
- Real-time conversation
- Suggested follow-up questions
- Auto-scrolling messages
- Markdown rendering for AI responses

## Technical Changes

### `app/actions/ai.ts`
Updated `getSmartDispatchRecommendations` to return:
```typescript
{
  success: true,
  recommendation: string,
  loads_analyzed: number,
  fleet_analyzed: number,
  carriers_analyzed: number,
  sources: {
    loads: any[],
    fleet: any[],
    carriers: any[],
    rawLoads: any[]
  }
}
```

### `components/smart-dispatch/smart-dispatch-with-map.tsx`
Enhanced with:
- State management for sources, chat, and load details
- `handleLoadClick` function to fetch and display load details
- `handleFollowUpMessage` function for chat interactions
- Integration of `SourceCitations`, `DispatchChat`, and `LoadDetailsModal` components
- Proper data flow from AI action to UI components
- Loading indicator for load details fetching

## User Experience Flow

1. **User asks a question** → "Optimize dispatch for today's pending loads"
2. **AI analyzes data** → Loads, fleet, carriers are queried from database
3. **Recommendation displayed** → AI provides insights and suggestions
4. **Map interaction** → User clicks on a load marker to see full details in a modal
5. **Sources shown** → User can expand to see exact data records analyzed
6. **Chat enabled** → User can ask follow-up questions like:
   - "Show me loads with the highest margins"
   - "Which loads have tight delivery deadlines?"
   - "What equipment types are most common?"
   - "Are there any geographic patterns in the loads?"

## Benefits

- **Transparency**: Users see exactly what data informed the AI's decisions
- **Trust**: Ability to verify AI recommendations against source data
- **Quick Access**: Click any load on the map to see complete details instantly
- **Exploration**: Chat interface allows deeper investigation
- **Education**: Users learn what factors influence dispatch optimization
- **Debugging**: Easier to identify data quality issues or missing information
- **Unified Experience**: Same load details modal used across loads page and smart dispatch

## Example Usage

```typescript
// User submits query
"Optimize dispatch for loads picking up in Texas tomorrow"

// AI responds with recommendations
"Based on 15 Texas loads, here are the top priorities..."

// User clicks on a yellow dot (load marker) on the map
// → Load details modal appears with complete information

// Sources section shows:
- 15 loads in detailed table
- 8 available fleet units
- 12 carrier options

// User follows up in chat:
"Which of these loads has the best margin?"

// AI responds with specific load details from the sources

// User can click another load on the map to compare
```

## Future Enhancements

Potential improvements:
- Export source data to CSV/Excel
- Highlight specific records referenced in recommendations
- Add filtering/sorting to source tables
- Show confidence scores for recommendations
- Track which sources were most influential in the decision
- Add data visualization charts in sources section
- Enable driver details modal when clicking driver markers
- Show recommended load-driver pairings with connecting lines on map
- Add quick actions from load details modal (assign driver, edit load, etc.)

