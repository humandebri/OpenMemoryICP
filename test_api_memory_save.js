// Test API memory saving with specific Principal ID
const API_KEY = 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O';
const BASE_URL = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';
const EXPECTED_PRINCIPAL = '4wbqy-qsiaa-aaaah-qcvkq-cai';

async function testAPIMemorySave() {
  console.log('🧪 Testing API memory save with specific Principal ID...');
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`👤 Expected Principal: ${EXPECTED_PRINCIPAL}`);
  
  try {
    // Step 1: Test authentication
    console.log('\n1️⃣ Testing authentication...');
    const authResponse = await fetch(`${BASE_URL}/test-auth`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`);
    }
    
    const authData = await authResponse.json();
    console.log('✅ Authentication successful:', authData);
    
    // Step 2: Check current memory count
    console.log('\n2️⃣ Checking current memory count...');
    const memoriesResponse = await fetch(`${BASE_URL}/memories`);
    const memoriesData = await memoriesResponse.json();
    console.log(`📊 Current memories: ${memoriesData.total_count}`);
    
    // Step 3: Save test memory via API
    console.log('\n3️⃣ Saving test memory via API...');
    const testContent = encodeURIComponent(
      `Test memory saved via API for Principal ${EXPECTED_PRINCIPAL} - ${new Date().toISOString()}`
    );
    
    const saveResponse = await fetch(
      `${BASE_URL}/save-memory?content=${testContent}&tags=api-test,principal-test,frontend-verification`,
      {
        headers: { 'X-API-Key': API_KEY }
      }
    );
    
    if (saveResponse.ok) {
      const saveData = await saveResponse.json();
      console.log('✅ Memory saved successfully:', saveData);
      
      // Step 4: Verify memory appears in list
      console.log('\n4️⃣ Verifying memory appears in list...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const updatedMemoriesResponse = await fetch(`${BASE_URL}/memories`);
      const updatedMemoriesData = await updatedMemoriesResponse.json();
      console.log(`📊 Updated memories count: ${updatedMemoriesData.total_count}`);
      
      if (updatedMemoriesData.memories && updatedMemoriesData.memories.length > 0) {
        console.log('📋 Latest memories:');
        updatedMemoriesData.memories.slice(0, 3).forEach((memory, index) => {
          console.log(`  ${index + 1}. ${memory.content.substring(0, 80)}...`);
          console.log(`     ID: ${memory.id}`);
          console.log(`     User: ${memory.user_id}`);
          console.log(`     Created: ${new Date(memory.created_at / 1000000).toLocaleString()}`);
        });
        
        // Check if our memory is there
        const ourMemory = updatedMemoriesData.memories.find(m => 
          m.content.includes('Test memory saved via API') && 
          m.user_id === EXPECTED_PRINCIPAL
        );
        
        if (ourMemory) {
          console.log('\n🎉 SUCCESS: Our test memory found in the API response!');
          console.log(`✅ Memory ID: ${ourMemory.id}`);
          console.log(`✅ Principal matches: ${ourMemory.user_id === EXPECTED_PRINCIPAL}`);
          
          return {
            success: true,
            memoryId: ourMemory.id,
            principalId: ourMemory.user_id,
            content: ourMemory.content,
            totalMemories: updatedMemoriesData.total_count
          };
        } else {
          console.log('❌ Our test memory not found in the list');
          return { success: false, reason: 'Memory not found in list' };
        }
      } else {
        console.log('❌ No memories found after save');
        return { success: false, reason: 'No memories in response' };
      }
    } else {
      const errorText = await saveResponse.text();
      console.log('❌ Save failed:', saveResponse.status, errorText);
      return { success: false, reason: `Save failed: ${errorText}` };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

async function testFrontendAccess() {
  console.log('\n🌐 Testing frontend access to saved memory...');
  
  try {
    // Instructions for manual verification
    console.log(`
📋 MANUAL VERIFICATION STEPS:

1. 🌐 Open: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/

2. 🔐 Login with Internet Identity (if not already logged in)

3. 👤 Check User Profile:
   - Navigate to /user page
   - Verify Principal ID shows: ${EXPECTED_PRINCIPAL}
   - Copy API key and Principal ID from the page

4. 🔍 Check Search Page:
   - Navigate to /search page
   - Look for test memory with content: "Test memory saved via API"
   - Verify the memory appears in the list

5. 🏠 Check Dashboard:
   - Navigate to / (home page)
   - Look for recent memories section
   - Verify test memory appears there

Expected Results:
✅ Principal ID should be: ${EXPECTED_PRINCIPAL}
✅ Test memory should be visible in both search and dashboard
✅ Memory should have tags: api-test, principal-test, frontend-verification
    `);
    
    return { success: true, instructions: 'Manual verification steps provided' };
    
  } catch (error) {
    console.error('❌ Frontend access test failed:', error);
    return { success: false, error: error.message };
  }
}

// Main test execution
async function runCompleteTest() {
  console.log('🚀 Starting complete API → Frontend verification test\n');
  
  // Test API save
  const apiResult = await testAPIMemorySave();
  
  // Test frontend access instructions
  const frontendResult = await testFrontendAccess();
  
  console.log('\n📊 COMPLETE TEST RESULTS:');
  console.log('='.repeat(50));
  console.log('API Save Test:', apiResult.success ? '✅ PASSED' : '❌ FAILED');
  if (apiResult.success) {
    console.log(`  Memory ID: ${apiResult.memoryId}`);
    console.log(`  Principal ID: ${apiResult.principalId}`);
    console.log(`  Total Memories: ${apiResult.totalMemories}`);
  }
  
  console.log('\nFrontend Verification:', frontendResult.success ? '✅ READY' : '❌ FAILED');
  
  if (apiResult.success) {
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Open the frontend URL in your browser');
    console.log('2. Login with Internet Identity');
    console.log('3. Check /user page for Principal ID');
    console.log('4. Check /search page for saved memory');
    console.log('5. Verify the memory appears correctly');
    
    console.log('\n🔗 Quick Links:');
    console.log(`📱 Frontend: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/`);
    console.log(`👤 User Profile: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/user`);
    console.log(`🔍 Search Page: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/search`);
  }
  
  return { apiResult, frontendResult };
}

// Export for Node.js
if (typeof module !== 'undefined') {
  module.exports = { testAPIMemorySave, testFrontendAccess, runCompleteTest };
}

// Run if called directly
if (require.main === module) {
  runCompleteTest().catch(console.error);
}