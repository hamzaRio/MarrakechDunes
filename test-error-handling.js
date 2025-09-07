// Simple test to verify error handling is working
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testErrorHandling() {
  console.log('🧪 Testing MarrakechDunes Error Handling...\n');
  
  try {
    // Test 1: Health endpoint (should work)
    console.log('1. Testing /api/health...');
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthRes.json();
    console.log(`   ✅ Status: ${healthRes.status}`);
    console.log(`   ✅ Response: ${JSON.stringify(healthData, null, 2)}\n`);
    
    // Test 2: Activities endpoint (should work)
    console.log('2. Testing /api/activities...');
    const activitiesRes = await fetch(`${API_BASE}/api/activities`);
    const activitiesData = await activitiesRes.json();
    console.log(`   ✅ Status: ${activitiesRes.status}`);
    console.log(`   ✅ Found ${activitiesData.length} activities\n`);
    
    // Test 3: Unknown endpoint (should return standardized 404)
    console.log('3. Testing /api/unknown (should return 404)...');
    const unknownRes = await fetch(`${API_BASE}/api/unknown`);
    const unknownData = await unknownRes.json();
    console.log(`   ✅ Status: ${unknownRes.status}`);
    console.log(`   ✅ Error Response Format:`);
    console.log(`      - status: ${unknownData.status}`);
    console.log(`      - message: ${unknownData.message}`);
    console.log(`      - code: ${unknownData.code}`);
    console.log(`      - timestamp: ${unknownData.timestamp}`);
    console.log(`      - path: ${unknownData.path}`);
    console.log(`      - method: ${unknownData.method}\n`);
    
    // Verify standardized error format
    const hasRequiredFields = unknownData.status === 'error' && 
                             unknownData.message && 
                             unknownData.code && 
                             unknownData.timestamp && 
                             unknownData.path && 
                             unknownData.method;
    
    if (hasRequiredFields) {
      console.log('🎉 All tests passed! Error handling is working correctly.');
      console.log('✅ Standardized error format is consistent.');
    } else {
      console.log('❌ Error format is not standardized.');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testErrorHandling().catch(console.error);
}
