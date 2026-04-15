const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");
const { apiRequest } = require("./helpers");

const ts = Date.now();
const TEST_USER = { username: `testuser${ts}`, email: `testuser${ts}@test.com`, password: "Password123!" };

async function registerAndLogin() {
  await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(TEST_USER) });
  await apiRequest("/api/auth/login",    { method: "POST", body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }) });
}

Given("the user is on the landing page", function () {});

When("the user selects guest access", async function () {
  const res = await apiRequest("/api/auth/guest", { method: "POST" });
  this.response = await res.json(); this.status = res.status;
});

Then("the user should be redirected to the guest chat page", function () {
  assert.strictEqual(this.status, 200);
  assert.strictEqual(this.response.success, true);
});

Given("the user is on the login page", async function () {
  await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(TEST_USER) });
});

When("the user enters a valid email and password", async function () {
  const res = await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }) });
  this.response = await res.json(); this.status = res.status;
});

Then("the user should be redirected to the authenticated chat page", function () {
  assert.strictEqual(this.status, 200);
  assert.ok(this.response.user);
});

Given("the user is on the registration page", function () {
  const s = Date.now();
  this.newUser = { username: `newuser${s}`, email: `newuser${s}@test.com`, password: "Password123!" };
});

When("the user enters a unique username, valid email, and valid password", async function () {
  const res = await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(this.newUser) });
  this.response = await res.json(); this.status = res.status;
});

Then("the account should be created successfully", function () {
  assert.strictEqual(this.status, 201);
  assert.ok(this.response.user);
});

Given("the user is logged in", async function () { await registerAndLogin(); });

When("the user logs out", async function () {
  const res = await apiRequest("/api/auth/logout", { method: "POST" });
  this.response = await res.json(); this.status = res.status;
});

Then("the session should be destroyed successfully", function () {
  assert.strictEqual(this.status, 200);
  assert.strictEqual(this.response.success, true);
});

Given("the user is on the reset password page", async function () {
  await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(TEST_USER) });
});

When("the user submits a registered email address", async function () {
  const res = await apiRequest("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: TEST_USER.email }) });
  this.response = await res.json(); this.status = res.status;
});

Then("a password reset token should be generated", function () {
  assert.strictEqual(this.status, 200);
  assert.ok(this.response.token);
});

Given("the user has requested a password reset", async function () {
  await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(TEST_USER) });
  const res  = await apiRequest("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: TEST_USER.email }) });
  const data = await res.json();
  this.resetToken = data.token;
});

When("the user enters a valid reset token and a new password", async function () {
  const res = await apiRequest("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token: this.resetToken, newPassword: "NewPassword456!" }) });
  this.response = await res.json(); this.status = res.status;
});

Then("the password should be updated successfully", function () {
  assert.strictEqual(this.status, 200);
  assert.strictEqual(this.response.success, true);
});
