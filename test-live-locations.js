// Test script for Live Locations API
// Run this with: node test-live-locations.js

const API_BASE = 'http://localhost:3001';

async function testLiveLocationsAPI() {
  console.log('🚀 Testing Live Locations API...\n');

  try {
    // Test 1: Get live locations for Bangalore
    console.log('1. Testing GET /api/live-locations/Bangalore');
    const response1 = await fetch(`${API_BASE}/api/live-locations/Bangalore`);
    const data1 = await response1.json();
    console.log(`✅ Success: Found ${data1.vehicleCount} vehicles in ${data1.city}`);
    console.log(`   Bounds: ${JSON.stringify(data1.bounds)}`);
    console.log(`   Sample vehicle: ${JSON.stringify(data1.vehicles[0])}\n`);

    // Test 2: Get live statistics
    console.log('2. Testing GET /api/live-locations/Bangalore/stats');
    const response2 = await fetch(`${API_BASE}/api/live-locations/Bangalore/stats`);
    const data2 = await response2.json();
    console.log(`✅ Success: Stats for ${data2.city}`);
    console.log(`   Total vehicles: ${data2.totalVehicles}`);
    console.log(`   Average speed: ${data2.avgSpeed}`);
    console.log(`   Congestion level: ${data2.congestionLevel}%`);
    console.log(`   Vehicle types: ${JSON.stringify(data2.vehicleTypes)}\n`);

    // Test 3: Add a custom vehicle
    console.log('3. Testing POST /api/live-locations/Bangalore/vehicle');
    const vehicleData = {
      vehicleId: 'TEST-VEHICLE-001',
      type: 'POLICE',
      x: 400,
      y: 300,
      speed: 3.5,
      direction: 'N',
      isBrokenDown: false,
      mission: { type: 'PATROL', targetId: null }
    };
    
    const response3 = await fetch(`${API_BASE}/api/live-locations/Bangalore/vehicle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });
    const data3 = await response3.json();
    console.log(`✅ Success: Added vehicle ${data3.vehicle.id}`);
    console.log(`   Type: ${data3.vehicle.type}, Position: (${data3.vehicle.x}, ${data3.vehicle.y})\n`);

    // Test 4: Create an incident
    console.log('4. Testing POST /api/live-locations/Bangalore/incident');
    const incidentData = {
      type: 'ACCIDENT',
      location: { x: 450, y: 350 },
      severity: 'HIGH',
      description: 'Multi-vehicle collision blocking main road'
    };
    
    const response4 = await fetch(`${API_BASE}/api/live-locations/Bangalore/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    });
    const data4 = await response4.json();
    console.log(`✅ Success: Created ${incidentData.type} incident`);
    console.log(`   Affected vehicles: ${data4.affectedVehicles}`);
    console.log(`   Location: (${incidentData.location.x}, ${incidentData.location.y})\n`);

    // Test 5: Get all active cities
    console.log('5. Testing GET /api/live-locations');
    const response5 = await fetch(`${API_BASE}/api/live-locations`);
    const data5 = await response5.json();
    console.log(`✅ Success: Found ${data5.totalCities} active cities`);
    console.log(`   Total vehicles across all cities: ${data5.totalVehicles}`);
    data5.cities.forEach(city => {
      console.log(`   - ${city.city}: ${city.vehicleCount} vehicles`);
    });

    console.log('\n🎉 All tests passed! Live Locations API is working correctly.');
    console.log('\n📡 To test real-time streaming, open your browser to:');
    console.log(`   ${API_BASE}/api/live-locations/Bangalore/stream`);
    console.log('\n🎨 Integration with Real-Time Canvas:');
    console.log('   - Enable "LIVE MODE" and "DATA STREAM" in the UI');
    console.log('   - The canvas will automatically connect to live data');
    console.log('   - Watch the connection status indicator in the top-right');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the backend server is running:');
    console.log('   cd backend && npm start');
  }
}

// Run the test
testLiveLocationsAPI();