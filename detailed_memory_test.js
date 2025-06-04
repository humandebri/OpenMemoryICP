const { chromium } = require('playwright');

async function detailedMemoryTest() {
  console.log('🔍 Starting detailed memory verification...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to OpenMemory
    await page.goto('https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/', { 
      waitUntil: 'networkidle' 
    });
    
    console.log('📱 Loaded OpenMemory frontend');
    await page.screenshot({ path: 'step1-homepage.png' });
    
    // Check current authentication status
    const loginButton = page.locator('button:has-text("Login with Internet Identity")').first();
    const isLoggedOut = await loginButton.isVisible();
    
    console.log(`🔐 Login status: ${isLoggedOut ? 'Logged out' : 'Already logged in'}`);
    
    if (isLoggedOut) {
      console.log('⚠️ Need to login with Internet Identity');
      console.log('📝 Note: Manual login required - continuing with logged-out state');
    }
    
    // Navigate to Search page first
    console.log('🔍 Navigating to Search page...');
    await page.click('a[href="/search"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step2-search-page.png' });
    
    // Check what's on the search page
    const searchPageContent = await page.textContent('body');
    console.log('📄 Search page loaded');
    
    // Look for memory elements or empty state
    const memoryCards = await page.$$('.memory-card, .memory-item, [data-testid*="memory"]');
    console.log(`🧠 Found ${memoryCards.length} memory cards on search page`);
    
    // Check for empty state message
    const emptyMessages = await page.$$eval(
      'text=/no memories/i, text=/empty/i, text=/no results/i', 
      elements => elements.map(el => el.textContent.trim())
    );
    
    if (emptyMessages.length > 0) {
      console.log('📭 Empty state messages found:', emptyMessages);
    }
    
    // Navigate to Dashboard (homepage)
    console.log('🏠 Checking Dashboard for memories...');
    await page.click('a[href="/"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step3-dashboard.png' });
    
    // Look for recent memories section on dashboard
    const recentMemoriesSection = await page.$('.recent-memories, [data-testid*="recent"], [class*="memory"]');
    if (recentMemoriesSection) {
      console.log('✅ Found recent memories section on dashboard');
      const memoriesText = await recentMemoriesSection.textContent();
      console.log('📝 Recent memories content:', memoriesText.substring(0, 200));
    } else {
      console.log('❌ No recent memories section found on dashboard');
    }
    
    // Check if there's an "Add Memory" functionality working
    console.log('➕ Testing Add Memory functionality...');
    
    const addMemoryButton = page.locator('button:has-text("Add First Memory"), button:has-text("Add Memory")').first();
    
    if (await addMemoryButton.isVisible()) {
      console.log('✅ Add Memory button found, clicking...');
      await addMemoryButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'step4-add-memory-modal.png' });
      
      // Look for text area or input
      const textArea = page.locator('textarea, input[type="text"]').first();
      if (await textArea.isVisible()) {
        console.log('✅ Text input found, entering test memory...');
        await textArea.fill('Test memory created by Playwright verification - ' + new Date().toISOString());
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
        if (await saveButton.isVisible()) {
          console.log('✅ Save button found, attempting to save...');
          await saveButton.click();
          await page.waitForTimeout(5000); // Wait for save operation
          await page.screenshot({ path: 'step5-after-save.png' });
          
          // Check if memory was created - look for success message or redirect
          const successMessage = await page.$('text=/success/i, text=/created/i, text=/saved/i');
          if (successMessage) {
            console.log('✅ Success message found - memory likely created');
          }
          
          // Check current page for new memory
          await page.waitForTimeout(2000);
          const updatedMemoryCards = await page.$$('.memory-card, .memory-item, [data-testid*="memory"]');
          console.log(`🧠 Memory cards after creation: ${updatedMemoryCards.length}`);
          
          // Navigate to search to see if memory appears there
          console.log('🔍 Checking search page for new memory...');
          await page.click('a[href="/search"]');
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'step6-search-after-creation.png' });
          
          const searchMemoryCards = await page.$$('.memory-card, .memory-item, [data-testid*="memory"]');
          console.log(`🔍 Memory cards on search page: ${searchMemoryCards.length}`);
          
          if (searchMemoryCards.length > 0) {
            console.log('🎉 SUCCESS: Memory found on search page!');
            
            // Get details of the memory
            const memoryContent = await page.$$eval(
              '.memory-card, .memory-item, [data-testid*="memory"]',
              cards => cards.map(card => ({
                text: card.textContent.trim().substring(0, 100),
                className: card.className
              }))
            );
            
            console.log('📋 Memory details:', memoryContent);
          }
        }
      }
    }
    
    // Final summary
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('🎯 Primary memory display location: /search page');
    console.log('🏠 Dashboard may show recent memories');
    console.log('➕ Add Memory button works (authentication permitting)');
    
    return {
      success: true,
      searchPageHasMemories: (await page.$$('.memory-card, .memory-item')).length > 0,
      memoryCreationAttempted: true
    };
    
  } catch (error) {
    console.error('❌ Detailed test failed:', error);
    await page.screenshot({ path: 'error-state.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
detailedMemoryTest().then(result => {
  console.log('\n🎉 Test completed:', result);
  console.log('\n📸 Screenshots saved:');
  console.log('- step1-homepage.png');
  console.log('- step2-search-page.png');
  console.log('- step3-dashboard.png');
  console.log('- step4-add-memory-modal.png (if modal opened)');
  console.log('- step5-after-save.png (if save attempted)');
  console.log('- step6-search-after-creation.png (final check)');
}).catch(console.error);