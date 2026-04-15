# Puppeteer Testing Guide

## Prerequisites
Make sure the server is running and Ollama is running with the 3 models:
```bash
ollama serve
ollama pull llama3.2
ollama pull mistral
ollama pull gemma3
node backend/server.js
```

## Recommended run order (fresh database)
```bash
node testing/puppeteer/register.js
node testing/puppeteer/login.js
node testing/puppeteer/multi-model.js    # NEW: tests 3-card grid, expand, pin, unpin
node testing/puppeteer/logout.js
node testing/puppeteer/forgot-password.js
node testing/puppeteer/reset-password.js
node testing/puppeteer/chat-history.js
node testing/puppeteer/chat-search.js
```

## multi-model.js covers
- 3 model cards appear after sending a prompt
- Live token streaming visible in each card
- Expand / collapse a single card to full width
- "Use only" pins the chat to one model (pinned banner appears)
- Subsequent messages in pinned mode show only 1 card
- Unpin restores all-model mode
