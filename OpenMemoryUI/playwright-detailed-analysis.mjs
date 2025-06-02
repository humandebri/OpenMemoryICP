import { chromium } from 'playwright';

async function detailedUIAnalysis() {
  console.log('🔬 Starting Detailed Playwright UI Analysis...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to OpenMemory application...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations

    // Initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/detailed-analysis-initial.png',
      fullPage: true 
    });

    console.log('✅ Application loaded successfully\n');

    // ==========================================
    // DETAILED COMPONENT ANALYSIS
    // ==========================================
    
    console.log('📊 === COMPONENT STRUCTURE ANALYSIS ===');
    
    // Check for React components and their structure
    const components = await page.evaluate(() => {
      const reactRoot = document.querySelector('#root');
      if (!reactRoot) return { error: 'React root not found' };
      
      const analysis = {
        hasHeader: !!document.querySelector('header, [role="banner"]'),
        hasSidebar: !!document.querySelector('aside, nav, [role="navigation"]'),
        hasMain: !!document.querySelector('main, [role="main"]'),
        hasFooter: !!document.querySelector('footer, [role="contentinfo"]'),
        totalElements: document.querySelectorAll('*').length,
        interactiveElements: {
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          inputs: document.querySelectorAll('input, textarea, select').length,
          forms: document.querySelectorAll('form').length
        },
        headingStructure: {},
        landmarkRoles: []
      };
      
      // Analyze heading hierarchy
      for (let i = 1; i <= 6; i++) {
        const headings = document.querySelectorAll(`h${i}`);
        if (headings.length > 0) {
          analysis.headingStructure[`h${i}`] = {
            count: headings.length,
            texts: Array.from(headings).map(h => h.textContent?.substring(0, 50) + '...')
          };
        }
      }
      
      // Check for ARIA landmarks
      const landmarks = document.querySelectorAll('[role]');
      analysis.landmarkRoles = Array.from(landmarks).map(el => el.getAttribute('role'));
      
      return analysis;
    });

    console.log('Component Structure:');
    console.log(`  Header: ${components.hasHeader ? '✅' : '❌'}`);
    console.log(`  Sidebar: ${components.hasSidebar ? '✅' : '❌'}`);
    console.log(`  Main Content: ${components.hasMain ? '✅' : '❌'}`);
    console.log(`  Footer: ${components.hasFooter ? '✅' : '❌'}`);
    console.log(`  Total Elements: ${components.totalElements}`);
    console.log(`  Interactive Elements: ${JSON.stringify(components.interactiveElements, null, 2)}`);
    console.log(`  Heading Structure: ${JSON.stringify(components.headingStructure, null, 2)}`);

    // ==========================================
    // USER INTERACTION TESTING
    // ==========================================
    
    console.log('\\n🖱️  === USER INTERACTION TESTING ===');
    
    // Test for clickable elements
    const clickableElements = await page.locator('button, a, [onclick], [role=\"button\"]').all();
    console.log(`Found ${clickableElements.length} potentially clickable elements`);
    
    // Test hover effects
    let hoverTestResults = [];
    for (let i = 0; i < Math.min(clickableElements.length, 5); i++) {
      try {
        const element = clickableElements[i];
        await element.hover();
        const hasHoverEffect = await page.evaluate(() => {
          // Check if any transforms, shadows, or opacity changes occurred
          return document.querySelector(':hover') !== null;
        });
        hoverTestResults.push({ index: i, hasHoverEffect });
        await page.waitForTimeout(500);
      } catch (error) {
        hoverTestResults.push({ index: i, error: error.message });
      }
    }
    
    console.log('Hover Effects Test:', hoverTestResults);

    // ==========================================
    // RESPONSIVE DESIGN ANALYSIS
    // ==========================================
    
    console.log('\\n📱 === RESPONSIVE DESIGN ANALYSIS ===');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Large Desktop', width: 2560, height: 1440 }
    ];
    
    const responsiveResults = [];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Take screenshot
      await page.screenshot({ 
        path: `tests/screenshots/responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
      
      // Analyze layout at this viewport
      const layoutAnalysis = await page.evaluate(() => {
        const body = document.body;
        const hasOverflow = body.scrollWidth > body.clientWidth;
        const hasVerticalScroll = body.scrollHeight > body.clientHeight;
        
        // Check for mobile menu
        const mobileMenu = document.querySelector('[class*=\"mobile\"], [class*=\"hamburger\"], [class*=\"menu-toggle\"]');
        
        // Check for responsive text
        const smallText = Array.from(document.querySelectorAll('*')).filter(el => {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          return fontSize < 14;
        }).length;
        
        return {
          hasHorizontalOverflow: hasOverflow,
          hasVerticalScroll: hasVerticalScroll,
          mobileMenuVisible: mobileMenu ? window.getComputedStyle(mobileMenu).display !== 'none' : false,
          elementsWithSmallText: smallText,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        };
      });
      
      responsiveResults.push({
        viewport: viewport.name,
        ...layoutAnalysis
      });
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}):`, layoutAnalysis);
    }

    // ==========================================
    // PERFORMANCE ANALYSIS
    // ==========================================
    
    console.log('\\n⚡ === PERFORMANCE ANALYSIS ===');
    
    // Return to desktop view for performance testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Reload page to get fresh performance metrics
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      const paint = performance.getEntriesByType('paint');
      
      return {
        timing: {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          firstPaint: Math.round(paint.find(p => p.name === 'first-paint')?.startTime || 0),
          firstContentfulPaint: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0)
        },
        resources: {
          total: resources.length,
          javascript: resources.filter(r => r.name.includes('.js')).length,
          css: resources.filter(r => r.name.includes('.css')).length,
          images: resources.filter(r => r.name.match(/\\.(png|jpg|jpeg|gif|svg|webp)$/)).length,
          totalSize: Math.round(resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024)
        },
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null
      };
    });
    
    console.log('Performance Metrics:');
    console.log(`  DOM Content Loaded: ${performanceData.timing.domContentLoaded}ms`);
    console.log(`  Load Complete: ${performanceData.timing.loadComplete}ms`);
    console.log(`  First Paint: ${performanceData.timing.firstPaint}ms`);
    console.log(`  First Contentful Paint: ${performanceData.timing.firstContentfulPaint}ms`);
    console.log(`  Resources: ${performanceData.resources.total} (JS: ${performanceData.resources.javascript}, CSS: ${performanceData.resources.css}, Images: ${performanceData.resources.images})`);
    console.log(`  Total Transfer Size: ${performanceData.resources.totalSize}KB`);
    if (performanceData.memory) {
      console.log(`  Memory Usage: ${performanceData.memory.used}MB / ${performanceData.memory.total}MB`);
    }

    // ==========================================
    // ACCESSIBILITY DEEP DIVE
    // ==========================================
    
    console.log('\\n♿ === ACCESSIBILITY DEEP DIVE ===');
    
    const accessibilityCheck = await page.evaluate(() => {
      const issues = [];
      
      // Check images without alt text
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} images without alt text`);
      }
      
      // Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      let hierarchyIssues = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > previousLevel + 1) {
          hierarchyIssues++;
        }
        previousLevel = level;
      });
      if (hierarchyIssues > 0) {
        issues.push(`${hierarchyIssues} heading hierarchy violations`);
      }
      
      // Check for form labels
      const inputs = document.querySelectorAll('input, textarea, select');
      let unlabeledInputs = 0;
      inputs.forEach(input => {
        const hasLabel = input.labels && input.labels.length > 0 || 
                        input.getAttribute('aria-label') ||
                        input.getAttribute('aria-labelledby');
        if (!hasLabel) unlabeledInputs++;
      });
      if (unlabeledInputs > 0) {
        issues.push(`${unlabeledInputs} form inputs without proper labels`);
      }
      
      // Check for buttons without accessible names
      const buttons = document.querySelectorAll('button');
      let unnamedButtons = 0;
      buttons.forEach(button => {
        const hasName = button.textContent?.trim() ||
                       button.getAttribute('aria-label') ||
                       button.getAttribute('aria-labelledby');
        if (!hasName) unnamedButtons++;
      });
      if (unnamedButtons > 0) {
        issues.push(`${unnamedButtons} buttons without accessible names`);
      }
      
      // Check for interactive elements with proper focus indicators
      const focusableElements = document.querySelectorAll('button, a, input, textarea, select, [tabindex]');
      
      return {
        issues,
        stats: {
          totalFocusableElements: focusableElements.length,
          totalImages: document.querySelectorAll('img').length,
          totalHeadings: headings.length,
          totalInputs: inputs.length,
          totalButtons: buttons.length
        }
      };
    });
    
    console.log('Accessibility Issues:');
    accessibilityCheck.issues.forEach(issue => console.log(`  ❌ ${issue}`));
    if (accessibilityCheck.issues.length === 0) {
      console.log('  ✅ No major accessibility issues found');
    }
    console.log('Accessibility Stats:', accessibilityCheck.stats);

    // ==========================================
    // VISUAL DESIGN ANALYSIS
    // ==========================================
    
    console.log('\\n🎨 === VISUAL DESIGN ANALYSIS ===');
    
    const visualAnalysis = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const colors = new Set();
      const fonts = new Set();
      const animations = [];
      
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        
        // Collect colors
        if (styles.color && styles.color !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.color);
        }
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.backgroundColor);
        }
        
        // Collect fonts
        if (styles.fontFamily) {
          fonts.add(styles.fontFamily);
        }
        
        // Check for animations
        if (styles.animationName && styles.animationName !== 'none') {
          animations.push({
            element: el.tagName,
            animation: styles.animationName,
            duration: styles.animationDuration
          });
        }
      });
      
      return {
        uniqueColors: colors.size,
        uniqueFonts: fonts.size,
        animations: animations.length,
        colorSample: Array.from(colors).slice(0, 10),
        fontSample: Array.from(fonts).slice(0, 5)
      };
    });
    
    console.log('Visual Design:');
    console.log(`  Unique Colors: ${visualAnalysis.uniqueColors}`);
    console.log(`  Unique Fonts: ${visualAnalysis.uniqueFonts}`);
    console.log(`  Animations: ${visualAnalysis.animations}`);
    console.log(`  Color Sample: ${visualAnalysis.colorSample.join(', ')}`);
    console.log(`  Font Sample: ${visualAnalysis.fontSample.join(', ')}`);

    // ==========================================
    // SPECIFIC UI IMPROVEMENT RECOMMENDATIONS
    // ==========================================
    
    console.log('\\n💡 === SPECIFIC UI IMPROVEMENT RECOMMENDATIONS ===');
    
    const recommendations = [];
    
    // Based on analysis results
    if (!components.hasHeader) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Structure',
        issue: 'Missing semantic header element',
        solution: 'Add <header> or role="banner" to the top navigation area'
      });
    }
    
    if (!components.hasMain) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Accessibility',
        issue: 'Missing main content landmark',
        solution: 'Wrap primary content in <main> or role="main" element'
      });
    }
    
    if (performanceData.timing.firstContentfulPaint > 2000) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: 'Slow First Contentful Paint',
        solution: 'Optimize loading of critical CSS and JavaScript'
      });
    }
    
    if (performanceData.resources.totalSize > 1000) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: 'Large bundle size',
        solution: 'Implement code splitting and asset optimization'
      });
    }
    
    accessibilityCheck.issues.forEach(issue => {
      recommendations.push({
        priority: 'HIGH',
        category: 'Accessibility',
        issue: issue,
        solution: 'Review and fix accessibility violations'
      });
    });
    
    // Check responsive design issues
    responsiveResults.forEach(result => {
      if (result.hasHorizontalOverflow) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Responsive',
          issue: `Horizontal overflow on ${result.viewport}`,
          solution: 'Review CSS and ensure proper responsive design'
        });
      }
    });
    
    recommendations.push({
      priority: 'LOW',
      category: 'Enhancement',
      issue: 'Loading states',
      solution: 'Add loading spinners and skeleton screens for better UX'
    });
    
    recommendations.push({
      priority: 'LOW',
      category: 'Enhancement',
      issue: 'Error handling',
      solution: 'Implement user-friendly error messages and fallback states'
    });
    
    // Sort recommendations by priority
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    console.log('\\nPrioritized Improvement List:');
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
      console.log(`     Solution: ${rec.solution}\\n`);
    });

    console.log('\\n✅ === DETAILED UI ANALYSIS COMPLETE ===');
    console.log('📸 All screenshots saved in tests/screenshots/');
    console.log('📊 Analysis data ready for UI improvements');

    return {
      components,
      responsiveResults,
      performanceData,
      accessibilityCheck,
      visualAnalysis,
      recommendations
    };

  } catch (error) {
    console.error('❌ Detailed analysis failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the detailed analysis
detailedUIAnalysis()
  .then(results => {
    console.log('\\n🎯 Analysis complete! Use results to improve UI.');
  })
  .catch(console.error);