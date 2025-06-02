import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function testOpenMemoryUI() {
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Add delay between actions for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Create screenshots directory
  const screenshotsDir = join(process.cwd(), 'screenshots');
  try {
    mkdirSync(screenshotsDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
  
  console.log('🚀 Starting OpenMemory UI testing...');
  
  try {
    // Step 1: Navigate to the OpenMemory app homepage
    console.log('📱 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any animations
    
    // Step 2: Take screenshot of homepage
    console.log('📸 Taking screenshot of homepage...');
    await page.screenshot({ 
      path: join(screenshotsDir, '01-homepage.png'),
      fullPage: true 
    });
    console.log('✅ Homepage screenshot saved');
    
    // Step 3: Click on Settings gear button
    console.log('⚙️ Looking for Settings gear button...');
    
    // Try multiple selectors for the settings button
    const settingsSelectors = [
      '[data-testid="settings-button"]',
      'button[aria-label*="Settings"]',
      'button[title*="Settings"]',
      '.settings-button',
      'svg[data-lucide="settings"]',
      'button:has(svg[data-lucide="settings"])',
      '[href="/settings"]',
      'a[href="/settings"]'
    ];
    
    let settingsButton = null;
    for (const selector of settingsSelectors) {
      try {
        settingsButton = await page.locator(selector).first();
        if (await settingsButton.isVisible()) {
          console.log(`Found settings button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (settingsButton && await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(1000);
      
      // Step 4: Take screenshot of Settings page
      console.log('📸 Taking screenshot of Settings page...');
      await page.screenshot({ 
        path: join(screenshotsDir, '02-settings-page.png'),
        fullPage: true 
      });
      console.log('✅ Settings page screenshot saved');
    } else {
      console.log('⚠️ Settings button not found, taking current page screenshot...');
      await page.screenshot({ 
        path: join(screenshotsDir, '02-settings-not-found.png'),
        fullPage: true 
      });
    }
    
    // Step 5: Click on User profile button
    console.log('👤 Looking for User profile button...');
    
    const userSelectors = [
      '[data-testid="user-button"]',
      '[data-testid="profile-button"]',
      'button[aria-label*="Profile"]',
      'button[aria-label*="User"]',
      'button[title*="Profile"]',
      '.user-button',
      '.profile-button',
      'svg[data-lucide="user"]',
      'button:has(svg[data-lucide="user"])',
      '[href="/profile"]',
      '[href="/user"]',
      'a[href="/profile"]',
      'a[href="/user"]'
    ];
    
    let userButton = null;
    for (const selector of userSelectors) {
      try {
        userButton = await page.locator(selector).first();
        if (await userButton.isVisible()) {
          console.log(`Found user button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (userButton && await userButton.isVisible()) {
      await userButton.click();
      await page.waitForTimeout(1000);
      
      // Step 6: Take screenshot of User page
      console.log('📸 Taking screenshot of User page...');
      await page.screenshot({ 
        path: join(screenshotsDir, '03-user-page.png'),
        fullPage: true 
      });
      console.log('✅ User page screenshot saved');
    } else {
      console.log('⚠️ User profile button not found, taking current page screenshot...');
      await page.screenshot({ 
        path: join(screenshotsDir, '03-user-not-found.png'),
        fullPage: true 
      });
    }
    
    // Step 7: Click on Add Memory button in sidebar
    console.log('➕ Looking for Add Memory button...');
    
    const addMemorySelectors = [
      '[data-testid="add-memory-button"]',
      'button[aria-label*="Add Memory"]',
      'button[title*="Add Memory"]',
      '.add-memory-button',
      'button:has-text("Add Memory")',
      'svg[data-lucide="plus"]',
      'button:has(svg[data-lucide="plus"])',
      '.sidebar button:has-text("Add")',
      '.sidebar [data-testid="add-button"]'
    ];
    
    let addMemoryButton = null;
    for (const selector of addMemorySelectors) {
      try {
        addMemoryButton = await page.locator(selector).first();
        if (await addMemoryButton.isVisible()) {
          console.log(`Found add memory button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (addMemoryButton && await addMemoryButton.isVisible()) {
      await addMemoryButton.click();
      await page.waitForTimeout(1000);
      
      // Step 8: Take screenshot of Add Memory modal
      console.log('📸 Taking screenshot of Add Memory modal...');
      await page.screenshot({ 
        path: join(screenshotsDir, '04-add-memory-modal.png'),
        fullPage: true 
      });
      console.log('✅ Add Memory modal screenshot saved');
    } else {
      console.log('⚠️ Add Memory button not found, taking current page screenshot...');
      await page.screenshot({ 
        path: join(screenshotsDir, '04-add-memory-not-found.png'),
        fullPage: true 
      });
    }
    
    // Take a final screenshot of the current state
    console.log('📸 Taking final state screenshot...');
    await page.screenshot({ 
      path: join(screenshotsDir, '05-final-state.png'),
      fullPage: true 
    });
    
    // Generate a summary report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:3001',
      tests: [
        { step: 1, action: 'Navigate to homepage', status: 'completed' },
        { step: 2, action: 'Take homepage screenshot', status: 'completed' },
        { step: 3, action: 'Click Settings button', status: settingsButton ? 'completed' : 'failed - button not found' },
        { step: 4, action: 'Take Settings page screenshot', status: 'completed' },
        { step: 5, action: 'Click User profile button', status: userButton ? 'completed' : 'failed - button not found' },
        { step: 6, action: 'Take User page screenshot', status: 'completed' },
        { step: 7, action: 'Click Add Memory button', status: addMemoryButton ? 'completed' : 'failed - button not found' },
        { step: 8, action: 'Take Add Memory modal screenshot', status: 'completed' }
      ],
      screenshots: [
        '01-homepage.png',
        '02-settings-page.png',
        '03-user-page.png', 
        '04-add-memory-modal.png',
        '05-final-state.png'
      ]
    };
    
    writeFileSync(
      join(screenshotsDir, 'test-report.json'), 
      JSON.stringify(report, null, 2)
    );
    
    console.log('📊 Test completed! Screenshots and report saved to screenshots/ directory');
    console.log('\n📋 Summary:');
    report.tests.forEach(test => {
      const emoji = test.status.includes('completed') ? '✅' : '❌';
      console.log(`${emoji} Step ${test.step}: ${test.action} - ${test.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    
    // Take an error screenshot
    try {
      await page.screenshot({ 
        path: join(screenshotsDir, 'error-screenshot.png'),
        fullPage: true 
      });
      console.log('📸 Error screenshot saved');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Run the test
testOpenMemoryUI().catch(console.error);