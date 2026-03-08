/**
 * Test script to verify module route is working
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173/api';

async function testModuleRoute() {
  try {
    console.log('🧪 Testing module route...\n');

    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher.approved@example.com',
        password: 'teacher123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.error('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // Test creating a module
    console.log('2. Testing POST /api/courses/12/modules...');
    const moduleResponse = await fetch(`${BASE_URL}/courses/12/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Module',
        order_index: 1
      })
    });

    console.log(`Status: ${moduleResponse.status} ${moduleResponse.statusText}`);
    const responseData = await moduleResponse.json();
    console.log('Response:', JSON.stringify(responseData, null, 2));

    if (moduleResponse.ok) {
      console.log('\n✅ Module route is working!');
    } else {
      console.log('\n❌ Module route failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the server is running on http://localhost:5173');
    }
  }
}

testModuleRoute();


