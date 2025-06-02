import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testSaveMemory() {
  console.log('Testing save memory functionality...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'log') {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    }
  });
  
  try {
    console.log('1. Navigating and waiting for connection...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000); // Wait for backend connection
    
    console.log('2. Opening add memory modal...');
    const addButton = page.locator('button:has-text("Add Memory")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    console.log('3. Filling in memory content...');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('Backend connection test - This memory verifies that the IC Agent can successfully communicate with the OpenMemory canister and save data.');
    
    console.log('4. Trying to save memory...');
    await page.screenshot({ 
      path: join(__dirname, 'save-test-before-click.png'),
      fullPage: true 
    });
    
    // Try clicking with force to bypass intercepting elements
    const saveButton = page.locator('button:has-text("Save Memory")').first();
    await saveButton.click({ force: true });
    
    console.log('5. Waiting for response...');
    await page.waitForTimeout(10000); // Wait longer for the save operation
    
    await page.screenshot({ 
      path: join(__dirname, 'save-test-after-click.png'),
      fullPage: true 
    });
    
    // Check for any success or error messages
    const allText = await page.textContent('body');
    if (allText.includes('success') || allText.includes('saved') || allText.includes('added')) {
      console.log('SUCCESS INDICATORS FOUND in page text');
    }
    if (allText.includes('error') || allText.includes('failed')) {
      console.log('ERROR INDICATORS FOUND in page text');
    }
    
    console.log('6. Checking memory count...');
    // Look for memory count updates
    const memoryCountElements = await page.locator('text=0, text=1').all();
    for (const element of memoryCountElements) {
      const text = await element.textContent();
      console.log(`Found number: ${text}`);
    }
    
    console.log('Test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ 
      path: join(__dirname, 'save-test-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testSaveMemory().catch(console.error);