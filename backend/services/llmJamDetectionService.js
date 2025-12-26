import { GoogleGenAI, Type } from '@google/genai';
import realTrafficService from './realTrafficService.js';
import { DatabaseService } from '../database.js';

// LLM-powered Traffic Jam Detection Service
class LLMJamDetectionService {
    constructor() {
        this.ai = null;
        this.initializeAI();
        
        // Cache for jam analysis
        this.jamCache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
        
        // Jam severity thresholds
        this.severityThresholds = {
            LIGHT: { speedRatio: 0.7, duration: 5 }, // 70% of free flow speed, 5+ minutes
            MODERATE: { speedRatio: 0.5, duration: 10 }, // 50% of free flow speed, 10+ minutes
            HEAVY: { speedRatio: 0.3, duration: 15 }, // 30% of free flow speed, 15+ minutes
            SEVERE: { speedRatio: 0.15, duration: 20 } // 15% of free flow speed, 20+ minutes
        };
    }

    async initializeAI() {
        try {
            const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (apiKey) {
                this.ai = new GoogleGenAI({ apiKey });
            }
        } catch (error) {
            console.error('Failed to initialize AI for jam detection:', error);
        }
    }

    // Analyze traffic patterns and detect jams using LLM
    async detectTrafficJams(city, trafficData, gpsData = []) {
        const cacheKey = `jam_${city}_${Date.now() - (Date.now() % 60000)}`; // Cache per minute
        const cached = this.getCachedAnalysis(cacheKey);
        if (cached) return cached;

        try {
            // Combine traffic data with GPS data for comprehensive analysis
            const analysisData = this.prepareAnalysisData(trafficData, gpsData);
            
            let jamAnalysis;
            if (this.ai) {
                jamAnalysis = await this.performLLMJamAnalysis(city, analysisData);
            } else {
                jamAnalysis = await this.performHeuristicJamAnalysis(city, analysisData);
            }

            // Enhance with real-time GPS insights
            if (gpsData.length > 0) {
                jamAnalysis = await this.enhanceWithGPSData(jamAnalysis, gpsData);
            }

            // Save jam events to database
            await this.saveJamEvents(city, jamAnalysis.detectedJams);

            this.setCachedAnalysis(cacheKey, jamAnalysis);
            return jamAnalysis;

        } catch (error) {
            console.error('Jam detection error:', error);
            return this.generateFallbackJamAnalysis(city, trafficData);
        }
    }

    // Prepare comprehensive data for LLM analysis
    prepareAnalysisData(trafficData, gpsData) {
        return {
            traffic: {
                congestionLevel: trafficData.congestionLevel || 0,
                avgSpeed: trafficData.currentSpeed || trafficData.avgSpeed || 0,
                freeFlowSpeed: trafficData.freeFlowSpeed || 50,
                incidents: trafficData.incidents || [],
                timestamp: trafficData.timestamp || Date.now()
            },
            gps: {
                activeVehicles: gpsData.length,
                avgSpeed: gpsData.length > 0 ? gpsData.reduce((sum, v) => sum + (v.speed || 0), 0) / gpsData.length : 0,
                stoppedVehicles: gpsData.filter(v => (v.speed || 0) < 5).length,
                slowMovingVehicles: gpsData.filter(v => (v.speed || 0) >= 5 && (v.speed || 0) < 20).length,
                clusters: this.identifyVehicleClusters(gpsData)
            },
            historical: {
                timeOfDay: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                isRushHour: this.isRushHour(),
                isWeekend: this.isWeekend()
            }
        };
    }

    // LLM-powered jam analysis
    async performLLMJamAnalysis(city, analysisData) {
        const prompt = `
            You are an AI traffic analyst for BharatFlow, analyzing traffic conditions in ${city}, India.
            
            Current Traffic Data:
            - Congestion Level: ${analysisData.traffic.congestionLevel}%
            - Current Speed: ${analysisData.traffic.avgSpeed} km/h
            - Free Flow Speed: ${analysisData.traffic.freeFlowSpeed} km/h
            - Active Incidents: ${analysisData.traffic.incidents.length}
            
            GPS Vehicle Data:
            - Active Vehicles: ${analysisData.gps.activeVehicles}
            - Average GPS Speed: ${analysisData.gps.avgSpeed.toFixed(1)} km/h
            - Stopped Vehicles: ${analysisData.gps.stoppedVehicles}
            - Slow Moving Vehicles: ${analysisData.gps.slowMovingVehicles}
            - Vehicle Clusters: ${analysisData.gps.clusters.length}
            
            Context:
            - Time: ${analysisData.historical.timeOfDay}:00
            - Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][analysisData.historical.dayOfWeek]}
            - Rush Hour: ${analysisData.historical.isRushHour ? 'Yes' : 'No'}
            - Weekend: ${analysisData.historical.isWeekend ? 'Yes' : 'No'}
            
            Analyze this data and detect traffic jams. Consider:
            1. Speed reduction patterns
            2. Vehicle clustering and density
            3. Time-based traffic patterns for Indian cities
            4. Incident impact on traffic flow
            5. GPS data correlation with traffic conditions
            
            Provide detailed jam detection analysis with severity levels and recommendations.
        `;

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    jamDetected: { type: Type.BOOLEAN },
                    severity: { type: Type.STRING, enum: ['LIGHT', 'MODERATE', 'HEAVY', 'SEVERE'] },
                    confidence: { type: Type.NUMBER },
                    analysis: { type: Type.STRING },
                    detectedJams: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                location: { type: Type.STRING },
                                severity: { type: Type.STRING },
                                estimatedDuration: { type: Type.INTEGER },
                                affectedVehicles: { type: Type.INTEGER },
                                cause: { type: Type.STRING },
                                recommendation: { type: Type.STRING }
                            }
                        }
                    },
                    predictions: {
                        type: Type.OBJECT,
                        properties: {
                            nextHourTrend: { type: Type.STRING },
                            estimatedClearTime: { type: Type.INTEGER },
                            alternativeRoutes: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            }
        };

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: `You are BharatFlow AI, India's advanced traffic management system. 
                Analyze traffic patterns with expertise in Indian road conditions, driving patterns, and urban traffic flow.
                Consider factors like auto-rickshaws, mixed vehicle types, and typical Indian traffic behaviors.`,
                ...config
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }

        throw new Error('Empty response from LLM');
    }

    // Heuristic jam analysis fallback
    async performHeuristicJamAnalysis(city, analysisData) {
        const { traffic, gps, historical } = analysisData;
        
        // Calculate jam probability based on multiple factors
        let jamScore = 0;
        let severity = 'LIGHT';
        
        // Speed-based analysis
        const speedRatio = traffic.avgSpeed / traffic.freeFlowSpeed;
        if (speedRatio < 0.3) jamScore += 40;
        else if (speedRatio < 0.5) jamScore += 25;
        else if (speedRatio < 0.7) jamScore += 15;
        
        // GPS data analysis
        if (gps.activeVehicles > 0) {
            const stoppedRatio = gps.stoppedVehicles / gps.activeVehicles;
            const slowRatio = gps.slowMovingVehicles / gps.activeVehicles;
            
            jamScore += stoppedRatio * 30;
            jamScore += slowRatio * 20;
            jamScore += Math.min(gps.clusters.length * 5, 20);
        }
        
        // Congestion level impact
        jamScore += Math.min(traffic.congestionLevel * 0.3, 30);
        
        // Time-based factors
        if (historical.isRushHour) jamScore += 15;
        if (historical.isWeekend && historical.timeOfDay >= 10 && historical.timeOfDay <= 22) jamScore += 10;
        
        // Incident impact
        jamScore += Math.min(traffic.incidents.length * 10, 25);
        
        // Determine severity
        if (jamScore >= 80) severity = 'SEVERE';
        else if (jamScore >= 60) severity = 'HEAVY';
        else if (jamScore >= 40) severity = 'MODERATE';
        else if (jamScore >= 25) severity = 'LIGHT';
        
        const jamDetected = jamScore >= 25;
        
        return {
            jamDetected,
            severity: jamDetected ? severity : 'NONE',
            confidence: Math.min(jamScore / 100, 0.95),
            analysis: `Heuristic analysis detected ${jamDetected ? severity.toLowerCase() : 'no'} traffic jam. Score: ${jamScore.toFixed(1)}/100`,
            detectedJams: jamDetected ? [{
                id: `JAM-${Date.now()}`,
                location: `${city} Traffic Grid`,
                severity,
                estimatedDuration: this.estimateDuration(severity),
                affectedVehicles: gps.activeVehicles,
                cause: this.determineCause(traffic, gps, historical),
                recommendation: this.generateRecommendation(severity, historical)
            }] : [],
            predictions: {
                nextHourTrend: this.predictTrend(jamScore, historical),
                estimatedClearTime: jamDetected ? this.estimateClearTime(severity, historical) : 0,
                alternativeRoutes: ['Ring Road', 'Outer Ring Road', 'Express Highway']
            }
        };
    }

    // Enhance analysis with GPS data insights
    async enhanceWithGPSData(jamAnalysis, gpsData) {
        if (!gpsData.length) return jamAnalysis;
        
        // Analyze GPS patterns for additional insights
        const gpsInsights = {
            hotspots: this.identifyTrafficHotspots(gpsData),
            flowPatterns: this.analyzeFlowPatterns(gpsData),
            anomalies: this.detectAnomalies(gpsData)
        };
        
        // Enhance detected jams with GPS insights
        jamAnalysis.detectedJams = jamAnalysis.detectedJams.map(jam => ({
            ...jam,
            gpsInsights: {
                nearbyVehicles: gpsData.filter(v => this.isNearLocation(v, jam.location)).length,
                avgSpeedNearby: this.calculateNearbyAvgSpeed(gpsData, jam.location),
                trafficDensity: this.calculateTrafficDensity(gpsData, jam.location)
            }
        }));
        
        // Add GPS-specific recommendations
        jamAnalysis.gpsRecommendations = this.generateGPSRecommendations(gpsInsights);
        
        return jamAnalysis;
    }

    // Identify vehicle clusters for jam detection
    identifyVehicleClusters(gpsData) {
        const clusters = [];
        const processed = new Set();
        const clusterRadius = 0.5; // 500 meters
        
        gpsData.forEach((vehicle, index) => {
            if (processed.has(index)) return;
            
            const cluster = [vehicle];
            processed.add(index);
            
            gpsData.forEach((otherVehicle, otherIndex) => {
                if (processed.has(otherIndex) || index === otherIndex) return;
                
                const distance = this.calculateDistance(
                    { lat: vehicle.lat, lng: vehicle.lng },
                    { lat: otherVehicle.lat, lng: otherVehicle.lng }
                );
                
                if (distance <= clusterRadius) {
                    cluster.push(otherVehicle);
                    processed.add(otherIndex);
                }
            });
            
            if (cluster.length >= 3) { // Minimum 3 vehicles for a cluster
                clusters.push({
                    id: `CLUSTER-${clusters.length + 1}`,
                    vehicles: cluster.length,
                    center: this.calculateClusterCenter(cluster),
                    avgSpeed: cluster.reduce((sum, v) => sum + (v.speed || 0), 0) / cluster.length,
                    density: cluster.length / (Math.PI * clusterRadius * clusterRadius)
                });
            }
        });
        
        return clusters;
    }

    // Helper methods
    isRushHour() {
        const hour = new Date().getHours();
        return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
    }

    isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6;
    }

    estimateDuration(severity) {
        const durations = { LIGHT: 10, MODERATE: 20, HEAVY: 35, SEVERE: 60 };
        return durations[severity] || 15;
    }

    determineCause(traffic, gps, historical) {
        if (traffic.incidents.length > 0) return 'Traffic incident';
        if (historical.isRushHour) return 'Rush hour congestion';
        if (gps.stoppedVehicles > gps.activeVehicles * 0.6) return 'Signal malfunction or blockage';
        return 'High traffic volume';
    }

    generateRecommendation(severity, historical) {
        if (severity === 'SEVERE') return 'Avoid area, use alternative routes, expect major delays';
        if (severity === 'HEAVY') return 'Consider alternative routes, expect significant delays';
        if (severity === 'MODERATE') return 'Allow extra travel time, monitor conditions';
        return 'Minor delays expected, proceed with caution';
    }

    predictTrend(jamScore, historical) {
        if (historical.isRushHour && historical.timeOfDay < 10) return 'WORSENING';
        if (historical.isRushHour && historical.timeOfDay > 18) return 'IMPROVING';
        if (jamScore > 70) return 'STABLE_HIGH';
        if (jamScore > 40) return 'STABLE_MODERATE';
        return 'IMPROVING';
    }

    estimateClearTime(severity, historical) {
        const baseTimes = { LIGHT: 15, MODERATE: 30, HEAVY: 45, SEVERE: 90 };
        let clearTime = baseTimes[severity] || 20;
        
        if (historical.isRushHour) clearTime *= 1.5;
        if (historical.isWeekend) clearTime *= 0.8;
        
        return Math.round(clearTime);
    }

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

    calculateClusterCenter(vehicles) {
        const lat = vehicles.reduce((sum, v) => sum + v.lat, 0) / vehicles.length;
        const lng = vehicles.reduce((sum, v) => sum + v.lng, 0) / vehicles.length;
        return { lat, lng };
    }

    // Cache management
    getCachedAnalysis(key) {
        const cached = this.jamCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedAnalysis(key, data) {
        this.jamCache.set(key, { data, timestamp: Date.now() });
    }

    // Save jam events to database
    async saveJamEvents(city, jams) {
        try {
            for (const jam of jams) {
                await DatabaseService.saveIncident({
                    id: jam.id,
                    type: 'TRAFFIC_JAM',
                    location: { x: 0, y: 0 }, // Would need actual coordinates
                    description: `${jam.severity} traffic jam: ${jam.cause}`,
                    severity: jam.severity,
                    timestamp: Date.now(),
                    estimatedDuration: jam.estimatedDuration,
                    affectedVehicles: jam.affectedVehicles
                }, city);
            }
        } catch (error) {
            console.error('Error saving jam events:', error);
        }
    }

    // Fallback analysis
    generateFallbackJamAnalysis(city, trafficData) {
        const congestionLevel = trafficData.congestionLevel || 0;
        const jamDetected = congestionLevel > 60;
        
        return {
            jamDetected,
            severity: jamDetected ? (congestionLevel > 80 ? 'HEAVY' : 'MODERATE') : 'NONE',
            confidence: 0.6,
            analysis: 'Fallback analysis based on congestion level',
            detectedJams: jamDetected ? [{
                id: `FALLBACK-JAM-${Date.now()}`,
                location: `${city} Area`,
                severity: congestionLevel > 80 ? 'HEAVY' : 'MODERATE',
                estimatedDuration: congestionLevel > 80 ? 30 : 15,
                affectedVehicles: Math.round(congestionLevel * 2),
                cause: 'High congestion detected',
                recommendation: 'Monitor traffic conditions'
            }] : [],
            predictions: {
                nextHourTrend: 'STABLE',
                estimatedClearTime: jamDetected ? 20 : 0,
                alternativeRoutes: []
            }
        };
    }

    // Additional helper methods for GPS enhancement
    identifyTrafficHotspots(gpsData) {
        // Implementation for identifying traffic hotspots
        return [];
    }

    analyzeFlowPatterns(gpsData) {
        // Implementation for analyzing traffic flow patterns
        return {};
    }

    detectAnomalies(gpsData) {
        // Implementation for detecting traffic anomalies
        return [];
    }

    isNearLocation(vehicle, location) {
        // Implementation for checking if vehicle is near a location
        return true;
    }

    calculateNearbyAvgSpeed(gpsData, location) {
        // Implementation for calculating average speed near a location
        return 0;
    }

    calculateTrafficDensity(gpsData, location) {
        // Implementation for calculating traffic density
        return 0;
    }

    generateGPSRecommendations(insights) {
        // Implementation for generating GPS-based recommendations
        return [];
    }
}

export default new LLMJamDetectionService();