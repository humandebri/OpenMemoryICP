import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('🚀 Testing API configuration save functionality...');
    await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/settings');
    await page.waitForLoadState('networkidle');
    
    console.log('📝 Navigating to AI設定 tab...');
    await page.click('text=AI設定');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Looking for OpenAI API key input...');
    const openaiInput = await page.locator('input[placeholder*="sk-"]').first();
    if (await openaiInput.isVisible()) {
      console.log('✅ Found OpenAI API key input');
      
      // Clear and fill with new test key
      await openaiInput.clear();
      const testKey = 'sk-test123456789abcdefghijklmnopqrstuvwxyz12345';
      await openaiInput.fill(testKey);
      console.log(`📝 Filled input with test key: ${testKey.substring(0, 10)}...`);
      await page.waitForTimeout(500);
      
      // Look for the save button in Japanese
      const saveButton = await page.locator('button:has-text("設定を保存")').first();
      if (await saveButton.isVisible()) {
        console.log('🎯 Found save button (設定を保存)');
        
        await page.screenshot({ path: 'before-save.png', fullPage: true });
        
        // Click save and monitor network
        console.log('⏳ Clicking save button...');
        await saveButton.click();
        
        // Wait for response and check for success/error messages
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'after-save.png', fullPage: true });
        
        // Check for success or error messages in both English and Japanese
        const successSelectors = [
          'text*="successfully"',
          'text*="成功"',
          'text*="保存しました"',
          'text*="更新しました"'
        ];
        
        const errorSelectors = [
          'text*="Failed"',
          'text*="Error"',
          'text*="失敗"',
          'text*="エラー"'
        ];
        
        let foundSuccess = false;
        let foundError = false;
        
        // Check for success messages
        for (const selector of successSelectors) {
          const element = await page.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            const text = await element.textContent();
            console.log(`🎉 SUCCESS: ${text}`);
            foundSuccess = true;
            break;
          }
        }
        
        // Check for error messages
        for (const selector of errorSelectors) {
          const element = await page.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            const text = await element.textContent();
            console.log(`❌ ERROR: ${text}`);
            foundError = true;
            break;
          }
        }
        
        if (!foundSuccess && !foundError) {
          console.log('⚠️  No clear success/error message found, checking console logs...');
        }
        
      } else {
        console.log('❌ Save button (設定を保存) not found');
      }
    } else {
      console.log('❌ OpenAI API key input not found');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'api-save-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();