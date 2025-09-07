import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://marrakech-dunes.vercel.app';

test.describe('Simple SPA Routing Test', () => {
  
  test('Home page loads', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(3000); // Wait for page to load
    
    // Check that we get a 200 response, not 404
    const response = await page.goto(FRONTEND_URL);
    expect(response.status()).toBe(200);
    
    // Check that the page has content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    console.log('✅ Home page loads successfully');
  });

  test('Activities page loads (SPA routing)', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/activities`);
    
    // Should not be 404 - should be 200 with React app
    expect(response.status()).toBe(200);
    
    await page.waitForTimeout(3000);
    
    // Check that the page has content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    console.log('✅ Activities page loads via SPA routing');
  });

  test('Booking page loads (SPA routing)', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/booking`);
    
    // Should not be 404 - should be 200 with React app
    expect(response.status()).toBe(200);
    
    await page.waitForTimeout(3000);
    
    // Check that the page has content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    console.log('✅ Booking page loads via SPA routing');
  });

  test('Reviews page loads (SPA routing)', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/reviews`);
    
    // Should not be 404 - should be 200 with React app
    expect(response.status()).toBe(200);
    
    await page.waitForTimeout(3000);
    
    // Check that the page has content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    console.log('✅ Reviews page loads via SPA routing');
  });

  test('Admin page loads (SPA routing)', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/admin`);
    
    // Should not be 404 - should be 200 with React app
    expect(response.status()).toBe(200);
    
    await page.waitForTimeout(3000);
    
    // Check that the page has content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    console.log('✅ Admin page loads via SPA routing');
  });

  test('Non-existent route falls back to React app', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/non-existent-route`);
    
    // Should not be 404 - should be 200 with React app
    expect(response.status()).toBe(200);
    
    await page.waitForTimeout(3000);
    
    // Check that the page has content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    console.log('✅ Non-existent route falls back to React app');
  });

});
