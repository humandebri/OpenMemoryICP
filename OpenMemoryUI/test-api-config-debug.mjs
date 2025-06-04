import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture network requests
  const networkLogs = [];
  page.on('request', request => {
    networkLogs.push({
      type: 'request',
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('response', response => {
    networkLogs.push({
      type: 'response',
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('Navigating to deployed frontend...');
    await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/');
    await page.waitForLoadState('networkidle');
    
    console.log('Taking initial screenshot...');
    await page.screenshot({ path: 'debug-api-config-01-initial.png', fullPage: true });
    
    console.log('Navigating to Settings...');
    await page.click('text=Settings');
    await page.waitForTimeout(2000);
    
    console.log('Clicking on AI設定 tab...');
    await page.click('text=AI設定');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'debug-api-config-02-ai-settings.png', fullPage: true });
    
    console.log('Looking for API key input...');
    const apiKeyInput = await page.locator('input[placeholder*="API"]').first();
    if (await apiKeyInput.isVisible()) {
      console.log('Found API key input, filling with test key...');
      await apiKeyInput.fill('sk-test1234567890abcdefghijklmnopqrstuvwxyz');
      await page.waitForTimeout(500);
      
      console.log('Looking for Save Configuration button...');
      const saveButton = await page.locator('button:has-text("Save Configuration")');
      if (await saveButton.isVisible()) {
        console.log('Found Save Configuration button, clicking...');
        await page.screenshot({ path: 'debug-api-config-03-before-save.png', fullPage: true });
        
        // Click save and wait for response
        await saveButton.click();
        console.log('Clicked Save Configuration, waiting for response...');
        
        // Wait for a few seconds to capture any async responses
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'debug-api-config-04-after-save.png', fullPage: true });
      } else {
        console.log('Save Configuration button not found');
      }
    } else {
      console.log('API key input not found');
    }
    
    // Save detailed logs
    const debugReport = {
      consoleLogs,
      networkLogs,
      testCompleted: true,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('debug-api-config-report.json', JSON.stringify(debugReport, null, 2));
    console.log('\nDebug report saved to debug-api-config-report.json');
    
    // Print key findings
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      if (log.text.includes('config') || log.text.includes('error') || log.text.includes('API')) {
        console.log(`[${log.type}] ${log.text}`);
      }
    });
    
    console.log('\n=== NETWORK REQUESTS ===');
    networkLogs.forEach(log => {
      if (log.url.includes('config') || log.url.includes('77fv5')) {
        console.log(`[${log.type}] ${log.method || 'RESPONSE'} ${log.url} - Status: ${log.status || 'N/A'}`);
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'debug-api-config-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();