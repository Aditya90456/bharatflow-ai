# Search Engine AI Design Document

## Overview

The Search Engine AI feature will provide intelligent search capabilities within the BharatFlow AI traffic management system. This feature leverages the existing Gemini AI integration to process natural language queries and return contextually relevant traffic information. The system will enable traffic operators and city planners to quickly find information about intersections, vehicles, incidents, historical data, and system functionality using conversational language.

The search engine will integrate seamlessly with the existing React/TypeScript frontend and Node.js/Express backend, utilizing the current Gemini AI service architecture. It will provide real-time search suggestions, intelligent query interpretation, and comprehensive result presentation with proper ranking and filtering.

## Architecture

The Search Engine AI follows a three-tier architecture:

### Frontend Layer (React/TypeScript)
- **Search Interface Component**: Provides the main search input with auto-completion
- **Results Display Component**: Renders search results with highlighting and navigation
- **Search History Component**: Manages and displays recent searches
- **Search Analytics Dashboard**: Shows search patterns and popular queries (admin only)

### Backend API Layer (Node.js/Express)
- **Search Query Processor**: Interprets natural language queries using Gemini AI
- **Search Index Manager**: Maintains searchable data structures for fast retrieval
- **Result Ranker**: Prioritizes and scores search results based on relevance and context
- **Search Analytics Service**: Logs queries and tracks usage patterns

### Data Layer
- **Search Index**: In-memory data structures for fast text search across traffic entities
- **Query Log Database**: Stores search queries, results, and user interactions for analytics
- **Context Cache**: Maintains current traffic state for context-aware search results

## Components and Interfaces

### Core Components

#### SearchEngine
```typescript
interface SearchEngine {
  processQuery(query: string, context: SearchContext): Promise<SearchResult[]>;
  getSuggestions(partialQuery: string, context: SearchContext): Promise<SearchSuggestion[]>;
  logQuery(query: string, results: SearchResult[], userId?: string): void;
  buildIndex(data: TrafficData): void;
}
```

#### SearchContext
```typescript
interface SearchContext {
  currentCity: string;
  selectedIntersections: string[];
  activeIncidents: Incident[];
  currentTrafficStats: TrafficStats;
  userRole: 'operator' | 'planner' | 'admin';
  timestamp: number;
}
```

#### SearchResult
```typescript
interface SearchResult {
  id: string;
  type: 'intersection' | 'vehicle' | 'incident' | 'historical' | 'system';
  title: string;
  description: string;
  relevanceScore: number;
  highlightedTerms: string[];
  actionable: boolean;
  navigationTarget?: string;
  metadata: Record<string, any>;
}
```

#### SearchSuggestion
```typescript
interface SearchSuggestion {
  text: string;
  type: 'completion' | 'category' | 'entity';
  confidence: number;
  icon?: string;
}
```

### API Endpoints

#### POST /api/search
Processes natural language search queries and returns ranked results.

**Request:**
```typescript
{
  query: string;
  context: SearchContext;
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
{
  results: SearchResult[];
  totalCount: number;
  processingTime: number;
  suggestions?: string[];
}
```

#### GET /api/search/suggestions
Provides real-time search suggestions as the user types.

**Request:**
```typescript
{
  partial: string;
  context: SearchContext;
  limit?: number;
}
```

**Response:**
```typescript
{
  suggestions: SearchSuggestion[];
}
```

#### POST /api/search/analytics
Logs search queries and user interactions for analytics.

**Request:**
```typescript
{
  query: string;
  results: SearchResult[];
  selectedResult?: string;
  userId?: string;
  sessionId: string;
}
```

## Data Models

### SearchIndex
The search index maintains structured data for fast retrieval:

```typescript
interface SearchIndex {
  intersections: Map<string, IntersectionSearchData>;
  vehicles: Map<string, VehicleSearchData>;
  incidents: Map<string, IncidentSearchData>;
  roads: Map<string, RoadSearchData>;
  historical: Map<string, HistoricalSearchData>;
  textIndex: Map<string, string[]>; // term -> entity IDs
}
```

### IntersectionSearchData
```typescript
interface IntersectionSearchData {
  id: string;
  label: string;
  aliases: string[];
  coordinates: Coordinates;
  currentState: LightState;
  congestionLevel: number;
  keywords: string[];
}
```

### VehicleSearchData
```typescript
interface VehicleSearchData {
  id: string;
  type: VehicleType;
  currentLocation: Coordinates;
  status: string;
  mission?: string;
  keywords: string[];
}
```

### QueryLog
```typescript
interface QueryLog {
  id: string;
  query: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  resultCount: number;
  selectedResultId?: string;
  processingTime: number;
  context: SearchContext;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Query Processing Response Time
*For any* natural language query submitted to the search engine, the system should return results within 3 seconds regardless of query complexity or current system load.
**Validates: Requirements 1.1**

### Property 2: Context-Aware Result Prioritization
*For any* location-specific search query, results related to the currently selected city context should appear before results from other cities in the ranked result list.
**Validates: Requirements 1.2**

### Property 3: Search Result Highlighting
*For any* search query that returns results, each result should contain highlighted matching terms that correspond to words or phrases from the original query.
**Validates: Requirements 1.3**

### Property 4: Permission-Based Result Filtering
*For any* search query from a user with limited permissions, the returned results should only include information that the user is authorized to access based on their role.
**Validates: Requirements 1.5**

### Property 5: Historical Data Query Completeness
*For any* search query requesting historical traffic data, all matching archived information should be included in the results with proper temporal ordering.
**Validates: Requirements 2.1**

### Property 6: Historical Result Metadata Inclusion
*For any* historical search result, the result should include timestamp and contextual information as part of its metadata.
**Validates: Requirements 2.2**

### Property 7: Time-Based Result Grouping
*For any* search query that matches multiple time periods, results should be grouped by time ranges in chronological order.
**Validates: Requirements 2.3**

### Property 8: Historical Pattern Analysis
*For any* search query that identifies historical patterns, the results should include summary statistics and trend indicators.
**Validates: Requirements 2.4**

### Property 9: Domain Terminology Recognition
*For any* search query containing traffic-specific terminology, the system should correctly interpret domain vocabulary and return relevant results without requiring exact technical term matches.
**Validates: Requirements 3.1**

### Property 10: Ambiguous Term Disambiguation
*For any* search query containing ambiguous terms, the system should provide disambiguation options or context-aware interpretations.
**Validates: Requirements 3.2**

### Property 11: Indian Traffic Context Recognition
*For any* search query mentioning vehicle types, the system should recognize Indian-specific vehicles including auto-rickshaws and buses.
**Validates: Requirements 3.3**

### Property 12: Indian Geographic Knowledge
*For any* search query mentioning location names, the system should recognize Indian city names, landmarks, and road terminology.
**Validates: Requirements 3.4**

### Property 13: Technical Term Explanation
*For any* search query using technical traffic management terms, the results should include explanations alongside the search results.
**Validates: Requirements 3.5**

### Property 14: Query Logging Completeness
*For any* search query submitted to the system, a corresponding log entry should be created with timestamp, query text, and user context information.
**Validates: Requirements 4.1**

### Property 15: Result Selection Tracking
*For any* search result that is clicked by a user, the system should record the selection in analytics tracking data.
**Validates: Requirements 4.2**

### Property 16: Query Refinement Pattern Recording
*For any* search query that is modified by a user, the system should record the refinement pattern in analytics data.
**Validates: Requirements 4.3**

### Property 17: Analytics Insight Generation
*For any* analytics generation request, the system should provide insights on popular search terms and result effectiveness based on logged data.
**Validates: Requirements 4.4**

### Property 18: Privacy-Based Data Anonymization
*For any* logged search data where privacy settings require anonymization, the system should remove or obfuscate personally identifiable information.
**Validates: Requirements 4.5**

### Property 19: Search Suggestion Response Time
*For any* partial query input, search suggestions should be provided within 500 milliseconds of the user's typing action.
**Validates: Requirements 5.1**

### Property 20: Context-Aware Suggestion Prioritization
*For any* partial query input, suggestions should be ordered with current traffic context and user history taking precedence over generic suggestions.
**Validates: Requirements 5.2**

### Property 21: Personalized Suggestion Integration
*For any* user with existing search history, suggestions should include personalized recommendations based on their previous queries.
**Validates: Requirements 5.5**

## Error Handling

### Query Processing Errors
- **Invalid Query Format**: Return structured error with suggestion for proper query format
- **Gemini AI Service Unavailable**: Fall back to basic text matching with cached results
- **Context Data Missing**: Use default context values and log warning
- **Permission Denied**: Return filtered results with appropriate user message

### Search Index Errors
- **Index Corruption**: Rebuild index from current traffic data automatically
- **Memory Pressure**: Implement LRU cache eviction for search index
- **Concurrent Access**: Use read-write locks for thread-safe index operations

### API Response Errors
- **Timeout Handling**: Return partial results with timeout indicator
- **Rate Limiting**: Implement per-user query limits with appropriate HTTP status codes
- **Malformed Requests**: Validate input and return detailed error messages

## Testing Strategy

The Search Engine AI will employ a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Unit Testing Approach
Unit tests will verify specific examples and integration points:
- Search query parsing for common traffic terminology
- Result ranking algorithm with known data sets
- Permission filtering with different user roles
- API endpoint responses with various input scenarios
- Error handling for edge cases and failure modes

### Property-Based Testing Approach
Property-based tests will verify universal properties across all inputs using **fast-check** as the testing library. Each property-based test will run a minimum of 100 iterations to ensure statistical confidence in the results.

Property-based tests will cover:
- **Response Time Properties**: Verify query processing and suggestion generation stay within time limits
- **Result Consistency Properties**: Ensure search results maintain proper ordering and filtering
- **Context Preservation Properties**: Validate that user context correctly influences result prioritization
- **Permission Enforcement Properties**: Confirm access control works across all user roles and data types
- **Data Integrity Properties**: Ensure search index remains consistent with source data

Each property-based test will be tagged with comments explicitly referencing the correctness property from this design document using the format: **Feature: search-engine-ai, Property {number}: {property_text}**

### Integration Testing
- End-to-end search workflows from query input to result selection
- Gemini AI service integration with various query types
- Search analytics data collection and reporting
- Performance testing under concurrent user load