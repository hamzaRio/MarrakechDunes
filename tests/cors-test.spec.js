import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://marrakech-dunes.vercel.app';
const BACKEND_URL = 'https://marrakechdunes.onrender.com';

test.describe('CORS and API Connectivity Test', () => {
  
  test('Test CORS preflight request', async ({ page }) => {
    // Navigate to frontend
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(3000);
    
    // Test direct API call from browser
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('https://marrakechdunes.onrender.com/api/health', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        return {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: await res.text()
        };
      } catch (error) {
        return {
          error: error.message,
          name: error.name
        };
      }
    });
    
    console.log('API Response:', response);
    
    if (response.error) {
      console.log('❌ CORS Error:', response.error);
    } else {
      console.log('✅ API call successful:', response.status);
    }
  });

  test('Test activities API call', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(3000);
    
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('https://marrakechdunes.onrender.com/api/activities', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        return {
          status: res.status,
          statusText: res.statusText,
          body: await res.text()
        };
      } catch (error) {
        return {
          error: error.message,
          name: error.name
        };
      }
    });
    
    console.log('Activities API Response:', response);
    
    if (response.error) {
      console.log('❌ Activities API Error:', response.error);
    } else {
      console.log('✅ Activities API call successful:', response.status);
    }
  });

  test('Test static assets CORS', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(3000);
    
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('https://marrakechdunes.onrender.com/attached_assets/riad-kheirredine_1756041288677.jpg', {
          method: 'GET',
          credentials: 'include'
        });
        return {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries())
        };
      } catch (error) {
        return {
          error: error.message,
          name: error.name
        };
      }
    });
    
    console.log('Static Assets Response:', response);
    
    if (response.error) {
      console.log('❌ Static Assets Error:', response.error);
    } else {
      console.log('✅ Static Assets call successful:', response.status);
    }
  });

});
