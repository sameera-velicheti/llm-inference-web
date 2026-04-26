// testing/puppeteer/multi-model-chat.js
// Automated browser test for the "query multiple LLMs simultaneously" feature.
// Run with:  node testing/puppeteer/multi-model-chat.js

const puppeteer = require("puppeteer");

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = `puppeteer_multimodel_${Date.now()}@test.com`;
const TEST_PASSWORD = "Puppeteer123!";
const TEST_USERNAME = `puppeteer_mm_${Date.now()}`;

// ── Utility ──────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`  ✓  ${msg}`); }
function fail(msg) { console.error(`  ✗  ${msg}`); process.exit(1); }

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Setup: register + login via API so tests start at chat page ──────────────

async function setupUser(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle0" });

  const reg = await page.evaluate(async (email, password, username) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });
    return res.json();
  }, TEST_EMAIL, TEST_PASSWORD, TEST_USERNAME);

  if (!reg.success) fail(`Registration failed: ${reg.error}`);

  const login = await page.evaluate(async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  }, TEST_EMAIL, TEST_PASSWORD);

  if (!login.success) fail(`Login failed: ${login.error}`);
  log("Registered and logged in");
}

async function createChat(page, title) {
  const data = await page.evaluate(async (t) => {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t }),
    });
    return res.json();
  }, title);

  if (!data.success) fail(`Failed to create chat: ${data.error}`);
  return data.chat.id;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testModelBarLoads(page) {
  console.log("\n▶ Test: model selector bar loads models");
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".model-checkbox-item", { timeout: 5000 });
  const count = await page.$$eval(".model-checkbox-item", (els) => els.length);
  if (count === 0) fail("No model checkboxes rendered");
  log(`Model bar loaded with ${count} model(s)`);
}

async function testDefaultAllChecked(page) {
  console.log("\n▶ Test: all models checked by default");
  await page.waitForSelector('#modelCheckboxes input[type="checkbox"]');
  const allChecked = await page.evaluate(() => {
    return [...document.querySelectorAll('#modelCheckboxes input[type="checkbox"]')]
      .every((cb) => cb.checked);
  });
  if (!allChecked) fail("Not all model checkboxes are checked by default");
  log("All model checkboxes checked by default");
}

async function testSendMessageShowsCards(page, chatId) {
  console.log("\n▶ Test: sending a message produces model response cards");

  // Open the chat
  await page.waitForSelector("#chatList li");
  const chatItems = await page.$$('#chatList li');
  // Click the one matching our chatId
  await page.evaluate((id) => {
    const items = [...document.querySelectorAll("#chatList li")];
    const target = items.find((li) => li.dataset.id == id);
    if (target) target.click();
  }, chatId);

  await page.waitForSelector("#userInput", { timeout: 5000 });

  // Type and send
  await page.focus("#userInput");
  await page.keyboard.type("What is 2 + 2?");
  await page.click("#sendBtn");

  // Wait for the loading state to resolve (cards appear)
  await page.waitForFunction(
    () => {
      const cards = document.querySelectorAll(".model-card");
      const loading = [...document.querySelectorAll(".card-body")].some(
        (b) => b.textContent.trim() === "Thinking…"
      );
      return cards.length > 0 && !loading;
    },
    { timeout: 30000 }
  );

  const cardCount = await page.$$eval(".model-card", (c) => c.length);
  log(`${cardCount} model card(s) rendered after sending message`);

  const headers = await page.$$eval(".card-header", (hs) => hs.map((h) => h.textContent.trim()));
  log(`Card headers: ${headers.join(", ")}`);
}

async function testCardsGroupedTogether(page) {
  console.log("\n▶ Test: response cards appear in the same assistant group");
  const groups = await page.$$(".msg-assistant-group");
  if (groups.length === 0) fail("No assistant group found");

  const lastGroupCardCount = await page.evaluate(() => {
    const groups = document.querySelectorAll(".msg-assistant-group");
    const last = groups[groups.length - 1];
    return last.querySelectorAll(".model-card").length;
  });

  log(`Last response group has ${lastGroupCardCount} card(s)`);
  // For a multi-model query all cards should be in the same group
}

async function testDeselectModelExcludesFromResponse(page, chatId) {
  console.log("\n▶ Test: deselecting a model excludes it from responses");
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".model-checkbox-item");

  // Get all model labels
  const labels = await page.$$eval(".model-checkbox-item", (els) =>
    els.map((e) => e.textContent.trim())
  );
  if (labels.length < 2) {
    log("Skipping deselect test — fewer than 2 models configured");
    return;
  }

  // Uncheck the last model
  const lastLabel = labels[labels.length - 1];
  await page.evaluate((lbl) => {
    const boxes = [...document.querySelectorAll('#modelCheckboxes input[type="checkbox"]')];
    const target = boxes.find((cb) => cb.closest("label")?.textContent?.trim() === lbl);
    if (target) {
      target.checked = false;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, lastLabel);

  // Open chat and send
  await page.evaluate((id) => {
    const items = [...document.querySelectorAll("#chatList li")];
    const target = items.find((li) => li.dataset.id == id);
    if (target) target.click();
  }, chatId);
  await page.waitForSelector("#userInput");
  await page.focus("#userInput");
  await page.keyboard.type("Deselect test message");
  await page.click("#sendBtn");

  await page.waitForFunction(
    () => !([...document.querySelectorAll(".card-body")].some((b) => b.textContent === "Thinking…")),
    { timeout: 30000 }
  );

  const deselectedPresent = await page.evaluate((lbl) => {
    return [...document.querySelectorAll(".card-header")].some(
      (h) => h.textContent.trim().toUpperCase() === lbl.toUpperCase()
    );
  }, lastLabel);

  if (deselectedPresent) fail(`Deselected model "${lastLabel}" still appeared in response`);
  log(`Deselected model "${lastLabel}" correctly excluded from response`);
}

async function testHistoryPreservesModelNames(page, chatId) {
  console.log("\n▶ Test: chat history preserves model names on reload");
  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector("#chatList li");

  await page.evaluate((id) => {
    const items = [...document.querySelectorAll("#chatList li")];
    const target = items.find((li) => li.dataset.id == id);
    if (target) target.click();
  }, chatId);

  await page.waitForSelector(".model-card", { timeout: 8000 });

  const headersBefore = await page.$$eval(".card-header", (hs) => hs.map((h) => h.textContent.trim()));
  log(`Headers before reload: ${headersBefore.join(", ")}`);

  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector("#chatList li");
  await page.evaluate((id) => {
    const items = [...document.querySelectorAll("#chatList li")];
    const target = items.find((li) => li.dataset.id == id);
    if (target) target.click();
  }, chatId);

  await page.waitForSelector(".model-card", { timeout: 8000 });
  const headersAfter = await page.$$eval(".card-header", (hs) => hs.map((h) => h.textContent.trim()));
  log(`Headers after reload: ${headersAfter.join(", ")}`);

  const same = headersBefore.every((h) => headersAfter.includes(h));
  if (!same) fail("Model card headers changed after reload — history not preserving model names");
  log("Model names correctly persisted in chat history");
}

async function testSearchShowsMultiModelChat(page) {
  console.log("\n▶ Test: search finds a chat containing multi-model responses");

  // Create a distinctly titled chat via API
  const title = `MultiModel_${Date.now()}`;
  const chatId = await createChat(page, title);

  await page.evaluate(async (id) => {
    const modelsRes = await fetch("/api/llm/models");
    const { models } = await modelsRes.json();
    const ids = models.slice(0, 2).map((m) => m.id);
    await fetch("/api/llm/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: id, modelIds: ids, userMessage: "unique search test message" }),
    });
  }, chatId);

  await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector("#searchInput");
  await page.focus("#searchInput");
  await page.keyboard.type("MultiModel_");
  await sleep(500); // debounce

  const found = await page.waitForFunction(
    (t) => [...document.querySelectorAll("#chatList li")].some((li) => li.textContent.includes(t)),
    { timeout: 5000 },
    title
  );
  log(`Search returned chat "${title}"`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log("=== Puppeteer: Multi-Model Chat Tests ===\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    await setupUser(page);
    const chatId = await createChat(page, "Puppeteer Test Chat");
    log(`Created test chat (id=${chatId})`);

    await page.goto(`${BASE_URL}/chat-user.html`, { waitUntil: "networkidle0" });

    await testModelBarLoads(page);
    await testDefaultAllChecked(page);
    await testSendMessageShowsCards(page, chatId);
    await testCardsGroupedTogether(page);
    await testDeselectModelExcludesFromResponse(page, chatId);
    await testHistoryPreservesModelNames(page, chatId);
    await testSearchShowsMultiModelChat(page);

    console.log("\n=== All tests passed ✓ ===\n");
  } catch (err) {
    console.error("\n=== Test run failed ===");
    console.error(err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
