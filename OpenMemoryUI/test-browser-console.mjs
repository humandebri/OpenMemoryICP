import { chromium } from 'playwright';

async function testBrowserConsole() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  // Capture network errors
  const networkErrors = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('🔄 Loading application and checking console...');

    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    console.log('📝 Opening Add Memory modal...');
    await page.click('button:has-text("Add Memory")');
    await page.waitForTimeout(1000);

    console.log('✍️ Filling content...');
    await page.fill('textarea', 'Test memory for mainnet deployment');
    await page.waitForTimeout(500);

    console.log('💾 Attempting to save (direct button click)...');
    
    // Try different approaches to click the save button
    try {
      // First try: direct click with force
      await page.click('button:has-text("Save Memory")', { force: true, timeout: 2000 });
    } catch (e) {
      console.log('Direct click failed, trying JavaScript click...');
      // Second try: JavaScript click
      await page.evaluate(() => {
        const saveButton = document.querySelector('button:has-text("Save Memory"), button[class*="save"], button[type="submit"]');
        if (saveButton) saveButton.click();
      });
    }

    await page.waitForTimeout(5000);

    // Take screenshot of result
    await page.screenshot({ 
      path: `/tmp/console-test-result.png`,
      fullPage: true 
    });

    console.log('\n📊 Console Messages:');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });

    console.log('\n🌐 Network Errors:');
    networkErrors.forEach(err => {
      console.log(`${err.status} ${err.statusText}: ${err.url}`);
    });

    // Check if there are authentication-related console messages
    const authMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('auth') || 
      msg.text.toLowerCase().includes('identity') ||
      msg.text.toLowerCase().includes('login') ||
      msg.text.toLowerCase().includes('principal')
    );

    console.log('\n🔐 Authentication-related messages:');
    authMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });

    // Check for IC-related messages
    const icMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('canister') || 
      msg.text.toLowerCase().includes('ic ') ||
      msg.text.toLowerCase().includes('agent') ||
      msg.text.includes('77fv5-oiaaa-aaaal-qsoea-cai')
    );

    console.log('\n🌐 IC/Canister-related messages:');
    icMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });

  } catch (error) {
    console.error('Test failed:', error);
  }

  // Keep browser open for manual inspection
  console.log('\n⏸️  Browser kept open for manual inspection. Close it when done.');
  // Don't close automatically - let user inspect
  // await browser.close();
}

testBrowserConsole().catch(console.error);