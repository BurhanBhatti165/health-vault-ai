// Quick API Test Script
// Run with: node backend/test-api.js (after server is running)

const baseURL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing Health Vault AI API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${baseURL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('');

    // Test 2: Register User
    console.log('2️⃣ Registering new user...');
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Patient',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'Patient'
      })
    });
    const registerData = await registerResponse.json();
    
    if (registerData.success) {
      console.log('✅ User registered:', registerData.data.user.name);
      console.log('📧 Email:', registerData.data.user.email);
      console.log('🎫 Token:', registerData.data.token.substring(0, 20) + '...');
      
      const token = registerData.data.token;
      console.log('');

      // Test 3: Get Current User
      console.log('3️⃣ Fetching current user with token...');
      const meResponse = await fetch(`${baseURL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meResponse.json();
      
      if (meData.success) {
        console.log('✅ Current user:', meData.data.user.name);
        console.log('👤 Role:', meData.data.user.role);
      }
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the backend server is running: npm run server:dev');
  }
}

testAPI();
