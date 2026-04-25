const axios = require("axios");

async function getGeminiResponse(prompt) {
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ]
        }
    );

    return response.data.candidates[0].content.parts[0].text;
}

module.exports = { getGeminiResponse };
