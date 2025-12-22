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
}

export default new RealTrafficService();