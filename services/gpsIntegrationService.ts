import { UserLocation, SimulatedUser } from '../types';
import { realGpsService } from './realGpsService';

interface Incident {
  id: string;
  type: 'ACCIDENT' | 'CONSTRUCTION' | 'BREAKDOWN' | 'WEATHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  lat: number;
  lng: number;
  radius: number; // meters
  description: string;
  timestamp: number;
  resolved: boolean;
}

interface UserIncidentAlert {
  userId: string;
  incidentId: string;
  distance: number;
  estimatedImpact: {
    delayMinutes: number;
    alternativeRoute?: string;
  };
  alertType: 'APPROACHING' | 'AFFECTED' | 'ALTERNATIVE_SUGGESTED';
  timestamp: number;
}

export class GpsIntegrationService {
  private baseUrl: string;
  private activeIncidents: Map<string, Incident> = new Map();
  private userAlerts: Map<string, UserIncidentAlert[]> = new Map();
  private alertCallbacks: Array<(alert: UserIncidentAlert) => void> = [];

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    this.loadActiveIncidents();
    this.startIncidentMonitoring();
  }

  // Load active incidents from backend
  private async loadActiveIncidents(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/incidents/all`);
      if (response.ok) {
        const incidents = await response.json();
        incidents.forEach((incident: any) => {
          this.activeIncidents.set(incident.id, {
            id: incident.id,
            type: incident.type,
            severity: incident.severity,
            lat: incident.lat,
            lng: incident.lng,
            radius: incident.radius || 500,
            description: incident.description,
            timestamp: incident.timestamp,
            resolved: incident.resolved || false
          });
        });
        console.log(`Loaded ${incidents.length} active incidents`);
      }
    } catch (error) {
      console.error('Failed to load incidents:', error);
    }
  }

  // Start monitoring incidents and user locations
  private startIncidentMonitoring(): void {
    // Monitor GPS location updates
    realGpsService.onLocationUpdate((location) => {
      this.checkUserIncidentProximity(location);
    });

    // Periodically refresh incidents
    setInterval(() => {
      this.loadActiveIncidents();
    }, 30000); // Every 30 seconds
  }

  // Check if user is near any incidents
  private checkUserIncidentProximity(location: UserLocation): void {
    const userId = location.id;
    const userAlerts: UserIncidentAlert[] = [];

    this.activeIncidents.forEach((incident) => {
      if (incident.resolved) return;

      const distance = this.calculateDistance(
        location.lat, location.lng,
        incident.lat, incident.lng
      );

      // Check if user is within incident radius
      if (distance <= incident.radius) {
        const alert: UserIncidentAlert = {
          userId,
          incidentId: incident.id,
          distance,
          estimatedImpact: this.calculateImpact(incident, distance),
          alertType: 'AFFECTED',
          timestamp: Date.now()
        };
        userAlerts.push(alert);
        this.notifyAlert(alert);
      }
      // Check if user is approaching (within 2x radius)
      else if (distance <= incident.radius * 2) {
        const alert: UserIncidentAlert = {
          userId,
          incidentId: incident.id,
          distance,
          estimatedImpact: this.calculateImpact(incident, distance),
          alertType: 'APPROACHING',
          timestamp: Date.now()
        };
        userAlerts.push(alert);
        this.notifyAlert(alert);
      }
    });

    this.userAlerts.set(userId, userAlerts);
  }

  // Calculate impact of incident on user
  private calculateImpact(incident: Incident, distance: number): { delayMinutes: number; alternativeRoute?: string } {
    let delayMinutes = 0;

    // Base delay based on incident type and severity
    const baseDelays = {
      'ACCIDENT': { 'LOW': 5, 'MEDIUM': 15, 'HIGH': 30 },
      'CONSTRUCTION': { 'LOW': 3, 'MEDIUM': 8, 'HIGH': 20 },
      'BREAKDOWN': { 'LOW': 2, 'MEDIUM': 5, 'HIGH': 10 },
      'WEATHER': { 'LOW': 5, 'MEDIUM': 12, 'HIGH': 25 }
    };

    delayMinutes = baseDelays[incident.type][incident.severity];

    // Adjust based on distance (closer = more delay)
    const distanceFactor = Math.max(0.1, 1 - (distance / incident.radius));
    delayMinutes = Math.round(delayMinutes * distanceFactor);

    return {
      delayMinutes,
      alternativeRoute: delayMinutes > 10 ? 'Alternative route suggested' : undefined
    };
  }

  // Calculate distance between two points (Haversine formula)
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

    return R * c; // Distance in meters
  }

  // Subscribe to incident alerts
  onAlert(callback: (alert: UserIncidentAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  // Notify alert callbacks
  private notifyAlert(alert: UserIncidentAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });
  }

  // Get alerts for a specific user
  getUserAlerts(userId: string): UserIncidentAlert[] {
    return this.userAlerts.get(userId) || [];
  }

  // Get all active incidents
  getActiveIncidents(): Incident[] {
    return Array.from(this.activeIncidents.values()).filter(incident => !incident.resolved);
  }

  // Report a new incident
  async reportIncident(incident: Omit<Incident, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident: {
            ...incident,
            timestamp: Date.now(),
            resolved: false
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const incidentId = `incident-${Date.now()}`;
        
        // Add to local cache
        this.activeIncidents.set(incidentId, {
          id: incidentId,
          ...incident,
          timestamp: Date.now(),
          resolved: false
        });

        console.log('Incident reported successfully:', incidentId);
        return incidentId;
      } else {
        throw new Error(`Failed to report incident: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to report incident:', error);
      throw error;
    }
  }

  // Resolve an incident
  async resolveIncident(incidentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/incidents/${incidentId}/resolve`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local cache
        const incident = this.activeIncidents.get(incidentId);
        if (incident) {
          incident.resolved = true;
          this.activeIncidents.set(incidentId, incident);
        }
        console.log('Incident resolved:', incidentId);
      } else {
        throw new Error(`Failed to resolve incident: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to resolve incident:', error);
      throw error;
    }
  }

  // Get incident statistics
  getIncidentStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    avgResolutionTime: number;
  } {
    const incidents = Array.from(this.activeIncidents.values());
    const stats = {
      total: incidents.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      avgResolutionTime: 0
    };

    incidents.forEach(incident => {
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;
      stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
    });

    return stats;
  }

  // Predict traffic impact based on current incidents
  predictTrafficImpact(userLocation: UserLocation, destinationLat: number, destinationLng: number): {
    estimatedDelay: number;
    affectedIncidents: string[];
    alternativeRouteRecommended: boolean;
  } {
    const affectedIncidents: string[] = [];
    let totalDelay = 0;

    this.activeIncidents.forEach((incident) => {
      if (incident.resolved) return;

      // Check if incident is on the route (simplified check)
      const distanceFromUser = this.calculateDistance(
        userLocation.lat, userLocation.lng,
        incident.lat, incident.lng
      );
      
      const distanceFromDestination = this.calculateDistance(
        destinationLat, destinationLng,
        incident.lat, incident.lng
      );

      // If incident is within reasonable distance of route
      if (distanceFromUser <= incident.radius * 3 || distanceFromDestination <= incident.radius * 3) {
        affectedIncidents.push(incident.id);
        const impact = this.calculateImpact(incident, Math.min(distanceFromUser, distanceFromDestination));
        totalDelay += impact.delayMinutes;
      }
    });

    return {
      estimatedDelay: totalDelay,
      affectedIncidents,
      alternativeRouteRecommended: totalDelay > 15
    };
  }

  // Cleanup resources
  destroy(): void {
    this.activeIncidents.clear();
    this.userAlerts.clear();
    this.alertCallbacks = [];
  }
}

// Export singleton instance
export const gpsIntegrationService = new GpsIntegrationService();