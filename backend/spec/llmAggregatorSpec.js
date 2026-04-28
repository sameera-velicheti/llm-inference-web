const openaiService = require("../src/services/openaiService");
const geminiService = require("../src/services/geminiService");
const claudeService = require("../src/services/claudeService");

const {
    getAllLLMResponses
} = require("../src/services/llmAggregator");

describe("llmAggregator", () => {

    beforeEach(() => {
        spyOn(openaiService, "getOpenAIResponse")
            .and.resolveTo("OpenAI test response");

        spyOn(geminiService, "getGeminiResponse")
            .and.resolveTo("Gemini test response");

        spyOn(claudeService, "getClaudeResponse")
            .and.resolveTo("Claude test response");
    });

    it("should return responses from all LLMs", async () => {
        const result = await getAllLLMResponses("hello");

        expect(result.openai).toBe("OpenAI test response");
        expect(result.gemini).toBe("Gemini test response");
        expect(result.claude).toBe("Claude test response");
    });

    it("should call all three services", async () => {
        await getAllLLMResponses("test prompt");

        expect(
            openaiService.getOpenAIResponse
        ).toHaveBeenCalledWith("test prompt");

        expect(
            geminiService.getGeminiResponse
        ).toHaveBeenCalledWith("test prompt");

        expect(
            claudeService.getClaudeResponse
        ).toHaveBeenCalledWith("test prompt");
    });

    it("should throw an error if one API fails", async () => {
    openaiService.getOpenAIResponse.and.rejectWith(
        new Error("API failed")
    );

    await expectAsync(
        getAllLLMResponses("hello")
    ).toBeRejected();
    });
});
