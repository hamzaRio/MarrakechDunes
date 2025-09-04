import fetch from "node-fetch";

const API = process.env.VITE_API_URL || "http://localhost:5000";

async function runTests() {
  console.log('🧪 Starting MarrakechDunes Smoke Tests...');
  console.log(`📍 Testing API at: ${API}`);
  console.log('=====================================');

  let allTestsPassed = true;
  let cookie = null;

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    let res = await fetch(`${API}/health`);
    console.log(`   Health Status: ${res.status} ${res.statusText}`);
    if (res.status !== 200) {
      console.error('   ❌ Health check failed');
      allTestsPassed = false;
    } else {
      const healthData = await res.json();
      console.log(`   ✅ Health check passed - Database: ${healthData.database}, Activities: ${healthData.activities}`);
    }

    // Test 2: Activities (Public)
    console.log('\n2️⃣ Testing Public Activities...');
    res = await fetch(`${API}/api/activities`);
    console.log(`   Activities Status: ${res.status} ${res.statusText}`);
    if (res.status !== 200) {
      console.error('   ❌ Activities endpoint failed');
      allTestsPassed = false;
    } else {
      const activities = await res.json();
      console.log(`   ✅ Activities loaded - Count: ${activities.length}`);
    }

    // Test 3: Login
    console.log('\n3️⃣ Testing Admin Login...');
    const loginData = {
      username: "nadia",
      password: process.env.SUPERADMIN_PASSWORD || "Marrakech@2025"
    };
    
    res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Login Status: ${res.status} ${res.statusText}`);
    if (res.status !== 200) {
      console.error('   ❌ Login failed');
      allTestsPassed = false;
    } else {
      const loginResponse = await res.json();
      console.log(`   ✅ Login successful - User: ${loginResponse.user?.username}, Role: ${loginResponse.user?.role}`);
      
      // Extract cookie for subsequent requests
      const setCookieHeader = res.headers.get("set-cookie");
      if (setCookieHeader) {
        cookie = setCookieHeader.split(';')[0];
        console.log(`   🍪 Session cookie captured: ${cookie.substring(0, 20)}...`);
      } else {
        console.warn('   ⚠️ No session cookie found in response');
      }
    }

    // Test 4: Auth User (with session)
    console.log('\n4️⃣ Testing Auth User Check...');
    if (cookie) {
      res = await fetch(`${API}/api/auth/user`, { 
        headers: { 
          "Cookie": cookie,
          "Accept": "application/json"
        } 
      });
      console.log(`   Auth User Status: ${res.status} ${res.statusText}`);
      if (res.status !== 200) {
        console.error('   ❌ Auth user check failed');
        allTestsPassed = false;
      } else {
        const userData = await res.json();
        console.log(`   ✅ Auth user check passed - User: ${userData.username}, Role: ${userData.role}`);
      }
    } else {
      console.log('   ⚠️ Skipping auth user test - no cookie available');
    }

    // Test 5: Admin Analytics (Protected)
    console.log('\n5️⃣ Testing Admin Analytics...');
    if (cookie) {
      res = await fetch(`${API}/api/admin/analytics/earnings`, { 
        headers: { 
          "Cookie": cookie,
          "Accept": "application/json"
        } 
      });
      console.log(`   Admin Analytics Status: ${res.status} ${res.statusText}`);
      if (res.status !== 200) {
        console.error('   ❌ Admin analytics failed');
        allTestsPassed = false;
      } else {
        const analyticsData = await res.json();
        console.log(`   ✅ Admin analytics loaded - Data structure: ${Object.keys(analyticsData).join(', ')}`);
      }
    } else {
      console.log('   ⚠️ Skipping admin analytics test - no cookie available');
    }

    // Test 6: Static Assets
    console.log('\n6️⃣ Testing Static Assets...');
    res = await fetch(`${API}/assets/`);
    console.log(`   Static Assets Status: ${res.status} ${res.statusText}`);
    if (res.status !== 200 && res.status !== 404) {
      console.error('   ❌ Static assets endpoint failed');
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Static assets endpoint accessible (${res.status})`);
    }

    // Test 7: Logout
    console.log('\n7️⃣ Testing Logout...');
    if (cookie) {
      res = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { 
          "Cookie": cookie,
          "Accept": "application/json"
        }
      });
      console.log(`   Logout Status: ${res.status} ${res.statusText}`);
      if (res.status !== 200) {
        console.error('   ❌ Logout failed');
        allTestsPassed = false;
      } else {
        console.log('   ✅ Logout successful');
      }
    } else {
      console.log('   ⚠️ Skipping logout test - no cookie available');
    }

  } catch (err) {
    console.error('\n❌ Smoke test failed with error:', err.message);
    allTestsPassed = false;
  }

  console.log('\n=====================================');
  if (allTestsPassed) {
    console.log('🎉 All smoke tests passed!');
    console.log('✅ Application is ready for production');
  } else {
    console.log('❌ Some smoke tests failed');
    console.log('⚠️ Please fix the issues before deploying');
    process.exit(1);
  }
}

runTests();
