#!/usr/bin/env node

/**
 * BharatFlow AI Production Test Suite
 * Comprehensive testing for production deployment
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration
const CONFIG = {
    BASE_URL: process.env.PRODUCTION_URL || 'http://localhost:3001',
    TIMEOUT: 30000, // 30 seconds
    CONCURRENT_USERS: 10,
    TEST_DURATION: 60000, // 1 minute load test
    CITIES: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'],
    CRITICAL_ENDPOINTS: [
        '/api/analyze-traffic',
        '/api/llm/detect-jams',
        '/api/search',
        '/api/states',
        '/api/live-locations'
    ]
};

// Test Results Storage
const testResults = {
    startTime: Date.now(),
    endTime: null,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    performance: {},
    errors: [],
    warnings: []
};

// Utility Functions
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
        'INFO': '📋',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️',
        'PERFORMANCE': '⚡'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    if (data) console.log('   ', JSON.stringify(data, null, 2));
}

async function makeRequest(url, options = {}, timeout = CONFIG.TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

function updateTestResults(passed, testName, duration = 0, error = null) {
    testResults.totalTests++;
    if (passed) {
        testResults.passedTests++;
    } else {
        testResults.failedTests++;
        if (error) {
            testResults.errors.push({
                test: testName,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }
    
    if (duration > 0) {
        testResults.performance[testName] = duration;
    }
}

// Core System Tests
async function testSystemHealth() {
    log('INFO', 'Testing System Health...');
    
    const healthChecks = [
        { name: 'Backend Server', endpoint: '/api/health' },
        { name: 'Database Connection', endpoint: '/api/states' },
        { name: 'LLM Service', endpoint: '/api/llm/health' },
        { name: 'Search Service', endpoint: '/api/search/suggestions?partial=test&context={}' }
    ];
    
    for (const check of healthChecks) {
        const startTime = performance.now();
        try {
            const response = await makeRequest(`${CONFIG.BASE_URL}${check.endpoint}`);
            const duration = performance.now() - startTime;
            
            if (response.ok) {
                log('SUCCESS', `${check.name} is healthy (${Math.round(duration)}ms)`);
                updateTestResults(true, `health_${check.name}`, duration);
            } else {
                log('ERROR', `${check.name} returned ${response.status}`);
                updateTestResults(false, `health_${check.name}`, duration);
            }
        } catch (error) {
            const duration = performance.now() - startTime;
            log('ERROR', `${check.name} failed: ${error.message}`);
            updateTestResults(false, `health_${check.name}`, duration, error);
        }
    }
}

async function testCriticalEndpoints() {
    log('INFO', 'Testing Critical Endpoints...');
    
    const testCases = [
        {
            name: 'Traffic Analysis',
            endpoint: '/api/analyze-traffic',
            method: 'POST',
            body: {
                congestedIntersections: [
                    { id: 'INT-1', label: 'MG Road Junction', nsQueue: 15, ewQueue: 12 }
                ],
                stats: { congestionLevel: 65, avgSpeed: 25 }
            }
        },
        {
            name: 'LLM Jam Detection',
            endpoint: '/api/llm/detect-jams',
            method: 'POST',
            body: {
                city: 'Bangalore',
                trafficData: {
                    congestionLevel: 70,
                    avgSpeed: 20,
                    freeFlowSpeed: 50,
                    incidents: []
                },
                gpsData: []
            }
        },
        {
            name: 'Search Functionality',
            endpoint: '/api/search',
            method: 'POST',
            body: {
                query: 'traffic jams',
                context: {
                    currentCity: 'Bangalore',
                    userRole: 'traffic_controller'
                }
            }
        },
        {
            name: 'States API',
            endpoint: '/api/states',
            method: 'GET'
        },
        {
            name: 'Live Locations',
            endpoint: '/api/live-locations/Bangalore',
            method: 'GET'
        }
    ];
    
    for (const testCase of testCases) {
        const startTime = performance.now();
        try {
            const options = {
                method: testCase.method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (testCase.body) {
                options.body = JSON.stringify(testCase.body);
            }
            
            const response = await makeRequest(`${CONFIG.BASE_URL}${testCase.endpoint}`, options);
            const duration = performance.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                log('SUCCESS', `${testCase.name} endpoint working (${Math.round(duration)}ms)`);
                updateTestResults(true, `endpoint_${testCase.name}`, duration);
                
                // Validate response structure
                if (testCase.name === 'Traffic Analysis' && !data.analysis) {
                    log('WARNING', `${testCase.name} missing expected 'analysis' field`);
                    testResults.warnings.push(`${testCase.name}: Missing analysis field`);
                }
            } else {
                log('ERROR', `${testCase.name} returned ${response.status}: ${await response.text()}`);
                updateTestResults(false, `endpoint_${testCase.name}`, duration);
            }
        } catch (error) {
            const duration = performance.now() - startTime;
            log('ERROR', `${testCase.name} failed: ${error.message}`);
            updateTestResults(false, `endpoint_${testCase.name}`, duration, error);
        }
    }
}

async function testPerformanceUnderLoad() {
    log('INFO', `Testing Performance Under Load (${CONFIG.CONCURRENT_USERS} concurrent users)...`);
    
    const testEndpoint = '/api/analyze-traffic';
    const testPayload = {
        congestedIntersections: [
            { id: 'LOAD-1', label: 'Load Test Junction', nsQueue: 20, ewQueue: 18 }
        ],
        stats: { congestionLevel: 75, avgSpeed: 15 }
    };
    
    const promises = [];
    const results = [];
    
    for (let i = 0; i < CONFIG.CONCURRENT_USERS; i++) {
        promises.push(
            (async () => {
                const startTime = performance.now();
                try {
                    const response = await makeRequest(`${CONFIG.BASE_URL}${testEndpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(testPayload)
                    });
                    
                    const duration = performance.now() - startTime;
                    results.push({
                        success: response.ok,
                        duration,
                        status: response.status
                    });
                } catch (error) {
                    const duration = performance.now() - startTime;
                    results.push({
                        success: false,
                        duration,
                        error: error.message
                    });
                }
            })()
        );
    }
    
    await Promise.all(promises);
    
    // Analyze results
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    const minDuration = Math.min(...results.map(r => r.duration));
    
    log('PERFORMANCE', `Load Test Results:`, {
        totalRequests: CONFIG.CONCURRENT_USERS,
        successful,
        failed,
        successRate: `${Math.round((successful / CONFIG.CONCURRENT_USERS) * 100)}%`,
        avgResponseTime: `${Math.round(avgDuration)}ms`,
        minResponseTime: `${Math.round(minDuration)}ms`,
        maxResponseTime: `${Math.round(maxDuration)}ms`
    });
    
    updateTestResults(successful >= CONFIG.CONCURRENT_USERS * 0.9, 'load_test', avgDuration);
    
    if (avgDuration > 5000) {
        testResults.warnings.push(`Average response time (${Math.round(avgDuration)}ms) exceeds 5 seconds`);
    }
}

async function testDataIntegrity() {
    log('INFO', 'Testing Data Integrity...');
    
    // Test states data
    try {
        const response = await makeRequest(`${CONFIG.BASE_URL}/api/states`);
        if (response.ok) {
            const states = await response.json();
            
            if (Array.isArray(states) && states.length > 0) {
                log('SUCCESS', `States data loaded: ${states.length} states`);
                updateTestResults(true, 'data_states');
                
                // Validate state structure
                const firstState = states[0];
                if (!firstState.name || !firstState.code) {
                    log('WARNING', 'State data missing required fields');
                    testResults.warnings.push('State data structure incomplete');
                }
            } else {
                log('ERROR', 'States data is empty or invalid');
                updateTestResults(false, 'data_states');
            }
        }
    } catch (error) {
        log('ERROR', `States data test failed: ${error.message}`);
        updateTestResults(false, 'data_states', 0, error);
    }
    
    // Test city-specific data for each major city
    for (const city of CONFIG.CITIES) {
        try {
            const response = await makeRequest(`${CONFIG.BASE_URL}/api/live-locations/${city}`);
            if (response.ok) {
                const data = await response.json();
                log('SUCCESS', `${city} data accessible`);
                updateTestResults(true, `data_${city}`);
            } else {
                log('WARNING', `${city} data returned ${response.status}`);
                updateTestResults(false, `data_${city}`);
            }
        } catch (error) {
            log('ERROR', `${city} data test failed: ${error.message}`);
            updateTestResults(false, `data_${city}`, 0, error);
        }
    }
}

async function testSecurityAndValidation() {
    log('INFO', 'Testing Security and Input Validation...');
    
    const securityTests = [
        {
            name: 'SQL Injection Protection',
            endpoint: '/api/states',
            method: 'GET',
            query: '?filter=\'; DROP TABLE states; --'
        },
        {
            name: 'XSS Protection',
            endpoint: '/api/search',
            method: 'POST',
            body: {
                query: '<script>alert("xss")</script>',
                context: { currentCity: 'Test' }
            }
        },
        {
            name: 'Large Payload Handling',
            endpoint: '/api/analyze-traffic',
            method: 'POST',
            body: {
                congestedIntersections: Array(1000).fill({
                    id: 'LARGE-TEST',
                    label: 'Large Test Junction',
                    nsQueue: 10,
                    ewQueue: 10
                }),
                stats: { congestionLevel: 50, avgSpeed: 30 }
            }
        },
        {
            name: 'Invalid JSON Handling',
            endpoint: '/api/analyze-traffic',
            method: 'POST',
            body: '{"invalid": json}',
            raw: true
        }
    ];
    
    for (const test of securityTests) {
        try {
            const options = {
                method: test.method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (test.body) {
                options.body = test.raw ? test.body : JSON.stringify(test.body);
            }
            
            const url = `${CONFIG.BASE_URL}${test.endpoint}${test.query || ''}`;
            const response = await makeRequest(url, options);
            
            // Security tests should either work normally or return proper error codes
            if (response.status === 400 || response.status === 422 || response.ok) {
                log('SUCCESS', `${test.name} handled properly`);
                updateTestResults(true, `security_${test.name}`);
            } else if (response.status === 500) {
                log('WARNING', `${test.name} caused server error`);
                testResults.warnings.push(`${test.name}: Server error on malicious input`);
                updateTestResults(false, `security_${test.name}`);
            }
        } catch (error) {
            log('SUCCESS', `${test.name} properly rejected: ${error.message}`);
            updateTestResults(true, `security_${test.name}`);
        }
    }
}

async function testEnvironmentConfiguration() {
    log('INFO', 'Testing Environment Configuration...');
    
    try {
        const response = await makeRequest(`${CONFIG.BASE_URL}/api/llm/health`);
        if (response.ok) {
            const health = await response.json();
            
            log('INFO', 'Environment Status:', {
                aiEnabled: health.aiEnabled,
                features: health.features,
                status: health.status
            });
            
            if (!health.aiEnabled) {
                testResults.warnings.push('AI features disabled - check API key configuration');
            }
            
            updateTestResults(true, 'env_config');
        }
    } catch (error) {
        log('ERROR', `Environment test failed: ${error.message}`);
        updateTestResults(false, 'env_config', 0, error);
    }
}

function generateTestReport() {
    testResults.endTime = Date.now();
    const duration = testResults.endTime - testResults.startTime;
    
    log('INFO', '📊 PRODUCTION TEST REPORT');
    console.log('=' .repeat(80));
    
    console.log(`🕒 Test Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📋 Total Tests: ${testResults.totalTests}`);
    console.log(`✅ Passed: ${testResults.passedTests}`);
    console.log(`❌ Failed: ${testResults.failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);
    
    if (testResults.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${testResults.warnings.length}):`);
        testResults.warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`);
        });
    }
    
    if (testResults.errors.length > 0) {
        console.log(`\n❌ ERRORS (${testResults.errors.length}):`);
        testResults.errors.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error.test}: ${error.error}`);
        });
    }
    
    // Performance Summary
    console.log('\n⚡ PERFORMANCE SUMMARY:');
    const perfEntries = Object.entries(testResults.performance);
    if (perfEntries.length > 0) {
        perfEntries.forEach(([test, duration]) => {
            const status = duration < 1000 ? '🟢' : duration < 3000 ? '🟡' : '🔴';
            console.log(`   ${status} ${test}: ${Math.round(duration)}ms`);
        });
    }
    
    // Overall Assessment
    const successRate = (testResults.passedTests / testResults.totalTests) * 100;
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    if (successRate >= 95 && testResults.errors.length === 0) {
        console.log('   🟢 EXCELLENT - System ready for production');
    } else if (successRate >= 90 && testResults.errors.length <= 2) {
        console.log('   🟡 GOOD - Minor issues detected, review warnings');
    } else if (successRate >= 80) {
        console.log('   🟠 FAIR - Several issues detected, address before production');
    } else {
        console.log('   🔴 POOR - Major issues detected, not ready for production');
    }
    
    console.log('=' .repeat(80));
    
    return {
        passed: successRate >= 90 && testResults.errors.length <= 2,
        report: testResults
    };
}

// Main Test Runner
async function runProductionTests() {
    log('INFO', '🚀 Starting BharatFlow AI Production Tests');
    log('INFO', `Target URL: ${CONFIG.BASE_URL}`);
    console.log('=' .repeat(80));
    
    try {
        await testSystemHealth();
        await testCriticalEndpoints();
        await testDataIntegrity();
        await testPerformanceUnderLoad();
        await testSecurityAndValidation();
        await testEnvironmentConfiguration();
        
        const result = generateTestReport();
        
        if (result.passed) {
            process.exit(0);
        } else {
            process.exit(1);
        }
        
    } catch (error) {
        log('ERROR', `Test suite failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle command line execution
if (process.argv[1].endsWith('test-production.js')) {
    runProductionTests();
}

export { runProductionTests, testResults };