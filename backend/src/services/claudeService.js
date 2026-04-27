const axios = require("axios");

async function getClaudeResponse(prompt) {
    // If no Claude key exists → return placeholder
    if (!process.env.CLAUDE_API_KEY) {
        return "Claude API is currently unavailable (placeholder response).";
    }

    try {
        const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
                model: "claude-3-haiku-20240307",
                max_tokens: 300,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    "x-api-key": process.env.CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.content[0].text;

    } catch (error) {
        console.error("Claude API error:", error.message);

        return "Claude API failed to respond (fallback placeholder).";
    }
}

module.exports = { getClaudeResponse };
