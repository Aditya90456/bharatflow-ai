import { SimulatedUser, UserLocation, LocationSimulationConfig, Coordinates, VehicleType } from '../types';

export class UserLocationSimulation {
  private users: Map<string, SimulatedUser> = new Map();
  private config: LocationSimulationConfig = {
    enabled: true,
    userCount: 1,
    updateInterval: 1000, // 1 second
    movementSpeed: 2, // pixels per frame
    routeVariation: 0.3
  };
  private updateTimer: NodeJS.Timeout | null = null;
  private callbacks: Array<(users: SimulatedUser[]) => void> = [];
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    this.startLocationUpdates();
  }

  // Save user location to backend
  private async saveUserToBackend(user: SimulatedUser): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          lat: user.location.lat,
          lng: user.location.lng,
          accuracy: user.location.accuracy,
          speed: user.location.speed,
          heading: user.location.heading,
          vehicleType: user.vehicleType,
          status: user.status
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to save user ${user.name} to backend: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save user to backend:', error);
    }
  }

  // Update user location in backend
  private async updateUserInBackend(user: SimulatedUser): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user-locations/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: user.location.lat,
          lng: user.location.lng,
          accuracy: user.location.accuracy,
          speed: user.location.speed,
          heading: user.location.heading,
          status: user.status
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to update user ${user.name} in backend: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update user in backend:', error);
    }
  }

  // Load users from backend
  async loadUsersFromBackend(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user-locations`);
      if (!response.ok) {
        console.warn('Failed to load users from backend');
        return;
      }

      const data = await response.json();
      if (data.success && data.userLocations) {
        data.userLocations.forEach((userLocation: any) => {
          const user: SimulatedUser = {
            id: userLocation.userId,
            name: userLocation.name,
            location: {
              id: userLocation.id,
              lat: userLocation.lat,
              lng: userLocation.lng,
              accuracy: userLocation.accuracy || 10,
              timestamp: userLocation.timestamp,
              speed: userLocation.speed,
              heading: userLocation.heading
            },
            vehicleType: userLocation.vehicleType as VehicleType,
            status: userLocation.status as any,
            preferences: {
              avoidTolls: false,
              avoidHighways: false,
              preferFastestRoute: true
            }
          };
          this.users.set(user.id, user);
        });
        
        this.notifyCallbacks();
        console.log(`Loaded ${data.userLocations.length} users from backend`);
      }
    } catch (error) {
      console.error('Failed to load users from backend:', error);
    }
  }

  // Ask user for their information
  async requestUserInfo(): Promise<{ name: string; location: UserLocation }> {
    return new Promise((resolve) => {
      // This would typically be handled by a UI component
      // For now, we'll simulate with default values
      const defaultLocation: UserLocation = {
        id: 'user-location-' + Date.now(),
        lat: 12.9716, // Bangalore default
        lng: 77.5946,
        accuracy: 10,
        timestamp: Date.now(),
        speed: 0,
        heading: 0
      };

      resolve({
        name: 'User',
        location: defaultLocation
      });
    });
  }

  // Add a new user to the simulation
  async addUser(name: string, location: UserLocation, vehicleType: VehicleType = 'CAR'): Promise<SimulatedUser> {
    const user: SimulatedUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      location,
      vehicleType,
      status: 'STOPPED',
      preferences: {
        avoidTolls: false,
        avoidHighways: false,
        preferFastestRoute: true
      }
    };

    this.users.set(user.id, user);
    
    // Save to backend
    await this.saveUserToBackend(user);
    
    this.notifyCallbacks();
    return user;
  }

  // Set destination for a user
  setUserDestination(userId: string, destination: Coordinates): void {
    const user = this.users.get(userId);
    if (user) {
      user.destination = destination;
      user.status = 'MOVING';
      user.route = this.generateRoute(
        { x: user.location.lng, y: user.location.lat },
        destination
      );
      
      if (user.route && user.route.length > 0) {
        user.journey = {
          startTime: Date.now(),
          estimatedArrival: Date.now() + (user.route.length * 1000), // rough estimate
          distanceRemaining: this.calculateDistance(user.route),
          currentSpeed: 0
        };
      }
    }
  }

  // Generate a simple route between two points
  private generateRoute(start: Coordinates, end: Coordinates): Coordinates[] {
    const route: Coordinates[] = [];
    const steps = 20; // Number of waypoints
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = start.x + (end.x - start.x) * progress;
      const y = start.y + (end.y - start.y) * progress;
      
      // Add some variation to make the route more realistic
      const variation = this.config.routeVariation;
      const offsetX = (Math.random() - 0.5) * variation;
      const offsetY = (Math.random() - 0.5) * variation;
      
      route.push({
        x: x + offsetX,
        y: y + offsetY
      });
    }
    
    return route;
  }

  // Calculate total distance of a route
  private calculateDistance(route: Coordinates[]): number {
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const dx = route[i].x - route[i-1].x;
      const dy = route[i].y - route[i-1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }

  // Update user locations
  private updateUserLocations(): void {
    this.users.forEach((user) => {
      if (user.status === 'MOVING' && user.route && user.route.length > 0) {
        // Move user along the route
        const currentPos = { x: user.location.lng, y: user.location.lat };
        const nextWaypoint = user.route[0];
        
        if (nextWaypoint) {
          const dx = nextWaypoint.x - currentPos.x;
          const dy = nextWaypoint.y - currentPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 0.001) { // Close enough to waypoint
            user.route.shift(); // Remove reached waypoint
            
            if (user.route.length === 0) {
              // Reached destination
              user.status = 'ARRIVED';
              if (user.journey) {
                user.journey.distanceRemaining = 0;
                user.journey.currentSpeed = 0;
              }
            }
          } else {
            // Move towards next waypoint
            const moveDistance = this.config.movementSpeed * 0.0001; // Convert to lat/lng scale
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            user.location.lng += moveX;
            user.location.lat += moveY;
            user.location.timestamp = Date.now();
            
            // Update journey info
            if (user.journey) {
              user.journey.currentSpeed = moveDistance * 3600; // Convert to km/h roughly
              user.journey.distanceRemaining = this.calculateDistance(user.route);
            }
          }
        }
      }
    });
    
    this.notifyCallbacks();
  }

  // Start location updates
  private startLocationUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      if (this.config.enabled) {
        this.updateUserLocations();
      }
    }, this.config.updateInterval);
  }

  // Subscribe to location updates
  onLocationUpdate(callback: (users: SimulatedUser[]) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Notify all callbacks
  private notifyCallbacks(): void {
    const users = Array.from(this.users.values());
    this.callbacks.forEach(callback => callback(users));
  }

  // Get all users
  getUsers(): SimulatedUser[] {
    return Array.from(this.users.values());
  }

  // Get user by ID
  getUser(userId: string): SimulatedUser | undefined {
    return this.users.get(userId);
  }

  // Remove user
  removeUser(userId: string): void {
    this.users.delete(userId);
    this.notifyCallbacks();
  }

  // Update configuration
  updateConfig(newConfig: Partial<LocationSimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.updateInterval) {
      this.startLocationUpdates();
    }
  }

  // Get configuration
  getConfig(): LocationSimulationConfig {
    return { ...this.config };
  }

  // Convert lat/lng to canvas coordinates
  latLngToCanvas(lat: number, lng: number, canvasWidth: number, canvasHeight: number): Coordinates {
    // Simple conversion - in a real app, you'd use proper map projection
    const x = ((lng + 180) / 360) * canvasWidth;
    const y = ((90 - lat) / 180) * canvasHeight;
    return { x, y };
  }

  // Convert canvas coordinates to lat/lng
  canvasToLatLng(x: number, y: number, canvasWidth: number, canvasHeight: number): { lat: number; lng: number } {
    const lng = (x / canvasWidth) * 360 - 180;
    const lat = 90 - (y / canvasHeight) * 180;
    return { lat, lng };
  }

  // Simulate user at random location in city
  async addRandomUser(cityName: string): Promise<SimulatedUser> {
    const cityBounds = this.getCityBounds(cityName);
    const randomLat = cityBounds.minLat + Math.random() * (cityBounds.maxLat - cityBounds.minLat);
    const randomLng = cityBounds.minLng + Math.random() * (cityBounds.maxLng - cityBounds.minLng);
    
    const location: UserLocation = {
      id: 'random-location-' + Date.now(),
      lat: randomLat,
      lng: randomLng,
      accuracy: Math.random() * 20 + 5, // 5-25 meters
      timestamp: Date.now(),
      speed: Math.random() * 60, // 0-60 km/h
      heading: Math.random() * 360
    };

    const names = ['Raj', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anita', 'Rohit', 'Kavya'];
    const vehicleTypes: VehicleType[] = ['CAR', 'AUTO', 'BUS'];
    
    return await this.addUser(
      names[Math.floor(Math.random() * names.length)],
      location,
      vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
    );
  }

  // Get city bounds for simulation
  private getCityBounds(cityName: string) {
    const bounds = {
      'Bangalore': { minLat: 12.8, maxLat: 13.1, minLng: 77.4, maxLng: 77.8 },
      'Mumbai': { minLat: 19.0, maxLat: 19.3, minLng: 72.7, maxLng: 73.0 },
      'Delhi': { minLat: 28.4, maxLat: 28.8, minLng: 76.8, maxLng: 77.3 },
      'Chennai': { minLat: 12.9, maxLat: 13.2, minLng: 80.1, maxLng: 80.3 },
      'Hyderabad': { minLat: 17.2, maxLat: 17.6, minLng: 78.2, maxLng: 78.6 },
      'Kolkata': { minLat: 22.4, maxLat: 22.7, minLng: 88.2, maxLng: 88.5 },
      'Pune': { minLat: 18.4, maxLat: 18.7, minLng: 73.7, maxLng: 74.0 }
    };
    
    return bounds[cityName as keyof typeof bounds] || bounds['Bangalore'];
  }

  // Cleanup
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.users.clear();
    this.callbacks = [];
  }
}

// Export singleton instance
export const userLocationSimulation = new UserLocationSimulation();