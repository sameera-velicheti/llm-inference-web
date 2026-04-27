// backend/spec/llmModelSpec.js
// Unit tests for the LLM model layer.
// All fetch calls are mocked — no real network requests are made.

const { getAvailableModels, queryModel, queryModels } = require("../src/models/llmModel");

describe("llmModel", () => {

  describe("getAvailableModels", () => {
    it("returns an array of model objects", () => {
      const models = getAvailableModels();
      expect(Array.isArray(models)).toBe(true);
    });

    it("each model has an id and a label", () => {
      const models = getAvailableModels();
      models.forEach((m) => {
        expect(typeof m.id).toBe("string");
        expect(m.id.length).toBeGreaterThan(0);
        expect(typeof m.label).toBe("string");
        expect(m.label.length).toBeGreaterThan(0);
      });
    });

    it("returns at least one model", () => {
      expect(getAvailableModels().length).toBeGreaterThan(0);
    });
  });

  describe("queryModel", () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    function mockFetch(status, body) {
      global.fetch = jasmine.createSpy("fetch").and.returnValue(
        Promise.resolve({
          ok: status >= 200 && status < 300,
          status,
          json: () => Promise.resolve(body),
          text: () => Promise.resolve(JSON.stringify(body)),
        })
      );
    }

    it("returns the assistant content string on success", async () => {
      mockFetch(200, {
        choices: [{ message: { content: "Hello from the model" } }],
      });

      const result = await queryModel("model-a-placeholder", [
        { role: "user", content: "Hi" },
      ]);
      expect(result).toBe("Hello from the model");
    });

    it("calls the vLLM completions endpoint", async () => {
      mockFetch(200, {
        choices: [{ message: { content: "ok" } }],
      });

      await queryModel("model-a-placeholder", [{ role: "user", content: "test" }]);

      const calledUrl = global.fetch.calls.mostRecent().args[0];
      expect(calledUrl).toContain("/v1/chat/completions");
    });

    it("throws when the HTTP status is not ok", async () => {
      mockFetch(500, { error: "Internal Server Error" });

      await expectAsync(
        queryModel("model-a-placeholder", [{ role: "user", content: "test" }])
      ).toBeRejectedWithError(/vLLM returned 500/);
    });

    it("throws when the response shape is unexpected", async () => {
      mockFetch(200, { choices: [] }); // no message content

      await expectAsync(
        queryModel("model-a-placeholder", [{ role: "user", content: "test" }])
      ).toBeRejectedWithError(/Unexpected vLLM response shape/);
    });

    it("throws on network failure", async () => {
      global.fetch = jasmine.createSpy("fetch").and.returnValue(
        Promise.reject(new Error("ECONNREFUSED"))
      );

      await expectAsync(
        queryModel("model-a-placeholder", [{ role: "user", content: "test" }])
      ).toBeRejectedWithError(/Network error/);
    });

    it("includes the model id in the request body", async () => {
      mockFetch(200, { choices: [{ message: { content: "ok" } }] });

      await queryModel("model-b-placeholder", [{ role: "user", content: "ping" }]);

      const body = JSON.parse(global.fetch.calls.mostRecent().args[1].body);
      expect(body.model).toBe("model-b-placeholder");
    });

    it("passes the full message history to the API", async () => {
      mockFetch(200, { choices: [{ message: { content: "ok" } }] });

      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "How are you?" },
      ];

      await queryModel("model-a-placeholder", history);
      const body = JSON.parse(global.fetch.calls.mostRecent().args[1].body);
      expect(body.messages.length).toBe(3);
    });
  });

  describe("queryModels", () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns one result object per model id", async () => {
      global.fetch = jasmine.createSpy("fetch").and.returnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: "reply" } }] }),
        })
      );

      const results = await queryModels(
        ["model-a-placeholder", "model-b-placeholder"],
        [{ role: "user", content: "hi" }]
      );

      expect(results.length).toBe(2);
    });

    it("marks successful results with text and null error", async () => {
      global.fetch = jasmine.createSpy("fetch").and.returnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: "answer" } }] }),
        })
      );

      const results = await queryModels(["model-a-placeholder"], [{ role: "user", content: "q" }]);
      expect(results[0].text).toBe("answer");
      expect(results[0].error).toBeNull();
    });

    it("captures individual model failures without rejecting the whole call", async () => {
      global.fetch = jasmine.createSpy("fetch").and.returnValue(
        Promise.resolve({
          ok: false,
          status: 503,
          text: () => Promise.resolve("Service Unavailable"),
        })
      );

      const results = await queryModels(
        ["model-a-placeholder", "model-b-placeholder"],
        [{ role: "user", content: "q" }]
      );

      expect(results.length).toBe(2);
      results.forEach((r) => {
        expect(r.text).toBeNull();
        expect(typeof r.error).toBe("string");
      });
    });

    it("returns the correct modelId for each result", async () => {
      global.fetch = jasmine.createSpy("fetch").and.returnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
        })
      );

      const ids = ["model-a-placeholder", "model-b-placeholder"];
      const results = await queryModels(ids, [{ role: "user", content: "x" }]);
      expect(results[0].modelId).toBe("model-a-placeholder");
      expect(results[1].modelId).toBe("model-b-placeholder");
    });
  });
});
