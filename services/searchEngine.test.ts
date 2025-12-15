import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BharatFlowSearchEngine } from './searchEngine';
import { SearchContext, TrafficData, LightState, Incident } from '../types';

describe('Search Engine AI Property Tests', () => {
  
  /**
   * **Feature: search-engine-ai, Property 1: Query Processing Response Time**
   * **Validates: Requirements 1.1**
   * 
   * For any natural language query submitted to the search engine, 
   * the system should return results within 3 seconds regardless of 
   * query complexity or current system load.
   */
  it('should process any query within 3 seconds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary search queries
        fc.string({ minLength: 1, maxLength: 200 }),
        // Generate arbitrary search context
        fc.record({
          currentCity: fc.string({ minLength: 1, maxLength: 50 }),
          selectedIntersections: fc.array(fc.string(), { maxLength: 10 }),
          activeIncidents: fc.constant([]) as fc.Arbitrary<Incident[]>, // Properly typed empty array
          currentTrafficStats: fc.record({
            totalCars: fc.integer({ min: 0, max: 1000 }),
            avgSpeed: fc.float({ min: 0, max: 100 }),
            congestionLevel: fc.integer({ min: 0, max: 100 }),
            carbonEmission: fc.float({ min: 0, max: 1000 }),
            incidents: fc.integer({ min: 0, max: 50 })
          }),
          userRole: fc.constantFrom('operator', 'planner', 'admin') as fc.Arbitrary<'operator' | 'planner' | 'admin'>,
          timestamp: fc.integer({ min: Date.now() - 86400000, max: Date.now() })
        }),
        async (query: string, context: SearchContext) => {
          const searchEngine = new BharatFlowSearchEngine();
          
          // Initialize with some sample data
          const sampleData: TrafficData = {
            intersections: [{
              id: 'INT-0-0',
              label: 'Test Junction',
              x: 0,
              y: 0,
              lightState: { ns: LightState.GREEN, ew: LightState.RED },
              timer: 30,
              greenDuration: 150
            }],
            vehicles: [{
              id: 'CAR-001',
              x: 100,
              y: 100,
              dir: 'N',
              speed: 10,
              targetIntersectionId: null,
              state: 'MOVING',
              type: 'CAR',
              width: 20,
              length: 40
            }],
            incidents: [],
            roads: []
          };
          
          searchEngine.buildIndex(sampleData);
          
          const startTime = Date.now();
          const results = await searchEngine.processQuery(query, context);
          const endTime = Date.now();
          
          const processingTime = endTime - startTime;
          
          // The core property: processing time must be <= 3000ms
          expect(processingTime).toBeLessThanOrEqual(3000);
          
          // Additional checks to ensure the function works correctly
          expect(Array.isArray(results)).toBe(true);
          expect(results.every(result => 
            typeof result.id === 'string' &&
            typeof result.type === 'string' &&
            typeof result.title === 'string' &&
            typeof result.description === 'string' &&
            typeof result.relevanceScore === 'number' &&
            Array.isArray(result.highlightedTerms) &&
            typeof result.actionable === 'boolean'
          )).toBe(true);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design document
    );
  });
});