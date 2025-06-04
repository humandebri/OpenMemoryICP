import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Analyzing Settings page structure...');
    await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/settings');
    await page.waitForLoadState('networkidle');
    
    console.log('Clicking AI設定 tab...');
    await page.click('text=AI設定');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'debug-settings-ai-tab.png', fullPage: true });
    
    // List all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text}"`);
    }
    
    // List all inputs
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} inputs:`);
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}"`);
    }
    
    // Try finding save buttons with different selectors
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("保存")',
      'button:has-text("Configuration")',
      'button[type="submit"]',
      '.btn-primary'
    ];
    
    console.log('\nTesting save button selectors:');
    for (const selector of saveSelectors) {
      const element = await page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`  ${selector}: ${isVisible ? 'FOUND' : 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
})();