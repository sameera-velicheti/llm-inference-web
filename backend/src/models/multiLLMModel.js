function generateResponse(model, prompt) {
    return `${model} response: Here is a helpful answer to "${prompt}".`;
  }
  
  function getMultiResponses(prompt) {
    return [
      {
        model: "ChatGPT",
        response: generateResponse("ChatGPT", prompt)
      },
      {
        model: "Claude",
        response: generateResponse("Claude", prompt)
      },
      {
        model: "Gemini",
        response: generateResponse("Gemini", prompt)
      }
    ];
  }
  
  function regenerateResponse(model, prompt) {
    return {
      model,
      response: `${model} regenerated response: Here is another version of the answer to "${prompt}".`
    };
  }
  
  function continueWithModel(model, prompt) {
    return {
      model,
      response: `${model} continued response: Continuing with this selected LLM, here is a follow-up answer to "${prompt}".`
    };
  }
  
  module.exports = {
    getMultiResponses,
    regenerateResponse,
    continueWithModel
  };