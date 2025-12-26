import fetch from 'node-fetch';
import { DatabaseService } from '../database.js';

// GPS API Integration Service
class GPSApiService {
    constructor() {
        // GPS API configurations
        this.apiConfigs = {
            // Google Maps GPS API
            google: {
                baseUrl: 'https://maps.googleapis.com/maps/api',
                apiKey: process.env.GOOGLE_MAPS_API_KEY,
                endpoints: {
                    geocoding: '/geocode/json',
                    directions: '/directions/json',
                    places: '/place/nearbysearch/json',
                    roads: '/roads/v1/nearestRoads'
                }
            },
            // HERE GPS API
            here: {
                baseUrl: 'https://geocoder.ls.hereapi.com/6.2',
                apiKey: process.env.HERE_API_KEY,
                endpoints: {
                    geocoding: '/geocode.json',
                    reverse: '/reversegeocode.json',
                    routing: '/routing/7.2/calculateroute.json'
                }
            },
            // MapBox GPS API
            mapbox: {
                baseUrl: 'https://api.mapbox.com',
                apiKey: process.env.MAPBOX_API_KEY,
                endpoints: {
                    geocoding: '/geocoding/v5/mapbox.places',
                    directions: '/directions/v5/mapbox/driving-traffic',
                    matrix: '/directions-matrix/v1/mapbox/driving-traffic'
                }
            }
        };

        // GPS data cache
        this.gpsCache = new Map();
        this.cacheTimeout = 30 * 1000; // 30 seconds for GPS data

        // Active GPS tracking sessions
        this.trackingSessions = new Map();
        
        // GPS accuracy thresholds
        this.accuracyThresholds = {
            HIGH: 10,    // < 10 meters
            MEDIUM: 50,  // 10-50 meters
            LOW: 100     // 50-100 meters
        };
    }

    // Get current GPS location with high accuracy
    async getCurrentLocation(deviceId, options = {}) {
        try {
            const {
                enableHighAccuracy = true,
                timeout = 10000,
                maximumAge = 30000,
                provider = 'auto'
            } = options;

            // For web-based GPS, we'll simulate or use browser geolocation
            // In a real implementation, this would interface with device GPS
            const location = await this.getDeviceLocation(deviceId, {
                enableHighAccuracy,
                timeout,
                maximumAge
            });

            // Enhance location with additional GPS data
            const enhancedLocation = await this.enhanceLocationData(location, provider);

            // Save to database
            await this.saveGPSLocation(deviceId, enhancedLocation);

            return enhancedLocation;

        } catch (error) {
            console.error('GPS location error:', error);
            throw new Error(`Failed to get GPS location: ${error.message}`);
        }
    }

    // Simulate device GPS location (in real app, this would use actual GPS APIs)
    async getDeviceLocation(deviceId, options) {
        // Check cache first
        const cacheKey = `gps_${deviceId}`;
        const cached = this.getCachedLocation(cacheKey);
        if (cached && options.maximumAge && Date.now() - cached.timestamp < options.maximumAge) {
            return cached;
        }

        // Simulate GPS coordinates for Indian cities (in real app, use actual GPS)
        const indianCities = {
            'device-bangalore': { lat: 12.9716, lng: 77.5946 },
            'device-mumbai': { lat: 19.0760, lng: 72.8777 },
            'device-delhi': { lat: 28.6139, lng: 77.2090 },
            'device-chennai': { lat: 13.0827, lng: 80.2707 },
            'device-hyderabad': { lat: 17.3850, lng: 78.4867 }
        };

        const baseLocation = indianCities[deviceId] || { lat: 12.9716, lng: 77.5946 };
        
        // Add some realistic GPS variation
        const location = {
            latitude: baseLocation.lat + (Math.random() - 0.5) * 0.01,
            longitude: baseLocation.lng + (Math.random() - 0.5) * 0.01,
            accuracy: options.enableHighAccuracy ? 
                Math.random() * 15 + 3 : // 3-18 meters for high accuracy
                Math.random() * 50 + 10,  // 10-60 meters for normal accuracy
            altitude: Math.random() * 100 + 500, // 500-600 meters
            altitudeAccuracy: Math.random() * 10 + 5,
            heading: Math.random() * 360,
            speed: Math.random() * 60, // 0-60 km/h
            timestamp: Date.now()
        };

        this.setCachedLocation(cacheKey, location);
        return location;
    }

    // Enhance location data with additional GPS information
    async enhanceLocationData(location, provider = 'auto') {
        try {
            // Choose best available provider
            const selectedProvider = this.selectBestProvider(provider);
            
            // Get reverse geocoding information
            const addressInfo = await this.reverseGeocode(
                location.latitude, 
                location.longitude, 
                selectedProvider
            );

            // Get nearby roads and landmarks
            const nearbyInfo = await this.getNearbyRoadsAndLandmarks(
                location.latitude,
                location.longitude,
                selectedProvider
            );

            // Calculate GPS quality metrics
            const qualityMetrics = this.calculateGPSQuality(location);

            return {
                ...location,
                address: addressInfo,
                nearby: nearbyInfo,
                quality: qualityMetrics,
                provider: selectedProvider,
                enhancedAt: Date.now()
            };

        } catch (error) {
            console.error('Location enhancement error:', error);
            // Return basic location if enhancement fails
            return {
                ...location,
                address: { formatted: 'Unknown location' },
                nearby: { roads: [], landmarks: [] },
                quality: this.calculateGPSQuality(location),
                provider: 'fallback'
            };
        }
    }

    // Reverse geocoding to get address from coordinates
    async reverseGeocode(lat, lng, provider = 'google') {
        const cacheKey = `geocode_${lat.toFixed(4)}_${lng.toFixed(4)}_${provider}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            let addressData;

            switch (provider) {
                case 'google':
                    addressData = await this.googleReverseGeocode(lat, lng);
                    break;
                case 'here':
                    addressData = await this.hereReverseGeocode(lat, lng);
                    break;
                case 'mapbox':
                    addressData = await this.mapboxReverseGeocode(lat, lng);
                    break;
                default:
                    addressData = await this.fallbackReverseGeocode(lat, lng);
            }

            this.setCachedData(cacheKey, addressData);
            return addressData;

        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return this.fallbackReverseGeocode(lat, lng);
        }
    }

    // Google Maps reverse geocoding
    async googleReverseGeocode(lat, lng) {
        if (!this.apiConfigs.google.apiKey) {
            throw new Error('Google Maps API key not configured');
        }

        const url = `${this.apiConfigs.google.baseUrl}${this.apiConfigs.google.endpoints.geocoding}?latlng=${lat},${lng}&key=${this.apiConfigs.google.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            return {
                formatted: result.formatted_address,
                components: this.parseGoogleAddressComponents(result.address_components),
                placeId: result.place_id,
                types: result.types
            };
        }

        throw new Error('Google geocoding failed');
    }

    // HERE reverse geocoding
    async hereReverseGeocode(lat, lng) {
        if (!this.apiConfigs.here.apiKey) {
            throw new Error('HERE API key not configured');
        }

        const url = `${this.apiConfigs.here.baseUrl}${this.apiConfigs.here.endpoints.reverse}?prox=${lat},${lng}&mode=retrieveAddresses&maxresults=1&apikey=${this.apiConfigs.here.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response && data.Response.View.length > 0) {
            const result = data.Response.View[0].Result[0];
            const location = result.Location;
            
            return {
                formatted: location.Address.Label,
                components: this.parseHereAddressComponents(location.Address),
                locationId: location.LocationId,
                relevance: result.Relevance
            };
        }

        throw new Error('HERE geocoding failed');
    }

    // MapBox reverse geocoding
    async mapboxReverseGeocode(lat, lng) {
        if (!this.apiConfigs.mapbox.apiKey) {
            throw new Error('MapBox API key not configured');
        }

        const url = `${this.apiConfigs.mapbox.baseUrl}${this.apiConfigs.mapbox.endpoints.geocoding}/${lng},${lat}.json?access_token=${this.apiConfigs.mapbox.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
                formatted: feature.place_name,
                components: this.parseMapboxAddressComponents(feature),
                id: feature.id,
                relevance: feature.relevance
            };
        }

        throw new Error('MapBox geocoding failed');
    }

    // Get nearby roads and landmarks
    async getNearbyRoadsAndLandmarks(lat, lng, provider = 'google') {
        try {
            const [roads, landmarks] = await Promise.all([
                this.getNearbyRoads(lat, lng, provider),
                this.getNearbyLandmarks(lat, lng, provider)
            ]);

            return { roads, landmarks };
        } catch (error) {
            console.error('Nearby info error:', error);
            return { roads: [], landmarks: [] };
        }
    }

    // Get nearby roads
    async getNearbyRoads(lat, lng, provider) {
        // Simulate nearby roads (in real implementation, use actual APIs)
        const indianRoads = [
            'MG Road', 'Brigade Road', 'Commercial Street', 'Residency Road',
            'Outer Ring Road', 'Inner Ring Road', 'Hosur Road', 'Bannerghatta Road',
            'Whitefield Road', 'Electronic City Flyover'
        ];

        return indianRoads.slice(0, Math.floor(Math.random() * 5) + 2).map((road, index) => ({
            name: road,
            distance: Math.random() * 500 + 50, // 50-550 meters
            bearing: Math.random() * 360,
            type: index === 0 ? 'primary' : 'secondary'
        }));
    }

    // Get nearby landmarks
    async getNearbyLandmarks(lat, lng, provider) {
        // Simulate nearby landmarks
        const indianLandmarks = [
            'Metro Station', 'Bus Stop', 'Shopping Mall', 'Hospital', 'School',
            'Temple', 'Park', 'ATM', 'Petrol Pump', 'Restaurant'
        ];

        return indianLandmarks.slice(0, Math.floor(Math.random() * 4) + 1).map(landmark => ({
            name: landmark,
            distance: Math.random() * 1000 + 100, // 100-1100 meters
            category: this.categorizeLandmark(landmark),
            rating: Math.random() * 2 + 3 // 3-5 rating
        }));
    }

    // Start GPS tracking session
    async startTracking(deviceId, options = {}) {
        const {
            interval = 5000, // 5 seconds
            accuracy = 'HIGH',
            saveToDatabase = true,
            callback = null
        } = options;

        if (this.trackingSessions.has(deviceId)) {
            await this.stopTracking(deviceId);
        }

        const trackingSession = {
            deviceId,
            startTime: Date.now(),
            interval,
            accuracy,
            saveToDatabase,
            callback,
            locationCount: 0,
            lastLocation: null
        };

        // Start tracking interval
        const intervalId = setInterval(async () => {
            try {
                const location = await this.getCurrentLocation(deviceId, {
                    enableHighAccuracy: accuracy === 'HIGH',
                    timeout: 5000,
                    maximumAge: interval / 2
                });

                trackingSession.locationCount++;
                trackingSession.lastLocation = location;

                // Call callback if provided
                if (callback && typeof callback === 'function') {
                    callback(location, trackingSession);
                }

                // Emit tracking event (in real app, use WebSocket or EventEmitter)
                console.log(`GPS Tracking [${deviceId}]: ${location.latitude}, ${location.longitude} (±${location.accuracy}m)`);

            } catch (error) {
                console.error(`GPS tracking error for ${deviceId}:`, error);
            }
        }, interval);

        trackingSession.intervalId = intervalId;
        this.trackingSessions.set(deviceId, trackingSession);

        return {
            sessionId: deviceId,
            status: 'ACTIVE',
            startTime: trackingSession.startTime,
            settings: { interval, accuracy, saveToDatabase }
        };
    }

    // Stop GPS tracking session
    async stopTracking(deviceId) {
        const session = this.trackingSessions.get(deviceId);
        if (!session) {
            throw new Error(`No active tracking session for device ${deviceId}`);
        }

        clearInterval(session.intervalId);
        this.trackingSessions.delete(deviceId);

        return {
            sessionId: deviceId,
            status: 'STOPPED',
            duration: Date.now() - session.startTime,
            locationCount: session.locationCount,
            lastLocation: session.lastLocation
        };
    }

    // Get tracking session status
    getTrackingStatus(deviceId) {
        const session = this.trackingSessions.get(deviceId);
        if (!session) {
            return { status: 'INACTIVE' };
        }

        return {
            status: 'ACTIVE',
            deviceId: session.deviceId,
            startTime: session.startTime,
            duration: Date.now() - session.startTime,
            locationCount: session.locationCount,
            lastLocation: session.lastLocation,
            settings: {
                interval: session.interval,
                accuracy: session.accuracy,
                saveToDatabase: session.saveToDatabase
            }
        };
    }

    // Get all active tracking sessions
    getAllTrackingSessions() {
        const sessions = [];
        for (const [deviceId, session] of this.trackingSessions) {
            sessions.push(this.getTrackingStatus(deviceId));
        }
        return sessions;
    }

    // Calculate GPS quality metrics
    calculateGPSQuality(location) {
        const accuracy = location.accuracy || 100;
        let qualityScore = 100;
        let qualityLevel = 'HIGH';

        // Accuracy impact
        if (accuracy > this.accuracyThresholds.LOW) {
            qualityScore -= 40;
            qualityLevel = 'LOW';
        } else if (accuracy > this.accuracyThresholds.MEDIUM) {
            qualityScore -= 20;
            qualityLevel = 'MEDIUM';
        } else if (accuracy > this.accuracyThresholds.HIGH) {
            qualityScore -= 10;
        }

        // Age impact
        const age = Date.now() - (location.timestamp || Date.now());
        if (age > 60000) qualityScore -= 20; // > 1 minute old
        else if (age > 30000) qualityScore -= 10; // > 30 seconds old

        // Speed consistency (if available)
        if (location.speed !== undefined && location.speed < 0) {
            qualityScore -= 15; // Invalid speed
        }

        return {
            score: Math.max(qualityScore, 0),
            level: qualityLevel,
            accuracy: accuracy,
            age: age,
            factors: {
                accuracyGood: accuracy <= this.accuracyThresholds.HIGH,
                fresh: age <= 30000,
                speedValid: location.speed === undefined || location.speed >= 0
            }
        };
    }

    // Helper methods
    selectBestProvider(preference) {
        if (preference !== 'auto') return preference;
        
        // Select based on available API keys
        if (this.apiConfigs.google.apiKey) return 'google';
        if (this.apiConfigs.here.apiKey) return 'here';
        if (this.apiConfigs.mapbox.apiKey) return 'mapbox';
        
        return 'fallback';
    }

    parseGoogleAddressComponents(components) {
        const parsed = {};
        components.forEach(component => {
            component.types.forEach(type => {
                parsed[type] = component.long_name;
            });
        });
        return parsed;
    }

    parseHereAddressComponents(address) {
        return {
            street: address.Street,
            city: address.City,
            state: address.State,
            country: address.Country,
            postalCode: address.PostalCode
        };
    }

    parseMapboxAddressComponents(feature) {
        const context = feature.context || [];
        const components = {};
        
        context.forEach(item => {
            const [type] = item.id.split('.');
            components[type] = item.text;
        });
        
        return components;
    }

    categorizeLandmark(landmark) {
        const categories = {
            'Metro Station': 'transport',
            'Bus Stop': 'transport',
            'Shopping Mall': 'shopping',
            'Hospital': 'healthcare',
            'School': 'education',
            'Temple': 'religious',
            'Park': 'recreation',
            'ATM': 'finance',
            'Petrol Pump': 'fuel',
            'Restaurant': 'food'
        };
        return categories[landmark] || 'general';
    }

    fallbackReverseGeocode(lat, lng) {
        // Simple fallback for when APIs are not available
        return {
            formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            components: {
                city: 'Unknown City',
                state: 'Unknown State',
                country: 'India'
            },
            source: 'fallback'
        };
    }

    // Save GPS location to database
    async saveGPSLocation(deviceId, location) {
        try {
            const db = await import('../database.js').then(m => m.getDatabase());
            
            await db.run(`
                INSERT OR REPLACE INTO gps_locations (
                    device_id, latitude, longitude, accuracy, altitude, 
                    speed, heading, timestamp, address, quality_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                deviceId,
                location.latitude,
                location.longitude,
                location.accuracy,
                location.altitude || null,
                location.speed || null,
                location.heading || null,
                location.timestamp,
                JSON.stringify(location.address || {}),
                location.quality?.score || 0
            ]);
        } catch (error) {
            console.error('Error saving GPS location:', error);
        }
    }

    // Cache management
    getCachedLocation(key) {
        const cached = this.gpsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedLocation(key, data) {
        this.gpsCache.set(key, { data, timestamp: Date.now() });
    }

    getCachedData(key) {
        return this.getCachedLocation(key);
    }

    setCachedData(key, data) {
        this.setCachedLocation(key, data);
    }
}

export default new GPSApiService();