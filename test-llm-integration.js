#!/usr/bin/env node

/**
 * LLM Integration Test for BharatFlow AI
 * Tests the complete LLM-powered traffic jam detection system
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_CITY = 'Bangalore';

// Test data generators
function generateTrafficData(congestionLevel = 60) {
    return {
        congestionLevel,
        avgSpeed: Math.max(10, 60 - congestionLevel),
        currentSpeed: Math.max(5, 50 - congestionLevel),
        freeFlowSpeed: 50,
        incidents: Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
            id: `incident-${i}`,
            type: ['accident', 'breakdown', 'construction'][Math.floor(Math.random() * 3)],
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            location: `Junction ${i + 1}`
        })),
        timestamp: Date.now()
    };
}

function generateGPSData(vehicleCount = 30) {
    const baseLatLng = { lat: 12.9716, lng: 77.5946 }; // Bangalore coordinates
    
    return Array.from({ length: vehicleCount }, (_, i) => ({
        id: `vehicle-${i}`,
        lat: baseLatLng.lat + (Math.random() - 0.5) * 0.1,
        lng: baseLatLng.lng + (Math.random() - 0.5) * 0.1,
        speed: Math.floor(Math.random() * 80),
        direction: ['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)],
        vehicleType: ['CAR', 'AUTO', 'BUS', 'TRUCK'][Math.floor(Math.random() * 4)],
        timestamp: Date.now() - Math.floor(Math.random() * 300000) // Last 5 minutes
    }));
}

// Test functions
async function testLLMHealth() {
    console.log('\n🔍 Testing LLM Service Health...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/llm/health`);
        const health = await response.json();
        
        console.log('✅ LLM Health Check:', {
            status: health.status,
            aiEnabled: health.aiEnabled,
            features: health.features
        });
        
        return health.status === 'active';
    } catch (error) {
        console.error('❌ LLM Health Check Failed:', error.message);
        return false;
    }
}

async function testJamDetection(scenario) {
    console.log(`\n🚦 Testing Jam Detection - ${scenario.name}...`);
    
    try {
        const response = await fetch(`${BASE_URL}/api/llm/detect-jams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: TEST_CITY,
                trafficData: scenario.trafficData,
                gpsData: scenario.gpsData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const analysis = await response.json();
        
        console.log('📊 Analysis Results:');
        console.log(`   Jam Detected: ${analysis.jamDetected ? '🔴 YES' : '🟢 NO'}`);
        console.log(`   Severity: ${analysis.severity}`);
        console.log(`   Confidence: ${Math.round(analysis.confidence * 100)}%`);
        console.log(`   Detected Jams: ${analysis.detectedJams.length}`);
        
        if (analysis.detectedJams.length > 0) {
            console.log('   Jam Details:');
            analysis.detectedJams.forEach((jam, i) => {
                console.log(`     ${i + 1}. ${jam.location} (${jam.severity})`);
                console.log(`        Cause: ${jam.cause}`);
                console.log(`        Duration: ${jam.estimatedDuration} min`);
                console.log(`        Vehicles: ${jam.affectedVehicles}`);
            });
        }
        
        if (analysis.predictions) {
            console.log('🔮 Predictions:');
            console.log(`   Next Hour Trend: ${analysis.predictions.nextHourTrend}`);
            console.log(`   Clear Time: ${analysis.predictions.estimatedClearTime} min`);
            if (analysis.predictions.alternativeRoutes?.length > 0) {
                console.log(`   Alternative Routes: ${analysis.predictions.alternativeRoutes.join(', ')}`);
            }
        }
        
        console.log(`💬 AI Analysis: "${analysis.analysis}"`);
        
        return analysis;
    } catch (error) {
        console.error(`❌ Jam Detection Failed (${scenario.name}):`, error.message);
        return null;
    }
}

async function testSearchIntegration() {
    console.log('\n🔍 Testing AI Search Integration...');
    
    const searchQueries = [
        'Show me current traffic jams in the city',
        'Find the most congested areas',
        'What are the traffic predictions for next hour?',
        'Are there any accidents reported?'
    ];
    
    for (const query of searchQueries) {
        try {
            console.log(`\n   Query: "${query}"`);
            
            const response = await fetch(`${BASE_URL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    context: {
                        currentCity: TEST_CITY,
                        userRole: 'traffic_controller',
                        activeIncidents: 2,
                        currentTrafficStats: {
                            congestionLevel: 65,
                            avgSpeed: 25
                        }
                    }
                })
            });
            
            if (response.ok) {
                const results = await response.json();
                console.log(`   ✅ Results: ${results.results.length} items found`);
                console.log(`   Processing Time: ${results.processingTime}ms`);
            } else {
                console.log(`   ⚠️ Search failed: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Search error: ${error.message}`);
        }
    }
}

async function testAnalyticsIntegration() {
    console.log('\n📊 Testing LLM Analytics Integration...');
    
    try {
        // Test pattern analysis
        console.log('\n   Testing Pattern Analysis...');
        const patternResponse = await fetch(`${BASE_URL}/api/llm/analyze-patterns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: TEST_CITY,
                timeRange: '24h',
                includeWeather: true
            })
        });
        
        if (patternResponse.ok) {
            const patterns = await patternResponse.json();
            console.log('   ✅ Pattern Analysis Results:');
            console.log(`      Current State: ${patterns.currentState?.assessment}`);
            console.log(`      Severity: ${patterns.currentState?.severity}`);
            console.log(`      Patterns Found: ${patterns.patterns?.identified?.length || 0}`);
            console.log(`      Recommendations: ${patterns.recommendations?.length || 0}`);
        } else {
            console.log(`   ⚠️ Pattern analysis failed: ${patternResponse.status}`);
        }

        // Test incident analysis
        console.log('\n   Testing Incident Analysis...');
        const incidentResponse = await fetch(`${BASE_URL}/api/llm/analyze-incident`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: TEST_CITY,
                incident: {
                    type: 'accident',
                    location: 'MG Road Junction',
                    severity: 'HIGH',
                    timestamp: Date.now()
                },
                trafficData: {
                    congestionLevel: 75,
                    avgSpeed: 15,
                    vehicleCount: 200
                }
            })
        });
        
        if (incidentResponse.ok) {
            const incident = await incidentResponse.json();
            console.log('   ✅ Incident Analysis Results:');
            console.log(`      Impact Severity: ${incident.impactAssessment?.severity}`);
            console.log(`      Estimated Delay: ${incident.impactAssessment?.estimatedDelay} min`);
            console.log(`      Recommendations: ${incident.recommendations?.length || 0}`);
        } else {
            console.log(`   ⚠️ Incident analysis failed: ${incidentResponse.status}`);
        }

        // Test metrics
        console.log('\n   Testing Analytics Metrics...');
        const metricsResponse = await fetch(`${BASE_URL}/api/llm/metrics`);
        
        if (metricsResponse.ok) {
            const metrics = await metricsResponse.json();
            console.log('   ✅ Analytics Metrics:');
            console.log(`      Total Analyses: ${metrics.totalAnalyses}`);
            console.log(`      Success Rate: ${Math.round((metrics.successfulAnalyses / metrics.totalAnalyses) * 100) || 0}%`);
            console.log(`      Cache Size: ${metrics.cacheSize}`);
            console.log(`      AI Enabled: ${metrics.aiEnabled ? 'Yes' : 'No'}`);
        } else {
            console.log(`   ⚠️ Metrics failed: ${metricsResponse.status}`);
        }

    } catch (error) {
        console.error('   ❌ Analytics integration failed:', error.message);
    }
}

async function runPerformanceTest() {
    console.log('\n⚡ Running Performance Test...');
    
    const testData = {
        city: TEST_CITY,
        trafficData: generateTrafficData(75),
        gpsData: generateGPSData(50)
    };
    
    const startTime = Date.now();
    const promises = [];
    
    // Run 5 concurrent requests
    for (let i = 0; i < 5; i++) {
        promises.push(
            fetch(`${BASE_URL}/api/llm/detect-jams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            })
        );
    }
    
    try {
        const responses = await Promise.all(promises);
        const endTime = Date.now();
        
        const successCount = responses.filter(r => r.ok).length;
        console.log(`✅ Performance Test Results:`);
        console.log(`   Concurrent Requests: 5`);
        console.log(`   Successful: ${successCount}/5`);
        console.log(`   Total Time: ${endTime - startTime}ms`);
        console.log(`   Average Time: ${(endTime - startTime) / 5}ms per request`);
        
    } catch (error) {
        console.error('❌ Performance test failed:', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting BharatFlow AI LLM Integration Tests');
    console.log('=' .repeat(60));
    
    // Test scenarios
    const scenarios = [
        {
            name: 'Light Traffic',
            trafficData: generateTrafficData(30),
            gpsData: generateGPSData(20)
        },
        {
            name: 'Moderate Congestion',
            trafficData: generateTrafficData(60),
            gpsData: generateGPSData(35)
        },
        {
            name: 'Heavy Traffic Jam',
            trafficData: generateTrafficData(85),
            gpsData: generateGPSData(50)
        },
        {
            name: 'Rush Hour Scenario',
            trafficData: {
                ...generateTrafficData(70),
                incidents: [
                    { id: 'rush-1', type: 'accident', severity: 'high', location: 'MG Road' },
                    { id: 'rush-2', type: 'construction', severity: 'medium', location: 'Brigade Road' }
                ]
            },
            gpsData: generateGPSData(60)
        }
    ];
    
    // Run tests
    const healthOk = await testLLMHealth();
    
    if (!healthOk) {
        console.log('\n❌ LLM service is not healthy. Skipping further tests.');
        console.log('💡 Make sure the backend server is running and API keys are configured.');
        return;
    }
    
    // Test jam detection scenarios
    for (const scenario of scenarios) {
        await testJamDetection(scenario);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
    
    // Test other features
    await testSearchIntegration();
    await testAnalyticsIntegration();
    await testCacheManagement();
    await runPerformanceTest();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 LLM Integration Tests Complete!');
    console.log('\n💡 Tips:');
    console.log('   - Monitor API usage to stay within quotas');
    console.log('   - Check logs for any AI analysis errors');
    console.log('   - Use fallback heuristics when AI is unavailable');
    console.log('   - Cache results to improve performance');
}

// Handle command line execution
if (process.argv[1] === __filename) {
    runAllTests().catch(error => {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    });
}

export { runAllTests, testJamDetection, testLLMHealth };