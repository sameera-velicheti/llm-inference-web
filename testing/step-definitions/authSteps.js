// Auth step definitions.

// Test user credentials are generated once per test run using
// a timestamp so they are unique and won't conflict with real accounts.
// Registration may fail on repeat runs (user already exists) — this is
// intentional. The login step still succeeds because the user exists.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { apiRequest } = require('./helpers');

// ── Test user (unique per test run) ─────────────────────────
const ts = Date.now();
const TEST_USER = {
  username: `testuser${ts}`,
  email:    `testuser${ts}@test.com`,
  password: 'Password123!'
};

// Helper: register (ignore failure) then login
async function registerAndLogin() {
  await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
  await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email:    TEST_USER.email,
      password: TEST_USER.password
    })
  });
}

// ── Guest Access ─────────────────────────────────────────────

Given('the user is on the landing page', function () {
  // No server-side setup needed for this step
});

When('the user selects guest access', async function () {
  const res = await apiRequest('/api/auth/guest', { method: 'POST' });
  this.response = await res.json();
  this.status   = res.status;
});

Then('the user should be redirected to the guest chat page', function () {
  assert.strictEqual(this.status, 200,
    `Expected 200 but got ${this.status}`);
  assert.strictEqual(this.response.success, true,
    `Expected success:true but got: ${JSON.stringify(this.response)}`);
});

// ── Login ────────────────────────────────────────────────────

Given('the user is on the login page', async function () {
  // Ensure test user exists before login scenario runs
  await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
});

When('the user enters a valid email and password', async function () {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email:    TEST_USER.email,
      password: TEST_USER.password
    })
  });
  this.response = await res.json();
  this.status   = res.status;
});

Then('the user should be redirected to the authenticated chat page', function () {
  assert.strictEqual(this.status, 200,
    `Expected 200 but got ${this.status}`);
  assert.strictEqual(this.response.success, true,
    `Expected success:true but got: ${JSON.stringify(this.response)}`);
  assert.ok(this.response.user,
    'Expected user object in response');
  assert.ok(this.response.user.email,
    'Expected user to have an email');
});

// ── Registration ─────────────────────────────────────────────

Given('the user is on the registration page', function () {
  // Generate unique credentials for this specific scenario
  const scenarioTs = Date.now();
  this.newUser = {
    username: `newuser${scenarioTs}`,
    email:    `newuser${scenarioTs}@test.com`,
    password: 'Password123!'
  };
});

When('the user enters a unique username, valid email, and valid password', async function () {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(this.newUser)
  });
  this.response = await res.json();
  this.status   = res.status;
});

Then('the account should be created successfully', function () {
  assert.strictEqual(this.status, 201,
    `Expected 201 but got ${this.status}`);
  assert.strictEqual(this.response.success, true,
    `Expected success:true but got: ${JSON.stringify(this.response)}`);
  assert.ok(this.response.user,
    'Expected user object in response');
  assert.ok(this.response.user.username,
    'Expected user to have a username');
});

// ── Logout ───────────────────────────────────────────────────

Given('the user is logged in', async function () {
  await registerAndLogin();
});

When('the user logs out', async function () {
  const res = await apiRequest('/api/auth/logout', { method: 'POST' });
  this.response = await res.json();
  this.status   = res.status;
});

Then('the session should be destroyed successfully', function () {
  assert.strictEqual(this.status, 200,
    `Expected 200 but got ${this.status}`);
  assert.strictEqual(this.response.success, true,
    `Expected success:true but got: ${JSON.stringify(this.response)}`);
});

// ── Forgot Password ──────────────────────────────────────────

Given('the user is on the reset password page', async function () {
  // Ensure test user exists
  await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
});

When('the user submits a registered email address', async function () {
  const res = await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_USER.email })
  });
  this.response = await res.json();
  this.status   = res.status;
});

Then('a password reset token should be generated', function () {
  assert.strictEqual(this.status, 200,
    `Expected 200 but got ${this.status}`);
  assert.strictEqual(this.response.success, true,
    `Expected success:true but got: ${JSON.stringify(this.response)}`);
  assert.ok(this.response.token,
    'Expected a reset token in the response');
  assert.strictEqual(typeof this.response.token, 'string',
    'Expected token to be a string');
});

// ── Reset Password ───────────────────────────────────────────

Given('the user has requested a password reset', async function () {
  // Register, then request a reset token and store it
  await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
  const res  = await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_USER.email })
  });
  const data = await res.json();
  this.resetToken = data.token;
});

When('the user enters a valid reset token and a new password', async function () {
  const res = await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token:       this.resetToken,
      newPassword: 'NewPassword456!'
    })
  });
  this.response = await res.json();
  this.status   = res.status;
});

Then('the password should be updated successfully', function () {
  assert.strictEqual(this.status, 200,
    `Expected 200 but got ${this.status}`);
  assert.strictEqual(this.response.success, true,
    `Expected success:true but got: ${JSON.stringify(this.response)}`);
});
