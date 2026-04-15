// Unit tests for llmService.js
// All fetch calls are intercepted with a spy so no real Ollama server is needed.

const { MODELS, streamFromModel } = require("../src/services/llmService");

describe("llmService", () => {

  describe("MODELS constant", () => {
    it("should export exactly 3 models", () => {
      expect(MODELS.length).toBe(3);
    });
    it("should include llama3.2", () => {
      expect(MODELS).toContain("llama3.2");
    });
    it("should include mistral", () => {
      expect(MODELS).toContain("mistral");
    });
    it("should include gemma3", () => {
      expect(MODELS).toContain("gemma3");
    });
  });

  describe("streamFromModel()", () => {

    function makeStreamResponse(lines) {
      const encoder = new TextEncoder();
      let index = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (index < lines.length) {
            controller.enqueue(encoder.encode(lines[index++] + "\n"));
          } else {
            controller.close();
          }
        }
      });
      return { ok: true, body: stream };
    }

    it("should call onToken for each streamed token", async () => {
      const tokens = [];
      const lines = [
        JSON.stringify({ message: { content: "Hello" }, done: false }),
        JSON.stringify({ message: { content: " world" }, done: false }),
        JSON.stringify({ message: { content: "" }, done: true }),
      ];
      spyOn(globalThis, "fetch").and.resolveTo(makeStreamResponse(lines));

      await new Promise((resolve) => {
        streamFromModel("llama3.2", [], (tok) => tokens.push(tok), resolve, resolve);
      });

      expect(tokens).toEqual(["Hello", " world"]);
    });

    it("should call onDone with the full concatenated text", async () => {
      let result = null;
      const lines = [
        JSON.stringify({ message: { content: "Foo" }, done: false }),
        JSON.stringify({ message: { content: "Bar" }, done: true }),
      ];
      spyOn(globalThis, "fetch").and.resolveTo(makeStreamResponse(lines));

      await new Promise((resolve) => {
        streamFromModel("mistral", [], () => {}, (text) => { result = text; resolve(); }, resolve);
      });

      expect(result).toBe("FooBar");
    });

    it("should call onError if fetch response is not ok", async () => {
      let err = null;
      spyOn(globalThis, "fetch").and.resolveTo({ ok: false, status: 500, text: async () => "Internal error" });

      await new Promise((resolve) => {
        streamFromModel("gemma3", [], () => {}, () => resolve(), (e) => { err = e; resolve(); });
      });

      expect(err).not.toBeNull();
      expect(err.message).toContain("gemma3");
    });

    it("should call onError if fetch itself throws", async () => {
      let err = null;
      spyOn(globalThis, "fetch").and.rejectWith(new Error("Network failure"));

      await new Promise((resolve) => {
        streamFromModel("llama3.2", [], () => {}, () => resolve(), (e) => { err = e; resolve(); });
      });

      expect(err.message).toBe("Network failure");
    });

    it("should pass the correct model name in the request body", async () => {
      spyOn(globalThis, "fetch").and.callFake(async (url, opts) => {
        const body = JSON.parse(opts.body);
        expect(body.model).toBe("mistral");
        expect(body.stream).toBe(true);
        return { ok: false, status: 400, text: async () => "" };
      });

      await new Promise((resolve) => {
        streamFromModel("mistral", [], () => {}, resolve, resolve);
      });
    });

    it("should map message history role correctly", async () => {
      spyOn(globalThis, "fetch").and.callFake(async (url, opts) => {
        const body = JSON.parse(opts.body);
        expect(body.messages[0].role).toBe("user");
        expect(body.messages[1].role).toBe("assistant");
        return { ok: false, status: 400, text: async () => "" };
      });

      const history = [
        { role: "user",      message: "Hello" },
        { role: "assistant", message: "Hi",   model_name: "llama3.2" },
      ];

      await new Promise((resolve) => {
        streamFromModel("llama3.2", history, () => {}, resolve, resolve);
      });
    });

  });

});
