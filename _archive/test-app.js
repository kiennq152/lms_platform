#!/usr/bin/env node

/**
 * Quick App Test Script
 * Tests the application without running full test suite
 */

import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testHealthCheck() {
  log('\n📊 Testing Health Check...', 'blue');
  try {
    const result = await makeRequest('GET', '/health');
    if (result.status === 200 && result.data.status === 'ok') {
      log('✅ Health check passed', 'green');
      return true;
    } else {
      log(`❌ Health check failed: ${JSON.stringify(result.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testRegistration() {
  log('\n📝 Testing User Registration...', 'blue');
  try {
    const testEmail = `test${Date.now()}@example.com`;
    const result = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
    });

    if (result.status === 201) {
      log('✅ Registration passed', 'green');
      return { success: true, email: testEmail };
    } else {
      log(`❌ Registration failed: ${result.data.error || JSON.stringify(result.data)}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Registration error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testLogin(email, password) {
  log('\n🔐 Testing Login...', 'blue');
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email,
      password,
    });

    if (result.status === 200 && result.data.token) {
      log('✅ Login passed', 'green');
      return { success: true, token: result.data.token };
    } else {
      log(`❌ Login failed: ${result.data.error || JSON.stringify(result.data)}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Login error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testOTPRequest(email) {
  log('\n📧 Testing OTP Request...', 'blue');
  try {
    const result = await makeRequest('POST', '/api/auth/request-otp', {
      email,
    });

    if (result.status === 200) {
      log('✅ OTP request passed', 'green');
      if (result.data.otp) {
        log(`   OTP Code (dev mode): ${result.data.otp}`, 'yellow');
      }
      return { success: true, otp: result.data.otp };
    } else {
      log(`❌ OTP request failed: ${result.data.error || JSON.stringify(result.data)}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ OTP request error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testOTPLogin(email, otp) {
  log('\n🔑 Testing OTP Login...', 'blue');
  try {
    const result = await makeRequest('POST', '/api/auth/login-otp', {
      email,
      otp,
    });

    if (result.status === 200 && result.data.token) {
      log('✅ OTP login passed', 'green');
      return { success: true, token: result.data.token };
    } else {
      log(`❌ OTP login failed: ${result.data.error || JSON.stringify(result.data)}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ OTP login error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testProtectedRoute(token) {
  log('\n🔒 Testing Protected Route...', 'blue');
  try {
    const result = await makeRequest('GET', '/api/auth/me', null, token);

    if (result.status === 200 && result.data.user) {
      log('✅ Protected route passed', 'green');
      return true;
    } else {
      log(`❌ Protected route failed: ${result.data.error || JSON.stringify(result.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Protected route error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🧪 Starting Application Tests...', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  const results = {
    health: false,
    registration: false,
    login: false,
    otp: false,
    protected: false,
  };

  // Test 1: Health Check
  results.health = await testHealthCheck();
  if (!results.health) {
    log('\n❌ Server is not running or health check failed!', 'red');
    log('💡 Make sure server is running: npm run dev', 'yellow');
    process.exit(1);
  }

  // Test 2: Registration
  const registration = await testRegistration();
  results.registration = registration.success;
  if (!results.registration) {
    log('\n⚠️  Registration test failed, but continuing...', 'yellow');
  }

  // Test 3: Password Login
  if (registration.success) {
    const login = await testLogin(registration.email, 'Test123!@#');
    results.login = login.success;
    const token = login.token;

    // Test 4: Protected Route
    if (token) {
      results.protected = await testProtectedRoute(token);
    }

    // Test 5: OTP Login
    log('\n📧 Testing OTP Flow...', 'blue');
    const otpRequest = await testOTPRequest(registration.email);
    results.otp = otpRequest.success;

    if (otpRequest.success && otpRequest.otp) {
      // In dev mode, OTP is returned
      await testOTPLogin(registration.email, otpRequest.otp);
    } else {
      log('⚠️  OTP not returned (check email config or check email inbox)', 'yellow');
    }
  }

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('\n📊 Test Results Summary:', 'blue');
  log(`   Health Check: ${results.health ? '✅' : '❌'}`, results.health ? 'green' : 'red');
  log(`   Registration: ${results.registration ? '✅' : '❌'}`, results.registration ? 'green' : 'red');
  log(`   Password Login: ${results.login ? '✅' : '❌'}`, results.login ? 'green' : 'red');
  log(`   OTP Request: ${results.otp ? '✅' : '❌'}`, results.otp ? 'green' : 'red');
  log(`   Protected Route: ${results.protected ? '✅' : '❌'}`, results.protected ? 'green' : 'red');

  const allPassed = Object.values(results).every((r) => r);
  if (allPassed) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above.', 'yellow');
  }

  log('\n💡 For comprehensive testing, run: npm test', 'blue');
  log('💡 For detailed guide, see: TESTING_GUIDE.md', 'blue');
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test script error: ${error.message}`, 'red');
  process.exit(1);
});

