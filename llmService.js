const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";

const MODELS = ["llama3.2", "mistral", "gemma3"];

/**
 * Stream a response from one Ollama model.
 * Calls onToken(text) for each token chunk, then onDone(fullText) when finished.
 * Calls onError(err) if the request fails.
 */
async function streamFromModel(model, messages, onToken, onDone, onError) {
  // Convert chat history to Ollama format
  const ollamaMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.message || m.content || "",
  }));

  let fullText = "";

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama error for ${model}: ${res.status} ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Each line is a JSON object
      const lines = chunk.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const token = parsed?.message?.content || "";
          if (token) {
            fullText += token;
            onToken(token);
          }
          if (parsed.done) {
            onDone(fullText);
            return;
          }
        } catch {
          // partial JSON line, skip
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    onError(err);
  }
}

module.exports = { MODELS, streamFromModel };
