import { chromium } from 'playwright';

async function finalUIAnalysis() {
  console.log('📸 最終UI分析とスクリーンショット撮影を開始...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 OpenMemoryアプリケーションにアクセス中...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // ==========================================
    // 最終スクリーンショット撮影
    // ==========================================
    
    console.log('\n📷 === 最終スクリーンショット撮影 ===');
    
    // 1. デスクトップ - ホームページ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/final-desktop-homepage.png',
      fullPage: true 
    });
    console.log('✅ デスクトップ - ホームページ');

    // 2. サイドバーとナビゲーションの確認
    await page.screenshot({ 
      path: 'tests/screenshots/final-desktop-navigation.png',
      clip: { x: 0, y: 0, width: 400, height: 800 }
    });
    console.log('✅ サイドバーナビゲーション');

    // 3. ヘッダー部分
    await page.screenshot({ 
      path: 'tests/screenshots/final-header.png',
      clip: { x: 0, y: 0, width: 1920, height: 100 }
    });
    console.log('✅ ヘッダー部分');

    // 4. メインコンテンツエリア
    await page.screenshot({ 
      path: 'tests/screenshots/final-main-content.png',
      clip: { x: 320, y: 100, width: 1600, height: 900 }
    });
    console.log('✅ メインコンテンツ');

    // 5. 検索ページに移動
    await page.click('a[href="/search"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'tests/screenshots/final-search-page.png',
      fullPage: true 
    });
    console.log('✅ 検索ページ');

    // 6. クラスターページに移動
    await page.click('a[href="/clusters"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'tests/screenshots/final-clusters-page.png',
      fullPage: true 
    });
    console.log('✅ クラスターページ');

    // 7. タブレット表示
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'tests/screenshots/final-tablet-view.png',
      fullPage: true 
    });
    console.log('✅ タブレット表示');

    // 8. モバイル表示
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/final-mobile-view.png',
      fullPage: true 
    });
    console.log('✅ モバイル表示');

    // 9. モバイルでサイドバーを開く
    await page.click('button[aria-label*="menu"], button:has-text("Menu"), [class*="menu"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/final-mobile-sidebar.png',
      fullPage: true 
    });
    console.log('✅ モバイル - サイドバー展開');

    // ==========================================
    // 最終UI状態の詳細分析
    // ==========================================
    
    console.log('\n🔍 === 最終UI状態分析 ===');
    
    // デスクトップビューに戻す
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);

    const finalAnalysis = await page.evaluate(() => {
      // コンポーネント構造分析
      const components = {
        layout: {
          hasSidebar: !!document.querySelector('nav[role="navigation"]'),
          hasHeader: !!document.querySelector('header[role="banner"]'),
          hasMain: !!document.querySelector('main[role="main"]'),
          hasFooter: !!document.querySelector('footer')
        },
        
        // インタラクティブ要素
        interactive: {
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          inputs: document.querySelectorAll('input, textarea').length,
          forms: document.querySelectorAll('form').length
        },
        
        // ナビゲーション
        navigation: {
          navItems: document.querySelectorAll('nav a').length,
          activeNavigation: !!document.querySelector('nav a[class*="active"], nav a[aria-current]'),
          mobileMenuButton: !!document.querySelector('[class*="menu"], [aria-label*="menu"]')
        },
        
        // コンテンツ構造
        content: {
          headings: {
            h1: document.querySelectorAll('h1').length,
            h2: document.querySelectorAll('h2').length,
            h3: document.querySelectorAll('h3').length
          },
          sections: document.querySelectorAll('section').length,
          cards: document.querySelectorAll('[class*="card"]').length
        },
        
        // デザイン要素
        design: {
          gradients: document.querySelectorAll('[class*="gradient"]').length,
          animations: document.querySelectorAll('[class*="animate"], [class*="motion"]').length,
          shadows: document.querySelectorAll('[class*="shadow"]').length,
          borders: document.querySelectorAll('[class*="border"]').length
        },
        
        // アクセシビリティ
        accessibility: {
          ariaLabels: document.querySelectorAll('[aria-label]').length,
          ariaRoles: document.querySelectorAll('[role]').length,
          altTexts: document.querySelectorAll('img[alt]').length,
          focusableElements: document.querySelectorAll('button, a, input, textarea, select, [tabindex]').length
        },
        
        // レスポンシブデザイン
        responsive: {
          hideOnMobile: document.querySelectorAll('[class*="lg:"], [class*="md:"], [class*="sm:"]').length,
          mobileSpecific: document.querySelectorAll('[class*="mobile"]').length,
          flexLayout: document.querySelectorAll('[class*="flex"]').length
        },
        
        // パフォーマンス指標
        performance: {
          totalElements: document.querySelectorAll('*').length,
          images: document.querySelectorAll('img').length,
          scripts: document.querySelectorAll('script').length,
          stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length
        }
      };
      
      // カラーパレット分析
      const colorAnalysis = {
        primaryColors: [],
        backgroundColors: [],
        textColors: []
      };
      
      // 主要なスタイル要素を収集
      const sampleElements = document.querySelectorAll('button, .card, nav, header');
      sampleElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colorAnalysis.backgroundColors.push(styles.backgroundColor);
        }
        if (styles.color) {
          colorAnalysis.textColors.push(styles.color);
        }
      });
      
      // 重複削除
      colorAnalysis.backgroundColors = [...new Set(colorAnalysis.backgroundColors)];
      colorAnalysis.textColors = [...new Set(colorAnalysis.textColors)];
      
      return { components, colorAnalysis };
    });

    console.log('\n📊 コンポーネント構造:');
    console.log(`  レイアウト: ${JSON.stringify(finalAnalysis.components.layout, null, 2)}`);
    console.log(`  インタラクティブ要素: ${JSON.stringify(finalAnalysis.components.interactive, null, 2)}`);
    console.log(`  ナビゲーション: ${JSON.stringify(finalAnalysis.components.navigation, null, 2)}`);
    console.log(`  コンテンツ: ${JSON.stringify(finalAnalysis.components.content, null, 2)}`);

    console.log('\n🎨 デザイン要素:');
    console.log(`  視覚効果: ${JSON.stringify(finalAnalysis.components.design, null, 2)}`);
    console.log(`  背景色サンプル: ${finalAnalysis.colorAnalysis.backgroundColors.slice(0, 5).join(', ')}`);

    console.log('\n♿ アクセシビリティ:');
    console.log(`  ${JSON.stringify(finalAnalysis.components.accessibility, null, 2)}`);

    console.log('\n📱 レスポンシブ対応:');
    console.log(`  ${JSON.stringify(finalAnalysis.components.responsive, null, 2)}`);

    console.log('\n⚡ パフォーマンス:');
    console.log(`  ${JSON.stringify(finalAnalysis.components.performance, null, 2)}`);

    // ページ読み込み時間の測定
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        firstPaint: Math.round(performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0),
        firstContentfulPaint: Math.round(performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0)
      };
    });

    console.log('\n⏱️ パフォーマンス指標:');
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  完全読み込み: ${performanceMetrics.loadComplete}ms`);
    console.log(`  First Paint: ${performanceMetrics.firstPaint}ms`);
    console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`);

    console.log('\n✅ === 最終UI分析完了 ===');
    console.log('📸 全スクリーンショットを tests/screenshots/ に保存しました');
    
    return { finalAnalysis, performanceMetrics };

  } catch (error) {
    console.error('❌ 最終分析に失敗:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

finalUIAnalysis().catch(console.error);