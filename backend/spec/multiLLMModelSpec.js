const multiLLMModel = require("../src/models/multiLLMModel");

describe("multiLLMModel", () => {
  it("should return three LLM responses", () => {
    const responses = multiLLMModel.getMultiResponses("Explain recursion");

    expect(responses.length).toBe(3);
    expect(responses[0].model).toBe("ChatGPT");
    expect(responses[1].model).toBe("Claude");
    expect(responses[2].model).toBe("Gemini");
  });

  it("should include the prompt in each response", () => {
    const responses = multiLLMModel.getMultiResponses("Explain loops");

    responses.forEach(item => {
      expect(item.response).toContain("Explain loops");
    });
  });

  it("should regenerate a response for one model", () => {
    const result = multiLLMModel.regenerateResponse("ChatGPT", "Explain arrays");

    expect(result.model).toBe("ChatGPT");
    expect(result.response).toContain("regenerated");
    expect(result.response).toContain("Explain arrays");
  });

  it("should continue with a selected model", () => {
    const result = multiLLMModel.continueWithModel("Claude", "Give more detail");

    expect(result.model).toBe("Claude");
    expect(result.response).toContain("continued");
    expect(result.response).toContain("Give more detail");
  });
});