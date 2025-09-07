import https from 'https';

// Test function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { 
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testProductionEndpoints() {
  console.log('🧪 Testing Production Endpoints...\n');
  
  const tests = [
    {
      name: 'Backend Health Check',
      url: 'https://marrakechdunes.onrender.com/api/health',
      expectedStatus: 200
    },
    {
      name: 'Activities API',
      url: 'https://marrakechdunes.onrender.com/api/activities',
      expectedStatus: 200
    },
    {
      name: 'Auth User Endpoint',
      url: 'https://marrakechdunes.onrender.com/api/auth/user',
      expectedStatus: 401 // Should return 401 for unauthenticated requests
    },
    {
      name: 'Static Asset - Riad Image',
      url: 'https://marrakechdunes.onrender.com/attached_assets/riad-kheirredine_1756041288677.jpg',
      expectedStatus: 200
    },
    {
      name: 'Static Asset - Ourika Valley Image',
      url: 'https://marrakechdunes.onrender.com/attached_assets/Ourika Valley Day Trip1_1751114166831.jpg',
      expectedStatus: 200
    },
    {
      name: 'Frontend Home Page',
      url: 'https://marrakech-dunes.vercel.app/',
      expectedStatus: 200
    },
    {
      name: 'Frontend Activities Page',
      url: 'https://marrakech-dunes.vercel.app/activities',
      expectedStatus: 200
    },
    {
      name: 'Frontend Admin Page',
      url: 'https://marrakech-dunes.vercel.app/admin',
      expectedStatus: 200
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      const response = await makeRequest(test.url);
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ PASS: Status ${response.status} (expected ${test.expectedStatus})`);
        passed++;
      } else {
        console.log(`   ❌ FAIL: Status ${response.status} (expected ${test.expectedStatus})`);
        failed++;
      }
      
      // Check CORS headers for assets
      if (test.url.includes('attached_assets')) {
        const corsOrigin = response.headers['access-control-allow-origin'];
        if (corsOrigin === '*') {
          console.log(`   ✅ CORS: Access-Control-Allow-Origin: ${corsOrigin}`);
        } else {
          console.log(`   ⚠️  CORS: Access-Control-Allow-Origin: ${corsOrigin || 'missing'}`);
        }
      }
      
      // Check content type for images
      if (test.url.includes('.jpg') || test.url.includes('.jpeg')) {
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('image/')) {
          console.log(`   ✅ Content-Type: ${contentType}`);
        } else {
          console.log(`   ⚠️  Content-Type: ${contentType || 'missing'}`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
      console.log('');
    }
  }
  
  console.log('📊 Test Results Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  return { passed, failed };
}

async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...\n');
  
  try {
    // Test login endpoint
    console.log('📋 Testing login endpoint...');
    const loginResponse = await makeRequest('https://marrakechdunes.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      })
    });
    
    if (loginResponse.status === 401) {
      console.log('   ✅ Login endpoint returns 401 for invalid credentials');
    } else {
      console.log(`   ⚠️  Login endpoint returned status: ${loginResponse.status}`);
    }
    
    // Test auth user endpoint
    console.log('📋 Testing auth user endpoint...');
    const authUserResponse = await makeRequest('https://marrakechdunes.onrender.com/api/auth/user');
    
    if (authUserResponse.status === 401) {
      console.log('   ✅ Auth user endpoint returns 401 for unauthenticated requests');
    } else {
      console.log(`   ⚠️  Auth user endpoint returned status: ${authUserResponse.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Authentication test error: ${error.message}`);
  }
}

async function testSPARouting() {
  console.log('\n🌐 Testing SPA Routing...\n');
  
  const spaRoutes = [
    'https://marrakech-dunes.vercel.app/',
    'https://marrakech-dunes.vercel.app/activities',
    'https://marrakech-dunes.vercel.app/booking',
    'https://marrakech-dunes.vercel.app/reviews',
    'https://marrakech-dunes.vercel.app/admin',
    'https://marrakech-dunes.vercel.app/non-existent-route'
  ];
  
  let spaPassed = 0;
  let spaFailed = 0;
  
  for (const route of spaRoutes) {
    try {
      console.log(`📋 Testing SPA route: ${route}`);
      const response = await makeRequest(route);
      
      if (response.status === 200) {
        console.log(`   ✅ SPA route accessible: ${response.status}`);
        spaPassed++;
      } else {
        console.log(`   ❌ SPA route failed: ${response.status}`);
        spaFailed++;
      }
      
    } catch (error) {
      console.log(`   ❌ SPA route error: ${error.message}`);
      spaFailed++;
    }
  }
  
  console.log(`\n📊 SPA Routing Results: ${spaPassed}/${spaRoutes.length} routes working`);
  
  return { spaPassed, spaFailed };
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Production Tests...\n');
  
  const endpointResults = await testProductionEndpoints();
  await testAuthenticationFlow();
  const spaResults = await testSPARouting();
  
  console.log('\n🎯 Final Test Summary:');
  console.log(`   📋 Endpoint Tests: ${endpointResults.passed}/${endpointResults.passed + endpointResults.failed} passed`);
  console.log(`   🌐 SPA Routing Tests: ${spaResults.spaPassed}/${spaResults.spaPassed + spaResults.spaFailed} passed`);
  
  const totalPassed = endpointResults.passed + spaResults.spaPassed;
  const totalFailed = endpointResults.failed + spaResults.spaFailed;
  
  console.log(`   🏆 Overall Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
  
  if (totalFailed === 0) {
    console.log('\n✅ ALL TESTS PASSED - PRODUCTION READY!');
  } else {
    console.log(`\n⚠️  ${totalFailed} tests failed - review required`);
  }
}

runAllTests().catch(console.error);
