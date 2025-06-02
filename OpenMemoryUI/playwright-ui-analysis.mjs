import { chromium } from 'playwright';

async function analyzeUI() {
  console.log('🔍 Starting Playwright UI Analysis...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 // Slow down for observation
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('📱 Navigating to OpenMemory application...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/ui-analysis-desktop.png',
      fullPage: true 
    });
    console.log('✅ Desktop screenshot captured');

    // Analyze page structure
    console.log('\n📊 Analyzing page structure...');
    const pageTitle = await page.title();
    console.log(`Page Title: ${pageTitle}`);

    // Check for main navigation elements
    const nav = await page.locator('nav, [role="navigation"]').count();
    console.log(`Navigation elements: ${nav}`);

    // Check for main content areas
    const main = await page.locator('main, [role="main"]').count();
    console.log(`Main content areas: ${main}`);

    // Analyze button accessibility
    console.log('\n🎯 Analyzing interactive elements...');
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    console.log(`Buttons: ${buttons}, Links: ${links}`);

    // Check for proper heading hierarchy
    console.log('\n📝 Analyzing heading structure...');
    for (let i = 1; i <= 6; i++) {
      const headings = await page.locator(`h${i}`).count();
      if (headings > 0) {
        console.log(`H${i} headings: ${headings}`);
      }
    }

    // Test responsive design
    console.log('\n📱 Testing responsive design...');
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/ui-analysis-mobile.png',
      fullPage: true 
    });
    console.log('✅ Mobile screenshot captured');

    // Check mobile menu visibility
    const mobileMenu = await page.locator('[class*="mobile"], [class*="Menu"]').isVisible();
    console.log(`Mobile menu accessible: ${mobileMenu}`);

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/ui-analysis-tablet.png',
      fullPage: true 
    });
    console.log('✅ Tablet screenshot captured');

    // Test key user interactions
    console.log('\n🖱️  Testing user interactions...');
    
    // Return to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // Try to find and interact with main CTA buttons
    const primaryButtons = await page.locator('.btn-primary, [class*="primary"]').all();
    console.log(`Primary action buttons found: ${primaryButtons.length}`);

    // Test navigation
    const navLinks = await page.locator('nav a, [role="navigation"] a').all();
    console.log(`Navigation links found: ${navLinks.length}`);

    // Check for search functionality
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search" i]').count();
    console.log(`Search inputs found: ${searchInputs}`);

    // Accessibility check
    console.log('\n♿ Running accessibility checks...');
    
    // Check for images without alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    console.log(`Images without alt text: ${imagesWithoutAlt}`);

    // Check for proper form labels
    const inputs = await page.locator('input').count();
    const labels = await page.locator('label').count();
    console.log(`Form inputs: ${inputs}, Labels: ${labels}`);

    // Check color contrast (basic check)
    const hasHighContrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let contrastIssues = 0;
      
      for (let el of elements) {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        
        // Simple contrast check (more comprehensive tools available)
        if (color === 'rgb(128, 128, 128)' && bgColor === 'rgb(255, 255, 255)') {
          contrastIssues++;
        }
      }
      
      return contrastIssues;
    });
    console.log(`Potential contrast issues: ${hasHighContrast}`);

    // Performance metrics
    console.log('\n⚡ Checking performance metrics...');
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        firstPaint: Math.round(performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0),
        firstContentfulPaint: Math.round(performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0)
      };
    });

    console.log('Performance Metrics:');
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`  First Paint: ${performanceMetrics.firstPaint}ms`);
    console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`);

    // Generate improvement recommendations
    console.log('\n💡 UI Improvement Recommendations:');
    
    const recommendations = [];
    
    if (imagesWithoutAlt > 0) {
      recommendations.push(`Add alt text to ${imagesWithoutAlt} images for better accessibility`);
    }
    
    if (performanceMetrics.firstContentfulPaint > 2000) {
      recommendations.push('Optimize First Contentful Paint (currently > 2s)');
    }
    
    if (performanceMetrics.loadComplete > 5000) {
      recommendations.push('Optimize page load time (currently > 5s)');
    }
    
    if (nav === 0) {
      recommendations.push('Add semantic navigation elements for better accessibility');
    }
    
    if (main === 0) {
      recommendations.push('Add semantic main content area');
    }

    recommendations.push('Test keyboard navigation for all interactive elements');
    recommendations.push('Verify color contrast meets WCAG 2.1 AA standards');
    recommendations.push('Add focus indicators for better keyboard accessibility');
    recommendations.push('Test with screen readers');
    recommendations.push('Optimize images and assets for faster loading');

    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    console.log('\n✅ UI Analysis Complete!');
    console.log('📸 Screenshots saved in tests/screenshots/');
    console.log('📊 Check console output for detailed metrics and recommendations');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeUI().catch(console.error);