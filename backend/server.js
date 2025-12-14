import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
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

app.use(cors());
app.use(bodyParser.json());

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

app.listen(port, () => {
  console.log(`BharatFlow AI Backend running at http://localhost:${port}`);
});