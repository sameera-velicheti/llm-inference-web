const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const MODEL_CATALOG = [
  {
    id: "ollama-llama3",
    label: "Llama 3 (local)",
    provider: "ollama",
    modelName: process.env.OLLAMA_LLAMA_MODEL || "llama3",
    type: "local"
  },
  {
    id: "ollama-mistral",
    label: "Mistral (local)",
    provider: "ollama",
    modelName: process.env.OLLAMA_MISTRAL_MODEL || "mistral",
    type: "local"
  },
  {
    id: "gpt",
    label: "GPT (public API)",
    provider: "openai",
    modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
    type: "public"
  },
  {
    id: "gemini",
    label: "Gemini (public API)",
    provider: "gemini",
    modelName: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    type: "public"
  },
  {
    id: "claude",
    label: "Claude (public API)",
    provider: "anthropic",
    modelName: process.env.CLAUDE_MODEL || "claude-3-haiku-20240307",
    type: "public"
  }
];

function getAvailableModels() {
  return MODEL_CATALOG.map(({ id, label, provider, type }) => ({
    id,
    label,
    provider,
    type
  }));
}

function findModel(modelId) {
  return MODEL_CATALOG.find((model) => model.id === modelId) || MODEL_CATALOG[0];
}

function getSystemPrompt(mode = "general") {
  if (mode === "math") {
    return "You are a math-focused assistant. Show clear reasoning and solve mathematical questions carefully.";
  }

  if (mode === "weather") {
    return "You are a weather-focused assistant. If real weather data is unavailable, explain what information would be needed and answer carefully.";
  }

  return "You are a helpful assistant for an LLM web interface.";
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((message) => message && message.role && message.message)
    .slice(-10)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.message
    }));
}

function buildMessages(prompt, history = [], mode = "general") {
  return [
    { role: "system", content: getSystemPrompt(mode) },
    ...normalizeHistory(history),
    { role: "user", content: prompt }
  ];
}

function buildDemoResponse(prompt, model, mode) {
  const modeText = mode === "general" ? "general" : `${mode}-focused`;
  return `${model.label} (${modeText} mode): This is a demo response for "${prompt}". The selected backend model and mode were passed through the API successfully.`;
}

async function callOllama(prompt, model, mode, history) {
  const messages = buildMessages(prompt, history, mode);

  const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model.modelName,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content || buildDemoResponse(prompt, model, mode);
}

async function callOpenAI(prompt, model, mode, history) {
  if (!process.env.OPENAI_API_KEY) {
    return buildDemoResponse(prompt, model, mode);
  }

  return buildDemoResponse(prompt, model, mode);
}

async function callGemini(prompt, model, mode, history) {
  if (!process.env.GEMINI_API_KEY) {
    return buildDemoResponse(prompt, model, mode);
  }

  return buildDemoResponse(prompt, model, mode);
}

async function callClaude(prompt, model, mode, history) {
  if (!process.env.CLAUDE_API_KEY) {
    return buildDemoResponse(prompt, model, mode);
  }

  return buildDemoResponse(prompt, model, mode);
}

async function generateResponse({ prompt, modelId = "ollama-llama3", mode = "general", history = [] }) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required");
  }

  const model = findModel(modelId);

  try {
    let text;

    if (model.provider === "ollama") {
      text = await callOllama(prompt, model, mode, history);
    } else if (model.provider === "openai") {
      text = await callOpenAI(prompt, model, mode, history);
    } else if (model.provider === "gemini") {
      text = await callGemini(prompt, model, mode, history);
    } else if (model.provider === "anthropic") {
      text = await callClaude(prompt, model, mode, history);
    } else {
      text = buildDemoResponse(prompt, model, mode);
    }

    return {
      model: model.label,
      modelId: model.id,
      mode,
      response: text,
      fallback: false
    };
  } catch (err) {
    return {
      model: model.label,
      modelId: model.id,
      mode,
      response: buildDemoResponse(prompt, model, mode),
      fallback: true,
      error: err.message
    };
  }
}

module.exports = {
  getAvailableModels,
  findModel,
  buildMessages,
  generateResponse,
  buildDemoResponse
};