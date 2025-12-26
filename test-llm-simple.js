#!/usr/bin/env node

/**
 * Simple LLM Integration Test
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testJamDetection() {
    console.log('🚦 Testing LLM Jam Detection...');
    
    const testData = {
        city: 'Bangalore',
        trafficData: {
            congestionLevel: 75,
            avgSpeed: 15,
            currentSpeed: 12,
            freeFlowSpeed: 50,
            incidents: [
                { id: 'test-1', type: 'accident', severity: 'high', location: 'MG Road' }
            ],
            timestamp: Date.now()
        },
        gpsData: [
            { id: 'v1', lat: 12.9716, lng: 77.5946, speed: 5, vehicleType: 'CAR' },
            { id: 'v2', lat: 12.9720, lng: 77.5950, speed: 8, vehicleType: 'AUTO' },
            { id: 'v3', lat: 12.9725, lng: 77.5955, speed: 3, vehicleType: 'BUS' }
        ]
    };
    
    try {
        const response = await fetch(`${BASE_URL}/api/llm/detect-jams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        
        console.log('✅ Jam Detection Results:');
        console.log(`   Jam Detected: ${result.jamDetected ? '🔴 YES' : '🟢 NO'}`);
        console.log(`   Severity: ${result.severity}`);
        console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
        console.log(`   Analysis: "${result.analysis}"`);
        
        if (result.detectedJams && result.detectedJams.length > 0) {
            console.log(`   Detected Jams: ${result.detectedJams.length}`);
            result.detectedJams.forEach((jam, i) => {
                console.log(`     ${i + 1}. ${jam.location} (${jam.severity})`);
            });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return null;
    }
}

async function testAnalytics() {
    console.log('\n📊 Testing LLM Analytics...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/llm/analyze-patterns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: 'Bangalore',
                timeRange: '24h',
                includeWeather: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        
        console.log('✅ Analytics Results:');
        console.log(`   Current State: ${result.currentState?.assessment}`);
        console.log(`   Severity: ${result.currentState?.severity}`);
        console.log(`   Patterns Found: ${result.patterns?.identified?.length || 0}`);
        console.log(`   Recommendations: ${result.recommendations?.length || 0}`);
        
        return result;
    } catch (error) {
        console.error('❌ Analytics test failed:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting Simple LLM Tests');
    console.log('=' .repeat(50));
    
    await testJamDetection();
    await testAnalytics();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Tests completed!');
}

runTests().catch(console.error);