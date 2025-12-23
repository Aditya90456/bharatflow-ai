import { UserLocation } from '../types';

export interface GpsOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export interface GpsError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
}

export class RealGpsService {
  private watchId: number | null = null;
  private callbacks: Array<(location: UserLocation) => void> = [];
  private errorCallbacks: Array<(error: GpsError) => void> = [];
  private isWatching = false;
  private lastKnownLocation: UserLocation | null = null;

  constructor() {
    this.checkGpsSupport();
  }

  // Check if GPS is supported
  private checkGpsSupport(): boolean {
    return 'geolocation' in navigator;
  }

  // Get current position once
  async getCurrentPosition(options: GpsOptions = {}): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!this.checkGpsSupport()) {
        reject(this.createError(0, 'Geolocation not supported', 'NOT_SUPPORTED'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = this.convertToUserLocation(position);
          this.lastKnownLocation = location;
          resolve(location);
        },
        (error) => {
          reject(this.convertGeolocationError(error));
        },
        defaultOptions
      );
    });
  }

  // Start watching position changes
  startWatching(options: GpsOptions = {}): void {
    if (!this.checkGpsSupport()) {
      this.notifyError(this.createError(0, 'Geolocation not supported', 'NOT_SUPPORTED'));
      return;
    }

    if (this.isWatching) {
      console.warn('GPS watching already started');
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 5000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = this.convertToUserLocation(position);
        this.lastKnownLocation = location;
        this.notifyLocationUpdate(location);
      },
      (error) => {
        this.notifyError(this.convertGeolocationError(error));
      },
      defaultOptions
    );

    this.isWatching = true;
    console.log('GPS watching started');
  }

  // Stop watching position changes
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
      console.log('GPS watching stopped');
    }
  }

  // Subscribe to location updates
  onLocationUpdate(callback: (location: UserLocation) => void): () => void {
    this.callbacks.push(callback);
    
    // Send last known location immediately if available
    if (this.lastKnownLocation) {
      callback(this.lastKnownLocation);
    }
    
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to GPS errors
  onError(callback: (error: GpsError) => void): () => void {
    this.errorCallbacks.push(callback);
    
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Get last known location
  getLastKnownLocation(): UserLocation | null {
    return this.lastKnownLocation;
  }

  // Check if currently watching
  isCurrentlyWatching(): boolean {
    return this.isWatching;
  }

  // Request permission explicitly (for better UX)
  async requestPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      throw new Error('Permissions API not supported');
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch (error) {
      console.warn('Permission query failed:', error);
      // Fallback: try to get position to trigger permission prompt
      try {
        await this.getCurrentPosition({ timeout: 1000 });
        return 'granted';
      } catch {
        return 'denied';
      }
    }
  }

  // Calculate distance between two locations (Haversine formula)
  calculateDistance(loc1: UserLocation, loc2: UserLocation): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Calculate speed between two locations
  calculateSpeed(loc1: UserLocation, loc2: UserLocation): number {
    const distance = this.calculateDistance(loc1, loc2);
    const timeDiff = (loc2.timestamp - loc1.timestamp) / 1000; // seconds
    
    if (timeDiff <= 0) return 0;
    
    return (distance / timeDiff) * 3.6; // Convert m/s to km/h
  }

  // Calculate bearing between two locations
  calculateBearing(loc1: UserLocation, loc2: UserLocation): number {
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360; // Convert to degrees
  }

  // Convert GeolocationPosition to UserLocation
  private convertToUserLocation(position: GeolocationPosition): UserLocation {
    return {
      id: 'gps-' + Date.now(),
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp || Date.now(),
      speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
      heading: position.coords.heading ?? undefined,
      altitude: position.coords.altitude ?? undefined
    };
  }

  // Convert GeolocationPositionError to GpsError
  private convertGeolocationError(error: GeolocationPositionError): GpsError {
    const errorTypes: Record<number, GpsError['type']> = {
      1: 'PERMISSION_DENIED',
      2: 'POSITION_UNAVAILABLE',
      3: 'TIMEOUT'
    };

    return this.createError(
      error.code,
      error.message,
      errorTypes[error.code] || 'POSITION_UNAVAILABLE'
    );
  }

  // Create standardized error
  private createError(code: number, message: string, type: GpsError['type']): GpsError {
    return { code, message, type };
  }

  // Notify all location callbacks
  private notifyLocationUpdate(location: UserLocation): void {
    this.callbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Location callback error:', error);
      }
    });
  }

  // Notify all error callbacks
  private notifyError(error: GpsError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error callback error:', err);
      }
    });
  }

  // Cleanup resources
  destroy(): void {
    this.stopWatching();
    this.callbacks = [];
    this.errorCallbacks = [];
    this.lastKnownLocation = null;
  }

  // Get GPS status information
  getStatus(): {
    supported: boolean;
    watching: boolean;
    lastUpdate: number | null;
    accuracy: number | null;
  } {
    return {
      supported: this.checkGpsSupport(),
      watching: this.isWatching,
      lastUpdate: this.lastKnownLocation?.timestamp || null,
      accuracy: this.lastKnownLocation?.accuracy || null
    };
  }
}

// Export singleton instance
export const realGpsService = new RealGpsService();