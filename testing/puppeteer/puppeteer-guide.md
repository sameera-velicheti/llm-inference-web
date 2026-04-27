[puppeteer-guide.md](https://github.com/user-attachments/files/27107940/puppeteer-guide.md)
# Puppeteer Testing Guide

## Setup

**Terminal 1 — start the server:**
```bash
rmdir /s llm-inference-web
git clone -b ethan-individual-iteration --single-branch https://github.com/sameera-velicheti/llm-inference-web.git

cd llm-inference-web
npm install
node backend/server.js
# should say "Server running on http://localhost:3000"
```

**Terminal 2 — run tests:**
```bash
cd llm-inference-web
npm install
```

---

## Full Test Order (fresh database)

Run these in order from Terminal 2. Starting from a brand new server with no registered accounts:

```bash
# 1. Create the test account — must run first on a fresh DB
node testing/puppeteer/register.js
# Expected: "Register Test Passed: navigated to chat-user.html"

# 2. Log in with the new account
node testing/puppeteer/login.js
# Expected: "Login Test Passed: navigated to chat-user.html"

# 3. Log out
node testing/puppeteer/logout.js
# Expected: logout confirmed

# 4. Trigger a password reset token
node testing/puppeteer/forgot-password.js
# Expected: reset token shown on screen

# 5. Use the token to reset the password
node testing/puppeteer/reset-password.js
# Expected: password reset confirmed

# 6. Try logging in with the OLD password — this will fail (expected)
node testing/puppeteer/login.js
# Expected: "Login Test Failed" — password was changed in step 5

# 7. Try registering again — this will fail (expected)
node testing/puppeteer/register.js
# Expected: timeout — account already exists

# 8. Verify chat history loads for the logged-in user
node testing/puppeteer/chat-history.js
# Expected: "Chat History Test Passed: chats loaded"
# Note: uses testuser@example.com / password123
# If you ran reset-password.js, update the password in chat-history.js to match

# 9. Test multi-model chat (Iteration 3)
node testing/puppeteer/multi-model-chat.js
# Expected: all 8 steps pass
# Requires: testuser@example.com / password123 account to exist
# Tests performed:
#   Step 1 — logs in successfully
#   Step 2 — model selector bar loads with available models
#   Step 3 — all models are checked by default
#   Step 4 — sending a message produces model response cards
#   Step 5 — response cards appear grouped together in one turn
#   Step 6 — deselecting a model excludes it from the next response
#   Step 7 — reloading the page preserves model names in chat history
#   Step 8 — searching finds the chat by message content
```

---

## Notes

- Tests are **not isolated** — they share the same database and session state.
  Run them in the order above for predictable results.
- `register.js` will fail with a timeout if the account already exists. That is expected behavior.
- `login.js` uses `password123`. After running `reset-password.js`, login.js will fail because the password has changed. That is also expected.
- `multi-model-chat.js` depends on the account from `register.js` existing and the password still being `password123`. Run it **before** `reset-password.js`, or update the credentials in the script to match the new password.
- Steps 4–8 in `multi-model-chat.js` depend on the vLLM server being reachable. If it is not connected yet (placeholder responses only), Steps 4–5 will still pass as long as the backend returns a valid response — the cards will just show the placeholder text.
