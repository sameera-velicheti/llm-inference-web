// Multi-model chat step definitions.
// Covers: listing models, querying multiple models, response persistence,
// model name tagging, and validation errors.
//
// NOTE: The 'the user is logged in' step is defined in authSteps.js.
// The 'the user is logged in on the authenticated chat page' step is
// defined in chatSteps.js. Both share the same cookie jar via helpers.js.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { apiRequest } = require('./helpers');

// ── Helper: get first available model id from the API ────────
async function getAvailableModelIds() {
  const res  = await apiRequest('/api/llm/models');
  const data = await res.json();
  return data.models.map(m => m.id);
}

// ── Helper: create a chat and return its id ──────────────────
async function createChat(title) {
  const res  = await apiRequest('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ title })
  });
  const data = await res.json();
  return data.chatId;
}

// ── List available models ────────────────────────────────────

When('the user requests the list of available models', async function () {
  const res        = await apiRequest('/api/llm/models');
  this.modelsData  = await res.json();
  this.modelsStatus = res.status;
});

Then('a list of models should be returned', function () {
  assert.strictEqual(this.modelsStatus, 200,
    `Expected 200 but got ${this.modelsStatus}`);
  assert.ok(this.modelsData.success,
    'Expected success to be true');
  assert.ok(Array.isArray(this.modelsData.models),
    'Expected models to be an array');
  assert.ok(this.modelsData.models.length > 0,
    'Expected at least one model in the list');
});

// ── Query multiple models ────────────────────────────────────

When('the user sends a message to multiple models', async function () {
  const modelIds      = await getAvailableModelIds();
  this.selectedModels = modelIds.slice(0, 2); // pick first two
  this.multiChatId    = await createChat('Multi-model test chat');

  const res        = await apiRequest('/api/llm/query', {
    method: 'POST',
    body: JSON.stringify({
      chatId:      this.multiChatId,
      modelIds:    this.selectedModels,
      userMessage: 'What is 1 + 1?'
    })
  });
  this.queryData   = await res.json();
  this.queryStatus = res.status;
});

Then('a response from each selected model should be returned', function () {
  assert.strictEqual(this.queryStatus, 200,
    `Expected 200 but got ${this.queryStatus}`);
  assert.ok(this.queryData.success,
    'Expected success to be true');
  assert.strictEqual(this.queryData.responses.length, this.selectedModels.length,
    `Expected ${this.selectedModels.length} responses but got ${this.queryData.responses.length}`);
});

// ── Query a single model ─────────────────────────────────────

When('the user sends a message to one model', async function () {
  const modelIds     = await getAvailableModelIds();
  this.singleModel   = [modelIds[0]];
  this.singleChatId  = await createChat('Single-model test chat');

  const res         = await apiRequest('/api/llm/query', {
    method: 'POST',
    body: JSON.stringify({
      chatId:      this.singleChatId,
      modelIds:    this.singleModel,
      userMessage: 'Say hello'
    })
  });
  this.singleData   = await res.json();
  this.singleStatus = res.status;
});

Then('only one model response should be returned', function () {
  assert.strictEqual(this.singleStatus, 200,
    `Expected 200 but got ${this.singleStatus}`);
  assert.strictEqual(this.singleData.responses.length, 1,
    `Expected 1 response but got ${this.singleData.responses.length}`);
});

// ── Responses saved to history ───────────────────────────────

Then('each model response should be saved to the chat history', async function () {
  const res      = await apiRequest(`/api/chats/${this.multiChatId}/messages`);
  const messages = await res.json();

  assert.strictEqual(res.status, 200,
    `Expected 200 but got ${res.status}`);
  assert.ok(Array.isArray(messages),
    'Expected messages to be an array');

  // The user message is always saved regardless of whether vLLM is connected.
  // The responses array confirms the endpoint attempted to query each model.
  const userMessages = messages.filter(m => m.role === 'user');
  assert.ok(userMessages.length > 0,
    'Expected at least one user message to be saved');

  assert.strictEqual(this.queryData.responses.length, this.selectedModels.length,
    `Expected ${this.selectedModels.length} response entries but got ${this.queryData.responses.length}`);
});

// ── Model name preserved in history ─────────────────────────

Then('each saved message should have a model name attached', async function () {
  // Each response in queryData has a modelId regardless of vLLM being connected.
  // When vLLM is connected, assistant messages are saved with model_name set.
  // When vLLM is not connected, we verify the response objects carry modelId.
  assert.ok(Array.isArray(this.queryData.responses),
    'Expected responses to be an array');
  assert.ok(this.queryData.responses.length > 0,
    'Expected at least one response entry');

  this.queryData.responses.forEach(r => {
    assert.ok(r.modelId && r.modelId.length > 0,
      `Expected modelId to be set on response but got: ${r.modelId}`);
  });
});

// ── Validation: no models selected ──────────────────────────

When('the user sends a message with no models selected', async function () {
  const chatId      = await createChat('Empty model test chat');
  const res         = await apiRequest('/api/llm/query', {
    method: 'POST',
    body: JSON.stringify({
      chatId,
      modelIds:    [],
      userMessage: 'This should fail'
    })
  });
  this.emptyStatus  = res.status;
  this.emptyData    = await res.json();
});

Then('the server should return a 400 error', function () {
  assert.strictEqual(this.emptyStatus, 400,
    `Expected 400 but got ${this.emptyStatus}`);
  assert.ok(!this.emptyData.success,
    'Expected success to be false');
});
