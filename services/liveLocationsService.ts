import { Car, VehicleType } from '../types';

interface LiveVehicle {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  speed: number;
  direction: 'N' | 'S' | 'E' | 'W';
  isBrokenDown: boolean;
  mission?: {
    type: 'PATROL' | 'RESPONSE';
    targetId: string | null;
  } | null;
  timestamp: number;
  lastUpdate: number;
}

interface LiveLocationStats {
  city: string;
  timestamp: number;
  totalVehicles: number;
  avgSpeed: number;
  vehicleTypes: Record<string, number>;
  brokenDownCount: number;
  policeUnits: number;
  congestionLevel: number;
}

interface LiveLocationResponse {
  city: string;
  timestamp: number;
  vehicleCount: number;
  vehicles: LiveVehicle[];
  historicalData?: any[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

class LiveLocationsService {
  private baseUrl: string;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
  }

  // Get current live vehicle locations
  async getLiveLocations(
    city: string, 
    options: {
      includeHistory?: boolean;
      vehicleTypes?: string[];
      limit?: number;
    } = {}
  ): Promise<LiveLocationResponse> {
    const params = new URLSearchParams();
    
    if (options.includeHistory) {
      params.append('includeHistory', 'true');
    }
    
    if (options.vehicleTypes && options.vehicleTypes.length > 0) {
      params.append('vehicleTypes', options.vehicleTypes.join(','));
    }
    
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    const response = await fetch(
      `${this.baseUrl}/api/live-locations/${city}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch live locations: ${response.statusText}`);
    }

    return response.json();
  }

  // Get live traffic statistics
  async getLiveStats(city: string): Promise<LiveLocationStats> {
    const response = await fetch(`${this.baseUrl}/api/live-locations/${city}/stats`);

    if (!response.ok) {
      throw new Error(`Failed to fetch live stats: ${response.statusText}`);
    }

    return response.json();
  }

  // Start real-time streaming of vehicle locations
  startLiveStream(
    city: string,
    onUpdate: (data: any) => void,
    onError?: (error: Event) => void,
    options: {
      interval?: number;
      vehicleTypes?: string[];
    } = {}
  ): void {
    this.stopLiveStream(); // Stop any existing stream

    const params = new URLSearchParams();
    
    if (options.interval) {
      params.append('interval', options.interval.toString());
    }
    
    if (options.vehicleTypes && options.vehicleTypes.length > 0) {
      params.append('vehicleTypes', options.vehicleTypes.join(','));
    }

    const streamUrl = `${this.baseUrl}/api/live-locations/${city}/stream?${params.toString()}`;
    
    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onUpdate(data);
          this.reconnectAttempts = 0; // Reset on successful message
        } catch (error) {
          console.error('Error parsing live location data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Live locations stream error:', error);
        
        if (onError) {
          onError(error);
        }

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            if (this.eventSource?.readyState === EventSource.CLOSED) {
              this.startLiveStream(city, onUpdate, onError, options);
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      this.eventSource.onopen = () => {
        console.log(`Live locations stream opened for ${city}`);
        this.reconnectAttempts = 0;
      };

    } catch (error) {
      console.error('Failed to start live stream:', error);
      if (onError) {
        onError(error as Event);
      }
    }
  }

  // Stop the live stream
  stopLiveStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.reconnectAttempts = 0;
      console.log('Live locations stream stopped');
    }
  }

  // Add or update a specific vehicle
  async updateVehicle(
    city: string,
    vehicleData: {
      vehicleId: string;
      type: VehicleType;
      x: number;
      y: number;
      speed?: number;
      direction?: 'N' | 'S' | 'E' | 'W';
      isBrokenDown?: boolean;
      mission?: any;
    }
  ): Promise<{ success: boolean; vehicle: LiveVehicle }> {
    const response = await fetch(`${this.baseUrl}/api/live-locations/${city}/vehicle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update vehicle: ${response.statusText}`);
    }

    return response.json();
  }

  // Remove a vehicle
  async removeVehicle(city: string, vehicleId: string): Promise<{ success: boolean; removed: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/live-locations/${city}/vehicle/${vehicleId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to remove vehicle: ${response.statusText}`);
    }

    return response.json();
  }

  // Create an incident that affects vehicle movement
  async createIncident(
    city: string,
    incidentData: {
      type: string;
      location: { x: number; y: number };
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description?: string;
    }
  ): Promise<{ success: boolean; affectedVehicles: number }> {
    const response = await fetch(`${this.baseUrl}/api/live-locations/${city}/incident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incidentData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create incident: ${response.statusText}`);
    }

    return response.json();
  }

  // Get all cities with active streams
  async getActiveCities(): Promise<{
    cities: Array<{
      city: string;
      vehicleCount: number;
      lastUpdate: number;
      activeStreams: number;
    }>;
    totalCities: number;
    totalVehicles: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/live-locations`);

    if (!response.ok) {
      throw new Error(`Failed to fetch active cities: ${response.statusText}`);
    }

    return response.json();
  }

  // Convert LiveVehicle to Car format for the canvas
  convertToCanvasFormat(liveVehicles: LiveVehicle[]): Car[] {
    return liveVehicles.map(vehicle => ({
      id: vehicle.id,
      x: vehicle.x,
      y: vehicle.y,
      dir: vehicle.direction,
      speed: vehicle.speed,
      targetIntersectionId: null,
      state: vehicle.speed > 0.5 ? 'MOVING' : 'STOPPED',
      type: vehicle.type,
      width: this.getVehicleWidth(vehicle.type),
      length: this.getVehicleLength(vehicle.type),
      mission: vehicle.mission,
      isBrokenDown: vehicle.isBrokenDown,
    }));
  }

  // Helper methods for vehicle dimensions
  private getVehicleWidth(type: VehicleType): number {
    switch (type) {
      case 'BUS':
        return 20 * 1.3;
      case 'POLICE':
        return 20 * 0.7;
      case 'AUTO':
        return 20 * 0.7;
      default:
        return 20 * 0.6;
    }
  }

  private getVehicleLength(type: VehicleType): number {
    switch (type) {
      case 'BUS':
        return 20 * 3.5;
      case 'POLICE':
        return 20 * 1.5;
      case 'AUTO':
        return 20 * 0.8;
      default:
        return 20;
    }
  }

  // Check if the service is available
  async healthCheck(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (response.ok) {
        return { available: true };
      } else {
        return { available: false, error: `Server returned ${response.status}` };
      }
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const liveLocationsService = new LiveLocationsService();
export type { LiveVehicle, LiveLocationStats, LiveLocationResponse };