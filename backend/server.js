import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import compression from 'compression';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env.local in the root directory
dotenv.config({ path: '../.env.local' });

// Also try loading from current directory and parent directory as fallbacks
if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  dotenv.config({ path: '.env.local' });
}
if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  dotenv.config();
}

const app = express();
const port = 3001;

// Optimize middleware for better performance
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true, // Restrict CORS in production
  credentials: true
}));

// Add compression middleware for better response times
app.use(compression());

// Use express.json() instead of body-parser for better performance
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add response caching headers for static content
app.use((req, res, next) => {
  // Cache static assets for 1 hour
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// --- Gemini AI Client Initialization ---
let ai;
try {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in .env.local file.");
  }
  ai = new GoogleGenAI({ apiKey });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const SYSTEM_INSTRUCTION = `
You are BharatFlow, India's advanced AI Traffic Control System. 
Your goal is to optimize traffic flow and ensure safety in a high-density Indian metropolitan grid.
You analyze live data and provide tactical recommendations.
Traffic moves on the LEFT (Left-Hand Traffic).
Output concise, authoritative traffic directives.
Use Indian English terminology (e.g., "Junction", "Signal", "Gridlock").
`;

// --- API Endpoints ---

// Helper function for Gemini calls
async function callGemini(res, model, prompt, config) {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                ...config
            }
        });
        
        if (response.text) {
            // For JSON responses, parse it before sending
            if (config?.responseMimeType === "application/json") {
                return res.json(JSON.parse(response.text));
            }
            // For function calls
            if (response.functionCalls) {
                return res.json(response.functionCalls);
            }
            // For text responses
            return res.json({ text: response.text });
        } else if (response.functionCalls) {
            // Handle cases where only function calls are returned
            return res.json(response.functionCalls);
        }
        
        // Handle grounding metadata for real-world intel
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
             return res.json({
                text: response.text || "",
                sources: response.candidates[0].groundingMetadata.groundingChunks.filter(c => c.web),
            });
        }
        
        throw new Error("Empty response from Gemini API");
    } catch (error) {
        console.error("Gemini API call failed:", error);
        res.status(500).json({ error: "An error occurred while communicating with the AI model." });
    }
}


app.post('/api/analyze-traffic', async (req, res) => {
    const { congestedIntersections, stats } = req.body;
    if (!congestedIntersections || !stats) return res.status(400).json({ error: 'Missing required payload.' });
    
    const prompt = `
      Analyze this traffic snapshot.
      
      Overall Stats:
      - Congestion: ${stats.congestionLevel}%
      - Average Speed: ${stats.avgSpeed.toFixed(1)} px/f
      
      Congested Junctions:
      ${congestedIntersections.length > 0 ? congestedIntersections.map(i => `- ${i.label}: NSQ=${i.nsQueue}, EWQ=${i.ewQueue}`).join('\n') : 'None'}
      
      Task:
      1. Provide a concise, one-sentence city-wide status report.
      2. Identify up to TWO junctions that require immediate signal timing changes. 
      3. For each, suggest a new 'greenDuration' (current is 150 frames, max 300) and provide a tactical reason.
      If no changes are needed, return an empty array for suggestedChanges.
    `;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "A one-sentence city-wide status report." },
            suggestedChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  intersectionId: { type: Type.STRING },
                  newGreenDuration: { type: Type.INTEGER },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
    };
    
    await callGemini(res, 'gemini-2.5-flash', prompt, config);
});

app.post('/api/analyze-junction', async (req, res) => {
    const { intersection, nsQueue, ewQueue } = req.body;
    if (!intersection || nsQueue === undefined || ewQueue === undefined) return res.status(400).json({ error: 'Missing required payload.' });

    const prompt = `
      You are an AI traffic controller for the "${intersection.label}" junction.
      Analyze the following live data and provide a tactical recommendation.
      
      Live Data:
      - Current N-S Light: ${intersection.lightState.ns}
      - Current E-W Light: ${intersection.lightState.ew}
      - Current Green Duration: ${intersection.greenDuration} frames
      - North-South Queue: ${nsQueue} vehicles
      - East-West Queue: ${ewQueue} vehicles
      
      Tasks:
      1.  **analysis**: Provide a one-sentence analysis of the current situation.
      2.  **recommendation**: State a clear, single action to optimize flow.
      3.  **reason**: Give a concise, one-sentence rationale for your recommendation.
      4.  **newGreenDuration**: Suggest an optimal new green duration (integer between 60 and 300 frames). If no change is needed, return the current value of ${intersection.greenDuration}.
    `;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                reason: { type: Type.STRING },
                newGreenDuration: { type: Type.INTEGER }
            },
            required: ["analysis", "recommendation", "reason", "newGreenDuration"]
        }
    };
    
    await callGemini(res, 'gemini-2.5-flash', prompt, config);
});


app.post('/api/explain-suggestion', async (req, res) => {
    const { analysisInput, suggestion, stats } = req.body;
    if (!analysisInput || !suggestion || !stats) return res.status(400).json({ error: 'Missing required payload.' });
    
    const targetJunction = analysisInput.find(j => j.id === suggestion.intersectionId);
    const prompt = `
      You are BharatFlow, an AI Traffic Control System.
      Your previous analysis of the traffic grid resulted in the following suggestion:
      - Junction: ${targetJunction?.label || suggestion.intersectionId}
      - Action: Change green light duration to ${suggestion.newGreenDuration} frames.
      - Your stated reason was: "${suggestion.reason}"

      The overall grid stats at the time were:
      - Congestion: ${stats.congestionLevel}%
      - Average Speed: ${stats.avgSpeed.toFixed(1)} px/f

      The specific data for the affected junction was:
      - North-South Queue: ${targetJunction?.nsQueue} vehicles
      - East-West Queue: ${targetJunction?.ewQueue} vehicles

      Task:
      Explain your reasoning for this specific suggestion in simple, clear terms for a human operator.
      Focus on the intended outcome and the "if-then" logic.
      Keep the explanation to 2-3 sentences.
    `;
    
    await callGemini(res, 'gemini-2.5-flash', prompt, {});
});

app.post('/api/analyze-incident', async (req, res) => {
    const { incident, nearbyUnits } = req.body;
    if (!incident || nearbyUnits === undefined) return res.status(400).json({ error: 'Missing required payload.' });

    const prompt = `
      Analyze this field incident report and provide tactical advice.
      
      Incident Details:
      - Type: ${incident.type}
      - Severity: ${incident.severity}
      - Location Description: ${incident.description}
      - Nearby Police Units: ${nearbyUnits}
      
      Provide a concise assessment and a recommended course of action.
    `;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                assessment: { type: Type.STRING },
                recommended_action: { type: Type.STRING }
            }
        }
    };
    
    await callGemini(res, 'gemini-2.5-flash', prompt, config);
});

app.post('/api/real-world-intel', async (req, res) => {
    const { query, city, intersectionLabels, location } = req.body;
    if (!query || !city || !intersectionLabels) return res.status(400).json({ error: 'Missing required payload.' });

    let locationContext = location ? ` The user's current location is approximately latitude ${location.latitude.toFixed(4)}, longitude ${location.longitude.toFixed(4)}.` : '';
    const prompt = `
      You are an AI assistant for a traffic control center.
      The user's query is about traffic conditions in ${city}, India: "${query}".
      ${locationContext}
      The known intersections in this city sector are: ${intersectionLabels.join(', ')}.

      Your task has two parts:
      1. Provide a concise, one-paragraph summary for the operator based on real-time web search results. Focus on events, incidents, or conditions that would directly impact city traffic management.
      2. After your summary, if and only if your search finds a specific, verifiable incident (like a major accident or significant roadwork) that is clearly located at one of the known intersections listed above, you MUST add a special data line at the very end of your response. This line must be on a new line and follow this exact format:
         INCIDENT::[INTERSECTION_LABEL]::[TYPE]::[DESCRIPTION]
         - [INTERSECTION_LABEL] must be an exact match from the provided list.
         - [TYPE] must be either ACCIDENT or CONSTRUCTION.
         - [DESCRIPTION] must be a very short summary (e.g., "Multi-vehicle collision").
    `;
    
    const config = {
        tools: [{ googleSearch: {} }],
    };

    await callGemini(res, 'gemini-2.5-flash', prompt, config);
});

app.post('/api/interpret-search', async (req, res) => {
    const { query, intersections, cars, incidents } = req.body;
    if (!query || !intersections || !cars || !incidents) return res.status(400).json({ error: 'Missing required payload.' });

    const selectObjectDeclaration = {
        name: 'select_object',
        description: 'Selects a specific object (intersection, vehicle, or road) on the map by its name or ID.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['INTERSECTION', 'CAR', 'ROAD'] },
                name_or_id: { type: Type.STRING, description: 'The name (e.g., "Silk Board") or ID (e.g., "INT-0-0") of the object to select.' },
            },
            required: ['type', 'name_or_id'],
        },
    };
    const findMostCongestedDeclaration = {
        name: 'find_most_congested_junction',
        description: 'Finds and highlights the intersection with the highest current traffic congestion.',
        parameters: { type: Type.OBJECT, properties: {} },
    };
    const findAllUnitsDeclaration = {
        name: 'find_all_units_of_type',
        description: 'Finds and highlights all vehicles of a specific type (e.g., "police", "bus"), including broken down vehicles.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['CAR', 'AUTO', 'BUS', 'POLICE', 'BROKEN_DOWN'] },
            },
            required: ['type'],
        },
    };
    const findIncidentsBySeverityDeclaration = {
        name: 'find_incidents_by_severity',
        description: 'Finds and highlights all incidents of a specific severity level (LOW, MEDIUM, or HIGH).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            },
            required: ['severity'],
        },
    };

    const prompt = `
      You are the natural language interface for the BharatFlow traffic command center.
      The user has entered the following command: "${query}"

      The current simulation contains the following entities:
      - ${intersections.length} intersections with labels like: ${intersections.slice(0, 3).map(i => i.label).join(', ')}...
      - ${cars.length} vehicles, including types: CAR, AUTO, BUS, POLICE. Some might be broken down.
      - ${incidents.length} incidents with severities: LOW, MEDIUM, HIGH.

      Based on the user's command, call the appropriate function tool.
    `;
    
    const config = {
        tools: [{ functionDeclarations: [selectObjectDeclaration, findMostCongestedDeclaration, findAllUnitsDeclaration, findIncidentsBySeverityDeclaration] }],
    };
    
    await callGemini(res, 'gemini-2.5-flash', prompt, config);
});

// --- ML API Integration ---
const ML_API_URL = 'http://localhost:5000';

async function callMLAPI(endpoint, data) {
    try {
        const response = await fetch(`${ML_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`ML API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('ML API call failed:', error);
        return null;
    }
}

// Enhanced traffic analysis with ML predictions
app.post('/api/ml/predict-congestion', async (req, res) => {
    const { intersectionData } = req.body;
    if (!intersectionData) return res.status(400).json({ error: 'Missing intersection data.' });
    
    const mlResult = await callMLAPI('/predict/congestion', intersectionData);
    
    if (mlResult) {
        res.json(mlResult);
    } else {
        res.status(500).json({ error: 'ML prediction service unavailable' });
    }
});

// ML-powered signal optimization
app.post('/api/ml/optimize-signal', async (req, res) => {
    const { intersectionData } = req.body;
    if (!intersectionData) return res.status(400).json({ error: 'Missing intersection data.' });
    
    const mlResult = await callMLAPI('/optimize/signal', intersectionData);
    
    if (mlResult) {
        res.json(mlResult);
    } else {
        res.status(500).json({ error: 'ML optimization service unavailable' });
    }
});

// Batch analysis for multiple intersections
app.post('/api/ml/analyze-batch', async (req, res) => {
    const { intersections } = req.body;
    if (!intersections || !Array.isArray(intersections)) {
        return res.status(400).json({ error: 'Missing or invalid intersections array.' });
    }
    
    const mlResult = await callMLAPI('/analyze/batch', { intersections });
    
    if (mlResult) {
        res.json(mlResult);
    } else {
        res.status(500).json({ error: 'ML batch analysis service unavailable' });
    }
});

// ML model health check
app.get('/api/ml/health', async (_req, res) => {
    try {
        const response = await fetch(`${ML_API_URL}/health`);
        const health = await response.json();
        res.json(health);
    } catch (error) {
        res.json({ status: 'unavailable', error: error.message });
    }
});

// --- Search Engine AI API Endpoints ---

// In-memory storage for search analytics (in production, use a proper database)
const searchAnalytics = [];

// POST /api/search - Process natural language search queries
app.post('/api/search', async (req, res) => {
    const { query, context, limit = 10, offset = 0 } = req.body;
    
    if (!query || !context) {
        return res.status(400).json({ error: 'Missing required fields: query and context' });
    }

    const startTime = Date.now();

    try {
        // Use Gemini AI to interpret the natural language query
        const searchPrompt = `
            You are the search engine for BharatFlow AI, India's traffic management system.
            The user is searching for: "${query}"
            
            Current context:
            - City: ${context.currentCity}
            - User Role: ${context.userRole}
            - Active Incidents: ${context.activeIncidents?.length || 0}
            - Traffic Congestion: ${context.currentTrafficStats?.congestionLevel || 0}%
            
            Based on this search query, identify what the user is looking for and provide structured search results.
            Focus on traffic-related entities like intersections, vehicles, incidents, roads, and system information.
            
            Consider Indian traffic terminology:
            - "Junction" or "Signal" for intersections
            - "Auto" for auto-rickshaws
            - Indian city names and landmarks
            - Left-hand traffic patterns
            
            Return results that would be most relevant to a ${context.userRole} in ${context.currentCity}.
        `;

        const searchConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    results: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['intersection', 'vehicle', 'incident', 'historical', 'system'] },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                relevanceScore: { type: Type.NUMBER },
                                highlightedTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                                actionable: { type: Type.BOOLEAN },
                                navigationTarget: { type: Type.STRING },
                                metadata: { type: Type.OBJECT }
                            },
                            required: ['id', 'type', 'title', 'description', 'relevanceScore', 'highlightedTerms', 'actionable']
                        }
                    },
                    totalCount: { type: Type.INTEGER },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['results', 'totalCount']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: searchPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                ...searchConfig
            }
        });

        const processingTime = Date.now() - startTime;
        
        if (response.text) {
            const searchResults = JSON.parse(response.text);
            
            // Apply pagination
            const paginatedResults = searchResults.results.slice(offset, offset + limit);
            
            // Ensure response time requirement is met (3 seconds)
            if (processingTime > 3000) {
                console.warn(`Search query processing took ${processingTime}ms, exceeding 3-second target`);
            }

            res.json({
                results: paginatedResults,
                totalCount: searchResults.totalCount,
                processingTime,
                suggestions: searchResults.suggestions || []
            });
        } else {
            throw new Error("Empty response from Gemini AI");
        }

    } catch (error) {
        console.error("Search API error:", error);
        const processingTime = Date.now() - startTime;
        
        // Fallback to basic search if Gemini AI fails
        const fallbackResults = [{
            id: 'fallback-1',
            type: 'system',
            title: 'Search Service Temporarily Unavailable',
            description: 'AI-powered search is currently unavailable. Please try again later.',
            relevanceScore: 0.5,
            highlightedTerms: [],
            actionable: false,
            metadata: { fallback: true }
        }];

        res.json({
            results: fallbackResults,
            totalCount: 1,
            processingTime,
            suggestions: [],
            warning: 'AI search temporarily unavailable, showing fallback results'
        });
    }
});

// GET /api/search/suggestions - Provide real-time search suggestions
app.get('/api/search/suggestions', async (req, res) => {
    const { partial, context, limit = 5 } = req.query;
    
    if (!partial || !context) {
        return res.status(400).json({ error: 'Missing required parameters: partial and context' });
    }

    const startTime = Date.now();

    try {
        // Parse context if it's a string
        const searchContext = typeof context === 'string' ? JSON.parse(context) : context;

        const suggestionPrompt = `
            You are providing search suggestions for BharatFlow AI traffic management system.
            The user has typed: "${partial}"
            
            Current context:
            - City: ${searchContext.currentCity}
            - User Role: ${searchContext.userRole}
            
            Provide relevant search suggestions that complete or expand on what the user is typing.
            Focus on traffic-related terms, Indian locations, and domain-specific vocabulary.
            
            Consider:
            - Traffic terminology (junction, signal, congestion, etc.)
            - Vehicle types (car, auto, bus, police)
            - Indian city names and landmarks
            - Incident types (accident, breakdown, construction)
            - System functions and features
            
            Prioritize suggestions based on the user's role and current city context.
        `;

        const suggestionConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['completion', 'category', 'entity'] },
                                confidence: { type: Type.NUMBER },
                                icon: { type: Type.STRING }
                            },
                            required: ['text', 'type', 'confidence']
                        }
                    }
                },
                required: ['suggestions']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: suggestionPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                ...suggestionConfig
            }
        });

        const processingTime = Date.now() - startTime;

        if (response.text) {
            const suggestionResults = JSON.parse(response.text);
            
            // Apply limit and ensure response time requirement (500ms)
            const limitedSuggestions = suggestionResults.suggestions.slice(0, parseInt(limit));
            
            if (processingTime > 500) {
                console.warn(`Suggestion generation took ${processingTime}ms, exceeding 500ms target`);
            }

            res.json({
                suggestions: limitedSuggestions
            });
        } else {
            throw new Error("Empty response from Gemini AI");
        }

    } catch (error) {
        console.error("Search suggestions API error:", error);
        
        // Fallback suggestions based on partial input
        const fallbackSuggestions = [];
        const partialLower = partial.toLowerCase();
        
        if (partialLower.includes('int') || partialLower.includes('jun')) {
            fallbackSuggestions.push({ text: 'intersection', type: 'completion', confidence: 0.8 });
        }
        if (partialLower.includes('car') || partialLower.includes('veh')) {
            fallbackSuggestions.push({ text: 'vehicle', type: 'completion', confidence: 0.8 });
        }
        if (partialLower.includes('inc') || partialLower.includes('acc')) {
            fallbackSuggestions.push({ text: 'incident', type: 'completion', confidence: 0.8 });
        }

        res.json({
            suggestions: fallbackSuggestions.slice(0, parseInt(limit)),
            warning: 'AI suggestions temporarily unavailable, showing basic completions'
        });
    }
});

// POST /api/search/analytics - Log search queries and interactions
app.post('/api/search/analytics', async (req, res) => {
    const { query, results, selectedResult, userId, sessionId } = req.body;
    
    if (!query || !results || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields: query, results, and sessionId' });
    }

    try {
        // Create analytics log entry
        const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            query,
            timestamp: Date.now(),
            userId: userId || 'anonymous',
            sessionId,
            resultCount: results.length,
            selectedResultId: selectedResult || null,
            processingTime: 0, // This would be passed from the client
            context: req.body.context || {}
        };

        // Store in memory (in production, use proper database)
        searchAnalytics.push(logEntry);

        // Keep only last 1000 entries to prevent memory issues
        if (searchAnalytics.length > 1000) {
            searchAnalytics.splice(0, searchAnalytics.length - 1000);
        }

        // Log for debugging
        console.log(`Search analytics logged: Query="${query}", Results=${results.length}, User=${userId || 'anonymous'}`);

        res.json({
            success: true,
            logId: logEntry.id,
            message: 'Search analytics logged successfully'
        });

    } catch (error) {
        console.error("Search analytics API error:", error);
        res.status(500).json({ 
            error: 'Failed to log search analytics',
            details: error.message 
        });
    }
});

// GET /api/search/analytics - Retrieve search analytics (admin only)
app.get('/api/search/analytics', (req, res) => {
    const { limit = 100, offset = 0, userId } = req.query;
    
    try {
        let filteredAnalytics = searchAnalytics;
        
        // Filter by userId if provided
        if (userId) {
            filteredAnalytics = searchAnalytics.filter(entry => entry.userId === userId);
        }
        
        // Apply pagination
        const paginatedAnalytics = filteredAnalytics
            .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            .reverse(); // Most recent first

        // Generate basic insights
        const totalQueries = filteredAnalytics.length;
        const uniqueUsers = new Set(filteredAnalytics.map(entry => entry.userId)).size;
        const avgResultsPerQuery = filteredAnalytics.reduce((sum, entry) => sum + entry.resultCount, 0) / totalQueries || 0;
        
        // Popular search terms (simple word frequency)
        const queryWords = filteredAnalytics
            .flatMap(entry => entry.query.toLowerCase().split(/\s+/))
            .filter(word => word.length > 2);
        
        const wordFreq = {};
        queryWords.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        const popularTerms = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([term, count]) => ({ term, count }));

        res.json({
            analytics: paginatedAnalytics,
            totalCount: filteredAnalytics.length,
            insights: {
                totalQueries,
                uniqueUsers,
                avgResultsPerQuery: Math.round(avgResultsPerQuery * 100) / 100,
                popularTerms
            }
        });

    } catch (error) {
        console.error("Search analytics retrieval error:", error);
        res.status(500).json({ 
            error: 'Failed to retrieve search analytics',
            details: error.message 
        });
    }
});

app.listen(port, () => {
  console.log(`BharatFlow AI Backend running at http://localhost:${port}`);
  console.log(`ML API expected at http://localhost:5000`);
  console.log(`Search Engine AI endpoints available at /api/search/*`);
});