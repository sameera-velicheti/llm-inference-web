// backend/spec/llmControllerSpec.js
// Unit tests for the LLM controller layer.
// All model and chatModel dependencies are mocked via Jasmine spies.

const llmModel  = require("../src/models/llmModel");
const chatModel = require("../src/models/chatModel");
const { listModels, queryLLMs } = require("../src/controllers/llmController");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body)   { this._body = body;   return this; },
  };
  return res;
}

function makeReq(overrides = {}) {
  return {
    body: {},
    session: { user: { id: 42 } },
    ...overrides,
  };
}

// ── listModels ────────────────────────────────────────────────────────────────

describe("llmController.listModels", () => {
  beforeEach(() => {
    spyOn(llmModel, "getAvailableModels").and.returnValue([
      { id: "model-a-placeholder", label: "Model A" },
      { id: "model-b-placeholder", label: "Model B" },
    ]);
  });

  it("responds with success true and a models array", async () => {
    const res = makeRes();
    await listModels(makeReq(), res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.models)).toBe(true);
  });

  it("returns the models from getAvailableModels", async () => {
    const res = makeRes();
    await listModels(makeReq(), res);
    // spy returns 2 models — assert against the spy's return value length
    expect(res._body.models.length).toBe(2);
    expect(res._body.models[0].id).toBe("model-a-placeholder");
  });

  it("returns 500 when getAvailableModels throws", async () => {
    // getAvailableModels is synchronous — use throwError to simulate failure
    llmModel.getAvailableModels.and.throwError("unexpected failure");
    const res = makeRes();
    await listModels(makeReq(), res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });
});

// ── queryLLMs ─────────────────────────────────────────────────────────────────

describe("llmController.queryLLMs", () => {
  const VALID_BODY = {
    chatId:      1,
    modelIds:    ["model-a-placeholder"],
    userMessage: "Hello",
  };

  beforeEach(() => {
    spyOn(llmModel, "getAvailableModels").and.returnValue([
      { id: "model-a-placeholder", label: "Model A" },
      { id: "model-b-placeholder", label: "Model B" },
      { id: "model-c-placeholder", label: "Model C" },
    ]);

    spyOn(llmModel, "queryModels").and.returnValue(
      Promise.resolve([
        { modelId: "model-a-placeholder", text: "A response", error: null },
      ])
    );

    // your chatModel exports getMessages, not getChatMessages
    spyOn(chatModel, "getMessages").and.returnValue([]);
    spyOn(chatModel, "addMessage").and.returnValue({ id: 1 });
  });

  it("returns 400 when chatId is missing", async () => {
    const req = makeReq({ body: { modelIds: ["model-a-placeholder"], userMessage: "Hi" } });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it("returns 400 when userMessage is missing", async () => {
    const req = makeReq({ body: { chatId: 1, modelIds: ["model-a-placeholder"] } });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
  });

  it("returns 400 when modelIds is empty", async () => {
    const req = makeReq({ body: { chatId: 1, modelIds: [], userMessage: "Hi" } });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
  });

  it("returns 400 when modelIds is not an array", async () => {
    const req = makeReq({ body: { chatId: 1, modelIds: "model-a-placeholder", userMessage: "Hi" } });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
  });

  it("returns 400 when userMessage is blank whitespace", async () => {
    const req = makeReq({ body: { chatId: 1, modelIds: ["model-a-placeholder"], userMessage: "   " } });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
  });

  it("returns 400 when more than 5 models are requested", async () => {
    const req = makeReq({
      body: { chatId: 1, userMessage: "Hi", modelIds: ["a","b","c","d","e","f"] },
    });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toContain("at most");
  });

  it("returns 400 when an unknown model id is requested", async () => {
    const req = makeReq({ body: { chatId: 1, modelIds: ["not-a-real-model"], userMessage: "Hi" } });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toContain("Unknown model");
  });

  it("returns 200 with responses on a valid request", async () => {
    const req = makeReq({ body: VALID_BODY });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.responses)).toBe(true);
  });

  it("persists the user message via addMessage", async () => {
    const req = makeReq({ body: VALID_BODY });
    await queryLLMs(req, makeRes());
    expect(chatModel.addMessage).toHaveBeenCalledWith(1, "user", "Hello", null);
  });

  it("persists each model response via addMessage", async () => {
    const req = makeReq({ body: VALID_BODY });
    await queryLLMs(req, makeRes());
    expect(chatModel.addMessage).toHaveBeenCalledWith(
      1, "assistant", "A response", "model-a-placeholder"
    );
  });

  it("fetches existing chat history for context", async () => {
    const req = makeReq({ body: VALID_BODY });
    await queryLLMs(req, makeRes());
    expect(chatModel.getMessages).toHaveBeenCalledWith(1);
  });

  it("passes conversation history to queryModels", async () => {
    chatModel.getMessages.and.returnValue([
      { role: "user", message: "Earlier message", model_name: null },
    ]);
    const req = makeReq({ body: VALID_BODY });
    await queryLLMs(req, makeRes());
    const passedMessages = llmModel.queryModels.calls.mostRecent().args[1];
    expect(passedMessages.length).toBe(2); // history + new user message
  });

  it("returns 500 when queryModels throws unexpectedly", async () => {
    spyOn(console, "error");
    llmModel.queryModels.and.returnValue(Promise.reject(new Error("crash")));
    const req = makeReq({ body: VALID_BODY });
    const res = makeRes();
    await queryLLMs(req, res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });

  it("does not persist assistant message when model returns an error", async () => {
    llmModel.queryModels.and.returnValue(
      Promise.resolve([{ modelId: "model-a-placeholder", text: null, error: "timeout" }])
    );
    const req = makeReq({ body: VALID_BODY });
    await queryLLMs(req, makeRes());
    const assistantCalls = chatModel.addMessage.calls.all().filter(
      (c) => c.args[1] === "assistant"
    );
    expect(assistantCalls.length).toBe(0);
  });
});
