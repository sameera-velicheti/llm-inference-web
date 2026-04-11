// Chat step definitions.
// Covers: view chat history, reopen a chat, search chats, auto-save.
//
// NOTE: The 'the user is logged in' step is defined in authSteps.js.
// Since both files share the same cookie jar via helpers.js, the session
// established in that step carries over to all API calls here.

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { apiRequest } = require('./helpers');

// ── Test user for chat scenarios ─────────────────────────────
const ts = Date.now();
const CHAT_USER = {
  username: `chatuser${ts}`,
  email:    `chatuser${ts}@test.com`,
  password: 'Password123!'
};

// Helper: register (ignore failure) then login as chat test user
async function loginChatUser() {
  await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(CHAT_USER)
  });
  await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email:    CHAT_USER.email,
      password: CHAT_USER.password
    })
  });
}

// ── View Previous Chats ──────────────────────────────────────

When('the user opens the authenticated chat page', async function () {
  const res = await apiRequest('/api/chats');
  this.chatsResponse = await res.json();
  this.chatsStatus   = res.status;
});

Then("the user's previous chats should be displayed", function () {
  assert.strictEqual(this.chatsStatus, 200,
    `Expected 200 but got ${this.chatsStatus}`);
  assert.ok(Array.isArray(this.chatsResponse),
    'Expected response to be an array of chats');
});

// ── Reopen Previous Chat ─────────────────────────────────────

Given('the user is logged in on the authenticated chat page', async function () {
  await loginChatUser();

  // Create a test chat
  const chatRes  = await apiRequest('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ title: 'Reopen Test Chat' })
  });
  const chatData = await chatRes.json();
  this.testChatId = chatData.chatId;

  // Post a message to that chat
  await apiRequest(`/api/chats/${this.testChatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role: 'user', message: 'Hello from reopen test' })
  });
});

When('the user selects a previous chat', async function () {
  const res = await apiRequest(`/api/chats/${this.testChatId}/messages`);
  this.messagesResponse = await res.json();
  this.messagesStatus   = res.status;
});

Then('the messages from that chat should be displayed', function () {
  assert.strictEqual(this.messagesStatus, 200,
    `Expected 200 but got ${this.messagesStatus}`);
  assert.ok(Array.isArray(this.messagesResponse),
    'Expected response to be an array of messages');
  assert.ok(this.messagesResponse.length > 0,
    'Expected at least one message in the chat');
});

// ── Search Chats ─────────────────────────────────────────────

When('the user enters a keyword into the chat search bar', async function () {
  const res = await apiRequest('/api/chats/search?q=Reopen');
  this.searchResponse = await res.json();
  this.searchStatus   = res.status;
});

Then('matching chats should be displayed', function () {
  assert.strictEqual(this.searchStatus, 200,
    `Expected 200 but got ${this.searchStatus}`);
  assert.ok(Array.isArray(this.searchResponse),
    'Expected search response to be an array');
  assert.ok(this.searchResponse.length > 0,
    'Expected at least one matching chat for the search query');
});

// ── Auto-save ────────────────────────────────────────────────

When('the user sends a message in a chat', async function () {
  // Create a new chat
  const chatRes  = await apiRequest('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ title: 'Auto-save Test Chat' })
  });
  const chatData = await chatRes.json();
  this.autoSaveChatId = chatData.chatId;

  // Send a message
  await apiRequest(`/api/chats/${this.autoSaveChatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      role:    'user',
      message: 'This message should be automatically saved'
    })
  });
});

Then('the message should be automatically saved to chat history', async function () {
  const res      = await apiRequest(`/api/chats/${this.autoSaveChatId}/messages`);
  const messages = await res.json();

  assert.strictEqual(res.status, 200,
    `Expected 200 but got ${res.status}`);
  assert.ok(Array.isArray(messages),
    'Expected messages to be an array');
  assert.ok(messages.length > 0,
    'Expected at least one saved message');
  assert.strictEqual(
    messages[0].message,
    'This message should be automatically saved',
    'Expected saved message content to match what was sent'
  );
});