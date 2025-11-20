// Quick test script to verify login endpoint
// Run with: node test-login.js

const testLogin = async () => {
  const email = 'test@example.com';
  const password = 'test123';
  
  try {
    console.log('🧪 Testing login endpoint...');
    console.log(`📡 POST http://localhost:5173/api/auth/login`);
    console.log(`📧 Email: ${email}`);
    
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Get response as text first to see what we're actually getting
    const text = await response.text();
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`📄 Raw Response (first 500 chars):`, text.substring(0, 500));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
      console.log('📦 Parsed JSON:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse as JSON:', parseError.message);
      console.log('💡 Server returned HTML instead of JSON. This usually means:');
      console.log('   - Route not found (404)');
      console.log('   - Server error page');
      console.log('   - Wrong URL or server not running');
      return;
    }
    
    if (response.ok) {
      console.log('\n✅ Login endpoint is working!');
    } else {
      console.log('\n❌ Login failed (expected if user doesn\'t exist)');
      console.log('💡 Check server console for detailed logs');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n💡 Make sure:');
    console.log('   1. Server is running: cd server && npm run dev');
    console.log('   2. Server is listening on port 5173');
    console.log('   3. Check server console for errors');
  }
};

testLogin();

