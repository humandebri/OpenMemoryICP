import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('Testing API configuration save functionality...');
    await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/settings');
    await page.waitForLoadState('networkidle');
    
    console.log('Navigating to AI設定 tab...');
    await page.click('text=AI設定');
    await page.waitForTimeout(2000);
    
    // Look for OpenAI API Key input
    const openaiInput = await page.locator('input[placeholder*="OpenAI"], input[placeholder*="sk-"]').first();
    if (await openaiInput.isVisible()) {
      console.log('Found OpenAI API key input, testing save...');
      
      // Clear and fill with new test key
      await openaiInput.clear();
      await openaiInput.fill('sk-test123456789abcdefghijklmnopqrstuvwxyz12345');
      await page.waitForTimeout(500);
      
      // Click save button
      const saveButton = await page.locator('button:has-text("Save Configuration")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        console.log('Clicked Save Configuration...');
        
        // Wait for response and check for success/error messages
        await page.waitForTimeout(3000);
        
        // Check for success or error messages
        const successMessage = await page.locator('text*="successfully"').first();
        const errorMessage = await page.locator('text*="Failed"').first();
        
        if (await successMessage.isVisible()) {
          console.log('✅ SUCCESS: Configuration saved successfully!');
        } else if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          console.log(`❌ ERROR: ${errorText}`);
        } else {
          console.log('⚠️  No clear success/error message found');
        }
        
        await page.screenshot({ path: 'api-save-final-result.png', fullPage: true });
        
      } else {
        console.log('Save Configuration button not found');
      }
    } else {
      console.log('OpenAI API key input not found');
      await page.screenshot({ path: 'api-save-no-input.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'api-save-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();