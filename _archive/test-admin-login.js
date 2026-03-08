import fetch from 'node-fetch';

const API_URL = 'http://localhost:5173/api/auth/login';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    console.log('URL:', API_URL);
    console.log('Credentials: admin / admin');
    console.log('');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin',
        password: 'admin'
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('Response Text:', text);
      data = { error: text };
    }

    console.log('');
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('');
      console.log('✅ Login successful!');
      console.log('Token:', data.token.substring(0, 50) + '...');
      console.log('User:', data.user);
    } else {
      console.log('');
      console.log('❌ Login failed!');
      console.log('Error:', data.error || data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Server is not running. Please start the server first.');
    }
  }
}

testAdminLogin();


