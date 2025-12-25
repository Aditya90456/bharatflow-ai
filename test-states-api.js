// Test script for States API
const baseURL = 'http://localhost:3001/api/states';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status})`);
      console.log(`📊 Results: ${data.count || Object.keys(data.data || {}).length} items`);
      
      // Show sample data
      if (data.data) {
        const sampleKey = Object.keys(data.data)[0];
        if (sampleKey) {
          console.log(`📋 Sample: ${sampleKey} - ${data.data[sampleKey]?.capital || 'N/A'}`);
        }
      }
    } else {
      console.log(`❌ Failed (${response.status}): ${data.error}`);
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting States API Tests...\n');
  
  // Test 1: Get all states and union territories
  await testAPI(`${baseURL}`, 'Get all states and union territories');
  
  // Test 2: Get only states
  await testAPI(`${baseURL}/states`, 'Get only states');
  
  // Test 3: Get only union territories
  await testAPI(`${baseURL}/union-territories`, 'Get only union territories');
  
  // Test 4: Get specific state by name
  await testAPI(`${baseURL}/Karnataka`, 'Get Karnataka by name');
  
  // Test 5: Get specific state by code
  await testAPI(`${baseURL}/MH`, 'Get Maharashtra by code');
  
  // Test 6: Get cities of a state
  await testAPI(`${baseURL}/Tamil Nadu/cities`, 'Get cities of Tamil Nadu');
  
  // Test 7: Get cities with population filter
  await testAPI(`${baseURL}/Maharashtra/cities?minPopulation=1000000`, 'Get Maharashtra cities with population > 1M');
  
  // Test 8: Get traffic hotspots for a state
  await testAPI(`${baseURL}/Delhi/traffic-hotspots`, 'Get Delhi traffic hotspots');
  
  // Test 9: Get all traffic hotspots
  await testAPI(`${baseURL}/traffic-hotspots/all`, 'Get all traffic hotspots');
  
  // Test 10: Get high severity traffic hotspots
  await testAPI(`${baseURL}/traffic-hotspots/all?severity=HIGH`, 'Get high severity traffic hotspots');
  
  // Test 11: Search functionality
  await testAPI(`${baseURL}/search/Mumbai`, 'Search for Mumbai');
  
  // Test 12: Search with filters
  await testAPI(`${baseURL}/search/Bangalore?includeStates=true&includeCities=true`, 'Search for Bangalore (states and cities)');
  
  // Test 13: Get statistics
  await testAPI(`${baseURL}/stats/overview`, 'Get overview statistics');
  
  // Test 14: Filter by type
  await testAPI(`${baseURL}?type=state`, 'Filter by type: states only');
  
  // Test 15: Search functionality in main endpoint
  await testAPI(`${baseURL}?search=Gujarat`, 'Search Gujarat in main endpoint');
  
  console.log('\n🏁 Tests completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testAPI };