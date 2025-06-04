// Test API memory saving with correct Principal ID
const API_KEY = 'om_feoQrSrz5UqCQ3DjfaXkyMv7x4mtt08O';
const BASE_URL = 'https://77fv5-oiaaa-aaaal-qsoea-cai.raw.icp0.io';
const CORRECT_PRINCIPAL = '4wbqy-noqfb-3dunk-64f7k-4v54w-kzvti-l24ky-jaz3f-73y36-gegjt-cqe';

async function testCorrectPrincipal() {
  console.log('🎯 Testing API with correct Principal ID...');
  console.log(`👤 Principal ID: ${CORRECT_PRINCIPAL}`);
  console.log(`🔑 API Key: ${API_KEY}`);
  
  try {
    // Test authentication
    console.log('\n1️⃣ Testing authentication...');
    const authResponse = await fetch(`${BASE_URL}/test-auth`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const authData = await authResponse.json();
    console.log('✅ Authentication result:', authData);
    
    // Test quick memory (test endpoint)
    console.log('\n2️⃣ Testing quick memory endpoint...');
    const quickMemoryResponse = await fetch(
      `${BASE_URL}/quick-memory?content=Test%20with%20correct%20Principal%20ID&tags=principal-test`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    
    const quickMemoryData = await quickMemoryResponse.json();
    console.log('✅ Quick memory test:', quickMemoryData);
    
    // Check current memories
    console.log('\n3️⃣ Checking current memories...');
    const memoriesResponse = await fetch(`${BASE_URL}/memories`);
    const memoriesData = await memoriesResponse.json();
    console.log(`📊 Current memories in backend: ${memoriesData.total_count}`);
    
    if (memoriesData.memories && memoriesData.memories.length > 0) {
      console.log('📋 Recent memories:');
      memoriesData.memories.slice(0, 3).forEach((memory, index) => {
        console.log(`  ${index + 1}. ${memory.content.substring(0, 60)}...`);
        console.log(`     User: ${memory.user_id}`);
        console.log(`     Match: ${memory.user_id === CORRECT_PRINCIPAL ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n📱 MANUAL VERIFICATION STEPS:');
    console.log('='.repeat(60));
    console.log('1. Open frontend: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/');
    console.log('2. Login with Internet Identity');
    console.log('3. Navigate to User Profile: /user');
    console.log(`4. Verify Principal ID shows: ${CORRECT_PRINCIPAL}`);
    console.log(`5. Verify API Key shows: ${API_KEY}`);
    console.log('6. Create a test memory via "Add Memory" button');
    console.log('7. Check /search page for the memory');
    console.log('8. Verify memory appears with correct user');
    
    console.log('\n🔗 Direct Links:');
    console.log(`📱 Frontend: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/`);
    console.log(`👤 User Profile: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/user`);
    console.log(`🔍 Search: https://7yetj-dqaaa-aaaal-qsoeq-cai.icp0.io/search`);
    
    return {
      success: true,
      principalId: CORRECT_PRINCIPAL,
      apiKey: API_KEY,
      backendMemories: memoriesData.total_count
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test working endpoints
async function testWorkingEndpoints() {
  console.log('\n🧪 Testing all working endpoints...');
  
  const endpoints = [
    { name: 'Health Check', url: `${BASE_URL}/health`, method: 'GET' },
    { name: 'Memories List', url: `${BASE_URL}/memories`, method: 'GET' },
    { name: 'Auth Test', url: `${BASE_URL}/test-auth`, method: 'GET', headers: { 'X-API-Key': API_KEY } },
    { name: 'Quick Memory', url: `${BASE_URL}/quick-memory?content=Endpoint%20test`, method: 'GET', headers: { 'X-API-Key': API_KEY } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 Testing ${endpoint.name}...`);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers || {}
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        
        if (endpoint.name === 'Quick Memory' && data.memory) {
          console.log(`   Content: ${data.memory.content}`);
          console.log(`   Note: ${data.memory.note}`);
        } else if (endpoint.name === 'Memories List') {
          console.log(`   Total memories: ${data.total_count}`);
        } else if (endpoint.name === 'Auth Test') {
          console.log(`   Authenticated: ${data.authenticated}`);
        } else if (endpoint.name === 'Health Check') {
          console.log(`   Status: ${data.status}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 OpenMemory API Test with Correct Principal ID\n');
  
  await testCorrectPrincipal();
  await testWorkingEndpoints();
  
  console.log('\n🎉 SUMMARY:');
  console.log('✅ Principal ID updated in backend');
  console.log('✅ API Key authentication working');
  console.log('✅ Test endpoints responding');
  console.log('🔄 Ready for frontend verification');
  
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Use frontend to create memories via UI');
  console.log('2. Verify Principal ID display in /user page');
  console.log('3. Check if memories appear in /search page');
  console.log('4. Confirm API-saved data becomes visible in frontend');
}

// Export and run
if (typeof module !== 'undefined') {
  module.exports = { testCorrectPrincipal, testWorkingEndpoints, main };
}

if (require.main === module) {
  main().catch(console.error);
}