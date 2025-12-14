import { Intersection, TrafficStats, GeminiAnalysis, Incident, GeminiIncidentAnalysis, RealWorldIntel, GroundingChunk, AiSearchAction, Car, CongestedJunctionInfo, JunctionAnalysisResult } from "../types";

const API_BASE_URL = '/api'; // Use relative path for proxy

export interface AnalyzeJunctionPayload {
  intersection: {
    id: string;
    label: string;
    lightState: Intersection['lightState'];
    greenDuration: number;
  };
  nsQueue: number;
  ewQueue: number;
}


// Generic fetch wrapper
async function apiPost<T>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "An unknown API error occurred." }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const analyzeTraffic = async (
  congestedIntersections: CongestedJunctionInfo[],
  stats: TrafficStats,
): Promise<GeminiAnalysis> => {
  try {
    const data = await apiPost<{ analysis: string; suggestedChanges: any[] }>('/analyze-traffic', { congestedIntersections, stats });
    return { timestamp: Date.now(), ...data };
  } catch (error) {
    console.error("Backend City Analysis Failed:", error);
    return {
      timestamp: Date.now(),
      analysis: "Central Command uplink unstable. Operating on local protocols.",
      suggestedChanges: [],
    };
  }
};

export const analyzeJunction = async (payload: AnalyzeJunctionPayload): Promise<JunctionAnalysisResult> => {
    try {
        return await apiPost<JunctionAnalysisResult>('/analyze-junction', payload);
    } catch (error) {
        console.error("Backend Junction Analysis Failed:", error);
        return {
            analysis: "Failed to connect to backend for tactical analysis.",
            recommendation: "Operator vigilance advised.",
            reason: "The analysis module is currently unreachable. Follow standard operating procedure."
        };
    }
};

export const explainAiSuggestion = async (
  analysisInput: CongestedJunctionInfo[],
  suggestion: { intersectionId: string; newGreenDuration: number; reason: string },
  stats: TrafficStats,
): Promise<string> => {
  try {
    const response = await apiPost<{ text: string }>('/explain-suggestion', { analysisInput, suggestion, stats });
    return response.text;
  } catch (error) {
    console.error("Backend Suggestion Explanation Failed:", error);
    return "Explanation service is currently unavailable. Please try again later.";
  }
};

export const analyzeIncident = async (
  incident: Incident,
  nearbyUnits: number
): Promise<GeminiIncidentAnalysis> => {
    try {
        const data = await apiPost<{ assessment: string; recommended_action: string }>('/analyze-incident', { incident, nearbyUnits });
        return { timestamp: Date.now(), ...data };
    } catch (error) {
        console.error("Backend Incident Analysis Failed:", error);
        return {
            timestamp: Date.now(),
            assessment: "Failed to connect to backend for tactical analysis.",
            recommended_action: "Dispatch nearest unit and follow standard operating procedure."
        };
    }
};

export const getRealWorldIntel = async (
  query: string,
  city: string,
  intersectionLabels: string[],
  location?: { latitude: number; longitude: number }
): Promise<RealWorldIntel> => {
  try {
    const response = await apiPost<{ text: string, sources: GroundingChunk[] }>('/real-world-intel', { query, city, intersectionLabels, location });
    return {
      timestamp: Date.now(),
      intel: response.text,
      sources: response.sources || [],
    };
  } catch (error) {
    console.error("Backend Real-World Intel Failed:", error);
    return {
      timestamp: Date.now(),
      intel: "Failed to retrieve real-world intelligence from the backend server.",
      sources: [],
    };
  }
};

export const interpretSearchQuery = async (
  query: string,
  intersections: Intersection[],
  cars: Car[],
  incidents: Incident[],
): Promise<AiSearchAction[] | null> => {
  try {
    return await apiPost<AiSearchAction[]>('/interpret-search', { query, intersections, cars, incidents });
  } catch (error) {
    console.error("Backend Search Interpretation Failed:", error);
    return null;
  }
};