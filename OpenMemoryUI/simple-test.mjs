import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './final-test-screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testRemaining() {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    console.log('🔍 Testing remaining OpenMemory features...\n');

    try {
        // Test Add Memory Modal
        console.log('📍 Testing Add Memory modal...');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        
        await page.click('button:has-text("Add Memory")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-add-memory-modal.png` });
        console.log('✅ Add Memory modal test completed');

        // Test IDE Integration Page
        console.log('\n📍 Testing IDE Integration page...');
        await page.goto(`${BASE_URL}/ide`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-ide-integration-page.png` });
        console.log('✅ IDE Integration page loaded');

        // Test other navigation pages
        console.log('\n📍 Testing navigation pages...');
        
        // Search page
        await page.goto(`${BASE_URL}/search`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-search-page.png` });
        
        // Clusters page
        await page.goto(`${BASE_URL}/clusters`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-clusters-page.png` });
        
        // Settings page
        await page.goto(`${BASE_URL}/settings`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-settings-page.png` });
        
        console.log('✅ All navigation pages tested');

        // Final state
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-final-state.png` });

        console.log('\n🎉 All tests completed successfully!');
        console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}/`);

    } catch (error) {
        console.error('❌ Test error:', error);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/error-state.png` });
    }

    await browser.close();
}

testRemaining().catch(console.error);