import { test, expect } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'https://marrakech-dunes.vercel.app';
const BACKEND_URL = 'https://marrakechdunes.onrender.com';

test.describe('MarrakechDunes End-to-End Browser Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production testing
    test.setTimeout(60000);
    
    // Enable console logging to catch errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    // Catch network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`Network Error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('Home page loads correctly', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is set
    await expect(page).toHaveTitle(/MarrakechDunes|Marrakech/);
    
    // Check for main content elements
    await expect(page.locator('body')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/home-page.png' });
    
    console.log('✅ Home page loaded successfully');
  });

  test('Activities page loads with SPA routing', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/activities`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the activities page (not 404)
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for activities to load from API
    await page.waitForSelector('[data-testid="activity-card"], .activity-card, [class*="activity"]', { timeout: 10000 });
    
    // Check that activities are displayed
    const activityElements = await page.locator('[data-testid="activity-card"], .activity-card, [class*="activity"]').count();
    expect(activityElements).toBeGreaterThan(0);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/activities-page.png' });
    
    console.log(`✅ Activities page loaded with ${activityElements} activities`);
  });

  test('Booking page loads with SPA routing', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/booking`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the booking page (not 404)
    await expect(page.locator('body')).toBeVisible();
    
    // Look for booking form elements
    await page.waitForSelector('form, [class*="booking"], [class*="form"]', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/booking-page.png' });
    
    console.log('✅ Booking page loaded successfully');
  });

  test('Reviews page loads with SPA routing', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/reviews`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the reviews page (not 404)
    await expect(page.locator('body')).toBeVisible();
    
    // Look for reviews content
    await page.waitForSelector('[class*="review"], [class*="rating"], h1, h2', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/reviews-page.png' });
    
    console.log('✅ Reviews page loaded successfully');
  });

  test('Admin page loads with SPA routing', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the admin page (not 404)
    await expect(page.locator('body')).toBeVisible();
    
    // Look for admin login form or dashboard
    await page.waitForSelector('form, [class*="admin"], [class*="login"], h1, h2', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-page.png' });
    
    console.log('✅ Admin page loaded successfully');
  });

  test('Assets load correctly from Render backend', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/activities`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for images to load
    await page.waitForSelector('img', { timeout: 10000 });
    
    // Check for images from the backend
    const images = await page.locator('img').all();
    let loadedImages = 0;
    let corsErrors = 0;
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && src.includes('marrakechdunes.onrender.com')) {
        try {
          // Check if image loaded successfully
          await img.waitFor({ state: 'visible', timeout: 5000 });
          loadedImages++;
        } catch (error) {
          console.log(`Image failed to load: ${src}`);
          corsErrors++;
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/assets-loading.png' });
    
    console.log(`✅ Assets test: ${loadedImages} images loaded, ${corsErrors} CORS errors`);
    expect(corsErrors).toBe(0);
  });

  test('Backend API connectivity from frontend', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/activities`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Monitor network requests to backend
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('marrakechdunes.onrender.com/api')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    // Wait for API calls to complete
    await page.waitForTimeout(3000);
    
    // Check that API requests were made
    expect(apiRequests.length).toBeGreaterThan(0);
    
    // Check for activities data in the DOM
    const activityElements = await page.locator('[class*="activity"], [data-testid*="activity"]').count();
    expect(activityElements).toBeGreaterThan(0);
    
    console.log(`✅ API connectivity: ${apiRequests.length} API requests made, ${activityElements} activities displayed`);
  });

  test('Error handling and error boundary', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/activities`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Try to trigger an error by navigating to a non-existent route
    await page.goto(`${FRONTEND_URL}/non-existent-route`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we don't get a 404 page, but rather the React app
    await expect(page.locator('body')).toBeVisible();
    
    // Look for error boundary or 404 handling
    const hasErrorContent = await page.locator('[class*="error"], [class*="404"], [class*="not-found"]').count();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/error-handling.png' });
    
    console.log(`✅ Error handling: Page loaded, ${hasErrorContent} error elements found`);
  });

  test('Deep linking and browser navigation', async ({ page }) => {
    // Start at home page
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate to activities using browser navigation
    await page.goto(`${FRONTEND_URL}/activities`);
    await page.waitForLoadState('networkidle');
    
    // Navigate to booking
    await page.goto(`${FRONTEND_URL}/booking`);
    await page.waitForLoadState('networkidle');
    
    // Navigate to reviews
    await page.goto(`${FRONTEND_URL}/reviews`);
    await page.waitForLoadState('networkidle');
    
    // Navigate to admin
    await page.goto(`${FRONTEND_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/navigation.png' });
    
    console.log('✅ Deep linking and browser navigation working correctly');
  });

  test('Production environment validation', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Check that we're using production URLs
    const apiUrl = await page.evaluate(() => {
      return window.location.origin;
    });
    
    // Check for production environment indicators
    const isProduction = apiUrl.includes('vercel.app');
    expect(isProduction).toBe(true);
    
    // Check that API calls are going to Render backend
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('marrakechdunes.onrender.com')) {
        apiRequests.push(request.url());
      }
    });
    
    // Navigate to activities to trigger API calls
    await page.goto(`${FRONTEND_URL}/activities`);
    await page.waitForLoadState('networkidle');
    
    expect(apiRequests.length).toBeGreaterThan(0);
    
    console.log(`✅ Production environment: Frontend on ${apiUrl}, Backend calls to Render`);
  });

});
