// Test script to check if frontend can save and display memories
// This script should be run in the browser console on the frontend

async function testFrontendMemory() {
  console.log('🚀 Testing OpenMemory Frontend...');
  
  // Check if we're on the right page
  if (!window.location.href.includes('7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io')) {
    console.error('❌ Please navigate to: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/');
    return;
  }
  
  // Check if OpenMemory API is available
  if (typeof window.openmemoryAPI !== 'undefined') {
    console.log('✅ Frontend API client detected');
    
    try {
      // Test health check
      const health = await window.openmemoryAPI.getHealth();
      console.log('✅ Backend health:', health);
      
      // Test authentication status
      const isAuth = await window.openmemoryAPI.isAuthenticated();
      console.log('🔐 Authentication status:', isAuth);
      
      if (!isAuth) {
        console.log('⚠️ Not authenticated. Please login with Internet Identity first.');
        return;
      }
      
      // Try to add a test memory
      console.log('📝 Creating test memory...');
      const testContent = `Frontend test memory - ${new Date().toISOString()}`;
      
      const result = await window.openmemoryAPI.addMemory(
        testContent,
        'frontend-test',
        ['test', 'frontend', 'api-verification']
      );
      
      console.log('✅ Memory created successfully:', result);
      
      // Try to fetch memories
      const memories = await window.openmemoryAPI.getMemories(10, 0);
      console.log('📊 Current memories:', memories);
      
      return {
        success: true,
        health,
        authenticated: isAuth,
        memoryCreated: result,
        totalMemories: memories.length
      };
      
    } catch (error) {
      console.error('❌ Frontend API error:', error);
      return { success: false, error: error.message };
    }
  } else {
    console.log('⚠️ Frontend API client not found. Checking page elements...');
    
    // Check if there are memory elements on the page
    const memoryElements = document.querySelectorAll('[data-testid*="memory"], .memory-card, .memory-item');
    console.log(`📊 Found ${memoryElements.length} memory elements on page`);
    
    // Check if there's an add memory button
    const addButton = document.querySelector('button[data-testid*="add"], button:contains("Add Memory"), button:contains("メモリを追加")');
    if (addButton) {
      console.log('✅ Add memory button found:', addButton);
    } else {
      console.log('⚠️ No add memory button found');
    }
    
    // Check for authentication elements
    const authElements = document.querySelectorAll('[data-testid*="auth"], [data-testid*="login"], button:contains("Login"), button:contains("ログイン")');
    console.log(`🔐 Found ${authElements.length} authentication elements`);
    
    return {
      success: false,
      message: 'Frontend API not available, but page elements checked',
      memoryElements: memoryElements.length,
      hasAddButton: !!addButton,
      authElements: authElements.length
    };
  }
}

// Alternative direct API test
async function testDirectAPI() {
  console.log('🔧 Testing direct API access...');
  
  const BASE_URL = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';
  
  try {
    // Test health
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ API Health:', health);
    
    // Test memories list
    const memoriesResponse = await fetch(`${BASE_URL}/memories`);
    const memories = await memoriesResponse.json();
    console.log('📊 Current memories:', memories);
    
    // Test auth endpoint
    const authResponse = await fetch(`${BASE_URL}/test-auth`, {
      headers: {
        'X-API-Key': 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O'
      }
    });
    const auth = await authResponse.json();
    console.log('🔐 API Auth test:', auth);
    
    return {
      success: true,
      health,
      memories,
      auth
    };
    
  } catch (error) {
    console.error('❌ Direct API error:', error);
    return { success: false, error: error.message };
  }
}

// Instructions
console.log(`
📋 OpenMemory Frontend Test Instructions:

1. Navigate to: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/
2. Open browser console (F12)
3. Run: testFrontendMemory()
4. Or test direct API: testDirectAPI()

These functions will test if the frontend can save and display memories.
`);

// Auto-run if this script is executed
if (typeof window !== 'undefined' && window.location.href.includes('7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io')) {
  console.log('🚀 Auto-running frontend test...');
  testFrontendMemory().then(result => {
    console.log('🎯 Test result:', result);
  });
}

// Export for manual use
if (typeof window !== 'undefined') {
  window.testFrontendMemory = testFrontendMemory;
  window.testDirectAPI = testDirectAPI;
}