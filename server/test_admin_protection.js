import 'dotenv/config';
import express from 'express';
import adminRoutes from './src/routes/admin.js';

console.log('=== Testing Admin Protected Routes ===\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

// Simple mock runner for HTTP handlers
async function runHttpTests() {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/admin`;

  try {
    // 1. Unauthenticated GET /stats
    const resNoAuth = await fetch(`${baseUrl}/stats`);
    assert(resNoAuth.status === 401, 'Unauthenticated request to /stats returns HTTP 401');

    // 2. Tampered token GET /stats
    const resBadToken = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: 'Bearer fake.invalid.token' },
    });
    assert(resBadToken.status === 401, 'Tampered Bearer token to /stats returns HTTP 401');

    // 3. Unauthenticated POST /verify
    const resNoAuthVerify = await fetch(`${baseUrl}/registrations/ORDER-123/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    assert(resNoAuthVerify.status === 401, 'Unauthenticated request to /registrations/:id/verify returns HTTP 401');

    // 4. Invalid Login
    const resBadLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword' }),
    });
    assert(resBadLogin.status === 401, 'Invalid admin password returns HTTP 401');

    // 5. Valid Login
    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'Admin@CoursePilot2025';
    const resGoodLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: expectedUser, password: expectedPass }),
    });
    assert(resGoodLogin.status === 200, 'Valid admin credentials return HTTP 200');
    const loginData = await resGoodLogin.json();
    assert(loginData.success === true && loginData.token, 'Login response contains signed admin token');

    // 6. Access /me with valid token
    const resMe = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert(resMe.status === 200, 'Authenticated request to /me returns HTTP 200');
    const meData = await resMe.json();
    assert(meData.admin?.username === expectedUser, 'Decoded admin token matches authenticated admin user');

  } catch (err) {
    console.error('Test execution error:', err);
    failedTests++;
  } finally {
    server.close();
  }

  console.log('\n=== Protected Route Results ===');
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('\nAll Protected Route checks passed successfully!');
  }
}

runHttpTests();
