// backend/src/models/llmModel.js
// Handles outbound HTTP requests to the vLLM inference server.
// Each model is identified by a name string that matches the model ID
// served by vLLM (e.g. "meta-llama/Llama-3-8b-instruct").
// Swap VLLM_BASE_URL and the entries in AVAILABLE_MODELS to match your deployment.

const VLLM_BASE_URL = process.env.VLLM_BASE_URL || "http://localhost:8000";

// Models exposed to the frontend. Add or remove entries here when your
// vLLM server changes. The `id` must match the model name vLLM was started with.
const AVAILABLE_MODELS = [
  { id: "model-a-placeholder", label: "Model A" },
  { id: "model-b-placeholder", label: "Model B" },
  { id: "model-c-placeholder", label: "Model C" },
];

/**
 * Returns the list of available models (no network call needed).
 * @returns {Array<{id: string, label: string}>}
 */
function getAvailableModels() {
  return AVAILABLE_MODELS;
}

/**
 * Sends a chat completion request to the vLLM OpenAI-compatible endpoint
 * for a single model.
 *
 * @param {string} modelId - The model identifier string.
 * @param {Array<{role: string, content: string}>} messages - Conversation history.
 * @returns {Promise<string>} - The assistant reply text.
 */
async function queryModel(modelId, messages) {
  const url = `${VLLM_BASE_URL}/v1/chat/completions`;

  const body = {
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 512,
  };

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching vLLM for model ${modelId}: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "(no body)");
    throw new Error(`vLLM returned ${response.status} for model ${modelId}: ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`Unexpected vLLM response shape for model ${modelId}`);
  }
  return content.trim();
}

/**
 * Queries multiple models in parallel and returns an array of results.
 * Individual model failures are captured as error strings rather than
 * rejecting the whole call, so one broken model doesn't block the others.
 *
 * @param {string[]} modelIds - Array of model identifier strings.
 * @param {Array<{role: string, content: string}>} messages - Conversation history.
 * @returns {Promise<Array<{modelId: string, text: string|null, error: string|null}>>}
 */
async function queryModels(modelIds, messages) {
  const results = await Promise.allSettled(
    modelIds.map((modelId) => queryModel(modelId, messages))
  );

  return results.map((result, idx) => {
    if (result.status === "fulfilled") {
      return { modelId: modelIds[idx], text: result.value, error: null };
    } else {
      return { modelId: modelIds[idx], text: null, error: result.reason?.message || "Unknown error" };
    }
  });
}

module.exports = { getAvailableModels, queryModel, queryModels };
