const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");
const { apiRequest } = require("./helpers");

const ts = Date.now();
const MULTI_USER = { username: `multiuser${ts}`, email: `multiuser${ts}@test.com`, password: "Password123!" };

async function loginMultiUser() {
  await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(MULTI_USER) });
  await apiRequest("/api/auth/login",    { method: "POST", body: JSON.stringify({ email: MULTI_USER.email, password: MULTI_USER.password }) });
}

// ── Multi-model streaming ─────────────────────────────────────

When("the user creates a new chat and streams a message", async function () {
  const chatRes  = await apiRequest("/api/chats", { method: "POST", body: JSON.stringify({ title: "Multi test" }) });
  const chatData = await chatRes.json();
  this.chatId = chatData.chatId;

  // Open SSE stream (we read one chunk to confirm it starts)
  const res = await apiRequest(`/api/chats/${this.chatId}/stream?message=Hello`);
  this.streamStatus = res.status;

  // Read just enough to verify it starts
  const reader = res.body.getReader();
  let received = "";
  for (let i = 0; i < 5; i++) {
    const { done, value } = await reader.read();
    if (done) break;
    received += new TextDecoder().decode(value);
    if (received.length > 0) break;
  }
  reader.cancel();
  this.receivedData = received;
});

Then("responses should be received from llama3.2, mistral, and gemma3", function () {
  assert.strictEqual(this.streamStatus, 200, `Expected 200 got ${this.streamStatus}`);
  // SSE starts with "data:" lines
  assert.ok(this.receivedData.length > 0, "Expected some SSE data");
});

Given("a guest session is active", async function () {
  await apiRequest("/api/auth/guest", { method: "POST" });
});

When("the guest streams a message to the multi-model endpoint", async function () {
  const res = await apiRequest("/api/chats/guest/stream?message=Hello");
  this.guestStreamStatus = res.status;
  const reader = res.body.getReader();
  const { value } = await reader.read();
  this.guestData = value ? new TextDecoder().decode(value) : "";
  reader.cancel();
});

Then("the SSE stream should return tokens without error", function () {
  assert.strictEqual(this.guestStreamStatus, 200);
  assert.ok(this.guestData.length > 0, "Expected SSE data for guest");
});

// ── Pin / unpin ───────────────────────────────────────────────

When("the user creates a chat and pins it to mistral", async function () {
  const chatRes = await apiRequest("/api/chats", { method: "POST", body: JSON.stringify({ title: "Pin test" }) });
  const data = await chatRes.json();
  this.pinChatId = data.chatId;
  const pinRes = await apiRequest(`/api/chats/${this.pinChatId}/pin`, { method: "POST", body: JSON.stringify({ model: "mistral" }) });
  this.pinResponse = await pinRes.json();
  this.pinStatus   = pinRes.status;
});

Then("the chat pinned_model should be set to mistral", function () {
  assert.strictEqual(this.pinStatus, 200);
  assert.strictEqual(this.pinResponse.model, "mistral");
});

When("the user creates a chat, pins it to gemma3, then unpins it", async function () {
  const chatRes = await apiRequest("/api/chats", { method: "POST", body: JSON.stringify({ title: "Unpin test" }) });
  const data = await chatRes.json();
  this.unpinChatId = data.chatId;
  await apiRequest(`/api/chats/${this.unpinChatId}/pin`, { method: "POST", body: JSON.stringify({ model: "gemma3" }) });
  const unpinRes = await apiRequest(`/api/chats/${this.unpinChatId}/pin`, { method: "POST", body: JSON.stringify({ model: null }) });
  this.unpinResponse = await unpinRes.json();
});

Then("the chat pinned_model should be null", function () {
  assert.strictEqual(this.unpinResponse.model, null);
});
