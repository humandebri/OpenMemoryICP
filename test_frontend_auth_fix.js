// Test script to help debug frontend authentication
console.log(`
🔧 Frontend Authentication Debug Script

📱 Frontend URL: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/

🔍 Debug Steps:

1. Open the frontend URL in your browser
2. Open browser console (F12)
3. Login with Internet Identity
4. Run this in console to check authentication:

// Check authentication status
async function checkAuth() {
  console.log('🔐 Checking authentication...');
  
  // Check if openMemoryAPI is available
  if (typeof window.openMemoryAPI !== 'undefined') {
    const isAuth = await window.openMemoryAPI.isAuthenticated();
    console.log('Authentication status:', isAuth);
    
    const principal = window.openMemoryAPI.getPrincipal();
    console.log('Principal:', principal?.toString());
    
    return { authenticated: isAuth, principal: principal?.toString() };
  } else {
    console.log('❌ OpenMemory API not found');
    return { error: 'API not found' };
  }
}

// Test memory creation
async function testMemoryCreation() {
  console.log('📝 Testing memory creation...');
  
  if (typeof window.openMemoryAPI !== 'undefined') {
    try {
      const result = await window.openMemoryAPI.addMemory(
        'Frontend auth test - ' + new Date().toISOString(),
        'test',
        ['frontend', 'auth', 'debug']
      );
      console.log('✅ Memory created:', result);
      return { success: true, memory: result };
    } catch (error) {
      console.error('❌ Memory creation failed:', error);
      return { success: false, error: error.message };
    }
  } else {
    return { error: 'API not found' };
  }
}

5. Run these commands:
   checkAuth()
   testMemoryCreation()

6. Expected Results:
   ✅ Authentication should be true
   ✅ Principal should be: 4wbqy-noqfb-3dunk-64f7k-4v54w-kzvti-l24ky-jaz3f-73y36-gegjt-cqe
   ✅ Memory creation should succeed
   
7. If memory creation works, check:
   - Navigate to /search page
   - Verify the test memory appears
   - Check that it has the correct Principal ID

🔧 Troubleshooting:
- If authentication fails: Try logging out and back in
- If API key errors: Check browser console for detailed logs
- If Principal ID is wrong: Check /user page for correct ID

📊 Backend API Status:
- Health: Available
- Authentication: Working with API key
- Principal mapping: Updated to correct ID

🎯 Success Criteria:
1. Login with Internet Identity ✅
2. checkAuth() returns true ✅
3. Principal ID matches expected value ✅
4. testMemoryCreation() succeeds ✅
5. Memory appears in /search page ✅
`);

// If running in Node.js, provide the script for browser
if (typeof window === 'undefined') {
  console.log('📋 Copy and paste these functions into browser console:');
  console.log(`
// Check authentication status
async function checkAuth() {
  console.log('🔐 Checking authentication...');
  
  if (typeof window.openMemoryAPI !== 'undefined') {
    const isAuth = await window.openMemoryAPI.isAuthenticated();
    console.log('Authentication status:', isAuth);
    
    const principal = window.openMemoryAPI.getPrincipal();
    console.log('Principal:', principal?.toString());
    
    return { authenticated: isAuth, principal: principal?.toString() };
  } else {
    console.log('❌ OpenMemory API not found');
    return { error: 'API not found' };
  }
}

// Test memory creation
async function testMemoryCreation() {
  console.log('📝 Testing memory creation...');
  
  if (typeof window.openMemoryAPI !== 'undefined') {
    try {
      const result = await window.openMemoryAPI.addMemory(
        'Frontend auth test - ' + new Date().toISOString(),
        'test',
        ['frontend', 'auth', 'debug']
      );
      console.log('✅ Memory created:', result);
      return { success: true, memory: result };
    } catch (error) {
      console.error('❌ Memory creation failed:', error);
      return { success: false, error: error.message };
    }
  } else {
    return { error: 'API not found' };
  }
}
`);
}

// Export for manual use
if (typeof module !== 'undefined') {
  module.exports = { 
    message: 'Use the browser console functions for testing' 
  };
}