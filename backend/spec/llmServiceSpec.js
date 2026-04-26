const llmService = require("../src/services/llmService");

describe("LLM Service", () => {
  it("should return available models", () => {
    const models = llmService.getAvailableModels();
    expect(models.length).toBeGreaterThan(0);
  });

  it("should generate a response", async () => {
    const result = await llmService.generateResponse({
      prompt: "test",
      modelId: "gpt",
      mode: "general",
      history: []
    });

    expect(result.response).toBeDefined();
    expect(result.modelId).toBe("gpt");
  });
});