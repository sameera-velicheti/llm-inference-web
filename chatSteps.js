const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");
const { apiRequest } = require("./helpers");

const ts = Date.now();
const CHAT_USER = { username: `chatuser${ts}`, email: `chatuser${ts}@test.com`, password: "Password123!" };

async function loginChatUser() {
  await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(CHAT_USER) });
  await apiRequest("/api/auth/login",    { method: "POST", body: JSON.stringify({ email: CHAT_USER.email, password: CHAT_USER.password }) });
}

When("the user opens the authenticated chat page", async function () {
  const res = await apiRequest("/api/chats");
  this.chatsResponse = await res.json(); this.chatsStatus = res.status;
});

Then("the user previous chats should be displayed", function () {
  assert.strictEqual(this.chatsStatus, 200);
  assert.ok(Array.isArray(this.chatsResponse));
});

Given("the user is logged in on the authenticated chat page", async function () {
  await loginChatUser();
  const chatRes = await apiRequest("/api/chats", { method: "POST", body: JSON.stringify({ title: "Reopen Test Chat" }) });
  const data = await chatRes.json();
  this.testChatId = data.chatId;
  await apiRequest(`/api/chats/${this.testChatId}/messages`, { method: "POST", body: JSON.stringify({ role: "user", message: "Hello from reopen test" }) });
});

When("the user selects a previous chat", async function () {
  const res = await apiRequest(`/api/chats/${this.testChatId}/messages`);
  this.messagesResponse = await res.json(); this.messagesStatus = res.status;
});

Then("the messages from that chat should be displayed", function () {
  assert.strictEqual(this.messagesStatus, 200);
  assert.ok(this.messagesResponse.length > 0);
});

When("the user enters a keyword into the chat search bar", async function () {
  const res = await apiRequest("/api/chats/search?q=Reopen");
  this.searchResponse = await res.json(); this.searchStatus = res.status;
});

Then("matching chats should be displayed", function () {
  assert.strictEqual(this.searchStatus, 200);
  assert.ok(this.searchResponse.length > 0);
});

When("the user sends a message in a chat", async function () {
  const chatRes = await apiRequest("/api/chats", { method: "POST", body: JSON.stringify({ title: "Auto-save Test" }) });
  const data = await chatRes.json();
  this.autoSaveChatId = data.chatId;
  await apiRequest(`/api/chats/${this.autoSaveChatId}/messages`, { method: "POST", body: JSON.stringify({ role: "user", message: "This message should be automatically saved" }) });
});

Then("the message should be automatically saved to chat history", async function () {
  const res = await apiRequest(`/api/chats/${this.autoSaveChatId}/messages`);
  const messages = await res.json();
  assert.ok(messages.length > 0);
  assert.strictEqual(messages[0].message, "This message should be automatically saved");
});
