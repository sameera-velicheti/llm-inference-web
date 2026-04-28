// Load environment variables from .env at project root
require("dotenv").config({ path: require("path").join(__dirname, "../../../.env") });

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const MODEL_CATALOG = [
  {
    id: "ollama-llama3",
    label: "Llama 3.2 1B (local)",
    provider: "ollama",
    modelName: process.env.OLLAMA_LLAMA_MODEL || "llama3.2:1b",
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
    modelName: process.env.GEMINI_MODEL || "gemini-2.0-flash",
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

// ── Model helpers ─────────────────────────────────────────────────────────────

function getAvailableModels() {
  return MODEL_CATALOG.map(({ id, label, provider, type }) => ({
    id,
    label,
    provider,
    type
  }));
}

function findModel(modelId) {
  return MODEL_CATALOG.find((m) => m.id === modelId) || MODEL_CATALOG[0];
}

// ── System prompts ────────────────────────────────────────────────────────────

function getSystemPrompt(mode = "general") {
  if (mode === "math") {
    return (
      "You are a math-focused assistant. Always show your reasoning step by step. " +
      "Use clear notation, break down complex problems into smaller parts, and " +
      "verify your answers where possible. If a question is not mathematical, " +
      "answer helpfully but note that math mode is active."
    );
  }

  if (mode === "weather") {
    return (
      "You are a weather assistant. You will be given real-time weather data " +
      "fetched from OpenWeatherMap at the top of the user message. " +
      "Summarise the conditions clearly and helpfully — include temperature, " +
      "feels-like, humidity, wind, and a short description. " +
      "If no weather data is present, tell the user you could not find weather " +
      "for their location and ask them to be more specific."
    );
  }

  return "You are a helpful assistant for an LLM web interface.";
}

// ── Weather helper (OpenWeatherMap) ──────────────────────────────────────────

async function fetchWeather(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your-openweathermap-api-key-here") {
    return null; // key not configured — let LLM handle gracefully
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) return null; // location not found or API error

  const d = await res.json();

  return (
    `[Live weather for ${d.name}, ${d.sys.country}]\n` +
    `Condition: ${d.weather[0].description}\n` +
    `Temperature: ${d.main.temp}°C (feels like ${d.main.feels_like}°C)\n` +
    `Humidity: ${d.main.humidity}%\n` +
    `Wind: ${d.wind.speed} m/s\n` +
    `Visibility: ${d.visibility ? d.visibility / 1000 + " km" : "N/A"}`
  );
}

// Very simple location extractor — looks for "in <place>" or "for <place>"
function extractLocation(prompt) {
  const match = prompt.match(
    /(?:weather\s+(?:in|for|at)|in|for|at)\s+([A-Za-z\s,]+?)(?:\?|$|,|\.|!)/i
  );
  return match ? match[1].trim() : null;
}

// ── History normaliser ────────────────────────────────────────────────────────

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && m.role && m.message)
    .slice(-10)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.message
    }));
}

// ── Message builder ───────────────────────────────────────────────────────────

function buildMessages(prompt, history = [], mode = "general", weatherData = null) {
  // Prepend live weather data to the user prompt when in weather mode
  const userContent =
    mode === "weather" && weatherData
      ? `${weatherData}\n\nUser question: ${prompt}`
      : prompt;

  return [
    { role: "system", content: getSystemPrompt(mode) },
    ...normalizeHistory(history),
    { role: "user", content: userContent }
  ];
}

// ── Demo / fallback ───────────────────────────────────────────────────────────

function buildDemoResponse(prompt, model, mode) {
  const modeText = mode === "general" ? "general" : `${mode}-focused`;
  return (
    `[Demo] ${model.label} (${modeText} mode): ` +
    `This is a placeholder response for "${prompt}". ` +
    `Configure the relevant API key in your .env file to enable real responses.`
  );
}

// ── Provider calls ────────────────────────────────────────────────────────────

async function callOllama(prompt, model, mode, history, weatherData) {
  const messages = buildMessages(prompt, history, mode, weatherData);

  let response;
  try {
    response = await fetch(`${DEFAULT_OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.modelName, messages, stream: false }),
      // 5-second connection timeout so we fail fast if Ollama is not running
      signal: AbortSignal.timeout(5000)
    });
  } catch (err) {
    // Ollama not reachable
    throw new Error(
      "Local model unavailable. Please make sure Ollama is running " +
      "(run: ollama serve) and the model is installed (run: ollama pull " +
      model.modelName + ")."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Local model unavailable. Ollama returned status ${response.status}. ` +
      `Make sure the model "${model.modelName}" is installed (run: ollama pull ${model.modelName}).`
    );
  }

  const data = await response.json();
  return data.message?.content || buildDemoResponse(prompt, model, mode);
}

async function callOpenAI(prompt, model, mode, history, weatherData) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-api-key-here") {
    return buildDemoResponse(prompt, model, mode);
  }

  const messages = buildMessages(prompt, history, mode, weatherData);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model.modelName,
      messages,
      max_tokens: 1024,
      temperature: mode === "math" ? 0.2 : 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error: ${err.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || buildDemoResponse(prompt, model, mode);
}

async function callGemini(prompt, model, mode, history, weatherData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return buildDemoResponse(prompt, model, mode);
  }

  const userContent =
    mode === "weather" && weatherData
      ? `${weatherData}\n\nUser question: ${prompt}`
      : prompt;

  // Build contents from history + current message
  // Note: Gemini v1beta only supports "user" and "model" roles
  const contents = [
    ...normalizeHistory(history).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    { role: "user", parts: [{ text: userContent }] }
  ];

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${model.modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // system_instruction is a separate top-level field in Gemini API
      system_instruction: {
        parts: [{ text: getSystemPrompt(mode) }]
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: mode === "math" ? 0.2 : 0.7
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini error: ${err.error?.message || response.status}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    buildDemoResponse(prompt, model, mode)
  );
}

async function callClaude(prompt, model, mode, history, weatherData) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey || apiKey === "your-claude-api-key-here") {
    return buildDemoResponse(prompt, model, mode);
  }

  const userContent =
    mode === "weather" && weatherData
      ? `${weatherData}\n\nUser question: ${prompt}`
      : prompt;

  const messages = [
    ...normalizeHistory(history),
    { role: "user", content: userContent }
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model.modelName,
      system: getSystemPrompt(mode),
      messages,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Claude error: ${err.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || buildDemoResponse(prompt, model, mode);
}

// ── Main entry point ──────────────────────────────────────────────────────────

async function generateResponse({ prompt, modelId = "ollama-llama3", mode = "general", history = [] }) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required");
  }

  const model = findModel(modelId);

  // For weather mode, try to fetch live data before calling the LLM
  let weatherData = null;
  if (mode === "weather") {
    const location = extractLocation(prompt);
    if (location) {
      weatherData = await fetchWeather(location).catch(() => null);
    }
  }

  try {
    let text;

    if (model.provider === "ollama") {
      // callOllama throws a user-friendly error if unreachable — let it propagate
      text = await callOllama(prompt, model, mode, history, weatherData);
    } else if (model.provider === "openai") {
      text = await callOpenAI(prompt, model, mode, history, weatherData);
    } else if (model.provider === "gemini") {
      text = await callGemini(prompt, model, mode, history, weatherData);
    } else if (model.provider === "anthropic") {
      text = await callClaude(prompt, model, mode, history, weatherData);
    } else {
      text = buildDemoResponse(prompt, model, mode);
    }

    return { model: model.label, modelId: model.id, mode, response: text, fallback: false };

  } catch (err) {
    // For local models re-throw so the user sees the real error in chat
    if (model.provider === "ollama") {
      throw err;
    }
    // For public models fall back to demo + log the real error
    console.error(`[llmService] ${model.label} error:`, err.message);
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
  buildDemoResponse,
  fetchWeather,
  extractLocation
};
