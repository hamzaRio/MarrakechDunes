// Test script to verify key endpoints work correctly
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testEndpoint(path, expectedStatus = 200) {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    console.log(`✅ ${path}: ${response.status} ${response.statusText}`);
    
    if (response.status === expectedStatus) {
      if (path === '/api/activities') {
        const data = await response.json();
        console.log(`   📊 Found ${data.length} activities`);
      }
      return true;
    } else {
      console.log(`   ❌ Expected ${expectedStatus}, got ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${path}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing MarrakechDunes API endpoints...\n');
  
  const tests = [
    { path: '/', expectedStatus: 200 },
    { path: '/health', expectedStatus: 200 },
    { path: '/api/health', expectedStatus: 200 },
    { path: '/api/activities', expectedStatus: 200 },
    { path: '/favicon.ico', expectedStatus: 204 },
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.path, test.expectedStatus);
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the server configuration.');
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
