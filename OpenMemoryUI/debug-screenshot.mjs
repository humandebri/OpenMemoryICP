import { chromium } from 'playwright';

async function takeDebugScreenshot() {
  console.log('📸 Taking debug screenshot of OpenMemory app...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:3001');
    
    // Wait longer for React to load
    await page.waitForTimeout(3000);
    
    // Check if React root is present
    const reactRoot = await page.locator('#root').count();
    console.log(`React root found: ${reactRoot > 0}`);
    
    // Get page content
    const content = await page.content();
    console.log('Page content length:', content.length);
    
    // Check for error messages
    const errors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*=\"error\"], .error');
      return Array.from(errorElements).map(el => el.textContent);
    });
    
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }
    
    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Wait for any dynamic content
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/debug-current-state.png',
      fullPage: true 
    });
    
    console.log('✅ Debug screenshot saved: tests/screenshots/debug-current-state.png');
    
    // Get actual rendered HTML
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('\\nActual body content:');
    console.log(bodyHTML.substring(0, 500) + '...');
    
    // Check for specific OpenMemory components
    const openMemoryElements = await page.evaluate(() => {
      return {
        hasOpenMemoryTitle: document.querySelector('h1')?.textContent?.includes('OpenMemory') || false,
        hasNavigation: document.querySelector('nav')?.innerHTML?.length > 0 || false,
        hasSidebar: document.querySelector('[class*=\"sidebar\"], aside')?.innerHTML?.length > 0 || false,
        hasHeader: document.querySelector('header')?.innerHTML?.length > 0 || false,
        hasMainContent: document.querySelector('main')?.innerHTML?.length > 0 || false,
        allHeadings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
        allButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
        allLinks: Array.from(document.querySelectorAll('a')).map(a => a.textContent)
      };
    });
    
    console.log('\\nOpenMemory elements check:');
    console.log(JSON.stringify(openMemoryElements, null, 2));
    
    return openMemoryElements;
    
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

takeDebugScreenshot().catch(console.error);