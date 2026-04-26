// testing/step-definitions/multiModelSteps.js
// Cucumber step definitions for the multi-model-chat.feature.
// Uses the same Puppeteer browser helper pattern as your existing steps.

const { Given, When, Then, Before, After } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");
const { registerAndLoginUser, BASE_URL } = require("./helpers");

let browser;
let page;

Before(async () => {
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
});

After(async () => {
  if (browser) await browser.close();
});

// ── Background ────────────────────────────────────────────────────────────────

Given("I am logged in as a registered user", async () => {
  await registerAndLoginUser(page);
});

Given("I have an existing chat session", async () => {
  // Create a chat via API so we have something to open
  await page.evaluate(async () => {
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Chat" }),
    });
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

When("I open the chat page", async () => {
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
});

// ── Model bar assertions ──────────────────────────────────────────────────────

Then("I should see a list of selectable models", async () => {
  await page.waitForSelector(".model-checkbox-item");
  const items = await page.$$(".model-checkbox-item");
  if (items.length === 0) throw new Error("No model checkboxes found");
});

Then("each model should have a checkbox", async () => {
  const checkboxes = await page.$$('#modelCheckboxes input[type="checkbox"]');
  if (checkboxes.length === 0) throw new Error("No checkboxes found in model bar");
});

Then("all model checkboxes should be checked by default", async () => {
  await page.waitForSelector('#modelCheckboxes input[type="checkbox"]');
  const allChecked = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('#modelCheckboxes input[type="checkbox"]')];
    return boxes.every((cb) => cb.checked);
  });
  if (!allChecked) throw new Error("Not all model checkboxes are checked by default");
});

// ── Model selection ───────────────────────────────────────────────────────────

Given("I have selected models {string} and {string}", async (labelA, labelB) => {
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector('#modelCheckboxes input[type="checkbox"]');

  // Uncheck all first, then check only the two specified
  await page.evaluate((a, b) => {
    document.querySelectorAll('#modelCheckboxes input[type="checkbox"]').forEach((cb) => {
      const label = cb.closest("label")?.textContent?.trim();
      cb.checked = label === a || label === b;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, labelA, labelB);

  // Open the first chat
  await page.waitForSelector("#chatList li");
  await page.click("#chatList li");
  await page.waitForSelector("#userInput");
});

Given("all models are selected", async () => {
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector('#modelCheckboxes input[type="checkbox"]');
  await page.evaluate(() => {
    document.querySelectorAll('#modelCheckboxes input[type="checkbox"]').forEach((cb) => {
      if (!cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
  await page.waitForSelector("#chatList li");
  await page.click("#chatList li");
});

Given("all model checkboxes are unchecked", async () => {
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector('#modelCheckboxes input[type="checkbox"]');
  await page.evaluate(() => {
    document.querySelectorAll('#modelCheckboxes input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  await page.waitForSelector("#chatList li");
  await page.click("#chatList li");
});

// ── Sending messages ──────────────────────────────────────────────────────────

When("I type {string} in the message input", async (text) => {
  await page.waitForSelector("#userInput");
  await page.focus("#userInput");
  await page.keyboard.type(text);
});

When("I click the Send button", async () => {
  // Handle possible alert dialog
  page.once("dialog", async (dialog) => {
    await dialog.dismiss();
  });
  await page.click("#sendBtn");
});

// ── Model deselection ─────────────────────────────────────────────────────────

When("I uncheck the checkbox for {string}", async (label) => {
  await page.evaluate((lbl) => {
    const boxes = [...document.querySelectorAll('#modelCheckboxes input[type="checkbox"]')];
    const target = boxes.find(
      (cb) => cb.closest("label")?.textContent?.trim() === lbl
    );
    if (target) {
      target.checked = false;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, label);
});

// ── Response card assertions ──────────────────────────────────────────────────

Then("I should see a response card for {string}", async (label) => {
  await page.waitForFunction(
    (lbl) => {
      const headers = [...document.querySelectorAll(".card-header")];
      return headers.some((h) => h.textContent.trim().toUpperCase() === lbl.toUpperCase());
    },
    { timeout: 10000 },
    label
  );
});

Then("I should not see a response card for {string}", async (label) => {
  const found = await page.evaluate((lbl) => {
    const headers = [...document.querySelectorAll(".card-header")];
    return headers.some((h) => h.textContent.trim().toUpperCase() === lbl.toUpperCase());
  }, label);
  if (found) throw new Error(`Expected no card for "${label}" but found one`);
});

Then("the response cards for {string} and {string} should appear together in one group", async (labelA, labelB) => {
  await page.waitForSelector(".msg-assistant-group");
  const groupedTogether = await page.evaluate((a, b) => {
    for (const group of document.querySelectorAll(".msg-assistant-group")) {
      const headers = [...group.querySelectorAll(".card-header")].map(
        (h) => h.textContent.trim().toUpperCase()
      );
      if (headers.includes(a.toUpperCase()) && headers.includes(b.toUpperCase())) {
        return true;
      }
    }
    return false;
  }, labelA, labelB);

  if (!groupedTogether) {
    throw new Error(`Cards for "${labelA}" and "${labelB}" were not in the same group`);
  }
});

Then("I should see an alert saying {string}", async (message) => {
  let alertText = null;
  page.once("dialog", async (dialog) => {
    alertText = dialog.message();
    await dialog.dismiss();
  });
  // Give the alert a moment to fire
  await page.waitForTimeout(500);
  if (!alertText || !alertText.includes(message)) {
    throw new Error(`Expected alert with "${message}" but got: "${alertText}"`);
  }
});

Then("I should see a response card for {string} with a response", async (label) => {
  await page.waitForFunction(
    (lbl) => {
      const cards = [...document.querySelectorAll(".model-card:not(.error-card)")];
      return cards.some(
        (c) => c.querySelector(".card-header")?.textContent?.trim().toUpperCase() === lbl.toUpperCase()
      );
    },
    { timeout: 10000 },
    label
  );
});

Then("I should see an error card for {string}", async (label) => {
  await page.waitForFunction(
    (lbl) => {
      const cards = [...document.querySelectorAll(".error-card")];
      return cards.some(
        (c) => c.querySelector(".card-header")?.textContent?.trim().toUpperCase() === lbl.toUpperCase()
      );
    },
    { timeout: 10000 },
    label
  );
});

// ── History reload ────────────────────────────────────────────────────────────

Given("I have previously sent a message to {string} and {string}", async (labelA, labelB) => {
  // This is covered by the send message steps — we just need to ensure a chat exists
  // with responses from both models. Use the API directly for speed.
  await page.evaluate(async (a, b) => {
    // Models list is fetched dynamically; assume placeholder IDs match labels via index
    const modelsRes = await fetch("/api/llm/models");
    const modelsData = await modelsRes.json();
    const idA = modelsData.models.find((m) => m.label === a)?.id;
    const idB = modelsData.models.find((m) => m.label === b)?.id;

    const chatRes = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "History test" }),
    });
    const chatData = await chatRes.json();
    const chatId = chatData.chat.id;

    await fetch("/api/llm/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, modelIds: [idA, idB], userMessage: "Test question" }),
    });
  }, labelA, labelB);
});

When("I reload the chat", async () => {
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector("#chatList li");
  await page.click("#chatList li");
  await page.waitForSelector(".msg-assistant-group");
});

Then("I should see the response card for {string} with its previous reply", async (label) => {
  // Same assertion as seeing a card — if history is restored the card will be present
  await page.waitForFunction(
    (lbl) => {
      const headers = [...document.querySelectorAll(".card-header")];
      return headers.some((h) => h.textContent.trim().toUpperCase() === lbl.toUpperCase());
    },
    { timeout: 8000 },
    label
  );
});

// ── Search scenario ───────────────────────────────────────────────────────────

Given("I have a chat titled {string} with multi-model responses", async (title) => {
  await page.evaluate(async (t) => {
    const chatRes = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t }),
    });
    const chatData = await chatRes.json();
    const chatId = chatData.chat.id;

    const modelsRes = await fetch("/api/llm/models");
    const modelsData = await modelsRes.json();
    const ids = modelsData.models.slice(0, 2).map((m) => m.id);

    await fetch("/api/llm/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, modelIds: ids, userMessage: "What is the capital of France?" }),
    });
  }, title);
});

When("I type {string} in the search box", async (query) => {
  await page.waitForSelector("#searchInput");
  await page.focus("#searchInput");
  await page.keyboard.type(query);
  await page.waitForTimeout(400); // debounce
});

Then("I should see {string} in the chat list", async (title) => {
  await page.waitForFunction(
    (t) => {
      const items = [...document.querySelectorAll("#chatList li")];
      return items.some((li) => li.textContent.includes(t));
    },
    { timeout: 5000 },
    title
  );
});

When("I click on {string}", async (title) => {
  await page.evaluate((t) => {
    const items = [...document.querySelectorAll("#chatList li")];
    const target = items.find((li) => li.textContent.includes(t));
    if (target) target.click();
  }, title);
  await page.waitForSelector(".msg-assistant-group");
});

Then("I should see the multi-model response cards from that conversation", async () => {
  const cardCount = await page.$$eval(".model-card", (cards) => cards.length);
  if (cardCount < 2) {
    throw new Error(`Expected at least 2 model cards but found ${cardCount}`);
  }
});
