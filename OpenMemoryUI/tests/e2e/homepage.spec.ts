import { test, expect } from '@playwright/test';

test.describe('OpenMemoryUI Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
  });

  test('should display the main layout and navigation', async ({ page }) => {
    // Check if the main header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check if navigation links are present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have a working search input', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Test typing in search
    await searchInput.fill('test memory');
    await expect(searchInput).toHaveValue('test memory');
  });

  test('should display add memory functionality', async ({ page }) => {
    // Look for add memory button or form
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that mobile layout is working
      await expect(page.locator('main')).toBeVisible();
      
      // Check that content is not overflowing
      const body = await page.locator('body').boundingBox();
      expect(body?.width).toBeLessThanOrEqual(400); // Mobile width
    }
  });

  test('should show proper page title', async ({ page }) => {
    await expect(page).toHaveTitle(/OpenMemory/);
  });

  test('take homepage screenshot', async ({ page }) => {
    // Take a full page screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/screenshots/homepage-full.png', 
      fullPage: true 
    });
    
    // Take a viewport screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/homepage-viewport.png' 
    });
  });
});

test.describe('OpenMemoryUI Navigation', () => {
  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to search page
    const searchLink = page.locator('a[href*="/search"], nav a:has-text("Search")');
    if (await searchLink.count() > 0) {
      await searchLink.first().click();
      await expect(page).toHaveURL(/.*search.*/);
    }
    
    // Test navigation to clusters page
    await page.goto('/');
    const clustersLink = page.locator('a[href*="/clusters"], nav a:has-text("Cluster")');
    if (await clustersLink.count() > 0) {
      await clustersLink.first().click();
      await expect(page).toHaveURL(/.*cluster.*/);
    }
    
    // Test navigation to categories page
    await page.goto('/');
    const categoriesLink = page.locator('a[href*="/categories"], nav a:has-text("Categories")');
    if (await categoriesLink.count() > 0) {
      await categoriesLink.first().click();
      await expect(page).toHaveURL(/.*categories.*/);
    }
  });
});