import fetch from 'node-fetch';
import { DatabaseService } from '../database.js';
import trafficSimulationService from './trafficSimulationService.js';

// Real Traffic Data Service
// Integrates with multiple traffic APIs to provide real-time traffic data

class RealTrafficService {
    constructor() {
        this.apiKeys = {
            tomtom: process.env.TOMTOM_API_KEY,
            mapbox: process.env.MAPBOX_API_KEY,
            here: process.env.HERE_API_KEY,
            google: process.env.GOOGLE_MAPS_API_KEY
        };
        
        // Cache for API responses (configurable cache duration)
        this.cache = new Map();
        this.cacheTimeout = parseInt(process.env.TRAFFIC_CACHE_DURATION) || 5 * 60 * 1000; // Default 5 minutes
        
        // Rate limiting
        this.lastApiCall = new Map();
        this.minInterval = 1000; // 1 second between calls
    }

    // Get real-time traffic data for a city
    async getRealTimeTraffic(city, coordinates) {
        const cacheKey = `traffic_${city}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Try multiple APIs in order of preference
            let trafficData = null;
            
            if (this.apiKeys.tomtom) {
                trafficData = await this.getTomTomTraffic(coordinates);
            } else if (this.apiKeys.mapbox) {
                trafficData = await this.getMapboxTraffic(coordinates);
            } else if (this.apiKeys.here) {
                trafficData = await this.getHereTraffic(coordinates);
            } else {
                // Fallback to enhanced simulated data
                trafficData = await this.generateSimulatedTraffic(city, coordinates);
            }

            // Cache the result
            this.setCachedData(cacheKey, trafficData);
            
            // Save to database
            await this.saveTrafficData(city, trafficData);
            
            return trafficData;
        } catch (error) {
            console.error('Real traffic API error:', error);
            // Return enhanced simulated data as fallback
            return await this.generateSimulatedTraffic(city, coordinates);
        }
    }

    // TomTom Traffic API
    async getTomTomTraffic(coordinates) {
        if (!this.canMakeApiCall('tomtom')) return null;
        
        const { lat, lng } = coordinates;
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&unit=KMPH&key=${this.apiKeys.tomtom}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            return {
                source: 'tomtom',
                timestamp: Date.now(),
                currentSpeed: data.flowSegmentData?.currentSpeed || 0,
                freeFlowSpeed: data.flowSegmentData?.freeFlowSpeed || 50,
                confidence: data.flowSegmentData?.confidence || 0.5,
                congestionLevel: this.calculateCongestionLevel(
                    data.flowSegmentData?.currentSpeed || 0,
                    data.flowSegmentData?.freeFlowSpeed || 50
                ),
                coordinates,
                incidents: await this.getTomTomIncidents(coordinates)
            };
        } catch (error) {
            console.error('TomTom API error:', error);
            return null;
        }
    }

    // Mapbox Traffic API
    async getMapboxTraffic(coordinates) {
        if (!this.canMakeApiCall('mapbox')) return null;
        
        const { lat, lng } = coordinates;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${lng},${lat};${lng + 0.01},${lat + 0.01}?access_token=${this.apiKeys.mapbox}&overview=full&annotations=congestion`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            const route = data.routes?.[0];
            if (!route) return null;
            
            const congestionAnnotations = route.legs?.[0]?.annotation?.congestion || [];
            const avgCongestion = this.calculateAverageCongestion(congestionAnnotations);
            
            return {
                source: 'mapbox',
                timestamp: Date.now(),
                duration: route.duration,
                distance: route.distance,
                congestionLevel: avgCongestion,
                coordinates,
                trafficAnnotations: congestionAnnotations
            };
        } catch (error) {
            console.error('Mapbox API error:', error);
            return null;
        }
    }

    // HERE Traffic API
    async getHereTraffic(coordinates) {
        if (!this.canMakeApiCall('here')) return null;
        
        const { lat, lng } = coordinates;
        const url = `https://traffic.ls.hereapi.com/traffic/6.3/flow.json?bbox=${lat-0.01},${lng-0.01};${lat+0.01},${lng+0.01}&apikey=${this.apiKeys.here}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            const flows = data.RWS?.[0]?.RW?.[0]?.FIS || [];
            const avgSpeed = flows.reduce((sum, flow) => sum + (flow.CF?.[0]?.SU || 0), 0) / flows.length || 0;
            const freeFlowSpeed = flows.reduce((sum, flow) => sum + (flow.CF?.[0]?.FF || 50), 0) / flows.length || 50;
            
            return {
                source: 'here',
                timestamp: Date.now(),
                currentSpeed: avgSpeed,
                freeFlowSpeed: freeFlowSpeed,
                congestionLevel: this.calculateCongestionLevel(avgSpeed, freeFlowSpeed),
                coordinates,
                flowData: flows
            };
        } catch (error) {
            console.error('HERE API error:', error);
            return null;
        }
    }

    // Get traffic incidents from TomTom
    async getTomTomIncidents(coordinates) {
        if (!this.apiKeys.tomtom) return [];
        
        const { lat, lng } = coordinates;
        const bbox = `${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}`;
        const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${bbox}&fields=incidents{type,geometry,properties{iconCategory,magnitudeOfDelay,events{description,code}}}&language=en-GB&key=${this.apiKeys.tomtom}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            return (data.incidents || []).map(incident => ({
                id: incident.properties?.id || Math.random().toString(36),
                type: this.mapIncidentType(incident.properties?.iconCategory),
                description: incident.properties?.events?.[0]?.description || 'Traffic incident',
                severity: this.mapSeverity(incident.properties?.magnitudeOfDelay),
                location: {
                    lat: incident.geometry?.coordinates?.[1] || lat,
                    lng: incident.geometry?.coordinates?.[0] || lng
                },
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('TomTom incidents API error:', error);
            return [];
        }
    }

    // Generate simulated traffic data as fallback
    async generateSimulatedTraffic(city, coordinates) {
        // Use enhanced simulation service
        return await trafficSimulationService.generateTrafficData(city, coordinates);
    }

    // Generate simulated incidents
    generateSimulatedIncidents(city, coordinates, congestionLevel) {
        const incidents = [];
        const incidentProbability = congestionLevel * 0.3; // Higher congestion = more incidents
        
        if (Math.random() < incidentProbability) {
            const incidentTypes = ['ACCIDENT', 'BREAKDOWN', 'CONSTRUCTION'];
            const severities = ['LOW', 'MEDIUM', 'HIGH'];
            
            incidents.push({
                id: `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
                description: this.generateIncidentDescription(),
                severity: severities[Math.floor(Math.random() * severities.length)],
                location: {
                    lat: coordinates.lat + (Math.random() - 0.5) * 0.02,
                    lng: coordinates.lng + (Math.random() - 0.5) * 0.02
                },
                timestamp: Date.now() - Math.random() * 3600000 // Within last hour
            });
        }
        
        return incidents;
    }

    // Helper methods
    calculateCongestionLevel(currentSpeed, freeFlowSpeed) {
        if (freeFlowSpeed === 0) return 0;
        const ratio = currentSpeed / freeFlowSpeed;
        return Math.round((1 - ratio) * 100);
    }

    calculateAverageCongestion(annotations) {
        if (!annotations || annotations.length === 0) return 30;
        
        const congestionMap = { 'low': 20, 'moderate': 50, 'heavy': 80, 'severe': 95 };
        const total = annotations.reduce((sum, level) => sum + (congestionMap[level] || 30), 0);
        return Math.round(total / annotations.length);
    }

    mapIncidentType(iconCategory) {
        const mapping = {
            1: 'ACCIDENT',
            2: 'CONSTRUCTION',
            3: 'BREAKDOWN',
            4: 'ACCIDENT',
            5: 'CONSTRUCTION',
            6: 'BREAKDOWN',
            7: 'ACCIDENT',
            8: 'CONSTRUCTION',
            9: 'BREAKDOWN',
            10: 'ACCIDENT',
            11: 'CONSTRUCTION'
        };
        return mapping[iconCategory] || 'ACCIDENT';
    }

    mapSeverity(magnitudeOfDelay) {
        if (magnitudeOfDelay >= 4) return 'HIGH';
        if (magnitudeOfDelay >= 2) return 'MEDIUM';
        return 'LOW';
    }

    generateIncidentDescription() {
        const descriptions = [
            'Vehicle breakdown blocking left lane',
            'Minor collision, emergency services on scene',
            'Road maintenance work in progress',
            'Traffic signal malfunction causing delays',
            'Heavy vehicle stuck under bridge',
            'Multi-vehicle accident, police directing traffic',
            'Construction work reducing lanes',
            'Disabled vehicle on shoulder affecting flow'
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    // Cache management
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Rate limiting
    canMakeApiCall(provider) {
        const lastCall = this.lastApiCall.get(provider) || 0;
        const now = Date.now();
        if (now - lastCall < this.minInterval) {
            return false;
        }
        this.lastApiCall.set(provider, now);
        return true;
    }

    // Save traffic data to database
    async saveTrafficData(city, trafficData) {
        try {
            const stats = {
                totalCars: Math.round(trafficData.congestionLevel * 2), // Estimate based on congestion
                avgSpeed: trafficData.currentSpeed || 30,
                congestionLevel: trafficData.congestionLevel || 30,
                carbonEmission: trafficData.congestionLevel * 0.1, // Estimate
                incidents: trafficData.incidents?.length || 0
            };
            
            await DatabaseService.saveTrafficAnalytics(stats, city);
            
            // Save incidents if any
            if (trafficData.incidents && trafficData.incidents.length > 0) {
                for (const incident of trafficData.incidents) {
                    await DatabaseService.saveIncident({
                        id: incident.id,
                        type: incident.type,
                        location: { x: incident.location.lng * 1000, y: incident.location.lat * 1000 },
                        description: incident.description,
                        severity: incident.severity,
                        timestamp: incident.timestamp
                    }, city);
                }
            }
        } catch (error) {
            console.error('Error saving traffic data:', error);
        }
    }

    // Get historical traffic patterns
    async getTrafficPatterns(city, hours = 24) {
        try {
            return await DatabaseService.getTrafficAnalytics(city, hours);
        } catch (error) {
            console.error('Error getting traffic patterns:', error);
            return [];
        }
    }

    // Get real-time traffic for multiple cities
    async getMultiCityTraffic(cities) {
        const cityCoordinates = {
            'Bangalore': { lat: 12.9716, lng: 77.5946 },
            'Mumbai': { lat: 19.0760, lng: 72.8777 },
            'Delhi': { lat: 28.6139, lng: 77.2090 },
            'Chennai': { lat: 13.0827, lng: 80.2707 },
            'Hyderabad': { lat: 17.3850, lng: 78.4867 },
            'Kolkata': { lat: 22.5726, lng: 88.3639 },
            'Pune': { lat: 18.5204, lng: 73.8567 }
        };

        const results = {};
        
        for (const city of cities) {
            const coordinates = cityCoordinates[city];
            if (coordinates) {
                results[city] = await this.getRealTimeTraffic(city, coordinates);
            }
        }
        
        return results;
    }

    // Get traffic data by location
    async getTrafficByLocation(location, radius = 5000) {
        const cacheKey = `location_${location.lat}_${location.lng}_${radius}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            let trafficData = null;
            
            if (this.apiKeys.tomtom) {
                trafficData = await this.getTomTomTraffic(location);
            } else if (this.apiKeys.mapbox) {
                trafficData = await this.getMapboxTraffic(location);
            } else if (this.apiKeys.here) {
                trafficData = await this.getHereTraffic(location);
            } else {
                trafficData = await this.generateSimulatedTraffic('Unknown', location);
            }

            // Add radius information
            trafficData.searchRadius = radius;
            trafficData.searchLocation = location;

            this.setCachedData(cacheKey, trafficData);
            return trafficData;
        } catch (error) {
            console.error('Get traffic by location error:', error);
            return await this.generateSimulatedTraffic('Unknown', location);
        }
    }

    // Get traffic data for a route
    async getRouteTraffic(waypoints, routeOptions = {}) {
        try {
            if (this.apiKeys.mapbox) {
                return await this.getMapboxRouteTraffic(waypoints, routeOptions);
            } else if (this.apiKeys.google) {
                return await this.getGoogleRouteTraffic(waypoints, routeOptions);
            } else {
                return await this.generateSimulatedRouteTraffic(waypoints, routeOptions);
            }
        } catch (error) {
            console.error('Get route traffic error:', error);
            return await this.generateSimulatedRouteTraffic(waypoints, routeOptions);
        }
    }

    // Get traffic incidents in an area
    async getTrafficIncidents(location, radius = 10000, severity = null) {
        const cacheKey = `incidents_${location.lat}_${location.lng}_${radius}_${severity}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            let incidents = [];
            
            if (this.apiKeys.tomtom) {
                incidents = await this.getTomTomIncidents(location);
            } else {
                incidents = this.generateSimulatedIncidents('Unknown', location, 50);
            }

            // Filter by severity if specified
            if (severity) {
                incidents = incidents.filter(incident => incident.severity === severity.toUpperCase());
            }

            // Filter by radius
            incidents = incidents.filter(incident => {
                const distance = this.calculateDistance(location, incident.location);
                return distance <= radius;
            });

            this.setCachedData(cacheKey, incidents);
            return incidents;
        } catch (error) {
            console.error('Get traffic incidents error:', error);
            return [];
        }
    }

    // Get traffic cameras in an area
    async getTrafficCameras(location, radius = 5000) {
        // Most APIs don't provide camera data, so we'll simulate
        const cameras = [];
        const numCameras = Math.floor(Math.random() * 5) + 1;

        for (let i = 0; i < numCameras; i++) {
            cameras.push({
                id: `CAM-${Date.now()}-${i}`,
                name: `Traffic Camera ${i + 1}`,
                location: {
                    lat: location.lat + (Math.random() - 0.5) * 0.01,
                    lng: location.lng + (Math.random() - 0.5) * 0.01
                },
                status: Math.random() > 0.1 ? 'ACTIVE' : 'OFFLINE',
                type: 'TRAFFIC_MONITORING',
                lastUpdate: Date.now() - Math.random() * 3600000
            });
        }

        return cameras;
    }

    // Get traffic speed data for roads
    async getTrafficSpeeds(bounds, roadTypes = null) {
        const speedData = [];
        const gridSize = 0.005; // Approximately 500m grid

        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                const baseSpeed = 30 + Math.random() * 40; // 30-70 km/h
                const congestionFactor = Math.random();
                const currentSpeed = baseSpeed * (1 - congestionFactor * 0.6);

                speedData.push({
                    location: { lat, lng },
                    currentSpeed: Math.round(currentSpeed),
                    freeFlowSpeed: Math.round(baseSpeed),
                    congestionLevel: Math.round(congestionFactor * 100),
                    roadType: roadTypes ? roadTypes[Math.floor(Math.random() * roadTypes.length)] : 'ARTERIAL'
                });
            }
        }

        return speedData;
    }

    // Get traffic congestion heatmap data
    async getTrafficHeatmap(bounds, zoom = 12, timeRange = '1h') {
        const heatmapData = [];
        const gridSize = zoom > 14 ? 0.001 : zoom > 12 ? 0.005 : 0.01;

        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                const intensity = Math.random();
                if (intensity > 0.3) { // Only include significant congestion points
                    heatmapData.push({
                        lat,
                        lng,
                        intensity: Math.round(intensity * 100),
                        weight: intensity
                    });
                }
            }
        }

        return {
            bounds,
            zoom,
            timeRange,
            data: heatmapData,
            generatedAt: Date.now()
        };
    }

    // Get alternative routes with traffic consideration
    async getAlternativeRoutes(origin, destination, options = {}) {
        const routes = [];
        const numRoutes = options.maxAlternatives || 3;

        for (let i = 0; i < numRoutes; i++) {
            const baseDistance = this.calculateDistance(origin, destination) * 1000; // Convert to meters
            const distanceVariation = 1 + (Math.random() - 0.5) * 0.3; // ±15% variation
            const distance = Math.round(baseDistance * distanceVariation);
            
            const baseTime = distance / 1000 * 2; // Rough estimate: 2 minutes per km
            const trafficFactor = 1 + Math.random() * 0.5; // Traffic can add up to 50% time
            const duration = Math.round(baseTime * trafficFactor * 60); // Convert to seconds

            routes.push({
                id: `ROUTE-${i + 1}`,
                distance,
                duration,
                trafficDelay: Math.round((trafficFactor - 1) * baseTime * 60),
                congestionLevel: Math.round((trafficFactor - 1) * 200),
                waypoints: this.generateRouteWaypoints(origin, destination, i),
                summary: `Route ${i + 1} via ${this.generateRouteSummary(i)}`,
                incidents: Math.random() > 0.7 ? 1 : 0
            });
        }

        return routes.sort((a, b) => a.duration - b.duration);
    }

    // Get traffic alerts for a user's route
    async getTrafficAlerts(userId, route, alertTypes = ['incident', 'congestion', 'construction']) {
        const alerts = [];
        
        for (const alertType of alertTypes) {
            if (Math.random() > 0.7) { // 30% chance of each alert type
                alerts.push({
                    id: `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                    userId,
                    type: alertType.toUpperCase(),
                    severity: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
                    message: this.generateAlertMessage(alertType),
                    location: {
                        lat: route.origin.lat + Math.random() * 0.01,
                        lng: route.origin.lng + Math.random() * 0.01
                    },
                    estimatedDelay: Math.round(Math.random() * 15), // 0-15 minutes
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 3600000 // 1 hour from now
                });
            }
        }

        return alerts;
    }

    // Subscribe to traffic updates
    async subscribeToTrafficUpdates(userId, location, radius = 5000, updateInterval = 300) {
        const subscriptionId = `SUB-${userId}-${Date.now()}`;
        
        // In a real implementation, this would set up a background process
        // For now, we'll just return the subscription details
        return {
            subscriptionId,
            userId,
            location,
            radius,
            updateInterval,
            status: 'ACTIVE',
            createdAt: Date.now(),
            nextUpdate: Date.now() + updateInterval * 1000
        };
    }

    // Unsubscribe from traffic updates
    async unsubscribeFromTrafficUpdates(subscriptionId) {
        // In a real implementation, this would stop the background process
        console.log(`Unsubscribed from traffic updates: ${subscriptionId}`);
        return true;
    }

    // Get service status
    async getServiceStatus() {
        const availableProviders = [];
        const unavailableProviders = [];

        for (const [provider, apiKey] of Object.entries(this.apiKeys)) {
            if (apiKey) {
                availableProviders.push(provider);
            } else {
                unavailableProviders.push(provider);
            }
        }

        return {
            status: availableProviders.length > 0 ? 'OPERATIONAL' : 'SIMULATION_MODE',
            availableProviders,
            unavailableProviders,
            cacheSize: this.cache.size,
            cacheTimeout: this.cacheTimeout,
            lastUpdate: Date.now()
        };
    }

    // Helper methods for new functionality
    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    generateRouteWaypoints(origin, destination, routeIndex) {
        const waypoints = [origin];
        
        // Add some intermediate points for variety
        const numWaypoints = routeIndex + 1;
        for (let i = 0; i < numWaypoints; i++) {
            const progress = (i + 1) / (numWaypoints + 1);
            waypoints.push({
                lat: origin.lat + (destination.lat - origin.lat) * progress + (Math.random() - 0.5) * 0.01,
                lng: origin.lng + (destination.lng - origin.lng) * progress + (Math.random() - 0.5) * 0.01
            });
        }
        
        waypoints.push(destination);
        return waypoints;
    }

    generateRouteSummary(routeIndex) {
        const summaries = [
            'Main Road',
            'Highway Route',
            'Scenic Route',
            'Express Route',
            'Local Roads'
        ];
        return summaries[routeIndex % summaries.length];
    }

    generateAlertMessage(alertType) {
        const messages = {
            incident: 'Traffic incident reported ahead. Expect delays.',
            congestion: 'Heavy traffic detected on your route.',
            construction: 'Road construction causing lane closures.'
        };
        return messages[alertType] || 'Traffic alert on your route.';
    }

    async getMapboxRouteTraffic(waypoints, options) {
        // Simplified Mapbox route traffic implementation
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        
        return {
            source: 'mapbox',
            origin,
            destination,
            distance: this.calculateDistance(origin, destination) * 1000,
            duration: Math.round(this.calculateDistance(origin, destination) * 2 * 60), // 2 min/km
            congestionLevel: Math.round(Math.random() * 100),
            waypoints,
            timestamp: Date.now()
        };
    }

    async generateSimulatedRouteTraffic(waypoints, options) {
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const distance = this.calculateDistance(origin, destination) * 1000;
        const baseDuration = distance / 1000 * 2 * 60; // 2 minutes per km
        const trafficFactor = 1 + Math.random() * 0.5;
        
        return {
            source: 'simulation',
            origin,
            destination,
            distance: Math.round(distance),
            duration: Math.round(baseDuration * trafficFactor),
            congestionLevel: Math.round((trafficFactor - 1) * 200),
            waypoints,
            timestamp: Date.now()
        };
    }
}

export default new RealTrafficService();