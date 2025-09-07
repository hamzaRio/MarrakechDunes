#!/usr/bin/env node

/**
 * Comprehensive Error Handling Test Suite for MarrakechDunes
 * Tests all error scenarios and validates standardized error responses
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
let testResults = [];

// Utility function to make HTTP requests
async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test result tracking
function recordTest(testName, passed, details = '') {
  if (passed) {
    testsPassed++;
    console.log(`✅ ${testName}`);
  } else {
    testsFailed++;
    console.log(`❌ ${testName}: ${details}`);
  }
  testResults.push({ testName, passed, details });
}

// Validate standardized error response format
function validateErrorResponse(response, expectedStatus, expectedCode = null) {
  if (response.status !== expectedStatus) {
    return `Expected status ${expectedStatus}, got ${response.status}`;
  }
  
  try {
    const errorData = response.json();
    if (!errorData.status || errorData.status !== 'error') {
      return `Missing or invalid status field: ${errorData.status}`;
    }
    
    if (!errorData.message) {
      return 'Missing message field';
    }
    
    if (!errorData.code) {
      return 'Missing code field';
    }
    
    if (!errorData.timestamp) {
      return 'Missing timestamp field';
    }
    
    if (!errorData.path) {
      return 'Missing path field';
    }
    
    if (!errorData.method) {
      return 'Missing method field';
    }
    
    if (expectedCode && errorData.code !== expectedCode) {
      return `Expected code ${expectedCode}, got ${errorData.code}`;
    }
    
    return null; // No errors
  } catch (error) {
    return `Invalid JSON response: ${error.message}`;
  }
}

// Test 1: Health endpoint (should work)
async function testHealthEndpoint() {
  try {
    const response = await makeRequest(`${API_BASE}/api/health`);
    const data = await response.json();
    
    const passed = response.status === 200 && data.status === 'healthy';
    recordTest('Health Endpoint (200 OK)', passed, 
      passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    
    return passed;
  } catch (error) {
    recordTest('Health Endpoint (200 OK)', false, error.message);
    return false;
  }
}

// Test 2: Activities endpoint (should work)
async function testActivitiesEndpoint() {
  try {
    const response = await makeRequest(`${API_BASE}/api/activities`);
    const data = await response.json();
    
    const passed = response.status === 200 && Array.isArray(data);
    recordTest('Activities Endpoint (200 OK)', passed,
      passed ? `Found ${data.length} activities` : `Status: ${response.status}`);
    
    return passed;
  } catch (error) {
    recordTest('Activities Endpoint (200 OK)', false, error.message);
    return false;
  }
}

// Test 3: 404 error handling
async function test404Error() {
  try {
    const response = await makeRequest(`${API_BASE}/api/unknown-endpoint`);
    const errorData = await response.json();
    
    const validationError = validateErrorResponse(response, 404, 'NOT_FOUND_ERROR');
    const passed = !validationError;
    
    recordTest('404 Error Handling', passed, validationError || 
      `Code: ${errorData.code}, Message: ${errorData.message}`);
    
    return passed;
  } catch (error) {
    recordTest('404 Error Handling', false, error.message);
    return false;
  }
}

// Test 4: Authentication error (401)
async function testAuthenticationError() {
  try {
    const response = await makeRequest(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'invalid',
        password: 'wrong'
      })
    });
    
    const errorData = await response.json();
    const validationError = validateErrorResponse(response, 401, 'AUTHENTICATION_ERROR');
    const passed = !validationError;
    
    recordTest('Authentication Error (401)', passed, validationError ||
      `Code: ${errorData.code}, Message: ${errorData.message}`);
    
    return passed;
  } catch (error) {
    recordTest('Authentication Error (401)', false, error.message);
    return false;
  }
}

// Test 5: Rate limiting error (429)
async function testRateLimitError() {
  try {
    // Make multiple requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(makeRequest(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        })
      }));
    }
    
    const responses = await Promise.allSettled(promises);
    const rateLimitedResponse = responses.find(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );
    
    if (rateLimitedResponse) {
      const response = rateLimitedResponse.value;
      const errorData = await response.json();
      const validationError = validateErrorResponse(response, 429, 'RATE_LIMIT_ERROR');
      const passed = !validationError;
      
      recordTest('Rate Limit Error (429)', passed, validationError ||
        `Code: ${errorData.code}, Message: ${errorData.message}`);
      
      return passed;
    } else {
      recordTest('Rate Limit Error (429)', false, 'Rate limiting not triggered');
      return false;
    }
  } catch (error) {
    recordTest('Rate Limit Error (429)', false, error.message);
    return false;
  }
}

// Test 6: Server error (500) - trigger with invalid data
async function testServerError() {
  try {
    const response = await makeRequest(`${API_BASE}/api/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        // Invalid data to trigger server error
        invalidField: 'invalid'
      })
    });
    
    const errorData = await response.json();
    const validationError = validateErrorResponse(response, 500);
    const passed = !validationError;
    
    recordTest('Server Error (500)', passed, validationError ||
      `Code: ${errorData.code}, Message: ${errorData.message}`);
    
    return passed;
  } catch (error) {
    recordTest('Server Error (500)', false, error.message);
    return false;
  }
}

// Test 7: Validation error (400)
async function testValidationError() {
  try {
    const response = await makeRequest(`${API_BASE}/api/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
        customerName: '',
        customerPhone: '',
        activityId: 'invalid-id'
      })
    });
    
    const errorData = await response.json();
    const validationError = validateErrorResponse(response, 400);
    const passed = !validationError;
    
    recordTest('Validation Error (400)', passed, validationError ||
      `Code: ${errorData.code}, Message: ${errorData.message}`);
    
    return passed;
  } catch (error) {
    recordTest('Validation Error (400)', false, error.message);
    return false;
  }
}

// Test 8: CORS headers
async function testCORSHeaders() {
  try {
    const response = await makeRequest(`${API_BASE}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    const passed = corsHeader !== null;
    
    recordTest('CORS Headers', passed, 
      passed ? `CORS header: ${corsHeader}` : 'Missing CORS headers');
    
    return passed;
  } catch (error) {
    recordTest('CORS Headers', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 MarrakechDunes Error Handling Test Suite');
  console.log('==========================================');
  console.log(`Testing API at: ${API_BASE}`);
  console.log('');

  // Run all tests
  await testHealthEndpoint();
  await testActivitiesEndpoint();
  await test404Error();
  await testAuthenticationError();
  await testRateLimitError();
  await testServerError();
  await testValidationError();
  await testCORSHeaders();

  // Print summary
  console.log('');
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed > 0) {
    console.log('');
    console.log('❌ Failed Tests:');
    testResults
      .filter(r => !r.passed)
      .forEach(r => console.log(`  - ${r.testName}: ${r.details}`));
  }
  
  console.log('');
  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Error handling is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the error handling implementation.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    console.error('❌ Test runner error:', error.message);
    process.exit(1);
  });
}
