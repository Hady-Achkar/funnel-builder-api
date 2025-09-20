#!/usr/bin/env node

const https = require('https');

const API_BASE = 'https://api.digitalsite.us';

// Test credentials and token
const testUser = {
  email: 'test_74998250_41c81a@example.com',
  password: 'TestPassword123!'
};

const verificationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RfNzQ5OTgyNTBfNDFjODFhQGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJ0ZXN0NzQ5OTgyNTA0MWM4MWEiLCJmaXJzdE5hbWUiOiJUZXN0IiwibGFzdE5hbWUiOiJVc2VyIiwiaXNBZG1pbiI6ZmFsc2UsInBsYW4iOiJGUkVFIiwiaWF0IjoxNzU4Mzc0OTk4LCJleHAiOjE3NzM5MjY5OTh9.Typ2Dd1vDW3qtWEFiaAXbxBRplcKRyC_7iY8xXEz7zY';

const timestamp = Date.now().toString().slice(-6);
const testWorkspace = {
  name: `Test Workspace ${timestamp}`,
  slug: `test-workspace-${timestamp}`,
  description: 'Test workspace created via API testing script'
};

let authToken = null;
let workspaceId = null;

// Helper function to make HTTPS requests
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
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

// Test functions
async function testEmailVerification() {
  console.log('\n🧪 Testing Email Verification...');
  console.log(`  Token: ${verificationToken.substring(0, 50)}...`);

  try {
    const response = await makeRequest(`/api/auth/verify?token=${verificationToken}`, 'POST');

    if (response.status === 200) {
      console.log('  ✅ Email verified successfully');

      // Check if auth token is returned
      if (response.data.token) {
        authToken = response.data.token;
        console.log('  🔑 Auth token received from verification');
      }

      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      console.log(`  ❌ Email verification failed: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 Testing User Login...');
  console.log(`  Email: ${testUser.email}`);

  try {
    const response = await makeRequest('/api/auth/login', 'POST', {
      identifier: testUser.email,
      password: testUser.password
    });

    if (response.status === 200) {
      console.log('  ✅ Login successful');

      // Check different possible token locations
      const token = response.data.data?.token || response.data.token || response.data.accessToken;
      if (token) {
        authToken = token;
        console.log(`  🔑 Auth token received: ${authToken.substring(0, 30)}...`);
      } else {
        console.log('  ⚠️  No token found in response');
      }
      console.log(`  User: ${response.data.user?.email || testUser.email}`);
      return true;
    } else {
      console.log(`  ❌ Login failed: ${response.status}`);
      console.log(`  Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testVerifyToken() {
  console.log('\n🧪 Testing Token Verification...');

  if (!authToken) {
    console.log('  ⚠️  No auth token available');
    return false;
  }

  try {
    const response = await makeRequest('/api/auth/user/profile', 'GET', null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
      console.log('  ✅ Token verified successfully via user profile');
      console.log('\n  📋 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));

      console.log('\n  📊 Summary:');
      console.log(`  User ID: ${response.data.id || response.data.user?.id || 'N/A'}`);
      console.log(`  Email: ${response.data.email || response.data.user?.email || 'N/A'}`);
      return true;
    } else {
      console.log(`  ❌ Token verification failed: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testCreateWorkspace() {
  console.log('\n🧪 Testing Workspace Creation...');
  console.log(`  Name: ${testWorkspace.name}`);
  console.log(`  Slug: ${testWorkspace.slug}`);

  if (!authToken) {
    console.log('  ⚠️  No auth token available');
    return false;
  }

  try {
    const response = await makeRequest('/api/workspaces', 'POST', testWorkspace, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 201) {
      console.log('  ✅ Workspace created successfully');
      workspaceId = response.data.workspaceId;
      console.log(`  Workspace ID: ${workspaceId}`);
      console.log('\n  📋 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log(`  ❌ Workspace creation failed: ${response.status}`);
      console.log('\n  📋 Error Response:');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testGetWorkspaces() {
  console.log('\n🧪 Testing Get All Workspaces...');

  if (!authToken) {
    console.log('  ⚠️  No auth token available');
    return false;
  }

  try {
    const response = await makeRequest('/api/workspaces', 'GET', null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
      console.log('  ✅ Workspaces retrieved successfully');
      console.log(`  Number of workspaces: ${response.data.length}`);

      // Log full response for debugging
      console.log('\n  📋 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data.length > 0) {
        console.log('\n  📊 Workspace Summary:');
        response.data.forEach(ws => {
          console.log(`    - ${ws.name} (${ws.slug})`);
          console.log(`      Your Role: ${ws.role}`);
          console.log(`      Your Permissions: ${ws.permissions ? ws.permissions.join(', ') : 'None'}`);

          // Handle both old and new response formats
          const memberCount = ws.memberCount || ws.members?.length || 0;
          const funnelCount = ws.funnelCount || ws.funnelsCount || 0;
          const domainCount = ws.domainCount || 0;

          console.log(`      Members (${memberCount}):`);
          if (ws.members && ws.members.length > 0) {
            ws.members.forEach(member => {
              console.log(`        - ${member.firstName} ${member.lastName} (${member.role})`);
              if (member.permissions && member.permissions.length > 0) {
                console.log(`          Permissions: ${member.permissions.join(', ')}`);
              }
            });
          } else {
            console.log('        (members list not available in response)');
          }
          console.log(`      Funnels: ${funnelCount}, Domains: ${domainCount}`);
        });
      }
      return true;
    } else {
      console.log(`  ❌ Get workspaces failed: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function testGetWorkspaceDetails() {
  console.log('\n🧪 Testing Get Workspace Details...');
  console.log(`  Slug: ${testWorkspace.slug}`);

  if (!authToken) {
    console.log('  ⚠️  No auth token available');
    return false;
  }

  try {
    const response = await makeRequest(`/api/workspaces/${testWorkspace.slug}`, 'GET', null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
      console.log('  ✅ Workspace details retrieved successfully');
      console.log('\n  📋 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));

      console.log('\n  📊 Summary:');
      console.log(`  ID: ${response.data.id}`);
      console.log(`  Name: ${response.data.name}`);
      console.log(`  Description: ${response.data.description || 'None'}`);
      console.log(`  Owner: ${response.data.owner?.firstName} ${response.data.owner?.lastName} (${response.data.owner?.email})`);
      console.log(`  Current User Role: ${response.data.currentUserMember?.role}`);
      console.log(`  Current User Permissions: ${response.data.currentUserMember?.permissions?.join(', ') || 'None'}`);
      console.log(`  Created: ${response.data.createdAt}`);
      return true;
    } else if (response.status === 404) {
      console.log(`  ℹ️  Workspace not found (expected for newly created workspace)`);
      console.log('\n  📋 Response:');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    } else {
      console.log(`  ❌ Get workspace details failed: ${response.status}`);
      console.log('\n  📋 Error Response:');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests with Verification Token');
  console.log(`📍 Server: ${API_BASE}`);
  console.log(`📧 Test Email: ${testUser.email}`);
  console.log('═'.repeat(50));

  const results = {
    emailVerification: false,
    login: false,
    tokenVerify: false,
    createWorkspace: false,
    getWorkspaces: false,
    getWorkspaceDetails: false
  };

  // Step 1: Try to verify email using the token
  results.emailVerification = await testEmailVerification();

  // Step 2: Login regardless (since email might already be verified)
  // Always try login to ensure we have a valid token
  results.login = await testLogin();

  // Continue with tests if we have authentication
  if (authToken) {
    // Step 3: Verify the token
    results.tokenVerify = await testVerifyToken();

    // Step 4: Test workspace operations
    results.createWorkspace = await testCreateWorkspace();
    results.getWorkspaces = await testGetWorkspaces();
    results.getWorkspaceDetails = await testGetWorkspaceDetails();
  } else {
    console.log('\n❌ No authentication token available - cannot continue with workspace tests');
  }

  // Print summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Test Summary:');
  console.log('─'.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${test}: ${status}`);
    if (result) passed++; else failed++;
  }

  console.log('─'.repeat(50));
  console.log(`  Total: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed.`);
  }
}

// Run the tests
runTests().catch(console.error);