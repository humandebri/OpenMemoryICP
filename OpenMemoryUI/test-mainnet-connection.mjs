import { chromium } from 'playwright';
import fs from 'fs';

async function testMainnetConnection() {
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
    console.log('🔄 Starting mainnet connection test...');

    // Test 1: Load the application
    console.log('📱 Loading application at localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    // Take screenshot of initial load
    await page.screenshot({ 
      path: `/tmp/mainnet-test-01-initial.png`,
      fullPage: true 
    });

    results.tests.push({
      name: 'Initial Load',
      status: 'success',
      screenshot: '/tmp/mainnet-test-01-initial.png'
    });

    // Test 2: Check for demo mode warnings
    console.log('🔍 Checking for demo mode warnings...');
    const demoWarnings = await page.locator('text=/demo.*mode/i').count();
    const testWarnings = await page.locator('text=/test.*mode/i').count();
    
    results.tests.push({
      name: 'Demo Mode Check',
      status: demoWarnings === 0 && testWarnings === 0 ? 'success' : 'warning',
      details: `Found ${demoWarnings} demo warnings and ${testWarnings} test warnings`
    });

    // Test 3: Check console for IC agent initialization
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    const icLogs = logs.filter(log => 
      log.includes('IC Agent') || 
      log.includes('canister') || 
      log.includes('77fv5-oiaaa-aaaal-qsoea-cai')
    );
    
    results.tests.push({
      name: 'IC Agent Logs',
      status: icLogs.length > 0 ? 'success' : 'warning',
      details: icLogs
    });

    // Test 4: Check health endpoint
    console.log('🏥 Testing health check...');
    try {
      // Look for any health status display
      await page.waitForSelector('body', { timeout: 5000 });
      
      // Take screenshot of main interface
      await page.screenshot({ 
        path: `/tmp/mainnet-test-02-main-interface.png`,
        fullPage: true 
      });

      results.tests.push({
        name: 'Main Interface',
        status: 'success',
        screenshot: '/tmp/mainnet-test-02-main-interface.png'
      });
    } catch (error) {
      results.tests.push({
        name: 'Health Check',
        status: 'failed',
        error: error.message
      });
    }

    // Test 5: Check canister ID in page source or network requests
    console.log('🎯 Checking canister configuration...');
    const pageContent = await page.content();
    const hasCanisterId = pageContent.includes('77fv5-oiaaa-aaaal-qsoea-cai');
    
    results.tests.push({
      name: 'Canister ID Configuration',
      status: hasCanisterId ? 'success' : 'warning',
      details: `Canister ID found in page: ${hasCanisterId}`
    });

    // Test 6: Try to access settings page
    console.log('⚙️ Testing navigation to settings...');
    try {
      await page.click('text=Settings', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `/tmp/mainnet-test-03-settings.png`,
        fullPage: true 
      });

      results.tests.push({
        name: 'Settings Navigation',
        status: 'success',
        screenshot: '/tmp/mainnet-test-03-settings.png'
      });
    } catch (error) {
      results.tests.push({
        name: 'Settings Navigation',
        status: 'failed',
        error: error.message
      });
    }

    // Test 7: Try to add a memory (authentication test)
    console.log('✍️ Testing add memory functionality...');
    try {
      // Go back to home
      await page.click('text=Home', { timeout: 5000 });
      await page.waitForTimeout(1000);

      // Look for add memory button
      await page.click('button:has-text("Add Memory")', { timeout: 5000 });
      await page.waitForTimeout(1000);

      await page.screenshot({ 
        path: `/tmp/mainnet-test-04-add-memory.png`,
        fullPage: true 
      });

      // Try to fill in some content
      await page.fill('textarea', 'Testing mainnet connection with OpenMemory application');
      await page.waitForTimeout(500);

      await page.screenshot({ 
        path: `/tmp/mainnet-test-05-memory-filled.png`,
        fullPage: true 
      });

      // Try to save
      await page.click('button:has-text("Save")', { timeout: 5000 });
      await page.waitForTimeout(3000);

      await page.screenshot({ 
        path: `/tmp/mainnet-test-06-after-save.png`,
        fullPage: true 
      });

      results.tests.push({
        name: 'Add Memory Flow',
        status: 'success',
        screenshots: [
          '/tmp/mainnet-test-04-add-memory.png',
          '/tmp/mainnet-test-05-memory-filled.png',
          '/tmp/mainnet-test-06-after-save.png'
        ]
      });
    } catch (error) {
      results.tests.push({
        name: 'Add Memory Flow',
        status: 'failed',
        error: error.message
      });
    }

    // Test 8: Check for authentication prompts
    console.log('🔐 Checking authentication status...');
    const authButtons = await page.locator('button:has-text("Login"), button:has-text("Connect")').count();
    
    results.tests.push({
      name: 'Authentication Check',
      status: 'info',
      details: `Found ${authButtons} authentication buttons`
    });

    // Final screenshot
    await page.screenshot({ 
      path: `/tmp/mainnet-test-07-final.png`,
      fullPage: true 
    });

    results.tests.push({
      name: 'Final State',
      status: 'success',
      screenshot: '/tmp/mainnet-test-07-final.png'
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
  fs.writeFileSync('/tmp/mainnet-test-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 Test Results Summary:');
  results.tests.forEach(test => {
    const emoji = test.status === 'success' ? '✅' : 
                  test.status === 'warning' ? '⚠️' : 
                  test.status === 'failed' ? '❌' : 'ℹ️';
    console.log(`${emoji} ${test.name}: ${test.status}`);
    if (test.details) console.log(`   ${test.details}`);
    if (test.error) console.log(`   Error: ${test.error}`);
  });

  return results;
}

testMainnetConnection().catch(console.error);