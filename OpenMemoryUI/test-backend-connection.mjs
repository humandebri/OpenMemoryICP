import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBackendConnection() {
  console.log('Starting backend connection test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Listen for console messages to capture any errors
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  try {
    console.log('1. Navigating to localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);
    
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ 
      path: join(__dirname, 'backend-test-01-initial.png'),
      fullPage: true 
    });
    
    // Check for demo mode warning
    console.log('3. Checking for demo mode warning...');
    const demoWarning = await page.locator('text=demo mode').count();
    console.log(`Demo mode warning found: ${demoWarning > 0 ? 'YES' : 'NO'}`);
    
    // Check for IC Agent status
    console.log('4. Checking IC Agent status...');
    const icAgentStatus = await page.evaluate(() => {
      return window.localStorage.getItem('ic-agent-status') || 'unknown';
    });
    console.log(`IC Agent status: ${icAgentStatus}`);
    
    // Look for any connection status indicators
    const connectionIndicators = await page.locator('[data-testid*="connection"], [class*="connection"], [class*="status"]').count();
    console.log(`Connection indicators found: ${connectionIndicators}`);
    
    console.log('5. Refreshing the page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: join(__dirname, 'backend-test-02-after-refresh.png'),
      fullPage: true 
    });
    
    // Check demo mode warning again after refresh
    const demoWarningAfterRefresh = await page.locator('text=demo mode').count();
    console.log(`Demo mode warning after refresh: ${demoWarningAfterRefresh > 0 ? 'YES' : 'NO'}`);
    
    console.log('6. Attempting to add a memory...');
    
    // Look for add memory button or similar
    const addMemorySelectors = [
      'button:has-text("Add Memory")',
      'button:has-text("+")', 
      '[data-testid="add-memory"]',
      'button[class*="add"]',
      '.add-memory-btn'
    ];
    
    let addButton = null;
    for (const selector of addMemorySelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        addButton = element.first();
        console.log(`Found add button with selector: ${selector}`);
        break;
      }
    }
    
    if (addButton) {
      console.log('7. Clicking add memory button...');
      await addButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: join(__dirname, 'backend-test-03-add-memory-modal.png'),
        fullPage: true 
      });
      
      // Look for modal or form inputs
      const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').count();
      console.log(`Modal/dialog visible: ${modalVisible > 0 ? 'YES' : 'NO'}`);
      
      // Try to fill in memory details if form is visible
      const titleInput = page.locator('input[placeholder*="title"], input[name*="title"], textarea[placeholder*="title"]');
      const contentInput = page.locator('textarea[placeholder*="content"], textarea[placeholder*="memory"], input[placeholder*="content"]');
      
      if (await titleInput.count() > 0 && await contentInput.count() > 0) {
        console.log('8. Filling in memory form...');
        await titleInput.first().fill('Test Memory - Backend Connection');
        await contentInput.first().fill('Testing if the backend connection is working properly with the new IC Agent implementation.');
        
        await page.screenshot({ 
          path: join(__dirname, 'backend-test-04-form-filled.png'),
          fullPage: true 
        });
        
        // Look for submit button
        const submitButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Submit"), button[type="submit"]');
        
        if (await submitButton.count() > 0) {
          console.log('9. Submitting memory...');
          await submitButton.first().click();
          await page.waitForTimeout(3000); // Wait for submission
          
          await page.screenshot({ 
            path: join(__dirname, 'backend-test-05-after-submit.png'),
            fullPage: true 
          });
          
          // Check for success/error messages
          const successMessage = await page.locator('text=success, text=added, text=saved, [class*="success"], [class*="toast"]').count();
          const errorMessage = await page.locator('text=error, text=failed, [class*="error"], [class*="alert"]').count();
          
          console.log(`Success message found: ${successMessage > 0 ? 'YES' : 'NO'}`);
          console.log(`Error message found: ${errorMessage > 0 ? 'YES' : 'NO'}`);
          
        } else {
          console.log('No submit button found');
        }
      } else {
        console.log('No form inputs found in modal');
      }
    } else {
      console.log('No add memory button found');
      
      // Take a screenshot of the current state for debugging
      await page.screenshot({ 
        path: join(__dirname, 'backend-test-debug-no-button.png'),
        fullPage: true 
      });
    }
    
    console.log('10. Final screenshot...');
    await page.screenshot({ 
      path: join(__dirname, 'backend-test-06-final.png'),
      fullPage: true 
    });
    
    // Check network activity and any pending requests
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').length + 
             performance.getEntriesByType('resource').length;
    });
    console.log(`Total network requests: ${networkRequests}`);
    
    // Get any error information from the page
    const pageErrors = await page.evaluate(() => {
      const errors = [];
      if (window.console && window.console.error) {
        // This is a simplified check - in reality we'd need to monkey patch console.error
        errors.push('Check browser console for detailed errors');
      }
      return errors;
    });
    
    console.log('Test completed!');
    console.log('='.repeat(50));
    console.log('SUMMARY:');
    console.log(`- Demo mode warning initially: ${demoWarning > 0 ? 'YES' : 'NO'}`);
    console.log(`- Demo mode warning after refresh: ${demoWarningAfterRefresh > 0 ? 'YES' : 'NO'}`);
    console.log(`- IC Agent status: ${icAgentStatus}`);
    console.log(`- Add memory button found: ${addButton ? 'YES' : 'NO'}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ 
      path: join(__dirname, 'backend-test-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testBackendConnection().catch(console.error);