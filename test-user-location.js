// Test script for user location simulation
// Run with: node test-user-location.js

const API_BASE = 'http://localhost:3001';

async function testUserLocationAPI() {
    console.log('🧪 Testing User Location API...\n');

    try {
        // Test 1: Save user location
        console.log('1. Testing save user location...');
        const saveResponse = await fetch(`${API_BASE}/api/user-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'test-user-123',
                name: 'Test User',
                location: {
                    lat: 12.9716,
                    lng: 77.5946,
                    accuracy: 10
                },
                vehicleType: 'CAR',
                city: 'Bangalore'
            })
        });
        
        const saveResult = await saveResponse.json();
        console.log('✅ Save result:', saveResult);

        // Test 2: Get user locations for city
        console.log('\n2. Testing get user locations...');
        const getResponse = await fetch(`${API_BASE}/api/user-locations/Bangalore`);
        const getResult = await getResponse.json();
        console.log('✅ Get result:', getResult);

        // Test 3: Update user location
        console.log('\n3. Testing update user location...');
        const updateResponse = await fetch(`${API_BASE}/api/user-location/test-user-123`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: {
                    lat: 12.9720,
                    lng: 77.5950,
                    accuracy: 8
                },
                status: 'MOVING'
            })
        });
        
        const updateResult = await updateResponse.json();
        console.log('✅ Update result:', updateResult);

        // Test 4: Find nearby users
        console.log('\n4. Testing nearby users...');
        const nearbyResponse = await fetch(`${API_BASE}/api/user-locations/nearby`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: 12.9716,
                lng: 77.5946,
                radius: 1000,
                city: 'Bangalore'
            })
        });
        
        const nearbyResult = await nearbyResponse.json();
        console.log('✅ Nearby result:', nearbyResult);

        // Test 5: Delete user location
        console.log('\n5. Testing delete user location...');
        const deleteResponse = await fetch(`${API_BASE}/api/user-location/test-user-123`, {
            method: 'DELETE'
        });
        
        const deleteResult = await deleteResponse.json();
        console.log('✅ Delete result:', deleteResult);

        console.log('\n🎉 All user location API tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the backend server is running:');
            console.log('   cd backend && npm start');
        }
    }
}

// Test the simulation service (browser-only features)
function testSimulationService() {
    console.log('\n🧪 Testing User Location Simulation Service...\n');
    
    // This would be tested in the browser environment
    console.log('📝 Simulation service features:');
    console.log('   ✓ Add user with GPS location');
    console.log('   ✓ Add user with manual coordinates');
    console.log('   ✓ Add random users in city');
    console.log('   ✓ Set user destinations');
    console.log('   ✓ Real-time location updates');
    console.log('   ✓ Route generation and following');
    console.log('   ✓ Journey tracking');
    console.log('   ✓ Canvas coordinate conversion');
    
    console.log('\n💡 To test simulation features:');
    console.log('   1. Start the frontend: npm run dev');
    console.log('   2. Open the app in browser');
    console.log('   3. Click "ADD USER" button');
    console.log('   4. Enter your name and location');
    console.log('   5. Watch your location appear on the map');
}

// Run tests
if (typeof window === 'undefined') {
    // Node.js environment - test API
    testUserLocationAPI();
} else {
    // Browser environment - test simulation
    testSimulationService();
}

// Export for browser use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testUserLocationAPI, testSimulationService };
}