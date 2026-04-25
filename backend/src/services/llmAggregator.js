const { getOpenAIResponse } = require("./openaiService");
const { getGeminiResponse } = require("./geminiService");
const { getClaudeResponse } = require("./claudeService");

async function getAllLLMResponses(prompt) {
    try {
        const responses = await Promise.all([
            getOpenAIResponse(prompt),
            getGeminiResponse(prompt),
            getClaudeResponse(prompt)
        ]);

        return {
            openai: responses[0],
            gemini: responses[1],
            claude: responses[2]
        };

    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { getAllLLMResponses };
