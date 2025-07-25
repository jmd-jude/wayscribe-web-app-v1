#!/usr/bin/env node

// Simple test script to verify the IBD Navigator is working

const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing IBD Navigator endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);
    
    // Test session initialization
    console.log('\n2. Testing session initialization...');
    const initResponse = await fetch(`${baseUrl}/api/session/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!initResponse.ok) {
      throw new Error(`Session init failed: ${initResponse.status}`);
    }
    
    const initData = await initResponse.json();
    console.log('✅ Session created:', initData.sessionId);
    console.log('✅ Welcome message received (length):', initData.welcome.length);
    
    // Test consultation
    console.log('\n3. Testing consultation...');
    const consultResponse = await fetch(`${baseUrl}/api/consult/${initData.sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I was diagnosed with Crohn\'s disease 3 months ago. What should I be eating?'
      })
    });
    
    if (!consultResponse.ok) {
      throw new Error(`Consultation failed: ${consultResponse.status}`);
    }
    
    const consultData = await consultResponse.json();
    console.log('✅ Consultation response received');
    console.log('   Token usage:', consultData.usage);
    console.log('   Response length:', consultData.response.length);
    
    console.log('\n✅ All tests passed! IBD Navigator is working correctly.');
    console.log('\n📝 Sample test question you can try:');
    console.log('   "I was diagnosed with Crohn\'s disease 3 months ago. What should I be eating?"');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nMake sure the server is running on http://localhost:3000');
    process.exit(1);
  }
};

// Run tests
testEndpoints();
