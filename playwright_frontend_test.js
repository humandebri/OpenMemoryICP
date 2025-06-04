const { chromium } = require('playwright');

async function testOpenMemoryFrontend() {
  console.log('🚀 Starting Playwright frontend verification...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down actions for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to OpenMemory frontend
    console.log('📱 Navigating to OpenMemory frontend...');
    await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/', { 
      waitUntil: 'networkidle' 
    });
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'openmemory-homepage.png' });
    console.log('📸 Homepage screenshot saved: openmemory-homepage.png');
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Look for main navigation and pages
    console.log('🔍 Scanning for navigation elements...');
    
    // Check for navigation links
    const navLinks = await page.$$eval('nav a, .nav a, [role="navigation"] a', links => 
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    );
    
    console.log('🧭 Found navigation links:', navLinks);
    
    // Check for memory-related elements on homepage
    console.log('🔍 Checking homepage for memory elements...');
    
    const memoryElements = await page.$$eval('[data-testid*="memory"], .memory, .memory-card, .memory-item', elements =>
      elements.map(el => ({
        className: el.className,
        textContent: el.textContent.trim().substring(0, 100),
        tagName: el.tagName
      }))
    );
    
    console.log('🧠 Memory elements on homepage:', memoryElements);
    
    // Check for "Add Memory" or similar buttons
    const addButtons = await page.$$eval(
      'button, .btn, [role="button"]', 
      buttons => buttons
        .filter(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('add') || text.includes('memory') || text.includes('メモリ') || text.includes('追加');
        })
        .map(btn => ({
          text: btn.textContent.trim(),
          className: btn.className,
          visible: btn.offsetParent !== null
        }))
    );
    
    console.log('➕ Add buttons found:', addButtons);
    
    // Check for authentication status
    console.log('🔐 Checking authentication status...');
    
    const authElements = await page.$$eval(
      'button, .btn, [role="button"], .auth, .login',
      elements => elements
        .filter(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('login') || text.includes('auth') || text.includes('ログイン') || text.includes('認証');
        })
        .map(el => ({
          text: el.textContent.trim(),
          className: el.className,
          visible: el.offsetParent !== null
        }))
    );
    
    console.log('🔐 Authentication elements:', authElements);
    
    // Try to navigate to different pages to find where memories are displayed
    const pagesToCheck = [
      { name: 'Search/Memories', selectors: ['a[href*="search"]', 'a[href*="memories"]', 'text=Search', 'text=Memories'] },
      { name: 'Dashboard', selectors: ['a[href*="dashboard"]', 'text=Dashboard'] },
      { name: 'Categories', selectors: ['a[href*="categories"]', 'text=Categories'] },
      { name: 'Clusters', selectors: ['a[href*="clusters"]', 'text=Clusters'] },
      { name: 'Settings', selectors: ['a[href*="settings"]', 'text=Settings'] }
    ];
    
    for (const pageInfo of pagesToCheck) {
      console.log(`\n🔍 Checking for ${pageInfo.name} page...`);
      
      let pageFound = false;
      for (const selector of pageInfo.selectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Found ${pageInfo.name} link: ${selector}`);
            
            // Click and navigate
            await element.click();
            await page.waitForTimeout(2000); // Wait for navigation
            
            // Take screenshot
            await page.screenshot({ path: `openmemory-${pageInfo.name.toLowerCase().replace('/', '-')}.png` });
            console.log(`📸 ${pageInfo.name} screenshot saved`);
            
            // Check for memory content on this page
            const pageMemories = await page.$$eval(
              '.memory, .memory-card, .memory-item, [data-testid*="memory"], .card, .item',
              elements => elements.map(el => ({
                className: el.className,
                textContent: el.textContent.trim().substring(0, 100),
                visible: el.offsetParent !== null
              }))
            );
            
            console.log(`🧠 Memory elements on ${pageInfo.name}:`, pageMemories.length);
            if (pageMemories.length > 0) {
              console.log('📋 Sample memory elements:', pageMemories.slice(0, 3));
            }
            
            // Check for empty state messages
            const emptyStateElements = await page.$$eval(
              'text=No memories, text=Empty, text=No results, [class*="empty"], [class*="no-data"]',
              elements => elements.map(el => el.textContent.trim())
            );
            
            if (emptyStateElements.length > 0) {
              console.log('📭 Empty state messages:', emptyStateElements);
            }
            
            pageFound = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!pageFound) {
        console.log(`❌ ${pageInfo.name} page not found`);
      }
      
      // Go back to home for next test
      await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }
    
    // Final check: Try to create a memory through the UI if possible
    console.log('\n➕ Attempting to create a memory through UI...');
    
    try {
      // Look for "Add Memory" or similar button
      const addMemoryButton = page.locator('button, .btn').filter({ hasText: /add|memory|追加|メモリ/i }).first();
      
      if (await addMemoryButton.isVisible()) {
        console.log('✅ Found add memory button, attempting to click...');
        await addMemoryButton.click();
        await page.waitForTimeout(2000);
        
        // Look for text input or modal
        const textInput = page.locator('textarea, input[type="text"], .input').first();
        if (await textInput.isVisible()) {
          console.log('✅ Found text input, entering test memory...');
          await textInput.fill('Playwright test memory created via UI');
          
          // Look for save/submit button
          const saveButton = page.locator('button, .btn').filter({ hasText: /save|submit|create|保存|作成/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            console.log('✅ Attempted to save memory via UI');
            await page.waitForTimeout(3000);
            
            // Take screenshot after memory creation
            await page.screenshot({ path: 'openmemory-after-memory-creation.png' });
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not create memory via UI:', error.message);
    }
    
    console.log('\n📊 Frontend verification complete!');
    
    return {
      success: true,
      title,
      navigationLinks: navLinks,
      memoryElementsFound: memoryElements.length,
      addButtonsFound: addButtons.length,
      authElementsFound: authElements.length
    };
    
  } catch (error) {
    console.error('❌ Playwright test failed:', error);
    await page.screenshot({ path: 'openmemory-error.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Also test API status
async function checkAPIStatus() {
  console.log('\n🔧 Checking API status...');
  
  try {
    // Check health
    const healthResponse = await fetch('https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io/health');
    const health = await healthResponse.json();
    console.log('✅ API Health:', health);
    
    // Check memories
    const memoriesResponse = await fetch('https://77fv5-oiaaa-aaaal-qsoeq-cai.raw.icp0.io/memories');
    const memories = await memoriesResponse.json();
    console.log('📊 Current memories count:', memories.total_count);
    
    if (memories.memories && memories.memories.length > 0) {
      console.log('📋 Sample memories:', memories.memories.slice(0, 2));
    }
    
    return { health, memoriesCount: memories.total_count };
  } catch (error) {
    console.error('❌ API check failed:', error);
    return { error: error.message };
  }
}

// Run tests
async function runFullTest() {
  console.log('🎯 Starting complete OpenMemory verification...\n');
  
  // Check API first
  const apiStatus = await checkAPIStatus();
  
  // Then test frontend
  const frontendResults = await testOpenMemoryFrontend();
  
  console.log('\n🎉 Complete test results:');
  console.log('API Status:', apiStatus);
  console.log('Frontend Results:', frontendResults);
  
  console.log('\n📸 Screenshots saved:');
  console.log('- openmemory-homepage.png');
  console.log('- openmemory-search-memories.png (if found)');
  console.log('- openmemory-dashboard.png (if found)');
  console.log('- openmemory-after-memory-creation.png (if successful)');
}

// Export functions
module.exports = {
  testOpenMemoryFrontend,
  checkAPIStatus,
  runFullTest
};

// Run if called directly
if (require.main === module) {
  runFullTest().catch(console.error);
}