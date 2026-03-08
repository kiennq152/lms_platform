// Test login API endpoint using built-in fetch (Node 18+)
const API_URL = 'http://localhost:5173/api/auth/login';

async function testLogin() {
  try {
    console.log('🔐 Testing Admin Login API...');
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
    console.log('Response Status Text:', response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
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
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('Token (first 50 chars):', data.token.substring(0, 50) + '...');
      console.log('User:', {
        id: data.user?.user_id,
        email: data.user?.email,
        role: data.user?.role,
        name: `${data.user?.first_name} ${data.user?.last_name}`
      });
      console.log('');
      console.log('✅ Admin login is working correctly!');
    } else {
      console.log('');
      console.log('❌ LOGIN FAILED!');
      console.log('Error:', data.error || data.message || 'Unknown error');
      if (data.errors) {
        console.log('Validation Errors:', data.errors);
      }
    }
  } catch (error) {
    console.error('');
    console.error('❌ Test Error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.error('');
      console.error('⚠️  Server is not running!');
      console.error('Please start the server with: cd server && node server.js');
    } else if (error.message.includes('fetch')) {
      console.error('');
      console.error('⚠️  Fetch API not available. Using Node 18+ or install node-fetch');
    }
  }
}

testLogin();


