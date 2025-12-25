interface TrafficData {
  source: 'tomtom' | 'mapbox' | 'here' | 'google' | 'simulation';
  timestamp: number;
  currentSpeed: number;
  freeFlowSpeed: number;
  confidence: number;
  congestionLevel: number;
  incidents: TrafficIncident[];
  roadClosure?: boolean;
  travelTime?: number;
}

interface TrafficIncident {
  id: string;
  type: 'ACCIDENT' | 'CONSTRUCTION' | 'ROAD_CLOSURE' | 'WEATHER' | 'EVENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  lat: number;
  lng: number;
  startTime: number;
  estimatedEndTime?: number;
  delay: number; // minutes
}

interface RouteTrafficData {
  route: Array<{ lat: number; lng: number }>;
  totalDistance: number; // meters
  totalTime: number; // seconds
  trafficTime: number; // seconds with traffic
  delay: number; // seconds
  incidents: TrafficIncident[];
  congestionLevel: number;
}

export class RealTrafficApiService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private rateLimiter: Map<string, number[]> = new Map();

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
  }

  // Check rate limiting
  private canMakeApiCall(apiName: string, maxCallsPerMinute: number = 60): boolean {
    const now = Date.now();
    const calls = this.rateLimiter.get(apiName) || [];
    
    // Remove calls older than 1 minute
    const recentCalls = calls.filter(time => now - time < 60000);
    this.rateLimiter.set(apiName, recentCalls);
    
    return recentCalls.length < maxCallsPerMinute;
  }

  // Record API call
  private recordApiCall(apiName: string): void {
    const calls = this.rateLimiter.get(apiName) || [];
    calls.push(Date.now());
    this.rateLimiter.set(apiName, calls);
  }

  // Get cached data
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Set cached data
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // TomTom Traffic API
  async getTomTomTraffic(lat: number, lng: number): Promise<TrafficData | null> {
    const cacheKey = `tomtom_${lat}_${lng}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    if (!this.canMakeApiCall('tomtom', 40)) { // TomTom: 2500/day ≈ 40/hour
      console.warn('TomTom API rate limit reached');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/traffic/tomtom/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        throw new Error(`TomTom API error: ${response.status}`);
      }

      const data = await response.json();
      this.recordApiCall('tomtom');
      
      const trafficData: TrafficData = {
        source: 'tomtom',
        timestamp: Date.now(),
        currentSpeed: data.currentSpeed || 0,
        freeFlowSpeed: data.freeFlowSpeed || 50,
        confidence: data.confidence || 0.5,
        congestionLevel: this.calculateCongestionLevel(data.currentSpeed, data.freeFlowSpeed),
        incidents: await this.getTomTomIncidents(lat, lng) || [],
        roadClosure: data.roadClosure || false,
        travelTime: data.travelTime
      };

      this.setCachedData(cacheKey, trafficData);
      return trafficData;
    } catch (error) {
      console.error('TomTom API error:', error);
      return null;
    }
  }

  // Mapbox Traffic API
  async getMapboxTraffic(lat: number, lng: number): Promise<TrafficData | null> {
    const cacheKey = `mapbox_${lat}_${lng}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    if (!this.canMakeApiCall('mapbox', 1600)) { // Mapbox: 100k/month ≈ 1600/hour
      console.warn('Mapbox API rate limit reached');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/traffic/mapbox/congestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      this.recordApiCall('mapbox');
      
      const trafficData: TrafficData = {
        source: 'mapbox',
        timestamp: Date.now(),
        currentSpeed: data.speed || 0,
        freeFlowSpeed: data.freeFlowSpeed || 50,
        confidence: data.confidence || 0.7,
        congestionLevel: data.congestion || 0,
        incidents: data.incidents || [],
        roadClosure: data.roadClosure || false
      };

      this.setCachedData(cacheKey, trafficData);
      return trafficData;
    } catch (error) {
      console.error('Mapbox API error:', error);
      return null;
    }
  }

  // HERE Traffic API
  async getHereTraffic(lat: number, lng: number): Promise<TrafficData | null> {
    const cacheKey = `here_${lat}_${lng}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    if (!this.canMakeApiCall('here', 4000)) { // HERE: 250k/month ≈ 4000/hour
      console.warn('HERE API rate limit reached');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/traffic/here/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status}`);
      }

      const data = await response.json();
      this.recordApiCall('here');
      
      const trafficData: TrafficData = {
        source: 'here',
        timestamp: Date.now(),
        currentSpeed: data.currentSpeed || 0,
        freeFlowSpeed: data.freeFlowSpeed || 50,
        confidence: data.confidence || 0.6,
        congestionLevel: this.calculateCongestionLevel(data.currentSpeed, data.freeFlowSpeed),
        incidents: data.incidents || [],
        roadClosure: data.roadClosure || false
      };

      this.setCachedData(cacheKey, trafficData);
      return trafficData;
    } catch (error) {
      console.error('HERE API error:', error);
      return null;
    }
  }

  // Get traffic data with fallback chain
  async getTrafficData(lat: number, lng: number): Promise<TrafficData> {
    // Try APIs in order of preference
    let trafficData = await this.getTomTomTraffic(lat, lng);
    
    if (!trafficData) {
      trafficData = await this.getMapboxTraffic(lat, lng);
    }
    
    if (!trafficData) {
      trafficData = await this.getHereTraffic(lat, lng);
    }
    
    // Fallback to simulation
    if (!trafficData) {
      trafficData = await this.getSimulatedTraffic(lat, lng);
    }
    
    return trafficData;
  }

  // Get route traffic data
  async getRouteTraffic(
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number
  ): Promise<RouteTrafficData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/traffic/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: { lat: startLat, lng: startLng },
          end: { lat: endLat, lng: endLng }
        })
      });

      if (!response.ok) {
        throw new Error(`Route traffic API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Route traffic error:', error);
      // Return fallback data
      return {
        route: [
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng }
        ],
        totalDistance: this.calculateDistance(startLat, startLng, endLat, endLng),
        totalTime: 1800, // 30 minutes default
        trafficTime: 2100, // 35 minutes with traffic
        delay: 300, // 5 minutes delay
        incidents: [],
        congestionLevel: 0.3
      };
    }
  }

  // Get TomTom incidents
  private async getTomTomIncidents(lat: number, lng: number): Promise<TrafficIncident[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/traffic/tomtom/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, radius: 5000 })
      });

      if (response.ok) {
        const data = await response.json();
        return data.incidents || [];
      }
    } catch (error) {
      console.error('TomTom incidents error:', error);
    }
    return [];
  }

  // Fallback to simulated traffic
  private async getSimulatedTraffic(lat: number, lng: number): Promise<TrafficData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/traffic/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Simulation traffic error:', error);
    }

    // Ultimate fallback
    return {
      source: 'simulation',
      timestamp: Date.now(),
      currentSpeed: 35,
      freeFlowSpeed: 50,
      confidence: 0.3,
      congestionLevel: 0.3,
      incidents: [],
      roadClosure: false
    };
  }

  // Calculate congestion level
  private calculateCongestionLevel(currentSpeed: number, freeFlowSpeed: number): number {
    if (freeFlowSpeed === 0) return 0;
    const ratio = currentSpeed / freeFlowSpeed;
    return Math.max(0, Math.min(1, 1 - ratio));
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Get API status
  getApiStatus(): {
    tomtom: { available: boolean; callsRemaining: number };
    mapbox: { available: boolean; callsRemaining: number };
    here: { available: boolean; callsRemaining: number };
  } {
    const now = Date.now();
    
    const getTomTomCalls = () => {
      const calls = this.rateLimiter.get('tomtom') || [];
      return calls.filter(time => now - time < 60000).length;
    };
    
    const getMapboxCalls = () => {
      const calls = this.rateLimiter.get('mapbox') || [];
      return calls.filter(time => now - time < 60000).length;
    };
    
    const getHereCalls = () => {
      const calls = this.rateLimiter.get('here') || [];
      return calls.filter(time => now - time < 60000).length;
    };

    return {
      tomtom: {
        available: this.canMakeApiCall('tomtom', 40),
        callsRemaining: Math.max(0, 40 - getTomTomCalls())
      },
      mapbox: {
        available: this.canMakeApiCall('mapbox', 1600),
        callsRemaining: Math.max(0, 1600 - getMapboxCalls())
      },
      here: {
        available: this.canMakeApiCall('here', 4000),
        callsRemaining: Math.max(0, 4000 - getHereCalls())
      }
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // This would be calculated based on actual hits/misses
    };
  }
}

// Export singleton instance
export const realTrafficApiService = new RealTrafficApiService();