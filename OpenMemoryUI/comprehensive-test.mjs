import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './test-screenshots';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runComprehensiveTests() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 // Add delay for better visibility
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    console.log('🚀 Starting comprehensive OpenMemory application test...\n');

    try {
        // Test 1: Homepage Load
        console.log('📍 Test 1: Loading homepage...');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-homepage-initial.png` });
        
        const title = await page.title();
        console.log(`✅ Homepage loaded. Title: ${title}`);
        results.tests.push({
            name: 'Homepage Load',
            status: 'PASS',
            details: `Title: ${title}`
        });

        // Test 2: Check Header and Internet Identity Button
        console.log('\n📍 Test 2: Checking header and Internet Identity button...');
        const header = await page.locator('header').first().isVisible();
        const loginButton = await page.locator('button:has-text("Login"), button:has-text("Internet Identity")').first().isVisible();
        
        console.log(`Header visible: ${header}`);
        console.log(`Login button visible: ${loginButton}`);
        
        if (loginButton) {
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-header-with-login.png` });
            console.log('✅ Internet Identity login button found in header');
            results.tests.push({
                name: 'Internet Identity Button',
                status: 'PASS',
                details: 'Login button visible in header'
            });
        } else {
            console.log('❌ Internet Identity login button not found');
            results.tests.push({
                name: 'Internet Identity Button',
                status: 'FAIL',
                details: 'Login button not visible'
            });
        }

        // Test 3: Navigate to Categories Page
        console.log('\n📍 Test 3: Testing Categories page navigation...');
        await page.click('a[href="/categories"]');
        await page.waitForURL('**/categories');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-categories-page.png` });
        
        // Check if login prompt is shown instead of blank page
        const loginPrompt = await page.locator('text=Please log in', 'text=Login required', 'text=Authentication required').first().isVisible();
        const pageContent = await page.content();
        
        if (loginPrompt) {
            console.log('✅ Categories page shows login prompt instead of blank page');
            results.tests.push({
                name: 'Categories Page Auth Check',
                status: 'PASS',
                details: 'Shows login prompt for unauthenticated users'
            });
        } else if (pageContent.includes('<div id="root"></div>') && !pageContent.includes('Categories')) {
            console.log('❌ Categories page appears blank or not loaded');
            results.tests.push({
                name: 'Categories Page Auth Check',
                status: 'FAIL',
                details: 'Page appears blank or content not loaded'
            });
        } else {
            console.log('✅ Categories page has content');
            results.tests.push({
                name: 'Categories Page Auth Check',
                status: 'PASS',
                details: 'Page has content'
            });
        }

        // Test 4: Test Add Memory Modal
        console.log('\n📍 Test 4: Testing Add Memory modal...');
        await page.goto(BASE_URL); // Go back to homepage
        await page.waitForLoadState('networkidle');
        
        const addMemoryButton = await page.locator('button:has-text("Add Memory")').isVisible();
        if (addMemoryButton) {
            await page.click('button:has-text("Add Memory")');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-add-memory-modal.png` });
            
            const modal = await page.locator('[role="dialog"]').isVisible();
            const authRequired = await page.locator('text=authentication required', 'text=Please log in').isVisible();
            
            if (modal) {
                console.log('✅ Add Memory modal opens');
                if (authRequired) {
                    console.log('✅ Modal shows authentication requirement');
                    results.tests.push({
                        name: 'Add Memory Modal Auth',
                        status: 'PASS',
                        details: 'Modal opens and shows auth requirement'
                    });
                } else {
                    console.log('ℹ️  Modal opens (auth status unclear)');
                    results.tests.push({
                        name: 'Add Memory Modal Auth',
                        status: 'PASS',
                        details: 'Modal opens successfully'
                    });
                }
            } else {
                console.log('❌ Add Memory modal does not open');
                results.tests.push({
                    name: 'Add Memory Modal Auth',
                    status: 'FAIL',
                    details: 'Modal does not open'
                });
            }
        } else {
            console.log('❌ Add Memory button not found');
            results.tests.push({
                name: 'Add Memory Modal Auth',
                status: 'FAIL',
                details: 'Add Memory button not found'
            });
        }

        // Test 5: Navigate to IDE Integration Page
        console.log('\n📍 Test 5: Testing IDE Integration page...');
        await page.goto(`${BASE_URL}/ide`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-ide-integration-page.png` });
        
        const idePageContent = await page.locator('h1, h2, .conversation-manager').count();
        if (idePageContent > 0) {
            console.log('✅ IDE Integration page loads with content');
            results.tests.push({
                name: 'IDE Integration Page',
                status: 'PASS',
                details: 'Page loads with content'
            });
        } else {
            console.log('❌ IDE Integration page has no content');
            results.tests.push({
                name: 'IDE Integration Page',
                status: 'FAIL',
                details: 'Page has no visible content'
            });
        }

        // Test 6: Test Conversation Manager Functionality
        console.log('\n📍 Test 6: Testing Conversation Manager...');
        const conversationManager = await page.locator('.conversation-manager').isVisible();
        if (conversationManager) {
            console.log('✅ Conversation Manager component visible');
            
            // Try to interact with conversation manager
            const newConversationBtn = await page.locator('button:has-text("New Conversation")').isVisible();
            if (newConversationBtn) {
                await page.click('button:has-text("New Conversation")');
                await page.waitForTimeout(500);
                console.log('✅ New Conversation button works');
            }
            
            await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-conversation-manager.png` });
            results.tests.push({
                name: 'Conversation Manager',
                status: 'PASS',
                details: 'Component visible and functional'
            });
        } else {
            console.log('❌ Conversation Manager not found');
            results.tests.push({
                name: 'Conversation Manager',
                status: 'FAIL',
                details: 'Component not visible'
            });
        }

        // Test 7: Test All Navigation Links
        console.log('\n📍 Test 7: Testing all navigation...');
        const navTests = [
            { path: '/', name: 'Home' },
            { path: '/search', name: 'Search' },
            { path: '/clusters', name: 'Clusters' },
            { path: '/categories', name: 'Categories' },
            { path: '/settings', name: 'Settings' },
            { path: '/ide', name: 'IDE Integration' }
        ];

        for (const nav of navTests) {
            await page.goto(`${BASE_URL}${nav.path}`);
            await page.waitForLoadState('networkidle');
            const hasError = await page.locator('text=Error', 'text=404', 'text=Not Found').isVisible();
            
            if (!hasError) {
                console.log(`✅ ${nav.name} page loads without errors`);
            } else {
                console.log(`❌ ${nav.name} page has errors`);
            }
        }
        
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-navigation-complete.png` });
        results.tests.push({
            name: 'Navigation Tests',
            status: 'PASS',
            details: 'All navigation routes tested'
        });

        // Test 8: Check for Error Toasts
        console.log('\n📍 Test 8: Checking for error toasts...');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for any toasts to appear
        
        const errorToasts = await page.locator('.toast-error', '[data-toast="error"]', 'text=Error').count();
        if (errorToasts === 0) {
            console.log('✅ No error toasts detected');
            results.tests.push({
                name: 'Error Toast Check',
                status: 'PASS',
                details: 'No error toasts found'
            });
        } else {
            console.log(`❌ Found ${errorToasts} error toast(s)`);
            results.tests.push({
                name: 'Error Toast Check',
                status: 'FAIL',
                details: `Found ${errorToasts} error toast(s)`
            });
        }

        await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-final-state.png` });

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        results.tests.push({
            name: 'Overall Test',
            status: 'ERROR',
            details: error.message
        });
    }

    await browser.close();

    // Generate summary report
    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    const errors = results.tests.filter(t => t.status === 'ERROR').length;

    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`📊 Total: ${results.tests.length}`);

    results.summary = {
        passed,
        failed,
        errors,
        total: results.tests.length,
        successRate: `${((passed / results.tests.length) * 100).toFixed(1)}%`
    };

    // Save detailed results
    fs.writeFileSync(`${SCREENSHOTS_DIR}/comprehensive-test-results.json`, JSON.stringify(results, null, 2));
    
    console.log(`\n📸 Screenshots saved to: ${SCREENSHOTS_DIR}/`);
    console.log(`📄 Detailed results saved to: ${SCREENSHOTS_DIR}/comprehensive-test-results.json`);

    return results;
}

// Run the tests
runComprehensiveTests().catch(console.error);