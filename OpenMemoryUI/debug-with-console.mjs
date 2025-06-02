import { chromium } from 'playwright';

async function debugWithConsole() {
  console.log('🔍 Debugging with console monitoring...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const consoleMessages = [];
  const errors = [];
  
  // Capture all console messages
  page.on('console', msg => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);
    console.log(`[Browser Console] ${message}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[Page Error] ${error.message}`);
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    console.log(`[Request Failed] ${request.url()}: ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:3001');
    
    // Wait for initial load
    await page.waitForTimeout(5000);
    
    // Check if React has loaded
    await page.waitForFunction(() => {
      return document.querySelector('#root')?.children.length > 0 || 
             document.body.textContent?.includes('Loading') ||
             document.body.textContent?.includes('Error');
    }, { timeout: 10000 }).catch(() => {
      console.log('React app did not load within 10 seconds');
    });
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'tests/screenshots/debug-with-errors.png',
      fullPage: true 
    });
    
    // Get detailed DOM state
    const domState = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return {
        rootExists: !!root,
        rootHTML: root?.innerHTML || '',
        bodyClasses: document.body.className,
        scriptTags: Array.from(document.querySelectorAll('script')).map(s => ({
          src: s.src,
          type: s.type,
          loaded: !s.src || s.readyState === 'complete'
        })),
        hasReactDevTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        windowReact: !!window.React
      };
    });
    
    console.log('\\n=== DOM STATE ===');
    console.log('Root exists:', domState.rootExists);
    console.log('Root HTML length:', domState.rootHTML.length);
    console.log('Body classes:', domState.bodyClasses);
    console.log('Scripts loaded:', domState.scriptTags);
    console.log('React DevTools:', domState.hasReactDevTools);
    console.log('Window React:', domState.windowReact);
    
    if (domState.rootHTML.length < 50) {
      console.log('Root HTML:', domState.rootHTML);
    }
    
    console.log('\\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
    
    return { domState, consoleMessages, errors };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

debugWithConsole().catch(console.error);