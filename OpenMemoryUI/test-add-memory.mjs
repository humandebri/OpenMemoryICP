#!/usr/bin/env node

import playwright from 'playwright';

async function testAddMemory() {
  console.log('🚀 Testing Add Memory functionality...');
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1200, height: 800 });
  
  try {
    // Navigate to the app
    console.log('🌐 Navigating to OpenMemory app...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'tests/screenshots/01-initial-homepage.png', fullPage: true });
    
    // Look for Add Memory buttons
    console.log('🔍 Looking for Add Memory button...');
    
    // Try multiple selectors for the Add Memory button
    const addMemorySelectors = [
      'button:has-text("Add Memory")',
      'button:has-text("Add First Memory")', 
      'text=Add Memory',
      'text=Add First Memory',
      '[data-testid="add-memory"]',
      '.add-memory-btn'
    ];
    
    let addMemoryButton = null;
    for (const selector of addMemorySelectors) {
      try {
        addMemoryButton = await page.waitForSelector(selector, { timeout: 2000 });
        if (addMemoryButton) {
          console.log(`✅ Found Add Memory button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!addMemoryButton) {
      console.log('❌ Could not find Add Memory button, checking page content...');
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Page contains "Add Memory":', pageContent.includes('Add Memory'));
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'tests/screenshots/debug-no-button.png', fullPage: true });
      return;
    }
    
    // Click the Add Memory button
    console.log('🔵 Clicking Add Memory button...');
    await addMemoryButton.click();
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking screenshot after clicking Add Memory...');
    await page.screenshot({ path: 'tests/screenshots/02-add-memory-modal.png', fullPage: true });
    
    // Look for content input field
    console.log('🔍 Looking for content input field...');
    const contentSelectors = [
      'textarea[placeholder*="memory"]',
      'textarea[placeholder*="content"]', 
      'textarea[placeholder*="what"]',
      'textarea',
      'input[placeholder*="memory"]',
      'input[placeholder*="content"]'
    ];
    
    let contentInput = null;
    for (const selector of contentSelectors) {
      try {
        contentInput = await page.waitForSelector(selector, { timeout: 2000 });
        if (contentInput) {
          console.log(`✅ Found content input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (contentInput) {
      console.log('✏️ Filling content input...');
      await contentInput.fill('This is a test memory to verify backend integration with the ICP canister. Testing the connection between the UI and the local OpenMemory backend.');
      await page.waitForTimeout(500);
      
      console.log('📸 Taking screenshot with content filled...');
      await page.screenshot({ path: 'tests/screenshots/03-memory-filled.png', fullPage: true });
      
      // Look for submit button
      console.log('🔍 Looking for submit button...');
      const submitSelectors = [
        'button:has-text("Save")',
        'button:has-text("Add")',
        'button:has-text("Create")',
        'button[type="submit"]',
        'input[type="submit"]'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.waitForSelector(selector, { timeout: 2000 });
          if (submitButton) {
            console.log(`✅ Found submit button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (submitButton) {
        console.log('🚀 Clicking submit button...');
        await submitButton.click();
        
        // Wait for response and any toast notifications
        await page.waitForTimeout(5000);
        
        console.log('📸 Taking final screenshot after submission...');
        await page.screenshot({ path: 'tests/screenshots/04-after-submission.png', fullPage: true });
        
        // Check for any error or success messages
        const toastMessages = await page.$$eval('.toast, .notification, [role="alert"]', (elements) => 
          elements.map(el => el.textContent)
        );
        
        if (toastMessages.length > 0) {
          console.log('📬 Toast messages found:', toastMessages);
        }
        
      } else {
        console.log('❌ Could not find submit button');
        await page.screenshot({ path: 'tests/screenshots/debug-no-submit.png', fullPage: true });
      }
    } else {
      console.log('❌ Could not find content input field');
      await page.screenshot({ path: 'tests/screenshots/debug-no-input.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'tests/screenshots/error-during-test.png', fullPage: true });
  }
  
  console.log('✅ Test completed');
  await page.waitForTimeout(2000); // Keep browser open briefly to see results
  await browser.close();
}

testAddMemory().catch(console.error);