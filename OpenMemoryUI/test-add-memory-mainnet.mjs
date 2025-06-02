import { chromium } from 'playwright';
import fs from 'fs';

async function testAddMemoryMainnet() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    console.log('🔄 Testing Add Memory functionality with mainnet...');

    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ 
      path: `/tmp/add-memory-test-01-dashboard.png`,
      fullPage: true 
    });

    // Click Add Memory button
    console.log('📝 Clicking Add Memory button...');
    try {
      await page.click('button:has-text("Add Memory")', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `/tmp/add-memory-test-02-modal-opened.png`,
        fullPage: true 
      });

      results.tests.push({
        name: 'Add Memory Modal Opens',
        status: 'success',
        screenshot: '/tmp/add-memory-test-02-modal-opened.png'
      });

      // Try to fill content
      console.log('✍️ Filling memory content...');
      await page.fill('textarea[placeholder*="memory" i], textarea[placeholder*="content" i], textarea', 'Testing mainnet deployment - This is a test memory for the OpenMemory application running on Internet Computer mainnet canister 77fv5-oiaaa-aaaal-qsoea-cai');
      await page.waitForTimeout(500);

      await page.screenshot({ 
        path: `/tmp/add-memory-test-03-content-filled.png`,
        fullPage: true 
      });

      // Try to save
      console.log('💾 Attempting to save memory...');
      await page.click('button:has-text("Save"), button:has-text("Add"), button[type="submit"]', { timeout: 5000 });
      await page.waitForTimeout(5000); // Wait longer for potential authentication or processing

      await page.screenshot({ 
        path: `/tmp/add-memory-test-04-after-save-attempt.png`,
        fullPage: true 
      });

      // Check for authentication prompts or errors
      const authPrompts = await page.locator('text=/login/i, text=/connect/i, text=/authenticate/i, text=/identity/i').count();
      const errorMessages = await page.locator('text=/error/i, text=/failed/i, .error, .alert-error').count();
      
      results.tests.push({
        name: 'Memory Save Attempt',
        status: authPrompts > 0 ? 'requires_auth' : errorMessages > 0 ? 'error' : 'success',
        details: `Authentication prompts: ${authPrompts}, Error messages: ${errorMessages}`
      });

      // Check if modal closed (indicating success)
      const modalVisible = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
      
      if (!modalVisible) {
        console.log('✅ Modal closed - likely successful save');
        results.tests.push({
          name: 'Modal Behavior',
          status: 'success',
          details: 'Modal closed after save attempt'
        });
      }

      // Go back to dashboard to check if memory was added
      await page.click('text=Dashboard', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);

      await page.screenshot({ 
        path: `/tmp/add-memory-test-05-dashboard-after.png`,
        fullPage: true 
      });

      // Check memory count
      const memoryCount = await page.textContent('.statistics [data-testid="memory-count"], .card:has-text("Total Memories") .number, .metric:has-text("Memories") .value').catch(() => '0');
      
      results.tests.push({
        name: 'Memory Count Check',
        status: memoryCount !== '0' ? 'success' : 'pending',
        details: `Memory count: ${memoryCount}`
      });

    } catch (error) {
      results.tests.push({
        name: 'Add Memory Flow',
        status: 'failed',
        error: error.message
      });
    }

    // Test the "Add First Memory" button as alternative
    console.log('🎯 Testing Add First Memory button...');
    try {
      await page.click('button:has-text("Add First Memory")', { timeout: 3000 });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `/tmp/add-memory-test-06-first-memory-modal.png`,
        fullPage: true 
      });

      results.tests.push({
        name: 'Add First Memory Button',
        status: 'success',
        screenshot: '/tmp/add-memory-test-06-first-memory-modal.png'
      });
    } catch (error) {
      results.tests.push({
        name: 'Add First Memory Button',
        status: 'not_found',
        details: 'Button not available or clickable'
      });
    }

    // Check current authentication state
    console.log('🔐 Checking authentication state...');
    const userButton = await page.locator('button:has-text("User"), .user-menu, [data-testid="user-menu"]').count();
    const loginButton = await page.locator('button:has-text("Login"), button:has-text("Connect")').count();
    
    results.tests.push({
      name: 'Authentication State',
      status: 'info',
      details: `User buttons: ${userButton}, Login buttons: ${loginButton}`
    });

    // Final state screenshot
    await page.screenshot({ 
      path: `/tmp/add-memory-test-07-final-state.png`,
      fullPage: true 
    });

  } catch (error) {
    console.error('Test failed:', error);
    results.tests.push({
      name: 'Test Execution',
      status: 'failed',
      error: error.message
    });
  } finally {
    await browser.close();
  }

  // Save results
  fs.writeFileSync('/tmp/add-memory-test-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 Add Memory Test Results:');
  results.tests.forEach(test => {
    const emoji = test.status === 'success' ? '✅' : 
                  test.status === 'requires_auth' ? '🔐' :
                  test.status === 'error' ? '🚨' :
                  test.status === 'failed' ? '❌' : 
                  test.status === 'pending' ? '⏳' :
                  test.status === 'not_found' ? '🚫' : 'ℹ️';
    console.log(`${emoji} ${test.name}: ${test.status}`);
    if (test.details) console.log(`   ${test.details}`);
    if (test.error) console.log(`   Error: ${test.error}`);
  });

  return results;
}

testAddMemoryMainnet().catch(console.error);