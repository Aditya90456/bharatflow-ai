import { DatabaseService } from '../database.js';

// Enhanced Traffic Simulation Service
// Generates realistic traffic patterns based on time, location, and historical data

class TrafficSimulationService {
    constructor() {
        // Traffic pattern templates for different times and conditions
        this.trafficPatterns = {
            rushHourMorning: { // 7-10 AM
                baseCongestion: 0.75,
                speedReduction: 0.4,
                incidentProbability: 0.15,
                peakHours: [7, 8, 9]
            },
            rushHourEvening: { // 5-8 PM
                baseCongestion: 0.8,
                speedReduction: 0.35,
                incidentProbability: 0.18,
                peakHours: [17, 18, 19]
            },
            weekdayNormal: { // 10 AM - 5 PM
                baseCongestion: 0.45,
                speedReduction: 0.2,
                incidentProbability: 0.08,
                peakHours: []
            },
            weekdayLight: { // 8 PM - 7 AM
                baseCongestion: 0.25,
                speedReduction: 0.1,
                incidentProbability: 0.05,
                peakHours: []
            },
            weekendDay: { // Weekend 8 AM - 10 PM
                baseCongestion: 0.35,
                speedReduction: 0.15,
                incidentProbability: 0.06,
                peakHours: [11, 12, 13, 14, 15, 16]
            },
            weekendNight: { // Weekend 10 PM - 8 AM
                baseCongestion: 0.15,
                speedReduction: 0.05,
                incidentProbability: 0.03,
                peakHours: []
            }
        };

        // City-specific traffic characteristics
        this.cityCharacteristics = {
            'Bangalore': {
                baseSpeed: 35,
                trafficMultiplier: 1.2, // Higher congestion
                incidentMultiplier: 1.1,
                peakHourExtension: 1, // Longer peak hours
                specialEvents: ['tech-conference', 'monsoon-flooding']
            },
            'Mumbai': {
                baseSpeed: 30,
                trafficMultiplier: 1.4, // Highest congestion
                incidentMultiplier: 1.3,
                peakHourExtension: 1.5,
                specialEvents: ['local-train-disruption', 'festival-crowds']
            },
            'Delhi': {
                baseSpeed: 40,
                trafficMultiplier: 1.3,
                incidentMultiplier: 1.2,
                peakHourExtension: 1.2,
                specialEvents: ['government-events', 'pollution-restrictions']
            },
            'Chennai': {
                baseSpeed: 38,
                trafficMultiplier: 1.1,
                incidentMultiplier: 1.0,
                peakHourExtension: 0.8,
                specialEvents: ['monsoon-flooding', 'port-traffic']
            },
            'Hyderabad': {
                baseSpeed: 42,
                trafficMultiplier: 1.0,
                incidentMultiplier: 0.9,
                peakHourExtension: 0.9,
                specialEvents: ['it-corridor-traffic', 'metro-construction']
            },
            'Kolkata': {
                baseSpeed: 32,
                trafficMultiplier: 1.15,
                incidentMultiplier: 1.05,
                peakHourExtension: 1.1,
                specialEvents: ['festival-processions', 'tram-delays']
            },
            'Pune': {
                baseSpeed: 36,
                trafficMultiplier: 1.05,
                incidentMultiplier: 0.95,
                peakHourExtension: 0.85,
                specialEvents: ['student-traffic', 'it-park-congestion']
            }
        };

        // Weather impact on traffic
        this.weatherImpact = {
            clear: { congestionMultiplier: 1.0, speedMultiplier: 1.0, incidentMultiplier: 1.0 },
            light_rain: { congestionMultiplier: 1.2, speedMultiplier: 0.9, incidentMultiplier: 1.3 },
            heavy_rain: { congestionMultiplier: 1.6, speedMultiplier: 0.7, incidentMultiplier: 2.0 },
            fog: { congestionMultiplier: 1.3, speedMultiplier: 0.8, incidentMultiplier: 1.5 },
            extreme_heat: { congestionMultiplier: 1.1, speedMultiplier: 0.95, incidentMultiplier: 1.2 }
        };

        // Cache for simulation state
        this.simulationCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generate realistic traffic data for a city
    async generateTrafficData(city, coordinates, options = {}) {
        const cacheKey = `sim_${city}_${Math.floor(Date.now() / this.cacheTimeout)}`;
        const cached = this.simulationCache.get(cacheKey);
        if (cached) return cached;

        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Determine traffic pattern
        const pattern = this.getTrafficPattern(hour, isWeekend);
        const cityChar = this.cityCharacteristics[city] || this.cityCharacteristics['Bangalore'];
        
        // Get weather impact (simulated)
        const weather = this.simulateWeather(city, now);
        const weatherEffect = this.weatherImpact[weather];

        // Calculate base metrics
        let congestionLevel = pattern.baseCongestion * cityChar.trafficMultiplier * weatherEffect.congestionMultiplier;
        let currentSpeed = cityChar.baseSpeed * (1 - pattern.speedReduction) * weatherEffect.speedMultiplier;
        
        // Add randomness and city-specific variations
        congestionLevel = this.addRealisticVariation(congestionLevel, 0.15);
        currentSpeed = this.addRealisticVariation(currentSpeed, 0.1);
        
        // Ensure realistic bounds
        congestionLevel = Math.max(0.05, Math.min(0.95, congestionLevel));
        currentSpeed = Math.max(5, Math.min(cityChar.baseSpeed * 1.2, currentSpeed));

        // Generate incidents
        const incidents = await this.generateRealisticIncidents(
            city, 
            coordinates, 
            pattern.incidentProbability * cityChar.incidentMultiplier * weatherEffect.incidentMultiplier,
            weather
        );

        // Create traffic data object
        const trafficData = {
            source: 'enhanced_simulation',
            timestamp: Date.now(),
            currentSpeed: Math.round(currentSpeed),
            freeFlowSpeed: cityChar.baseSpeed,
            congestionLevel: Math.round(congestionLevel * 100),
            confidence: 0.85, // High confidence for simulation
            coordinates,
            city,
            isRushHour: this.isRushHour(hour, isWeekend),
            isWeekend,
            weather,
            incidents,
            metadata: {
                pattern: this.getPatternName(hour, isWeekend),
                cityCharacteristics: cityChar,
                weatherImpact: weatherEffect,
                simulationVersion: '2.0'
            }
        };

        // Cache the result
        this.simulationCache.set(cacheKey, trafficData);
        
        // Clean old cache entries
        this.cleanCache();

        return trafficData;
    }

    // Determine traffic pattern based on time and day
    getTrafficPattern(hour, isWeekend) {
        if (isWeekend) {
            if (hour >= 22 || hour < 8) return this.trafficPatterns.weekendNight;
            return this.trafficPatterns.weekendDay;
        } else {
            if ((hour >= 7 && hour <= 10)) return this.trafficPatterns.rushHourMorning;
            if ((hour >= 17 && hour <= 20)) return this.trafficPatterns.rushHourEvening;
            if (hour >= 10 && hour < 17) return this.trafficPatterns.weekdayNormal;
            return this.trafficPatterns.weekdayLight;
        }
    }

    // Get pattern name for metadata
    getPatternName(hour, isWeekend) {
        if (isWeekend) {
            return hour >= 22 || hour < 8 ? 'weekend_night' : 'weekend_day';
        } else {
            if (hour >= 7 && hour <= 10) return 'rush_hour_morning';
            if (hour >= 17 && hour <= 20) return 'rush_hour_evening';
            if (hour >= 10 && hour < 17) return 'weekday_normal';
            return 'weekday_light';
        }
    }

    // Check if current time is rush hour
    isRushHour(hour, isWeekend) {
        if (isWeekend) return false;
        return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
    }

    // Simulate weather conditions
    simulateWeather(city, date) {
        const month = date.getMonth();
        const hour = date.getHours();
        
        // Monsoon season (June-September) has higher rain probability
        const isMonsoon = month >= 5 && month <= 8;
        
        // Morning fog probability (December-February)
        const isWinter = month >= 11 || month <= 1;
        const isMorning = hour >= 5 && hour <= 9;
        
        const random = Math.random();
        
        if (isMonsoon && random < 0.3) {
            return random < 0.1 ? 'heavy_rain' : 'light_rain';
        }
        
        if (isWinter && isMorning && random < 0.2) {
            return 'fog';
        }
        
        if (month >= 3 && month <= 5 && hour >= 11 && hour <= 16 && random < 0.15) {
            return 'extreme_heat';
        }
        
        return 'clear';
    }

    // Generate realistic traffic incidents
    async generateRealisticIncidents(city, coordinates, baseProbability, weather) {
        const incidents = [];
        const numIncidents = this.poissonRandom(baseProbability * 3); // Expected incidents
        
        const incidentTypes = [
            { type: 'ACCIDENT', weight: 0.4, descriptions: [
                'Minor collision between two vehicles',
                'Vehicle breakdown in traffic lane',
                'Multi-vehicle accident at intersection',
                'Motorcycle accident, emergency services on scene',
                'Rear-end collision causing lane blockage'
            ]},
            { type: 'BREAKDOWN', weight: 0.3, descriptions: [
                'Vehicle breakdown blocking left lane',
                'Heavy vehicle stuck under bridge',
                'Disabled vehicle on shoulder affecting flow',
                'Bus breakdown at bus stop',
                'Auto-rickshaw breakdown in narrow lane'
            ]},
            { type: 'CONSTRUCTION', weight: 0.2, descriptions: [
                'Road maintenance work in progress',
                'Construction work reducing lanes',
                'Metro construction affecting traffic',
                'Utility work blocking one lane',
                'Road repair work with traffic diversion'
            ]},
            { type: 'OTHER', weight: 0.1, descriptions: [
                'Traffic signal malfunction causing delays',
                'Police checking at intersection',
                'Street vendor causing obstruction',
                'Waterlogging due to poor drainage',
                'Procession affecting traffic movement'
            ]}
        ];

        for (let i = 0; i < numIncidents; i++) {
            const incidentType = this.weightedRandom(incidentTypes);
            const severity = this.generateIncidentSeverity(weather);
            
            incidents.push({
                id: `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                type: incidentType.type,
                description: this.randomChoice(incidentType.descriptions),
                severity: severity,
                location: {
                    lat: coordinates.lat + (Math.random() - 0.5) * 0.02,
                    lng: coordinates.lng + (Math.random() - 0.5) * 0.02
                },
                timestamp: Date.now() - Math.random() * 3600000, // Within last hour
                estimatedClearTime: Date.now() + Math.random() * 7200000, // Clear within 2 hours
                affectedLanes: Math.ceil(Math.random() * 2),
                trafficImpact: severity === 'HIGH' ? 'SEVERE' : severity === 'MEDIUM' ? 'MODERATE' : 'MINOR'
            });
        }

        return incidents;
    }

    // Generate incident severity based on conditions
    generateIncidentSeverity(weather) {
        let highProb = 0.15;
        let mediumProb = 0.35;
        
        // Weather increases severity probability
        if (weather === 'heavy_rain' || weather === 'fog') {
            highProb = 0.25;
            mediumProb = 0.45;
        } else if (weather === 'light_rain') {
            highProb = 0.2;
            mediumProb = 0.4;
        }
        
        const random = Math.random();
        if (random < highProb) return 'HIGH';
        if (random < highProb + mediumProb) return 'MEDIUM';
        return 'LOW';
    }

    // Add realistic variation to values
    addRealisticVariation(value, variationPercent) {
        const variation = value * variationPercent * (Math.random() - 0.5) * 2;
        return value + variation;
    }

    // Poisson distribution for incident count
    poissonRandom(lambda) {
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        
        return k - 1;
    }

    // Weighted random selection
    weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item;
        }
        
        return items[0]; // Fallback
    }

    // Random choice from array
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Generate traffic prediction (future state)
    async generateTrafficPrediction(city, coordinates, minutesAhead = 30) {
        const futureTime = new Date(Date.now() + minutesAhead * 60000);
        const currentData = await this.generateTrafficData(city, coordinates);
        
        // Predict changes based on time progression
        const currentHour = new Date().getHours();
        const futureHour = futureTime.getHours();
        
        let congestionChange = 0;
        let speedChange = 0;
        
        // Rush hour progression
        if (currentHour < 8 && futureHour >= 8) {
            congestionChange = 0.2; // Increasing congestion
            speedChange = -0.15;
        } else if (currentHour < 18 && futureHour >= 18) {
            congestionChange = 0.25; // Evening rush
            speedChange = -0.2;
        } else if (currentHour >= 19 && futureHour >= 21) {
            congestionChange = -0.3; // Decreasing congestion
            speedChange = 0.2;
        }
        
        const predictedCongestion = Math.max(5, Math.min(95, 
            currentData.congestionLevel + (congestionChange * 100)
        ));
        
        const predictedSpeed = Math.max(5, Math.min(currentData.freeFlowSpeed * 1.2,
            currentData.currentSpeed * (1 + speedChange)
        ));
        
        return {
            ...currentData,
            timestamp: futureTime.getTime(),
            currentSpeed: Math.round(predictedSpeed),
            congestionLevel: Math.round(predictedCongestion),
            confidence: 0.7, // Lower confidence for predictions
            isPrediction: true,
            predictionMinutes: minutesAhead,
            source: 'enhanced_simulation_prediction'
        };
    }

    // Generate historical traffic pattern
    async generateHistoricalPattern(city, hours = 24) {
        const patterns = [];
        const now = Date.now();
        const interval = (hours * 60 * 60 * 1000) / 48; // 48 data points
        
        for (let i = 0; i < 48; i++) {
            const timestamp = now - (hours * 60 * 60 * 1000) + (i * interval);
            const date = new Date(timestamp);
            const hour = date.getHours();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            const pattern = this.getTrafficPattern(hour, isWeekend);
            const cityChar = this.cityCharacteristics[city] || this.cityCharacteristics['Bangalore'];
            
            const congestionLevel = Math.round(
                pattern.baseCongestion * cityChar.trafficMultiplier * 100 * 
                (0.8 + Math.random() * 0.4) // Add historical variation
            );
            
            const avgSpeed = Math.round(
                cityChar.baseSpeed * (1 - pattern.speedReduction) * 
                (0.9 + Math.random() * 0.2)
            );
            
            patterns.push({
                timestamp,
                hour,
                congestionLevel: Math.max(5, Math.min(95, congestionLevel)),
                avgSpeed: Math.max(5, Math.min(cityChar.baseSpeed * 1.2, avgSpeed)),
                incidents: Math.floor(pattern.incidentProbability * 10 * Math.random()),
                isRushHour: this.isRushHour(hour, isWeekend),
                isWeekend
            });
        }
        
        return patterns;
    }

    // Clean old cache entries
    cleanCache() {
        const now = Date.now();
        for (const [key, data] of this.simulationCache.entries()) {
            if (now - data.timestamp > this.cacheTimeout * 2) {
                this.simulationCache.delete(key);
            }
        }
    }

    // Get simulation statistics
    getSimulationStats() {
        return {
            cacheSize: this.simulationCache.size,
            supportedCities: Object.keys(this.cityCharacteristics),
            trafficPatterns: Object.keys(this.trafficPatterns),
            weatherConditions: Object.keys(this.weatherImpact),
            version: '2.0'
        };
    }
}

export default new TrafficSimulationService();