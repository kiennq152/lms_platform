// Detailed login test with test user credentials
// Run with: node test-login-detailed.js

const testLogin = async () => {
  const email = 'test@example.com';
  const password = 'test123456';
  
  try {
    console.log('🧪 Testing login with test user...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`📡 POST http://localhost:5173/api/auth/login`);
    console.log('');
    
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const text = await response.text();
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`📄 Raw Response:`, text.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('\n📦 Parsed JSON:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('\n❌ Failed to parse as JSON:', parseError.message);
      return;
    }
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log(`   Token: ${data.token ? data.token.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`   User ID: ${data.user?.user_id || 'N/A'}`);
      console.log(`   Email: ${data.user?.email || 'N/A'}`);
      console.log(`   Role: ${data.user?.role || 'N/A'}`);
      console.log(`   Name: ${data.user?.first_name || ''} ${data.user?.last_name || ''}`);
      console.log(`   Email Verified: ${data.user?.email_verified || false}`);
      console.log(`   Admin Approved: ${data.user?.admin_approved || false}`);
      console.log('\n✅ Login function is working correctly!');
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      if (data.errors) {
        console.log(`   Validation Errors:`, data.errors);
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n💡 Make sure:');
    console.log('   1. Server is running: cd server && npm run dev');
    console.log('   2. Database is connected');
    console.log('   3. Test user exists in database');
  }
};

testLogin();


