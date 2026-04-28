// Load environment variables from .env at project root
require("dotenv").config({
  path: require("path").join(__dirname, "../../../.env")
});

const DEFAULT_OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";

// ── Model Catalog ────────────────────────────────────────────────────────────

const MODEL_CATALOG = [
  {
    id: "ollama-llama3",
    label: "Llama 3.2 1B (local)",
    provider: "ollama",
    modelName: process.env.OLLAMA_LLAMA_MODEL || "llama3.2:1b",
    type: "local"
  },
  {
    id: "groq",
    label: "GPT (public API)",
    provider: "groq",
    modelName: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    type: "public"
  },
  {
    id: "gemini",
    label: "Gemini (public API)",
    provider: "gemini",
    modelName: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    type: "public"
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── System Prompts ───────────────────────────────────────────────────────────

function getSystemPrompt(mode = "general") {
  if (mode === "math") {
    return (
      "You are a math-focused assistant. Always show reasoning step-by-step. " +
      "Use clear notation and verify answers when possible."
    );
  }

  if (mode === "weather") {
    return (
      "You are a weather assistant. You will receive real-time weather data " +
      "inside the prompt. Summarize clearly including temperature, feels-like, " +
      "humidity, wind, and conditions."
    );
  }

  return "You are a helpful assistant for an LLM web interface.";
}

// ── Weather Helper ───────────────────────────────────────────────────────────

async function fetchWeather(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  if (!apiKey || apiKey.startsWith("your-")) {
    console.warn("[weather] No valid API key configured.");
    return null;
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=` +
    `${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[weather] API error:", res.status, err?.message);
      return null;
    }

    const d = await res.json();

    return (
      `[Live weather for ${d.name}, ${d.sys.country}]\n` +
      `Condition: ${d.weather[0].description}\n` +
      `Temperature: ${d.main.temp}°C (feels like ${d.main.feels_like}°C)\n` +
      `Humidity: ${d.main.humidity}%\n` +
      `Wind: ${d.wind.speed} m/s`
    );
  } catch (err) {
    console.error("[weather] Fetch failed:", err.message);
    return null;
  }
}

function extractLocation(prompt) {
  // Primary: "weather in/for/at <location>"
  const match = prompt.match(
    /weather\s+(?:in|for|at)\s+([A-Za-z\s,]+?)(?:\?|$|\.|!)/i
  );
  if (match) return match[1].trim();

  // Fallback: "in <Title Case location>"
  const fallback = prompt.match(
    /\bin\s+([A-Z][A-Za-z\s,]+?)(?:\?|$|\.|!)/
  );
  return fallback ? fallback[1].trim() : null;
}

// ── History ──────────────────────────────────────────────────────────────────

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

// ── Message Builder ──────────────────────────────────────────────────────────

function buildMessages(
  prompt,
  history = [],
  mode = "general",
  weatherData = null
) {
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

// ── Demo Fallback ────────────────────────────────────────────────────────────

function buildDemoResponse(prompt, model, mode) {
  return (
    `[Demo] ${model.label} (${mode} mode): ` +
    `This is a placeholder response for "${prompt}". ` +
    `Add your API key in .env to enable real responses.`
  );
}

// ── Ollama ───────────────────────────────────────────────────────────────────

async function callOllama(prompt, model, mode, history, weatherData) {
  const messages = buildMessages(
    prompt,
    history,
    mode,
    weatherData
  );

  const response = await fetch(
    `${DEFAULT_OLLAMA_URL}/api/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model.modelName,
        messages,
        stream: false
      }),
      signal: AbortSignal.timeout(120000)
    }
  );

  if (!response.ok) {
    throw new Error("Ollama unavailable.");
  }

  const data = await response.json();

  return (
    data.message?.content ||
    buildDemoResponse(prompt, model, mode)
  );
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(prompt, model, mode, history, weatherData) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "your-groq-api-key-here") {
    return buildDemoResponse(prompt, model, mode);
  }

  const messages = buildMessages(
    prompt,
    history,
    mode,
    weatherData
  );

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
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
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Groq error: ${err.error?.message || response.status}`
    );
  }

  const data = await response.json();

  return (
    data.choices?.[0]?.message?.content ||
    buildDemoResponse(prompt, model, mode)
  );
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(prompt, model, mode, history, weatherData) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return buildDemoResponse(prompt, model, mode);
  }

  const userContent =
    mode === "weather" && weatherData
      ? `${weatherData}\n\nUser question: ${prompt}`
      : prompt;

  const contents = [
    ...normalizeHistory(history).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    {
      role: "user",
      parts: [{ text: userContent }]
    }
  ];

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${model.modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
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
    throw new Error("Gemini error.");
  }

  const data = await response.json();

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    buildDemoResponse(prompt, model, mode)
  );
}

// ── Main Generator ───────────────────────────────────────────────────────────

async function generateResponse({
  prompt,
  modelId = "groq",
  mode = "general",
  history = []
}) {
  if (!prompt?.trim()) {
    throw new Error("Prompt is required.");
  }

  const model = findModel(modelId);

  // Auto-detect weather intent even if mode wasn't explicitly set to "weather"
  const isWeatherQuery = /weather/i.test(prompt);
  const effectiveMode = isWeatherQuery ? "weather" : mode;

  let weatherData = null;

  if (effectiveMode === "weather") {
    const location = extractLocation(prompt);
    console.log("[weather] Extracted location:", location);

    if (location) {
      weatherData = await fetchWeather(location);
      console.log("[weather] Data fetched:", weatherData ? "success" : "null");
    } else {
      console.warn("[weather] Could not extract location from prompt:", prompt);
    }
  }

  try {
    let text;

    if (model.provider === "ollama") {
      text = await callOllama(prompt, model, effectiveMode, history, weatherData);
    } else if (model.provider === "groq") {
      text = await callGroq(prompt, model, effectiveMode, history, weatherData);
    } else if (model.provider === "gemini") {
      text = await callGemini(prompt, model, effectiveMode, history, weatherData);
    } else {
      text = buildDemoResponse(prompt, model, effectiveMode);
    }

    return {
      model: model.label,
      modelId: model.id,
      mode: effectiveMode,
      response: text,
      fallback: false
    };
  } catch (err) {
    console.error(err.message);

    return {
      model: model.label,
      modelId: model.id,
      mode: effectiveMode,
      response: buildDemoResponse(prompt, model, effectiveMode),
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
